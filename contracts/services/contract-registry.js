'use strict';

const { createPlaceholderResult } = require('../../utils');

class ContractRegistry {
  constructor({ contractRepository, contractCompiler } = {}) {
    this.contractRepository = contractRepository;
    this.contractCompiler = contractCompiler;
  }

  register(artifact) {
    if (this.contractRepository?.saveArtifact) {
      this.contractRepository.saveArtifact(artifact);
    }

    return createPlaceholderResult('contracts', {
      artifactName: artifact?.contractName ?? artifact?.name ?? null,
      hasRepository: Boolean(this.contractRepository)
    });
  }

  compile(source) {
    if (!this.contractCompiler) {
      throw new Error('ContractRegistry requires a contractCompiler');
    }

    return this.contractCompiler.compile(source);
  }
}

module.exports = {
  ContractRegistry
};
