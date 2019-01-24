const TcpSockets = chrome.sockets.tcp, 
    ArrayBufferType = Int8Array;

async function create() { 
    return new Promise( resolve => {
       TcpSockets.create( {}, ( createInfo ) => {
           resolve( createInfo );
        } );
    } );
}

async function connect( host, port ) {

    const socketPort = ( typeof port !== 'undefined' ? port : 21 );
    if ( host && host.length > 0 ) {
        const connectCB = ( result ) => {
            //this.logger.log.call(this, "TcpWrapper connect tcp.connect: " + JSON.stringify(result));
            TcpListeners.ps.publish( 'connected' + this.id, result );
        };
        
    }    
}
