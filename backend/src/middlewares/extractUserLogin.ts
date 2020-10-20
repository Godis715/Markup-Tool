import express from "express";
import { JWTPayload } from "../utils/auth";
import { ACCESS_TOKEN_COOKIE } from "../utils/configs";
import jwt from "jsonwebtoken";

/**
 * TODO:
 * выяснить, нужно ли вообще проверять, если такой логин
 * если нужно - реализовать проверку в этой функции или отдельно
 */
export default async function extractUserLogin(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
) {
    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
    const payload = jwt.decode(accessToken) as JWTPayload;
    // сохраняем логин пользователя для дальнейшей работы
    response.locals.login = payload.login;
    
    next();
}

