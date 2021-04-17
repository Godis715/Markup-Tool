import { ConsumeMessage } from "amqplib";
import processStore, { MarkupItemCreatedMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleMarkupItemCreated(msg: ConsumeMessage | null, sendTo: string, replyTo: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: MarkupItemCreatedMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved markup item created message: ",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse markup item created message: ",
            msg.content
        );
        return;
    }

    if(!processStore.startProcessingMarkup(payload.markupId)) {
        return;
    }

    channelWrapper.sendToQueue(
        sendTo,
        { markupId: payload.markupId },
        { replyTo }
    );
}
