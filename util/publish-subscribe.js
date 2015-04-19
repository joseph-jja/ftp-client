var PublishSubscribe = {
  topics: {},
  publish: function( topic, data ) {
    var s = PublishSubscribe,
      i, end, topicFM;
    // no listeners 
    if ( ! s.topics[topic] ) {
      return;
    }
    // list of listeners
    end = s.topics[topic].length;
    for ( i = 0; i < end; i++ ) {
      topicFM = s.topics[topic][i];
      if ( topicFM.caller ) {
        topicFM.cb.call(topicFM.caller, data);
      } else {
        topicFM(data);
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