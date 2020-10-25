import { Markup } from "./markup";

export type DatasetShort = {
    id: string,
    name: string
};

export type DatasetDetailed = {
    id: string,
    name: string,
    markups: Markup[]
};
