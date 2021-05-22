import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";
import { queryAutoAnnotation } from "../services/autoAnnotationService/autoAnnotationService";

type MessageContent = {
    markupId: string,
    markupType: string
};

export default async function handleModelTrained(msg: ConsumeMessage | null, replyToQueue: string): Promise<void> {
    if (!msg || !msg.content || !msg.properties) {
        return;
    }

    let msgContent: MessageContent;
    try {
        msgContent = JSON.parse(msg.content.toString());
        console.log("[MARKUP-SERVICE]: recieved model trained msg", msgContent);
    }
    catch (err) {
        console.error("Couldn't parse message content");
        return;
    }

    await queryAutoAnnotation(msgContent.markupId, 3, replyToQueue);

    channelWrapper.ack(msg);
}
