'use strict';

const { cloneSerializable, createPlaceholderResult, stableSerialize } = require('../../utils');
const { WalletAccount } = require('../models/wallet-account');

class WalletManager {
  constructor({ walletRepository, signatureProvider, signatureProviders = {}, addressDeriver } = {}) {
    this.walletRepository = walletRepository;
    this.signatureProvider = signatureProvider;
    this.signatureProviders = this.buildProviderRegistry(signatureProvider, signatureProviders);
    this.addressDeriver = addressDeriver;
  }

  buildProviderRegistry(defaultProvider, signatureProviders) {
    const registry = {};

    if (defaultProvider?.algorithm) {
      registry[defaultProvider.algorithm] = defaultProvider;
    }

    for (const [algorithm, provider] of Object.entries(signatureProviders)) {
      if (provider) {
        registry[algorithm] = provider;
      }
    }

    return registry;
  }

  resolveSignatureProvider(algorithm) {
    if (algorithm) {
      const provider = this.signatureProviders[algorithm];

      if (!provider) {
        throw new Error(`Unsupported signature algorithm: ${algorithm}`);
      }

      return provider;
    }

    if (this.signatureProvider) {
      return this.signatureProvider;
    }

    const [firstProvider] = Object.values(this.signatureProviders);

    if (!firstProvider) {
      throw new Error('WalletManager requires at least one signatureProvider');
    }

    return firstProvider;
  }

  createAccount(metadata = {}) {
    if (!this.addressDeriver) {
      throw new Error('WalletManager requires an addressDeriver');
    }

    const signatureProvider = this.resolveSignatureProvider(metadata.algorithm);
    const keypair = signatureProvider.generateKeypair();
    const addressMetadata = {
      algorithm: keypair.algorithm,
      ...metadata
    };
    const address = this.addressDeriver.deriveAddress(keypair.publicKey, addressMetadata);
    const account = new WalletAccount({
      address,
      algorithm: keypair.algorithm,
      addressMetadata,
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey
    });

    if (this.walletRepository?.saveAccount) {
      this.walletRepository.saveAccount(account.toJSON());
    }

    return account;
  }

  generateWallet(metadata = {}) {
    return this.createAccount(metadata);
  }

  sign(payload, privateKey, algorithm) {
    const signatureProvider = this.resolveSignatureProvider(algorithm);
    return signatureProvider.sign(payload, privateKey);
  }

  verify(payload, signature, publicKey, algorithm) {
    try {
      const signatureProvider = this.resolveSignatureProvider(algorithm ?? signature?.algorithm);
      return signatureProvider.verify(payload, signature, publicKey);
    } catch (_error) {
      return false;
    }
  }

  signTransaction(transactionPayload, accountInput) {
    const account = WalletAccount.from(accountInput);
    const payload = cloneSerializable(transactionPayload);
    const signature = this.sign(payload, account.privateKey, account.algorithm);

    return createPlaceholderResult('wallet', {
      address: account.address,
      addressMetadata: account.addressMetadata,
      algorithm: account.algorithm,
      payload,
      publicKey: account.publicKey,
      signature
    });
  }

  createPostQuantumPlaceholder(payload, {
    algorithm = 'pq-placeholder',
    metadata = {},
    payloadHash = null,
    postQuantumObjectStore = null
  } = {}) {
    if (!postQuantumObjectStore) {
      throw new Error('Post-quantum object store is required');
    }

    const normalizedPayload = cloneSerializable(payload);
    const pqObject = {
      algorithm,
      metadata,
      payloadHash: payloadHash ?? stableSerialize(normalizedPayload),
      publicKey: null,
      signatureData: null
    };

    return postQuantumObjectStore.storePQObject(pqObject);
  }

  signTransactionHybrid(transactionPayload, accountInput, {
    postQuantumObjectStore = null,
    pqAlgorithm = 'pq-placeholder',
    pqMetadata = {}
  } = {}) {
    const signedTransaction = this.signTransaction(transactionPayload, accountInput);

    if (!postQuantumObjectStore) {
      return signedTransaction;
    }

    const pqObject = this.createPostQuantumPlaceholder(transactionPayload, {
      algorithm: pqAlgorithm,
      metadata: pqMetadata,
      postQuantumObjectStore
    });

    return createPlaceholderResult('wallet', {
      ...signedTransaction,
      pqAlgorithm,
      pqCommitmentHash: pqObject.commitmentHash,
      pqObjectHash: pqObject.objectHash
    });
  }

  verifyTransactionSignature(transactionPayload, signedTransaction) {
    const payload = cloneSerializable(transactionPayload);

    if (signedTransaction?.payload && stableSerialize(signedTransaction.payload) !== stableSerialize(payload)) {
      return false;
    }

    let derivedAddress;

    try {
      derivedAddress = this.deriveAddress(signedTransaction?.publicKey, {
        ...signedTransaction?.addressMetadata,
        algorithm: signedTransaction?.algorithm
      });
    } catch (_error) {
      return false;
    }

    if (derivedAddress !== signedTransaction?.address) {
      console.log('Address mismatch', derivedAddress, signedTransaction?.address);
      return false;
    }

    if (signedTransaction?.signature?.algorithm !== signedTransaction?.algorithm) {
      console.log('Algorithm mismatch', signedTransaction?.signature?.algorithm, signedTransaction?.algorithm);
      return false;
    }

    const verified = this.verify(
      payload,
      signedTransaction?.signature,
      signedTransaction?.publicKey,
      signedTransaction?.algorithm
    );
    if (!verified) console.log('Signature verification failed payload=', payload);
    return verified;
  }

  deriveAddress(publicKey, metadata = {}) {
    if (!this.addressDeriver) {
      throw new Error('WalletManager requires an addressDeriver');
    }

    return this.addressDeriver.deriveAddress(publicKey, metadata);
  }

  describeCapabilities() {
    return createPlaceholderResult('wallet', {
      hasRepository: Boolean(this.walletRepository),
      hasSignatureProvider: Object.keys(this.signatureProviders).length > 0,
      hasAddressDeriver: Boolean(this.addressDeriver),
      supportedAlgorithms: Object.keys(this.signatureProviders).sort()
    });
  }
}

module.exports = {
  WalletManager
};
