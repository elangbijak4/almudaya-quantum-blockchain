'use strict';

const { cloneSerializable, createPlaceholderResult } = require('../../utils');
const { AccountState } = require('../models/account-state');

class WorldStateManager {
  constructor({ stateRepository, cryptoProvider } = {}) {
    if (!cryptoProvider) {
      throw new Error('cryptoProvider is required for WorldStateManager');
    }
    this.stateRepository = stateRepository;
    this.cryptoProvider = cryptoProvider;
  }

  getSnapshotMeta() {
    return createPlaceholderResult('worldstate', {
      hasRepository: Boolean(this.stateRepository),
      stateRoot: this.stateRepository ? this.getStateRoot() : null
    });
  }

  assertRepository() {
    if (!this.stateRepository) {
      throw new Error('WorldStateManager requires a stateRepository');
    }
  }

  createEmptyState() {
    return {
      accounts: {},
      stateRoot: this.cryptoProvider.hash([]),
      version: 1
    };
  }

  normalizeState(state) {
    const sourceState = state || this.createEmptyState();
    const normalizedAccounts = {};

    for (const address of Object.keys(sourceState.accounts || {}).sort()) {
      const account = AccountState.from({
        ...sourceState.accounts[address],
        address
      });

      if (!account.isValid()) {
        throw new Error(`Invalid account state for address: ${address}`);
      }

      normalizedAccounts[address] = account.toJSON();
    }

    return {
      accounts: normalizedAccounts,
      stateRoot: sourceState.stateRoot ?? null,
      version: sourceState.version ?? 1
    };
  }

  serializeStateContent(state) {
    return Object.keys(state.accounts).sort().map((address) => ({
      address,
      account: state.accounts[address]
    }));
  }

  calculateStateRoot(stateInput) {
    const state = this.normalizeState(stateInput);
    return this.cryptoProvider.hash(this.serializeStateContent(state));
  }

  loadState() {
    this.assertRepository();

    const storedState = this.stateRepository.getState?.();

    if (!storedState) {
      const emptyState = this.createEmptyState();
      this.stateRepository.putState(emptyState);
      return emptyState;
    }

    const normalizedState = this.normalizeState(storedState);
    const computedStateRoot = this.calculateStateRoot(normalizedState);

    if (normalizedState.stateRoot !== null && normalizedState.stateRoot !== computedStateRoot) {
      throw new Error('Persisted world state root is invalid');
    }

    return {
      ...normalizedState,
      stateRoot: computedStateRoot
    };
  }

  persistState(stateInput) {
    this.assertRepository();
    const normalizedState = this.normalizeState(stateInput);
    const stateRoot = this.calculateStateRoot(normalizedState);

    return this.stateRepository.putState({
      ...normalizedState,
      stateRoot
    });
  }

  updateState(mutator) {
    const currentState = this.loadState();
    const nextState = mutator(this.normalizeState(currentState));

    if (!nextState) {
      throw new Error('State mutator must return the next state');
    }

    return this.persistState(nextState);
  }

  getAccount(address) {
    if (typeof address !== 'string' || address.length === 0) {
      throw new Error('Address is required');
    }

    const state = this.loadState();
    const accountState = state.accounts[address];

    if (!accountState) {
      return new AccountState({
        address,
        balance: 0,
        nonce: 0,
        storage: {}
      });
    }

    return AccountState.from(accountState);
  }

  putAccount(accountInput) {
    const account = AccountState.from(accountInput);

    if (!account.isValid()) {
      throw new Error('Invalid account state');
    }

    this.updateState((state) => {
      state.accounts[account.address] = account.toJSON();
      return state;
    });

    return AccountState.from(account);
  }

  setBalance(address, balance) {
    const account = this.getAccount(address);

    if (!Number.isFinite(balance) || balance < 0) {
      throw new Error('Balance must be a non-negative number');
    }

    account.balance = balance;
    return this.putAccount(account);
  }

  incrementNonce(address) {
    const account = this.getAccount(address);
    account.nonce += 1;
    return this.putAccount(account);
  }

  getStorageAt(address, key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Storage key is required');
    }

    const account = this.getAccount(address);
    return cloneSerializable(account.storage[key] ?? null);
  }

  putStorageAt(address, key, value) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Storage key is required');
    }

    const account = this.getAccount(address);
    account.storage[key] = cloneSerializable(value);
    return this.putAccount(account);
  }

  getContractStorageSnapshot(contractAddress) {
    const account = this.getAccount(contractAddress);
    return cloneSerializable(account.storage);
  }

  replaceContractStorageSnapshot(contractAddress, storageSnapshot) {
    const account = this.getAccount(contractAddress);

    if (!storageSnapshot || typeof storageSnapshot !== 'object' || Array.isArray(storageSnapshot)) {
      throw new Error('Contract storage snapshot must be an object');
    }

    account.storage = cloneSerializable(storageSnapshot);
    return this.putAccount(account);
  }

  applyTransfer({ fromAddress, toAddress, amount, incrementSenderNonce = true } = {}) {
    if (typeof fromAddress !== 'string' || fromAddress.length === 0) {
      throw new Error('Sender address is required');
    }

    if (typeof toAddress !== 'string' || toAddress.length === 0) {
      throw new Error('Recipient address is required');
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Transfer amount must be a non-negative number');
    }

    const persistedState = this.updateState((state) => {
      const sender = AccountState.from(state.accounts[fromAddress] || {
        address: fromAddress,
        balance: 0,
        nonce: 0,
        storage: {}
      });
      const recipient = AccountState.from(state.accounts[toAddress] || {
        address: toAddress,
        balance: 0,
        nonce: 0,
        storage: {}
      });

      if (sender.balance < amount) {
        throw new Error('Insufficient balance');
      }

      sender.balance -= amount;
      recipient.balance += amount;

      if (incrementSenderNonce) {
        sender.nonce += 1;
      }

      state.accounts[fromAddress] = sender.toJSON();
      state.accounts[toAddress] = recipient.toJSON();
      return state;
    });

    return createPlaceholderResult('worldstate', {
      amount,
      fromAddress,
      stateRoot: persistedState.stateRoot,
      toAddress
    });
  }

  getStateRoot() {
    const state = this.loadState();
    return this.calculateStateRoot(state);
  }

  exportState() {
    const state = this.loadState();

    return cloneSerializable({
      accounts: state.accounts,
      stateRoot: this.calculateStateRoot(state),
      version: state.version
    });
  }
}

module.exports = {
  WorldStateManager
};
