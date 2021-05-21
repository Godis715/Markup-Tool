import { ConsumeMessage } from "amqplib";
import { getManager } from "typeorm";
import { Model, ModelStatus } from "../../src/entity/Model";

type ModelTrainingStartedMsg = {
    modelId: string,
    markupId: string,
    type: string,
    timestamp: number
};

export default async function handleModelTrainingStarted(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content) {
        return;
    }

    let payload: ModelTrainingStartedMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[MODEL-MANAGER]: Recieved training started msg",
            payload
        );

        const model = new Model();
        model.id = payload.modelId;
        model.markupId = payload.markupId;
        model.status = ModelStatus.TRAINING;
        model.markupType = payload.type;
        model.timestamp = new Date(payload.timestamp);

        await getManager().save(model);
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Couldn't parse training started message: ",
            msg.content
        );
        return;
    }
}
