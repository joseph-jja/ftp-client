function Buffer() {
  this.types = [Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array,
                Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
  this.bufferType;
}

// takes an ArrayBuffer and figures ou it's type and then converts to a string
// useful in FTP when you are doing a chrome app and it gives you ArrayBuffers
Buffer.protoype.getDataType = function(buffer) {
    var i, resultType;
    for (i = 0; i < this.types.length; i++) {
        if (buffer instanceof this.types[i]) {
            resultType = this.types[i];
            break;
        }
    }
    this.bufferType = resultType;
    return resultType;
}
// takes an ArrayBuffer and then converts to String
Buffer.protoype.toString = function(data) {
    var i, 
        buffer = new this.bufferType(data),
        len = buffer.length,
        result = '';
    // loop de loop 
    for (i = 0; i < len; i++) {
        result += String.fromCharCode(buffer[i]);
    }
    return result;
}

// fixme
Buffer.protoype.encode = function(data) {
    var buf = new ArrayBuffer(data.length);
    // 2 bytes for each char 
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
