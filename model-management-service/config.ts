if (!process.env.RABBITMQ_HOST) {
    throw new Error("RABBITMQ_HOST wasn't provided");
}
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST;

export const EX_MODEL = "model";

export const KEY_MODEL_TRAINING_SUCCEED = "model.training.finished.success";

export const KEY_MODEL_TRAINING_FAILED = "model.training.finished.failure";

export const KEY_MODEL_TRAINING_STARTED = "model.training.started";
