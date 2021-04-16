import { Appointment } from "../../entity/Appointment";
import { Markup } from "../../entity/Markup";
import { User } from "../../entity/User";
import { markupTaskFetchers, MarkupTaskGroup } from "./markupTaskGroups";
import { TaskRandomFetcher } from "./types";

/**
 * ** Сначала надо понять, какие группы заданий вообще есть
 * ** Также надо, чтобы где-то были заданы такие вероятности
 * 1.	Случайно выберем некоторую группу заданий Ai с вероятностью Pi / P
 * 2.	Случайно выберем в группе задание aj, для которого F(aj) = 0 (пользователь не размечал это задание)
 * 3.	Если такое задание нашлось, то назначаем его
 * 4.	Если нет, тогда полагаем Pi := 0 и повторяем алгоритм с шага 1
 * 5.	Если были просмотрены все группы заданий, тогда для пользователя отсутствуют доступные задания
 */

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

 // Task - по-сути, dataset item
export async function fetchRandomTask(taskRandomFetchers: TaskRandomFetcher[]): Promise<Appointment | null> {
    while (taskRandomFetchers.some((g) => g.probability > 0)) {
        const probabilities = taskRandomFetchers.map((g) => g.probability);
        const idx = playRandomIndex(probabilities);
        const fetcher = taskRandomFetchers[idx];

        const appointment = await fetcher.fetchTask();
        if (appointment !== null) {
            return appointment;
        }

        fetcher.probability = 0;
    }

    return null;
}

export default async function assignMarkupTask(
    markup: Markup,
    user: User,
    probabilities: { [task in MarkupTaskGroup]: number }
): Promise<Appointment | null> {
    const taskRandomFetchers = Object.values(MarkupTaskGroup).map((g) => ({
        fetchTask: () => markupTaskFetchers[g](markup, user),
        probability: probabilities[g]
    }));

    const appointment = await fetchRandomTask(taskRandomFetchers);
    return appointment;
}
