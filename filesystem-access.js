var FS = {
  openFile: function(event) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function() {
      var dataURL = reader.result;
      console.log(BufferConverter.decode( dataURL, Uint8Array ));
      //var output = document.getElementById('output');
      //output.src = dataURL;
    };
    reader.readAsArrayBuffer( input.files[0] );
  }
};

document.getElementById("sendFileID").addEventListener('change', FS.openFile);
