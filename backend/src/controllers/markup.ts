import { validateOrReject } from "class-validator";
import express, { Request, Response } from "express";
import { getManager } from "typeorm";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { MarkupItem } from "../entity/MarkupItem";
import { User } from "../entity/User";
import { UserRole } from "../enums/appEnums";
import { MarkupForCustomer, MarkupForExpert, MarkupType } from "../types/markup";
import { createObjectCsvStringifier } from "csv-writer";

/**
 * Получение заданий на разметку, в которые назначен данный эксперт
 */
export type GetMarkupForExpertRequestBody = {};
export type GetMarkupForExpertResponseBody = MarkupForExpert[];

export async function getForExpert(
    request: Request,
    response: Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const login = response.locals.login;
        const markups = await manager
            .createQueryBuilder(Markup, "markup")
            .select()
            .leftJoin("markup.experts", "expert")
            .leftJoinAndSelect("markup.dataset", "dataset")
            .leftJoinAndSelect("dataset.user", "user")
            .where("expert.login = :login")
            .setParameter("login", login)
            .getMany();

        const markupData = markups.map(
            (markup) => ({
                id: markup.id,
                type: markup.type,
                owner: markup.dataset.user.login,
                createDate: markup.createDate,
                // TODO: вообще пользователю в более общем случае лучше не отправлять в исходном виде
                config: markup.config,
                description: markup.description,
                datasetName: markup.dataset.name
            })
        );

        response
            .status(200)
            .send(markupData);
    }
    catch(err) {
        next(err);
    }
}

export async function addExpertByLogin(
    request: Request<{ markupId: string }, string, {}, { login: string }>,
    response: Response<string>,
    next: express.NextFunction
) {
    try {
        const manager = getManager();
        const { markupId } = request.params;
        const { login: expertLogin } = request.query;

        const markup = await manager.findOne(Markup, markupId, { relations: ["dataset", "dataset.user", "experts"] });
        if (!markup) {
            response
                .status(404)
                .send(`Markup with id "${markupId} is not found"`);
            return;
        }

        if (markup.dataset.user.login !== response.locals.login) {
            response
                .status(403)
                .send("User is not an author of the dataset");
            return;
        }

        const expert = await manager.findOne(User, { login: expertLogin }, { relations: ["roles"] });
        if (!expert) {
            response
                .status(404)
                .send("Expert is not found");
            return;
        }

        const isExpert = Boolean(expert.roles.find((role) => role.name === UserRole.EXPERT));
        if (!isExpert) {
            response
                .status(400)
                .send(`User with login '${expertLogin} is not an expert'`);
            return;
        }

        markup.experts.push(expert);

        try {
            await validateOrReject(markup, { validationError: { target: false, value: false } });
        }
        catch(errors) {
            response
                .status(400)
                .send(errors);
            return;
        }

        await manager.save(markup);

        response.sendStatus(200);
    }
    catch(err) {
        next(err);
    }
}

export async function getResult(
    request: Request,
    response: Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const markupId: string = request.params.markupId;
        // в какой формат сконвертировать результат
        const resultExt = request.query.ext || "json";

        const markup =  await manager.findOne(
            Markup,
            { id: markupId },
            { relations: ["items", "dataset", "dataset.user", "items.datasetItem"] }
        );

        if (!markup) {
            response
                .status(404)
                .send(`Makrup with id '${markupId}' doesn't exist`);
            return;
        }

        if(markup.dataset.user.login !== response.locals.login) {
            response
                .status(403)
                .send("This user is not an author of the markup");
            return;
        }

        const result = markup.items.map(
            (item) => ({
                url: item.datasetItem.location,
                name: item.datasetItem.name,
                // FIX ME: временное решение
                markup: JSON.stringify(item.result)
            })
        );

        switch(resultExt) {
            case "csv": {
                // TODO: сделать "более умную конвертацию в csv результата (не в виде json значения)"
                const csvStringifier = createObjectCsvStringifier({
                    header: [
                        { id: "url", title: "IMAGE_URL" },
                        { id: "name", title: "ORIGINAL_NAME" },
                        { id: "markup", title: "MARKUP_RESULT" }
                    ]
                });
                const dataToSend = csvStringifier.getHeaderString().concat(csvStringifier.stringifyRecords(result));
                response
                    .status(200)
                    .set({
                        "Content-Disposition": 'attachment; filename="result.csv"',
                        "Content-type": "text/csv"
                    })
                    .send(dataToSend);
                break;
            }
            case "json":
            default: {
                /**
                 * TODO:
                 * сделать подсчет прогресса
                 */
                const dataToSend = JSON.stringify(result);
                    response
                        .status(200)
                        .set({
                            "Content-Disposition": 'attachment; filename="result.json"',
                            "Content-type": "application/json"
                        })
                        .send(dataToSend);
                }
        }

    }
    catch(err) {
        next(err);
    }
}

// разная структура для разных ролей
export async function getMarkupById(
    request: Request<{ markupId: string }, MarkupForCustomer | MarkupForExpert | string>,
    response: Response<MarkupForCustomer | MarkupForExpert | string>,
    next: express.NextFunction
) {
    try {
        const manager = getManager();
        const { login } = response.locals;
        const { markupId } = request.params;

        let markup: Markup;
        try {
            markup = await manager.findOneOrFail(Markup, markupId, { relations: ["dataset", "dataset.user", "experts"] });
        }
        catch(err) {
            response.sendStatus(404);
        }

        const user = await manager.findOneOrFail(User, { login }, { relations: ["roles"] });
        const roles = user.roles.map(({ name }) => name);

        if (roles.includes(UserRole.CUSTOMER)) {
            const totalDatasetItems = await manager.count(DatasetItem, {
                where: {
                    dataset: { id: markup.dataset.id }
                }
            });
            const totalMarkupItems = await manager.count(MarkupItem, {
                where: {
                    markup: { id: markup.id }
                }
            });
            const markupData: MarkupForCustomer = {
                id: markup.id,
                type: markup.type as MarkupType,
                config: markup.config,
                createDate: markup.createDate,
                description: markup.description,
                experts: markup.experts.map(({ login }) => login),
                progress: {
                    all: totalDatasetItems,
                    done: totalMarkupItems
                }
            };

            response
                .status(200)
                .send(markupData);
        }
        else if (roles.includes(UserRole.EXPERT)) {
            const markupData: MarkupForExpert = {
                id: markup.id,
                type: markup.type as MarkupType,
                config: markup.config,
                createDate: markup.createDate,
                description: markup.description,
                owner: markup.dataset.user.login,
                datasetName: markup.dataset.name
            };

            response
                .status(200)
                .send(markupData);
        }
        else {
            response.status(403);
        }
    }
    catch(err) {
        next(err);
    }
}
