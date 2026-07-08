'use strict';

class SignatureProviderInterface {
  generateKeypair() {
    throw new Error('SignatureProviderInterface.generateKeypair() must be implemented');
  }

  sign(_payload, _privateKey) {
    throw new Error('SignatureProviderInterface.sign() must be implemented');
  }

  verify(_payload, _signature, _publicKey) {
    throw new Error('SignatureProviderInterface.verify() must be implemented');
  }
}

module.exports = {
  SignatureProviderInterface
};
