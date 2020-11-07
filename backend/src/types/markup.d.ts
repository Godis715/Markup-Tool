export type MarkupType = "classification" | "recognition";

export type ClassificationConfig = string[];
export type RecognitionConfig = { objectToFind: string };
export type MarkupConfig = ClassificationConfig | RecognitionConfig;

type MarkupBase = {
    id: string,
    createDate: Date,
    description: string
}

export type MarkupForCustomer = MarkupBase & {
    type: MarkupType,
    config: MarkupConfig,
    // TODO: может, сделать отдельно API
    experts: string[],
    progress: {
        all: number,
        done: number
    }
};

export type MarkupForExpert = MarkupBase & {
    type: MarkupType,
    config: MarkupConfig,
    // логин создателя разметки
    owner: string,
    datasetName: string
};
