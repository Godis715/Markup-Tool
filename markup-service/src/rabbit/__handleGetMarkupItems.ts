import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";
import { getManager } from "typeorm";
import { MarkupItem } from "../entity/MarkupItem";

type MessageContent = {
    markupId: string
};

export default async function handleGetMarkupItems(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content || !msg.properties) {
        return;
    }

    const manager = getManager();

    let msgContent: MessageContent;
    try {
        msgContent = JSON.parse(msg.content.toString());
        console.log("[MARKUP-SERVICE]: recieved request for markup items", msgContent);
    }
    catch (err) {
        console.error("Couldn't parse message content");
        return;
    }

    const currDate = new Date();

    const markupItems = await manager
        .createQueryBuilder(MarkupItem, "mi")
        .select()
        .leftJoinAndSelect("mi.markup", "m")
        .leftJoinAndSelect("mi.datasetItem", "di")
        .where("m.id = :markupId")
        .andWhere("m.createDate <= :timestamp")
        .setParameter("timestamp", currDate.toISOString())
        .setParameter("markupId", msgContent.markupId)
        .getMany();
    
    const processedMarkupItems = markupItems.map((mi) => ({
        id: mi.id,
        result: mi.result,
        datasetItemId: mi.datasetItem.id,
        imageUrl: mi.datasetItem.location
    }));

    channelWrapper.sendToQueue(
        msg.properties.replyTo,
        {
            markupId: msgContent.markupId,
            type: markupItems[0].markup.type,
            items: processedMarkupItems,
            timestamp: currDate.getTime
        }
    );

    channelWrapper.ack(msg);
}
