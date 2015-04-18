# ftp-client
Chrome FTP Client App

So far this only works with passive FTP.  
You need to know the FTP commands to execute and the order in which to execute the commands.

There are some 'alias' coded in:

- ls = PASV + LIST -aL
- cd <dir> = CWD <dir> + PASV + LIST -aL
- get <file> = PASV + RETR <file>


