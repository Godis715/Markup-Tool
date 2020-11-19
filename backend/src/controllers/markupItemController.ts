import { validateOrReject } from "class-validator";
import {
    JsonController,
    Get,
    CurrentUser,
    Body,
    Post,
    Authorized,
    Param,
    BadRequestError,
    ForbiddenError,
    OnUndefined
} from "routing-controllers";
import { getManager } from "typeorm";
import { Appointment } from "../entity/Appointment";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { MarkupItem } from "../entity/MarkupItem";
import { User } from "../entity/User";
import { UserRole } from "../enums/appEnums";
import { MarkupItemData, MarkupItemResult } from "../types/markupItem";

@JsonController("/api/markup/:markupId/item")
export default class MarkupItemController {
    @Get("/")
    @Authorized(UserRole.EXPERT)
    async getNextItem(
        @Param("markupId") markupId: string,
        @CurrentUser({ required: true }) user: User
    ): Promise<MarkupItemData|null> {
        const manager = getManager();

        const markup = await manager.findOne(Markup, markupId, {
            relations: ["experts", "dataset"]
        });

        if (!markup) {
            // 404 предназначается для случая, когда у пользователя нет назначения
            throw new BadRequestError(`Markup with id '${markupId}' doesn't exist}`);
        }

        const isParticipant = markup.experts.some(({ id }) => user.id === id);
        if (!isParticipant) {
            throw new ForbiddenError(`User is not an expert in this markup`);
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
                .where('di.datasetId = :datasetId')
                .andWhere(
                    (qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select('app.datasetItemId')
                            .from(Appointment, "app")
                            .where('app.markupId = :markupId')
                            .getQuery();
                    
                        return `di.id NOT IN ${subQuery}`;
                    }
                )
                .andWhere(
                    (qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select('item.datasetItemId')
                            .from(MarkupItem, "item")
                            .where('item.markupId = :markupId')
                            .getQuery();

                        return `di.id NOT IN ${subQuery}`;
                    }
                )
                .setParameter("datasetId", markup.dataset.id)
                .setParameter("markupId", markupId);

            const datasetItem = await datasetItemSubQb.getOne();

            if (!datasetItem) {
                return null;
            }
            
            appointment.datasetItem = datasetItem;
            await manager.save(appointment);
        }

        return {
            imageSrc: appointment.datasetItem.location
        };
    }

    @Post("/")
    @OnUndefined(200)
    @Authorized(UserRole.EXPERT)
    async post(
        @Param("markupId") markupId: string,
        @Body() body: { result: MarkupItemResult },
        @CurrentUser({ required: true }) user: User
    ) {
        const manager = getManager();
        const { result } = body;

        const markup = await manager.findOne(Markup, markupId, {
            relations: ["items"]
        });

        if (!markup) {
            return null;
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
            return null;
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
            throw new BadRequestError(JSON.stringify(errors));
        }

        try {
            await manager.transaction(
                async (transactionManager) => {
                    await transactionManager.save(markup);
                    await transactionManager.save(markupItem);
                    await transactionManager.remove(appointment);
                }
            );
        }
        catch(err) {
            throw new BadRequestError(err);
        }
    }
}
