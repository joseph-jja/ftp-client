//ftp client library
//TODO remove the dom access here and externalize it
//we want this just doing FTP client stuff
//http://www.ncftp.com/libncftp/doc/ftp_overview.html
function FtpClientUI() {

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

FtpClientUI.prototype.initialize = function() {

    var self = this;
    
    this.TcpWrapper = new TcpWrapper();
    this.ps = PublishSubscribe;

    this.resultData.innerHTML = "";

};

FtpClientUI.prototype.sendCommand = function(channel, data, callback) {
    var message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
    Logger.log.call(this, BufferConverter.decode(message, this.arrayBufferType));
    channel.send(message, callback);
};

FtpClientUI.prototype.sendListCommand = function() {
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

FtpClientUI.prototype.defaultReceiveCallback = function(info) {
    var buffer, result, self = this,
        data, pasvHost, portData, port, host;

    if (info.socketId !== this.socketID && this.pasvSocketID && info.socketId !== this.pasvSocketID ) {
        Logger.log.call(this, JSON.stringify(info));
        this.quit();
        return;
    }
    result = info.data;
    // info.data is an arrayBuffer
    buffer = this.resultData.innerHTML;
    // conversion event
    data = BufferConverter.decode(result, this.arrayBufferType);
    Logger.log.call(this, data);
    this.resultData.innerHTML = buffer + data;

    if (typeof this.next !== 'undefined') {
        this.next();
    } else if ( this.commandIndex < this.commandList.length ) {
      self.sendListCommand();
    } else if ( this.commandIndex >= this.commandList.length ) {
      this.commandList = [];
      this.commandIndex = 0;
      // if we are doing a store now we send the data
      if ( this.uploadData ) {
        this.sendData(this.uploadData, function(info) {
          Logger.log.call(self, "Data sent: " + JSON.stringify(info));
          self.uploadData = undefined;
        	// close socket because we should be done with the passive port
        	if ( self.pasvSocketID ) {
              self.tcp.disconnect(self.pasvSocketID, function() {
                  Logger.log.call(self, "Data socket disconnected!");
                  self.pasvSocketID = undefined;
              });
          }
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
        this.tcp.create({}, function(createInfo) {
            self.pasvSocketID = createInfo.socketId;
            Logger.log.call(self, JSON.stringify(createInfo));

            self.tcp.connect(self.pasvSocketID, host, +port, function(result) {
                Logger.log.call(self, result);
            });
        });
    }
};

FtpClientUI.prototype.connect = function(host, port) {
    
};

FtpClientUI.prototype.quit = function() {

  
};
