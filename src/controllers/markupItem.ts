import express from "express";
import { send } from "process";
import { createConnection } from "typeorm";
import { Appointment } from "../entity/Appointment";
import { Dataset } from "../entity/Dataset";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { User } from "../entity/User";

/**
 * Получение экспертом объекта для разметки
 */
export async function get(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    const connection = await createConnection();
    try {
        const { markupId } = request.params;
        const { login } = response.locals;

        const user = await connection.manager.findOne(User, { login });
        if (!user) {
            await connection.close();
            response
                .status(400)
                .send(`User with login '${login}' doesn't exist}`);
            return;
        }

        const markup = await connection.manager.findOne(Markup, { id: markupId }, { relations: ["experts"] });
        if (!markup) {
            await connection.close();
            response
                .status(400)
                .send(`Markup with id '${markupId}' doesn't exist}`);
            return;
        }

        const isParticipant = markup.experts.some(({ id }) => user.id === id);
        if (!isParticipant) {
            await connection.close();
            response
                .status(403)
                .send(`User is not an expert in this markup`);
            return;
        }

        // ищем следующий объект в назначениях
        let appointment = await connection.manager.findOne(Appointment, {
            where: {
                expert: user,
                markup
            },
            relations: ["datasetItem"]
        });

        if (!appointment) {
            appointment = new Appointment();
            appointment.expert = user;
            appointment.markup = markup;

            const appSubQb = connection.manager
                .createQueryBuilder()
                .select("a.datasetItemId")
                .from(Appointment, "a")
                .where("a.markupId = :markupId", { markupId });

            const datasetItem = await connection.manager
                .createQueryBuilder()
                .select("datasetItem")
                .from(DatasetItem, "datasetItem")
                .where("datasetItem.id NOT IN (" + appSubQb.getSql() + ")")
                .getOne();

            if (datasetItem) {
                appointment.datasetItem = datasetItem;
                await connection.manager.save(appointment);
            }
            else {
                await connection.close();
                response.sendStatus(404);
                return;
            }
        }
    
        await connection.close();
        response
            .status(200)
            .send(appointment.datasetItem);
    }
    catch(err) {
        if (connection.isConnected) {
            await connection.close();
        }
        next(err);
    }

};