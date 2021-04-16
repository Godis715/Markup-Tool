import { ConsumeMessage } from "amqplib";

type MarkupItemCreatedMsg = {
    expertId: string,
    markupId: string,
    marupItemId: string,
    // FIXME: написать типы более конкретно
    type: string
};

export default function handleMarkupItemCreated(msg: ConsumeMessage | null): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: MarkupItemCreatedMsg;
    try {
        payload = JSON.parse(msg.content.toString());
    }
    catch (err) {
        console.error("[TRAINING-LAUNCH-SERVICE]: Couldn't parse message content: ", msg.content);
        return;
    }

    console.log("[TRAINING-LAUNCH-SERVICE]", payload);
}
