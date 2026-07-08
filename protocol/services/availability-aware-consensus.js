'use strict';

const { cloneSerializable } = require('../../utils');

class AvailabilityAwareConsensus {
  constructor({
    validators = [],
    pqPropagationService
  } = {}) {
    this.validators = validators;
    this.pqPropagationService = pqPropagationService;
  }

  propagatePqObjects(transactions) {
    if (!this.pqPropagationService) {
      throw new Error('AvailabilityAwareConsensus requires a pqPropagationService');
    }

    return this.pqPropagationService.propagateToValidators(transactions, this.validators);
  }

  collectVotes(block) {
    return this.validators.map((validator) => validator.voteOnBlock(block));
  }

  finalizeProposal(block) {
    const votes = this.collectVotes(block);
    const acceptedVotes = votes.filter((vote) => vote.accepted);
    const rejectedVotes = votes.filter((vote) => !vote.accepted);

    return cloneSerializable({
      accepted: acceptedVotes.length > rejectedVotes.length,
      acceptedVotes,
      blockHash: block.hash,
      pqRoot: block.pqRoot,
      rejectedVotes,
      totalValidators: this.validators.length
    });
  }

  simulateRound({ block, transactions, propagate = true } = {}) {
    const propagation = propagate ? this.propagatePqObjects(transactions) : [];
    const result = this.finalizeProposal(block);

    return cloneSerializable({
      blockHash: block.hash,
      pqRoot: block.pqRoot,
      propagation,
      result
    });
  }
}

module.exports = {
  AvailabilityAwareConsensus
};
