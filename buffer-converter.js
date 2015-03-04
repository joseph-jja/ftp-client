//basic buffer for convverting between strings
var BufferConverter =  {
	types: [Array, Int8Array, Uint8Array,
	        Uint8ClampedArray, Int16Array, Uint16Array,
	        Int32Array, Uint32Array, Float32Array, Float64Array ],
	bufferType: undefined,
	multipliers: [ 1, 1, 1, 1, 2, 2, 4, 4, 4, 8],
	bufferMultiplier: undefined,

	// takes an ArrayBuffer and figures ou it's type and then converts to a string
	// useful in FTP when you are doing a chrome app and it gives you ArrayBuffers
	// FIXME does not work as planned as ArrayBuffers are not instance of something else :( 
	getDataType:  function(data) {
	   	var i, resultType;
	   	for (i = 0; i < this.types.length; i++) {
	   		if (data instanceof this.types[i]) {
	   			resultType = this.types[i];
	   			this.bufferMultiplier = this.multipliers[i];
	   			break;
	  		}
	   	}
	   	this.bufferType = resultType;
	   	return resultType;
	},

	//takes an ArrayBuffer and then converts to String
	decode: function(data, type) {
		var i,
		buffer = new type(data),
		len = buffer.length,
		result = '';
		// loop de loop
		for (i = 0; i < len; i++) {
			result += String.fromCharCode(buffer[i]);
		}
		return result;
	},
	
	//FIXME??  not sure if this is totally correct
	encode: function(data, type, multiplier) {
		var i, len, buffer,
		buf = new ArrayBuffer(data.length * multiplier);
	
		buffer = new type(buf);
		len = data.length;
	
		for (i = 0; i < len; i++) {
			buffer[i] = data.charCodeAt(i);
		}
		return buf;
	}

}
