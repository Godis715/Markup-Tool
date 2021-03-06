import { validateOrReject } from "class-validator";
import {
    Get,
    Post,
    Body,
    Param,
    Authorized,
    CurrentUser,
    OnUndefined,
    ForbiddenError,
    JsonController,
    BadRequestError
} from "routing-controllers";
import { getManager } from "typeorm";
import { Appointment, AppointmentType } from "../../entity/Appointment";
import { Markup } from "../../entity/Markup";
import { MarkupItem } from "../../entity/MarkupItem";
import { User } from "../../entity/User";
import { UserRole } from "../../types/role";
import { MarkupItemData, MarkupItemResult } from "../../types/markupItem";
import { assignMarkupTask } from "../../services/taskAssignmentService/taskAssignmentService";
import { MarkupTaskGroup } from "../../services/taskAssignmentService/markupTaskGroups";
import { channelWrapper } from "../../rabbit/channelWrapper";
import { EX_MARKUP_ITEM_CREATED } from "../../constants";

const MarkupTaskProbabilities = {
    [MarkupTaskGroup.PARTIALLY_DONE]: 0.75,
    [MarkupTaskGroup.UNTOUCHED]: 0.25
};

@JsonController("/api/markup/:markupId/item")
export default class MarkupItemController {
    @Get("/")
    @Authorized(UserRole.EXPERT)
    async getNextItem(
        @Param("markupId") markupId: string,
        @CurrentUser({ required: true }) user: User
    ): Promise<MarkupItemData | null> {
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

        // сначала ищем существующее назначение
        let appointment: Appointment | null | undefined = await manager.findOne(Appointment, {
            where: {
                expert: user,
                markup,
                type: AppointmentType.MARKUP
            },
            relations: ["datasetItem"]
        });

        // в случае, если назначения не нашлось, то вызываем сервис назначения заданий
        if (!appointment) {
            appointment = await assignMarkupTask(markup, user, MarkupTaskProbabilities);

            if (!appointment) {
                return null;
            }
            
            await manager.save(appointment);
        }

        if (!appointment.datasetItem) {
            throw new Error("Found appointment of type 'Markup', but it's datasetItem is null");
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

        // ищем назначение для заданного пользователя
        const appointment = await manager.findOne(Appointment, {
            where: {
                expert: user,
                markup,
                type: AppointmentType.MARKUP
            },
            relations: ["datasetItem"]
        });

        if (!appointment) {
            return null;
        }

        if (!appointment.datasetItem) {
            throw new Error("Found appointment of type 'Markup', but it's datasetItem is null");
        }

        // кладем разметку пользователя в базу
        const markupItem = new MarkupItem();
        markupItem.expert = user;
        markupItem.datasetItem = appointment.datasetItem;
        markupItem.markup = markup;
        markupItem.result = result;

        markup.items.push(markupItem);

        // валидируем разметку, которую пользователь отправил
        try {
            await validateOrReject(markupItem, { validationError: { target: false } });
        }
        catch(errors) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        // осуществляем изменения  базе в виде транзакции
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

        // здесь генерируется сообщение о том, что было размечено некоторое задание
        // если произошла ошибка, то это норма, сервис продолжает работать в обычном режиме
        console.log("[MARKUP-SERVICE]: Starting senditn message about creating markup");

        try {
            await channelWrapper.publish(EX_MARKUP_ITEM_CREATED, "", {
                expertId: user.id,
                markupItemId: markupItem.id,
                type: markup.type,
                markupId: markup.id
            }, undefined, (err) => {
                if (err) {
                    throw err;
                }

                console.log("[MARKUP-SERVICE]: Sent message 'markup item created'")
            });
        }
        catch (err) {
            console.error("[MARKUP-SERVICE]: Couldn't publish 'markup item created' message");
            console.error(err);
        }
    }
}


