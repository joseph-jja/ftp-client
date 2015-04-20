// man in the middle for mediating between UI and tcp code
function FtpMediator(recvHdlr) {
  
  this.ftpCommandChannel = new TcpWrapper("cmd", true);
	this.ftpDataChannel = new TcpWrapper("data", false);

  this.ps = PublishSubscribe;
  this.receiveCB = undefined;
  this.activeChannel = "command";
  
  this.receiveHandler = recvHdlr;
  
  this.ps.subscribe('receive', function(data) {
    var channelName = this.getChannel(this.activeChannel);
    Logger.log("FtpMediator receive channel id " + channelName.id);
    channelName.receiveData(data);
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
FtpMediator.prototype.connect = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);

  this.receiveCB = callback;
  
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
    //this.receiveCB = undefined;
  }
};

// send command
FtpMediator.prototype.send = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  // alway send commands on command channel
  //Logger.log("FtpMediator send: " + ftpChannel.id + " " + JSON.stringify(data) );
  this.ps.publish('sendCommand'+this.ftpCommandChannel.id, data);
};

// send data
FtpMediator.prototype.sendData = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  // alway send data for fileuploads on data channel
  //Logger.log("FtpMediator send: " + ftpChannel.id + " " + JSON.stringify(data) );
  this.ps.publish('sendCommand'+this.ftpDataChannel.id, data);
};

// disconnect
FtpMediator.prototype.disconnect = function(channel, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  
  this.ps.publish('disconnect'+ftpChannel.id, { });
};