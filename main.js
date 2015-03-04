// main
window.onload = function() {
	document.querySelector('#greeting').innerText = 'ftp-client';

	document.getElementById('connectID').addEventListener('click', function(e) {

		var ftp = new FtpClient();

		ftp.connect();

		return false;
	});
};
