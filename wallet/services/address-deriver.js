'use strict';

const { ethers } = require('ethers');

class AddressDeriver {
  constructor({ cryptoProvider, prefix = '0x', addressLength = 40 } = {}) {
    this.cryptoProvider = cryptoProvider;
    this.prefix = prefix;
    this.addressLength = addressLength;
  }

  deriveAddress(publicKey, metadata = {}) {
    if (typeof publicKey !== 'string' || publicKey.length === 0) {
      throw new Error('Public key is required');
    }

    if (metadata.algorithm === 'secp256k1' || metadata.algorithm === 'ethereum-rlp') {
      return ethers.computeAddress(publicKey).toLowerCase();
    }

    if (!this.cryptoProvider) {
      throw new Error('AddressDeriver requires a cryptoProvider for non-secp256k1 algorithms');
    }

    const digest = this.cryptoProvider.hash({
      metadata,
      publicKey
    });

    return `${this.prefix}${digest.slice(-this.addressLength)}`;
  }
}

module.exports = {
  AddressDeriver
};
