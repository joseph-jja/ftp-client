class TcpSockets {

    constructor( name ) {
        this.socketID = undefined;
        this.name = name;
        this.id = name;
        this.logger = new Logger( 'TcpSockets' );
        this.receiveChannel = `receive_${name}`;
        this.errorChannel = `error_${name}`;

        // constants
        // things that we know wont change :) 
        // I wish they could be private properties in chrome 70 :( 
        this.tcp = chrome.sockets.tcp;
        this.ArrayBufferType = Int8Array;
        this.ps = PublishSubscribe;

        // install listeners 
        const self = this;

        // add listener to tcp for receiving data and errors
        // each socket gets it's own listener on connect
        const receiveHandler = ( info ) => {

            if ( self.socketID && info.socketId && self.socketID === info.socketId ) {
                // conversion 
                const resultData = ( info.data ? BufferConverter.decode( info.data, self.ArrayBufferType ) : '' );
                self.logger.debug( `receiveData data: ${self.socketID} ${resultData}.` );
                self.ps.publish( self.receiveChannel, {
                    rawInfo: info,
                    message: resultData
                } );
            }
        };

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
        const errorHandler = ( info ) => {
            if ( self.socketID && info.socketId && self.socketID === info.socketId ) {
                // error code -100 is connection closed in relation to TCP FIN
                // this happens on the data channel
                if ( info.resultCode !== -100 ) {
                    self.logger.error( "onReceiveError error: " + JSON.stringify( info ) );
                    self.ps.publish( self.errorChannel, info );
                }
            }
        }

        this.tcp.onReceive.addListener( receiveHandler );
        this.tcp.onReceiveError.addListener( errorHandler );
        this.removeListeners = () => {
            this.tcp.onReceive.removeListener( receiveHandler );
            this.tcp.onReceiveError.removeListener( errorHandler );
        };
    }

    // connect and raise events
    connect( data ) {

        const host = data.host,
            port = ( typeof data.port !== 'undefined' ? data.port : 21 );

        if ( host && host.length > 0 ) {

            const connectCB = ( result ) => {
                this.logger.debug( "connect tcp.connect: " + JSON.stringify( result ) );
                this.ps.publish( 'connected' + this.id, result );
            };

            const create = new Promise( resolve => {
                this.tcp.create( {}, ( createInfo ) => {
                    this.socketID = createInfo.socketId;
                    this.logger.debug( "connect tcp.create: " + JSON.stringify( createInfo ) );
                    resolve();
                } );
            } );

            create.then( () => {
                // now actually connect
                this.tcp.connect( this.socketID, host, +port, connectCB );
            } );
        }
    }

    // send commands and raise notifications
    // object should contain { msg: string }
    sendCommand( dataObj ) {

        // convert data to be sent
        const message = BufferConverter.encode( dataObj.msg + '\r\n', this.ArrayBufferType, 1 );

        this.tcp.send( this.socketID, message, ( info ) => {
            this.ps.publish( 'sendData' + this.id, info );
        } );
    }

    disconnect() {
        if ( this.socketID ) {
            const closeCB = () => {
                this.logger.debug( this.id + " socket close!" );
                this.ps.publish( 'closed' + this.id, {
                    socketID: this.socketID
                } );
                this.socketID = undefined;
            };

            const disconnect = new Promise( resolve => {
                this.tcp.disconnect( this.socketID, ( info ) => {
                    this.logger.debug( this.id + " socket disconnected!" );
                    this.ps.publish( 'disconnected' + this.id, info );
                    resolve();
                } );
            } );

            disconnect.then( () => {
                try {
                    this.tcp.close( this.socketID, closeCB );
                } catch ( e ) {
                    this.logger.log( "exception closing socket " + e );
                }
            } );
        }
    }
};
