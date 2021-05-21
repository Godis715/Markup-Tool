import { ConsumeMessage } from "amqplib";
import { getRepository } from "typeorm";
import { Model, ModelStatus } from "../../src/entity/Model";

type ModelTrainingFailedMsg = {
    modelId: string
};

export default async function handleModelTrainingFailed(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content) {
        return;
    }

    try {
        const payload = JSON.parse(msg.content.toString()) as ModelTrainingFailedMsg;
        console.log(
            "[MODEL-MANAGER]: Recieved training failed msg",
            payload
        );

        const modelRespository = getRepository(Model);
        const model = await modelRespository.findOneOrFail(payload.modelId);

        model.status = ModelStatus.FAILURE;

        await modelRespository.save(model);
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Error while processing message: ",
            msg.content,
            err
        );
    }
}
