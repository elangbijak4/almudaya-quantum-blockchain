'use strict';

const { AddressDeriverInterface } = require('./interfaces/address-deriver.interface');
const { SignatureProviderInterface } = require('./interfaces/signature-provider.interface');
const { WalletRepositoryInterface } = require('./interfaces/wallet-repository.interface');
const { WalletAccount } = require('./models/wallet-account');
const { AddressDeriver } = require('./services/address-deriver');
const { Secp256k1SignatureProvider } = require('./services/secp256k1-signature-provider');
const { WalletManager } = require('./services/wallet-manager');

module.exports = {
  AddressDeriverInterface,
  SignatureProviderInterface,
  WalletRepositoryInterface,
  WalletAccount,
  AddressDeriver,
  Secp256k1SignatureProvider,
  WalletManager
};
