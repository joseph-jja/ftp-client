# ftp-client
Chrome FTP Client App

So far this only works with passive FTP. I have no plans to do active FTP.
You need to know the FTP commands to execute and the order in which to execute the commands.
Typing HELP will give you a list of ftp commands.

There are some 'alias' coded in:

- ls = PASV + LIST -aL
- cd <dir> = CWD <dir> + PASV + LIST -aL
- get <file> = PASV + RETR <file>

# Version 0.1.2
- updated to match version 0.1.2 version but woth better separation 
and modularity of code
- fix a bunch of bugs in previous version
- NOTE: branch 0.1.1 is not the correct branch it should be the release-0.1.1
