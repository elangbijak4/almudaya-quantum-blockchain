'use strict';

class StorageAdapterInterface {
  get(_key) {
    throw new Error('StorageAdapterInterface.get() must be implemented');
  }

  put(_key, _value) {
    throw new Error('StorageAdapterInterface.put() must be implemented');
  }
}

module.exports = {
  StorageAdapterInterface
};
