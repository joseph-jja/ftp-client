class TcpSockets {

    // constants
    // things that we know wont change :) 
    const tcp = chrome.sockets.tcp,
        ArrayBufferType = Int8Array,
        ps = PublishSubscribe,
        logger = new Logger( 'TcpSockets' );

    constructor( name ) {
        this.socketID = undefined;
        this.name = name;
        this.id = name;
        this.receiveChannel = `receive_${name}`;
        this.errorChannel = `error_{name}`;
    }

    // add listener to tcp for receiving data and errors
    // each socket gets it's own listener on connect
    receiveHandler( info ) {

        if ( this.socketID && info.socketId && this.socketID == info.socketID ) {
            // conversion 
            const resultData = ( info.data ? BufferConverter.decode( info.data, ArrayBufferType ) : '' );
            logger.debug( `receiveData data: ${this.socketID} ${resultData}.` );
            ps.publish( 'receiveData' + this.id, {
                rawInfo: info,
                message: resultData
            } );
        }
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
    errorHandler( info ) {
        if ( this.socketID && info.socketId && this.socketID == info.socketID ) {
            // error code -100 is connection closed in relation to TCP FIN
            // this happens on the data channel
            if ( info.resultCode !== -100 ) {
                logger.error( "onReceiveError error: " + JSON.stringify( info ) );
                ps.publish( this.errorChannel, info );
            }
        }
    }

    // connect and raise events
    connect( data ) {

        const host = data.host,
            port = ( typeof data.port !== 'undefined' ? data.port : 21 );

        if ( host && host.length > 0 ) {

            // install listeners 
            tcp.onReceive.addListener( this.receiveHandler );
            tcp.onReceiveError.addListener( this.errorHandler );

            const connectCB = ( result ) => {
                logger.debug( "connect tcp.connect: " + JSON.stringify( result ) );
                ps.publish( 'connected' + this.id, result );
            };

            const create = new Promise( resolve => {
                tcp.create( {}, ( createInfo ) => {
                    this.socketID = createInfo.socketId;
                    logger.debug( "connect tcp.create: " + JSON.stringify( createInfo ) );
                    resolve();
                } );
            } );

            create.then( () => {
                // now actually connect
                tcp.connect( this.socketID, host, +port, connectCB );
            } );
        }
    }

    // send commands and raise notifications
    // object should contain { msg: string }
    sendCommand( dataObj ) {

        // convert data to be sent
        const message = BufferConverter.encode( dataObj.msg + "\r\n", ArrayBufferType, 1 );

        tcp.send( this.socketID, message, ( info ) => {
            ps.publish( 'sendData' + this.id, info );
        } );
    }

    disconnect() {
        if ( this.socketID ) {
            const closeCB = () => {
                logger.debug( this.id + " socket close!" );
                ps.publish( 'closed' + this.id, {
                    socketID: this.socketID
                } );
                this.socketID = undefined;
            };

            const disconnect = new Promise( resolve => {
                tcp.disconnect( this.socketID, ( info ) => {
                    logger.debug( this.id + " socket disconnected!" );
                    ps.publish( 'disconnected' + this.id, info );
                    resolve();
                } );
            } );

            disconnect.then( () => {
                try {
                    tcp.close( this.socketID, closeCB );
                } catch ( e ) {
                    logger.log( "exception closing socket " + e );
                }
            } );
        }
        // uninstall listeners 
        tcp.onReceive.removeListener( this.receive );
        tcp.onReceiveError.removeListener( this.errorHandler );
    }
};
