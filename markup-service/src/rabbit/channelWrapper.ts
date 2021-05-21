import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../constants";
import handleGetMarkupItems from "./__handleGetMarkupItems";
import handleMarkupPrediction from "./__handleMarkupPrediction";

const connection = amqp.connect([RABBITMQ_HOST]);

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const EX_VALIDATION_ITEM_CREATED = "validation_item.created";

export const Q_GET_MARKUP_ITEMS = "markup_item.get_all";

export const Q_MODEL_PREDICTION_RESULT = "model.prediction.result";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true }),
        await channel.assertExchange(EX_VALIDATION_ITEM_CREATED, "fanout", { durable: true }),

        await channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true }),
        await channel.assertQueue(Q_MODEL_PREDICTION_RESULT, { durable: true }),

        await channel.consume(Q_GET_MARKUP_ITEMS, handleGetMarkupItems),
        await channel.consume(Q_MODEL_PREDICTION_RESULT, handleMarkupPrediction)
    }
});
