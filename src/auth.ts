import bcrypt from "bcrypt";
import { createConnection } from "typeorm";
import { User } from "../src/entity/User";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "./entity/Role";

// TODO: безопасное хранение ключа
const SECRET_KEY = "123";
const ACCESS_EXPIRED_IN = "1h";
// TODO: выяснить, можно ли так время писать
const REFRESH_EXPIRED_IN = "30d";
const CSRF_TOKEN_LENGTH = 20;
const SALT_ROUNDS = 10;
const REFRESH_TOKEN_TYPE = "refresh";
const ACCESS_TOKEN_TYPE = "access";

const USER_ALREADY_EXISTS_ERROR = "User is already exist.";
const INVALID_CREDENTIALS_ERROR = "Invalid credentials.";
const TOKENS_DONT_MATCH = "Token and csrf-token don't match.";
const NOT_REFRESH_TOKEN_ERROR = "Token is not of refresh type.";

type TokenType = "access" | "refresh";
export type JWTPayload = {
    type: TokenType,
    csrf: string,
    login: string
}

export async function createUser(login: string, password: string, roleNames: string[]) {
    const connection = await createConnection();
    const user = await connection.manager.findOne(User, { login });

    if (user) {
        throw new Error(USER_ALREADY_EXISTS_ERROR);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = new User();
    newUser.login = login;
    newUser.passwordHash = passwordHash;

    const roles = await connection.manager.find(Role, {
        where: roleNames.map(
            (name) => ({ name })
        )
    });

    newUser.roles = roles;

    await connection.manager.save(newUser);
    await connection.close();
}

/** Возвращает пару [токен, csrf-токен] */
function generateJWTPair(login: string, type: TokenType): [string, string] {
    /**
     * Один байн кодируется двумя символами, поэтому в результате
     * будет CSRF_TOKEN_LENGTH * 2 символов 
     * https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
     */
    const csrfToken = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
    const token = jwt.sign(
        {
            type,
            login,
            csrf: csrfToken,
        } as JWTPayload,
        SECRET_KEY,
        {
            expiresIn: type === ACCESS_TOKEN_TYPE
                ? ACCESS_EXPIRED_IN
                : REFRESH_EXPIRED_IN
        }
    );

    return [token, csrfToken]
}

export async function generateTokens(login: string, password: string) {
    const connection = await createConnection();
    const user = await connection.manager.findOne(User, { login });
    await connection.close();

    if (!user) {
        throw new Error(INVALID_CREDENTIALS_ERROR);
    }

    const passwordIsValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordIsValid) {
        throw new Error(INVALID_CREDENTIALS_ERROR);
    }

    const [refreshToken, csrfRefreshToken] = generateJWTPair(login, REFRESH_TOKEN_TYPE);
    const [accessToken, csrfAccessToken] = generateJWTPair(login, ACCESS_TOKEN_TYPE);

    return {
        accessToken,
        refreshToken,
        csrfAccessToken,
        csrfRefreshToken
    }
}

export async function generateAccessTokens(refreshToken: string, csrfRefreshToken: string) {
    verifyTokens(refreshToken, csrfRefreshToken);
    const { login, type } = jwt.decode(refreshToken) as JWTPayload;
    if (type !== REFRESH_TOKEN_TYPE) {
        throw new Error(NOT_REFRESH_TOKEN_ERROR);
    }
    const [accessToken, csrfAccessToken] = generateJWTPair(login, ACCESS_TOKEN_TYPE);
    return {
        accessToken,
        csrfAccessToken
    };
}

/**
 * Проверяет корректность jwt-токена, а также
 * подходят ли токен и csrf-токен друг к другу
 */
export function verifyTokens(token: string, csrfToken: string) {
    const payload = jwt.verify(token, SECRET_KEY) as JWTPayload;
    if (payload.csrf !== csrfToken) {
        throw new Error(TOKENS_DONT_MATCH);
    }
}
