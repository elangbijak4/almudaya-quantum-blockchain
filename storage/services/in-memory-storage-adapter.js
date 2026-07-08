'use strict';

const { cloneSerializable, stableSerialize } = require('../../utils');

class InMemoryStorageAdapter {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const serializedKey = stableSerialize(key);
    const value = this.store.get(serializedKey);

    return value === undefined ? null : cloneSerializable(value);
  }

  put(key, value) {
    const serializedKey = stableSerialize(key);
    const storedValue = cloneSerializable(value);

    this.store.set(serializedKey, storedValue);
    return true;
  }
}

module.exports = {
  InMemoryStorageAdapter
};
