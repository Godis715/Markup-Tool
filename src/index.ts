import "reflect-metadata";
import { createConnection } from "typeorm";
import { User } from "./entity/User";
import express from "express";

const app = express();
const PORT = 8000;

app.get(
    "/",
    async (req, res) => {
        const connection = await createConnection();
        const users = await connection.manager.find(User);
        res.send("Express + TypeScript Server" + users.length);
        connection.close();
    }
);

app.listen(
    PORT,
    () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
    }
);
