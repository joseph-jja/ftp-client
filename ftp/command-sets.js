const FtpCommandSets = {

    // command sets
    listDir: [ 'PASV', 'LIST -aL' ],
    getFile: [ 'PASV', 'RETR' ],
    uploadFile: [ 'PASV', 'STOR' ],

    getLoginCommandSet: function ( user, pass ) {
        const commands = [],
            logonCommands = [ 'SYST', 'MODE S', 'TYPE A', 'PWD', 'PASV', 'LIST -aL' ];

        commands.push( 'USER ' + user );
        commands.push( 'PASS ' + pass );
        return commands.concat( logonCommands );
    }
};
