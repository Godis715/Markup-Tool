export type MarkupType = "classification" | "recognition";

export type Markup = {
    id: string,
    type: MarkupType,
    createDate: Date
};

export type MarkupForExpert = {
    id: string,
    type: MarkupType,
    // логин
    owner: string,
    createDate: Date
}
