import { validateOrReject } from "class-validator";
import express, { Request, Response } from "express";
import { getManager } from "typeorm";
import { Markup } from "../entity/Markup";
import { User } from "../entity/User";
import { UserRole } from "../enums/appEnums";
import { MarkupConfig, MarkupForExpert, MarkupType } from "../types/markup";

/**
 * Получение заданий на разметку, в которые назначен данный эксперт
 */
export type GetMarkupForExpertRequestBody = {};
export type GetMarkupForExpertResponseBody = MarkupForExpert[];
type GetMarkupForExpertParams = {};

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
                config: markup.config
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

export type PostExpertsRequestBody = {
    toAdd?: string[],
    toRemove?: string[]
};
export type PostExpertsResponseBody = string;
export type PostExpertsParams = { markupId: string };
/**
 * TODO:
 * подумать, может, стоит разделить на два метода:
 * удалить экспертов, добавить экспертов
 */
export async function updateExperts(
    request: Request<PostExpertsParams, PostExpertsResponseBody, PostExpertsRequestBody>,
    response: Response<PostExpertsResponseBody>,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const login: string = response.locals.login;
        const markupId = request.params.markupId;
        const toAdd = request.body.toAdd || [];
        const toRemove = request.body.toRemove || [];

        // уникальные id из списков toAdd, toRemove
        const userIds = [...new Set(toAdd.concat(toRemove))];
        // все пользователи с переданнами айдишниками
        const users = await manager.find(User, {
            relations: ["roles"],
            where: userIds.map((id) => ({ id }))
        });

        // проверка, все ли пользователи нашлись
        if (userIds.length !== users.length) {
            response
                .status(400)
                .send("Not all user ids are valid");
            return;
        }

        // поиск пользователь не-экспертов
        const nonExpertIds = users
            .filter(
                (user) => !user.roles
                    .map(({ name }) => name)
                    .includes(UserRole.EXPERT)
            )
            .map(({ id }) => id);

        if (nonExpertIds.length > 0) {
            response
                .status(400)
                .send(`Not all users have expert rights: ${nonExpertIds}`);
            return;
        }

        const markup = await manager.findOne(
            Markup,
            { id: markupId },
            { relations: ["experts", "dataset", "dataset.user"] }
        );
        if (!markup) {
            response
                .status(400)
                .send(`Markup with id '${markupId}' doesn't exist`);
            return;       
        }

        // проверка, является ли пользователь создателем
        if (markup.dataset.user.login !== login) {
            response
                .status(403)
                .send("This user is not an author of the markup");
            return; 
        }

        // поиск поьзователей, которых нужно удалить, но их и не было в списке экспертов
        const notPresentedIds = toRemove.filter(
            (id) => !markup.experts.some((user) => user.id === id)
        );

        if (notPresentedIds.length > 0) {
            response
                .status(400)
                .send(`These experts are not participants: ${notPresentedIds}`);
            return; 
        }

        // сначала удаляем пользователей, потом добавляем
        markup.experts = markup.experts.filter(({ id }) => !toRemove.includes(id));
        markup.experts = toAdd
            .map(
                (id) => users.find((user) => user.id === id)
            )
            .concat(markup.experts);

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
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const login: string = response.locals.login;
        const markupId: string = request.params.markupId;
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

        if(markup.dataset.user.login !== login) {
            response
                .status(403)
                .send("This user is not an author of the markup");
            return;
        }

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
        response
            .status(200)
            .send({ result });
    }
    catch(err) {
        next(err);
    }
}
