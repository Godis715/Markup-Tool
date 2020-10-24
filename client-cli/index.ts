import axios from "axios";
import commander from "commander";
import { prompt } from "inquirer";
import { uploadDataset } from "./upload";

const axiosInst = axios.create({
    baseURL: "http://46.4.97.234:8000/api"
});

commander
    .version("1.0.0")
    .description("CLI administration panel.");

commander
    .command("upload-dataset [name] [path]")
    .description("Uploading dataset into the service")
    .action(
        async (name, path) => {
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
    
                const response = await axiosInst.post("/auth/login", { login, password });
                const setCookies = response.headers["set-cookie"];
                
                await uploadDataset(path, name, { "Cookie": setCookies, "Csrf-Access-Token": response.data.csrfAccessToken });
            }
            catch(err) {
                if (err) {
                    console.error(err.message);
                }
                else {
                    console.error("Unknown error occured");
                }
            }
        }
    );

commander.parse(process.argv);
