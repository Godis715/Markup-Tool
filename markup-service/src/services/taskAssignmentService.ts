import { getManager } from "typeorm";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { User } from "../entity/User";

/**
 * ** Сначала надо понять, какие группы заданий вообще есть
 * ** Также надо, чтобы где-то были заданы такие вероятности
 * 1.	Случайно выберем некоторую группу заданий Ai с вероятностью Pi / P
 * 2.	Случайно выберем в группе задание aj, для которого F(aj) = 0 (пользователь не размечал это задание)
 * 3.	Если такое задание нашлось, то назначаем его
 * 4.	Если нет, тогда полагаем Pi := 0 и повторяем алгоритм с шага 1
 * 5.	Если были просмотрены все группы заданий, тогда для пользователя отсутствуют доступные задания
 */

export enum TaskGroup {
    PARTIALLY_DONE = "partially-done",
    UNTOUCHED = "untouched"
};

type TaskFetcher = (markup: Markup, user: User) => Promise<DatasetItem | null>;

type TaskRandomFetcher = {
    fetchTask: () => Promise<DatasetItem | null>,
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
export async function fetchRandomTask(taskRandomFetchers: TaskRandomFetcher[]): Promise<DatasetItem | null> {
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
async function fetchUntouchedTask(markup: Markup): Promise<DatasetItem | null> {
    const manager = getManager();

    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        .from(DatasetItem, "di")
        .leftJoin("di.markupItems", "mi")
        .leftJoin("mi.expert", "e")
        .leftJoin("di.dataset", "d")
        .leftJoin("d.markups", "m")
        .where("m.id = :markupId")
        .groupBy("di.id")
        .having("COUNT(e.id) = 0")
        .orderBy("RANDOM()")
        .setParameter("markupId", markup.id);

    const datasetItem = await datasetItemSubQb.getOne();
    console.log(datasetItem);

    if (!datasetItem) {
        return null;
    }

    return datasetItem;
}

async function fetchPartiallyDoneTask(markup: Markup, user: User): Promise<DatasetItem | null> {
    const manager = getManager();

    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        // выбираем такие DatasetItem
        .from(DatasetItem, "di")
        // делаем соединение с разметкой
        .leftJoin('di.markupItems', 'mi')
        // также добавляем пользователя, который разметил изображение
        .leftJoin("mi.expert", "e")
        .leftJoin("di.dataset", "d")
        .leftJoin("d.markups", "m")
        // для заданной разметки
        .where("m.id = :markupId")
        // группируем по DatasetItem
        .groupBy("di.id")
        // выбираем не размеченные текущим пользователем
        .having("BOOL_AND(e.id != :expertId)")
        // которые были размечены кем-то
        .andHaving("COUNT(*) > 0")
        // но недостаточное количество раз
        .andHaving("COUNT(*) < :markupLimit")
        .orderBy("RANDOM()")
        .setParameter("datasetId", markup.dataset.id)
        .setParameter("markupId", markup.id)
        .setParameter("markupLimit", markup.minExpertsPerTask)
        .setParameter("expertId", user.id);

    const datasetItem = await datasetItemSubQb.getOne();

    if (!datasetItem) {
        return null;
    }

    return datasetItem;
}

export default async function assignMarkupTask(
    markup: Markup,
    user: User,
    probabilities: { [task in TaskGroup]: number }
): Promise<DatasetItem | null> {
    const taskRandomFetchers = Object.values(TaskGroup).map((g) => ({
        fetchTask: () => taskFetchers[g](markup, user),
        probability: probabilities[g]
    }));

    const datasetItemId = await fetchRandomTask(taskRandomFetchers);

    return datasetItemId;
}
