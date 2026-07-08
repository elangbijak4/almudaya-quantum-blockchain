'use strict';

class ContentAddressedStorageInterface {
  storeImmutableObject(_object, _options) {
    throw new Error('ContentAddressedStorageInterface.storeImmutableObject() must be implemented');
  }

  getImmutableObject(_hash, _options) {
    throw new Error('ContentAddressedStorageInterface.getImmutableObject() must be implemented');
  }

  generateStorageRoot(_storageState, _options) {
    throw new Error('ContentAddressedStorageInterface.generateStorageRoot() must be implemented');
  }

  storeContract(_contractArtifact) {
    throw new Error('ContentAddressedStorageInterface.storeContract() must be implemented');
  }
}

module.exports = {
  ContentAddressedStorageInterface
};
