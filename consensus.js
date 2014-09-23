'use strict';

var _ = require('./underscore.1.7.0.js');

var ROUND_TIME = 60 * 1000;
var TIME_INCREASE = 15 * 1000;

exports.block = function (node, callback) {
    var state = 'proposal';
    var round = 0;
    var validators = node.mempool.getValidators();
    var locked_proposal = null;

    function proposalStep () {
        round++;
        state = 'proposal';

        var proposer = getNextProposer(validators);
        var proposal;

        if (proposer.id === node.id) { // If I am the proposer
            if (locked_proposal) {
                proposal = locked_proposal;
                node.gossip.broadcast(proposal);
            } else {
                proposal = node.mempool.constructProposal();
                node.gossip.broadcast(proposal);
            }
        }

        node.gossip.listen(stepTime(round), 'proposal', function (proposals) {
            if (!proposal) {
                proposal = getProposal(proposer, proposals);
            }

            validationStep(proposal);
        });
    }

    function validationStep (proposal) {
        state = 'validation';

        if (locked_proposal) {
            node.gossip.broadcast('validation', locked_proposal.uid);
        } else if (validateProposal(proposal)) {
            node.gossip.broadcast('validation', proposal.uid);
        }

        node.gossip.listen(stepTime(round), 'validation', function (validations) {
            precommitStep(validations);
        });
    }

    function precommitStep (validations) {
        state = 'precommit';

        var winner = atLeastPercent(66.6, validations);

        if (winner) {
            locked_proposal = winner;
            node.gossip.broadcast('precommit', winner.uid);
        }

        node.gossip.listen(stepTime(round), 'precommit', function (precommits) {
            commitStep(precommits);
        });
    }

    function commitStep (precommits) {
        var winner = atLeastPercent(66.6, precommits);
        var usurper = atLeastPercent(33.3, precommits);

        if (winner) {
            node.gossip.broadcast('commit', winner.uid);
            node.chain.commit(winner);
            return callback();
        } else if (usurper && usurper !== locked_proposal) {
            locked_proposal = null;
        }

        proposalStep();
    }
};

// - When does anyone even listen for commits?!? Why are commits broadcasted.
// - How can there be 1/3 voting for a different proposal? The proposals are signed.
// - There is another step that isn't in the whitepaper that listens for commits and does what?


// [
//   { uid: '1', vote: 'A' },
//   { uid: '2', vote: 'C' },
//   { uid: '3', vote: 'A' },
//   { uid: '4', vote: 'B' }
// ]


function atLeastPercent (percent, messages) {
    var total = 0;

    var map = _.countBy(messages, function (message) {
        total++;
        return message.uid;
    });

    // var map = messages.reduce(function (acc, item) {
    //     acc[item.uid] = (acc[item.uid] || 0) + 1;
    //     return acc;
    // }, {});

    var pairs = _.pairs(map);

    var max = _.max(pairs, function (pair) { return pair[1]; });

    pairs.sort(function () {

    });
}

function oneOrTwoThirds (votes, ) {

}


function stepTime (round) {
    return (ROUND_TIME / 3) + (round * (TIME_INCREASE / 3));
}

// Returns next proposer and modifies validators in place
function getNextProposer (validators) {
    var total_incremented = 0;

    validators.forEach(function (validator) {
        validator.accum_power += validator.power;
        total_incremented += validator.power;
    });

    // Get validator with highest accum_power
    var proposer = validators.reduce(function (previous, current) {
        return previous.accum_power > current.accum_power ? previous : current;
    });

    proposer.accum_power -= total_incremented;

    return proposer;
}