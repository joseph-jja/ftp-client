// ftp client library
// TODO remove the dom access here and externalize it
// we want this just doing FTP client stuff
function FtpClient() {

  this.hostname = document.getElementById("ftpHost");
  this.port = document.getElementById("ftpPort");
  this.username = document.getElementById("username");
  this.password = document.getElementById("password");

  this.fileListID = document.getElementById("remoteFiles");
  this.resultData = document.getElementById("resultData");

  self.resultData.innerHTML = "";

  this.socketID;
  this.tcp = chrome.sockets.tcp;

  this.bufferInfo = new BufferCoverter();
}

FtpClient.prototype.sendCommand = function(data, callback) {

  var message = this.bufferInfo.encode(data);
  this.tcp.send(this.socketID, message, callback);
}

// http://www.ncftp.com/libncftp/doc/ftp_overview.html
FtpClient.prototype.connect = function() {

  var self = this,
    host = this.hostname.value,
    port = this.port.value;

  if (typeof  host !== 'undefined' && typeof port !== 'undefined' ) {

    this.tcp.create({}, function(createInfo) {
      var buffer;
      self.socketID = createInfo.socketId;

      self.tcp.onReceive.addListener(function(info) {
        var result;
        if (info.socketId !== self.socketID) {
          console.log(info);
          return;
        }
        result = info.data;
        console.log(result);
        // info.data is an arrayBuffer
        buffer = self.resultData.innerHTML;
        self.bufferInfo.getBufferType(result);
        self.resultData.innerHTML = buffer + self.bufferInfo.decode(result);
      });

      self.tcp.connect(self.socketID,
        host, +port, function(result) {
          console.log(result);
          if ( ! isNaN(result) ) {
            // send login information
            self.login();
          }
      });

    });
  }
}

FtpClient.prototype.logon = function() {
  var user = this.username.value,
    pass = this.password.value;

    if ( typeof user !== 'undefined' && typeof pass !== 'undefined' ) {
      this.sendCommand("USER " + user, function(info) {
        console.log(info);
        this.sendCommand("PASS " + pass, function(pinfo) {
          console.log(pinfo);
        });
      });
    }

}

FtpClient.prototype.quit = function() {
  this.tcp.disconnect(this.socketID, function() {
    console.log("Socket disconnected!");
  });
}

FtpClient.prototype.listRemoteFiles = function() {

}
