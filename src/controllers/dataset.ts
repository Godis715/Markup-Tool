import express from "express";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import extractUserLogin from "../middlewares/extractUserLogin";
import { createConnection } from "typeorm";
import { User } from "../entity/User";
import { Dataset } from "../entity/Dataset";
import { DatasetItem } from "../entity/DatasetItem";

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

    // когда содинение закрывается, провеверяем количество заявленных и полученных байтов
    req.on("close", () => {
        const totalLength = parseInt(req.header("Content-Length"));
        if (totalLength > writtenLen) {
            next(
                new Error("Connection closed, before data have derived")
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
    const connection = await createConnection();
    try {
        const login = res.locals.login;
        // выяснить, нужно ли передавать ошибку через next(err)
        const user = await connection.manager.findOneOrFail(User, { login }, { relations: ["datasets"] });
    
        // Нужна валидация, возможно, раньше
        const datasetName = req.body["Dataset-Name"];
        const datasetPath = res.locals.dirPath;
    
        const dataset = new Dataset();
        dataset.name = datasetName;
        dataset.user = user;
        dataset.location = datasetPath;
        dataset.items = [];
    
        console.log(user.datasets);
        user.datasets.push(dataset);

        const savings = [];
        const files = req.files as Express.Multer.File[];
        files.forEach(
            (f) => {
                const datasetItem = new DatasetItem();
                datasetItem.dataset = dataset;
                datasetItem.location = f.path;
                datasetItem.name = f.originalname;
                dataset.items.push(datasetItem);
            }
        )

        await connection.transaction(
            async (transactionManager) => {
                savings.push(
                    transactionManager.save(user),
                    transactionManager.save(dataset),
                    dataset.items.map(
                        (item) => transactionManager.save(item)
                    )
                );
        
                await Promise.all(savings);
            }
        );

        await connection.close();

        res.sendStatus(200);
    }
    catch(err) {
        if (connection.isConnected) {
            connection.close();
        }
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
