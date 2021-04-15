/**
 * ** Сначала надо понять, какие группы заданий вообще есть
 * ** Также надо, чтобы где-то были заданы такие вероятности
 * 1.	Случайно выберем некоторую группу заданий Ai с вероятностью Pi / P
 * 2.	Случайно выберем в группе задание aj, для которого F(aj) = 0 (пользователь не размечал это задание)
 * 3.	Если такое задание нашлось, то назначаем его
 * 4.	Если нет, тогда полагаем Pi := 0 и повторяем алгоритм с шага 1
 * 5.	Если были просмотрены все группы заданий, тогда для пользователя отсутствуют доступные задания
 */

import { getManager } from "typeorm";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { User } from "../entity/User";

/**
 * Возможные группы заданий:
 * - Изображений, размеченные недостаточное количество раз
 * - Изображения, которые еще ни разу не были размечены
 * 
 * Нас не интересуют задания:
 * - Размеченные заданное количество раз
 * - Размеченные текущим пользователем
 * 
 * Пока будем считать, что для групп вероятности заданы фиксированно
 */

export enum TaskGroup {
    PARTIALLY_DONE = "partially-done",
    UNTOUCHED = "untouched"
};

type TaskFetcher = (markup: Markup, user: User) => Promise<string | null>;

type TaskRandomFetcher = {
    fetchTask: () => Promise<string | null>,
    probability: number
};

/**
 * Для заданного набора вероятностей p = [p_0, ... p_n]
 * Возвращает единственное число i с вероятностью p_i
 */
function playRandomIndex(p: number[]): number {
    const value = Math.random();
    let sum = 0;
    for (let i = 0; i < p.length - 1; ++i) {
        if (sum <= value && value <= sum + p[i]) {
            return i;
        }

        sum += p[i];
    }
    return p.length - 1;
}

const taskFetchers: { [task in TaskGroup]: TaskFetcher } = {
    [TaskGroup.PARTIALLY_DONE]: fetchPartiallyDoneTask,
    [TaskGroup.UNTOUCHED]: fetchUntouchedTask
};

 // Task - по-сути, dataset item
export async function fetchRandomTask(taskRandomFetchers: TaskRandomFetcher[]): Promise<string | null> {
    while (taskRandomFetchers.some((g) => g.probability > 0)) {
        const probabilities = taskRandomFetchers.map((g) => g.probability);
        const idx = playRandomIndex(probabilities);
        const fetcher = taskRandomFetchers[idx];

        const taskId = await fetcher.fetchTask();
        if (taskId !== null) {
            return taskId;
        }

        fetcher.probability = 0;
    }

    return null;
}

/**
 * Функция возвращает ID datasetItem-a, который:
 * - Еще никем не был размечен
 */
async function fetchUntouchedTask(markup: Markup, user: User): Promise<string | null> {
    const manager = getManager();

    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        .addSelect("COUNT(*)", "markupCount")
        .from(DatasetItem, "di")
        .leftJoinAndSelect("di.markupItems", "mi")
        .leftJoinAndSelect("mi.experts", "e")
        .where("mi.markupId = :markupId")
        .groupBy("di.id")
        .having("markupCount = 0")
        .orderBy("RANDOM()")
        .setParameter("datasetId", markup.dataset.id)
        .setParameter("markupId", markup.id);

    const datasetItem = await datasetItemSubQb.getOne();

    if (!datasetItem) {
        return null;
    }

    return datasetItem.id;
}

async function fetchPartiallyDoneTask(markup: Markup, user: User): Promise<string | null> {
    const manager = getManager();

    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        .addSelect("BOOL_AND(e.id != :expertId)", "notMarkedUp")
        .addSelect("SUM(*)", "markupCount")
        // выбираем такие DatasetItem
        .from(DatasetItem, "di")
        // делаем соединение с разметкой
        .leftJoinAndSelect('di.markupItems', 'mi')
        // также добавляем пользователя, который разметил изображение
        .leftJoinAndSelect("mi.expert", "e")
        // для заданной разметки
        .where("mi.markupId = :markupId")
        // группируем по DatasetItem
        .groupBy("di.id")
        // выбираем не размеченные текущим пользователем
        .having("notMarkedUp")
        // которые были размечены кем-то
        .andHaving("markupCount > 0")
        // но недостаточное количество раз
        .andHaving("markupCount < :markupLimit")
        .orderBy("RANDOM()")
        .setParameter("datasetId", markup.dataset.id)
        .setParameter("markupId", markup.id)
        .setParameter("makrupLimit", markup.minExpertsPerTask)
        .setParameter("expertId", user.id);

    const datasetItem = await datasetItemSubQb.getOne();

    if (!datasetItem) {
        return null;
    }

    return datasetItem.id;
}

export default async function assignTask(
    markup: Markup,
    user: User,
    probabilities: { [task in TaskGroup]: number }
): Promise<string | null> {
    const taskRandomFetchers = Object.values(TaskGroup).map((g) => ({
        fetchTask: () => taskFetchers[g](markup, user),
        probability: probabilities[g]
    }));

    const datasetItemId = await fetchRandomTask(taskRandomFetchers);

    return datasetItemId;
}
