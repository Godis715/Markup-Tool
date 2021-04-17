import { ConsumeMessage } from "amqplib";
import processStore, { MarkupItemsMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleMarkupItems(msg: ConsumeMessage | null, sendTo: string, replyTo: string): void {
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

    channelWrapper.sendToQueue(
        sendTo,
        payload,
        { replyTo }
    );
}
