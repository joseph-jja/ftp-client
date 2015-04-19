// man in the middle for mediating between UI and tcp code
function FtpMediator() {
  
  this.ftpCommandChannel = new TcpWrapper("cmd", true);
	this.ftpDataChannel = new TcpWrapper("data", false);

  this.ps = PublishSubscribe;
  this.receiveCB = undefined;
  
  // setup command channel
  this.ps.subscribe('connect'+this.ftpCommandChannel.id, this.ftpCommandChannel.connect);
  this.ps.subscribe('disconnect'+this.ftpCommandChannel.id, this.ftpCommandChannel.disconnect);
  this.ps.subscribe('sendCommand'+this.ftpCommandChannel.id, this.ftpCommandChannel.sendCommand);
  this.ps.subscribe('receiveData'+this.ftpCommandChannel.id, this.receive);

  // setup data channel
  this.ps.subscribe('connect'+ftpDataChannel.id, ftpDataChannel.connect);
  this.ps.subscribe('disconnect'+ftpDataChannel.id, ftpDataChannel.disconnect);
  this.ps.subscribe('sendCommand'+ftpDataChannel.id, ftpDataChannel.sendCommand);
  this.ps.subscribe('receiveData'+this.ftpDataChannel.id, this.receive);
}

// utility method to switch between data and command channels
FtpMediator.prototype.getChannel = function(channel) {
  var cname, ftpChannel;
  
  cname = channel.substring(0,1).toUpperCase() + channel.substring(1).toLowerCase();
  ftpChannel = this["ftp" + cname + "Channel"];
  
  return ftpChannel;
};

// connect and on which channel
FtpMediator.prototype.connect = function(channel, data) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  ftpChannel.publish('connect'+ftpChannel.id, data);
};

// receive data
FtpMediator.prototype.receive = function(data) {

  // pass the data to the client
  if ( this.receiveCB ) {
    this.receiveCB(data);
  }
};

// send data
FtpMediator.prototype.send = function(channel, data, callback) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  this.receiveCB = callback;
  
  ftpChannel.publish('sendCommand'+ftpChannel.id, data);
};

// disconnect
FtpMediator.prototype.disconnect = function(channel, data) {
  var ftpChannel;
  
  ftpChannel = this.getChannel(channel);
  
  ftpChannel.publish('disconnect'+ftpChannel.id, data);
};