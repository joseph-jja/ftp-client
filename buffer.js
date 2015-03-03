function Buffer() {
  this.types = [Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array,
                Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
  this.bufferType;
  this.multipliers = [ 1, 1, 1, 1, 2, 2, 4, 4, 4, 8];
  this.bufferMultiplier;
}

// takes an ArrayBuffer and figures ou it's type and then converts to a string
// useful in FTP when you are doing a chrome app and it gives you ArrayBuffers
Buffer.protoype.getDataType = function(buffer) {
    var i, resultType;
    for (i = 0; i < this.types.length; i++) {
        if (buffer instanceof this.types[i]) {
            resultType = this.types[i];
            this.bufferMultiplier = this.multipliers[i];
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

// FIXME??  not sure if this is totall correct
Buffer.protoype.encode = function(data) {
    var i, len, buffer, 
      buf = new ArrayBuffer(data.length * this.bufferMultipler);
      
    buffer = new this.bufferType(buf);
    len = data.length;
    
    for (i = 0; i < len; i++) {
        buffer[i] = data.charCodeAt(i);
    }
    return buf;
}
