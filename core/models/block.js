'use strict';

const { cloneSerializable } = require('../../utils');
const { Transaction } = require('./transaction');

class Block {
  constructor({
    index,
    previousHash = '0',
    timestamp = 0,
    transactions = [],
    difficulty = 1,
    nonce = 0,
    minerAddress = null,
    stateRoot = null,
    pqRoot = null,
    merkleRoot = null,
    hash = null
  } = {}) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions.map((transaction) => Transaction.from(transaction));
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.minerAddress = minerAddress;
    this.stateRoot = stateRoot;
    this.pqRoot = pqRoot;
    this.merkleRoot = merkleRoot;
    this.hash = hash;
  }

  toJSON() {
    return cloneSerializable({
      difficulty: this.difficulty,
      hash: this.hash,
      index: this.index,
      merkleRoot: this.merkleRoot,
      minerAddress: this.minerAddress,
      nonce: this.nonce,
      previousHash: this.previousHash,
      pqRoot: this.pqRoot,
      stateRoot: this.stateRoot,
      timestamp: this.timestamp,
      transactions: this.transactions.map((transaction) => transaction.toBlockJSON())
    });
  }

  calculateMerkleRoot(cryptoProvider) {
    if (this.transactions.length === 0) {
      return cryptoProvider.hash([]);
    }

    let layer = this.transactions.map((transaction) => transaction.hash(cryptoProvider));

    while (layer.length > 1) {
      const nextLayer = [];

      for (let index = 0; index < layer.length; index += 2) {
        const left = layer[index];
        const right = layer[index + 1] ?? left;

        nextLayer.push(cryptoProvider.hash({ left, right }));
      }

      layer = nextLayer;
    }

    return layer[0];
  }

  toHeaderPayload() {
    return {
      difficulty: this.difficulty,
      index: this.index,
      merkleRoot: this.merkleRoot,
      minerAddress: this.minerAddress,
      nonce: this.nonce,
      previousHash: this.previousHash,
      pqRoot: this.pqRoot,
      stateRoot: this.stateRoot,
      timestamp: this.timestamp
    };
  }

  calculateHash(cryptoProvider) {
    return cryptoProvider.hash(this.toHeaderPayload());
  }

  calculatePqRoot(cryptoProvider, postQuantumObjectStore = null) {
    const pqCommitmentHashes = this.transactions
      .map((transaction) => transaction.pqCommitmentHash ?? null)
      .filter((commitmentHash) => commitmentHash !== null);

    if (postQuantumObjectStore) {
      return postQuantumObjectStore.generatePqRoot(pqCommitmentHashes);
    }

    return cryptoProvider.hash(pqCommitmentHashes);
  }

  mine(cryptoProvider, postQuantumObjectStore = null) {
    this.merkleRoot = this.calculateMerkleRoot(cryptoProvider);
    this.pqRoot = this.calculatePqRoot(cryptoProvider, postQuantumObjectStore);

    const targetPrefix = '0'.repeat(this.difficulty);

    do {
      this.hash = this.calculateHash(cryptoProvider);

      if (this.hash.startsWith(targetPrefix)) {
        return this.hash;
      }

      this.nonce += 1;
    } while (true);
  }

  hasValidTransactions() {
    return this.transactions.every((transaction) => transaction.isValid());
  }

  hasValidCoinbaseLayout() {
    const coinbaseTransactions = this.transactions.filter((transaction) => transaction.isCoinbase());

    if (coinbaseTransactions.length !== 1) {
      return false;
    }

    return this.transactions[0].isCoinbase();
  }

  isValid({ cryptoProvider, previousBlock = null, isGenesis = false, postQuantumObjectStore = null }) {
    if (!Number.isInteger(this.index) || this.index < 0) {
      return false;
    }

    if (!Number.isInteger(this.timestamp) || this.timestamp < 0) {
      return false;
    }

    if (!Number.isInteger(this.nonce) || this.nonce < 0) {
      return false;
    }

    if (!Number.isInteger(this.difficulty) || this.difficulty < 0) {
      return false;
    }

    if (
      typeof this.previousHash !== 'string' ||
      typeof this.hash !== 'string' ||
      typeof this.pqRoot !== 'string' ||
      this.pqRoot.length === 0 ||
      typeof this.stateRoot !== 'string' ||
      this.stateRoot.length === 0
    ) {
      return false;
    }

    if (!this.hasValidTransactions()) {
      return false;
    }

    if (!this.hasValidCoinbaseLayout()) {
      return false;
    }

    const expectedMerkleRoot = this.calculateMerkleRoot(cryptoProvider);
    const expectedPqRoot = this.calculatePqRoot(cryptoProvider, postQuantumObjectStore);

    if (this.merkleRoot !== expectedMerkleRoot) {
      return false;
    }

    if (this.pqRoot !== expectedPqRoot) {
      return false;
    }

    if (this.calculateHash(cryptoProvider) !== this.hash) {
      return false;
    }

    if (!this.hash.startsWith('0'.repeat(this.difficulty))) {
      return false;
    }

    if (isGenesis) {
      return this.previousHash === '0' && this.index === 0;
    }

    if (!previousBlock) {
      return false;
    }

    return (
      this.index === previousBlock.index + 1 &&
      this.previousHash === previousBlock.hash &&
      this.timestamp >= previousBlock.timestamp
    );
  }

  static from(data) {
    if (data instanceof Block) {
      return new Block(data.toJSON());
    }

    return new Block(data);
  }
}

module.exports = {
  Block
};
