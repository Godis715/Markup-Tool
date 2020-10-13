import fs from "fs";
import zlib from "zlib";

const gz = zlib.createGunzip();

function getDestination (req, file, cb) {
    cb(null, '/dev/null')
}


class MyCustomStorage {
    public getDestination;

    constructor(opts) {
        this.getDestination = (opts.destination || getDestination)
    }
    
    public _handleFile(req, file, cb) {
        this.getDestination(req, file, function (err, path) {
            if (err) return cb(err)
    
            var outStream = fs.createWriteStream(path)
    
            file.stream.pipe(gz).pipe(outStream)
            outStream.on('error', cb)
            outStream.on('finish', function () {
                cb(null, {
                    path: path,
                    size: outStream.bytesWritten
                })
            })
        })
    }

    public _removeFile(req, file, cb) {
        fs.unlink(file.path, cb)
    }
}

export default MyCustomStorage;
