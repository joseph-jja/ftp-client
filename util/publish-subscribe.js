const PublishSubscribe = {
    topics: {},
    publish: function ( topic, data ) {
        let ps = PublishSubscribe;
        // no listeners 
        if ( !ps.topics[ topic ] ) {
            return;
        }
        // list of listeners
        let end = ps.topics[ topic ].length;
        for ( let i = 0; i < end; i++ ) {
            let topicFM = ps.topics[ topic ][ i ];
            if ( typeof topicFM.caller !== 'undefined' ) {
                topicFM.cb.call( topicFM.caller, data );
            } else {
                topicFM.cb( data );
            }
        }
    },
    subscribe: function ( topic, callback, caller ) {
        let ps = PublishSubscribe;
        if ( !ps.topics[ topic ] ) {
            ps.topics[ topic ] = [];
        }
        ps.topics[ topic ].push( {
            cb: callback,
            caller: caller
        } );
    },
    unsubscribe: function ( topic, callback, caller ) {
        let ps = PublishSubscribe;
        if ( !ps.topics[ topic ] ) {
            return;
        }
        if ( ps.topics[ topic ] ) {
            const topicObj = ps.topics[ topic ];
            let end = topicObj.length;
            for ( let i = 0; i < end; i++ ) {
                if ( topicObj[ i ] ) {
                    topicObj[ i ] = undefined;
                    break;
                }
            }
        }
    }
};
