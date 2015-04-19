// TCP wrapper that does pub sub instead of callbacks
// this way we can have the ftp client listen for events
// and then react
// id can be an empty string or something to identify the different sockets
// that may be in use
function TcpWrapper(id) {

  var self = this;

  this.socketID = undefined;
  this.tcp = chrome.sockets.tcp;
  this.id = id;

  this.arrayBufferType = Int8Array;

  // our reference to the pub sub for pub - sub 
  this.ps = PublishSubscribe;
}

TcpWrapper.prototype.initialize = function(data) {

  // add listener to tcp for
  this.tcp.onReceive.addListener(function(info) {
    Logger.log.call(self, "TcpWrapper onReceive: " + JSON.stringify(info));
    self.ps.publish('receive'+this.id, info);
    self.receiveData(info);
  });

  this.tcp.onReceiveError.addListener(function(info) {
    Logger.log.call(self, "TcpWrapper onReceiveError error: " + JSON.stringify(info));
    self.ps.publish('receiveError'+this.id, info);
  });

  this.ps.subscribe('connect'+this.id, this.connect);
  this.ps.subscribe('disconnect'+this.id, this.disconnect);
  this.ps.subscribe('sendCommand'+this.id, this.sendCommand);

};

TcpWrapper.prototype.destroy = function(data) {

  this.ps.unsubscribe('connect'+this.id, this.connect);
  this.ps.unsubscribe('disconnect'+this.id, this.disconnect);
  this.ps.unsubscribe('sendCommand'+this.id, this.sendCommand);
};

// connect and raise events
TcpWrapper.prototype.connect = function(data) {
  var self = this, host, port;
  host = data.host; 
  port = data.port;
  if (host && host.length > 0) {
    port = (port && port.length > 0) ? port : 21;
    this.tcp.create({}, function(createInfo) {
      self.socketID = createInfo.socketId;
      Logger.log.call(self, "TcpWrapper connect tcp.create: " + JSON.stringify(result));
      self.ps.publish('created'+self.id, createInfo);
      // now actually connect
      self.tcp.connect(self.socketID, host, +port, function(result) {
        Logger.log.call(self, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
        self.ps.publish('connected'+self.id, result);
      });
    });
  }
};

// send commands and raise notifications
TcpWrapper.prototype.sendCommand = function(dataObj) {
  var self = this, data = dataObj.msg,
    message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
  Logger.log.call(this, "TcpWrapper sendCommand: " + BufferConverter.decode(message, this.arrayBufferType));
  this.tcp.send(this.socketID, message, function(info) {
    self.ps.publish('sendData'+self.id, info);
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

  this.ps.publish('receiveData'+this.id, { rawInfo: info, data: resultData } );
};

TcpWrapper.prototype.disconnect = function() {
  var self = this;
  if ( this.socketID ) {
    this.tcp.disconnect(self.socketID, function(info) {
	    Logger.log.call(self, "Command socket disconnected!");
      self.ps.publish('disconnect'+self.id, info);
  	});
  }
};
