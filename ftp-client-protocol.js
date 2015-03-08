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

    this.socketID;
    this.tcp = chrome.sockets.tcp;

    this.next;
    this.logonCommands = ['SYST', 'MODE S', 'TYPE A', 'PWD', 'PASV', 'LIST -aL'];
    this.lCommandIndex = 0;

    this.arrayBufferType = Int8Array;
}

FtpClient.prototype.initialize = function() {

    var self = this;

    this.resultData.innerHTML = "";

    // add listener to tcp for
    this.tcp.onReceive.addListener(function(info) {
        self.defaultReceiveCallback(info);
    });

    this.tcp.onReceiveError.addListener(function(info) {
        Logger.log("Error: " + JSON.stringify(info));
        self.next = undefined;
    });
};

FtpClient.prototype.sendCommand = function(data, callback) {
    var message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
    Logger.log(BufferConverter.decode(message, this.arrayBufferType));
    this.tcp.send(this.socketID, message, callback);
};

FtpClient.prototype.defaultReceiveCallback = function(info) {
    var buffer, result, self = this,
        data, pasvHost, portData, port, host;

    if (info.socketId !== this.socketID && this.pasvSocketID && info.socketId !== this.pasvSocketID ) {
        Logger.log(JSON.stringify(info));
        this.quit();
        return;
    }
    result = info.data;
    // info.data is an arrayBuffer
    buffer = this.resultData.innerHTML;
    // conversion event
    data = BufferConverter.decode(result, this.arrayBufferType);
    Logger.log(data);
    this.resultData.innerHTML = buffer + data;

    if (typeof this.next !== 'undefined') {
        this.next();
    } else if ( this.lCommandIndex < this.logonCommands.length ) {
    	self.sendCommand(this.logonCommands[this.lCommandIndex], function(info) {
            Logger.log(JSON.stringify(info));
            // stop the call chain
            self.next = undefined;
        });
    	this.lCommandIndex ++;
    	if ( this.lCommandIndex > this.logonCommands.length ) {
    		Logger.log( "done!");
    	}
    }

    if (data.toLowerCase().indexOf("227 entering passive mode") === 0) {
    	// find the 6 digits - TODO better regexp here
    	pasvHost = data.match(/(\d*\,\d*\,\d*\,\d*)(\,)(\d*\,\d*)/gi)[0];
        portData = pasvHost.split(",");
        port = ( parseInt(portData[4], 10) * 256) + parseInt(portData[5], 10);
        host = portData[0] + "." + portData[1] + "." + portData[2] + "." + portData[3];
        Logger.log(host + " " + port + " " + JSON.stringify(portData));
        if ( host === "0.0.0.0" ) {
          host = this.hostname.value;
        }
        if ( this.pasvSocketID ) {
        	this.tcp.disconnect(this.pasvSocketID, function() {
        		Logger.log("Closing open data socket!");
        	});
        }
        this.tcp.create({}, function(createInfo) {
            self.pasvSocketID = createInfo.socketId;
            Logger.log(JSON.stringify(createInfo));

            self.tcp.connect(self.pasvSocketID, host, +port, function(result) {
                Logger.log(result);
            });
        });
    }
};

FtpClient.prototype.connect = function(host, port) {
    var self = this;

    if (host && host.length > 0) {
        port = (port && port.length > 0) ? port : 21;
        this.tcp.create({}, function(createInfo) {
            self.socketID = createInfo.socketId;
            self.next = function() {
                self.logon(self.username.value, self.password.value);
            }
            self.tcp.connect(self.socketID, host, +port, function(result) {
                Logger.log(result);
            });
        });
    }
};

FtpClient.prototype.logon = function(user, pass) {
    var self = this;

    if (user && user.length > 0 && pass && pass.length > 0) {
        this.next = function() {
            self.sendCommand("PASS " + pass, function(info) {
                Logger.log(JSON.stringify(info));
                // stop the call chain
                self.next = undefined;
            });
        };
        this.sendCommand("USER " + user, function(info) {
            Logger.log(JSON.stringify(info));
        });
    }
};

FtpClient.prototype.quit = function() {
    var self = this;
    this.lCommandIndex = 0;
    this.sendCommand("QUIT", function(info) {
        Logger.log(JSON.stringify(info));
        self.next = function() {
        	self.tcp.disconnect(self.socketID, function() {
	            Logger.log("Command socket disconnected!");
	        });
        }
    });
    if ( this.pasvSocketID ) {
        this.tcp.disconnect(this.pasvSocketID, function() {
            Logger.log("Data socket disconnected!");
        });
    }
};
