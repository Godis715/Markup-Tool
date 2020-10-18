import { validateOrReject } from "class-validator";
import express from "express";
import { getManager } from "typeorm";
import { Dataset } from "../entity/Dataset";
import { Markup } from "../entity/Markup";
import { User } from "../entity/User";
import { UserRole } from "../enums/appEnums";

/**
 * TODO:
 * валидация запроса
 */
export async function postDatasetMarkup(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const datasetId = request.params.datasetId;
        const type = request.query.type as string;
        const { login } = response.locals;
        
        const dataset = await manager.findOne(
            Dataset,
            { id: datasetId },
            { relations: ["user", "markups"] }
        );

        if (!dataset) {
            response
                .status(400)
                .send(`Dataset with id '${datasetId}' doesn't exist`);
            return;       
        }

        if (dataset.user.login !== login) {
            response
                .status(403)
                .send("This user is not an author of the dataset");
            return;
        }
        
        const markup = new Markup();
        markup.dataset = dataset;
        markup.type = type;

        try {
            await validateOrReject(markup, { validationError: { target: false } });
        }
        catch(errors) {
            response
                .status(400)
                .send(errors);
            return;
        }
    
        dataset.markups.push(markup);
    
        await manager.transaction(
            async (manager) => {
                await manager.save(markup);
                await manager.save(dataset);
            }
        );
    
        response.sendStatus(200);
    }
    catch(err) {
        next(err);
    }
}

export async function getDatasetMarkup(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const datasetId = request.params.datasetId;
        const { login } = response.locals;
        
        const dataset = await manager.findOneOrFail(
            Dataset,
            { id: datasetId },
            { relations: ["user", "markups"] }
        );

        if (!dataset) {
            response
                .status(400)
                .send(`Dataset with id '${datasetId}' doesn't exist`);
            return;
        }

        if (dataset.user.login !== login) {
            response
                .status(400)
                .send("This user is not an author of the dataset");
            return;
        }
        
        const markupData = dataset.markups.map(
            (markup) => ({
                id: markup.id
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

export async function getForExpert(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const login = response.locals.login;
        const user = await manager.findOne(
            User,
            { login },
            { relations: ["markups"] }
        );

        if (!user) {
            response
                .status(400)
                .send(`User with login '${login}' doesn't exist`);
            return;
        }

        const markupData = user.relatedMarkups.map(
            (markup) => ({
                id: markup.id
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

/**
 * TODO:
 * подумать, может, стоит разделить на два метода:
 * удалить экспертов, добавить экспертов
 */
export async function updateExperts(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();

        const login: string = response.locals.login;
        const markupId: string = request.params.markupId;
        const toAdd: string[] = request.body.toAdd || [];
        const toRemove: string[] = request.body.toRemove || [];

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

        // поиск пользователей, которых нужно добавить, но они уже добавлены
        const alreadyAddedIds = toAdd.filter(
            (id) => markup.experts.some((user) => user.id === id)
        );

        if (alreadyAddedIds.length > 0) {
            response
                .status(400)
                .send(`These experts are already added: ${alreadyAddedIds}`);
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
