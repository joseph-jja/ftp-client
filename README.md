# ftp-client
Chrome FTP Client App

This only works with passive FTP and you need to know the FTP commands to execute in order.

So far alias commands for

ls = PASV + LIST -aL
cd <dir> = CWD <dir> + PASV + LIST -aL
get <file> = PASV + RETR <file>


