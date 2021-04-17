import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../config";
import { v4 as uuidv4 } from "uuid";

const connection = amqp.connect([RABBITMQ_HOST]);

export const MARKUP_ITEM_CREATED_EXCHANGE = "markup.created";

export const MARKUP_ITEM_COUNT_QUEUE = "markup_item_count";

export const MARKUP_MODEL_QUEUE = "markup_model";

type MarkupItemCreatedMsg = {
    expertId: string,
    markupId: string,
    marupItemId: string,
    // FIXME: написать типы более конкретно
    type: string
};

type ModelStatus = "training" | "ready" | "failure";

type MarkupModelResult = {
    markupId: string,
    modelId: string,
    status: ModelStatus,
    timestamp: string,
    markupsDone: number
} | {
    markupId: string,
    modelId: null
};

type MarkupItemCountResult = {
    markupId: string,
    markupCount: number
};

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(MARKUP_ITEM_CREATED_EXCHANGE, "fanout", { durable: true });

        const { queue: markupItemQueue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        await channel.bindQueue(markupItemQueue, MARKUP_ITEM_CREATED_EXCHANGE, "");

        const { queue: markupItemCountResultQueue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        await channel.assertQueue(MARKUP_ITEM_COUNT_QUEUE, { durable: true });

        const { queue: markupModelResultQueue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        await channel.assertQueue(MARKUP_MODEL_QUEUE, { durable: true });

        await channel.consume(markupItemQueue, (msg1) => {
            if (!msg1 || !msg1.content) {
                return;
            }
        
            let payload: MarkupItemCreatedMsg;
            try {
                payload = JSON.parse(msg1.content.toString());
            }
            catch (err) {
                console.error("[TRAINING-LAUNCH-SERVICE]: Couldn't parse message content: ", msg1.content);
                return;
            }
        
            console.log("[TRAINING-LAUNCH-SERVICE]", payload);
            // Тепеь нужно сделать два RPC вызова - получить количество разметок пользователей -- MarkupService
            // Получить актуальные данные по модели -- к ModelManagementService

            const markupModelResultCorrId = uuidv4();

            channel.consume(markupModelResultQueue, (msg2) => {
                if (!msg2 || markupModelResultCorrId !== msg2.properties.correlationId || !msg2.content) {
                    return;
                }

                const markupModelResult = JSON.parse(msg2.content.toString()) as MarkupModelResult;
                // когда модель в процессе обучения, тогда мы не запускаем обучаться ее снова
                if (markupModelResult.modelId && markupModelResult.status === "training") {
                    return;
                }

                const markupItemCountResultCorrId = uuidv4();
                channel.consume(markupItemCountResultQueue, (msg3) => {
                    if (!msg3 || msg3.properties.correlationId !== markupItemCountResultCorrId || !msg3.content) {
                        return;
                    }

                    const markupItemCountResult = JSON.parse(msg3.content.toString()) as MarkupItemCountResult;
                    console.log(
                        "[TRAINING-LAUNCH-SERVICE]: ready to start training",
                        markupModelResult,
                        markupItemCountResult
                    );
                });

                // запрос на получение данных о количестве разметок к markup-service
                channelWrapper.sendToQueue(MARKUP_ITEM_COUNT_QUEUE, {
                    markupId: payload.markupId
                }, {
                    replyTo: markupItemCountResultQueue,
                    correlationId: markupItemCountResultCorrId
                });
            });

            // запрос на получение данных о модели к model-management-service
            channelWrapper.sendToQueue(MARKUP_MODEL_QUEUE, {
                markupId: payload.markupId
            }, {
                replyTo: markupModelResultQueue,
                correlationId: markupModelResultCorrId
            });
        });
    }
});
