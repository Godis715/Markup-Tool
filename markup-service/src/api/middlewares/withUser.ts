import express from "express";
import { JWTPayload, verifyTokens } from "../../services/authService";
import { ACCESS_TOKEN_COOKIE, CSRF_ACCESS_TOKEN_HEADER } from "../../utils/configs";
import jwt from "jsonwebtoken";
import { getManager } from "typeorm";
import { User } from "../../entity/User";

// проверяет jwt токен и по нему восстанавливает пользователя, сохраняет его в response.locals.user
export default async function withUser(
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
        
        const user = await getManager().findOneOrFail(User, { login: payload.login }, { relations: ["roles"] });
        response.locals.user = user;
        // FIX ME: для обратной совместимости
        response.locals.login = payload.login;

        next();
    }
    catch(err) {
        response
            .status(401)
            .send(err.message);
    }
}