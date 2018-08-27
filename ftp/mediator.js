const COMMAND_CHANNEL_NAME = 'command',
    DATA_CHANNEL_NAME = 'data';

const channelNames = {};
channelNames[ COMMAND_CHANNEL_NAME ] = 'ftpCommandChannel';
channelNames[ DATA_CHANNEL_NAME ] = 'ftpDataChannel';

// man in the middle for mediating between UI and tcp code
function FtpMediator( receiver, receiveHandler ) {

    // the channels and their sockets
    this.ftpCommandChannel = new TcpWrapper( COMMAND_CHANNEL_NAME );
    this.ftpDataChannel = new TcpWrapper( DATA_CHANNEL_NAME );

    this.ps = PublishSubscribe;
    
    this.logger = new Logger( 'FtpMediator' );

    this.receiveHandler = receiver;
    this.receiveCB = receiveHandler;

    this.ps.subscribe( 'receive', ( data ) => {
        const activeChannel = ( data.socketId === this.ftpCommandChannel.socketID ) ? COMMAND_CHANNEL_NAME : DATA_CHANNEL_NAME;

        //this.logger.log("receive channel id " + activeChannel + " " + JSON.stringify(data));
        this.ps.publish( 'receive' + activeChannel, data );
    }, this );

    // setup command channel
    this.ps.subscribe( 'disconnect' + this.ftpCommandChannel.id, this.ftpCommandChannel.disconnect, this.ftpCommandChannel );
    this.ps.subscribe( 'sendCommand' + this.ftpCommandChannel.id, this.ftpCommandChannel.sendCommand, this.ftpCommandChannel );
    this.ps.subscribe( 'receiveData' + this.ftpCommandChannel.id, this.receive, this );

    // setup data channel
    this.ps.subscribe( 'disconnect' + this.ftpDataChannel.id, this.ftpDataChannel.disconnect, this.ftpDataChannel );
    this.ps.subscribe( 'sendCommand' + this.ftpDataChannel.id, this.ftpDataChannel.sendCommand, this.ftpDataChannel );
    this.ps.subscribe( 'receiveData' + this.ftpDataChannel.id, this.receive, this );

    // listen for connections and log
    //this.ps.subscribe( 'connected' + this.ftpCommandChannel.id, ( data ) => {
    //    this.logger.log("connected " + JSON.stringify(data) + " " + this.ftpCommandChannel.socketID);
    //} );

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
        this.logger.log( "data sent: " + JSON.stringify( data ) );
        // close socket because we should be done with the passive port
        this.disconnect( this.ftpDataChannel.id );

        this.ps.publish( 'datauploaded' + this.ftpDataChannel.id, data );
    } );
}

// connect and on which channel
FtpMediator.prototype.connect = function ( channel, data ) {
    const ftpChannel = this[ channelNames[ channel ] ];

    //this.logger.log("connect: " + ftpChannel.id + " " + channel + " " + JSON.stringify(data) );
    ftpChannel.connect( data );
};

// receive data
FtpMediator.prototype.receive = function ( data ) {

    let result = Object.assign( {}, data );
    // pass the data to the client
    //this.logger.log("receive: " + JSON.stringify(data) );
    if ( this.receiveCB ) {
        if ( data && data.rawInfo && data.rawInfo.socketId ) {
            //this.logger.log("receive: " + data.rawInfo.socketId + " " + this.ftpCommandChannel.socketID);
            const activeChannel = ( data.rawInfo.socketId === this.ftpCommandChannel.socketID ) ? 'command' : 'data';
            const ftpChannel = this[ channelNames[ activeChannel ] ];
            result = Object.assign( {}, data, { channel: ftpChannel } );
        }
        //this.logger.log("callback: " + this.receiveCB );
        this.receiveCB.call( this.receiveHandler, result );
    }
};

// send command
FtpMediator.prototype.send = function ( channel, data ) {

    // always send commands on command channel
    // so we peek into the message looking for a file upload
    if ( typeof data.filedata !== 'undefined' ) {
        //this.logger.log("Got data? " + data.filedata);
        // the socket just needs a message to send, but the mediator uses filedata 
        // as an identifier as the type of message which translates into the channel to use
        // OMG what was I thinking?
        this.ps.publish( 'sendCommand' + this.ftpDataChannel.id, {
            'msg': data.filedata
        } );
    } else {
        this.ps.publish( 'sendCommand' + this.ftpCommandChannel.id, data );
    }
};

// disconnect
FtpMediator.prototype.disconnect = function ( channel ) {
    this.ps.publish( 'disconnect' + channel, {} );
};
