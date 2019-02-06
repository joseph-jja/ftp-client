class Logger {

    constructor( callerName, options = {} ) {
        this.callingName = callerName;
        this.logLevel = options.logLevel || 'info';

        this.loggerData = 'loggerData';
        this.handle = undefined;
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

    logToWindow( message ) {
        if ( !this.debug ) {
            return;
        }
        if ( !this.handle ) {
            this.handle = document.getElementById( this.loggerData );
        }
        const data = this.handle.innerHTML;
        this.handle.innerHTML = data + '<br>' + this.filterMessage( message );
    }

    log( message ) {
        this.logToWindow( message );
        console.log( this.callingName, this.filterMessage( message ) );
    }

    debug( message ) {
        if ( this.logLevel === 'debug' ) {
            this.logToWindow( message );
            console.debug( this.callingName, this.filterMessage( message ) );
        }
    }

    error( message ) {
        this.logToWindow( message )
        console.error( this.callingName, this.filterMessage( message ) );
    }
};
