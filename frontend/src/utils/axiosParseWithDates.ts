import { AxiosResponse } from "axios";
import dateParser from "./dateParser";

export default function axiosParseWithDates<T>(data: string): T {
    return JSON.parse(data, dateParser) as T;
}
