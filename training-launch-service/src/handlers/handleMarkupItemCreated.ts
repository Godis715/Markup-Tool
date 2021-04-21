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

    const { markupId } = payload;
    processStore.handleMarkupItemCreated(markupId);

    // если пока что не нужно запускать обучение моделей, останавливаем дальнейшую
    // работу и выходим из функции
    if(!processStore.isReadyToStartTraining(payload.markupId)) {
        return;
    }

    // если было принято решение запускать обучение
    // отправляется запрос на выгрузку данных из main-service
    channelWrapper.sendToQueue(
        sendTo,
        { markupId },
        { replyTo }
    );
}
