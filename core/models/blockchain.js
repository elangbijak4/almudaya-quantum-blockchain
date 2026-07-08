'use strict';

const { cloneSerializable } = require('../../utils');
const { Block } = require('./block');
const { Transaction } = require('./transaction');

class Blockchain {
  constructor({
    chainId = 'prototype-chain',
    difficulty = 2,
    miningReward = 50,
    genesisAddress = 'genesis-treasury',
    initialSupply = 1000000,
    prefundedAccounts = [],
    prefundAmount = 10000,
    cryptoProvider,
    walletManager = null,
    worldStateManager = null,
    postQuantumObjectStore = null
  } = {}) {
    this.chainId = chainId;
    this.difficulty = difficulty;
    this.miningReward = miningReward;
    this.genesisAddress = genesisAddress;
    this.initialSupply = initialSupply;
    this.prefundedAccounts = prefundedAccounts;
    this.prefundAmount = prefundAmount;
    this.cryptoProvider = cryptoProvider;
    this.walletManager = walletManager;
    this.worldStateManager = worldStateManager;
    this.postQuantumObjectStore = postQuantumObjectStore;
    
    if (!cryptoProvider) {
      throw new Error('cryptoProvider is required for Blockchain');
    }
    
    this._pendingTransactions = [];
    this._chain = [this.createGenesisBlock()];
  }

  get chain() {
    return this._chain.map((block) => Block.from(block));
  }

  get pendingTransactions() {
    return this._pendingTransactions.map((transaction) => Transaction.from(transaction));
  }

  createCoinbaseTransaction({ toAddress, amount, nonce, timestamp, data = null } = {}) {
    return new Transaction({
      amount,
      data,
      fromAddress: null,
      nonce,
      timestamp,
      toAddress,
      type: 'coinbase'
    });
  }

  createGenesisStateSnapshot() {
    const accounts = {
      [this.genesisAddress]: {
        address: this.genesisAddress,
        balance: this.initialSupply,
        nonce: 0,
        storage: {}
      }
    };

    for (const address of this.prefundedAccounts) {
      if (!accounts[address]) {
        accounts[address] = {
          address,
          balance: 0,
          nonce: 0,
          storage: {}
        };
      }
      accounts[address].balance += this.prefundAmount;
    }

    return {
      accounts,
      stateRoot: null,
      version: 1
    };
  }

  calculateStateRoot(stateSnapshot) {
    if (this.worldStateManager) {
      return this.worldStateManager.calculateStateRoot(stateSnapshot);
    }

    const accounts = Object.keys(stateSnapshot.accounts || {}).sort().map((address) => ({
      address,
      account: stateSnapshot.accounts[address]
    }));

    return this.cryptoProvider.hash(accounts);
  }

  persistStateSnapshot(stateSnapshot) {
    if (!this.worldStateManager) {
      return {
        ...cloneSerializable(stateSnapshot),
        stateRoot: this.calculateStateRoot(stateSnapshot)
      };
    }

    return this.worldStateManager.persistState(stateSnapshot);
  }

  rebuildStateFromChain() {
    let projectedState = this.createGenesisStateSnapshot();

    for (let index = 1; index < this._chain.length; index += 1) {
      projectedState = this.projectTransactionsToState(projectedState, this._chain[index].transactions, {
        expectedCoinbaseReward: this.miningReward
      });
    }

    return projectedState;
  }

  exportCurrentState() {
    if (!this.worldStateManager) {
      return this.rebuildStateFromChain();
    }

    return this.worldStateManager.exportState();
  }

  createGenesisBlock() {
    const transactions = [];
    
    transactions.push(this.createCoinbaseTransaction({
      toAddress: this.genesisAddress,
      amount: this.initialSupply,
      nonce: 0,
      timestamp: 0,
      data: {
        chainId: this.chainId,
        label: 'genesis-allocation'
      }
    }));

    let nonceIndex = 1;
    for (const address of this.prefundedAccounts) {
      transactions.push(this.createCoinbaseTransaction({
        toAddress: address,
        amount: this.prefundAmount,
        nonce: nonceIndex,
        timestamp: 0,
        data: {
          chainId: this.chainId,
          label: 'prefund-allocation'
        }
      }));
      nonceIndex++;
    }

    const genesisState = this.createGenesisStateSnapshot();
    const genesisStateRoot = this.calculateStateRoot(genesisState);
    const genesisBlock = new Block({
      difficulty: this.difficulty,
      index: 0,
      minerAddress: this.genesisAddress,
      previousHash: '0',
      stateRoot: genesisStateRoot,
      timestamp: 0,
      transactions: transactions
    });

    genesisBlock.mine(this.cryptoProvider, this.postQuantumObjectStore);
    this.persistStateSnapshot({
      ...genesisState,
      stateRoot: genesisStateRoot
    });

    return genesisBlock;
  }

  getLatestBlock() {
    return Block.from(this._chain[this._chain.length - 1]);
  }

  getAccountFromState(stateSnapshot, address) {
    if (!stateSnapshot.accounts[address]) {
      stateSnapshot.accounts[address] = {
        address,
        balance: 0,
        nonce: 0,
        storage: {}
      };
    }

    return stateSnapshot.accounts[address];
  }

  validateTransactionSignature(transaction) {
    if (transaction.isCoinbase()) {
      return true;
    }

    if (!this.walletManager) {
      throw new Error('Wallet manager is required for signature validation');
    }

    return this.walletManager.verifyTransactionSignature(
      transaction.toPayload(),
      transaction.toSignatureEnvelope()
    );
  }

  validatePostQuantumAttachment(transaction) {
    if (!transaction.hasPostQuantumCommitment()) {
      return true;
    }

    if (!this.postQuantumObjectStore) {
      return transaction.pqObjectHash === null;
    }

    if (!transaction.hasLocalPostQuantumAttachment()) {
      return false;
    }

    return this.postQuantumObjectStore.validatePQObject(
      transaction.pqCommitmentHash,
      transaction.pqObjectHash
    );
  }

  validatePostQuantumAvailabilityForTransactions(transactions) {
    for (const transactionInput of transactions) {
      const transaction = Transaction.from(transactionInput);

      if (!transaction.hasPostQuantumCommitment()) {
        continue;
      }

      if (!this.postQuantumObjectStore) {
        return false;
      }

      if (!this.postQuantumObjectStore.hasPQObjectByCommitmentHash(transaction.pqCommitmentHash)) {
        return false;
      }
    }

    return true;
  }

  applyCoinbaseTransaction(stateSnapshot, transaction, expectedReward) {
    if (transaction.amount !== expectedReward) {
      throw new Error('Invalid coinbase reward');
    }

    const recipient = this.getAccountFromState(stateSnapshot, transaction.toAddress);
    recipient.balance += transaction.amount;
  }

  applyTransferTransaction(stateSnapshot, transaction) {
    if (!this.validateTransactionSignature(transaction)) {
      throw new Error('Invalid transaction signature');
    }

    const sender = this.getAccountFromState(stateSnapshot, transaction.fromAddress);
    const recipient = this.getAccountFromState(stateSnapshot, transaction.toAddress);

    if (transaction.nonce !== sender.nonce) {
      throw new Error('Invalid transaction nonce');
    }

    if (sender.balance < transaction.amount) {
      throw new Error('Insufficient balance for transaction');
    }

    sender.balance -= transaction.amount;
    sender.nonce += 1;
    recipient.balance += transaction.amount;
  }

  projectTransactionsToState(baseStateSnapshot, transactions, { expectedCoinbaseReward } = {}) {
    const projectedState = cloneSerializable({
      accounts: baseStateSnapshot.accounts || {},
      stateRoot: baseStateSnapshot.stateRoot ?? null,
      version: baseStateSnapshot.version ?? 1
    });

    for (let index = 0; index < transactions.length; index += 1) {
      const transaction = Transaction.from(transactions[index]);

      if (!transaction.isValid()) {
        throw new Error('Invalid transaction structure');
      }

      if (transaction.isCoinbase()) {
        if (index !== 0) {
          throw new Error('Coinbase transaction must be first in block');
        }

        this.applyCoinbaseTransaction(projectedState, transaction, expectedCoinbaseReward);
        continue;
      }

      this.applyTransferTransaction(projectedState, transaction);
    }

    projectedState.stateRoot = this.calculateStateRoot(projectedState);
    return projectedState;
  }

  getConfirmedBalance(address) {
    if (typeof address !== 'string' || address.length === 0) {
      throw new Error('Address is required');
    }

    const state = this.exportCurrentState();
    return state.accounts[address]?.balance ?? 0;
  }

  getPendingOutflow(address) {
    return this._pendingTransactions.reduce((total, transaction) => {
      if (transaction.fromAddress !== address) {
        return total;
      }

      return total + transaction.amount;
    }, 0);
  }

  getSpendableBalance(address) {
    return this.getConfirmedBalance(address) - this.getPendingOutflow(address);
  }

  getExpectedPendingNonce(address) {
    const currentNonce = this.exportCurrentState().accounts[address]?.nonce ?? 0;
    const queuedTransactions = this._pendingTransactions.filter((transaction) => transaction.fromAddress === address);

    return currentNonce + queuedTransactions.length;
  }

  addTransaction(transactionInput) {
    const transaction = Transaction.from(transactionInput);

    if (transaction.isCoinbase()) {
      throw new Error('Coinbase transactions are created internally');
    }

    if (!transaction.isValid()) {
      throw new Error('Invalid transaction');
    }

    if (!this.validateTransactionSignature(transaction)) {
      throw new Error('Invalid transaction signature');
    }

    if (!this.validatePostQuantumAttachment(transaction)) {
      throw new Error('Invalid post-quantum attachment');
    }

    const expectedNonce = this.getExpectedPendingNonce(transaction.fromAddress);

    if (transaction.nonce !== expectedNonce) {
      throw new Error('Invalid transaction nonce');
    }

    const availableBalance = this.getSpendableBalance(transaction.fromAddress);

    if (availableBalance < transaction.amount) {
      throw new Error('Insufficient balance for transaction');
    }

    this._pendingTransactions.push(transaction);
    return Transaction.from(transaction);
  }

  finalizeBlockTransactions(transactions) {
    const baseState = this.exportCurrentState();

    return this.projectTransactionsToState(baseState, transactions, {
      expectedCoinbaseReward: this.miningReward
    });
  }

  minePendingTransactions(minerAddress) {
    if (typeof minerAddress !== 'string' || minerAddress.length === 0) {
      throw new Error('Miner address is required');
    }

    const latestBlock = this._chain[this._chain.length - 1];
    const nextIndex = latestBlock.index + 1;
    const nextTimestamp = latestBlock.timestamp + 1;
    const rewardTransaction = this.createCoinbaseTransaction({
      toAddress: minerAddress,
      amount: this.miningReward,
      nonce: nextIndex,
      timestamp: nextTimestamp,
      data: {
        chainId: this.chainId,
        label: 'mining-reward'
      }
    });

    const blockTransactions = [rewardTransaction, ...this._pendingTransactions.map((tx) => Transaction.from(tx))];
    const finalizedState = this.finalizeBlockTransactions(blockTransactions);
    const block = new Block({
      difficulty: this.difficulty,
      index: nextIndex,
      minerAddress,
      previousHash: latestBlock.hash,
      stateRoot: finalizedState.stateRoot,
      timestamp: nextTimestamp,
      transactions: blockTransactions
    });

    block.mine(this.cryptoProvider, this.postQuantumObjectStore);
    this.persistStateSnapshot(finalizedState);
    this._chain.push(block);
    this._pendingTransactions = [];

    return Block.from(block);
  }

  getBalance(address) {
    return this.getConfirmedBalance(address);
  }

  isChainValid() {
    let projectedState = this.createGenesisStateSnapshot();

    for (let index = 0; index < this._chain.length; index += 1) {
      const currentBlock = this._chain[index];
      const previousBlock = index === 0 ? null : this._chain[index - 1];
      const isGenesis = index === 0;

      if (!currentBlock.isValid({
        cryptoProvider: this.cryptoProvider,
        postQuantumObjectStore: this.postQuantumObjectStore,
        previousBlock,
        isGenesis
      })) {
        return false;
      }

      if (!this.validatePostQuantumAvailabilityForTransactions(currentBlock.transactions)) {
        return false;
      }

      const coinbaseTransaction = currentBlock.transactions[0];

      if (isGenesis) {
        if (coinbaseTransaction.amount !== this.initialSupply || currentBlock.stateRoot !== this.calculateStateRoot(projectedState)) {
          return false;
        }

        continue;
      }

      try {
        projectedState = this.projectTransactionsToState(projectedState, currentBlock.transactions, {
          expectedCoinbaseReward: this.miningReward
        });
      } catch (_error) {
        return false;
      }

      if (currentBlock.stateRoot !== projectedState.stateRoot) {
        return false;
      }
    }

    return true;
  }

  toJSON() {
    return cloneSerializable({
      chain: this._chain.map((block) => block.toJSON()),
      chainId: this.chainId,
      difficulty: this.difficulty,
      genesisAddress: this.genesisAddress,
      initialSupply: this.initialSupply,
      miningReward: this.miningReward,
      pendingTransactions: this._pendingTransactions.map((transaction) => transaction.toJSON())
    });
  }
}

module.exports = {
  Blockchain
};
