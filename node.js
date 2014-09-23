'use strict';

var Seen

module.exports = Node;

function Node (options) {
    this.chain = JSON.parse(JSON.stringify(options.starter_chain));
    this.block_height = 1;

    this.gossip = new Gossip();
    this.chain = new Chain();
    this.mempool = new Mempool();


}



// Node.prototype.recordTx = function (tx) {
//     // Check that the tx is not already in the block and put it in there
//     if (!_.findWhere(this.block.txs, { uid: tx.uid })) {
//         this.block.txs.push(tx);
//     }
// };

// // Create and gossip a transaction
// Node.prototype.sendFunds = function (peer_id, amount) {
//     var tx = {
//         sender: this.id,
//         recipient: peer_id,
//         amount: amount,
//         uid: this.id + '-' + Date.now()
//     };

//     this.currentBlock.push(tx);
//     this.gossip('tx', tx);
// };