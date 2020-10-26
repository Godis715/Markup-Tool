import axios from "axios";
import { DatasetDetailed, DatasetShort } from "../types/dataset";
import { MarkupForExpert } from "../types/markup";
import { MarkupItem, MarkupItemResult } from "../types/markupItem";
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
    baseURL: `${BASE_URL}/api`,
    withCredentials: true
});

axiosInst.interceptors.request.use(
    (config) => {
        const csrfAccessToken = localStorage.getItem("Csrf-Access-Token");
        // eslint-disable-next-line
        config.headers["Csrf-Access-Token"] = csrfAccessToken;
        return config;
    }
);

export function setUnauthorizedListener(cb: () => void): void {
    axios.interceptors.request.use(
        (response) => response,
        (error) => {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) {
                    cb();
                }
            }

            return Promise.reject(error);
        }
    );
}

export async function fetchDatasets(): RequestResult<DatasetShort[]> {
    try {
        const respone = await axiosInst.get<DatasetShort[]>("/dataset");
        return new SuccessResult(respone.data);
    }
    catch(err) {
        // TODO: to custom error
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchDataset(id: string): RequestResult<DatasetDetailed> {
    try {
        const response = await axiosInst.get<DatasetDetailed>(`/dataset/${id}`);
        return new SuccessResult(response.data);
    }
    catch(err) {
        // TODO: to custom error
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchMarkups(): RequestResult<MarkupForExpert[]> {
    try {
        const response = await axiosInst.get<MarkupForExpert[]>("/markup");
        return new SuccessResult(response.data);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchNextMarkupItem(markupId: string): RequestResult<MarkupItem> {
    try {
        const response = await axiosInst.get<MarkupItem>(`/markup/${markupId}/item`);
        return new SuccessResult(response.data);
    }
    catch(err) {
        // TODO: рассмотреть вариант ошибки 404 - означает, что у пользователя закончились элементы для разметки
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

// FIX ME: это костыльный вариант для получения markup по id
export async function fetchMarkup(id: string): RequestResult<MarkupForExpert> {
    const result = await fetchMarkups();
    if (!result.isSuccess) {
        return result;
    }

    const markup = result.data.find(
        ({ id: markupId }) => markupId === id
    );

    if (!markup) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, new Error("markup not found"));
    }

    return new SuccessResult(markup);
}

export async function postMarkupItemResult(markupId: string, result: MarkupItemResult): RequestResult<{}> {
    await Promise.resolve();
    return new SuccessResult({});
}
