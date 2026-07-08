'use strict';

const { cloneSerializable } = require('../../utils');
const { ValidatorVote } = require('../models/validator-vote');

class ValidatorNode {
  constructor({
    validatorId,
    availabilityVerifier,
    blockchain,
    postQuantumObjectStore
  } = {}) {
    this.validatorId = validatorId;
    this.availabilityVerifier = availabilityVerifier;
    this.blockchain = blockchain;
    this.postQuantumObjectStore = postQuantumObjectStore;
  }

  acceptPqObjects(bundles = []) {
    if (!this.postQuantumObjectStore) {
      throw new Error('ValidatorNode requires a postQuantumObjectStore');
    }

    return bundles.map((bundle) => {
      const imported = this.postQuantumObjectStore.importPQObjectPayload(bundle.value);

      if (imported.commitmentHash !== bundle.commitmentHash) {
        throw new Error('Propagated PQ object commitment hash mismatch');
      }

      return imported;
    });
  }

  verifyAvailability(block) {
    if (!this.availabilityVerifier) {
      throw new Error('ValidatorNode requires an availabilityVerifier');
    }

    return this.availabilityVerifier.verifyBlockAvailability(block);
  }

  voteOnBlock(block) {
    if (!this.blockchain) {
      throw new Error('ValidatorNode requires a blockchain');
    }

    if (!this.verifyAvailability(block)) {
      return new ValidatorVote({
        accepted: false,
        blockHash: block.hash,
        pqRoot: block.pqRoot,
        reason: 'PQ objects unavailable',
        validatorId: this.validatorId
      }).toJSON();
    }

    const accepted = this.blockchain.validatePostQuantumAvailabilityForTransactions(block.transactions) &&
      block.isValid({
        cryptoProvider: this.blockchain.cryptoProvider,
        postQuantumObjectStore: this.postQuantumObjectStore,
        previousBlock: this.blockchain.getLatestBlock(),
        isGenesis: false
      });

    return new ValidatorVote({
      accepted,
      blockHash: block.hash,
      pqRoot: block.pqRoot,
      reason: accepted ? null : 'Block or pqRoot validation failed',
      validatorId: this.validatorId
    }).toJSON();
  }

  toJSON() {
    return cloneSerializable({
      validatorId: this.validatorId
    });
  }
}

module.exports = {
  ValidatorNode
};
