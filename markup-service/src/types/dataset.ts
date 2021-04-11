import { MarkupForCustomer } from "./markup";

export type DatasetShort = {
    id: string,
    name: string,
    uploadDate: Date
};

export type DatasetDetailed = DatasetShort & {
    markups: MarkupForCustomer[]
};
