import { getManager } from "typeorm";
import { Appointment, AppointmentType } from "../../entity/Appointment";
import { DatasetItem } from "../../entity/DatasetItem";
import { Markup } from "../../entity/Markup";
import { MarkupItem } from "../../entity/MarkupItem";
import { User } from "../../entity/User";
import { TaskFetcher } from "./types";

export enum MarkupTaskGroup {
    PARTIALLY_DONE = "partially-done",
    UNTOUCHED = "untouched"
};

export const markupTaskFetchers: { [task in MarkupTaskGroup]: TaskFetcher } = {
    [MarkupTaskGroup.PARTIALLY_DONE]: fetchPartiallyDoneTask,
    [MarkupTaskGroup.UNTOUCHED]: fetchUntouchedTask
};

/**
 * Функция возвращает ID datasetItem-a, который:
 * - Еще никем не был размечен
 */
async function fetchUntouchedTask(markup: Markup, user: User): Promise<Appointment | null> {
    const manager = getManager();

    /**
        SELECT *
        FROM "dataset_item" "di"
        LEFT JOIN "dataset" "d" ON "d"."id" = "di"."datasetId"
        LEFT JOIN "markup" "m" ON "m"."datasetId"="di"."datasetId"
        WHERE "m"."id" = 'ceb7bf5e-8f84-408d-8da5-51ffa8adc638' AND
        "di"."id" NOT IN (
            SELECT "mi"."datasetItemId"
            FROM "markup_item" "mi"
            LEFT JOIN "markup" "m" ON "m"."id" = "mi"."markupId"
            WHERE "m"."id" = 'ceb7bf5e-8f84-408d-8da5-51ffa8adc638'
        )
     */
    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        .from(DatasetItem, "di")
        .leftJoin("di.dataset", "d")
        .leftJoin("d.markups", "m")
        .where("m.id = :markupId")
        .andWhere(
            (qb) => {
                const subQuery = qb
                    .subQuery()
                    .select("di_2.id")
                    .from(MarkupItem, "mi")
                    .leftJoin("mi.markup", "m")
                    .leftJoin("mi.datasetItem", "di_2")
                    .where("m.id = :markupId")
                    .getQuery();
            
                return `di.id NOT IN ${subQuery}`;
            }
        )
        .orderBy("RANDOM()")
        .setParameter("markupId", markup.id);

    const datasetItem = await datasetItemSubQb.getOne();

    if (!datasetItem) {
        return null;
    }

    const appointment = new Appointment();
    appointment.expert = user;
    appointment.markup = markup;
    appointment.type = AppointmentType.MARKUP;
    appointment.datasetItem = datasetItem;

    return appointment;
}

async function fetchPartiallyDoneTask(markup: Markup, user: User): Promise<Appointment | null> {
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
        .leftJoin("mi.markup", "m")
        // для заданной разметки
        .where("m.id = :markupId")
        // группируем по DatasetItem
        .groupBy("di.id")
        // выбираем не размеченные текущим пользователем
        .having("BOOL_AND(e.id != :expertId)")
        // FIXME: вроде как, это излишнее условее
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

    const appointment = new Appointment();
    appointment.expert = user;
    appointment.markup = markup;
    appointment.type = AppointmentType.MARKUP;
    appointment.datasetItem = datasetItem;

    return appointment;
}
