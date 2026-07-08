'use strict';

class BlockchainEngineInterface {
  getLatestBlock() {
    throw new Error('BlockchainEngineInterface.getLatestBlock() must be implemented');
  }

  addTransaction(_transaction) {
    throw new Error('BlockchainEngineInterface.addTransaction() must be implemented');
  }

  minePendingTransactions(_minerAddress) {
    throw new Error('BlockchainEngineInterface.minePendingTransactions() must be implemented');
  }

  isChainValid() {
    throw new Error('BlockchainEngineInterface.isChainValid() must be implemented');
  }
}

module.exports = {
  BlockchainEngineInterface
};
