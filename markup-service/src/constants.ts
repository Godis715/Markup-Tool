import path from "path";

if (!process.env.DATASETS_FOLDER) {
    throw new Error("DATASETS_FOLDER wasn't provided");
}
export const DATASETS_FOLDER = path.resolve(process.env.DATASETS_FOLDER);

if (!process.env.FRONTEND_FOLDER) {
    throw new Error("FRONTEND_FOLDER wasn't provided");
}
export const FRONTEND_FOLDER = path.resolve(process.env.FRONTEND_FOLDER);

if (!process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN wasn't provided")
}
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY must be provided as environmental variable");
}
export const SECRET_KEY = process.env.SECRET_KEY;

if (!process.env.RABBITMQ_HOST) {
    throw new Error("RABBITMQ_HOST must be provided as environmental variable");
}
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST;

export const EX_MARKUP_ITEM_CREATED = "markup_item.created";

export const EX_VALIDATION_ITEM_CREATED = "validation_item.created";

export const Q_GET_MARKUP_ITEMS = "markup_item.get_all";

export const Q_MODEL_PREDICTION_RESULT = "model.prediction.result";

export const EX_MODEL = "model";

export const KEY_MODEL_READY = "model.ready";

export const Q_MODEL_PREDICT = "model.predict";
