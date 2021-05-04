import { ConsumeMessage } from "amqplib";

type ModelTrainingStartedMsg = {
    modelId: string,
    markupId: string,
    type: string
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
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Couldn't parse training started message: ",
            msg.content
        );
        return;
    }
}
