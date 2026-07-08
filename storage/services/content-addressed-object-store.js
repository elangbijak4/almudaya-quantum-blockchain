'use strict';

const fs = require('fs');
const path = require('path');
const { CryptoProvider } = require('../../crypto');
const { cloneSerializable, stableSerialize } = require('../../utils');

class ContentAddressedObjectStore {
  constructor({
    basePath,
    contractsPath,
    cryptoProvider = new CryptoProvider()
  } = {}) {
    this.basePath = basePath || path.join(process.cwd(), 'storage', 'objects');
    this.contractsPath = contractsPath || path.join(process.cwd(), 'storage', 'contracts');
    this.cryptoProvider = cryptoProvider;
  }

  ensureDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  normalizeHash(hash) {
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) {
      throw new Error('Content-addressed object hash must be a 64-character hex string');
    }

    return hash.toLowerCase();
  }

  createObjectPayload(object, {
    kind = 'blob',
    namespace = 'objects',
    metadata = {}
  } = {}) {
    return {
      kind,
      metadata: cloneSerializable(metadata),
      namespace,
      value: cloneSerializable(object)
    };
  }

  normalizeObjectPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Immutable object payload must be an object');
    }

    if (typeof payload.kind !== 'string' || payload.kind.length === 0) {
      throw new Error('Immutable object payload must include a kind');
    }

    if (typeof payload.namespace !== 'string' || payload.namespace.length === 0) {
      throw new Error('Immutable object payload must include a namespace');
    }

    return {
      kind: payload.kind,
      metadata: cloneSerializable(payload.metadata || {}),
      namespace: payload.namespace,
      value: cloneSerializable(payload.value)
    };
  }

  hashObjectPayload(payload) {
    return this.cryptoProvider.hash(this.normalizeObjectPayload(payload));
  }

  getHashedPath(hash, namespace = 'objects') {
    const normalizedHash = this.normalizeHash(hash);
    const rootPath = namespace === 'contracts' ? this.contractsPath : this.basePath;

    return path.join(rootPath, normalizedHash.slice(0, 2), normalizedHash.slice(2, 4), normalizedHash);
  }

  writeImmutablePayload(hash, payload, namespace = 'objects') {
    const objectPath = this.getHashedPath(hash, namespace);
    this.ensureDirectory(path.dirname(objectPath));

    if (!fs.existsSync(objectPath)) {
      fs.writeFileSync(objectPath, stableSerialize(payload));
    }

    return objectPath;
  }

  storeImmutableObject(object, options = {}) {
    const payload = this.createObjectPayload(object, options);
    const hash = this.hashObjectPayload(payload);
    const objectPath = this.writeImmutablePayload(hash, payload, options.namespace);

    return Object.freeze({
      hash,
      kind: payload.kind,
      namespace: payload.namespace,
      path: objectPath
    });
  }

  getImmutableObject(hash, { namespace = 'objects' } = {}) {
    const objectPath = this.getHashedPath(hash, namespace);

    if (!fs.existsSync(objectPath)) {
      return null;
    }

    const parsed = this.normalizeObjectPayload(JSON.parse(fs.readFileSync(objectPath, 'utf8')));
    const computedHash = this.hashObjectPayload(parsed);

    if (computedHash !== this.normalizeHash(hash)) {
      throw new Error('Immutable object payload does not match requested hash');
    }

    if (parsed.namespace !== namespace) {
      throw new Error('Immutable object namespace does not match requested namespace');
    }

    return cloneSerializable({
      hash: this.normalizeHash(hash),
      kind: parsed.kind,
      metadata: parsed.metadata,
      namespace: parsed.namespace,
      value: parsed.value
    });
  }

  compareEntryNames(left, right) {
    if (left === right) {
      return 0;
    }

    return left < right ? -1 : 1;
  }

  buildDirectoryEntries(entries) {
    return entries
      .map((entry) => {
        if (typeof entry?.name !== 'string' || entry.name.length === 0) {
          throw new Error('Directory entry name is required');
        }

        if (typeof entry?.kind !== 'string' || entry.kind.length === 0) {
          throw new Error('Directory entry kind is required');
        }

        return cloneSerializable({
          hash: this.normalizeHash(entry.hash),
          kind: entry.kind,
          name: entry.name
        });
      })
      .sort((left, right) => this.compareEntryNames(left.name, right.name));
  }

  storeDirectory(entries, metadata = {}, namespace = 'objects') {
    return this.storeImmutableObject({
      entries: this.buildDirectoryEntries(entries)
    }, {
      kind: 'tree',
      metadata,
      namespace
    });
  }

  storeStorageNode(nodeValue, keyHint, namespace = 'contracts') {
    if (nodeValue && typeof nodeValue === 'object' && !Array.isArray(nodeValue)) {
      const childEntries = [];

      for (const childKey of Object.keys(nodeValue).sort()) {
        const childNode = this.storeStorageNode(nodeValue[childKey], childKey, namespace);

        childEntries.push({
          hash: childNode.hash,
          kind: childNode.kind,
          name: childKey
        });
      }

      return this.storeDirectory(childEntries, {
        keyHint,
        role: 'storage-tree'
      }, namespace);
    }

    return this.storeImmutableObject(nodeValue, {
      kind: 'blob',
      metadata: {
        keyHint,
        role: 'storage-blob'
      },
      namespace
    });
  }

  generateStorageRoot(storageState = {}, { namespace = 'contracts' } = {}) {
    const normalizedStorageState = cloneSerializable(storageState);
    const rootNode = this.storeStorageNode(normalizedStorageState, 'root', namespace);

    return Object.freeze({
      namespace,
      storageHash: rootNode.hash
    });
  }

  createContractDescriptor({
    name = null,
    codeHash,
    storageHash,
    metadata = {},
    abi = null
  }) {
    return {
      abi: abi === null ? null : cloneSerializable(abi),
      codeHash,
      metadata: cloneSerializable(metadata),
      name,
      storageHash,
      version: 1
    };
  }

  createContractRoot({ codeHash, descriptorHash, storageHash }) {
    const contractTree = this.storeDirectory([
      {
        hash: codeHash,
        kind: 'blob',
        name: 'code'
      },
      {
        hash: descriptorHash,
        kind: 'blob',
        name: 'descriptor'
      },
      {
        hash: storageHash,
        kind: 'tree',
        name: 'storage'
      }
    ], {
      role: 'contract-root'
    }, 'contracts');

    return contractTree.hash;
  }

  storeContract({
    name = null,
    bytecode,
    storage = {},
    metadata = {},
    abi = null
  } = {}) {
    if (bytecode === null || typeof bytecode === 'undefined') {
      throw new Error('Contract bytecode is required');
    }

    const codeObject = this.storeImmutableObject({
      bytecode
    }, {
      kind: 'blob',
      metadata: {
        role: 'contract-code'
      },
      namespace: 'contracts'
    });
    const { storageHash } = this.generateStorageRoot(storage, {
      namespace: 'contracts'
    });
    const descriptor = this.createContractDescriptor({
      abi,
      codeHash: codeObject.hash,
      metadata,
      name,
      storageHash
    });
    const descriptorObject = this.storeImmutableObject(descriptor, {
      kind: 'blob',
      metadata: {
        role: 'contract-descriptor'
      },
      namespace: 'contracts'
    });
    const contractRoot = this.createContractRoot({
      codeHash: codeObject.hash,
      descriptorHash: descriptorObject.hash,
      storageHash
    });

    return Object.freeze({
      codeHash: codeObject.hash,
      contractRoot,
      storageHash
    });
  }

  getContractByRoot(contractRoot) {
    const rootObject = this.getImmutableObject(contractRoot, {
      namespace: 'contracts'
    });

    if (!rootObject || rootObject.kind !== 'tree') {
      return null;
    }

    const entries = rootObject.value.entries || [];
    const entryMap = {};

    for (const entry of entries) {
      if (entryMap[entry.name]) {
        throw new Error('Contract root contains duplicate directory entries');
      }

      entryMap[entry.name] = entry;
    }

    const descriptorObject = entryMap.descriptor
      ? this.getImmutableObject(entryMap.descriptor.hash, { namespace: 'contracts' })
      : null;
    const descriptor = descriptorObject?.value ?? null;

    if (descriptor) {
      if (descriptor.codeHash !== entryMap.code?.hash) {
        throw new Error('Contract descriptor codeHash does not match contract root');
      }

      if (descriptor.storageHash !== entryMap.storage?.hash) {
        throw new Error('Contract descriptor storageHash does not match contract root');
      }
    }

    return cloneSerializable({
      codeHash: entryMap.code?.hash ?? null,
      contractRoot: this.normalizeHash(contractRoot),
      descriptor,
      storageHash: entryMap.storage?.hash ?? null
    });
  }

  getContractRuntimeByRoot(contractRoot) {
    const contract = this.getContractByRoot(contractRoot);

    if (!contract?.codeHash) {
      return null;
    }

    const codeObject = this.getImmutableObject(contract.codeHash, {
      namespace: 'contracts'
    });

    return cloneSerializable({
      ...contract,
      bytecode: codeObject?.value?.bytecode ?? null
    });
  }
}

module.exports = {
  ContentAddressedObjectStore
};
