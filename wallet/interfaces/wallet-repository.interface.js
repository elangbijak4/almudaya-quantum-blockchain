'use strict';

class WalletRepositoryInterface {
  saveAccount(_account) {
    throw new Error('WalletRepositoryInterface.saveAccount() must be implemented');
  }

  findAccount(_address) {
    throw new Error('WalletRepositoryInterface.findAccount() must be implemented');
  }
}

module.exports = {
  WalletRepositoryInterface
};
