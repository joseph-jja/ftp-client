// man in the middle for mediating between UI and tcp code
function FtpMediator(receiver, receiveHandler) {
  
  var self = this;
  
  this.ftpCommandChannel = new TcpWrapper("command");
	this.ftpDataChannel = new TcpWrapper("data");

  this.ps = PublishSubscribe;
  this.receiveCB = undefined;
  this.activeChannel = "command";
  
  this.receiveHandler = receiver;
  this.receiveCB = receiveHandler;
  
  this.ps.subscribe('receive', function(data) {
    var channelName = this.getChannel(this.activeChannel);
    //Logger.log("FtpMediator receive channel id " + channelName.id);
    self.ps.publish('receive'+ channelName.id, data);
  }, this);
  
  // setup command channel
  this.ps.subscribe('connect'+this.ftpCommandChannel.id, this.ftpCommandChannel.connect, this.ftpCommandChannel);
  this.ps.subscribe('disconnect'+this.ftpCommandChannel.id, this.ftpCommandChannel.disconnect, this.ftpCommandChannel);
  this.ps.subscribe('sendCommand'+this.ftpCommandChannel.id, this.ftpCommandChannel.sendCommand, this.ftpCommandChannel);
  this.ps.subscribe('receiveData'+this.ftpCommandChannel.id, this.receive, this);

  // setup data channel
  this.ps.subscribe('connect'+this.ftpDataChannel.id, this.ftpDataChannel.connect, this.ftpDataChannel);
  this.ps.subscribe('disconnect'+this.ftpDataChannel.id, this.ftpDataChannel.disconnect, this.ftpDataChannel);
  this.ps.subscribe('sendCommand'+this.ftpDataChannel.id, this.ftpDataChannel.sendCommand, this.ftpDataChannel);
  this.ps.subscribe('receiveData'+this.ftpDataChannel.id, this.receive, this);
  
  // listen for connections and log
  this.ps.subscribe('connected'+this.ftpCommandChannel.id, function(data) {
    Logger.log("connected " + JSON.stringify(data));
  });
  
  // on connect to the data port no data is actually sent 
  // so the onReceive is not fired
  this.ps.subscribe('connected'+this.ftpDataChannel.id, function(data) {
    Logger.log("connected " + JSON.stringify(data));
    if ( self.receiveCB ) {
      //Logger.log("FtpMediator callback: " + this.receiveCB );
      self.receiveCB.call(self.receiveHandler, data);
    }
  });
}

// utility method to switch between data and command channels
FtpMediator.prototype.getChannel = function(channel) {
  var cname, ftpChannel;
  
  cname = channel.substring(0,1).toUpperCase() + channel.substring(1).toLowerCase();
  ftpChannel = this["ftp" + cname + "Channel"];
  
  this.activeChannel = channel;
  return ftpChannel;
};

// connect and on which channel
FtpMediator.prototype.connect = function(channel, data) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);

  //Logger.log("FtpMediator connect: " + ftpChannel.id + " " + channel + " " + JSON.stringify(data) );
  this.ps.publish('connect'+ftpChannel.id, data);
};

// receive data
FtpMediator.prototype.receive = function(data) {

  // pass the data to the client
  //Logger.log("FtpMediator receive: " + JSON.stringify(data) );
  if ( this.receiveCB ) {
    //Logger.log("FtpMediator callback: " + this.receiveCB );
    this.receiveCB.call(this.receiveHandler, data);
  }
};

// send command
FtpMediator.prototype.send = function(channel, data) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  // always send commands on command channel
  // so we peek into the message looking for a file upload
  if ( typeof data.filedata !== 'undefined' ) {
    this.ps.publish('sendCommand'+this.ftpDataChannel.id, data);
  } else {
    this.ps.publish('sendCommand'+this.ftpCommandChannel.id, data);
  } 
};

// disconnect
FtpMediator.prototype.disconnect = function(channel) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.ps.publish('disconnect'+ftpChannel.id, { });
};