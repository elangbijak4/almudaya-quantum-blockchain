'use strict';

const fs = require('fs');
const path = require('path');
const { CryptoProvider } = require('../crypto');
const { Blockchain } = require('../core');
const { ContractCompiler, Tokenizer, Parser, BytecodeGenerator } = require('../contracts');
const { BlockchainRpcService, ExpressJsonRpcTransport, RpcServer } = require('./index');
const { ContentAddressedObjectStore } = require('../storage');
const { VirtualMachine } = require('../vm');
const { AddressDeriver, Secp256k1SignatureProvider, WalletManager } = require('../wallet');
const { JsonStateRepository, WorldStateManager } = require('../worldstate');
const awilix = require('awilix');

const { EthereumRlpSignatureProvider } = require('../wallet/services/ethereum-rlp-signature-provider');
const { ethers } = require('ethers');

function generateDemoAccounts(count = 20) {
  const wallet = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic.phrase;
  const accounts = [];
  
  const rootNode = ethers.HDNodeWallet.fromSeed(ethers.Mnemonic.fromPhrase(mnemonic).computeSeed());
  for (let i = 0; i < count; i++) {
    const derived = rootNode.derivePath(`m/44'/60'/0'/0/${i}`);
    accounts.push({
      address: derived.address.toLowerCase(),
      privateKey: derived.privateKey,
      publicKey: derived.publicKey,
      algorithm: 'secp256k1',
      addressMetadata: { algorithm: 'secp256k1' }
    });
  }

  return { mnemonic, accounts };
}

function createRpcServer({
  host = process.env.RPC_HOST || '127.0.0.1',
  port = Number.parseInt(process.env.RPC_PORT || '8545', 10),
  route = process.env.RPC_ROUTE || '/rpc',
  ethereumChainId = Number.parseInt(process.env.ETH_CHAIN_ID || '1337', 10),
  bridgeWalletFilePath = process.env.BRIDGE_WALLET_FILE
    || path.join(process.cwd(), 'wallet', 'db', 'bridge-wallet.json'),
  worldStateFilePath = process.env.WORLDSTATE_FILE
    || path.join(process.cwd(), 'worldstate', 'db', 'worldstate.json'),
  staticDirectory = path.join(process.cwd(), 'public')
} = {}) {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });

  const { mnemonic, accounts } = generateDemoAccounts(20);
  const bridgeAccount = accounts[0];

  container.register({
    // Configurations
    host: awilix.asValue(host),
    port: awilix.asValue(port),
    route: awilix.asValue(route),
    staticDirectory: awilix.asValue(staticDirectory),
    bodyLimit: awilix.asValue('1mb'),
    healthRoute: awilix.asValue('/health'),
    filePath: awilix.asValue(worldStateFilePath),
    genesisAddress: awilix.asValue(bridgeAccount.address),
    ethereumChainId: awilix.asValue(ethereumChainId),
    managedAccounts: awilix.asValue(accounts),
    prefundedAccounts: awilix.asValue(accounts.slice(1).map(a => a.address)),
    prefundAmount: awilix.asValue(10000),
    chainId: awilix.asValue('prototype-chain'),
    difficulty: awilix.asValue(2),
    miningReward: awilix.asValue(50),
    initialSupply: awilix.asValue(10000),
    postQuantumObjectStore: awilix.asValue(null),
    maxSteps: awilix.asValue(10000),
    walletRepository: awilix.asValue(null),
    signatureProviders: awilix.asValue({
      'ethereum-rlp': new EthereumRlpSignatureProvider()
    }),
    prefix: awilix.asValue('0x'),
    addressLength: awilix.asValue(40),
    basePath: awilix.asValue(path.join(process.cwd(), 'storage', 'db', 'objects')),
    contractsPath: awilix.asValue(path.join(process.cwd(), 'contracts', 'src')),
    clientVersion: awilix.asValue('Almudaya/v0.1.0'),

    // Classes
    cryptoProvider: awilix.asClass(CryptoProvider).singleton(),
    signatureProvider: awilix.asClass(Secp256k1SignatureProvider).singleton(),
    addressDeriver: awilix.asClass(AddressDeriver).singleton(),
    walletManager: awilix.asClass(WalletManager).singleton(),
    stateRepository: awilix.asClass(JsonStateRepository).singleton(),
    worldStateManager: awilix.asClass(WorldStateManager).singleton(),
    blockchain: awilix.asClass(Blockchain).singleton(),
    tokenizer: awilix.asClass(Tokenizer).singleton(),
    parser: awilix.asClass(Parser).singleton(),
    bytecodeGenerator: awilix.asClass(BytecodeGenerator).singleton(),
    contractCompiler: awilix.asClass(ContractCompiler).singleton(),
    contentAddressedObjectStore: awilix.asClass(ContentAddressedObjectStore).singleton(),
    vm: awilix.asClass(VirtualMachine).singleton(),
    rpcService: awilix.asClass(BlockchainRpcService).singleton(),
    transport: awilix.asClass(ExpressJsonRpcTransport).singleton(),
    rpcServer: awilix.asClass(RpcServer).singleton()
  });

  const resolvedServer = container.resolve('rpcServer');
  resolvedServer.demoMnemonic = mnemonic;
  resolvedServer.demoAccounts = accounts;
  return resolvedServer;
}

async function startFromCli() {
  const host = process.env.RPC_HOST || '127.0.0.1';
  const port = Number.parseInt(process.env.RPC_PORT || '8545', 10);
  const route = process.env.RPC_ROUTE || '/rpc';
  const ethereumChainId = Number.parseInt(process.env.ETH_CHAIN_ID || '1337', 10);
  const server = createRpcServer({
    ethereumChainId,
    host,
    port,
    route
  });
  const started = await server.start({ host, port });

  console.log(`\nAvailable Accounts`);
  console.log(`==================`);
  server.demoAccounts.forEach((acc, i) => {
    console.log(`(${i}) ${acc.address} (10000 AGV)`);
  });

  console.log(`\nPrivate Keys`);
  console.log(`==================`);
  server.demoAccounts.forEach((acc, i) => {
    console.log(`(${i}) ${acc.privateKey}`);
  });

  console.log(`\nHD Wallet`);
  console.log(`==================`);
  console.log(`Mnemonic:      ${server.demoMnemonic}`);
  console.log(`Base HD Path:  m/44'/60'/0'/0/\n`);

  console.log(`RPC server listening on http://${started.host}:${started.port}${started.route}`);
  console.log(`Frontend demo available at http://${started.host}:${started.port}/`);
  console.log(`Ethereum-compatible chain id: 0x${ethereumChainId.toString(16)}`);
}

if (require.main === module) {
  startFromCli().catch((error) => {
    console.error('Failed to start RPC server:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  createRpcServer
};
