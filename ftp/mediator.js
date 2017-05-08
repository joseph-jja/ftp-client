// man in the middle for mediating between UI and tcp code
function FtpMediator( receiver, receiveHandler ) {

    // the channels and their sockets
    this.ftpCommandChannel = new TcpWrapper( "command" );
    this.ftpDataChannel = new TcpWrapper( "data" );
    this.ftpCommandSockID = undefined;
    this.ftpDataSockID = undefined;

    this.ps = PublishSubscribe;
    this.receiveCB = undefined;

    this.receiveHandler = receiver;
    this.receiveCB = receiveHandler;

    this.ps.subscribe( 'receive', ( data ) => {
        let channelName,
            activeChannel;
        activeChannel = ( data.socketId === this.ftpCommandChannel.socketID ) ? 'command' : 'data';
        channelName = this.getChannel( activeChannel );
        //Logger.log("FtpMediator receive channel id " + channelName.id + " " + JSON.stringify(data));
        this.ps.publish( 'receive' + channelName.id, data );
    }, this );

    // setup command channel
    this.ps.subscribe( 'connect' + this.ftpCommandChannel.id, this.ftpCommandChannel.connect, this.ftpCommandChannel );
    this.ps.subscribe( 'disconnect' + this.ftpCommandChannel.id, this.ftpCommandChannel.disconnect, this.ftpCommandChannel );
    this.ps.subscribe( 'sendCommand' + this.ftpCommandChannel.id, this.ftpCommandChannel.sendCommand, this.ftpCommandChannel );
    this.ps.subscribe( 'receiveData' + this.ftpCommandChannel.id, this.receive, this );

    // setup data channel
    this.ps.subscribe( 'connect' + this.ftpDataChannel.id, this.ftpDataChannel.connect, this.ftpDataChannel );
    this.ps.subscribe( 'disconnect' + this.ftpDataChannel.id, this.ftpDataChannel.disconnect, this.ftpDataChannel );
    this.ps.subscribe( 'sendCommand' + this.ftpDataChannel.id, this.ftpDataChannel.sendCommand, this.ftpDataChannel );
    this.ps.subscribe( 'receiveData' + this.ftpDataChannel.id, this.receive, this );

    // listen for connections and log
    this.ps.subscribe( 'connected' + this.ftpCommandChannel.id, ( data ) => {
        this.ftpCommandSockID = this.ftpCommandChannel.socketID;
        //Logger.log("connected " + JSON.stringify(data) + " " + this.ftpCommandSockID);
    } );

    // on connect to the data port no data is actually sent 
    // so the onReceive is not fired
    this.ps.subscribe( 'connected' + this.ftpDataChannel.id, ( data ) => {
        //Logger.log("connected " + JSON.stringify(data) + " " + this.ftpDataSockID);
        this.ftpDataSockID = this.ftpDataChannel.socketID;
        if ( this.receiveCB ) {
            //Logger.log("FtpMediator callback: " + this.receiveCB );
            this.receiveCB.call( this.receiveHandler, data );
        }
    } );

    // listen for data connection data sent
    this.ps.subscribe( 'sendData' + this.ftpDataChannel.id, ( data ) => {
        // when data channel sends data, no data is received
        // notify client
        Logger.log( "FtpMediator data sent: " + JSON.stringify( data ) );
        // close socket because we should be done with the passive port
        this.disconnect( this.ftpDataChannel.id );

        this.ps.publish( 'datauploaded' + this.ftpDataChannel.id, data );
    } );
}

// utility method to switch between data and command channels
FtpMediator.prototype.getChannel = function ( channel ) {
    const cname = channel.substring( 0, 1 ).toUpperCase() + channel.substring( 1 ).toLowerCase(),
        ftpChannel = this[ "ftp" + cname + "Channel" ];

    return ftpChannel;
};

// connect and on which channel
FtpMediator.prototype.connect = function ( channel, data ) {
    const ftpChannel = this.getChannel( channel );

    //Logger.log("FtpMediator connect: " + ftpChannel.id + " " + channel + " " + JSON.stringify(data) );
    this.ps.publish( 'connect' + ftpChannel.id, data );
};

// receive data
FtpMediator.prototype.receive = function ( data ) {

    let activeChannel;

    // pass the data to the client
    //Logger.log("FtpMediator receive: " + JSON.stringify(data) );
    if ( this.receiveCB ) {
        if ( data && data.rawInfo && data.rawInfo.socketId ) {
            //Logger.log("FtpMediator receive: " + data.rawInfo.socketId + " " + this.ftpCommandChannel.socketID);
            activeChannel = ( data.rawInfo.socketId === this.ftpCommandChannel.socketID ) ? 'command' : 'data';
            data.channel = activeChannel;
        }
        //Logger.log("FtpMediator callback: " + this.receiveCB );
        this.receiveCB.call( this.receiveHandler, data );
    }
};

// send command
FtpMediator.prototype.send = function ( channel, data ) {
    let ftpChannel;

    ftpChannel = this.getChannel( channel );
    // always send commands on command channel
    // so we peek into the message looking for a file upload
    if ( typeof data.filedata !== 'undefined' ) {
        //Logger.log("FtpMediator Got data? " + data.filedata);
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
    const ftpChannel = this.getChannel( channel );

    this.ps.publish( 'disconnect' + ftpChannel.id, {} );
};