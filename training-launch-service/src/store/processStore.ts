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
const MARKUP_ITEMS_BETWEEN_TRAINING = 5;

// хранит промежуточное состояние, необходимое для выяснения того, следует ли обучать модель
// а также данные, которые необходимые для того, чтобы начать обучение
// когда становится ясно, что модель не нужно обучать, или же обучение начинается, хранилище для заданного
// Markup должно очищаться
class ProcessStore {
    private markupStore: {
        [markupId: string]: {
            // количество разметок, полученное с последней обученной модели
            itemsSinceLastModel: number,
            isModelTraining: boolean
        }
    } = {};

    handleMarkupItemCreated(markupId: string): void {
        this.initMarkupState(markupId);
        this.markupStore[markupId].itemsSinceLastModel += 1;
    }

    isReadyToStartTraining(markupId: string): boolean {
        this.initMarkupState(markupId);

        const markupState = this.markupStore[markupId];
        if (!markupState || markupState.isModelTraining) {
            return false;
        }

        return markupState.itemsSinceLastModel < MARKUP_ITEMS_BETWEEN_TRAINING;
    }

    handleStartTraining(markupId: string): void {
        this.markupStore[markupId] = {
            isModelTraining: true,
            itemsSinceLastModel: 0
        }
    }

    handleFinishTraining(markupId: string): void {
        this.initMarkupState(markupId);
        this.markupStore[markupId].isModelTraining = false;
    }

    private initMarkupState(markupId: string) {
        if (!this.markupStore[markupId]) {
            this.markupStore[markupId] = {
                isModelTraining: false,
                itemsSinceLastModel: 0
            }
        }
    }
}

export default new ProcessStore();
