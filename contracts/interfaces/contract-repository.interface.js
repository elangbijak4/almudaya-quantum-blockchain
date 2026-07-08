'use strict';

class ContractRepositoryInterface {
  saveArtifact(_artifact) {
    throw new Error('ContractRepositoryInterface.saveArtifact() must be implemented');
  }

  findArtifact(_contractName) {
    throw new Error('ContractRepositoryInterface.findArtifact() must be implemented');
  }
}

module.exports = {
  ContractRepositoryInterface
};
