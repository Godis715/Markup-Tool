import { getManager } from "typeorm";
import { Appointment, AppointmentType } from "../../entity/Appointment";
import { Markup } from "../../entity/Markup";
import { Prediction } from "../../entity/Prediction";
import { User } from "../../entity/User";
import { TaskFetcher } from "./types";

export enum ValidationTaskGroup {
    PARTIALLY_DONE = "partially-done",
    UNTOUCHED = "untouched"
};

export const validationTaskFetchers: { [task in ValidationTaskGroup]: TaskFetcher } = {
    [ValidationTaskGroup.PARTIALLY_DONE]: fetchPartiallyDoneTask,
    [ValidationTaskGroup.UNTOUCHED]: fetchUntouchedTask
};

async function fetchPartiallyDoneTask(markup: Markup, user: User): Promise<Appointment | null> {
    const manager = getManager();

    const predictionItemSubQb = manager
        .createQueryBuilder()
        .select("pred")
        // выбираем такие Prediction
        .from(Prediction, "pred")
        // делаем соединение с Votes
        .leftJoin('pred.votes', 'v')
        // также добавляем пользователя, который разметил изображение
        .leftJoin("v.expert", "e")
        .leftJoin("pred.markup", "m")
        .leftJoinAndSelect("pred.datasetItem", "di")
        // для заданной разметки
        .where("m.id = :markupId")
        // группируем по DatasetItem
        .groupBy("pred.id")
        .addGroupBy("di.id")
        // выбираем не размеченные текущим пользователем
        .having("BOOL_AND(e.id != :expertId)")
        // FIXME: вроде как, это излишнее условее
        // которые были размечены кем-то
        .andHaving("COUNT(*) > 0")
        // но недостаточное количество раз
        .andHaving("COUNT(*) < :validationLimit")
        .orderBy("RANDOM()")
        .setParameter("markupId", markup.id)
        .setParameter("validationLimit", 3)
        .setParameter("expertId", user.id);

    const prediction = await predictionItemSubQb.getOne();

    if (!prediction) {
        return null;
    }

    const appointment = new Appointment();
    appointment.expert = user;
    appointment.markup = markup;
    appointment.type = AppointmentType.PREDICTION_VALIDATION;
    appointment.prediction = prediction;

    return appointment;
}

async function fetchUntouchedTask(markup: Markup, user: User): Promise<Appointment | null> {
    const manager = getManager();

    const predictionItemSubQb = manager
        .createQueryBuilder()
        .select("pred")
        .from(Prediction, "pred")
        .leftJoin("pred.markup", "m")
        .leftJoin("pred.votes", "v")
        .leftJoinAndSelect("pred.datasetItem", "di")
        .where("m.id = :markupId")
        .andWhere("v.id is NULL")
        .orderBy("RANDOM()")
        .setParameter("markupId", markup.id);

    const prediction = await predictionItemSubQb.getOne();

    if (!prediction) {
        return null;
    }

    const appointment = new Appointment();
    appointment.expert = user;
    appointment.markup = markup;
    appointment.type = AppointmentType.PREDICTION_VALIDATION;
    appointment.prediction = prediction;

    return appointment;
}

