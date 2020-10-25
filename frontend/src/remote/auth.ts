import axios from "axios";
import {
    CustomErrorType,
    ErrorResult,
    RequestResult,
    SuccessResult
} from "../utils/customError";
import { isAxiosError } from "./axiosErrorHelpers";

const BASE_URL = process.env.REACT_APP_BASE_URL;

if (!BASE_URL) {
    throw new Error("REACT_APP_BASE_URL must be provided");
}

const axiosInst = axios.create({
    baseURL: `${BASE_URL}/api/auth`,
    withCredentials: true
});

export type TokensData = {
    csrfAccessToken: string,
    csrfRefreshToken: string
};


export type AuthData = {
    tokens: TokensData,
    roles: string[]
};

export type CheckIsAuthData = {
    isAuthenticated: true,
    roles: string[],
} | {
    isAuthenticated: false
};

export async function authenticate(login: string, password: string): RequestResult<AuthData> {
    try {
        const response = await axiosInst.post<AuthData>("/login", { login, password });
        return new SuccessResult(response.data);
    }
    catch(e) {
        if (isAxiosError(e) && e.response && e.response.status === 401) {
            return new ErrorResult(CustomErrorType.AUTHENTICATION_ERROR, e);
        }

        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, e);
    }
}

export async function checkIsAuth(csrfAccessToken: string): RequestResult<CheckIsAuthData> {
    const configs = {
        headers: { "Csrf-Access-Token": csrfAccessToken }
    };

    try {
        const { data } = await axiosInst.get<{ roles: string[] }>("/verify", configs);
        return new SuccessResult({
            isAuthenticated: true,
            roles: data.roles
        });
    }
    catch(e) {
        if (isAxiosError(e) && e.response && e.response.status === 401) {
            return new SuccessResult({ isAuthenticated: false });
        }

        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, e);
    }
}
