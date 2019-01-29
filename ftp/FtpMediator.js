// ftp client library
// ok so mediator and tcp-wrapper handle network communication
// this now becomes the UI portion
// so this object knows UI elements
// http://www.ncftp.com/libncftp/doc/ftp_overview.html
function FtpClient() {

    this.hostname = document.getElementById( "ftpHost" );
    this.port = document.getElementById( "ftpPort" );
    this.username = document.getElementById( "username" );
    this.password = document.getElementById( "password" );
    this.resultData = document.getElementById( "resultData" );
    this.receivedFile = document.getElementById( "receivedFile" );
    this.loggerData = document.getElementById( "loggerData" );
    this.receivedData = document.getElementById( "receivedData" );

    this.logger = new Logger( 'FtpClient' );

    this.loggerData.style.display = 'none';
    this.receivedData.style.display = 'none';

    this.channel = 'command';

    this.commandList = [];
    this.commandIndex = 0;

    this.uploadData = undefined;
    this.resultData.innerHTML = "";
}

// commands are always sent on the command channel
FtpClient.prototype.sendCommand = function () {
    mediator.send( mediator.ftpCommandChannel, this.commandList[ this.commandIndex ] );
    this.commandIndex++;
};

// data is always sent on the data channel
FtpClient.prototype.sendData = function ( data ) {
    mediator.send( mediator.ftpDataChannel, this.commandList[ this.commandIndex ] );
};

FtpClient.prototype.receiveCallback = function ( info = {} ) {
    let result;

    // we now have status codes from commands sent on command channel
    const statusCode = ResponseParser.parseStatusCode( info );
    this.logger.debug( `${this.commandList[ this.commandIndex - 1 ]} ${statusCode} ${FtpResponseCodes[ statusCode ]}` );

    if ( info.rawInfo ) {
        this.logger.debug( JSON.stringify( info.rawInfo ) );
    }
    if ( info.message ) {
        result = info.message;
        this.logger.debug( info.message );
        this.logger.log( `Channel name ${info.channel.name}` );
        let buffer = this.resultData.innerHTML;
        this.resultData.innerHTML = buffer + result;
        this.resultData.scrollTop = this.resultData.scrollHeight;

        if ( info.channel && info.channel.name === 'data' ) {
            buffer = this.receivedFile.value;
            this.receivedFile.value = buffer + result;
        }
    }
    

    if ( result && result.toLowerCase().indexOf( "227 entering passive mode" ) === 0 ) {
        // find the 6 digits - TODO better regexp here
        const portData = ResponseParser.parsePasvMode( result, this.hostname.value );
        //this.logger.log( JSON.stringify(portData));
        this.receivedFile.value = '';
        this.channel = 'data';
        mediator.connect( 'data', {
            host: portData.host,
            port: +portData.port
        } );
    } else if ( this.commandIndex < this.commandList.length ) {
        this.sendCommand();
    } else if ( this.commandIndex >= this.commandList.length ) {
        this.commandList = [];
        this.commandIndex = 0;
        // if we are doing a store now we send the data
        //this.logger.log("here we are with data? " + this.uploadData);
        if ( typeof this.uploadData !== 'undefined' ) {
            this.sendData( this.uploadData );
        }
    }
};

FtpClient.prototype.reset = function ( data ) {
    this.uploadData = undefined;
};

FtpClient.prototype.connect = function () {
    var self = this;

    mediator.ps.subscribe( 'datauploaded' + mediator.ftpDataChannel.id, self.reset, self );

    if ( this.hostname.value && this.hostname.value.length > 0 ) {
        port = ( this.port.value && this.port.value.length > 0 ) ? this.port.value : 21;

        if ( this.username.value && this.username.value.length > 0 && this.password.value && this.password.value.length > 0 ) {
            this.channel = 'command';
            this.commandIndex = 0;
            this.uploadData = undefined;
            this.commandList = FtpCommandSets.getLoginCommandSet( this.username.value, this.password.value );
        }
        mediator.connect( "command", {
            host: this.hostname.value,
            port: port
        } );
    }
};

FtpClient.prototype.quit = function () {
    var self = this;
    mediator.disconnect( 'command' );
    mediator.disconnect( 'data' );
    mediator.ps.unsubscribe( 'datauploaded' + mediator.ftpDataChannel.id, self.reset, self );
};
