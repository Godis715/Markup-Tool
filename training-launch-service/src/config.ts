if (!process.env.RABBITMQ_HOST) {
    throw new Error("RABBITMQ_HOST must be provided as environmental variable");
}
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
