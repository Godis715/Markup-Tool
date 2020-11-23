import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import { CorsOptions } from "cors";
import { createConnection } from "typeorm";
import { FOLDER_FOR_DATASETS, FRONTEND_BUILD_FOLDER } from "./constants";
import { useExpressServer } from "routing-controllers";
import currentUserChecker from "./utils/currentUserChecker";
import authorizationChecker from "./utils/authorizationChecker";

const PORT = 8000;
const ORIGIN = "http://localhost:3000";

/**
 * Для работы с typeorm требуется лишь один раз создать соединение
 * Закрывать соединение не обязательно, согласно документации
 */
createConnection()
    .then(() => {
        console.log("[Server]: DB is connected");
    })
    .catch((err) => {
        console.error(err);
    });

const app = express()
    // чтобы работать с телом запроса
    .use(express.json())
    // чтоб работать с параметрами запроса
    .use(express.urlencoded({ extended: false }))
    // чтобы работать с куки ответа
    .use(cookieParser())
    // раздаем картинки
    .use("/images", express.static(FOLDER_FOR_DATASETS))
    // раздаем статику react-а
    .use(express.static(FRONTEND_BUILD_FOLDER));

const server = useExpressServer(app, {
    cors: {
        origin: [ORIGIN],
        credentials: true,
        exposedHeaders: ["Content-Disposition"]
    } as CorsOptions,
    currentUserChecker,
    authorizationChecker,
    controllers: [__dirname + "/controllers/*.ts"],
    defaults: {
        nullResultCode: 404
    }
})
    // чтобы express не парсил параметры запроса в объекты
    .set("query parser", "simple")
    // чтобы можно было переходить на сайт не только по корневому маршруту
    .get("*", (req, res, next) => {
        // игнорируем запросы с префиксом API
        if (req.url.startsWith("/api")) {
            next();
        }
        else {
            res.sendFile(`${FRONTEND_BUILD_FOLDER}/index.html`);
        }
    })
    .listen(PORT, () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    });

// без этого загрузка файлов падает ровно через минуту, т.к. headersTimeout = 60000 по умолчанию
server.headersTimeout = 1 * 60 * 60 * 1000; // час
