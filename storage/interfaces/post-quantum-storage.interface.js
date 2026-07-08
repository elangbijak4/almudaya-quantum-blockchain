'use strict';

class PostQuantumStorageInterface {
  storePQObject(_pqObject) {
    throw new Error('PostQuantumStorageInterface.storePQObject() must be implemented');
  }

  getPQObject(_objectHash) {
    throw new Error('PostQuantumStorageInterface.getPQObject() must be implemented');
  }

  createCommitmentHash(_pqObject) {
    throw new Error('PostQuantumStorageInterface.createCommitmentHash() must be implemented');
  }

  validatePQObject(_commitmentHash, _objectHash) {
    throw new Error('PostQuantumStorageInterface.validatePQObject() must be implemented');
  }

  generatePqRoot(_commitmentHashes) {
    throw new Error('PostQuantumStorageInterface.generatePqRoot() must be implemented');
  }
}

module.exports = {
  PostQuantumStorageInterface
};
