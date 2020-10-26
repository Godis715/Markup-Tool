import { Markup } from "./markup";

export type DatasetShort = {
    id: string,
    name: string,
    uploadDate: Date
};

export type DatasetDetailed = {
    id: string,
    name: string,
    markups: Markup[],
    uploadDate: Date
};
