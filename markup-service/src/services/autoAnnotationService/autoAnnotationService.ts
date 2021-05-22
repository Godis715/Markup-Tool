import { getManager } from "typeorm";
import { Q_MODEL_PREDICT } from "../../constants";
import { DatasetItem } from "../../entity/DatasetItem";
import { Markup } from "../../entity/Markup";
import { MarkupItem } from "../../entity/MarkupItem";
import { Vote } from "../../entity/Vote";
import { channelWrapper } from "../../rabbit/channelWrapper";

export async function queryAutoAnnotation(markupId: string, numItems: number, replyToQueue: string): Promise<void> {
    const manager = getManager();

    const markup = await manager.findOne(Markup, markupId);
    if (!markup) {
        throw new Error(`Markup ${markupId} doesn't exist!`);
    }

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
                    .leftJoin("mi.markup", "m_2")
                    .leftJoin("mi.datasetItem", "di_2")
                    .where("m_2.id = :markupId")
                    .getQuery();
            
                return `di.id NOT IN ${subQuery}`;
            }
        )
        // условие на то, чтобы не было уже сделанного прогноза на этот datasetItem
        .andWhere(
            (qb) => {
                const subQuery = qb
                    .subQuery()
                    .select("di_2.id")
                    .from(Vote, "vote")
                    .leftJoin("vote.prediction", "pred")
                    .leftJoin("pred.markup", "m_2")
                    .leftJoin("pred.datasetItem", "di_2")
                    .where("m_2.id = :markupId")
                    .getQuery();
            
                return `di.id NOT IN ${subQuery}`;
            }
        )
        .orderBy("RANDOM()")
        .limit(numItems)
        .setParameter("markupId", markup.id);

    const datasetItems = await datasetItemSubQb.getMany();

    if (datasetItems.length === 0) {
        return;
    }

    const predictMarkupMsg = {
        markupId: markup.id,
        markupType: markup.type,
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
}

export async function getActualModelAccuracy(markupId: string): Promise<number> {
    const manager = getManager();

    /*
    SELECT AVG(isCorrect::int) FROM (
        SELECT AVG("isCorrect"::int) >= 0.5 as isCorrect, "predictionId", "modelId" FROM vote
        LEFT JOIN prediction ON prediction."id" = "predictionId"
        GROUP BY "predictionId", "modelId"
        ) subQ
    WHERE "modelId" = $1
    */

    const { accuracy } = await manager
        .createQueryBuilder()
        .select("AVG(is_correct::int)", "accuracy")
        .from(
            (qb) => qb
                .select('AVG(vote."isCorrect"::int) >= :voteThreshold', "is_correct")
                .addSelect("pred.modelId", "model_id")
                .addSelect('pred."createDate"', "create_date")
                .from(Vote, "vote")
                .leftJoin("vote.prediction", "pred")
                .leftJoin("pred.markup", "markup")
                .where("markup.id = :markupId")
                .groupBy("pred.id")
                .having("COUNT(*) >= :minVotes"),
            "subQ"
        )
        .groupBy('model_id')
        .orderBy('MIN(create_date)', "DESC")
        .setParameter("markupId", markupId)
        .setParameter("voteThreshold", 0.5)
        .setParameter("minVotes", 3)
        .getRawOne<{ accuracy: string }>();

    return parseFloat(accuracy);
}

export async function isPredsCompleted(markupId: string): Promise<boolean> {
    const manager = getManager();

    const { is_completed: isCompleted } = await manager
            .createQueryBuilder()
            .select("bool_and(is_pred_completed)", "is_completed")
            .from(
                (qb) => qb
                    .select("pred.modelId", "model_id")
                    .addSelect('pred."createDate"', "create_date")
                    .addSelect("COUNT(*) >= :minVotes", "is_pred_completed")
                    .from(Vote, "vote")
                    .leftJoin("vote.prediction", "pred")
                    .leftJoin("pred.markup", "markup")
                    .where("markup.id = :markupId")
                    .groupBy("pred.id"),
                "subQ"
            )
            .groupBy('model_id')
            .orderBy('MIN(create_date)', "DESC")
            .setParameter("markupId", markupId)
            .setParameter("minVotes", 3)
            .getRawOne<{ is_completed: boolean }>();

    return isCompleted;
}

export async function shouldRequestMorePredictions(markupId: string): Promise<boolean> {
    const isCompleted = await isPredsCompleted(markupId);

    console.log("Is completed: ", isCompleted);

    if (!isCompleted) {
        return false;
    }

    const accuracy = await getActualModelAccuracy(markupId);
    console.log("Actual model accuracy: ", accuracy);

    return accuracy > 0.5;
}
