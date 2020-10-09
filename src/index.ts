import "reflect-metadata";

import express from "express";
import cookieParser from "cookie-parser";
import * as auth from "./controllers/auth";

const PORT = 8000;

const app = express();

// чтобы работать с куки ответа
app.use(cookieParser());
// чтобы работать с телом запроса
app.use(express.json());

app.post(
    "/api/auth/login",
    auth.login
);

app.get(
    "/api/auth/verify",
    auth.verify
);

app.get(
    "/api/auth/refresh",
    auth.refresh
);

app.get(
    "/api/auth/logout",
    auth.logout
);

app.listen(
    PORT,
    () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    }
);
