import { ConsumeMessage } from "amqplib";
import processStore, { CreatedModelMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleModelCreated(msg: ConsumeMessage | null, sendTo: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: CreatedModelMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved model created message: ",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Coludn't parse model created message: ",
            msg.content
        );
        return;
    }

    const dataForTraining = processStore.getDataForTraining(payload.markupId);
    if (!dataForTraining) {
        return;
    }

    processStore.cleanupMarkupInfo(payload.markupId);

    console.log("[TRAINING-LAUNCH-SERVICE]: Starting model training")

    channelWrapper.sendToQueue(sendTo, {
        modelId: payload.modelId,
        markupId: payload.markupId,
        type: dataForTraining.type,
        data: dataForTraining.items
    });
}
