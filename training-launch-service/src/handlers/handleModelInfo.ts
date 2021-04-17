import { ConsumeMessage } from "amqplib";
import processStore, { ModelInfoMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleModelInfo(msg: ConsumeMessage | null, sendTo: string, replyTo: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: ModelInfoMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved model info: ",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse model info message: ",
            msg.content
        );
        return;
    }

    if(!processStore.addModelInfo(payload)) {
        return;
    }

    channelWrapper.sendToQueue(
        sendTo,
        {
            markupId: payload.markupId,
            timestampFrom: payload.timestamp,
            timestampTo: processStore.getMarkupTimestamp(payload.markupId)
        },
        { replyTo }
    )
}
