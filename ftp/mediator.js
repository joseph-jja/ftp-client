// man in the middle for mediating between UI and tcp code
function FtpMediator(recvHdlr) {
  
  this.ftpCommandChannel = new TcpWrapper("cmd", true);
	this.ftpDataChannel = new TcpWrapper("data", false);

  this.ps = PublishSubscribe;
  this.receiveCB = undefined;
  
  this.receiveHandler = recvHdlr;
  
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
  
  return ftpChannel;
};

// connect and on which channel
FtpMediator.prototype.connect = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);

  this.receiveCB = callback;
  
  this.ps.publish('connect'+ftpChannel.id, data);
};

// receive data
FtpMediator.prototype.receive = function(data) {

  // pass the data to the client
  Logger.log.call(this, "FtpMediator receiveData: " + JSON.stringify(data) );
  if ( this.receiveCB ) {
    this.receiveCB.apply(this.receiveHandler, data);
    this.receiveCB = undefined;
  }
};

// send data
FtpMediator.prototype.send = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  
  this.ps.publish('sendCommand'+ftpChannel.id, data);
};

// disconnect
FtpMediator.prototype.disconnect = function(channel, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  
  this.ps.publish('disconnect'+ftpChannel.id, { });
};