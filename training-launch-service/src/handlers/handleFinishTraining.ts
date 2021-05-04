import { ConsumeMessage } from "amqplib";
import processStore, { TrainingFinishedMsg } from "../store/processStore";

export default function handleFinishTraining(msg: ConsumeMessage | null): void {
    if (!msg || !msg.content) {
        return;
    }

    let payload: TrainingFinishedMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[TRAINING-LAUNCH-SERVICE]: Recieved training finished msg",
            payload
        );
    }
    catch (err) {
        console.error(
            "[TRAINING-LAUNCH-SERVICE]: Couldn't parse training finished message: ",
            msg.content
        );
        return;
    }

    const { markupId } = payload;

    processStore.handleFinishTraining(markupId);
}
