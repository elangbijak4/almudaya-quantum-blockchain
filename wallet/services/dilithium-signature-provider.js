'use strict';

const { ethers } = require('ethers');
const dilithium = require('@asanrom/dilithium');
const { stableSerialize } = require('../../utils');

class DilithiumSignatureProvider {
  constructor() {
    this.algorithm = 'dilithium2';
    // We still use keccak256 for Ethereum address derivation and payload hashing (pre-hashing)
    this.hashAlgorithm = 'keccak256';
    this.level = dilithium.DilithiumLevel.get(2);
  }

  generateKeypair() {
    const keyPair = dilithium.DilithiumKeyPair.generate(this.level);
    const publicKeyBytes = keyPair.getPublicKey().getBytes();
    const privateKeyBytes = keyPair.getPrivateKey().getBytes();
    
    return Object.freeze({
      algorithm: this.algorithm,
      privateKey: Buffer.from(privateKeyBytes).toString('hex'),
      publicKey: Buffer.from(publicKeyBytes).toString('hex')
    });
  }

  sign(payload, privateKey) {
    if (typeof privateKey !== 'string' || privateKey.length === 0) {
      throw new Error('Private key is required');
    }

    const digest = ethers.keccak256(ethers.toUtf8Bytes(stableSerialize(payload)));
    const digestBuffer = Buffer.from(digest.replace('0x', ''), 'hex');

    const privKeyObj = dilithium.DilithiumPrivateKey.fromBytes(
      new Uint8Array(Buffer.from(privateKey, 'hex')),
      this.level
    );
    
    const signature = privKeyObj.sign(new Uint8Array(digestBuffer));

    return Object.freeze({
      algorithm: this.algorithm,
      encoding: 'hex',
      value: Buffer.from(signature.getBytes()).toString('hex')
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
      const digestBuffer = Buffer.from(digest.replace('0x', ''), 'hex');

      const pubKeyObj = dilithium.DilithiumPublicKey.fromBytes(
        new Uint8Array(Buffer.from(publicKey, 'hex')),
        this.level
      );
      
      const sigObj = dilithium.DilithiumSignature.fromBytes(
        new Uint8Array(Buffer.from(signature.value, 'hex')),
        this.level
      );
      
      return pubKeyObj.verifySignature(new Uint8Array(digestBuffer), sigObj);
    } catch (_error) {
      console.log('Dilithium verify error:', _error);
      return false;
    }
  }
}

module.exports = {
  DilithiumSignatureProvider
};
