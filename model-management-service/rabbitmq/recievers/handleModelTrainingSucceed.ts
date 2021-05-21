import { ConsumeMessage } from "amqplib";
import { getRepository } from "typeorm";
import { Model, ModelStatus } from "../../src/entity/Model";

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
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Error while processing message: ",
            msg.content,
            err
        );
    }
}
