import { ConsumeMessage } from "amqplib";
import { channelWrapper } from "./channelWrapper";
import { getManager } from "typeorm";
import { MarkupItem } from "../entity/MarkupItem";

type MessageContent = {
    // это должны быть именно timestamp
    fromTimestamp?: number,
    toTimestamp?: number,
    markupId: string
};

export default async function handleGetMarkupItemCount(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !msg.content || !msg.properties) {
        return;
    }

    const manager = getManager();

    let msgContent: MessageContent;
    try {
        msgContent = JSON.parse(msg.content.toString());
        console.log("[MARKUP-SERVICE]: recieved message for markup items count", msgContent);
    }
    catch (err) {
        console.error("Couldn't parse message content");
        return;
    }

    // здесь идет формирование запроса к БД на получение таких markupItem определенного markup
    // которые были созданы в промежуток времени [fromTimestamp, toTimestamp]
    // если какое-то значение из этих двух не указано - тогда ищется односторонний интервал
    const queryBuilder = manager
        .createQueryBuilder(MarkupItem, "mi")
        .select()
        .leftJoin("mi.markup", "m")
        .where("m.id = :markupId");

    if (msgContent.fromTimestamp) {
        queryBuilder.andWhere("mi.createDate >= :fromDate")
    }

    if (msgContent.toTimestamp) {
        queryBuilder.andWhere("mi.createDate <= :toDate")
    }

    const markupItemCount = await queryBuilder
        .setParameter("markupId", msgContent.markupId)
        .setParameter("fromDate", msgContent.fromTimestamp && new Date(msgContent.fromTimestamp).toISOString())
        .setParameter("toDate", msgContent.toTimestamp && new Date(msgContent.toTimestamp).toISOString())
        .getCount();

    channelWrapper.sendToQueue(
        msg.properties.replyTo,
        {
            count: markupItemCount,
            markupId: msgContent.markupId
        },
        { correlationId: msg.properties.correlationId }
    );

    channelWrapper.ack(msg);
}
