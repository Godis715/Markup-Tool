import fs from "fs";
import FormData from "form-data";

export async function uploadDataset(dirPath: string, datasetName: string, requestHeaders) {
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
            console.log(`written ${len} of ${length} bytes (${(len / length * 100).toFixed(2)}%)`);
        });
    });

    const requestOptions = {
        hostname: "46.4.97.234",
        path: "/api/dataset",
        port: 8000,
        headers: requestHeaders,
        timeout: 1
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