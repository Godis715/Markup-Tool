export type MarkupType = "classification" | "recognition" | "multi-recognition";

export type MarkupItemCreatedMsg = {
    markupId: string,
    expertId: string,
    markupItemId: string,
    type: MarkupType
};

export type MarkupItemsMsg = {
    markupId: string,
    type: MarkupType,
    timestamp: number,
    items: {
        id: string,
        result: unknown,
        datasetItemId: string,
        imageUrl: string
    }[]
}

export type InferencedResultsMsg = {
    markupId: string,
    type: MarkupType,
    items: {
        id: string,
        result: unknown,
        datasetItemId: string,
        imageUrl: string
    }[]
}

export type TrainingFinishedMsg = {
    markupId: string
};

const MARKUP_ITEMS_BETWEEN_TRAINING = 3;

// хранит промежуточное состояние, необходимое для выяснения того, следует ли обучать модель
// а также данные, которые необходимые для того, чтобы начать обучение
// когда становится ясно, что модель не нужно обучать, или же обучение начинается, хранилище для заданного
// Markup должно очищаться

type Configs = {
    markupItemsBetweenTraining: number
};

export class ProcessStore {
    constructor(configs: Configs) {
        this.configs = configs;
    }

    private configs: Configs;

    private markupStore: {
        [markupId: string]: {
            // количество разметок, полученное с последней обученной модели
            itemCounter: number,
            isModelTraining: boolean
        }
    } = {};

    handleMarkupItemCreated(markupId: string): void {
        this.initMarkupState(markupId);
        this.markupStore[markupId].itemCounter += 1;
    }

    isReadyToStartTraining(markupId: string): boolean {
        this.initMarkupState(markupId);

        const markupState = this.markupStore[markupId];
        if (!markupState || markupState.isModelTraining) {
            return false;
        }

        return markupState.itemCounter >= this.configs.markupItemsBetweenTraining;
    }

    handleStartTraining(markupId: string): void {
        this.initMarkupState(markupId);
        this.markupStore[markupId].itemCounter = 0;
        this.markupStore[markupId].isModelTraining = true;
    }

    handleFinishTraining(markupId: string): void {
        this.initMarkupState(markupId);
        this.markupStore[markupId].isModelTraining = false;
    }

    private initMarkupState(markupId: string) {
        if (!this.markupStore[markupId]) {
            this.markupStore[markupId] = {
                isModelTraining: false,
                itemCounter: 0
            }
        }
    }
}

export default new ProcessStore({
    markupItemsBetweenTraining: MARKUP_ITEMS_BETWEEN_TRAINING
});
