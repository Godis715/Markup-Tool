import { createConnection } from "typeorm";
import "./rabbitmq/channelWrapper";
createConnection()
    .then(() => {
        console.log("[MODEL-MANAGER]: Database is connected");
    })
    .catch((err) => {
        console.error("[MODEL-MANAGER]: Cannot connect to database", err);
    });
