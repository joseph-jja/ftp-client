var ftp, mediator;
// main
window.onload = function () {
    document.querySelector( '#greeting' ).innerText = 'ftp-client';

    ftp = new FtpClient();

    mediator = new FtpMediator( ftp, ftp.receiveCallback );

    document.getElementById( 'connectID' ).addEventListener( 'click', function ( e ) {
        var txt = this.innerHTML;
        if ( txt === 'Connect' ) {
            ftp.connect();
            this.innerHTML = "Disconnect";
        } else {
            ftp.quit();
            this.innerHTML = "Connect";
        }
        return false;
    } );

    document.getElementById( "uploadDataToggle" ).addEventListener( 'click', function ( e ) {
        const tgt = e.target;
        if ( tgt.nodeName.toLowerCase() !== 'span' ) {
            return  
        }
        const txt = tgt.innerHTML;
        if ( txt.indexOf( "Connection" ) !== -1 ) {
            ftp.resultData.style.display = 'none';
            ftp.loggerData.style.display = 'none';
            ftp.receivedData.style.display = '';
            ftp.receivedFile.style.display = '';
            ftp.receivedFile.style.height = '16em';
        } else if ( txt.indexOf( "Received" ) !== -1 ) {
            ftp.loggerData.style.display = 'none';
            ftp.receivedData.style.display = 'none';
            ftp.receivedFile.style.display = 'none';
            ftp.resultData.style.display = '';
        } else if ( txt.indexOf( "Logger" ) !== -1 ) {
            ftp.resultData.style.display = 'none';
            ftp.receivedData.style.display = 'none';
            ftp.receivedFile.style.display = 'none';
            ftp.loggerData.style.display = '';
        }
        return false;
    } );

    document.getElementById( 'sendCommand' ).addEventListener( 'click', function ( e ) {

        var cmd = document.getElementById( 'command' ).value;
        if ( cmd && cmd.length > 0 ) {
            cmd = cmd.replace( /^\s/g, '' ).replace( /\s$/g, '' );
            if ( cmd === 'ls' ) {
                ftp.commandList = FtpCommandSets.listDir;
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else if ( cmd.indexOf( 'bin' ) !== -1 ) {
                ftp.commandList = [ 'TYPE i' ];
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else if ( cmd.indexOf( 'ascii' ) !== -1 ) {
                ftp.commandList = [ 'TYPE a' ];
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else if ( cmd.indexOf( 'get' ) !== -1 ) {
                ftp.commandList = FtpCommandSets.getFile;
                ftp.commandList[ ftp.commandList.length - 1 ] = 'RETR ' + cmd.substring( 4 );
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else if ( cmd.indexOf( 'cd' ) !== -1 || cmd.indexOf( "CWD" ) !== -1 ) {
                cmd = cmd.replace( 'cd', 'CWD' );
                ftp.commandList = [ cmd ];
                ftp.commandList = ftp.commandList.concat( FtpCommandSets.listDir );
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else if ( cmd.indexOf( 'del ' ) !== -1 || cmd.indexOf( "DELE" ) !== -1 ) {
                if ( cmd.indexOf( 'del ' ) !== -1 ) {
                    cmd = cmd.replace( 'del ', 'DELE ' );
                }
                ftp.commandList = [ cmd ];
                ftp.commandList = ftp.commandList.concat( FtpCommandSets.listDir );
                ftp.commandIndex = 0;
                ftp.sendCommand();
            } else {
                ftp.commandList = [ cmd ];
                ftp.commandIndex = 0;
                ftp.sendCommand();
            }
        }
        return false;
    } );

    let sendFileElement = document.getElementById( "sendFileID" );
    sendFileElement.addEventListener( 'change', function ( event ) {
        FS.openFile( event, function ( data ) {
            var parts, filename = sendFileElement.value;

            parts = filename.split( /\/|\\/g );
            filename = parts[ parts.length - 1 ];
            Logger.log( filename );
            ftp.commandIndex = 0;
            ftp.commandList = FtpCommandSets.uploadFile;
            ftp.commandList[ 1 ] = "STOR " + filename;
            ftp.uploadData = data;
            ftp.sendCommand();
            sendFileElement.value = '';
        } );
    } );

    document.getElementById( 'saveDataButton' ).addEventListener( 'click', function ( e ) {

        var contents = ftp.receivedFile.value;
        if ( !contents ) {
            // TODO raise error
            return;
        }
        // bring up the save file selection dialog box
        chrome.fileSystem.chooseEntry( {
            type: 'saveFile'
        }, function ( chosenFileEntry ) {
            if ( chosenFileEntry ) {
                // we now have a FIleEntry from HTML 5 specs
                chosenFileEntry.createWriter( function ( writer ) {
                    writer.onerror = function ( err ) {
                        Logger.log( "Save error " + JSON.stringify( err ) );
                    };
                    writer.onwriteend = function ( err ) {
                        Logger.log( "File saved " + JSON.stringify( err ) );
                    };
                    writer.write( new Blob( [ contents ], {
                        type: 'text/plain'
                    } ) );
                } );
            }
        } );
    } );

    document.getElementById( 'clearBuffer' ).addEventListener( 'click', function ( e ) {

        ftp.resultData.innerHTML = "";
        return false;
    } );
};
