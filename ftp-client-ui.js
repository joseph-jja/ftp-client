//ftp client library
//TODO remove the dom access here and externalize it
//we want this just doing FTP client stuff
//http://www.ncftp.com/libncftp/doc/ftp_overview.html
function FtpClient() {

    this.hostname = document.getElementById("ftpHost");
    this.port = document.getElementById("ftpPort");
    this.username = document.getElementById("username");
    this.password = document.getElementById("password");

    this.fileListID = document.getElementById("remoteFiles");
    this.resultData = document.getElementById("resultData");

    this.next = undefined;

    // command sets
    this.authenticate = [ 'USER', 'PASS' ];
    this.logonCommands = ['SYST', 'MODE S', 'TYPE A', 'PWD', 'PASV', 'LIST -aL'];
    this.listDir = [ 'PASV', 'LIST -aL' ];
    this.getFile = [ 'PASV', 'RETR' ];
    this.uploadFile = [ 'PASV', 'STOR' ];

    this.commandList = [];
    this.commandIndex = 0;

    this.uploadData = undefined;
}

FtpClient.prototype.initialize = function() {

    var self = this;
    
    this.resultData.innerHTML = "";

};

FtpClient.prototype.sendCommand = function(data, callback) {
    var message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
    Logger.log.call(this, BufferConverter.decode(message, this.arrayBufferType));
    this.tcp.send(this.socketID, message, callback);
};

// for ftp upload
FtpClient.prototype.sendData = function(data, callback) {
    var message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
    Logger.log.call(this, BufferConverter.decode(message, this.arrayBufferType));
    this.tcp.send(this.pasvSocketID, message, callback);
};

FtpClient.prototype.sendListCommand = function() {
  var self = this;
  this.sendCommand(this.commandList[this.commandIndex], function(info) {
    Logger.log.call(self, JSON.stringify(info));
    // stop the call chain
    self.next = undefined;
  });
  this.commandIndex ++;
  if ( this.commandIndex >= this.commandList.length && ! this.uploadData ) {
    Logger.log.call(this, "done!");
    // close socket because we should be done with the passive port
    if ( this.pasvSocketID ) {
        this.tcp.disconnect(this.pasvSocketID, function() {
            Logger.log.call(self, "Data socket disconnected!");
            this.pasvSocketID = undefined;
        });
    }
  }
};

FtpClient.prototype.defaultReceiveCallback = function(info) {
    var buffer, result, self = this,
        data, pasvHost, portData, port, host;

    Logger.log.call(this, info.rawInfo);

    result = info.message;
    Logger.log.call(this, result);
    this.resultData.innerHTML = buffer + result;

    if (typeof this.next !== 'undefined') {
        this.next();
    } else if ( this.commandIndex < this.commandList.length ) {
      self.sendListCommand();
    } else if ( this.commandIndex >= this.commandList.length ) {
      this.commandList = [];
      this.commandIndex = 0;
      // if we are doing a store now we send the data
      if ( this.uploadData ) {
        mediator.send('data', { 'msg': this.uploadData }, function(info) {
          Logger.log.call(self, "Data sent: " + JSON.stringify(info));
          self.uploadData = undefined;
        	// close socket because we should be done with the passive port
        	mediator.disconnect('data');
        });
      }
    }

    if (data.toLowerCase().indexOf("227 entering passive mode") === 0) {
    	// find the 6 digits - TODO better regexp here
    	pasvHost = data.match(/(\d*\,\d*\,\d*\,\d*)(\,)(\d*\,\d*)/gi)[0];
        portData = pasvHost.split(",");
        port = ( parseInt(portData[4], 10) * 256) + parseInt(portData[5], 10);
        host = portData[0] + "." + portData[1] + "." + portData[2] + "." + portData[3];
        Logger.log.call(this, host + " " + port + " " + JSON.stringify(portData));
        if ( host === "0.0.0.0" ) {
          host = this.hostname.value;
        }
        if ( this.pasvSocketID ) {
        	this.tcp.disconnect(this.pasvSocketID, function() {
        		Logger.log.call(self, "Closing open data socket!");
            this.pasvSocketID = undefined;
        	});
        }
        mediator.connect('data', { host: host, port: +port }, this.defaultReceiveCallback);
    }
};

FtpClient.prototype.connect = function() {

    if (this.hostname.value && this.hostname.value.length > 0) {
      port = (this.port.value && this.port.value.length > 0) ? this.port.value : 21;

      if (this.username.value && this.username.value.length > 0 && this.password.value && this.password.value.length > 0) {
        this.commandIndex = 0;
  		  this.commandList = ftp.authenticate;
  		  this.commandList[0] = 'USER ' + this.username.value;
  		  this.commandList[1] = 'PASS ' + this.password.value;
        this.commandList = this.commandList.concat(this.logonCommands);
      }
      mediator.connect("command", { host: this.hostname.value, port: port }, this.defaultReceiveCallback);
    }
};

FtpClient.prototype.quit = function() {
  mediator.disconnect('command');
  mediator.disconnect('data');
};
