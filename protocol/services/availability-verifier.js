'use strict';

class AvailabilityVerifier {
  constructor({ postQuantumObjectStore } = {}) {
    this.postQuantumObjectStore = postQuantumObjectStore;
  }

  verifyTransactionAvailability(transaction) {
    if (!transaction?.pqCommitmentHash) {
      return true;
    }

    if (!this.postQuantumObjectStore) {
      return false;
    }

    return this.postQuantumObjectStore.hasPQObjectByCommitmentHash(transaction.pqCommitmentHash);
  }

  verifyBlockAvailability(block) {
    return block.transactions.every((transaction) => this.verifyTransactionAvailability(transaction));
  }
}

module.exports = {
  AvailabilityVerifier
};
