class Logger {

    constructor( callerName, options = {} ) {
        this.callingName = callerName;
        this.logLevel = options.logLevel || 'info';
    }

    // TODO make this private
    filterMessage( messageIn ) {

        let resultMessage = '';

        // don't log password
        if ( typeof messageIn !== 'undefined' &&
            messageIn.indexOf( "PASS" ) === -1 ) {
            resultMessage = messageIn;
        } else {
            resultMessage = 'PASS command sent or no data to log.';
        }
        return resultMessage;
    }

    log( message ) {
        console.log( this.callingName, this.filterMessage( message ) );
    }

    debug( message ) {
        if ( this.logLevel === 'debug' ) {
            console.debug( this.callingName, this.filterMessage( message ) );
        }
    }

    error( message ) {
        console.error( this.callingName, this.filterMessage( message ) );
    }
};
