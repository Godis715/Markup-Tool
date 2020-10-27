import { validateOrReject } from "class-validator";
import express, { Request, Response } from "express";
import { getManager } from "typeorm";
import { Appointment } from "../entity/Appointment";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { MarkupItem } from "../entity/MarkupItem";
import { User } from "../entity/User";
import { MarkupItemData, MarkupItemResult } from "../types/markupItem";

/**
 * Получение экспертом объекта для разметки
 */
export type GetMarkupItemRequestBody = null;
export type GetMarkupItemResponseBody = MarkupItemData | string
type GetMarkupItemParams = { markupId: string };

export async function get(
    request: Request<GetMarkupItemParams, GetMarkupItemResponseBody, GetMarkupItemRequestBody>,
    response: Response<GetMarkupItemResponseBody>,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const { markupId } = request.params;
        const { login } = response.locals;

        const user = await manager.findOne(User, { login });
        if (!user) {
            response
                .status(400)
                .send(`User with login '${login}' doesn't exist}`);
            return;
        }

        const markup = await manager.findOne(Markup, { id: markupId }, { relations: ["experts", "dataset"] });
        if (!markup) {
            response
                .status(400)
                .send(`Markup with id '${markupId}' doesn't exist}`);
            return;
        }

        const isParticipant = markup.experts.some(({ id }) => user.id === id);
        if (!isParticipant) {
            response
                .status(403)
                .send(`User is not an expert in this markup`);
            return;
        }

        // ищем следующий объект в назначениях
        let appointment = await manager.findOne(Appointment, {
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

            /**
             * TODO:
             * логику назначения задачи на пользователя нужно вынести отдельно
             * 
             * TODO:
             * отдельно продумать вариант, когда задачи кончились, но некоторые пользователи
             * не выполняют назначенную им задачу
             * в этом случае, наверное, стоит отдать эту задачу другим пользователям
             * а потом по принципу "кто первый"
             * 
             * TODO:
             * продумать схемы с тем, чтобы у пользователей задачи могли пересекаться
             * 
             * FIX ME:
             * видимо, это баг typeorm, что в каких-то случаях, происходит подстановка кавычек для postgre
             * в каких-то нет
             * проверить это дело
             */
            const datasetItemSubQb = manager
                .createQueryBuilder()
                .select("di")
                .from(DatasetItem, "di")
                .where('di."datasetId" = :datasetId')
                .andWhere(
                    (qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select('app."datasetItemId"')
                            .from(Appointment, "app")
                            .where('app."markupId" = :markupId')
                            .getQuery();
                    
                        return `di.id NOT IN ${subQuery}`;
                    }
                )
                .andWhere(
                    (qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select('item."datasetItemId"')
                            .from(MarkupItem, "item")
                            .where('item."markupId" = :markupId')
                            .getQuery();

                        return `di.id NOT IN ${subQuery}`;
                    }
                )
                .setParameter("datasetId", markup.dataset.id)
                .setParameter("markupId", markupId);

            const datasetItem = await datasetItemSubQb.getOne();

            if (datasetItem) {
                appointment.datasetItem = datasetItem;
                await manager.save(appointment);
            }
            else {
                response.sendStatus(404);
                return;
            }
        }

        const dataToSend: MarkupItemData = {
            imageSrc: appointment.datasetItem.location
        };
    
        response
            .status(200)
            .send(dataToSend);
    }
    catch(err) {
        next(err);
    }
};

export type PostMarkupItemResultRequestBody = { result: MarkupItemResult };
export type PostMarkupItemResultResponseBody = string;
type PostMarkupItemResultParams = { markupId: string };

export async function post(
    request: Request<PostMarkupItemResultParams, PostMarkupItemResultResponseBody, PostMarkupItemResultRequestBody>,
    response: Response<PostMarkupItemResultResponseBody>,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const { markupId } = request.params;
        const { login } = response.locals;
        const { result } = request.body;

        const user = await manager.findOne(User, { login });
        if (!user) {
            response
                .status(400)
                .send(`User with login '${login}' doesn't exist}`);
            return;
        }

        const markup = await manager.findOne(Markup, { id: markupId }, { relations: ["items"] });
        if (!markup) {
            response
                .status(400)
                .send(`Markup with id '${markupId}' doesn't exist}`);
            return;
        }

        // ищем следующий объект в назначениях
        const appointment = await manager.findOne(Appointment, {
            where: {
                expert: user,
                markup
            },
            relations: ["datasetItem"]
        });

        if (!appointment) {
            response
                .status(404)
                .send("Appointment for the user is not found");
            return;
        }

        const markupItem = new MarkupItem();
        markupItem.expert = user;
        markupItem.datasetItem = appointment.datasetItem;
        markupItem.markup = markup;
        markupItem.result = result;

        markup.items.push(markupItem);

        try {
            await validateOrReject(markupItem, { validationError: { target: false } });
        }
        catch(errors) {
            response
                .status(400)
                .send(errors);
            return;
        }

        await manager.transaction(
            async (transactionManager) => {
                await transactionManager.save(markup);
                await transactionManager.save(markupItem);
                await transactionManager.remove(appointment);
            }
        );

        response.sendStatus(200);
    }
    catch(err) {
        next(err);
    }
}
