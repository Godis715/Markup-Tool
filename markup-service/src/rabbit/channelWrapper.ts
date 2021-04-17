import amqp  from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import { RABBITMQ_HOST } from "../constants";
import handleGetMarkupItemCount from "./__handleGetMarkupItemCount";
import handleGetMarkupItems from "./__handleGetMarkupItems";

const connection = amqp.connect([RABBITMQ_HOST]);

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const Q_MARKUP_ITEM_COUNT = "markup_item.count";

export const Q_GET_MARKUP_ITEMS = "markup_item.get";

// TODO: перенести в отдельный сервис
export const Q_GET_MODEL_INFO = "model.get_info";

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        return Promise.all([
            channel.assertExchange(EX_MARKUP_ITEM_CREATED, "fanout", { durable: true }),
            channel.assertQueue(Q_MARKUP_ITEM_COUNT, { durable: true }),
            channel.assertQueue(Q_GET_MODEL_INFO, { durable: true }),
            channel.assertQueue(Q_GET_MARKUP_ITEMS, { durable: true }),

            channel.consume(Q_MARKUP_ITEM_COUNT, handleGetMarkupItemCount),
            channel.consume(Q_GET_MARKUP_ITEMS, handleGetMarkupItems),
            channel.consume(Q_GET_MODEL_INFO, (msg) => {
                if (!msg || !msg.content || !msg.properties) {
                    return;
                }

                console.log("[MARKUP-SERVICE]: got request for model info", JSON.parse(msg.content.toString()));

                channelWrapper.sendToQueue(msg.properties.replyTo, {
                    timestamp: new Date(0).getTime(),
                    markupId: JSON.parse(msg.content.toString()).markupId as string,
                    modelId: "1"
                }, {
                    correlationId: msg.properties.correlationId
                })

                channelWrapper.ack(msg);
            })
        ]);
    }
});
