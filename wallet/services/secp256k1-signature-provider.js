'use strict';

const { ethers } = require('ethers');
const { stableSerialize } = require('../../utils');

class Secp256k1SignatureProvider {
  constructor() {
    this.algorithm = 'secp256k1';
    this.hashAlgorithm = 'keccak256';
  }

  generateKeypair() {
    const wallet = ethers.Wallet.createRandom();
    const signingKey = new ethers.SigningKey(wallet.privateKey);
    
    return Object.freeze({
      algorithm: this.algorithm,
      privateKey: wallet.privateKey,
      publicKey: signingKey.publicKey
    });
  }

  sign(payload, privateKey) {
    if (typeof privateKey !== 'string' || privateKey.length === 0) {
      throw new Error('Private key is required');
    }

    const signingKey = new ethers.SigningKey(privateKey);
    const digest = ethers.keccak256(ethers.toUtf8Bytes(stableSerialize(payload)));
    const signature = signingKey.sign(digest);

    return Object.freeze({
      algorithm: this.algorithm,
      encoding: 'hex',
      value: signature.serialized
    });
  }

  verify(payload, signature, publicKey) {
    if (typeof publicKey !== 'string' || publicKey.length === 0) {
      throw new Error('Public key is required');
    }

    if (!signature || signature.algorithm !== this.algorithm || signature.encoding !== 'hex') {
      return false;
    }

    try {
      const digest = ethers.keccak256(ethers.toUtf8Bytes(stableSerialize(payload)));
      const recoveredPublicKey = ethers.recoverPublicKey(digest, signature.value);
      
      const requestedSigningKey = new ethers.SigningKey(publicKey);
      return recoveredPublicKey.toLowerCase() === requestedSigningKey.publicKey.toLowerCase();
    } catch (_error) {
      return false;
    }
  }
}

module.exports = {
  Secp256k1SignatureProvider
};
