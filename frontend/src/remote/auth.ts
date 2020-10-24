import axios from "axios";
import {
    CustomErrorType,
    ErrorResult,
    RequestResult,
    SuccessResult
} from "../utils/customError";
import { isAxiosError } from "./axiosErrorHelpers";

// FIX ME: move to constants or to env variables
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

export async function fetchTokens(login: string, password: string): RequestResult<TokensData> {
    try {
        const response = await axiosInst.post<TokensData>("/login", { login, password });
        return new SuccessResult(response.data);
    }
    catch(e) {
        if (isAxiosError(e) && e.response && e.response.status === 401) {
            return new ErrorResult(CustomErrorType.AUTHENTICATION_ERROR, e);
        }

        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, e);
    }
}

export async function checkIsAuth(csrfAccessToken: string): RequestResult<boolean> {
    const configs = {
        headers: { "Csrf-Access-Token": csrfAccessToken }
    };

    try {
        await axiosInst.get<TokensData>("/verify", configs);
        return new SuccessResult(true);
    }
    catch(e) {
        if (isAxiosError(e) && e.response && e.response.status === 401) {
            return new SuccessResult(false);
        }

        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, e);
    }
}
