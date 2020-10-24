import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import * as auth from "./controllers/auth";
import * as dataset from "./controllers/dataset";
import * as markup from "./controllers/markup";
import * as markupItem from "./controllers/markupItem";
import allowForRoles from "./middlewares/allowForRoles";
import { UserRole } from "./enums/appEnums";
import { createConnection } from "typeorm";

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

const app = express();

// чтобы работать с куки ответа
app.use(cookieParser());
// чтобы работать с телом запроса
app.use(express.json());
// включить cors
const corsOptions = {
    origin: [ORIGIN],
    credentials: true,
} as CorsOptions;
app.use(cors(corsOptions));
// раздаем статику react-а
app.use(express.static("../frontend/build"));
// раздаем картинки
app.use("/images", express.static("./images"));
// чтобы express не парсил параметры запроса в объекты
app.set("query parser", "simple");

//#region AUTH
app.post("/api/auth/login", auth.login);

app.get("/api/auth/verify", auth.verify);

app.get("/api/auth/refresh", auth.refresh);

app.get("/api/auth/logout", auth.logout);
//#endregion

//#region DATASET
app.post("/api/dataset", allowForRoles(UserRole.CUSTOMER), dataset.post);
app.use("/api/dataset", dataset.postHandleErrors);

app.get("/api/dataset", allowForRoles(UserRole.CUSTOMER), dataset.get);
//#endregion

//#region MARKUP
// тип разметки передается в параметре запроса: /api/dataset/:datasetId/markup?type=xyz
app.post("/api/dataset/:datasetId/markup", allowForRoles(UserRole.CUSTOMER), markup.postDatasetMarkup);

// получение списка разметок одного датасета
app.get("/api/dataset/:datasetId/markup", allowForRoles(UserRole.CUSTOMER), markup.getDatasetMarkup);

app.post("/api/markup/:markupId/experts", allowForRoles(UserRole.CUSTOMER), markup.updateExperts);

// получение сведений о конкретной разметке; для эксперта и заказчика - разный резлуьтат
app.get("/api/markup/:markupId", allowForRoles(UserRole.EXPERT, UserRole.CUSTOMER), () => {});

// получение разметки в виде текста
app.get("/api/markup/:markupId/result", allowForRoles(UserRole.CUSTOMER), markup.getResult);

app.get("/api/markup", allowForRoles(UserRole.EXPERT), markup.getForExpert);
//#endregion

//#region MARKUP ITEM
app.get("/api/markup/:markupId/item", allowForRoles(UserRole.EXPERT), markupItem.get);

app.post("/api/markup/:markupId/item", allowForRoles(UserRole.EXPERT), markupItem.post);
//#endregion

app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error("[Server error]", err);
        res.sendStatus(500);
    }
);

const server = app.listen(
    PORT,
    () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    }
);

// без этого загрузка файлов падает ровно через минуту, т.к. headersTimeout = 60000 по умолчанию
server.headersTimeout = 1 * 60 * 60 * 1000; // час
