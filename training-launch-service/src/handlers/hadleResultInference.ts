import { ConsumeMessage } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import processStore, { InferencedResultsMsg } from "../store/processStore";
import { channelWrapper } from "../rabbit/channelWrapper";
import { EX_MODEL, KEY_MODEL_TRAINING_STARTED, Q_START_MODEL_TRAINING } from "../config";

/**
 * Здесь не делается проверка на то, что если пришел результат какого-то вывода, то
 * надо проверить, а вообще корректно ли это сообщение. Считается, что результат корректен
 * и нужно запустить обучение модели после этого сообщения
 */
export default function handleResultInference(msg: ConsumeMessage | null): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: InferencedResultsMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved result inference",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse result inference: ",
            msg.content
        );
        return;
    }

    const { markupId, type } = payload;
    // здесь создается ID модели
    const modelId = uuidv4();

    processStore.handleStartTraining(markupId);

    // уведомление о том, что обучение началось
    channelWrapper.publish(EX_MODEL, KEY_MODEL_TRAINING_STARTED, {
        modelId,
        markupId,
        type
    });

    /**
     * В сервис обучения модели отправляется markupId и modelId, т.к.
     * без них может потеряться привязка модели к разметке, что очень плохо.
     * 
     * Например, modelId мог не записаться в базу сервиса управления моделями
     * Тогда результат обучения пропадет
     */
    channelWrapper.sendToQueue(Q_START_MODEL_TRAINING, {
        modelId,
        markupId,
        type
    });
}
