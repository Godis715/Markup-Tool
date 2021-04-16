import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../constants";

const connection = amqp.connect([`amqp://${RABBITMQ_HOST}`]);

export const MARKUP_ITEM_CREATED_EXCHANGE = "markup.created";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        return Promise.all([
            channel.assertExchange(MARKUP_ITEM_CREATED_EXCHANGE, "fanout", { durable: true })
        ]);
    }
});
