import socketIO from "socket.io";
import ss from "socket.io-stream";
import zlib from "zlib";
import fs from "fs";

const io = socketIO.listen(8000);
const gz = zlib.createGunzip();

io.on("connection", function(socket) {
    ss(socket).on("image", (stream, data) => {
        console.log("image");
        const filename = data.name;
        stream.pipe(gz).pipe(fs.createWriteStream(filename));
    });
});
