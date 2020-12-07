import express from "express";
import { validateOrReject } from "class-validator";
import { createObjectCsvStringifier } from "csv-writer";
import {
    JsonController,
    Get,
    CurrentUser,
    Put,
    Param,
    ForbiddenError,
    NotFoundError,
    BadRequestError,
    Authorized,
    QueryParam,
    Res, OnUndefined
} from "routing-controllers";
import { getManager } from "typeorm";
import { DatasetItem } from "../entity/DatasetItem";
import { Markup } from "../entity/Markup";
import { MarkupItem } from "../entity/MarkupItem";
import { User } from "../entity/User";
import { UserRole } from "../enums/appEnums";
import { MarkupForCustomer, MarkupForExpert, MarkupType } from "../types/markup";

@JsonController("/api/markup")
export class MarkupController {
    @Get()
    @Authorized(UserRole.EXPERT)
    async getAllForExpert(@CurrentUser({ required: true }) user: User) {
        const manager = getManager();

        const markups = await manager
            .createQueryBuilder(Markup, "markup")
            .select()
            .leftJoin("markup.experts", "expert")
            .leftJoinAndSelect("markup.dataset", "dataset")
            .leftJoinAndSelect("dataset.user", "user")
            .where("expert.login = :login")
            .setParameter("login", user.login)
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

        return markupData;
    }

    @Put("/:markupId/experts")
    @OnUndefined(200)
    @Authorized(UserRole.CUSTOMER)
    async addExpertByLogin(
        @Param("markupId") markupId: string,
        @QueryParam("login") expertLogin: string,
        @CurrentUser({ required: true }) user: User
    ) {
        const manager = getManager();

        const markup = await manager.findOne(Markup, markupId, { relations: ["dataset", "dataset.user", "experts"] });
        if (!markup) {
            throw new NotFoundError(`Markup with id "${markupId} is not found"`);
        }

        if (markup.dataset.user.id !== user.id) {
            throw new ForbiddenError("User is not an author of the dataset");
        }

        const expert = await manager.findOne(User, { login: expertLogin }, { relations: ["roles"] });
        if (!expert) {
            throw new NotFoundError("Expert is not found");
        }

        const isExpert = Boolean(expert.roles.find((role) => role.name === UserRole.EXPERT));
        if (!isExpert) {
            throw new BadRequestError(`User with login '${expertLogin} is not an expert'`);
        }

        markup.experts.push(expert);

        try {
            await validateOrReject(markup, { validationError: { target: false, value: false } });
        }
        catch(errors) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        await manager.save(markup);
    }

    @Get("/:markupId")
    async getMarkupById(
        @CurrentUser({ required: true }) user: User,
        @Param("markupId") markupId: string
    ) {
        const manager = getManager();

        const markup = await manager.findOne(Markup, markupId, { relations: ["dataset", "dataset.user", "experts"] });
        if (!markup) {
            return null;
        }

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
    
            return markupData;
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
    
            return markupData;
        }
        else {
            throw new ForbiddenError();
        }
    }

    @Get("/:markupId/result")
    @Authorized(UserRole.CUSTOMER)
    async downloadResult(
        @Res() response: express.Response,
        @CurrentUser({ required: true }) user: User,
        @Param("markupId") markupId: string,
        // в какой формат сконвертировать результат
        @QueryParam("ext") resultExt: "json" | "csv" = "json"
    ) {
        const manager = getManager();
        const markup =  await manager.findOne(
            Markup,
            { id: markupId },
            { relations: ["items", "dataset", "dataset.user", "items.datasetItem"] }
        );

        if (!markup) {
            throw new NotFoundError(`Makrup with id '${markupId}' doesn't exist`);
        }

        if(markup.dataset.user.id !== user.id) {
            throw new ForbiddenError("This user is not an author of the markup");
        }

        switch(resultExt) {
            case "csv": {
                const result = markup.items.map(
                    (item) => ({
                        url: item.datasetItem.location,
                        name: item.datasetItem.name,
                        markup: JSON.stringify(item.result)
                    })
                );
                // TODO: сделать "более умную конвертацию в csv результата (не в виде json значения)"
                const csvStringifier = createObjectCsvStringifier({
                    header: [
                        { id: "url", title: "IMAGE_URL" },
                        { id: "name", title: "ORIGINAL_NAME" },
                        { id: "markup", title: "MARKUP_RESULT" }
                    ]
                });
                const dataToSend = csvStringifier.getHeaderString().concat(csvStringifier.stringifyRecords(result));
                response.set({
                    "Content-Disposition": 'attachment; filename="result.csv"',
                    "Content-type": "text/csv"
                });

                return Buffer.from(dataToSend);
            }
            case "json":
            default: {
                const result = markup.items.map(
                    (item) => ({
                        url: item.datasetItem.location,
                        name: item.datasetItem.name,
                        markup: item.result
                    })
                );
                /**
                 * TODO:
                 * сделать подсчет прогресса
                 */
                const dataToSend = JSON.stringify(result);
                response.set({
                    "Content-Disposition": 'attachment; filename="result.json"',
                    "Content-type": "application/json"
                });

                return Buffer.from(dataToSend);
            }
        }
    }
}
