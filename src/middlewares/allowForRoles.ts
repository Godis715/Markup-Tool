import express from "express";
import { createConnection } from "typeorm";
import { User } from "../entity/User";
import ensureAuthentication from "./ensureAuthentication";
import extractUserLogin from "./extractUserLogin";

export default function allowForRoles(...roles: string[]) {
    const checkRights = async (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ) => {
        const connection = await createConnection();
        const login = response.locals.login;
        const user = await connection.manager.findOneOrFail(User, { login }, { relations: ["roles"] });
        await connection.close();
        const hasRights = user.roles.some(
            (role) => roles.includes(role.name)
        );

        if (!hasRights) {
            response.sendStatus(403);
            return;
        }

        next();
    };

    /**
     * Для того, чтобы дать клиенту какие-либо права, нужно, для начала,
     * проверить, авторизован ли пользователь, и получить его логин
     */
    return [
        ensureAuthentication,
        extractUserLogin,
        checkRights
    ];
}
