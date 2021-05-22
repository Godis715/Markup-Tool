import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import {
    EX_MARKUP_ITEM_CREATED,
    EX_MODEL,
    EX_VALIDATION_ITEM_CREATED,
    KEY_MODEL_READY,
    Q_GET_MARKUP_ITEMS,
    Q_MODEL_PREDICT,
    RABBITMQ_HOST
} from "../constants";
import handleGetMarkupItems from "./__handleGetMarkupItems";
import handleMarkupPrediction from "./__handleMarkupPrediction";
import handleModelTrained from "./__handleModelTrained";

const connection = amqp.connect([RABBITMQ_HOST]);
export let predictionResultQueue = "";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true });
        await channel.assertExchange(EX_VALIDATION_ITEM_CREATED, "fanout", { durable: true });
        await channel.assertExchange(EX_MODEL, "topic", { durable: true });

        await channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true });
        await channel.assertQueue(Q_MODEL_PREDICT, { durable: true });
        const { queue: _predictionResultQueue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        predictionResultQueue = _predictionResultQueue;

        const { queue: modelReadyQueue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });

        await channel.bindQueue(modelReadyQueue, EX_MODEL, KEY_MODEL_READY);

        await channel.consume(Q_GET_MARKUP_ITEMS, handleGetMarkupItems);
        await channel.consume(predictionResultQueue, handleMarkupPrediction);
        await channel.consume(modelReadyQueue, (msg) => handleModelTrained(msg, predictionResultQueue));
    }
});
