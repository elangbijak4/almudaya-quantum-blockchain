'use strict';

const { cloneSerializable } = require('../../utils');

class WalletAccount {
  constructor({
    address,
    algorithm,
    addressMetadata = {},
    privateKey,
    publicKey
  } = {}) {
    this.address = address;
    this.algorithm = algorithm;
    this.addressMetadata = cloneSerializable(addressMetadata);
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  toJSON() {
    return cloneSerializable({
      address: this.address,
      algorithm: this.algorithm,
      addressMetadata: this.addressMetadata,
      privateKey: this.privateKey,
      publicKey: this.publicKey
    });
  }

  toPublicAccount() {
    return cloneSerializable({
      address: this.address,
      algorithm: this.algorithm,
      addressMetadata: this.addressMetadata,
      publicKey: this.publicKey
    });
  }

  static from(data) {
    if (data instanceof WalletAccount) {
      return new WalletAccount(data.toJSON());
    }

    return new WalletAccount(data);
  }
}

module.exports = {
  WalletAccount
};
