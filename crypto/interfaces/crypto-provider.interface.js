'use strict';

class CryptoProviderInterface {
  hash(_input) {
    throw new Error('CryptoProviderInterface.hash() must be implemented');
  }

  sign(_payload, _privateKey) {
    throw new Error('CryptoProviderInterface.sign() must be implemented');
  }
}

module.exports = {
  CryptoProviderInterface
};
