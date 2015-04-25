// ftp client library
// ok so mediator and tcp-wrapper handle network communication
// this now becomes the UI portion
// so this object knows UI elements
// http://www.ncftp.com/libncftp/doc/ftp_overview.html
function FtpClient() {

    this.hostname = document.getElementById("ftpHost");
    this.port = document.getElementById("ftpPort");
    this.username = document.getElementById("username");
    this.password = document.getElementById("password");

    this.fileListID = document.getElementById("remoteFiles");
    this.resultData = document.getElementById("resultData");

    this.channel = 'command';

    this.commandList = [];
    this.commandIndex = 0;

    this.uploadData = undefined;
}

FtpClient.prototype.initialize = function() {
    var self = this;
    
    this.resultData.innerHTML = "";
};

FtpClient.prototype.sendCommand = function() {
  mediator.send(this.channel, {msg: this.commandList[this.commandIndex] });
  this.commandIndex++;
  //Logger.log.call(this, "FtpClient Channel: " + this.channel);
  //Logger.log("FtpClient Index: " + this.commandIndex + " next command: " + this.commandList[this.commandIndex]);
};

FtpClient.prototype.receiveCallback = function(info) {
    var buffer, result, self = this,
        portData;

    if ( info.message ) {
      result = info.message;
      //Logger.log("FtpClient " + result);
      buffer = this.resultData.innerHTML;
      this.resultData.innerHTML = buffer + result;
    }
    
    if (result && result.toLowerCase().indexOf("227 entering passive mode") === 0) {
    	// find the 6 digits - TODO better regexp here
    	portData = ResponseParser.parsePasvMode(result, this.hostname.value);
      this.channel = 'data';
      mediator.connect('data', { host: portData.host, port: +portData.port });
    } else if ( this.commandIndex < this.commandList.length ) {
      this.sendCommand();
    } else if ( this.commandIndex >= this.commandList.length ) {
      this.commandList = [];
      this.commandIndex = 0;
      // if we are doing a store now we send the data
      if ( this.uploadData ) {
        mediator.send('data', { 'filedata': this.uploadData }, function(info) {
          Logger.log("FtpClient Data sent: " + JSON.stringify(info));
          self.uploadData = undefined;
        });
      }
    	// close socket because we should be done with the passive port
      mediator.disconnect('data');
      this.channel = 'command';
    }
};

FtpClient.prototype.connect = function() {

    if (this.hostname.value && this.hostname.value.length > 0) {
      port = (this.port.value && this.port.value.length > 0) ? this.port.value : 21;

      if (this.username.value && this.username.value.length > 0 && this.password.value && this.password.value.length > 0) {
        this.channel = 'command';
        this.commandIndex = 0;
        this.commandList = FtpCommandSets.getLoginCommandSet(this.username.value, this.password.value);
      }
      mediator.connect("command", { host: this.hostname.value, port: port });
    }
};

FtpClient.prototype.quit = function() {
  mediator.disconnect('command');
  mediator.disconnect('data');
};
