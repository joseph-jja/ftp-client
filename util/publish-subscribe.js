var PublishSubscribe = {
  topics: {},
  publish: function( topic, data ) {
    var s = PublishSubscribe,
      i, end = s.topics[topic].length;
    for ( i =0; i < end; i++ ) {
      s.topics[topic][i](data);
    }
  },
  subscribe: function(topic, callback) {
    var s = PublishSubscribe;
    if ( ! s.topics[topic] ) {
      s.topics[topic] = [];
    }
    s.topics[topic].push(callback);
  },
  unsubscibe: function(topic, callback) {
    var s = PublishSubscribe;
    if ( s.topics[topic] ) {
      for ( i =0; i < end; i++ ) {
        if ( s.topics[topic][i] === callback ) {
          s.topics[topic][i] = undefined;
        }
      }
    }
  }
};