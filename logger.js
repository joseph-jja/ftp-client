var Logger = {
 log: function(message) {

    var otype = (typeof this.callback).toLowerCase();

    //console.log(otype);
    console.log(message);
 }
};