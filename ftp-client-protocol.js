
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
}

FtpClient.prototype.sendCommand = function(data, callback) {

	var message = BufferConverter.encode(data + "\n", Uint8Array, 1);
	console.log( BufferConverter.decode(message, Uint8Array) );
	this.tcp.send(this.socketID, message, callback);
}

FtpClient.prototype.defaultReceiveCallback = function(info) {
	var result;
	if (info.socketId !== this.socketID) {
		console.log(info);
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
	this.resultData.innerHTML = buffer + BufferConverter.decode(result, Uint8Array);
	
	if ( typeof this.next !== 'undefined') {
		this.next();
		this.next = undefined;
	}
}

FtpClient.prototype.connect = function(host, port) {
	var self = this;
	
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

FtpClient.prototype.logon = function(user, pass) {
	var self = this;
	
	if (typeof user !== 'undefined' && typeof pass !== 'undefined') {
		this.sendCommand("USER " + user, function(info) {
			console.log(info);
			self.next = function() {
				self.sendCommand("PASS " + pass, function(pinfo) {
					console.log(pinfo);
					self.next = self.quit;
				});
			}
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
