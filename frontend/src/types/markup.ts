export enum MarkupTypeEnum {
    // классификация изображений
    CLASSIFICATION = "classification",
    // поиск заданного объекта
    RECOGNITION = "recognition",
    // поиск нескольких заданных
    MULTI_RECOGNITION = "multi-recognition"
}

export type MarkupType = MarkupTypeEnum;

export type ClassificationConfig = string[];
export type RecognitionConfig = { objectToFind: string };
export type MultiRecognitionConfig = { objectToFind: string };
export type MarkupConfig =
    ClassificationConfig |
    RecognitionConfig |
    MultiRecognitionConfig;

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
