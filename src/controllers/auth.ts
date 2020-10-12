import {
    generateTokens,
    verifyTokens,
    generateAccessTokens
} from "../utils/auth";
import {
    Request,
    Response
} from "express";
import {
    ACCESS_TOKEN_COOKIE,
    CSRF_ACCESS_TOKEN_HEADER,
    CSRF_REFRESH_TOKEN_HEADER,
    REFRESH_TOKEN_COOKIE
} from "../utils/configs";
import { ensureAuthentication } from "../middlewares/ensureAuthentication";

export async function login(request: Request, response: Response) {
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


export const verify = [
    ensureAuthentication,
    (req: Request, res: Response) => {
        res.sendStatus(200);
    } 
];

export async function refresh(request: Request, response: Response) {
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


export async function logout(request: Request, response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE);
    response.clearCookie(REFRESH_TOKEN_COOKIE);

    response.sendStatus(200);
}
