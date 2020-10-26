import express from "express";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import extractUserLogin from "../middlewares/extractUserLogin";
import { getManager } from "typeorm";
import { User } from "../entity/User";
import { Dataset } from "../entity/Dataset";
import { DatasetItem } from "../entity/DatasetItem";
import { validateOrReject } from "class-validator";
import validateAllOrReject from "../utils/validateAllOrReject";

/**
 * TODO:
 * Валидация запроса
 */

/**
 * Устанавливаем обработчики, которые проверяют,
 * чтобы количество фактически переданных байтов соответствовало
 * заявленному объему данных.
 * Это помогает бороться с внезапным разрывом связи с клиентом.
 */
async function uploadData(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    // считаем количество полученный байтов
    let writtenLen = 0;
    req.on("data", (data) => writtenLen += data.length);

    // когда содинение закрывается, проверяем количество заявленных и полученных байтов
    req.on("close", () => {
        const totalLength = parseInt(req.header("Content-Length"));
        if (totalLength > writtenLen) {
            next(
                new Error("Connection closed, before data had derived")
            );
        }
    });

    // имя директории, в которую будут загружаться файлы
    const dirName = crypto.randomBytes(10).toString("hex");
    const dirPath = `./${dirName}`;
    // сохраняем путь к директории для последующей работы
    res.locals.dirPath = dirPath;

    // multer будет загружать файлы в dirPath
    const upload = multer({ dest: dirPath }).any();
    upload(req, res, next);
};

async function saveToDB(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    try {
        const manager = getManager();
        const login = res.locals.login;
        // FIX ME: повесить обработчик ошибки
        const user = await manager.findOneOrFail(User, { login }, { relations: ["datasets"] });
    
        // Нужна валидация, возможно, раньше
        const datasetName = req.body["Dataset-Name"];
        const datasetPath = res.locals.dirPath;
    
        const dataset = new Dataset();
        dataset.name = datasetName;
        dataset.user = user;
        dataset.location = datasetPath;
        dataset.items = [];
    
        user.datasets.push(dataset);

        const files = req.files as Express.Multer.File[];
        files.forEach(
            (f) => {
                const datasetItem = new DatasetItem();
                datasetItem.dataset = dataset;
                datasetItem.location = f.path;
                datasetItem.name = f.originalname;
                dataset.items.push(datasetItem);
            }
        );

        try {
            await validateOrReject(dataset, { validationError: { target: false } });
            await validateAllOrReject(dataset.items, { validationError: { target: false } });
        }
        catch(errors) {
            res
                .status(400)
                .send(errors);
            return;
        }

        await manager.transaction(
            async (transactionManager) => {
                await transactionManager.save(user);
                await transactionManager.save(dataset);
                await transactionManager.save(dataset.items);
            }
        );

        res.sendStatus(200);
    }
    catch(err) {
        next(err);
    }
};

/** Финальный обработчик ошибок */
async function handleErrors (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    if (!err) {
        res.sendStatus(200);
        return;
    }

    console.error(err);

    // удалить папку с загружаемыми файлами, в случае ошибки
    fs.rmdir(res.locals.dirPath, { recursive: true }, (err) => {
        if (err) {
            console.error(err);
        }
    });

    res.status(400);
    res.send(err.message);
};

export const post = [
    extractUserLogin,
    uploadData,
    saveToDB
];

export const postHandleErrors = handleErrors;

export async function getAll(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const login: string = response.locals.login;
        const manager = getManager();

        const user = await manager.findOne(User, { login }, { relations: ["datasets"] });

        const dataToSend = user.datasets.map(
            (dataset) => ({
                id: dataset.id,
                name: dataset.name,
                uploadDate: dataset.uploadDate
            })
        );

        response
            .status(200)
            .send(dataToSend);
    }
    catch(err) {
        next(err);
    }
}

export async function getById(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    try {
        const login: string = response.locals.login;
        const datasetId: string = request.params.datasetId;
        const manager = getManager();

        const dataset = await manager.findOne(
            Dataset,
            { id: datasetId },
            { relations: ["user", "markups", "markups.experts"] }
        );

        if (dataset.user.login !== login) {
            response
                .status(403)
                .send("User is not an owner of the dataset");
            return;
        }

        const dataToSend = {
            id: dataset.id,
            name: dataset.name,
            markups: dataset.markups.map(
                (markup) => ({
                    id: markup.id,
                    type: markup.type,
                    experts: markup.experts.map(
                        (expert) => expert.login
                    ),
                    createDate: markup.createDate
                })
            ),
            uploadData: dataset.uploadDate
        };

        response
            .status(200)
            .send(dataToSend);
    }
    catch(err) {
        next(err);
    }
}
