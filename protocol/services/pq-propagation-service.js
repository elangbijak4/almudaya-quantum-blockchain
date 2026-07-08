'use strict';

const { cloneSerializable } = require('../../utils');

class PqPropagationService {
  constructor({ postQuantumObjectStore } = {}) {
    this.postQuantumObjectStore = postQuantumObjectStore;
  }

  collectPqObjects(transactions) {
    const bundles = [];

    for (const transaction of transactions) {
      if (transaction?.pqCommitmentHash && transaction?.pqObjectHash) {
        const pqObject = this.postQuantumObjectStore?.getPQObject(transaction.pqObjectHash);

        if (!pqObject) {
          throw new Error('PQ propagation source store cannot resolve pqObjectHash');
        }

        bundles.push(cloneSerializable({
          commitmentHash: transaction.pqCommitmentHash,
          objectHash: transaction.pqObjectHash,
          value: pqObject.value
        }));
      }
    }

    return bundles;
  }

  propagateToValidator(transactions, validator) {
    if (!validator?.acceptPqObjects) {
      throw new Error('Validator must implement acceptPqObjects()');
    }

    const bundles = this.collectPqObjects(transactions);
    return validator.acceptPqObjects(bundles);
  }

  propagateToValidators(transactions, validators = []) {
    return validators.map((validator) => this.propagateToValidator(transactions, validator));
  }
}

module.exports = {
  PqPropagationService
};
