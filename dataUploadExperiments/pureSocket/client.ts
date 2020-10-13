import net from "net";
import fs from "fs";
import zlib from "zlib";

var gz = zlib.createGzip();
const istream = fs.createReadStream("./file.txt").pipe(gz);
const socket = net.connect(8000, "0.0.0.0");

socket.emit("filename", "file.txt");

socket.pipe(process.stdout);

istream.on("readable", () => {
    let data;
    while (data = istream.read()) {
        socket.write(data);
    }
});

istream.on("end", () => {
    socket.end();
});
