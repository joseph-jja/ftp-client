const COMMAND_CHANNEL_NAME = 'command',
    DATA_CHANNEL_NAME = 'data';

const channelNames = {
    [ COMMAND_CHANNEL_NAME ]: 'ftpCommandChannel',
    [ DATA_CHANNEL_NAME ]: 'ftpDataChannel'
};

// man in the middle for mediating between UI and tcp code
class FtpMediator {

    constructor( receiveHandler, receiveCB ) {

        // the channels and their sockets
        this.ftpCommandChannel = new TcpSockets( COMMAND_CHANNEL_NAME );
        this.ftpDataChannel = new TcpSockets( DATA_CHANNEL_NAME );

        this.ps = PublishSubscribe;

        this.logger = new Logger( 'FtpMediator' );

        this.receiveHandler = receiveHandler;
        this.receiveCB = receiveCB;

        // setup command channel
        this.ps.subscribe( 'disconnect' + this.ftpCommandChannel.id, () => {
            this.ftpCommandChannel.disconnect();
            this.ftpCommandChannel.removeListeners();
        }, this.ftpCommandChannel );
        this.ps.subscribe( this.ftpCommandChannel.receiveChannel, this.receive, this );
        this.ps.subscribe( this.ftpCommandChannel.errorChannel, this.logger.error, this );

        // setup data channel
        this.ps.subscribe( 'disconnect' + this.ftpDataChannel.id, () => {
            this.ftpDataChannel.disconnect();
            this.ftpCommandChannel.removeListeners();
        }, this.ftpDataChannel );
        this.ps.subscribe( this.ftpDataChannel.receiveChannel, this.receive, this );
        this.ps.subscribe( this.ftpDataChannel.errorChannel, this.logger.error, this );


        // listen for connections and log
        if ( this.logger.logLevel === 'debug' ) {
            this.ps.subscribe( 'connected' + this.ftpCommandChannel.id, ( data ) => {
                this.logger.debug( "connected " + JSON.stringify( data ) + " " + this.ftpCommandChannel.socketID );
            } );
        }

        // on connect to the data port no data is actually sent 
        // so the onReceive is not fired
        this.ps.subscribe( 'connected' + this.ftpDataChannel.id, ( data ) => {
            //this.logger.log("connected " + JSON.stringify(data) + " " + this.ftpDataChannel.socketID);
            if ( this.receiveCB ) {
                //this.logger.log("callback: " + this.receiveCB );
                this.receiveCB.call( this.receiveHandler, data );
            }
        } );

        // listen for data connection data sent
        this.ps.subscribe( 'sendData' + this.ftpDataChannel.id, ( data ) => {
            // when data channel sends data, no data is received
            // notify client
            this.logger.debug( "data sent: " + JSON.stringify( data ) );
            // close socket because we should be done with the passive port
            this.disconnect( this.ftpDataChannel.id );

            this.ps.publish( 'datauploaded' + this.ftpDataChannel.id, data );
        } );
    }

    // connect and on which channel
    connect( channel, data ) {
        const ftpChannel = this[ channelNames[ channel ] ];

        this.logger.debug( "connect: " + ftpChannel.id + " " + channel + " " + JSON.stringify( data ) );
        ftpChannel.connect( data );
    }

    // disconnect
    disconnect( channel ) {
        this.ps.publish( 'disconnect' + channel, {} );
    }

    // send command
    send( channel, data ) {

        const ftpChannel = this[ channelNames[ channel ] ];

        ftpChannel.sendCommand( {
            'msg': data.filedata
        } );
    }
}

// receive data
FtpMediator.prototype.receive = function ( data ) {

    // pass the data to the client
    this.logger.debug( "receive: " + JSON.stringify( data ) );
    if ( this.receiveCB ) {
        let result = Object.assign( {}, data );
        if ( data && data.rawInfo && data.rawInfo.socketId ) {
            this.logger.debug( "receive: " + data.rawInfo.socketId + " " + this.ftpCommandChannel.socketID );
            const activeChannel = ( data.rawInfo.socketId === this.ftpCommandChannel.socketID ) ? 'command' : 'data';
            const ftpChannel = this[ channelNames[ activeChannel ] ];
            result = Object.assign( {}, data, {
                channel: ftpChannel
            } );
        }
        //this.logger.debug( "callback: " + this.receiveCB );
        this.receiveCB.call( this.receiveHandler, result );
    }
};

