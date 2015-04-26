var FtpCommandSets =  {
  
  // command sets
  listDir: [ 'PASV', 'LIST -aL' ],
  getFile: [ 'PASV', 'RETR' ],
  uploadFile: [ 'PASV', 'STOR' ],
  
  getLoginCommandSet: function(user, pass) {
    var commands = [], 
      logonCommands = ['SYST', 'MODE S', 'TYPE A', 'PWD', 'PASV', 'LIST -aL'];

    commands[0] = 'USER ' + user;
    commands[1] = 'PASS ' + pass;
    return commands.concat(logonCommands);
  }
};