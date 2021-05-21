import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";
import { getManager } from "typeorm";
import { MarkupItemResult } from "../types/markupItem";
import { Prediction } from "../entity/Prediction";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";

type MessageContent = {
    markupId: string,
    markupType: string,
    modelId: string,
    items: {
        datasetItemId: string,
        result: MarkupItemResult
    }[]
};

export default async function handleMarkupPrediction(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content || !msg.properties) {
        return;
    }

    let msgContent: MessageContent;
    try {
        msgContent = JSON.parse(msg.content.toString());
        console.log("[MARKUP-SERVICE]: recieved request for markup items", msgContent);
    }
    catch (err) {
        console.error("Couldn't parse message content");
        return;
    }

    const manager = getManager();
    const predictions = msgContent.items.map((item) => {
        const pred = new Prediction();
        pred.datasetItem = { id: item.datasetItemId } as DatasetItem;
        pred.markup = { id: msgContent.markupId } as Markup;
        pred.result = item.result;
    });

    await manager.save(predictions);
    channelWrapper.ack(msg);
}
