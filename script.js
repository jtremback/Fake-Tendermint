'use strict';
var _ = require('./underscore.1.7.0.js');
var StateMachine = require('./state-machine.js');
var Mempool = require('./mempool.js');
var Seen = require('./seen.js');
var Consensus = require('./consensus.js');

// Decide whether to retransmit
// Decide whether to include
// Decide whether to accept
//
// All the same
//
// Object needs to take in a stream of transactions and hold state deciding whether they are valid
// in context of block/chain
//
// Valid is A) sender does not go negative B) signature checks out
//
// When does validation need to happen? And what is saved?
//
// Validation of entire chain needs to happen on startup.
// Need to save balances up to last committed block
//
// Validation of proposed block.
// Need to save balances if proposal is committed.
//
// Validation of transaction coming in, to determine retransmission.
// Need to save balances temporarily until next committted block.
//
// All functions return new (cloned) balances if valid, false if not.
//
// Possible states- proposal, vote, precommit
//
// 0) Proposer starts broadcasting next block
// 1) If locked_proposal, vote for it. If

/*global _, console*/

// FAKE TENDERMINT
var starter_chain = [
    {
        txs: [
            { sender: '0', recipient: 'A', amount: 12 },
            { sender: '0', recipient: 'B', amount: 34 },
            { sender: '0', recipient: 'C', amount: 56 },
            { sender: '0', recipient: 'D', amount: 78 },
            { sender: '0', recipient: 'E', amount: 89 },
            { sender: 'A', recipient: '0', amount: 1 },
            { sender: 'C', recipient: '0', amount: 5 },
            { sender: 'E', recipient: '0', amount: 8 }
        ],
        signature: {
            validator: '0',
            accum_power: 0
        }
    }
];

var BONDING_PERIOD = 100; // blocks

function Node (options) {
    _.extend(this, options);
    this.chain = JSON.parse(JSON.stringify(starter_chain));
    this.block_height = 1;
    this.gossipSeen = new Seen();
    this.currentBlock = { txs: [], signature: {} };
}

Node.prototype.recordTx = function (tx) {
    // Check that the tx is not already in the block and put it in there
    if (!_.findWhere(this.block.txs, { uid: tx.uid })) {
        this.block.txs.push(tx);
    }
};

// Create and gossip a transaction
Node.prototype.sendFunds = function (peer_id, amount) {
    var tx = {
        sender: this.id,
        recipient: peer_id,
        amount: amount,
        uid: this.id + '-' + Date.now()
    };

    this.currentBlock.push(tx);
    this.gossip('tx', tx);
};



// // Validate a block and modify balances in place
// Node.prototype.validateBlock = function (block, balances) {
//     // var balances_copy = JSON.parse(JSON.stringify(balances));
//     var valid = block.txs.every(function (tx) {
//         this.validateTx(tx, balances);
//     });

//     if (valid) {
//         // balances = balances_copy;
//         return balances;
//     }

//     return false;
// };

// // Validate a chain and modify balances in place if it suceeds
// Node.prototype.validateChain = function (chain, balances) {
//     var balances_copy = JSON.parse(JSON.stringify(balances));
//     var valid = chain.every(function (tx) {
//         this.validateBlock(tx, balances_copy);
//     });

//     if (valid) {
//         balances = balances_copy;
//         return balances;
//     }

//     return false;
// };



Node.prototype.getValidators = function () {
    return this.chain.reduce(function (validators, tx) {
        if (tx.recipient === '0' && tx.block + BONDING_PERIOD < this.block) {
            validators[tx.sender] = {
                power: validators[tx.sender] + tx.amount
            };
        }
        return validators;
    }, {});
};


// yo

// into thirds. so after 33% of time has passed for the round, you have to vote.

// after 67%, you precommit. after 100%, you commit or unlock.  Commits are gossiped the whole time for all rounds, so as soon as you see +2/3 commits, you set the timer for round 0 at H+1 to begin.

// Oh and if you're the validator, you begin broadcasting your proposal at 0%, which is the same as saying 100% of the previous round, for rounds greater than 1.

Node.prototype.constructProposal = function () {

};

Node.prototype.getBroadcastedProposal = function () {

};

Node.prototype.consensus = function () {
    var locked_proposal = null;

    for (var r = 0; true; r++) {
        var proposal = null;

        // Step 1: Propose
        if (this.getNextProposer === this.id) {
            if (locked_proposal) {
                proposal = locked_proposal;
            } else {
                proposal = this.constructProposal();
            }
            this.gossip(proposal);
        } else {
            proposal = this.getBroadcastedProposal();
        }

        // Step 2: Vote
        if (locked_proposal) {
            this.gossip(this.constructVote(locked_proposal));
        } else if (this.validateProposal(proposal)) {
            this.gossip(this.constructVote(proposal));
        }

        // Step 3: Pre-Commit
        var votes = this.getBroadcastedVotes();
        var two_thirds_votes = this.getTwoThirds(votes);

        if (two_thirds_votes) {
            locked_proposal = two_thirds_votes;
            this.gossip(this.constructPrecommit(locked_proposal));
        }
        var precommits = this.getBroadcastedPrecommits();

        // Step 4: Commit
        var two_thirds_precommits = this.getTwoThirds(precommits);

        if (two_thirds_precommits) {
            next_block = two_thirds_precommits;
            this.gossip(this.constructVote(next_block));
        }
    }
};


var A, B, C, D, E;

A = new Node({
    id: 'A',
    peer_ids: [ 'E' ]
});

B = new Node({
    id: 'B',
    peer_ids: [ 'C', 'D' ]
});

C = new Node({
    id: 'C',
    peer_ids: [ 'D', 'B', 'E' ]
});

D = new Node({
    id: 'D',
    peer_ids: [ 'C', 'B' ]
});

E = new Node({
    id: 'E',
    peer_ids: [ 'A', 'C' ]
});

var nodes = [ A, B, C, D, E ];

A.send('B', 1);
C.send('A', 12);

readNodes(nodes);

function readNodes (nodes) {
    nodes.forEach(function (node) {
          console.log(node.id + ': ', node.validate(node.chain));
    });
}