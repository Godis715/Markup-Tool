import  amqp from "amqp-connection-manager";
import { ConfirmChannel } from "amqplib";
import {
    EX_MODEL,
    KEY_MODEL_READY,
    KEY_MODEL_TRAINING_FAILED,
    KEY_MODEL_TRAINING_STARTED,
    KEY_MODEL_TRAINING_SUCCEED,
    Q_MODEL_PREDICT,
    Q_MODEL_PREDICT_RAW,
    RABBITMQ_HOST
} from "../config";
import handleModelTrainingFailed from "./recievers/handleModelTrainingFailed";
import handleModelTrainingStarted from "./recievers/handleModelTrainingStarted";
import handleModelTrainingSucceed from "./recievers/handleModelTrainingSucceed";
import handlePredictMarkup from "./recievers/handlePredictMarkup";

const connection = amqp.connect([RABBITMQ_HOST]);

export const channelWrapper = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EX_MODEL, "topic", { durable: true });

        await channel.assertQueue(Q_MODEL_PREDICT, { durable: true });
        await channel.assertQueue(Q_MODEL_PREDICT_RAW, { durable: true });

        const { queue: modelTrainingSucceedQueue } = await channel.assertQueue("", {
            exclusive: true,
            autoDelete: true 
        });

        const { queue: modelTrainingFailedQueue } = await channel.assertQueue("", {
            exclusive: true,
            autoDelete: true 
        });


        const { queue: modelTrainingStartedQueue } = await channel.assertQueue("", {
            exclusive: true,
            autoDelete: true 
        });

        await channel.bindQueue(modelTrainingSucceedQueue, EX_MODEL, KEY_MODEL_TRAINING_SUCCEED);
        await channel.bindQueue(modelTrainingFailedQueue, EX_MODEL, KEY_MODEL_TRAINING_FAILED);
        await channel.bindQueue(modelTrainingStartedQueue, EX_MODEL, KEY_MODEL_TRAINING_STARTED);

        await channel.consume(modelTrainingStartedQueue, handleModelTrainingStarted);
        await channel.consume(Q_MODEL_PREDICT, handlePredictMarkup);
        await channel.consume(modelTrainingSucceedQueue, handleModelTrainingSucceed);
        await channel.consume(modelTrainingFailedQueue, handleModelTrainingFailed);
    }
});
function EX_MODEL_READY(EX_MODEL_READY: any, arg1: string, arg2: { durable: true; }) {
    throw new Error("Function not implemented.");
}

