// constants
// things that we know wont change :) 
const TcpSockets = chrome.sockets.tcp, 
    ArrayBufferType = Int8Array;

const TcpListeners = {
    ps: PublishSubscribe,
    // add listener to tcp for receiving data and errors
    // we only want to add this once though    
    receive: function ( info ) {
        //Logger.log("TcpWrapper onReceive: " + JSON.stringify(info));
        TcpListeners.ps.publish( 'receive', info );
    }, 
    // taken from https://cs.chromium.org/chromium/src/net/base/net_error_list.h?sq=package:chromium&l=111
    // Ranges:
    //     0- 99 System related errors
    //   100-199 Connection related errors
    //   200-299 Certificate errors
    //   300-399 HTTP errors
    //   400-499 Cache errors
    //   500-599 ?
    //   600-699 FTP errors
    //   700-799 Certificate manager errors
    //   800-899 DNS resolver errors
    errorHandler: function ( info ) {
        // error code -100 is connection closed in relation to TCP FIN
        // this happens on the data channel
        if ( info.resultCode !== -100 ) {
            Logger.error( "TcpWrapper onReceiveError error: " + JSON.stringify( info ) );
            TcpListeners.ps.publish( 'receiveError', info );
        }
    } 
};

// TCP wrapper that does pub sub instead of callbacks
// this way we can have the ftp client listen for events
// and then react
// id can be an empty string or something to identify the different sockets
// that may be in use
function TcpWrapper( name ) {

    this.socketID = undefined;
    this.name = name;
    this.id = name;

    // our reference to the pub sub for pub - sub 
    TcpListeners.ps.subscribe( "receive" + this.id, this.receiveData, this );

    if ( !TcpSockets.onReceive.hasListeners() ) {
        TcpSockets.onReceive.addListener( TcpListeners.receive );
    }
    
    if ( !TcpSockets.onReceiveError.hasListeners() ) {
        TcpSockets.onReceiveError.addListener( TcpListeners.errorHandler );
    }
}

// connect and raise events
TcpWrapper.prototype.connect = function ( data ) {
    let host = data.host,
        port = ( typeof data.port !== 'undefined' ? data.port : 21 );
    if ( host && host.length > 0 ) {
        TcpSockets.create( {}, ( createInfo ) => {
            //Logger.log.call(this, "TcpWrapper connect tcp.create: " + JSON.stringify(createInfo));
            this.socketID = createInfo.socketId;
            // now actually connect
            TcpSockets.connect( this.socketID, host, +port, ( result ) => {
                //Logger.log.call(this, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
                TcpListeners.ps.publish( 'connected' + this.id, result );
            } );
        } );
    }
};

// send commands and raise notifications
// object should contain { msg: string }
TcpWrapper.prototype.sendCommand = function ( dataObj ) {
    let data = dataObj.msg,
        message = BufferConverter.encode( data + "\r\n", ArrayBufferType, 1 );
    //Logger.log("TcpWrapper sendCommand: " + this.id + " " + BufferConverter.decode(message, ArrayBufferType));
    TcpSockets.send( this.socketID, message, ( info ) => {
        TcpListeners.ps.publish( 'sendData' + this.id, info );
    } );
};

// receive data and raise events
TcpWrapper.prototype.receiveData = function ( info ) {
    let resultData;

    // compare socket ids and log
    if ( this.socketID && info.socketId !== this.socketID ) {
        Logger.log( "TcpWrapper receiveData sockets don't match: " + this.socketID + " " + info.socketId );
        return;
    }

    // conversion event
    resultData = BufferConverter.decode( info.data, ArrayBufferType );
    //Logger.log(`TcpWrapper receiveData data: ${this.socketID} ` + resultData);

    TcpListeners.ps.publish( 'receiveData' + this.id, {
        rawInfo: info,
        message: resultData
    } );
};

TcpWrapper.prototype.disconnect = function () {
    if ( this.socketID ) {
        TcpSockets.disconnect( this.socketID, ( info ) => {
            Logger.log( this.id + " socket disconnected!" );
            TcpListeners.ps.publish( 'disconnected' + this.id, info );
            try {
                TcpSockets.close( this.socketID, () => {
                    Logger.log( this.id + " socket close!" );
                    TcpListeners.ps.publish( 'closed' + this.id, {
                        socketID: this.socketID
                    } );
                    this.socketID = undefined;
                } );
            } catch ( e ) {
                Logger.log( "TcpWrapper exception closing socket " + e );
            }
        } );
    }
};
