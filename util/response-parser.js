

var ResponseParser = { 
  
  parseStatusCode: function(responseText) {
    var code, i;
    
    i = responseText.indexOf(" ");
    if ( i !== -1 ) {
        code = responseText.substring(0, i);
        if ( isNaN(code) ) {
          code = undefined;
        }
    }
    return code;
  }, 
  
  parsePasvMode: function(responseText, defaultHost) {
    var pasvHost, portData, port, host;
    
    // find the 6 digits - TODO better regexp here?
    pasvHost = responseText.match(/(\d*\,\d*\,\d*\,\d*)(\,)(\d*\,\d*)/gi)[0];
    portData = pasvHost.split(",");
    port = ( parseInt(portData[4], 10) * 256) + parseInt(portData[5], 10);
    host = portData[0] + "." + portData[1] + "." + portData[2] + "." + portData[3];
    //Logger.log("ResponseParser " + host + " " + port + " " + JSON.stringify(portData));
    if ( host === "0.0.0.0" ) {
      host = defaultHost;
    }
    return { "host": host, "port": port };
  }
};