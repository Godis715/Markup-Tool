import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../config";
import handleMarkupItemCreated from "../handlers/handleMarkupItemCreated";

const connection = amqp.connect([`amqp://${RABBITMQ_HOST}`]);

export const MARKUP_ITEM_CREATED_EXCHANGE = "markup.created";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(MARKUP_ITEM_CREATED_EXCHANGE, "fanout", { durable: true });

        const { queue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        await channel.bindQueue(queue, MARKUP_ITEM_CREATED_EXCHANGE, "");

        await channel.consume(queue, handleMarkupItemCreated);
    }
});
