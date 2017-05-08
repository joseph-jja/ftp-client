const FS = {
  openFile: (event, callback) => {
    let input = event.target;

    let reader = new FileReader();
    if ( input.files.length > 0 ) {
      reader.onload = function() {
        let dataURL = reader.result,
          asciiFile;

        asciiFile = BufferConverter.decode( dataURL, Uint8Array );
        callback(asciiFile);
      };
      reader.readAsArrayBuffer( input.files[0] );
    }
  }, 
  ftpRoot: 'ftp-root',
  mountFileSystem: () => {
    chrome.fileSystemProvider.mount( { 
      fileSystemId: FS.ftpRoot, 
      displayName: FS.ftpRoot
    }, () => { 
      console.log( 'Filesystem mounted.' ); 
    } );
  }, 
  unmountFileSystem: () => {
    chrome.fileSystemProvider.unmount( { 
      fileSystemId: FS.ftpRoot 
    }, () => { 
      console.log( 'Filesystem unmounted.' ); 
    } );
  }
};

