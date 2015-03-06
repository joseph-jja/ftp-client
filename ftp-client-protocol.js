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
    this.commands = ['SYST', 'MODE S', 'TYPE A', 'PWD', 'PASV'];
    this.commandIndex = 0;
}

FtpClient.prototype.initialize = function() {

    var self = this;

    this.resultData.innerHTML = "";

    // add listener to tcp for
    this.tcp.onReceive.addListener(function(info) {
        // console.log(self);
        self.defaultReceiveCallback(info);
    });

    this.tcp.onReceiveError.addListener(function(info) {
        console.log("Error: " + JSON.stringify(info));
        self.next = undefined;
    });
};

FtpClient.prototype.sendCommand = function(data, callback) {
    var message = BufferConverter.encode(data + "\n", Uint8Array, 1);
    console.log(BufferConverter.decode(message, Uint8Array));
    this.tcp.send(this.socketID, message, callback);
};

FtpClient.prototype.defaultReceiveCallback = function(info) {
    var buffer, result, self = this,
        data, pasvHost, portData, port, host;

    if (info.socketId !== this.socketID) {
        console.log(JSON.stringify(info));
        this.tcp.disconnect(info.socketId, function() {
            console.log("Socket " + info.socketId + " disconnected!");
        });
        return;
    }
    result = info.data;
    // info.data is an arrayBuffer
    buffer = this.resultData.innerHTML;
    // next lines do not work
    //BufferConverter.getDataType(result);
    //this.bufferInfo = {
    //	bufferType: BufferConverter.bufferType, 
    //	bufferMultiplier: BufferConverter.bufferMultiplier
    //};
    //console.log(this.bufferInfo);
    data = BufferConverter.decode(result, Uint8Array);
    console.log(data);
    this.resultData.innerHTML = buffer + data;

    if (typeof this.next !== 'undefined') {
        this.next();
    }
    if (data.toLowerCase().indexOf("227 entering passive mode") === 0) {
        pasvHost = data.substring("227 Entering Passive Mode".length + 1);
        pasvHost = pasvHost.replace(/\(/, '');
        pasvHost = pasvHost.replace(/\)/, '');
        pasvHost = pasvHost.replace(/\./, '');
        portData = pasvHost.split(",");
        port = (portData[4] * 256) + (+portData[5]);
        host = portData[0] + "." + portData[1] + "." + portData[2] + "." + portData[3];
        console.log(host + " " + port);

        this.tcp.create({}, function(createInfo) {
            self.pasvSocketID = createInfo.socketId;
            self.next = function() {
                self.sendCommand("LIST", function(info) {
                    console.log(JSON.stringify(info));
                    // stop the call chain
                    self.next = undefined;
                });
            };
            self.tcp.connect(self.pasvSocketID, host, +port, function(result) {
                console.log(result);
            });
        });
    }
};

FtpClient.prototype.connect = function(host, port) {
    var self = this;

    if (host && host.length > 0) {
        port = (port && port.length > 0) ? port : 21;
        this.tcp.create({}, function(createInfo) {
            var buffer;
            self.socketID = createInfo.socketId;
            self.next = function() {
                self.logon(self.username.value, self.password.value);
            }
            self.tcp.connect(self.socketID, host, +port, function(result) {
                console.log(result);
                if (!isNaN(result)) {
                    // send login information
                    // self.login();
                }
            });
        });
    }
};

FtpClient.prototype.logon = function(user, pass) {
    var self = this;

    if (user && user.length > 0 && pass && pass.length > 0) {
        this.next = function() {
            self.sendCommand("PASS " + pass, function(info) {
                console.log(JSON.stringify(info));
                // stop the call chain
                self.next = undefined;
            });
        };
        this.sendCommand("USER " + user, function(info) {
            console.log(JSON.stringify(info));
        });
    }
};

FtpClient.prototype.quit = function() {
    var self = this;
    this.tcp.disconnect(this.socketID, function() {
        console.log("Socket disconnected!");
        self.commandIndex = 0;
    });
};