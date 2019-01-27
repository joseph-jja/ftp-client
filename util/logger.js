class Logger {

    function filterMessage( messageIn ) {

        let resultMessage = '';

        // don't log password
        if ( typeof message !== 'undefined' &&
            message.indexOf( "PASS" ) === -1 ) {
            resultMessage = message;
        } else {
            resultMessage = 'PASS command sent or no data to log.';
        }
        return resultMessage;
    }

    constructor( callerName, options = {} ) {
        this.callingName = callerName;
        this.logLevel = options.logLevel || 'info';
    }

    log( message ) {
        console.log( this.callingName, filterMessage( message ) );
    }

    debug( message ) {
        console.debug( this.callingName, filterMessage( message ) );
    }

    error( message ) {
        console.error( this.callingName, filterMessage( message ) );
    }
};
