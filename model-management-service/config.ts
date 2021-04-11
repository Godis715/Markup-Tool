if (!process.env.RABBITMQ_HOST) {
    throw new Error("RABBITMQ_HOST wasn't provided");
}
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
