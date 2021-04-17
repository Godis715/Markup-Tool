import { ConsumeMessage } from "amqplib";
import processStore, { InferencedResultsMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";

export default function handleResultInference(msg: ConsumeMessage | null, sendTo: string, replyTo: string): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: InferencedResultsMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved result inference",
            msg.content
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse result inference: ",
            msg.content
        );
        return;
    }

    if(!processStore.addInferencedResults(payload)) {
        return;
    }

    channelWrapper.sendToQueue(
        sendTo,
        {
            markupId: payload.markupId,
            type: payload.type
        },
        { replyTo }
    );
}
