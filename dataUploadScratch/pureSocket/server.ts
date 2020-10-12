import net from "net";
import fs from "fs";
import zlib from "zlib";

var gz = zlib.createGunzip();

const ostream = fs.createWriteStream("./recieved.txt");
const date = new Date();
let elapsed: number;
let size = 0;

const server = net.createServer(
    (socket) => {
        socket
            .on("filename", (filename) => console.log(filename))
            .on("data", (chunk) => {
                size += chunk.length;
                elapsed = new Date().getTime() - date.getTime();
                socket.write(`\r${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`)
                // process.stdout.write(`\r${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`);
            })   
            .pipe(gz)
            .pipe(ostream)
            .on("end", () => {
                console.log(`\nFinished getting file. speed was: ${((size / (1024 * 1024)) / (elapsed / 1000)).toFixed(2)} MB/s`);
                process.exit();
            }); 
    }
);

server.listen(8000, "0.0.0.0");
