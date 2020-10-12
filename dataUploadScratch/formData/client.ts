import { uploadDataset } from "./upload";

uploadDataset(process.argv[2], process.argv[3]).catch(
    (err) => {
        console.error(err);
    }
);
