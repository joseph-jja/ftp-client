const Logger = {
    log: function ( message ) {

        // don't log password
        if ( typeof message !== 'undefined' &&
            message.indexOf( "PASS" ) === -1 ) {
            console.log( message );
        } else {
            console.log( "PASS command sent or none string logged." );
        }
    },
    error: function ( message ) {

        // don't log password
        if ( typeof message !== 'undefined' &&
            message.indexOf( "PASS" ) === -1 ) {
            console.error( message );
        } else {
            console.error( "PASS command sent or none string logged." );
        }
    }
};
