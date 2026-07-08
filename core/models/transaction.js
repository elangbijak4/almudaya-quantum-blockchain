'use strict';

const { cloneSerializable } = require('../../utils');

class Transaction {
  constructor({
    fromAddress = null,
    toAddress,
    amount,
    nonce = 0,
    timestamp = 0,
    type = 'transfer',
    data = null,
    algorithm = null,
    addressMetadata = {},
    publicKey = null,
    signature = null,
    pqCommitmentHash = null,
    pqObjectHash = null,
    pqAlgorithm = null
  } = {}) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.nonce = nonce;
    this.timestamp = timestamp;
    this.type = type;
    this.data = data === null ? null : cloneSerializable(data);
    this.algorithm = algorithm;
    this.addressMetadata = cloneSerializable(addressMetadata);
    this.publicKey = publicKey;
    this.signature = signature === null ? null : cloneSerializable(signature);
    this.pqCommitmentHash = pqCommitmentHash;
    this.pqObjectHash = pqObjectHash;
    this.pqAlgorithm = pqAlgorithm;
  }

  toJSON() {
    return cloneSerializable({
      ...this.toPayload(),
      algorithm: this.algorithm,
      addressMetadata: this.addressMetadata,
      pqAlgorithm: this.pqAlgorithm,
      pqCommitmentHash: this.pqCommitmentHash,
      pqObjectHash: this.pqObjectHash,
      publicKey: this.publicKey,
      signature: this.signature
    });
  }

  toBlockJSON() {
    return cloneSerializable({
      ...this.toPayload(),
      algorithm: this.algorithm,
      addressMetadata: this.addressMetadata,
      pqAlgorithm: this.pqAlgorithm,
      pqCommitmentHash: this.pqCommitmentHash,
      publicKey: this.publicKey,
      signature: this.signature
    });
  }

  isCoinbase() {
    return this.type === 'coinbase' && this.fromAddress === null;
  }

  toPayload() {
    return cloneSerializable({
      amount: this.amount,
      data: this.data,
      fromAddress: this.fromAddress,
      nonce: this.nonce,
      timestamp: this.timestamp,
      toAddress: this.toAddress,
      type: this.type
    });
  }

  toSignatureEnvelope() {
    return cloneSerializable({
      address: this.fromAddress,
      addressMetadata: this.addressMetadata,
      algorithm: this.algorithm,
      payload: this.toPayload(),
      publicKey: this.publicKey,
      signature: this.signature
    });
  }

  hasPostQuantumCommitment() {
    return this.pqCommitmentHash !== null;
  }

  hasLocalPostQuantumAttachment() {
    return this.hasPostQuantumCommitment() &&
      typeof this.pqObjectHash === 'string' &&
      this.pqObjectHash.length > 0;
  }

  hash(cryptoProvider) {
    return cryptoProvider.hash(this.toBlockJSON());
  }

  hasSignatureMaterial() {
    return (
      typeof this.algorithm === 'string' &&
      this.algorithm.length > 0 &&
      typeof this.publicKey === 'string' &&
      this.publicKey.length > 0 &&
      this.signature &&
      typeof this.signature === 'object'
    );
  }

  isValid() {
    if (!Number.isFinite(this.amount) || this.amount < 0) {
      return false;
    }

    if (!Number.isInteger(this.nonce) || this.nonce < 0) {
      return false;
    }

    if (!Number.isInteger(this.timestamp) || this.timestamp < 0) {
      return false;
    }

    if (typeof this.toAddress !== 'string' || this.toAddress.length === 0) {
      return false;
    }

    if (typeof this.type !== 'string' || this.type.length === 0) {
      return false;
    }

    if (this.isCoinbase()) {
      return this.amount > 0 && this.signature === null && this.publicKey === null && this.pqCommitmentHash === null;
    }

    const hasValidPostQuantumShape = (
      (this.pqCommitmentHash === null && this.pqAlgorithm === null) ||
      (/^[a-f0-9]{64}$/i.test(this.pqCommitmentHash) &&
        typeof this.pqAlgorithm === 'string' &&
        this.pqAlgorithm.length > 0)
    );

    return (
      typeof this.fromAddress === 'string' &&
      this.fromAddress.length > 0 &&
      this.amount > 0 &&
      this.hasSignatureMaterial() &&
      hasValidPostQuantumShape
    );
  }

  static from(data) {
    if (data instanceof Transaction) {
      return new Transaction(data.toJSON());
    }

    return new Transaction(data);
  }
}

module.exports = {
  Transaction
};
