import express from "express";
import { JWTPayload, verifyTokens } from "../utils/auth";
import {
    ACCESS_TOKEN_COOKIE,
    CSRF_ACCESS_TOKEN_HEADER
} from "../utils/configs";
import jwt from "jsonwebtoken";

export default async function ensureAuthentication(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    const csrfAccessToken = request.header(CSRF_ACCESS_TOKEN_HEADER);
    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
    
    if (!csrfAccessToken || !accessToken) {
        response.sendStatus(401);
        return;
    }

    try {
        // бросает исключение, если пара значений не прошла верификацию
        verifyTokens(accessToken, csrfAccessToken);
        // сохраняем логин пользователя для дальнейшей работы
        const payload = jwt.decode(accessToken) as JWTPayload;
        response.locals.login = payload.login;
        next();
    }
    catch(err) {
        response
            .status(401)
            .send(err.message);
    }
}
