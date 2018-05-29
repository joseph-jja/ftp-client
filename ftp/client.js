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
    mediator.send( "command", {
        msg: this.commandList[ this.commandIndex ]
    } );
    this.commandIndex++;
};

// data is always sent on the data channel
FtpClient.prototype.sendData = function ( data ) {
    //Logger.log("FtpClient Data " + data);
    mediator.send( 'data', {
        'filedata': data
    } );
};

FtpClient.prototype.receiveCallback = function ( info ) {
    var buffer, result, self = this,
        portData, statusCode;

    // we now have status codes from commands sent on command channel
    statusCode = ResponseParser.parseStatusCode( info );
    //if ( statusCode ) {
    Logger.log( "FtpClient " + this.commandList[ this.commandIndex - 1 ] + " " + statusCode + " " + FtpResponseCodes[ statusCode ] );
    //}

    //Logger.log("FtpClient " + JSON.stringify(info));
    if ( info && info.message ) {
        result = info.message;
        buffer = this.resultData.innerHTML;
        this.resultData.innerHTML = buffer + result;
        this.resultData.scrollTop = this.resultData.scrollHeight;
        //Logger.log("FtpClient " + JSON.stringify(info));
        //    let directories = this.receivedFile.value.split( /\n/ );
        //    for ( let x = 0, end = directories.length; x < end; x++ ) {
        //        Logger.log( directories[ x ] );
        //    }
        if ( info.channel && info.channel === 'data' ) {
            buffer = this.receivedFile.value;
            this.receivedFile.value = buffer + result;
        }
    }

    if ( result && result.toLowerCase().indexOf( "227 entering passive mode" ) === 0 ) {
        // find the 6 digits - TODO better regexp here
        portData = ResponseParser.parsePasvMode( result, this.hostname.value );
        //Logger.log("FtpClient " + JSON.stringify(portData));
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
        //Logger.log("here we are with data? " + this.uploadData);
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
