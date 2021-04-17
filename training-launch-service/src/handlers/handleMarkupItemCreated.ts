import { ConsumeMessage, ConfirmChannel } from "amqplib";

type MarkupItemCreatedMsg = {
    expertId: string,
    markupId: string,
    marupItemId: string,
    // FIXME: написать типы более конкретно
    type: string
};

export default async function handleMarkupItemCreated(msg1: ConsumeMessage | null, replyTo: string, channel: ConfirmChannel): void {
    if (!msg1 || !msg1.content) {
        return;
    }

    let payload: MarkupItemCreatedMsg;
    try {
        payload = JSON.parse(msg1.content.toString());
    }
    catch (err) {
        console.error("[TRAINING-LAUNCH-SERVICE]: Couldn't parse message content: ", msg1.content);
        return;
    }

    console.log("[TRAINING-LAUNCH-SERVICE]", payload);
    // Тепеь нужно сделать два RPC вызова - получить количество разметок пользователей -- MarkupService
    // Получить актуальные данные по модели -- к ModelManagementService

    await channel.consume(replyTo, (msg2) => {
        
    });
}
