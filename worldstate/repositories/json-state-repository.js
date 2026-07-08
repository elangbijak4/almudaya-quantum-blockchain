'use strict';

const fs = require('fs');
const path = require('path');
const { cloneSerializable, stableSerialize } = require('../../utils');
const { AccountState } = require('../models/account-state');

class JsonStateRepository {
  constructor({ filePath } = {}) {
    this.filePath = filePath || path.join(process.cwd(), 'worldstate', 'db', 'worldstate.json');
  }

  ensureDatabaseFile() {
    const directory = path.dirname(this.filePath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, stableSerialize(this.createEmptyDocument()));
    }
  }

  createEmptyDocument() {
    return {
      accounts: {},
      stateRoot: null,
      version: 1
    };
  }

  readDocument() {
    this.ensureDatabaseFile();
    const content = fs.readFileSync(this.filePath, 'utf8').trim();

    if (content.length === 0) {
      return this.createEmptyDocument();
    }

    return JSON.parse(content);
  }

  writeDocument(document) {
    this.ensureDatabaseFile();
    fs.writeFileSync(this.filePath, stableSerialize(document));
    return true;
  }

  getAccount(address) {
    const document = this.readDocument();
    const accountData = document.accounts[address];

    return accountData ? AccountState.from(accountData) : null;
  }

  putAccount(address, accountState) {
    const document = this.readDocument();
    const nextAccount = AccountState.from({
      ...AccountState.from(accountState).toJSON(),
      address
    });

    document.accounts[address] = nextAccount.toJSON();
    this.writeDocument(document);
    return nextAccount;
  }

  getState() {
    const document = this.readDocument();
    const accounts = {};

    for (const [address, accountState] of Object.entries(document.accounts)) {
      accounts[address] = AccountState.from(accountState).toJSON();
    }

    return cloneSerializable({
      accounts,
      stateRoot: document.stateRoot,
      version: document.version
    });
  }

  putState({ accounts = {}, stateRoot = null, version = 1 } = {}) {
    const normalizedAccounts = {};

    for (const [address, accountState] of Object.entries(accounts)) {
      normalizedAccounts[address] = AccountState.from({
        ...accountState,
        address
      }).toJSON();
    }

    const document = {
      accounts: normalizedAccounts,
      stateRoot,
      version
    };

    this.writeDocument(document);
    return cloneSerializable(document);
  }
}

module.exports = {
  JsonStateRepository
};
