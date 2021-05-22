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
import { MarkupItemResult, TaskItemData, TaskItemResult, ValidationItemResult } from "../../types/markupItem";
import { assignMarkupTask, assignValidationTask } from "../../services/taskAssignmentService/taskAssignmentService";
import { MarkupTaskGroup } from "../../services/taskAssignmentService/markupTaskGroups";
import { channelWrapper, predictionResultQueue } from "../../rabbit/channelWrapper";
import { Vote } from "../../entity/Vote";
import { ValidationTaskGroup } from "../../services/taskAssignmentService/validationTaskGroup";
import { EX_MARKUP_ITEM_CREATED, EX_VALIDATION_ITEM_CREATED } from "../../constants";
import { queryAutoAnnotation, shouldRequestMorePredictions } from "../../services/autoAnnotationService/autoAnnotationService";

const markupTaskProbabilities = {
    [MarkupTaskGroup.PARTIALLY_DONE]: 0.5,
    [MarkupTaskGroup.UNTOUCHED]: 0.5
};

const validationTaskProbabilities = {
    [ValidationTaskGroup.PARTIALLY_DONE]: 0.75,
    [ValidationTaskGroup.UNTOUCHED]: 0.25
};

type TaskType = "markup" | "validation";
const TASK_TYPE_TO_APPOINT_TYPE = {
    "markup": [AppointmentType.MARKUP],
    "validation": [
        AppointmentType.MARKUP_VALIDATION,
        AppointmentType.PREDICTION_VALIDATION
    ]
};

@JsonController("/api/task/:taskId/:taskType/item")
export default class TaskItemController {
    @Get("/")
    @Authorized(UserRole.EXPERT)
    async getNextItem(
        @Param("taskId") taskId: string,
        @Param("taskType") taskType: TaskType,
        @CurrentUser({ required: true }) user: User
    ): Promise<TaskItemData | null> {
        if (taskType !== "markup" && taskType !== "validation") {
            throw new BadRequestError(`Invalid task type: ${taskType}`);
        }

        const manager = getManager();

        const markup = await manager.findOne(Markup, taskId, {
            relations: ["experts", "dataset"]
        });

        if (!markup) {
            // 404 предназначается для случая, когда у пользователя нет назначения
            throw new BadRequestError(`Markup with id '${taskId}' doesn't exist}`);
        }

        const isParticipant = markup.experts.some(({ id }) => user.id === id);
        if (!isParticipant) {
            throw new ForbiddenError(`User is not an expert in this markup`);
        }

        const appointmentTypes = TASK_TYPE_TO_APPOINT_TYPE[taskType];
        
        // сначала ищем существующее назначение
        let appointment: Appointment | null | undefined = await manager.findOne(Appointment, {
            where: appointmentTypes.map((type) => ({
                expert: user,
                markup,
                type
            })),
            relations: ["datasetItem", "prediction", "prediction.datasetItem"]
        });

        switch(taskType) {
            case "markup": {
                if (!appointment) {
                    appointment = await assignMarkupTask(markup, user, markupTaskProbabilities);

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
            case "validation": {
                if (!appointment) {
                    appointment = await assignValidationTask(markup, user, validationTaskProbabilities);

                    if (!appointment) {
                        return null;
                    }

                    await manager.save(appointment);
                }

                if (!appointment.prediction) {
                    throw new Error("Found appointment of type 'Validation', but it's prediction is null")
                }

                await manager.save(appointment);

                return {
                    imageSrc: appointment.prediction.datasetItem.location,
                    markup: appointment.prediction.result
                };
            }
        }
    }

    @Post("/")
    @OnUndefined(200)
    @Authorized(UserRole.EXPERT)
    async post(
        @Param("taskId") taskid: string,
        @Param("taskType") taskType: TaskType,
        @Body() body: { result: TaskItemResult },
        @CurrentUser({ required: true }) user: User
    ): Promise<void | null> {
        if (taskType !== "markup" && taskType !== "validation") {
            throw new BadRequestError(`Invalid task type: ${taskType}`);
        }

        const { result } = body;

        const manager = getManager();

        const markup = await manager.findOne(Markup, taskid, {
            relations: ["items"]
        });

        if (!markup) {
            return null;
        }

        const appointmentTypes = TASK_TYPE_TO_APPOINT_TYPE[taskType];
        
        // сначала ищем существующее назначение
        let appointment: Appointment | null | undefined = await manager.findOne(Appointment, {
            where: appointmentTypes.map((type) => ({
                expert: user,
                markup,
                type
            })),
            relations: ["datasetItem", "prediction", "prediction.datasetItem"]
        });

        switch(taskType) {
            case "markup": {
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
                markupItem.result = result as MarkupItemResult;
        
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
                break;
            }
            case "validation": {
                if (!result || typeof result !== "object" || !("isCorrect" in result)) {
                    throw new BadRequestError(`Expected { isCorrect: boolean}, but got ${JSON.stringify(result)}`);
                }

                if (!appointment) {
                    return null;
                }

                if (!appointment.prediction) {
                    throw new Error("Found appointment of type 'Validation', but it's prediction is null")
                }

                const vote = new Vote();
                vote.expert = user;
                vote.prediction = appointment.prediction;
                vote.isCorrect = (result as ValidationItemResult).isCorrect;

                if (!appointment.prediction.votes) {
                    appointment.prediction.votes = [];
                }
                appointment.prediction.votes.push(vote);
                // осуществляем изменения  базе в виде транзакции
                try {
                    await manager.transaction(
                        async (transactionManager) => {
                            await transactionManager.save(markup);
                            await transactionManager.save(vote);
                            await transactionManager.remove(appointment);
                        }
                    );
                }
                catch(err) {
                    throw new BadRequestError(err);
                }

                try {
                    await channelWrapper.publish(EX_VALIDATION_ITEM_CREATED, "", {
                        expertId: user.id,
                        type: markup.type,
                        markupId: markup.id
                    }, undefined, (err) => {
                        if (err) {
                            throw err;
                        }
        
                        console.log("[MARKUP-SERVICE]: Sent message 'validation item created'")
                    });
                }
                catch (err) {
                    console.error("[MARKUP-SERVICE]: Couldn't publish 'validation item created' message");
                    console.error(err);
                }

                // TODO: вынести в отдельный сервис
                if (await shouldRequestMorePredictions(markup.id)) {
                    await queryAutoAnnotation(markup.id, 3, predictionResultQueue);
                }
                
                break;
            }
        }
    }

    @Get("/should-continue")
    async shouldContinue(
        @Param("taskId") taskId: string
    ): Promise<{ shouldRequest: boolean }> {
        const shouldRequest = await shouldRequestMorePredictions(taskId);
        return { shouldRequest };
    }
}
