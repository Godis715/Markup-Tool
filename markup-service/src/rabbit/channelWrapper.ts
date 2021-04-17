import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../constants";
import handleGetMarkupItemCount from "./__handleGetMarkupItemCount";

const connection = amqp.connect([RABBITMQ_HOST]);

export const MARKUP_ITEM_CREATED_EXCHANGE = "markup.created";

export const MARKUP_ITEM_COUNT_QUEUE = "markup_item_count";

// TODO: перенести в отдельный сервис
export const MARKUP_MODEL_QUEUE = "markup_model";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        return Promise.all([
            channel.assertExchange(MARKUP_ITEM_CREATED_EXCHANGE, "fanout", { durable: true }),
            channel.assertQueue(MARKUP_ITEM_COUNT_QUEUE, { durable: true }),
            channel.assertQueue(MARKUP_MODEL_QUEUE, { durable: true }),

            channel.consume(MARKUP_ITEM_COUNT_QUEUE, handleGetMarkupItemCount),
            channel.consume(MARKUP_MODEL_QUEUE, (msg) => {
                if (!msg || !msg.content || !msg.properties) {
                    return;
                }

                channelWrapper.sendToQueue(msg.properties.replyTo, {
                    markupsDone: 20
                }, {
                    correlationId: msg.properties.correlationId
                })
            })
        ]);
    }
});
