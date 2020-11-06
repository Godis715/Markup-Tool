import axios, { AxiosRequestConfig } from "axios";
import { MarkupConfig, MarkupForCustomer, MarkupType } from "../../../backend/src/types/markup";
import { DatasetDetailed, DatasetShort } from "../types/dataset";
import { MarkupForExpert } from "../types/markup";
import { MarkupItemData, MarkupItemResult } from "../types/markupItem";
import axiosParseWithDates from "../utils/axiosParseWithDates";
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

const parseDatesConfig: AxiosRequestConfig = { transformResponse: [axiosParseWithDates] };

// TODO: проверить, работает ли это вообще
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
        const respone = await axiosInst.get<DatasetShort[]>("/dataset", parseDatesConfig);
        return new SuccessResult(respone.data);
    }
    catch(err) {
        // TODO: to custom error
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchDataset(id: string): RequestResult<DatasetDetailed> {
    try {
        const response = await axiosInst.get<DatasetDetailed>(`/dataset/${id}`, parseDatesConfig);
        return new SuccessResult(response.data);
    }
    catch(err) {
        // TODO: to custom error
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchMarkups(): RequestResult<MarkupForExpert[]> {
    try {
        const { data } = await axiosInst.get<MarkupForExpert[]>("/markup", parseDatesConfig);
        return new SuccessResult(data);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function fetchNextMarkupItem(markupId: string): RequestResult<MarkupItemData> {
    try {
        const { data } = await axiosInst.get<MarkupItemData>(`/markup/${markupId}/item`);
        return new SuccessResult(data);
    }
    catch(err) {
        if (isAxiosError(err) && err.response?.status === 404) {
            return new ErrorResult(CustomErrorType.NOT_FOUND, err);
        }

        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

// FIX ME: это костыльный вариант для получения markup по id
export async function fetchMarkup(markupId: string): RequestResult<MarkupForExpert|MarkupForCustomer> {
    try {
        const { data } = await axiosInst.get<MarkupForExpert|MarkupForCustomer>(`/markup/${markupId}`, parseDatesConfig);
        return new SuccessResult(data);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, new Error("markup not found"));
    }
}

export async function postMarkupItemResult(markupId: string, result: MarkupItemResult): RequestResult<null> {
    try {
        await axiosInst.post(`/markup/${markupId}/item`, { result });
        return new SuccessResult(null);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function addExpertsToMarkup(markupId: string, expert: string): RequestResult<null> {
    try {
        await axiosInst.post(`/markup/${markupId}/experts`, { toAdd: [expert] });
        return new SuccessResult(null);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}

export async function postMarkup(datasetId: string, type: MarkupType, description: string, config: MarkupConfig): RequestResult<null> {
    try {
        await axiosInst.post(`/dataset/${datasetId}/markup`, { config, description }, { params: { type } });
        return new SuccessResult(null);
    }
    catch(err) {
        return new ErrorResult(CustomErrorType.UNEXPECTED_ERROR, err);
    }
}