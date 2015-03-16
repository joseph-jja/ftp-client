//basic buffer for convverting between strings
// could use TextDecoder and TextEncoder
// but this works for our ftp client
var BufferConverter =  {

	//takes an ArrayBuffer and then converts to String
	decode: function(data, type) {
		var i,
		buffer = new type(data),
		len = buffer.length,
		result = '';

		//console.log( new Int8( data ) );
		//console.log( new TextDecoder("ascii", { ignoreBOM: false }).decode(new Int8Array(data)) );

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
