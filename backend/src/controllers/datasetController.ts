import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import {
    JsonController,
    CurrentUser,
    Res,
    Post,
    Authorized,
    UseBefore,
    UseAfter,
    BadRequestError,
    Req,
    OnUndefined,
    QueryParam,
    Get,
    Param,
    ForbiddenError,
    Body
} from "routing-controllers";
import { DATASETS_FOLDER } from "../constants";
import { User } from "../entity/User";
import { getManager } from "typeorm";
import { UserRole } from "../enums/appEnums";
import { Dataset } from "../entity/Dataset";
import { DatasetItem } from "../entity/DatasetItem";
import { validateOrReject } from "class-validator";
import validateAllOrReject from "../utils/validateAllOrReject";
import { DatasetDetailed, DatasetShort } from "../types/dataset";
import { MarkupConfig, MarkupForCustomer, MarkupType } from "../types/markup";
import { Markup } from "../entity/Markup";

async function handleInterruption(
    req: express.Request,
    _: express.Response,
    next: express.NextFunction
) {
    /**
     * Устанавливаем обработчики, которые проверяют,
     * чтобы количество фактически переданных байтов соответствовало
     * заявленному объему данных.
     * Это помогает бороться с внезапным разрывом связи с клиентом.
     */
    // считаем количество полученный байтов
    let writtenLen = 0;
    req.on("data", (data) => {
        writtenLen += data.length;
    });

    // когда содинение закрывается, проверяем количество заявленных и полученных байтов
    req.on("close", () => {
        const contentLength = req.header("Content-Length");
        if (!contentLength) {
            next(new Error("ContentLength wasn't provided"));
            return;
        }

        const totalLength = parseInt(contentLength);
        if (totalLength > writtenLen) {
            next(new Error("Connection closed, before data had derived"));
        }
    });

    next();
}

async function saveFileStream(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    // имя директории, в которую будут загружаться файлы
    const dirName = crypto.randomBytes(10).toString("hex");
    const dirPath = path.resolve(DATASETS_FOLDER, dirName);
    // сохраняем путь к директории для последующей работы
    res.locals.dirPath = dirPath;

    // multer будет загружать файлы в dirPath
    const upload = multer({ dest: dirPath }).any();
    upload(req, res, next);
};

/** Финальный обработчик ошибок */
async function handleErrors(
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction
) {
    if (!err) {
        res.sendStatus(200);
        return;
    }

    console.error(err);

    // TODO: еще в некоторых случаях надо чистить базу данных
    // удалить папку с загружаемыми файлами, в случае ошибки
    fs.rmdir(res.locals.dirPath, { recursive: true }, (err) => {
        if (err) {
            console.error(err);
        }
    });

    res.status(400).send(err.message);
};

@JsonController("/api/dataset")
export default class DatasetController {
    @Post("/")
    @OnUndefined(200)
    @UseBefore(saveFileStream)
    @UseBefore(handleInterruption)
    @UseAfter(handleErrors)
    @Authorized(UserRole.CUSTOMER)
    async upload(
        @Req() request: express.Request,
        @Res() response: express.Response,
        @CurrentUser({ required: true }) user: User
    ) {
        const manager = getManager();
        user = await manager.findOneOrFail(User, user.id, { relations: ["datasets"] });
    
        const datasetPath = response.locals.dirPath;
        const datasetName = request.body["Dataset-Name"];

        if (!datasetName || datasetName === "") {
            throw new BadRequestError("Dataset name must be specified");
        }

        const dataset = new Dataset();
        dataset.user = user;
        dataset.name = datasetName;
        dataset.location = datasetPath;
        dataset.items = [];
    
        user.datasets.push(dataset);

        const files = request.files as Express.Multer.File[];
        files.forEach(
            (f) => {
                const datasetItem = new DatasetItem();
                datasetItem.dataset = dataset;
                datasetItem.location = path.relative(DATASETS_FOLDER, f.path);
                datasetItem.name = f.originalname;
                dataset.items.push(datasetItem);
            }
        );

        try {
            await validateOrReject(dataset, { validationError: { target: false } });
            await validateAllOrReject(dataset.items, { validationError: { target: false } });
        }
        catch(errors) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        try {
            await manager.transaction(
                async (transactionManager) => {
                    await transactionManager.save(user);
                    await transactionManager.save(dataset);
                    await transactionManager.save(dataset.items);
                }
            );
        }
        catch(err) {
            throw new BadRequestError(err);
        }
    }

    @Get("/")
    @Authorized(UserRole.CUSTOMER)
    async getAll(
        @CurrentUser({ required: true }) user: User
    ): Promise<DatasetShort[]> {
        const manager = getManager();

        const datasets = await manager.find(Dataset, { where: { user } });
    
        return datasets.map(
            (dataset) => ({
                id: dataset.id,
                name: dataset.name,
                uploadDate: dataset.uploadDate
            })
        );
    }

    @Get("/:datasetId")
    @Authorized(UserRole.CUSTOMER)
    async getById(
        @Param("datasetId") datasetId: string,
        @CurrentUser({ required: true }) user: User
    ): Promise<DatasetDetailed | null> {
        const manager = getManager();

        const dataset = await manager.findOne(Dataset, datasetId, {
            relations: ["user", "markups", "markups.experts"]
        });

        if (!dataset) {
            return null;
        }

        if (dataset.user.id !== user.id) {
            throw new ForbiddenError("User is not an owner of the dataset");
        }

        // TODO: вынести в отдельную функцию
        // сбор статистики по каждой разметке
        return {
            id: dataset.id,
            name: dataset.name,
            markups: dataset.markups.map(
                (markup) => ({
                    id: markup.id,
                    type: markup.type as MarkupType,
                    experts: markup.experts.map(
                        (expert) => expert.login
                    ),
                    createDate: markup.createDate,
                    config: markup.config,
                    description: markup.description,
                    // FIX ME: доделать
                    progress: {
                        done: 0,
                        all: 0
                    }
                })
            ),
            uploadDate: dataset.uploadDate

        };
    }

    @Post("/:datasetId/markup")
    @OnUndefined(200)
    @Authorized(UserRole.CUSTOMER)
    async addMarkup(
        @Param("datasetId") datasetId: string,
        @Body() body: { config: MarkupConfig, description: string },
        @QueryParam("type") type: string,
        @CurrentUser({ required: true }) user: User
    ) {
        const manager = getManager();

        const { config, description } = body;
        
        const dataset = await manager.findOne(Dataset, datasetId, {
            relations: ["user", "markups"]
        });

        if (!dataset) {
            return null;    
        }

        if (dataset.user.id !== user.id) {
            throw new ForbiddenError("This user is not an author of the dataset");
        }
        
        const markup = new Markup();
        markup.dataset = dataset;
        markup.type = type;
        markup.config = config;
        markup.description = description;
        markup.experts = [];

        try {
            await validateOrReject(markup, { validationError: { target: false } });
        }
        catch(errors) {
            throw new BadRequestError(JSON.stringify(errors));
        }
    
        dataset.markups.push(markup);
    
        try {
            await manager.transaction(
                async (manager) => {
                    await manager.save(markup);
                    await manager.save(dataset);
                }
            );
        }
        catch(err) {
            throw new BadRequestError(err);
        }
    }

    @Get("/:datasetId/markup")
    @Authorized(UserRole.CUSTOMER)
    async getMarkup(
        @Param("datasetId") datasetId: string,
        @CurrentUser({ required: true }) user: User
    ): Promise<MarkupForCustomer[] | null> {
        const manager = getManager();
            
        // FIX ME: внизу идет проверка, однако она никогда не выполнится
        const dataset = await manager.findOne(Dataset, datasetId, {
            relations: ["user", "markups", "markups.experts"]
        });

        if (!dataset) {
            return null;
        }

        if (dataset.user.id !== user.id) {
            throw new ForbiddenError("This user is not an author of the dataset");
        }
        
        return dataset.markups.map(
            (markup) => ({
                id: markup.id,
                type: markup.type as MarkupType,
                config: markup.config,
                createDate: markup.createDate,
                description: markup.description,
                experts: markup.experts.map(({ login }) => login),
                // FIX ME: дописать
                progress: {
                    done: 0,
                    all: 0
                }
            })
        );
    }
}
