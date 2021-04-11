import { Channel } from "amqplib/callback_api";
import { getManager } from "typeorm";
import { Model } from "../../src/entity/Model";

const queue = "model.get-status";
type RequestBody = {
    markupId: string
};

type ResponseBody = {
    markupId: string,
    status: string,
    modelId: string
} | {
    markupId: string,
    status: null,
    modelId: null
};

export default function subscribeGetModelStatus(channel: Channel): void {
    channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    channel.consume(queue, async (inMsg) => {
        if (!inMsg) {
            return;
        }

        console.log("[MODEL-MANAGER]: message recieved", inMsg);

        const request = JSON.parse(inMsg.content.toString()) as RequestBody;

        const manager = getManager();
        const modelSubQb = manager
            .createQueryBuilder()
            .select("model")
            .from(Model, "model")
            .where("model.markupId = :markupId")
            .orderBy("model.timestamp", "DESC")
            .setParameter("markupId", request.markupId);

        const model = await modelSubQb.getOne();

        let response: ResponseBody;
        if (!model) {
            response = {
                markupId: request.markupId,
                modelId: null,
                status: null
            };
        }
        else {
            response = {
                markupId: request.markupId,
                modelId: model.id,
                status: model.status.toString()
            }
        }

        channel.sendToQueue(
            inMsg.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            { correlationId: inMsg.properties.correlationId }
        );

        channel.ack(inMsg);
    });
}
