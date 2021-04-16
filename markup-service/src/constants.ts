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
