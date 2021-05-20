import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../constants";
import handleGetMarkupItems from "./__handleGetMarkupItems";

const connection = amqp.connect([RABBITMQ_HOST]);

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const EX_VALIDATION_ITEM_CREATED = "validation_item.created";

export const Q_GET_MARKUP_ITEMS = "markup_item.get_all";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        return Promise.all([
            channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true }),
            channel.assertExchange(EX_VALIDATION_ITEM_CREATED, "fanout", { durable: true }),

            channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true }),

            channel.consume(Q_GET_MARKUP_ITEMS, handleGetMarkupItems),
        ]);
    }
});
