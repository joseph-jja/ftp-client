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
  this.ps.subscribe("receive" + this.id, this.receiveData, this);
  
 if ( ! this.tcp.onReceive.hasListeners() ) {
    // add listener to tcp for receiving data and errors
    // we only want to add this once though
    this.tcp.onReceive.addListener(function(info) {
      Logger.log("TcpWrapper onReceive: " + JSON.stringify(info));
      self.ps.publish('receive', info);
    });
 }
 
 if ( ! this.tcp.onReceiveError.hasListeners() ) {
    this.tcp.onReceiveError.addListener(function(info) {
      Logger.log("TcpWrapper onReceiveError error: " + JSON.stringify(info));
      self.ps.publish('receiveError', info);
    });
 }
}

// connect and raise events
// object should contain { host: string, port: number }
TcpWrapper.prototype.create = function() {
  var self = this;
  
  this.tcp.create({}, function(createInfo) {
    self.socketID = createInfo.socketId;
    //Logger.log("TcpWrapper connect tcp.create: " + JSON.stringify(data));
    self.ps.publish('created'+self.id, createInfo);
  });
};

// connect and raise events
// object should contain { host: string, port: number }
TcpWrapper.prototype.connect = function(data) {
  var self = this, host, port;
  host = data.host; 
  port = data.port;
  if (host && host.length > 0) {
    //Logger.log("TcpWrapper connect port: " + (""+port).length + "/" + port);
    port = (port && (""+port).length > 0) ? port : 21;
    if ( ! this.socketID ) {
      this.ps.subscribe('created'+this.id, function(createInfo) {
        self.socketID = createInfo.socketId;
        self.tcp.connect(self.socketID, host, +port, function(result) {
          //Logger.log("TcpWrapper connect tcp.connect: " + JSON.stringify(result));
          self.ps.publish('connected'+self.id, result);
        });
      }, this);
      // create a socket to use
      this.create();
    } else {
      // just connect
      this.tcp.connect(this.socketID, host, +port, function(result) {
        //Logger.log("TcpWrapper connect tcp.connect: " + JSON.stringify(result));
        self.ps.publish('connected'+self.id, result);
      });
    }
  }
};

// send commands and raise notifications
// object should contain { msg: string }
TcpWrapper.prototype.sendCommand = function(dataObj) {
  var self = this, data = dataObj.msg,
    message = BufferConverter.encode(data + "\r\n", this.arrayBufferType, 1);
  //Logger.log("TcpWrapper sendCommand: " + this.id + " " + BufferConverter.decode(message, this.arrayBufferType));
  this.tcp.send(this.socketID, message, function(info) {
    self.ps.publish('sendData'+self.id, info);
  });
};

// receive data and raise events
TcpWrapper.prototype.receiveData = function(info) {
  var resultData;

  // compare socket ids and log
  if ( this.socketID && info.socketId !== this.socketID ) {
    Logger.log("TcpWrapper receiveData sockets don't match: " + this.socketID + " " + info.socketId);
    return;
  }

  // conversion event
  resultData = BufferConverter.decode(info.data, this.arrayBufferType);
  //Logger.log("TcpWrapper receiveData data: " + resultData);

  this.ps.publish('receiveData'+this.id, { rawInfo: info, message: resultData } );
};

TcpWrapper.prototype.disconnect = function() {
  var self = this;
  if ( this.socketID ) {
    this.tcp.disconnect(self.socketID, function(info) {
	    //Logger.log(self.id + " socket disconnected!");
      self.ps.publish('disconnected'+self.id, info);
  	});
  }
};
