import axios from "axios";
import inquirer, { prompt } from "inquirer";
import { uploadDataset } from "./upload";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = "8000";

const baseURL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}/api`;
const axiosInst = axios.create({ baseURL });

(async () => {
    try {
        const { action } = await inquirer.prompt([
            {
                name: "action",
                message: "Выберите действие",
                type: "list",
                choices: [
                    {
                        name: "Загрузить датасет",
                        value: "uploadDataset"
                    }
                ]
            }
        ]);
    
        switch(action) {
            case "uploadDataset": {
                const { datasetPath, datasetName } = await inquirer.prompt([
                    {
                        name: "datasetPath",
                        message: "Укажите путь к папке с датасетом",
                        validate: (path) => {
                            if (!fs.existsSync(path)) {
                                return "Указанного пути не существует";
                            }
                            
                            if(!fs.lstatSync(path).isDirectory()) {
                                return "Указанный путь не является папкой";
                            }
    
                            if (fs.readdirSync(path).length === 0) {
                                return "Папка пуста";
                            }
    
                            return true;
                        }
                    },
                    {
                        name: "datasetName",
                        message: "Укажите название датасета",
                        validate: (name) => {
                            if (name === "") {
                                return "Название датасета не должно быть пустым";
                            }
    
                            return true;
                        }
                    }
                ]);
    
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
                        const response = await axiosInst.post("/auth/login", { login, password });
                        tokens = response.data.tokens;
                        setCookies = response.headers["set-cookie"];
                        break;
                    }
                    catch(err) {
                        if (err.message) {
                            console.error(err.message);
                        }
                        else {
                            console.error(err);
                        }
                    }
                }

                const progressBar = new cliProgress.SingleBar({ stopOnComplete: true }, cliProgress.Presets.shades_classic);
                progressBar.start(1, 0);

                const handleProgress = (currentProgress: number) => {
                    progressBar.update(currentProgress);
                }

                await uploadDataset(
                    path.resolve(datasetPath),
                    datasetName,
                    {
                        "Cookie": setCookies,
                        "Csrf-Access-Token": tokens.csrfAccessToken
                    },
                    DEFAULT_HOST,
                    DEFAULT_PORT,
                    handleProgress
                );
    
                console.log(`Датасет '${datasetName}' был успешно загружен.`);
            }
        }
    }
    catch(err) {
        console.error("Произошла неизвестная ошибка");
        if (err.message) {
            console.error(err.message);
        }
    }
})();
