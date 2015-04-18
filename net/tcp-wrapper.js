// TCP wrapper that does pub sub instead of callbacks
// this way we can have the ftp client listen for events
// and then react
function TcpWrapper() {

  var self = this;

  this.socketID = undefined;
  this.tcp = chrome.sockets.tcp;

  this.arrayBufferType = Int8Array;

  this.ps = PublishSubscribe;

  // add listener to tcp for
  this.tcp.onReceive.addListener(function(info) {
    Logger.log.call(self, "TcpWrapper onReceive: " + JSON.stringify(info));
    self.ps('receive', info);
    self.receiveData(info);
  });

  this.tcp.onReceiveError.addListener(function(info) {
    Logger.log.call(self, "TcpWrapper onReceiveError error: " + JSON.stringify(info));
    self.ps('receiveError', info);
  });
}

// connect and raise events
TcpWrapper.prototype.connect = function(host, port) {
  var self = this;
  if (host && host.length > 0) {
    port = (port && port.length > 0) ? port : 21;
    this.tcp.create({}, function(createInfo) {
      self.socketID = createInfo.socketId;
      Logger.log.call(self, "TcpWrapper connect tcp.create: " + JSON.stringify(result));
      self.ps('created', createInfo);
      // now actually connect
      self.tcp.connect(self.socketID, host, +port, function(result) {
        Logger.log.call(self, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
        self.ps('connected', result);
      });
    });
  }
};

// send commands and raise notifications
TcpWrapper.prototype.sendCommand = function(data) {
  var self = this,
    message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
  Logger.log.call(this, "TcpWrapper sendCommand: " + BufferConverter.decode(message, this.arrayBufferType));
  this.tcp.send(this.socketID, message, function(info) {
    self.ps('sendData', info);
  });
};

// receive data and raise events
TcpWrapper.prototype.receiveData = function(info) {
  var result, resultData;

  Logger.log.call(this, "TcpWrapper receiveData: " + JSON.stringify(info));
  if ( this.socketID && info.socketId !== this.socketID ) {
    this.disconnect();
    return;
  }

  // store result in temp storage
  result = info.data;

  // conversion event
  resultData = BufferConverter.decode(result, this.arrayBufferType);
  Logger.log.call(this, "TcpWrapper receiveData data: " + resultData);

  this.ps('receiveData', { rawInfo: info, data: resultData } );
};

TcpWrapper.prototype.disconnect = function() {
  var self = this;
  if ( this.socketID ) {
    this.tcp.disconnect(self.socketID, function(info) {
	    Logger.log.call(self, "Command socket disconnected!");
      self.ps('disconnect', info);
  	});
  }
};