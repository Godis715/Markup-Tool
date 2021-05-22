import { ConsumeMessage } from "amqplib";
import { getRepository } from "typeorm";
import { EX_MODEL, KEY_MODEL_READY } from "../../config";
import { Model, ModelStatus } from "../../src/entity/Model";
import { channelWrapper } from "../channelWrapper";

type ModelTrainingSucceedMsg = {
    modelId: string,
    weightsPath: string
};

export default async function handleModelTrainingSucceed(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content) {
        return;
    }

    try {
        const payload = JSON.parse(msg.content.toString()) as ModelTrainingSucceedMsg;
        console.log(
            "[MODEL-MANAGER]: Recieved training succeed msg",
            payload
        );

        const modelRespository = getRepository(Model);
        const model = await modelRespository.findOneOrFail(payload.modelId);

        model.weightsPath = payload.weightsPath;
        model.status = ModelStatus.READY;

        await modelRespository.save(model);

        await channelWrapper.publish(
            EX_MODEL,
            KEY_MODEL_READY,
            {
                markupId: model.markupId,
                markupType: model.markupType
            }
        );
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Error while processing message: ",
            msg.content,
            err
        );
    }
}
