import express from "express";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

/**
 * Устанавливаем обработчики, которые проверяют,
 * чтобы количество фактически переданных байтов соответствовало
 * заявленному объему данных.
 * Это помогает бороться с внезапным разрывом связи с клиентом.
 */
const checkIfAllDataUploaded = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
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

    next();
};

const startUploading = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    const dirName = crypto.randomBytes(10).toString("hex");
    const dirPath = `./${dirName}`;
    res.locals.dirPath = dirPath;

    // multer будет загружать файлы в dirPath
    const upload = multer({ dest: dirPath }).any();
    upload(req, res, next);
};

/** Финальный обработчик ошибок */
const handleErrors = (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
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
    checkIfAllDataUploaded,
    startUploading,
    handleErrors
];
