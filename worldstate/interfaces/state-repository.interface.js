'use strict';

class StateRepositoryInterface {
  getAccount(_address) {
    throw new Error('StateRepositoryInterface.getAccount() must be implemented');
  }

  putAccount(_address, _accountState) {
    throw new Error('StateRepositoryInterface.putAccount() must be implemented');
  }

  getState() {
    throw new Error('StateRepositoryInterface.getState() must be implemented');
  }

  putState(_state) {
    throw new Error('StateRepositoryInterface.putState() must be implemented');
  }
}

module.exports = {
  StateRepositoryInterface
};
