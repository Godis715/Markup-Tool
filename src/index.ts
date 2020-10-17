import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import * as auth from "./controllers/auth";
import * as dataset from "./controllers/dataset";
import * as markup from "./controllers/markup";
import * as markupItem from "./controllers/markupItem";
import allowForRoles from "./middlewares/allowForRoles";
import { ROLE_CUSTOMER, ROLE_EXPERT } from "./utils/configs";

const PORT = 8000;

const app = express();

// чтобы работать с куки ответа
app.use(cookieParser());
// чтобы работать с телом запроса
app.use(express.json());

// чтобы express не парсил параметры запроса в объекты
app.set("query parser", "simple");

//#region AUTH
app.post("/api/auth/login", auth.login);

app.get("/api/auth/verify", auth.verify);

app.get("/api/auth/refresh", auth.refresh);

app.get("/api/auth/logout", auth.logout);
//#endregion

//#region DATASET
app.post("/api/dataset", allowForRoles(ROLE_CUSTOMER), dataset.post);
app.use("/api/dataset", dataset.postHandleErrors);
//#endregion

//#region MARKUP
// тип разметки передается в параметре запроса: /api/dataset/:datasetId/markup?type=xyz
app.post("/api/dataset/:datasetId/markup", allowForRoles(ROLE_CUSTOMER), markup.postDatasetMarkup);

app.get("/api/dataset/:datasetId/markup", allowForRoles(ROLE_CUSTOMER), markup.getDatasetMarkup);

app.post("/api/markup/:markupId/experts", allowForRoles(ROLE_CUSTOMER), markup.updateExperts);
//#endregion

//#region MARKUP ITEM
app.get("/api/markup/:markupId/item", allowForRoles(ROLE_EXPERT), markupItem.get);

app.post("/api/markup/:markupId/item", allowForRoles(ROLE_EXPERT), markupItem.post);
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

app.listen(
    PORT,
    () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    }
);
