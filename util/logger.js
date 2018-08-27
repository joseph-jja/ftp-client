class Logger {
    
    constructor( callerName ) {
        this.callingName = callerName;    
    }
    
    log( message ) {

        // don't log password
        if ( typeof message !== 'undefined' &&
            message.indexOf( "PASS" ) === -1 ) {
            console.log( this.callingName, message );
        } else {
            console.log( this.callingName, 'PASS command sent or none string logged.' );
        }
    }
    
    error( message ) {

        // don't log password
        if ( typeof message !== 'undefined' &&
            message.indexOf( "PASS" ) === -1 ) {
            console.error( this.callingName, message );
        } else {
            console.error( this.callingName, 'PASS command sent or none string logged.' );
        }
    }
};

