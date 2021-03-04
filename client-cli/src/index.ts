import axios from "axios";
import { prompt } from "inquirer";
import { uploadDataset } from "./upload";
import { URL } from "url";
import path from "path";
import cliProgress from "cli-progress";

console.clear();

const HOST = process.env.MARKUPTOOL_HOST || "localhost";
const PORT = process.env.MARKUPTOOL_PORT || "8000";

const baseURL = `http://${HOST}:${PORT}/api`;
const axiosInst = axios.create({ baseURL });

const url = new URL(process.argv[2]);

if (url.hostname !== "upload-dataset") {
    console.error(new Error("Invalid url"));
    process.exit();
}

const datasetName = url.searchParams.get("name");
const datasetPath = url.searchParams.get("path");
console.log(`Назавание датасета '${datasetName}'`);
console.log(`Путь к папке '${datasetPath}'`);

(async () => {
    let tokens;
    let setCookies;

    while(true) {
        const { login, password } = await prompt([
            {
                type: "login",
                message: "Введите свой логин",
                name: "login"
            },
            {
                type: "password",
                mask: "*",
                message: "Введите пароль",
                name: "password"
            }
        ]);
    
        try {
            const response = await axiosInst.post(
                "/auth/login",
                { login, password }
            );
            tokens = response.data.tokens;
            setCookies = response.headers["set-cookie"];
            break;
        }
        catch(err) {
            console.error("Процесс аутентификации не был пройден");
            console.error(err.message || err);
        }
    }
    
    const progressBar = new cliProgress.SingleBar(
        { stopOnComplete: true },
        cliProgress.Presets.shades_classic
    );
    progressBar.start(1, 0);
    
    const handleProgress = progressBar.update.bind(progressBar);
    
    try {
        await uploadDataset(
            path.resolve(datasetPath),
            datasetName,
            {
                "Cookie": setCookies,
                "Csrf-Access-Token": tokens.csrfAccessToken
            },
            HOST,
            PORT,
            handleProgress
        );
        console.log(`Датасет '${datasetName}' был успешно загружен.`);
    }
    catch(e) {
        console.error("Датасет не был загружен");
        console.error(e);
    }
})();
