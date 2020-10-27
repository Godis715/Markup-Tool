export type MarkupItemData = {
    imageSrc: string
};

export type ClassificationItemResult = string;

export type RecognitionItemResult = {
    x1: number,
    x2: number,
    y1: number,
    y2: number
};

export type MarkupItemResult = ClassificationItemResult | RecognitionItemResult;
