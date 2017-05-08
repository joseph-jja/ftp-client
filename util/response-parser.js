const PassiveModeRE = /(\d*\,\d*\,\d*\,\d*)(\,)(\d*\,\d*)/gi;
const ResponseParser = {

    // parse the response from the server 
    // basically status codes
    parseStatusCode: function ( response ) {
        let code, i = -1;

        if ( response && response.message ) {
            i = response.message.indexOf( " " );
        }
        if ( i !== -1 ) {
            code = response.message.substring( 0, i );
            // response code must be a number and be 3 digits in length
            if ( isNaN( code ) || ( "" + code ).length !== 3 ) {
                code = undefined;
            }
        }

        return code;
    },

    // get host and port from server when we send passive mode
    parsePasvMode: function ( responseText, defaultHost ) {
        // find the 6 digits - TODO better regexp here?
        const pasvHost = responseText.match( PassiveModeRE )[ 0 ],
            portData = pasvHost.split( "," ),
            port = ( parseInt( portData[ 4 ], 10 ) * 256 ) + parseInt( portData[ 5 ], 10 );
        let host = portData[ 0 ] + "." + portData[ 1 ] + "." + portData[ 2 ] + "." + portData[ 3 ];
        //Logger.log("ResponseParser " + host + " " + port + " " + JSON.stringify(portData));
        if ( host === "0.0.0.0" ) {
            host = defaultHost;
        }
        return {
            "host": host,
            "port": port
        };
    }
};