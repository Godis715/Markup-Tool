import { Action } from "routing-controllers";
import { User } from "../entity/User";
import { JWTPayload, verifyTokens } from "../services/authService";
import jwt from "jsonwebtoken";
import { getManager } from "typeorm";
import { ACCESS_TOKEN_COOKIE, CSRF_ACCESS_TOKEN_HEADER } from "./configs";

export default async function currentUserChecker(action: Action): Promise<User|null> {
    const csrfAccessToken = action.request.header(CSRF_ACCESS_TOKEN_HEADER);
    const accessToken = action.request.cookies[ACCESS_TOKEN_COOKIE];
    
    if (!csrfAccessToken || !accessToken) {
        return null;
    }

    try {
        // бросает исключение, если пара значений не прошла верификацию
        verifyTokens(accessToken, csrfAccessToken);
        // сохраняем логин пользователя для дальнейшей работы
        const payload = jwt.decode(accessToken) as JWTPayload;
        
        return getManager().findOneOrFail(User, { login: payload.login }, { relations: ["roles"] });
    }
    catch(err) {
        console.error(err);
        return null;
    }
}
