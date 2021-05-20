export type MarkupItemData = {
    imageSrc: string
}

export type TaskItemData = {
    imageSrc: string
} | {
    imageSrc: string,
    markup: MarkupItemResult
}

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

export type MarkupItemResult =
    ClassificationItemResult |
    RecognitionItemResult |
    MultiRecognitionItemResult;

export type ValidationItemResult = {
    isCorrect: boolean
};

export type TaskItemResult = MarkupItemResult | ValidationItemResult;
