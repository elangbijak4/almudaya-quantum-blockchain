'use strict';

const { cloneSerializable } = require('../../utils');

class AccountState {
  constructor({
    address,
    balance = 0,
    nonce = 0,
    storage = {}
  } = {}) {
    this.address = address;
    this.balance = balance;
    this.nonce = nonce;
    this.storage = cloneSerializable(storage);
  }

  isValid() {
    return (
      typeof this.address === 'string' &&
      this.address.length > 0 &&
      Number.isFinite(this.balance) &&
      this.balance >= 0 &&
      Number.isInteger(this.nonce) &&
      this.nonce >= 0 &&
      this.storage &&
      typeof this.storage === 'object' &&
      !Array.isArray(this.storage)
    );
  }

  toJSON() {
    return cloneSerializable({
      address: this.address,
      balance: this.balance,
      nonce: this.nonce,
      storage: this.storage
    });
  }

  static from(data) {
    if (data instanceof AccountState) {
      return new AccountState(data.toJSON());
    }

    return new AccountState(data);
  }
}

module.exports = {
  AccountState
};
