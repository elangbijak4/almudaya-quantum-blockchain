'use strict';

const { ethers } = require('ethers');

class EthereumRlpSignatureProvider {
  constructor() {
    this.algorithm = 'ethereum-rlp';
  }

  generateKeypair() {
    throw new Error('EthereumRlpSignatureProvider does not support key generation. Use secp256k1 instead.');
  }

  sign() {
    throw new Error('EthereumRlpSignatureProvider does not support signing. It is used for verifying Metamask transactions.');
  }

  verify(payload, signature, publicKey) {
    if (typeof publicKey !== 'string' || publicKey.length === 0) {
      throw new Error('Public key is required');
    }

    if (!signature || signature.algorithm !== this.algorithm || signature.encoding !== 'hex' || !signature.unsignedHash) {
      return false;
    }

    try {
      const recoveredPublicKey = ethers.SigningKey.recoverPublicKey(signature.unsignedHash, signature.value);
      const requestedSigningKey = new ethers.SigningKey(publicKey);
      return recoveredPublicKey.toLowerCase() === requestedSigningKey.publicKey.toLowerCase();
    } catch (_error) {
      return false;
    }
  }
}

module.exports = {
  EthereumRlpSignatureProvider
};
