import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";

export default function handleGetMarkupItemCount(msg: ConsumeMessage | null): void {
    if (!msg || !msg.content || !msg.properties) {
        return;
    }

    channelWrapper.sendToQueue(
        msg.properties.replyTo,
        {
            markupItemCount: 10
        },
        {
            correlationId: msg.properties.correlationId
        }
    );
}
