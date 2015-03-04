// main
window.onload = function() {
	document.querySelector('#greeting').innerText = 'ftp-client';

	var ftp = new FtpClient();
	ftp.initialize();

	document.getElementById('connectID').addEventListener('click', function(e) {

		ftp.connect(ftp.hostname.value, ftp.port.value);

		return false;
	});
};
