import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import { createConnection } from "typeorm";
import authRouter from "./routers/auth";
import datasetRouter from "./routers/dataset";
import markupRouter from "./routers/markup";

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

app.use("/api/auth", authRouter);

app.use("/api/dataset", datasetRouter);

app.use("/api/markup", markupRouter);

app.use((
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    console.error("[Server error]", err);
    res.sendStatus(500);
});

const server = app.listen(PORT, () => {
    console.log(`[server]: Server is running at https://localhost:${PORT}`);
});

// без этого загрузка файлов падает ровно через минуту, т.к. headersTimeout = 60000 по умолчанию
server.headersTimeout = 1 * 60 * 60 * 1000; // час
