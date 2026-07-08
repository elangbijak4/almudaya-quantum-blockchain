'use strict';

const fs = require('fs');
const path = require('path');
const { CryptoProvider } = require('../../crypto');
const { cloneSerializable, stableSerialize } = require('../../utils');
const { ContentAddressedObjectStore } = require('./content-addressed-object-store');

class PostQuantumObjectStore {
  constructor({
    contentAddressedObjectStore = new ContentAddressedObjectStore(),
    cryptoProvider = new CryptoProvider(),
    commitmentIndexPath = null
  } = {}) {
    this.contentAddressedObjectStore = contentAddressedObjectStore;
    this.cryptoProvider = cryptoProvider;
    this.namespace = 'pq';
    this.defaultAlgorithm = 'pq-placeholder';
    this.commitmentIndex = new Map();
    this.commitmentIndexPath = commitmentIndexPath || path.join(process.cwd(), 'storage', 'pq-index');
  }

  ensureCommitmentIndexDirectory() {
    if (!fs.existsSync(this.commitmentIndexPath)) {
      fs.mkdirSync(this.commitmentIndexPath, { recursive: true });
    }
  }

  getCommitmentIndexFilePath(commitmentHash) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);

    return path.join(
      this.commitmentIndexPath,
      normalizedCommitmentHash.slice(0, 2),
      normalizedCommitmentHash.slice(2, 4),
      `${normalizedCommitmentHash}.json`
    );
  }

  persistCommitmentIndex(commitmentHash, objectHash) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);
    const indexFilePath = this.getCommitmentIndexFilePath(normalizedCommitmentHash);

    fs.mkdirSync(path.dirname(indexFilePath), { recursive: true });
    fs.writeFileSync(indexFilePath, stableSerialize({
      commitmentHash: normalizedCommitmentHash,
      objectHash
    }));

    this.commitmentIndex.set(normalizedCommitmentHash, objectHash);
  }

  loadIndexedObjectHash(commitmentHash) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);

    if (this.commitmentIndex.has(normalizedCommitmentHash)) {
      return this.commitmentIndex.get(normalizedCommitmentHash);
    }

    const indexFilePath = this.getCommitmentIndexFilePath(normalizedCommitmentHash);

    if (!fs.existsSync(indexFilePath)) {
      return null;
    }

    const parsed = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));

    if (parsed.commitmentHash !== normalizedCommitmentHash) {
      throw new Error('PQ commitment index file is inconsistent');
    }

    this.commitmentIndex.set(normalizedCommitmentHash, parsed.objectHash);
    return parsed.objectHash;
  }

  normalizeCommitmentHash(hash) {
    if (hash === null) {
      return null;
    }

    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) {
      throw new Error('PQ commitment hash must be a 64-character hex string');
    }

    return hash.toLowerCase();
  }

  normalizePQObject(pqObject = {}) {
    return cloneSerializable({
      algorithm: pqObject.algorithm || this.defaultAlgorithm,
      metadata: pqObject.metadata || {},
      payloadHash: pqObject.payloadHash || null,
      publicKey: pqObject.publicKey || null,
      signatureData: pqObject.signatureData || null
    });
  }

  createCommitmentMaterial(pqObject) {
    const normalizedObject = this.normalizePQObject(pqObject);

    return {
      algorithm: normalizedObject.algorithm,
      metadata: normalizedObject.metadata,
      payloadHash: normalizedObject.payloadHash,
      publicKey: normalizedObject.publicKey,
      signatureData: normalizedObject.signatureData
    };
  }

  createCommitmentHash(pqObject) {
    return this.cryptoProvider.hash(this.createCommitmentMaterial(pqObject));
  }

  storePQObject(pqObject = {}) {
    const normalizedObject = this.normalizePQObject(pqObject);
    const commitmentHash = this.createCommitmentHash(normalizedObject);
    const stored = this.contentAddressedObjectStore.storeImmutableObject(normalizedObject, {
      kind: 'pq-object',
      metadata: {
        algorithm: normalizedObject.algorithm,
        commitmentHash,
        role: 'post-quantum-object'
      },
      namespace: this.namespace
    });

    this.persistCommitmentIndex(commitmentHash, stored.hash);

    return Object.freeze({
      algorithm: normalizedObject.algorithm,
      commitmentHash,
      objectHash: stored.hash
    });
  }

  importPQObjectPayload(pqObject = {}) {
    return this.storePQObject(pqObject);
  }

  importPQObject({ commitmentHash, objectHash } = {}) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);

    if (typeof objectHash !== 'string' || objectHash.length === 0) {
      throw new Error('PQ object hash is required');
    }

    if (!this.validatePQObject(normalizedCommitmentHash, objectHash)) {
      throw new Error('PQ object import failed commitment validation');
    }

    this.persistCommitmentIndex(normalizedCommitmentHash, objectHash);

    return Object.freeze({
      commitmentHash: normalizedCommitmentHash,
      objectHash
    });
  }

  getPQObject(objectHash) {
    const stored = this.contentAddressedObjectStore.getImmutableObject(objectHash, {
      namespace: this.namespace
    });

    if (!stored) {
      return null;
    }

    return cloneSerializable({
      commitmentHash: this.createCommitmentHash(stored.value),
      objectHash: stored.hash,
      value: stored.value
    });
  }

  validatePQObject(commitmentHash, objectHash) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);
    const pqObject = this.getPQObject(objectHash);

    if (!pqObject) {
      return false;
    }

    return pqObject.commitmentHash === normalizedCommitmentHash;
  }

  getPQObjectByCommitmentHash(commitmentHash) {
    const normalizedCommitmentHash = this.normalizeCommitmentHash(commitmentHash);
    const indexedObjectHash = this.loadIndexedObjectHash(normalizedCommitmentHash);

    if (!indexedObjectHash) {
      return null;
    }

    return this.getPQObject(indexedObjectHash);
  }

  hasPQObjectByCommitmentHash(commitmentHash) {
    return Boolean(this.getPQObjectByCommitmentHash(commitmentHash));
  }

  generatePqRoot(commitmentHashes = []) {
    const normalizedCommitments = commitmentHashes.map((hash) => this.normalizeCommitmentHash(hash));

    if (normalizedCommitments.length === 0) {
      return this.cryptoProvider.hash([]);
    }

    let layer = normalizedCommitments.map((hash) => this.cryptoProvider.hash({
      pqCommitmentHash: hash
    }));

    while (layer.length > 1) {
      const nextLayer = [];

      for (let index = 0; index < layer.length; index += 2) {
        const left = layer[index];
        const right = layer[index + 1] ?? left;

        nextLayer.push(this.cryptoProvider.hash({ left, right }));
      }

      layer = nextLayer;
    }

    return layer[0];
  }
}

module.exports = {
  PostQuantumObjectStore
};
