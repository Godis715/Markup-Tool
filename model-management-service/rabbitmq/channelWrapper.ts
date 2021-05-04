import  amqp from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import {
    EX_MODEL,
    KEY_MODEL_TRAINING_STARTED,
    KEY_MODEL_TRAINING_SUCCEED,
    RABBITMQ_HOST
} from "../config";
import handleModelTrainingStarted from "./recievers/handleModelTrainingStarted";

const connection = amqp.connect([RABBITMQ_HOST]);

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MODEL, "topic", { durable: true });

        const { queue: modelTrainingSucceedQueue } = await channel.assertQueue("", {
            exclusive: true,
            autoDelete: true 
        });

        const { queue: modelTrainingStartedQueue } = await channel.assertQueue("", {
            exclusive: true,
            autoDelete: true 
        });

        await channel.bindQueue(modelTrainingSucceedQueue, EX_MODEL, KEY_MODEL_TRAINING_SUCCEED);

        await channel.bindQueue(modelTrainingStartedQueue, EX_MODEL, KEY_MODEL_TRAINING_STARTED);

        await channel.consume(modelTrainingStartedQueue, handleModelTrainingStarted);
    }
});
