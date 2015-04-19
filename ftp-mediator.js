// man in the middle for mediating between UI and tcp code
function FtpMediator() {
  
  this.ftpCommandChannel = new TcpWrapper("cmd");
	this.ftpDataChannel = new TcpWrapper("data");

  this.ps = PublishSubscribe;
  
  this.ps.subscribe('connect'+ftpCommandChannel.id, ftpCommandChannel.connect);
  this.ps.subscribe('disconnect'+ftpCommandChannel.id, ftpCommandChannel.disconnect);
  this.ps.subscribe('sendCommand'+ftpCommandChannel.id, ftpCommandChannel.sendCommand);

  this.ps.subscribe('connect'+ftpDataChannel.id, ftpDataChannel.connect);
  this.ps.subscribe('disconnect'+ftpDataChannel.id, ftpDataChannel.disconnect);
  this.ps.subscribe('sendCommand'+ftpDataChannel.id, ftpDataChannel.sendCommand);

}

