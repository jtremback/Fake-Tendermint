'use strict';

module.exports = Seen;

function Seen () {
    this.store = {};
}

Seen.prototype.check = function (value) {
    this.store[value] = (this.store[value] || 0) + 1; // This increments the value in place
    return this.store[value] - 1;
};

