export type MarkupType = "classification" | "recognition";

export type Markup = {
    id: string,
    type: MarkupType
};

export type MarkupForExpert = {
    id: string,
    type: MarkupType,
    // логин
    owner: string
}
