import fs from "fs";
import FormData from "form-data";
import readline from "readline";

// https://stackoverflow.com/questions/34570452/node-js-stdout-clearline-and-cursorto-functions
// логируем прогресс, перезаписывая старые данные
function printTheSameLine(message: string){
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(message);
}

export async function uploadDataset(dirPath: string, datasetName: string, requestHeaders, host: string, port: string, handleProgress: (progress: number) => void) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(
            (f) => f.isFile()
        )
        .map(
            (f) => f.name
        );

    const form = new FormData();
    files.forEach(
        (filename) => {
            const readStream = fs.createReadStream(`${dirPath}/${filename}`);
            form.append(filename, readStream);
        }
    );

    form.append("Dataset-Name", datasetName);

    form.getLength((err, length) => {            
        if (err) {
            throw err;
        }

        let len = 0;
        form.on("data", (data) => {
            len += data.length;
            handleProgress(len / length);
        });
    });

    const requestOptions = {
        hostname: host,
        path: `/api/dataset`,
        port,
        headers: requestHeaders,
    };

    return new Promise((resolve, reject) => {
        form.submit(requestOptions, (err, response) => {
            if (err) {
                reject(err);
                return;
            }

            if (response.statusCode !== 200) {
                reject(
                    new Error(`Server sent status code ${response.statusCode}. ${response.statusMessage}`)
                );
                return;
            }

            resolve(response);
        });
    }).catch(
        (err) => {
            form.destroy();
            return Promise.reject(err);
        } 
    );
}
