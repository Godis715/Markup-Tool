import { ConsumeMessage } from "amqplib";
import { MarkupItemsMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";
import { Q_RESULT_INFERENCE } from "../config";

export default function handleMarkupItems(msg: ConsumeMessage | null, resultInferenceQueue: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: MarkupItemsMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved markup items: ",
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

    channelWrapper.sendToQueue(Q_RESULT_INFERENCE, payload, {
        replyTo: resultInferenceQueue
    });
}
