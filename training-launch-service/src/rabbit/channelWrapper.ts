import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../config";
import handleMarkupItemCreated from "../handlers/handleMarkupItemCreated";
import handleMarkupItems from "../handlers/handleMarkupItems";
import handleResultInference from "../handlers/hadleResultInference";

const connection = amqp.connect([RABBITMQ_HOST]);

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const Q_GET_MARKUP_ITEMS = "markup_item.get_all";

export const Q_START_MODEL_TRAINING = "model.training.start";

export const Q_RESULT_INFERENCE = "result_inference";

const replyQueueParams = { exclusive: true, autoDelete: true };

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true });

        // канал для прослушивания событий разметки
        const { queue: markupItemRecieveQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.bindQueue(markupItemRecieveQueue, EX_MARKUP_ITEM_CREATED, "");

        // ========

        // канал для прослушивания событий о получении сырых данных
        const { queue: markupItemsReplyQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true });

        // канал для получения обработанных данных
        const { queue: resultInferenceQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_RESULT_INFERENCE, { durable: true });

        // ========

        // сначала прослушивается событие того, что какое-то изображение было размечено
        // после этого основноу сервису может быть направлен запрос на выгрузку сырых данных
        await channel.consume(
            markupItemRecieveQueue,
            (msg) => handleMarkupItemCreated(msg, Q_GET_MARKUP_ITEMS, markupItemsReplyQueue)
        );

        // когда получены сырые размеченные данные, они отправляются в result inference service
        await channel.consume(
            markupItemsReplyQueue,
            (msg) => handleMarkupItems(msg, Q_RESULT_INFERENCE, resultInferenceQueue)
        );

        // когда новая модель создана, запускается процесс обучения
        await channel.consume(
            resultInferenceQueue,
            (msg) => handleResultInference(msg, Q_START_MODEL_TRAINING)
        );
    }
});
