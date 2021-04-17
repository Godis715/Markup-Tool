export type ModelStatus = "NA" | "training" | "ready" | "failure";

export type MarkupType = "classification" | "recognition" | "multi-recognition";

export type ModelInfoMsg = {
    markupId: string,
    modelId: string
    status: ModelStatus,
    timestamp?: number,
};

export type MarkupItemCountMsg = {
    markupId: string
    count: number
};

export type MarkupItemCreatedMsg = {
    markupId: string,
    expertId: string,
    markupItemId: string,
    type: MarkupType
};

export type MarkupItemsMsg = {
    markupId: string,
    type: MarkupType,
    markupItems: {
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

export type CreatedModelMsg = {
    markupId: string,
    modelId: string
}

const MARKUP_ITEMS_BETWEEN_TRAINING = 5;

// хранит промежуточное состояние, необходимое для выяснения того, следует ли обучать модель
// а также данные, которые необходимые для того, чтобы начать обучение
// когда становится ясно, что модель не нужно обучать, или же обучение начинается, хранилище для заданного
// Markup должно очищаться
class ProcessStore {
    private store: {
        [markupId: string]: {
            timestamp?: number,
            modelInfoMsg?: ModelInfoMsg,
            markupItemCountMsg?: MarkupItemCountMsg,
            markupItemsMsg?: MarkupItemsMsg,
            inferencedResultsMsg?: InferencedResultsMsg,
            createdModelMsg?: CreatedModelMsg
        }
    } = {};

    // завести новую запись для заданного markupId
    startProcessingMarkup(markupId: string): boolean {
        if (this.store[markupId]) {
            console.log("Markup id is already processing", markupId);
            return false;
        }

        this.store[markupId] = {};

        return true;
    }

    // получить временную метку для заданного markupId
    // временная метка определяет границу, до которой будут собираться данные
    getMarkupTimestamp(markupId: string): number | undefined {
        return this.store[markupId]?.timestamp;
    }

    // добавить данные о модели
    addModelInfo(modelInfo: ModelInfoMsg): boolean {
        const { markupId } = modelInfo;

        if (!this.store[markupId]) {
            return false;
        }

        const currTimestamp = (new Date()).getTime();

        this.store[markupId].modelInfoMsg = modelInfo;
        this.store[markupId].timestamp = currTimestamp;

        return true;
    }

    // добавить данные о количестве разметки, сделанной с последнего раза обучения модели
    addMarkupItemCount(markupItemCount: MarkupItemCountMsg): boolean {
        const { markupId } = markupItemCount;

        if (!this.store[markupId]) {
            return false;
        }

        this.store[markupId].markupItemCountMsg = markupItemCount;
        return true;
    }

    addInferencedResults(inferencedResultsMsg: InferencedResultsMsg): boolean {
        const { markupId } = inferencedResultsMsg;

        if (!this.store[markupId]) {
            return false;
        }

        this.store[markupId].inferencedResultsMsg = inferencedResultsMsg;
        return true;
    }

    getDataForTraining(markupId: string): InferencedResultsMsg | undefined {
        return this.store[markupId].inferencedResultsMsg;
    }

    // узнать, можно ли инициировать обучение модели
    readyToStartTraining(markupId: string): boolean {
        const markupStore = this.store[markupId];
        if (
            !markupStore ||
            !markupStore.markupItemCountMsg ||
            !markupStore.modelInfoMsg
        ) {
            return false;
        }

        const markupItemCountDelta = markupStore.markupItemCountMsg.count;

        return markupItemCountDelta > MARKUP_ITEMS_BETWEEN_TRAINING;
    }

    // очистить запись для заданного markupId
    // это операция должна выполняться либо когда обучение модели было запущено
    // либо когда было принято решение не запускать обучение
    cleanupMarkupInfo(markupId: string): void {
        delete this.store[markupId];
    }
}

export default new ProcessStore();
