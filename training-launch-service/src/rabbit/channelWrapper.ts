import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../config";
import handleModelInfo from "../handlers/handleModelInfo";
import handleMarkupItemCreated from "../handlers/handleMarkupItemCreated";
import handleMarkupItemCount from "../handlers/handleMarkupItemCount";
import handleMarkupItems from "../handlers/handleMarkupItems";
import handleResultInference from "../handlers/hadleResultInference";
import handleModelCreated from "../handlers/handleModelCreated";

const connection = amqp.connect([RABBITMQ_HOST]);

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const Q_MARKUP_ITEM_COUNT = "markup_item.count";

export const Q_GET_MARKUP_ITEMS = "markup_item.get";

export const Q_GET_MODEL_INFO = "model.get_info";

export const Q_CREATE_MODEL = "model.create";

export const Q_TRAIN_MODEL = "model.train";

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

        // канал для прослушивания событий о том, что основной сервис посчитало количество разметок
        const { queue: markupItemCountReplyQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_MARKUP_ITEM_COUNT, { durable: true });

        // канал для прослушивания событий о получении информации о модели
        const { queue: modelInfoReplyQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_GET_MODEL_INFO, { durable: true });

        // канал для прослушивания событий о получении сырых данных
        const { queue: markupItemsReplyQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true });

        // канал для получения обработанных данных
        const { queue: resultInferenceQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_RESULT_INFERENCE, { durable: true });

        // канал для получения id созданной модели
        const { queue: createModelReplyQueue } = await channel.assertQueue("", replyQueueParams);
        await channel.assertQueue(Q_CREATE_MODEL, { durable: true });
        
        // ======== CONSUMERS - выяснение того, нужно ли обучать модель =====================

        // сначала прослушивается событие того, что какое-то изображение было размечено. Делается запрос к model management service
        await channel.consume(markupItemRecieveQueue, (msg) => handleMarkupItemCreated(msg, Q_GET_MODEL_INFO, modelInfoReplyQueue));

        // после этого прослушивается сообщение, содержащее информацию о текущей модели. Делается запрос в основной сервис
        await channel.consume(modelInfoReplyQueue, (msg) => handleModelInfo(msg, Q_MARKUP_ITEM_COUNT, markupItemCountReplyQueue));

        // когда получены данные о том, сколько разметки было сделано со времени последнего обучения модели
        // делается вывод о том, нужно ли запускать обучение. Если да, то тогда отправляется запрос на выгрузку разметки в основной сервис
        await channel.consume(markupItemCountReplyQueue, (msg) => handleMarkupItemCount(msg, Q_GET_MARKUP_ITEMS, markupItemsReplyQueue));

        // ======== CONSUMERS - подготова данных для обучения модели =====================

        // когда получены сырые размеченные данные, они отправляются в result inference service
        await channel.consume(markupItemsReplyQueue, (msg) => handleMarkupItems(msg, Q_RESULT_INFERENCE, resultInferenceQueue));

        // когда получены обработанные данные, делается запрос на создание новой модели
        await channel.consume(resultInferenceQueue, (msg) => handleResultInference(msg, Q_CREATE_MODEL, createModelReplyQueue));

        // когда новая модель создана, запускается процесс обучения
        await channel.consume(createModelReplyQueue, (msg) => handleModelCreated(msg, Q_TRAIN_MODEL));
    }
});
