import "reflect-metadata";
import express from "express";
import {
    generateTokens,
    verifyTokens,
    generateAccessTokens
} from "./auth";
import cookieParser from "cookie-parser";

const PORT = 8000;
const ACCESS_TOKEN_COOKIE = "Access-Token";
const REFRESH_TOKEN_COOKIE = "Refresh-Token";
const CSRF_ACCESS_TOKEN_HEADER = "Csrf-Access-Token";
const CSRF_REFRESH_TOKEN_HEADER = "Csrf-Refresh-Token";

const app = express();

// чтобы работать с куки ответа
app.use(cookieParser());
// чтобы работать с телом запроса
app.use(express.json());

app.post(
    "/api/auth/login",
    async (request, response) => {
        const { login, password } = request.body;

        if (!login || !password) {
            response.sendStatus(401);
            return;
        }

        try {
            const {
                accessToken,
                refreshToken,
                csrfAccessToken,
                csrfRefreshToken
            } = await generateTokens(login, password);

            response
                .cookie(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true })
                .cookie(REFRESH_TOKEN_COOKIE, refreshToken, { httpOnly: true })
                .status(200)
                .send({
                    csrfAccessToken,
                    csrfRefreshToken
                });
        }
        catch(err) {
            console.error(err);
            response.sendStatus(401);
        }
    }
);

app.get(
    "/api/auth/verify",
    async (request, response) => {
        const csrfAccessToken = request.header(CSRF_ACCESS_TOKEN_HEADER);
        const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];

        if (!csrfAccessToken || !accessToken) {
            response.sendStatus(401);
            return;
        }

        try {
            // бросает исключение, если пара значений не прошла верификацию
            verifyTokens(accessToken, csrfAccessToken);
            response.sendStatus(200);
        }
        catch(err) {
            console.error(err);
            response.sendStatus(401);
        }
    }
);

app.get(
    "/api/auth/refresh",
    async (request, response) => {
        const csrfRefreshToken = request.header(CSRF_REFRESH_TOKEN_HEADER);
        const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

        if (!csrfRefreshToken || !refreshToken) {
            response.sendStatus(401);
            return;
        }

        try {
            const {
                accessToken,
                csrfAccessToken
            } = await generateAccessTokens(refreshToken, csrfRefreshToken);
    
            response
                .cookie(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true })
                .status(200)
                .send({ csrfAccessToken });
        }
        catch(err) {
            console.error(err);
            response.sendStatus(401);
        }
    }
);

app.get(
    "/api/auth/logout",
    async (request, response) => {
        response.clearCookie(ACCESS_TOKEN_COOKIE);
        response.clearCookie(REFRESH_TOKEN_COOKIE);

        response.sendStatus(200);
    }
);

app.listen(
    PORT,
    () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    }
);
