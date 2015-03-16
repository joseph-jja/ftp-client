var Logger = {
 log: function(message) {

    var otype = (typeof this.callback).toLowerCase();
    // don't log password
    if ( message.indexOf("PASS") === -1 ) {
      //console.log(otype);
      console.log(message);
    } else {
      console.log("PASS command sent.");
    }
 }
};