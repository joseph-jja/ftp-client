var Logger = {
 log: function(message) {

    // don't log password
    if ( message && message.indexOf("PASS") === -1 ) {
      //console.log(otype);
      console.log(message);
    } else {
      console.log("PASS command sent.");
    }
 }
};
