import { createConnection } from "typeorm";
import  amqp from "amqplib/callback_api";
import subscribeGetModelStatus from "./rabbitmq/recievers/subscribeGetModelStatus";
import { RABBITMQ_HOST } from "./config";

createConnection()
    .then(() => {
        console.log("[MODEL-MANAGER]: DB is connected");
    })
    .catch((err) => {
        console.error(err);
    });

const connectInterval = setInterval(() => {
    amqp.connect(RABBITMQ_HOST, (error0, connection) => {
        if (error0) {
            return;
        }

        clearTimeout(connectInterval);

        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error(error1);
                throw error1;
            }
    
            console.log(" [MODEL-MANAGER] Awaiting RPC requests");
    
            subscribeGetModelStatus(channel);
        });
    })
}, 5000);

