if (!process.env.RABBITMQ_HOST) {
    throw new Error("RABBITMQ_HOST must be provided as environmental variable");
}
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST;

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const EX_MODEL = "model";

// может быть model.training.result.success или model.training.result.failure
export const KEY_MODEL_TRAINING_FINISHED = "model.training.result.*";

export const KEY_MODEL_TRAINING_STARTED = "model.training.started";

export const Q_GET_MARKUP_ITEMS = "markup_item.get_all";

export const Q_START_MODEL_TRAINING = "model.training.start";

export const Q_RESULT_INFERENCE = "result_inference";

