var FS = {
  openFile: function(event) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function() {
      var dataURL = reader.result,
        asciiFile;

      asciiFile = BufferConverter.decode( dataURL, Uint8Array );
      console.log(asciiFile);
    };
    reader.readAsArrayBuffer( input.files[0] );
  }
};

