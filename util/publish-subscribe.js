const PublishSubscribe = {
    topics: {},
    publish: function (topic, data) {
        let s = PublishSubscribe,
            i, end, topicFM;
        // no listeners 
        if (!s.topics[topic]) {
            return;
        }
        // list of listeners
        end = s.topics[topic].length;
        for (i = 0; i < end; i++) {
            topicFM = s.topics[topic][i];
            if (typeof topicFM.caller !== 'undefined') {
                topicFM.cb.call(topicFM.caller, data);
            } else {
                topicFM.cb(data);
            }
        }
    },
    subscribe: function (topic, callback, caller) {
        let s = PublishSubscribe;
        if (!s.topics[topic]) {
            s.topics[topic] = [];
        }
        s.topics[topic].push({
            cb: callback,
            caller: caller
        });
    },
    unsubscribe: function (topic, callback, caller) {
        let s = PublishSubscribe, end;
        if (!s.topics[topic]) {
            return;
        }
        if (s.topics[topic]) {
            end = s.topics[topic].length;
            for (i = 0; i < end; i++) {
                if (s.topics[topic][i].cb === callback) {
                    s.topics[topic][i] = undefined;
                    break;
                }
            }
        }
    }
};