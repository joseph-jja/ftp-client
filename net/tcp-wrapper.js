// constants
// things that we know wont change :) 
const TcpSockets = chrome.sockets.tcp, 
    ArrayBufferType = Int8Array;

// TCP wrapper that does pub sub instead of callbacks
// this way we can have the ftp client listen for events
// and then react
// id can be an empty string or something to identify the different sockets
// that may be in use
function TcpWrapper( id ) {

    this.socketID = undefined;
    this.id = id;

    // our reference to the pub sub for pub - sub 
    this.ps = PublishSubscribe;
    this.ps.subscribe( "receive" + this.id, this.receiveData, this );

    if ( !TcpSockets.onReceive.hasListeners() ) {
        // add listener to tcp for receiving data and errors
        // we only want to add this once though
        TcpSockets.onReceive.addListener( ( info ) => {
            //Logger.log("TcpWrapper onReceive: " + JSON.stringify(info));
            this.ps.publish( 'receive', info );
        } );
    }

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
    if ( !TcpSockets.onReceiveError.hasListeners() ) {
        TcpSockets.onReceiveError.addListener( ( info ) => {
            // error code -100 is connection closed in relation to TCP FIN
            // this happens on the data channel
            if ( info.resultCode !== -100 ) {
                Logger.error( "TcpWrapper onReceiveError error: " + JSON.stringify( info ) );
                this.ps.publish( 'receiveError', info );
            }
        } );
    }
}

// connect and raise events
TcpWrapper.prototype.connect = function ( data ) {
    let host = data.host,
        port = ( typeof data.port !== 'undefined' ? data.port : 21 );
    if ( host && host.length > 0 ) {
        TcpSockets.create( {}, ( createInfo ) => {
            this.socketID = createInfo.socketId;
            //Logger.log.call(this, "TcpWrapper connect tcp.create: " + JSON.stringify(createInfo));
            this.ps.publish( 'created' + this.id, createInfo );
            // now actually connect
            TcpSockets.connect( this.socketID, host, +port, ( result ) => {
                //Logger.log.call(this, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
                this.ps.publish( 'connected' + this.id, result );
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
        this.ps.publish( 'sendData' + this.id, info );
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

    this.ps.publish( 'receiveData' + this.id, {
        rawInfo: info,
        message: resultData
    } );
};

TcpWrapper.prototype.disconnect = function () {
    if ( this.socketID ) {
        TcpSockets.disconnect( this.socketID, ( info ) => {
            Logger.log( this.id + " socket disconnected!" );
            this.ps.publish( 'disconnected' + this.id, info );
            try {
                TcpSockets.close( this.socketID, () => {
                    Logger.log( this.id + " socket close!" );
                    this.ps.publish( 'closed' + this.id, {
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
