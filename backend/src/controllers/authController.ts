import express from "express";
import {
    JsonController,
    Get,
    CurrentUser,
    Body,
    UnauthorizedError,
    Res,
    Post,
    HeaderParam,
    CookieParam
} from "routing-controllers";
import { User } from "../entity/User";
import { generateAccessTokens, generateTokens, getUserRoles } from "../utils/auth";
import { ACCESS_TOKEN_COOKIE, CSRF_REFRESH_TOKEN_HEADER, REFRESH_TOKEN_COOKIE } from "../utils/configs";

type AuthData = {
    login: string,
    password: string
}

@JsonController("/api/auth")
export default class AuthController {
    @Post("/login")
    async login(
        @Res() response: express.Response,
        @Body() authData: AuthData
    ) {
        const { login, password } = authData;
    
        if (!login || !password) {
            throw new UnauthorizedError();
        }
    
        try {
            const {
                accessToken,
                refreshToken,
                csrfAccessToken,
                csrfRefreshToken
            } = await generateTokens(login, password);
    
            const roles = await getUserRoles(login);
    
            response
                .cookie(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true })
                .cookie(REFRESH_TOKEN_COOKIE, refreshToken, { httpOnly: true });
            
            return {
                tokens: {
                    csrfAccessToken,
                    csrfRefreshToken
                },
                roles
            };
        }
        catch(err) {
            console.error(err);
            throw new UnauthorizedError();
        }
    }

    @Get("/verify")
    async verify(@CurrentUser({ required: true }) user: User) {
        const roles = user.roles.map(({ name }) => name);
        return { roles };
    }

    @Get("/logout")
    async logout(@Res() response: express.Response) {
        response.clearCookie(ACCESS_TOKEN_COOKIE);
        response.clearCookie(REFRESH_TOKEN_COOKIE);    
    }

    @Get("/refresh")
    async refresh(
        @Res() response: express.Response,
        @CookieParam(REFRESH_TOKEN_COOKIE) refreshToken: string,
        @HeaderParam(CSRF_REFRESH_TOKEN_HEADER) csrfRefreshToken: string
    ) {
        if (!csrfRefreshToken || !refreshToken) {
            throw new UnauthorizedError();
        }
    
        try {
            const {
                accessToken,
                csrfAccessToken
            } = await generateAccessTokens(refreshToken, csrfRefreshToken);
    
            response.cookie(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true });

            return { csrfAccessToken };
        }
        catch(err) {
            console.error(err);
            throw new UnauthorizedError();
        }
    }
}
