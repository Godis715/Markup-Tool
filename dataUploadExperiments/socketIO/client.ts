import socketIO from "socket.io-client";
import ss from "socket.io-stream";
import zlib from "zlib";
import fs from "fs";

const socket = socketIO.connect("localhost");
var stream = ss.createStream();
var filename = "../file.txt";
const gz = zlib.createGzip();

ss(socket).emit('image', stream, { name: filename });
fs.createReadStream(filename).pipe(gz).pipe(stream);
