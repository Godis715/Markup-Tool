import commander from "commander";
import { prompt } from "inquirer";
import axios from "axios";
import { uploadDataset } from "../dataUploadScratch/formData/upload";

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
    
                const response = await axios.post("http://localhost:8000/api/auth/login", { login, password });
                const setCookies = response.headers["set-cookie"];
                
                await uploadDataset(path, name, { "Cookie": setCookies, "Csrf-Access-Token": response.data.csrfAccessToken });
            }
            catch(err) {
                console.error(err);
            }
        }
    );

commander.parse(process.argv);
