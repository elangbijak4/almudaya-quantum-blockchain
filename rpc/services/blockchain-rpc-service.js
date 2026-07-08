'use strict';

const { Transaction } = require('../../core');
const { cloneSerializable } = require('../../utils');

class BlockchainRpcService {
  constructor({
    blockchain,
    contractCompiler = null,
    contentAddressedObjectStore = null,
    vm = null,
    worldStateManager = null,
    ethereumChainId = 1337,
    clientVersion = 'modular-blockchain-prototype/0.1.0',
    walletManager = null,
    managedAccounts = []
  } = {}) {
    this.blockchain = blockchain;
    this.contractCompiler = contractCompiler;
    this.contentAddressedObjectStore = contentAddressedObjectStore;
    this.vm = vm;
    this.worldStateManager = worldStateManager || blockchain?.worldStateManager || null;
    this.ethereumChainId = ethereumChainId;
    this.clientVersion = clientVersion;
    this.walletManager = walletManager || blockchain?.walletManager || null;
    this.managedAccounts = Array.isArray(managedAccounts) ? managedAccounts.map((account) => cloneSerializable(account)) : [];
  }

  assertBlockchain() {
    if (!this.blockchain) {
      throw new Error('BlockchainRpcService requires a blockchain instance');
    }
  }

  assertContractRuntime() {
    if (!this.contractCompiler || !this.contentAddressedObjectStore || !this.vm || !this.worldStateManager) {
      throw new Error('Contract runtime requires compiler, content store, VM, and world state manager');
    }
  }

  registerMethods(transport) {
    transport.registerMethod('sendTransaction', (params) => this.sendTransaction(params));
    transport.registerMethod('getBalance', (params) => this.getBalance(params));
    transport.registerMethod('deployContract', (params) => this.deployContract(params));
    transport.registerMethod('callContract', (params) => this.callContract(params));
    transport.registerMethod('getBlock', (params) => this.getBlock(params));
    transport.registerMethod('getStateRoot', () => this.getStateRoot());
    transport.registerMethod('web3_clientVersion', () => this.web3ClientVersion());
    transport.registerMethod('net_version', () => this.netVersion());
    transport.registerMethod('eth_chainId', () => this.ethChainId());
    transport.registerMethod('eth_blockNumber', () => this.ethBlockNumber());
    transport.registerMethod('eth_getBalance', (params) => this.ethGetBalance(params));
    transport.registerMethod('eth_getBlockByNumber', (params) => this.ethGetBlockByNumber(params));
    transport.registerMethod('eth_getBlockByHash', (params) => this.ethGetBlockByHash(params));
    transport.registerMethod('eth_getTransactionCount', (params) => this.ethGetTransactionCount(params));
    transport.registerMethod('eth_getCode', (params) => this.ethGetCode(params));
    transport.registerMethod('eth_getStorageAt', (params) => this.ethGetStorageAt(params));
    transport.registerMethod('eth_call', (params) => this.ethCall(params));
    transport.registerMethod('eth_estimateGas', (params) => this.ethEstimateGas(params));
    transport.registerMethod('eth_sendTransaction', (params) => this.ethSendTransaction(params));
    transport.registerMethod('eth_sendRawTransaction', (params) => this.ethSendRawTransaction(params));
    transport.registerMethod('eth_gasPrice', () => this.ethGasPrice());
    transport.registerMethod('eth_accounts', () => this.ethAccounts());
    transport.registerMethod('eth_coinbase', () => this.ethCoinbase());
    transport.registerMethod('eth_mining', () => this.ethMining());
    transport.registerMethod('eth_syncing', () => this.ethSyncing());
    transport.registerMethod('getContractStorage', (params) => this.getContractStorage(params));
    transport.registerMethod('getPendingTransactions', () => this.getPendingTransactions());
    transport.registerMethod('minePendingTransactions', (params) => this.minePendingTransactions(params));
    transport.registerMethod('getChainOverview', () => this.getChainOverview());
  }

  sendTransaction(params = {}) {
    this.assertBlockchain();

    const transaction = Transaction.from(params.transaction || params);
    const accepted = this.blockchain.addTransaction(transaction);

    return cloneSerializable({
      accepted: true,
      pendingCount: this.blockchain.pendingTransactions.length,
      transactionHash: accepted.hash(this.blockchain.cryptoProvider)
    });
  }

  getBalance({ address } = {}) {
    this.assertBlockchain();

    if (typeof address !== 'string' || address.length === 0) {
      throw new Error('Address is required');
    }

    return cloneSerializable({
      address,
      balance: this.blockchain.getBalance(address)
    });
  }

  deployContract({
    source,
    metadata = {},
    contractAddress = null
  } = {}) {
    this.assertBlockchain();
    this.assertContractRuntime();

    if (typeof source !== 'string' || source.trim().length === 0) {
      throw new Error('Contract source is required');
    }

    const artifact = this.contractCompiler.compile(source);
    const runtimeStorage = this.normalizeContractStorage(artifact.bytecode.initialState);
    const deployedAddress = contractAddress || this.deriveContractAddress({
      contractName: artifact.contractName,
      source
    });
    const stored = this.contentAddressedObjectStore.storeContract({
      bytecode: artifact.bytecode,
      metadata: {
        ...metadata,
        contractName: artifact.contractName,
        sourceHash: this.blockchain.cryptoProvider.hash({ source })
      },
      name: artifact.contractName,
      storage: runtimeStorage
    });

    this.worldStateManager.replaceContractStorageSnapshot(deployedAddress, runtimeStorage);

    return cloneSerializable({
      address: deployedAddress,
      contractAddress: deployedAddress,
      codeHash: stored.codeHash,
      contractName: artifact.contractName,
      contractRoot: stored.contractRoot,
      initialStorage: runtimeStorage,
      storageHash: stored.storageHash
    });
  }

  callContract({
    contractAddress,
    contractRoot,
    functionName,
    args = {},
    gasLimit = 1000,
    callerAddress = null
  } = {}) {
    this.assertContractRuntime();

    if (typeof contractAddress !== 'string' || contractAddress.length === 0) {
      throw new Error('Contract address is required');
    }

    if (typeof contractRoot !== 'string' || contractRoot.length === 0) {
      throw new Error('Contract root is required');
    }

    if (typeof functionName !== 'string' || functionName.length === 0) {
      throw new Error('Function name is required');
    }

    const runtime = this.contentAddressedObjectStore.getContractRuntimeByRoot(contractRoot);

    if (!runtime?.bytecode?.functions?.[functionName]) {
      throw new Error(`Contract function not found: ${functionName}`);
    }

    const execution = this.vm.executeContractFunction({
      args,
      artifact: {
        bytecode: runtime.bytecode,
        contractName: runtime.descriptor?.name ?? null
      },
      callerAddress,
      contractAddress,
      functionName,
      gasLimit,
      worldStateManager: this.worldStateManager
    });

    const { storageHash } = this.contentAddressedObjectStore.generateStorageRoot(execution.storage, {
      namespace: 'contracts'
    });

    return cloneSerializable({
      contractAddress,
      contractRoot,
      codeHash: runtime.codeHash,
      functionName,
      gasLimit,
      gasUsed: execution.gasUsed,
      returnValue: execution.returnValue,
      stateRoot: execution.stateRoot,
      storageHash
    });
  }

  getBlock({ index = null, hash = null } = {}) {
    this.assertBlockchain();

    let block = null;

    if (Number.isInteger(index)) {
      block = this.blockchain.chain[index] ?? null;
    } else if (typeof hash === 'string' && hash.length > 0) {
      block = this.blockchain.chain.find((candidate) => candidate.hash === hash) ?? null;
    } else {
      block = this.blockchain.getLatestBlock();
    }

    if (!block) {
      throw new Error('Block not found');
    }

    return block.toJSON();
  }

  getStateRoot() {
    this.assertBlockchain();

    const stateRoot = this.worldStateManager
      ? this.worldStateManager.getStateRoot()
      : this.blockchain.exportCurrentState().stateRoot;

    return cloneSerializable({
      stateRoot
    });
  }

  web3ClientVersion() {
    return this.clientVersion;
  }

  netVersion() {
    return String(this.ethereumChainId);
  }

  ethChainId() {
    return this.toHexQuantity(this.ethereumChainId);
  }

  ethBlockNumber() {
    this.assertBlockchain();
    return this.toHexQuantity(this.blockchain.getLatestBlock().index);
  }

  ethGetBalance(params = []) {
    this.assertBlockchain();
    const [address] = this.getRpcParams(params, ['address']);
    const balance = this.blockchain.getBalance(address);
    return this.toHexQuantity(balance);
  }

  ethGetBlockByNumber(params = []) {
    this.assertBlockchain();
    const [blockTag, fullTransactions = false] = this.getRpcParams(params, ['blockTag', 'fullTransactions']);
    const block = this.resolveBlockFromTag(blockTag);
    return block ? this.formatEthereumBlock(block, Boolean(fullTransactions)) : null;
  }

  ethGetBlockByHash(params = []) {
    this.assertBlockchain();
    const [hash, fullTransactions = false] = this.getRpcParams(params, ['hash', 'fullTransactions']);
    const block = this.blockchain.chain.find((candidate) => candidate.hash === hash) ?? null;
    return block ? this.formatEthereumBlock(block, Boolean(fullTransactions)) : null;
  }

  ethGetTransactionCount(params = []) {
    this.assertBlockchain();
    const [address] = this.getRpcParams(params, ['address']);
    const account = this.worldStateManager?.getAccount(address);
    return this.toHexQuantity(account?.nonce ?? 0);
  }

  ethGetCode(params = []) {
    this.assertContractRuntime();
    const [address] = this.getRpcParams(params, ['address']);
    const account = this.worldStateManager?.getAccount(address);

    if (!account || Object.keys(account.storage || {}).length === 0) {
      return '0x';
    }

    return this.encodeHexString(JSON.stringify({
      storageKeys: Object.keys(account.storage || {}).sort()
    }));
  }

  ethGetStorageAt(params = []) {
    this.assertContractRuntime();
    const [address, position] = this.getRpcParams(params, ['address', 'position']);
    const key = this.normalizeStoragePosition(position);
    const value = this.worldStateManager.getStorageAt(address, key);
    return this.encodeStorageValue(value);
  }

  ethCall(params = []) {
    this.assertContractRuntime();
    const [callRequest] = this.getRpcParams(params, ['callRequest']);
    const decoded = this.decodeEthereumCallRequest(callRequest);
    const execution = this.executeContractReadOnly(decoded);
    return this.encodeContractResult(execution.returnValue);
  }

  ethEstimateGas(params = []) {
    this.assertContractRuntime();
    const [callRequest] = this.getRpcParams(params, ['callRequest']);
    const decoded = this.decodeEthereumCallRequest(callRequest);
    const execution = this.executeContractReadOnly(decoded);
    return this.toHexQuantity(execution.gasUsed);
  }

  ethGasPrice() {
    return this.toHexQuantity(0);
  }

  ethAccounts() {
    return this.managedAccounts.map((account) => this.normalizeHexAddress(account.address));
  }

  ethCoinbase() {
    this.assertBlockchain();
    return this.normalizeHexAddress(this.blockchain.genesisAddress);
  }

  ethMining() {
    return false;
  }

  ethSyncing() {
    return false;
  }

  ethSendTransaction(params = []) {
    this.assertBlockchain();

    if (!this.walletManager) {
      throw new Error('Wallet manager is required for eth_sendTransaction');
    }

    const [transactionRequest] = this.getRpcParams(params, ['transactionRequest']);

    if (!transactionRequest || typeof transactionRequest !== 'object') {
      throw new Error('eth_sendTransaction requires a transaction object');
    }

    const fromAddress = transactionRequest.from;
    const toAddress = transactionRequest.to;
    const account = this.resolveManagedAccount(fromAddress);
    const transactionPayload = {
      amount: this.normalizeValueField(transactionRequest.value),
      fromAddress: account.address,
      nonce: this.blockchain.getExpectedPendingNonce(account.address),
      timestamp: this.blockchain.getLatestBlock().timestamp + this.blockchain.pendingTransactions.length + 1,
      toAddress,
      type: 'transfer'
    };
    const signed = this.walletManager.signTransaction(transactionPayload, account);
    const accepted = this.blockchain.addTransaction(Transaction.from({
      ...transactionPayload,
      algorithm: signed.algorithm,
      addressMetadata: signed.addressMetadata,
      publicKey: signed.publicKey,
      signature: signed.signature
    }));

    return this.ensure0x(accepted.hash(this.blockchain.cryptoProvider));
  }

  ethSendRawTransaction(params = []) {
    this.assertBlockchain();
    
    const [rawTransaction] = this.getRpcParams(params, ['rawTransaction']);
    if (!rawTransaction || typeof rawTransaction !== 'string') {
      throw new Error('eth_sendRawTransaction requires a raw transaction hex string');
    }

    const { ethers } = require('ethers');
    const tx = ethers.Transaction.from(rawTransaction);
    
    const transactionPayload = {
      amount: Number(tx.value) || 0,
      fromAddress: tx.from.toLowerCase(),
      nonce: tx.nonce,
      timestamp: this.blockchain.getLatestBlock().timestamp + this.blockchain.pendingTransactions.length + 1,
      toAddress: tx.to ? tx.to.toLowerCase() : null,
      type: 'transfer'
    };

    const accepted = this.blockchain.addTransaction(Transaction.from({
      ...transactionPayload,
      algorithm: 'ethereum-rlp',
      addressMetadata: { algorithm: 'secp256k1' },
      publicKey: tx.fromPublicKey,
      signature: {
        algorithm: 'ethereum-rlp',
        encoding: 'hex',
        value: tx.signature.serialized,
        unsignedHash: tx.unsignedHash
      }
    }));

    return this.ensure0x(accepted.hash(this.blockchain.cryptoProvider));
  }

  getContractStorage({ contractAddress } = {}) {
    this.assertContractRuntime();

    if (typeof contractAddress !== 'string' || contractAddress.length === 0) {
      throw new Error('Contract address is required');
    }

    return cloneSerializable({
      contractAddress,
      storage: this.worldStateManager.getContractStorageSnapshot(contractAddress)
    });
  }

  getPendingTransactions() {
    this.assertBlockchain();

    return this.blockchain.pendingTransactions.map((transaction) => cloneSerializable(transaction.toJSON()));
  }

  minePendingTransactions({ minerAddress = null } = {}) {
    this.assertBlockchain();

    const effectiveMinerAddress = minerAddress || this.managedAccounts[0]?.address || this.blockchain.genesisAddress;
    const block = this.blockchain.minePendingTransactions(effectiveMinerAddress);

    return cloneSerializable({
      block: block.toJSON(),
      pendingCount: this.blockchain.pendingTransactions.length
    });
  }

  getChainOverview() {
    this.assertBlockchain();

    const latestBlock = this.blockchain.getLatestBlock();

    return cloneSerializable({
      chainId: this.blockchain.chainId,
      genesisAddress: this.blockchain.genesisAddress,
      latestBlock: latestBlock.toJSON(),
      managedAccounts: this.managedAccounts.map((account) => ({
        address: account.address,
        balance: this.blockchain.getBalance(account.address)
      })),
      pendingCount: this.blockchain.pendingTransactions.length
    });
  }

  deriveContractAddress(input) {
    const digest = this.blockchain.cryptoProvider.hash(input);
    return `0x${digest.slice(-40)}`;
  }

  normalizeContractStorage(initialState = {}) {
    const storage = {};

    for (const [key, value] of Object.entries(initialState)) {
      if (key.startsWith('state.')) {
        storage[key.slice('state.'.length)] = cloneSerializable(value);
      }
    }

    return storage;
  }

  decodeEthereumCallRequest(callRequest = {}) {
    if (!callRequest || typeof callRequest !== 'object') {
      throw new Error('eth_call requires a call object');
    }

    const payload = this.decodeHexJson(callRequest.data);

    if (typeof callRequest.to !== 'string' || callRequest.to.length === 0) {
      throw new Error('eth_call requires a target contract address in "to"');
    }

    if (typeof payload.contractRoot !== 'string' || payload.contractRoot.length === 0) {
      throw new Error('eth_call payload must include contractRoot');
    }

    if (typeof payload.functionName !== 'string' || payload.functionName.length === 0) {
      throw new Error('eth_call payload must include functionName');
    }

    return {
      args: payload.args || {},
      callerAddress: callRequest.from || null,
      contractAddress: callRequest.to,
      contractRoot: payload.contractRoot,
      functionName: payload.functionName,
      gasLimit: this.normalizeGasLimit(callRequest.gas)
    };
  }

  executeContractReadOnly({
    contractAddress,
    contractRoot,
    functionName,
    args = {},
    gasLimit = 1000,
    callerAddress = null
  } = {}) {
    const runtime = this.contentAddressedObjectStore.getContractRuntimeByRoot(contractRoot);

    if (!runtime?.bytecode?.functions?.[functionName]) {
      throw new Error(`Contract function not found: ${functionName}`);
    }

    const functionArtifact = runtime.bytecode.functions[functionName];
    const memory = this.vm.buildContractMemory({
      args,
      contractAddress,
      functionArtifact,
      initialState: runtime.bytecode.initialState,
      worldStateManager: this.worldStateManager
    });
    const result = this.vm.execute(functionArtifact.instructions, {
      gasLimit,
      memory,
      metadata: {
        callerAddress,
        contractAddress,
        functionName,
        readOnly: true
      },
      stack: []
    });

    return cloneSerializable({
      gasUsed: result.gasUsed,
      memory: result.memory,
      returnValue: result.returnValue,
      storage: this.vm.extractContractStorage(result.memory)
    });
  }

  getRpcParams(params, keys = []) {
    if (Array.isArray(params)) {
      return params;
    }

    if (!params || typeof params !== 'object') {
      return [];
    }

    return keys.map((key) => params[key]);
  }

  resolveBlockFromTag(blockTag) {
    if (blockTag === 'latest' || typeof blockTag === 'undefined' || blockTag === null) {
      return this.blockchain.getLatestBlock();
    }

    if (blockTag === 'earliest') {
      return this.blockchain.chain[0] ?? null;
    }

    if (blockTag === 'pending') {
      return this.blockchain.getLatestBlock();
    }

    if (typeof blockTag === 'string' && blockTag.startsWith('0x')) {
      const index = Number.parseInt(blockTag.slice(2), 16);
      return Number.isInteger(index) ? this.blockchain.chain[index] ?? null : null;
    }

    if (Number.isInteger(blockTag)) {
      return this.blockchain.chain[blockTag] ?? null;
    }

    return null;
  }

  formatEthereumBlock(blockInput, fullTransactions = false) {
    const block = cloneSerializable(blockInput.toJSON ? blockInput.toJSON() : blockInput);
    const transactions = fullTransactions
      ? block.transactions.map((transaction, index) => this.formatEthereumTransaction(block, transaction, index))
      : block.transactions.map((transaction) => this.blockchain.cryptoProvider.hash(transaction));

    return {
      number: this.toHexQuantity(block.index),
      hash: this.ensure0x(block.hash),
      parentHash: this.ensure0x(block.previousHash),
      nonce: this.toFixedHexQuantity(block.nonce, 8),
      sha3Uncles: this.ensure0x(this.blockchain.cryptoProvider.hash([])),
      logsBloom: `0x${'0'.repeat(512)}`,
      transactionsRoot: this.ensure0x(block.merkleRoot),
      stateRoot: this.ensure0x(block.stateRoot),
      receiptsRoot: this.ensure0x(this.blockchain.cryptoProvider.hash({
        blockHash: block.hash,
        type: 'receipts'
      })),
      miner: this.normalizeHexAddress(block.minerAddress),
      difficulty: this.toHexQuantity(block.difficulty),
      totalDifficulty: this.toHexQuantity((block.index + 1) * block.difficulty),
      extraData: '0x',
      size: this.toHexQuantity(this.estimateBlockSize(block)),
      gasLimit: this.toHexQuantity(30000000),
      gasUsed: this.toHexQuantity(0),
      timestamp: this.toHexQuantity(block.timestamp),
      transactions,
      uncles: []
    };
  }

  formatEthereumTransaction(block, transaction, index) {
    const transactionHash = this.blockchain.cryptoProvider.hash(transaction);

    return {
      blockHash: this.ensure0x(block.hash),
      blockNumber: this.toHexQuantity(block.index),
      from: this.normalizeHexAddress(transaction.fromAddress),
      gas: this.toHexQuantity(21000),
      gasPrice: this.toHexQuantity(0),
      hash: this.ensure0x(transactionHash),
      input: '0x',
      nonce: this.toHexQuantity(transaction.nonce),
      to: this.normalizeHexAddress(transaction.toAddress),
      transactionIndex: this.toHexQuantity(index),
      value: this.toHexQuantity(transaction.amount),
      v: '0x0',
      r: '0x0',
      s: '0x0'
    };
  }

  estimateBlockSize(block) {
    return Buffer.byteLength(JSON.stringify(block), 'utf8');
  }

  normalizeGasLimit(gas) {
    if (typeof gas === 'string' && gas.startsWith('0x')) {
      const parsed = Number.parseInt(gas.slice(2), 16);
      return Number.isFinite(parsed) ? parsed : 1000;
    }

    if (Number.isFinite(gas)) {
      return Math.max(1, Math.trunc(gas));
    }

    return 1000;
  }

  normalizeValueField(value) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      const parsed = Number.parseInt(value.slice(2), 16);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (Number.isFinite(value)) {
      return Math.max(0, Math.trunc(value));
    }

    return 0;
  }

  toHexQuantity(value) {
    const normalized = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    return `0x${normalized.toString(16)}`;
  }

  toFixedHexQuantity(value, byteLength) {
    const normalized = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    return `0x${normalized.toString(16).padStart(byteLength * 2, '0')}`;
  }

  ensure0x(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return '0x0';
    }

    return value.startsWith('0x') ? value : `0x${value}`;
  }

  encodeHexString(value) {
    return `0x${Buffer.from(String(value), 'utf8').toString('hex')}`;
  }

  decodeHexJson(hexValue) {
    if (typeof hexValue !== 'string' || !hexValue.startsWith('0x')) {
      throw new Error('Call data must be a hex string starting with 0x');
    }

    const json = Buffer.from(hexValue.slice(2), 'hex').toString('utf8').trim();

    if (json.length === 0) {
      return {};
    }

    return JSON.parse(json);
  }

  encodeContractResult(value) {
    if (value === null || typeof value === 'undefined') {
      return '0x';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return this.toHexQuantity(value);
    }

    return this.encodeHexString(JSON.stringify(value));
  }

  normalizeStoragePosition(position) {
    if (typeof position === 'string' && position.startsWith('0x')) {
      return Buffer.from(position.slice(2), 'hex').toString('utf8').replace(/\0+$/u, '');
    }

    if (typeof position === 'string' && position.length > 0) {
      return position;
    }

    throw new Error('Storage position must be a non-empty string');
  }

  encodeStorageValue(value) {
    if (value === null || typeof value === 'undefined') {
      return '0x';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return this.toHexQuantity(value);
    }

    if (typeof value === 'string') {
      return this.encodeHexString(value);
    }

    return this.encodeHexString(JSON.stringify(value));
  }

  normalizeHexAddress(address) {
    if (typeof address !== 'string' || address.length === 0) {
      return null;
    }

    if (/^0x[a-f0-9]{40}$/i.test(address)) {
      return address.toLowerCase();
    }

    const digest = this.blockchain.cryptoProvider.hash({
      namespace: 'address-proxy',
      value: address
    });

    return `0x${digest.slice(-40)}`;
  }

  resolveManagedAccount(address) {
    if (typeof address !== 'string' || address.length === 0) {
      throw new Error('Transaction "from" address is required');
    }

    const account = this.managedAccounts.find((candidate) => candidate.address.toLowerCase() === address.toLowerCase());

    if (!account) {
      throw new Error('eth_sendTransaction currently only supports node-managed accounts returned by eth_accounts');
    }

    return account;
  }
}

module.exports = {
  BlockchainRpcService
};
