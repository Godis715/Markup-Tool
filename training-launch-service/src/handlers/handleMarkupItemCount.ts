import { ConsumeMessage } from "amqplib";
import processStore, { MarkupItemCountMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleMarkupItemCount(msg: ConsumeMessage | null, sendTo: string, replyTo: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: MarkupItemCountMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved markup items count result",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse message content: ",
            msg.content
        );
        return;
    }

    if (!processStore.addMarkupItemCount(payload)) {
        return;
    }

    if (!processStore.readyToStartTraining(payload.markupId)) {
        // прекращение процесса
        processStore.cleanupMarkupInfo(payload.markupId);
        return;
    }

    console.log("[TRAINING-LAUNCH-SERVICE]: Ready to start model training");

    // запрос на получение выгрузки данных
    channelWrapper.sendToQueue(
        sendTo,
        {
            markupId: payload.markupId,
            timestamp: processStore.getMarkupTimestamp(payload.markupId)
        },
        { replyTo }
    );
}
