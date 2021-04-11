import { Action } from "routing-controllers";
import { User } from "../entity/User";
import { JWTPayload, verifyTokens } from "./auth";
import jwt from "jsonwebtoken";
import { getManager } from "typeorm";
import { ACCESS_TOKEN_COOKIE, CSRF_ACCESS_TOKEN_HEADER } from "./configs";

export default async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
    const csrfAccessToken = action.request.header(CSRF_ACCESS_TOKEN_HEADER);
    const accessToken = action.request.cookies[ACCESS_TOKEN_COOKIE];
    
    if (!csrfAccessToken || !accessToken) {
        return false;
    }

    try {
        // бросает исключение, если пара значений не прошла верификацию
        verifyTokens(accessToken, csrfAccessToken);
        // сохраняем логин пользователя для дальнейшей работы
        const payload = jwt.decode(accessToken) as JWTPayload;
        
        // NOTE: можно включить кэширование запроса к БД
        const user = await getManager().findOneOrFail(User, { login: payload.login }, { relations: ["roles"] });

        return user.roles.some(
            (role) => roles.includes(role.name)
        );
    }
    catch(err) {
        console.error(err);
        return false;
    }
}
