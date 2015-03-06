var ftp;
// main
window.onload = function() {
	document.querySelector('#greeting').innerText = 'ftp-client';

	ftp = new FtpClient();
	ftp.initialize();

	document.getElementById('connectID').addEventListener('click', function(e) {
	
		var txt = this.innerHTML;
		if ( txt === 'Connect' ) {
			ftp.connect(ftp.hostname.value, ftp.port.value);
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
			ftp.sendCommand(cmd, function(info) {
				console.log(JSON.stringify(info));
			});
		}
		return false;
	});

	document.getElementById('clearBuffer').addEventListener('click', function(e) {
		
		ftp.resultData.innerHTML = "";
		return false;
	});

	
};
