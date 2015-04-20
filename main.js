var ftp, mediator;
// main
window.onload = function() {
	document.querySelector('#greeting').innerText = 'ftp-client';

	ftp = new FtpClient();
	ftp.initialize();
	
	mediator = new FtpMediator(ftp);

	document.getElementById('connectID').addEventListener('click', function(e) {

		var txt = this.innerHTML;
		if ( txt === 'Connect' ) {
			ftp.connect();
			this.innerHTML = "Disconnect";
		} else {
			ftp.quit();
			this.innerHTML = "Connect";
		}

		return false;
	});

	document.getElementById('sendCommand').addEventListener('click', function(e) {

		var cmd = document.getElementById('command').value;
		if ( cmd && cmd.length > 0 ) {
		  cmd = cmd.replace(/^\s/g,'').replace(/\s$/g,'');
		  if ( cmd === 'ls' ) {
		    ftp.commandList = ftp.listDir;
		    ftp.commandIndex = 0;
		    ftp.sendCommand();
		  } else if ( cmd.indexOf('get') !== -1 ) {
		    ftp.commandList = ftp.getFile;
		    ftp.getFile[ftp.getFile.length-1] = 'RETR ' + cmd.substring(4);
		    ftp.commandIndex = 0;
		    ftp.sendCommand();
		  } else if ( cmd.indexOf('cd') !== -1 || cmd.indexOf("CWD") !== -1 ) {
		    cmd = cmd.replace('cd', 'CWD');
		    ftp.commandList = ftp.listDir;
		    ftp.commandIndex = 0;
  			ftp.sendCommand();
		  } else {
		    ftp.commandList = [cmd];
		    ftp.commandIndex = 0;
		    ftp.sendCommand();
		  }
		}
		return false;
	});

  document.getElementById("sendFileID").addEventListener('change', function(event) {
    FS.openFile(event, function(data) {
      var parts, filename = document.getElementById("sendFileID").value;

      parts = filename.split(/\/|\\/g);
      filename = parts[parts.length-1];
      console.log(filename);
		  ftp.commandIndex = 0;
		  ftp.commandList = ftp.uploadFile;
      ftp.commandList[1] = "STOR " + filename;
      ftp.uploadData = data;
		  ftp.sendListCommand();
    });
  });

	document.getElementById('clearBuffer').addEventListener('click', function(e) {

		ftp.resultData.innerHTML = "";
		return false;
	});
};
