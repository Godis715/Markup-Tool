import axios from "axios";
import commander from "commander";
import { prompt } from "inquirer";
import { uploadDataset } from "./upload";
import path from "path";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 8000;

commander
    .version("1.0.0")
    .description("CLI administration panel.");

commander
    .command("upload-dataset [name] [path]")
    .description("Uploading dataset into the service")
    .option("-h, --host <string>", `Host name, default '${DEFAULT_HOST}'`, DEFAULT_HOST)
    .option("-p, --port <number>", `Port, default '${DEFAULT_PORT}'`, DEFAULT_PORT.toString())
    .action(
        async (name, dirPath, cmdObj) => {
            try {
                const { login, password } = await prompt([
                    {
                        type: "login",
                        message: "Enter a login",
                        name: "login"
                    },
                    {
                        type: "password",
                        mask: "*",
                        message: "Enter a password",
                        name: "password"
                    }
                ]);

                const baseURL = `http://${cmdObj.host}:${cmdObj.port}/api`;
                console.log(`Service's API URL: ${baseURL}`);
                const absDirPath = path.resolve(dirPath);
                console.log(`Absolute path to dataset: ${absDirPath}`);
                console.log(`Dataset name: ${name}`);

                const axiosInst = axios.create({ baseURL });
    
                const response = await axiosInst.post("/auth/login", { login, password });
                const setCookies = response.headers["set-cookie"];
            
                await uploadDataset(
                    absDirPath,
                    name,
                    {
                        "Cookie": setCookies,
                        "Csrf-Access-Token": response.data.tokens.csrfAccessToken
                    },
                    cmdObj.host,
                    cmdObj.port
                );

                console.log(`Dataset '${name}' have been successfully uploaded.`);
            }
            catch(err) {
                if (err.message) {
                    console.error(err.message);
                }
                else {
                    console.error("Unknown error occured");
                }
            }
        }
    );

commander.parse(process.argv);
