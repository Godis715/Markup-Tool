import express from "express";
import { verifyTokens } from "../utils/auth";
import {
    ACCESS_TOKEN_COOKIE,
    CSRF_ACCESS_TOKEN_HEADER
} from "../utils/configs";

export async function ensureAuthentication(
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
        next();
    }
    catch(err) {
        console.error(err);
        response.sendStatus(401);
    }
}