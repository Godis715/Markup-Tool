import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import {
    EX_MARKUP_ITEM_CREATED,
    EX_MODEL,
    KEY_MODEL_TRAINING_FINISHED,
    Q_GET_MARKUP_ITEMS,
    Q_RESULT_INFERENCE,
    RABBITMQ_HOST
} from "../config";
import handleMarkupItemCreated from "../handlers/handleMarkupItemCreated";
import handleMarkupItems from "../handlers/handleMarkupItems";
import handleResultInference from "../handlers/hadleResultInference";
import handleFinishTraining from "../handlers/handleFinishTraining";

const connection = amqp.connect([RABBITMQ_HOST]);

const replyQueueParams = { exclusive: true, autoDelete: true };

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true });

        await channel.assertExchange(EX_MODEL, "topic", { durable: true });

        // канал для прослушивания событий разметки
        const { queue: markupItemRecieveQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.bindQueue(markupItemRecieveQueue, EX_MARKUP_ITEM_CREATED, "");

        // канал для прослушивания событий обучения модели
        const { queue: modelTrainingResultQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.bindQueue(modelTrainingResultQueue, EX_MODEL, KEY_MODEL_TRAINING_FINISHED);

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
            (msg) => handleMarkupItemCreated(msg, markupItemsReplyQueue)
        );

        // когда получены сырые размеченные данные, они отправляются в result inference service
        await channel.consume(
            markupItemsReplyQueue,
            (msg) => handleMarkupItems(msg, resultInferenceQueue)
        );

        // когда новая модель создана, запускается процесс обучения
        await channel.consume(resultInferenceQueue, handleResultInference);

        // ловим событие завершения обучения модели
        await channel.consume(modelTrainingResultQueue, handleFinishTraining);
    }
});
