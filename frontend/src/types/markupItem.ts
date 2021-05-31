export type MarkupItemData = {
    imageSrc: string
}

export type ValidationItemData = {
    imageSrc: string,
    markup: MarkupItemResult
}

export type TaskItemData = MarkupItemData | ValidationItemData;

export type ClassificationItemResult = string;

export type Rect = {
    x1: number,
    x2: number,
    y1: number,
    y2: number
}

export type RecognitionItemResult = {
    status: "SUCCESS",
    rectangle: Rect
} | {
    status: "CANNOT_DETECT_OBJECT"
}

export type MultiRecognitionItemResult = {
    status: "SUCCESS",
    rectangles: Rect[]
} | {
    status: "CANNOT_DETECT_OBJECT"
}

export type MultiRecognitionValidationResult = {
    isCorrect: boolean
};

export type MarkupItemResult =
    ClassificationItemResult |
    RecognitionItemResult |
    MultiRecognitionItemResult;

export type ValidationItemResult = {
    isCorrect: boolean
};

export type TaskItemResult = ValidationItemResult | MarkupItemResult;
