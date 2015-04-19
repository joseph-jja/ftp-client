var PublishSubscribe = {
  topics: {},
  publish: function( topic, data ) {
    var s = PublishSubscribe,
      i, end;
    // no listeners 
    if ( ! s.topics[topic] ) {
      return;
    }
    // list of listeners
    end = s.topics[topic].length;
    for ( i = 0; i < end; i++ ) {
      if ( s.topics[topic][i].caller ) {
        s.topics[topic][i].cb.call(s.topics[topic][i].caller, data);
      } else {
        s.topics[topic][i](data);
      }
    }
  },
  subscribe: function(topic, callback, caller) {
    var s = PublishSubscribe;
    if ( ! s.topics[topic] ) {
      s.topics[topic] = [];
    }
    s.topics[topic].push({cb: callback, caller: caller});
  },
  unsubscibe: function(topic, callback, caller) {
    var s = PublishSubscribe;
    if ( ! s.topics[topic] ) {
      return;
    }
    if ( s.topics[topic] ) {
      for ( i = 0; i < end; i++ ) {
        if ( s.topics[topic][i].cb === callback ) {
          s.topics[topic][i] = undefined;
          break;
        }
      }
    }
  }
};