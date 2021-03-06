import { ConsumeMessage } from "amqplib";
import { getRepository } from "typeorm";
import { Q_MODEL_PREDICT, Q_MODEL_PREDICT_RAW } from "../../config";
import { Model } from "../../src/entity/Model";
import { channelWrapper } from "../channelWrapper";

type PredictMarkupMsg = {
    markupId: string,
    datasetItems: {
        id: string,
        imageUrl: string
    }
};

export default async function handlePredictMarkup(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content) {
        return;
    }

    let payload: PredictMarkupMsg;
    try {
        payload = JSON.parse(msg.content.toString());
        console.log(
            "[MODEL-MANAGER]: Recieved markup predict msg",
            payload
        );

        const model = await getRepository(Model).findOne(
            {
                where: {
                    markupId: payload.markupId
                },
                order: {
                    timestamp: "DESC"
                }
            }
        );

        if (!model) {
            console.log(`[MODEL-MANAGER]: Model for markup ${payload.markupId} not found`);
            return;
        }

        await channelWrapper.sendToQueue(
            Q_MODEL_PREDICT_RAW,
            {
                ...payload,
                weightsPath: model.weightsPath,
                markupType: model.markupType,
                modelId: model.id
            },
            {
                replyTo: msg.properties.replyTo
            }
        );
    }
    catch (err) {
        console.error(
            "[MODEL-MANAGER]: Error happened while processing markup predict message: ",
            msg.content
        );
    }
}
