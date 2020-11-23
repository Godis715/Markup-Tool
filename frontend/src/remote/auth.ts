import axios from "axios";
import { API_URL } from "../constants/urls";
import {
    CustomErrorType,
    ErrorResult,
    RequestResult,
    SuccessResult
} from "../utils/customError";
import { isAxiosError } from "./axiosErrorHelpers";

const axiosInst = axios.create({
    baseURL: `${API_URL}/auth`,
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
