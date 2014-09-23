'use strict';

var internet = require('./internet.js');
var Seen = require('./seen.js');

module.exports = Gossip;

function Gossip (peer_ids) {
    this.peer_ids = peer_ids;
    this.seen = new Seen();
}

Gossip.prototype.broadcast = function (type, message) {
    var serialized = JSON.stringify(message);

    this.peer_ids.forEach(function (peer_id) {
        internet.emit(peer_id, type, serialized);
    });
};

Gossip.prototype.listen = function (time, type, callback) {
    var messages = [];

    internet.on(this.id, function (type, serialized) {
        var message = JSON.parse(serialized);

        // If this gossip has not been seen before and it is the right type
        if (!this.seen.check(message.uid) && message.type === type) {
            messages.push(message);
        }
    });

    setTimeout(callback, time);
};