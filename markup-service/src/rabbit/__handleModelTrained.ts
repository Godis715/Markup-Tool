import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";
import { getManager } from "typeorm";
import { MarkupItem } from "../entity/MarkupItem";
import { DatasetItem } from "../entity/DatasetItem";
import { Q_MODEL_PREDICT } from "../constants";

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

    const manager = getManager();
    const datasetItemSubQb = manager
        .createQueryBuilder()
        .select("di")
        .from(DatasetItem, "di")
        .leftJoin("di.dataset", "d")
        .leftJoin("d.markups", "m")
        .where("m.id = :markupId")
        .andWhere(
            (qb) => {
                const subQuery = qb
                    .subQuery()
                    .select("di_2.id")
                    .from(MarkupItem, "mi")
                    .leftJoin("mi.markup", "m")
                    .leftJoin("mi.datasetItem", "di_2")
                    .where("m.id = :markupId")
                    .getQuery();
            
                return `di.id NOT IN ${subQuery}`;
            }
        )
        .orderBy("RANDOM()")
        .limit(3)
        .setParameter("markupId", msgContent.markupId);

    const datasetItems = await datasetItemSubQb.getMany();

    if (datasetItems.length === 0) {
        channelWrapper.ack(msg);
        return;
    }

    const predictMarkupMsg = {
        markupId: msgContent.markupId,
        markupType: msgContent.markupType,
        datasetItems: datasetItems.map((item) => ({
            datasetItemId: item.id,
            imageUrl: item.location
        }))
    };

    await channelWrapper.sendToQueue(
        Q_MODEL_PREDICT,
        predictMarkupMsg,
        {
            replyTo: replyToQueue
        }
    );

    channelWrapper.ack(msg);
}
