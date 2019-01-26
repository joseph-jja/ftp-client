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
        this.receveChannel = `receive_${name}`;
        this.errorChannel = `error_{name}`;

        // install listeners 
        if ( !tcp.onReceive.hasListeners() ) {
            tcp.onReceive.addListener( this.receive );
        }

        if ( !tcp.onReceiveError.hasListeners() ) {
            tcp.onReceiveError.addListener( TcpListeners.errorHandler );
        }
    }

    // add listener to tcp for receiving data and errors
    // we only want to add this once though    
    receive( info ) {
        //logger.log("TcpWrapper onReceive: " + JSON.stringify(info));
        ps.publish( 'receive', info );
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
        // error code -100 is connection closed in relation to TCP FIN
        // this happens on the data channel
        if ( info.resultCode !== -100 ) {
            logger.error( "TcpWrapper onReceiveError error: " + JSON.stringify( info ) );
            ps.publish( 'receiveError', info );
        }
    }

    // connect and raise events
    connect( data ) {

        const host = data.host,
            port = ( typeof data.port !== 'undefined' ? data.port : 21 );

        if ( host && host.length > 0 ) {
            const connectCB = ( result ) => {
                //logger.log.call(this, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
                ps.publish( 'connected' + this.id, result );
            };

            const create = new Promise( resolve => {
                tcp.create( {}, ( createInfo ) => {
                    resolve( createInfo );
                } );
            } );

            create.then( ( createInfo ) => {
                //logger.log(" connect tcp.create: " + JSON.stringify(createInfo));
                this.socketID = createInfo.socketId;
                // now actually connect
                tcp.connect( this.socketID, host, +port, connectCB );
            } );
        }
    }

    // send commands and raise notifications
    // object should contain { msg: string }
    sendCommand( dataObj ) {

        const message = BufferConverter.encode( dataObj.msg + "\r\n", ArrayBufferType, 1 );
        //logger.log("TcpWrapper sendCommand: " + this.id + " " + BufferConverter.decode(message, ArrayBufferType));

        tcp.send( this.socketID, message, ( info ) => {
                ps.publish( 'sendData' + this.id, info );
            };
        }

        // receive data and raise events
        receiveData( info ) {

            // compare socket ids and log
            if ( this.socketID && info.socketId !== this.socketID ) {
                logger.log( "receiveData sockets don't match: " + this.socketID + " " + info.socketId );
                return;
            }

            // conversion 
            const resultData = BufferConverter.decode( info.data, ArrayBufferType );
            //logger.log(`TcpWrapper receiveData data: ${this.socketID} ` + resultData);

            ps.publish( 'receiveData' + this.id, {
                rawInfo: info,
                message: resultData
            } );
        }

        disconnect() {
            if ( this.socketID ) {
                const closeCB = () => {
                    logger.log( this.id + " socket close!" );
                    ps.publish( 'closed' + this.id, {
                        socketID: this.socketID
                    } );
                    this.socketID = undefined;
                };

                const disconnect = new Promise( resolve => {
                    tcp.disconnect( this.socketID, ( info ) => {
                        logger.log( this.id + " socket disconnected!" );
                        ps.publish( 'disconnected' + this.id, info );
                        resolve();
                    } );
                } );

                disconnect.then( () => {
                    try {
                        tcp.close( this.socketID, closeCB );
                    } catch ( e ) {
                        logger.log( "TcpWrapper exception closing socket " + e );
                    }
                } );
            }
        }
    };
