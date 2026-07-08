'use strict';

const { ContentAddressedStorageInterface } = require('./interfaces/content-addressed-storage.interface');
const { PostQuantumStorageInterface } = require('./interfaces/post-quantum-storage.interface');
const { StorageAdapterInterface } = require('./interfaces/storage-adapter.interface');
const { ContentAddressedObjectStore } = require('./services/content-addressed-object-store');
const { InMemoryStorageAdapter } = require('./services/in-memory-storage-adapter');
const { PostQuantumObjectStore } = require('./services/post-quantum-object-store');

module.exports = {
  ContentAddressedStorageInterface,
  PostQuantumStorageInterface,
  StorageAdapterInterface,
  ContentAddressedObjectStore,
  InMemoryStorageAdapter,
  PostQuantumObjectStore
};
