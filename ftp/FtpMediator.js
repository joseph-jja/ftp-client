const COMMAND_CHANNEL_NAME = 'command',
    DATA_CHANNEL_NAME = 'data';

const channelNames = {
    [ COMMAND_CHANNEL_NAME ]: 'ftpCommandChannel',
    [ DATA_CHANNEL_NAME ]: 'ftpDataChannel'
};

// man in the middle for mediating between UI and tcp code
class FtpMediator {

    constructor() {

        // the channels and their sockets
        this.ftpCommandChannel = new TcpSockets( COMMAND_CHANNEL_NAME );
        this.ftpDataChannel = new TcpSockets( DATA_CHANNEL_NAME );

        this.ps = PublishSubscribe;

        this.logger = new Logger( 'FtpMediator' ); //, { logLevel: 'debug' } );

        // setup command channel
        this.ps.subscribe( this.ftpCommandChannel.receiveChannel, this.receive, this );
        this.ps.subscribe( this.ftpCommandChannel.errorChannel, this.logger.error, this );

        // setup data channel
        this.ps.subscribe( this.ftpDataChannel.receiveChannel, this.receive, this );
        this.ps.subscribe( this.ftpDataChannel.errorChannel, this.logger.error, this );

        // on connect to the data port no data is actually sent
        // so the onReceive is not fired
        this.ps.subscribe( 'connected' + this.ftpDataChannel.id, this.receive, this );

        // listen for data connection data sent
        this.ps.subscribe( 'sendData' + this.ftpDataChannel.id, ( data ) => {
            // when data channel sends data, no data is received
            // notify client
            this.logger.debug( `data sent: ${JSON.stringify( data )}` );

            // wait a second, err 2 in order to send large amounts of data
            setTimeout( () => {
                // close socket because we should be done with the passive port
                this.disconnect( this.ftpDataChannel.id );

                this.ps.publish( 'datauploaded' + this.ftpDataChannel.id, data );
            }, 2000 );
        } );
    }

    // connect and on which channel
    connect( channel, data ) {
        const ftpChannel = this[ channelNames[ channel ] ];

        this.logger.debug( `connect: ${ftpChannel.id} channel ${JSON.stringify( data )}` );
        ftpChannel.connect( data );
    }

    // disconnect
    disconnect( channel ) {
        const ftpChannel = this[ channelNames[ channel ] ];
        ftpChannel.disconnect();
    }

    // send command
    send( channel, data ) {
        channel.sendCommand( {
            'msg': data
        } );
    }

    // receive data
    receive( data ) {

        this.logger.debug( "receive: " + JSON.stringify( data ) );

        // which channel are we?
        const channel = ( data.rawInfo && data.rawInfo.socketId === this.ftpCommandChannel.socketID ) ? COMMAND_CHANNEL_NAME : DATA_CHANNEL_NAME;
        const ftpChannel = this[ channelNames[ channel ] ];

        // debugging
        this.logger.debug( `receive: ${channel} ${ftpChannel.socketID}` );

        this.ps.publish( 'mediatorReceive', data );
    }
}
