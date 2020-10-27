export type MarkupType = "classification" | "recognition";

export type ClassificationConfig = string[];
export type RecognitionConfig = null;
export type MarkupConfig = ClassificationConfig | RecognitionConfig;

type MarkupBase = {
    id: string,
    createDate: Date
}

export type Markup = MarkupBase & (
    {
        type: "classification",
        config: ClassificationConfig
    } | {
        type: "recognition",
        config: RecognitionConfig
    }
);

export type MarkupForExpert = Markup & {
    owner: string
};
