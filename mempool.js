'use strict';

module.exports = Mempool;

function Mempool () {
    this.balances = {};
    this.txs = {};
}

Mempool.prototype.addTx = function (tx) {
    if (validateTx(tx, this.balances)) {
        this.txs[tx.hash] = tx;
        return true;
    }

    return false;
};

Mempool.prototype.commitBlock = function (block) {
  var _this = this;
  block.txs.forEach(function (tx) {
    delete _this.txs[tx.hash];
  });
};

// Validate a tx and modify balances in place if it succeeds
function validateTx (tx, balances) {
    if (balances[tx.sender] - tx.amount >= 0) {
        balances[tx.sender] -= tx.amount;
        return true;
    }

    return false;
}
