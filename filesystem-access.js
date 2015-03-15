var FS = {
  openFile: function(event, callback) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function() {
      var dataURL = reader.result,
        asciiFile;

      asciiFile = BufferConverter.decode( dataURL, Uint8Array );
      callback(asciiFile);
    };
    reader.readAsArrayBuffer( input.files[0] );
  }
};

