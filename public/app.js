'use strict';

const rpcUrl = `${window.location.origin}/rpc`;
const defaultChainHex = '0x539';
const deploymentsStorageKey = 'prototype.deployments';

const elements = {
  addNetworkButton: document.getElementById('add-network'),
  callArgs: document.getElementById('call-args'),
  callContractAddress: document.getElementById('call-contract-address'),
  callContractButton: document.getElementById('call-contract'),
  dryRunContractButton: document.getElementById('dry-run-contract'),
  estimateGasButton: document.getElementById('estimate-gas'),
  callContractRoot: document.getElementById('call-contract-root'),
  callFunctionName: document.getElementById('call-function-name'),
  callGasLimit: document.getElementById('call-gas-limit'),
  callResult: document.getElementById('call-result'),
  connectWalletButton: document.getElementById('connect-wallet'),
  contractMetadata: document.getElementById('contract-metadata'),
  contractSource: document.getElementById('contract-source'),
  deployContractButton: document.getElementById('deploy-contract'),
  deployResult: document.getElementById('deploy-result'),
  loadNodeInfoButton: document.getElementById('load-node-info'),
  loadSelectedDeploymentButton: document.getElementById('load-selected-deployment'),
  nodeBlockNumber: document.getElementById('node-block-number'),
  nodeChainId: document.getElementById('node-chain-id'),
  nodeInfo: document.getElementById('node-info'),
  refreshStatusButton: document.getElementById('refresh-status'),
  savedDeployments: document.getElementById('saved-deployments'),
  storageKey: document.getElementById('storage-key'),
  storageResult: document.getElementById('storage-result'),
  inspectStorageButton: document.getElementById('inspect-storage'),
  transferFrom: document.getElementById('transfer-from'),
  transferTo: document.getElementById('transfer-to'),
  transferValue: document.getElementById('transfer-value'),
  sendTransferButton: document.getElementById('send-transfer'),
  minePendingButton: document.getElementById('mine-pending'),
  refreshExplorerButton: document.getElementById('refresh-explorer'),
  transferResult: document.getElementById('transfer-result'),
  explorerResult: document.getElementById('explorer-result'),
  walletAccount: document.getElementById('wallet-account'),
  walletChain: document.getElementById('wallet-chain')
};

async function rpcCall(method, params) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });
  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error.message || `RPC error on ${method}`);
  }

  return payload.result;
}

function prettyPrint(value) {
  return JSON.stringify(value, null, 2);
}

function parseJsonInput(input, fallback) {
  if (!input || input.trim().length === 0) {
    return fallback;
  }

  return JSON.parse(input);
}

function setText(element, value) {
  element.textContent = value;
}

function getSavedDeployments() {
  try {
    return JSON.parse(window.localStorage.getItem(deploymentsStorageKey) || '[]');
  } catch (_error) {
    return [];
  }
}

function saveDeployment(deployment) {
  const deployments = getSavedDeployments();
  const nextDeployments = [deployment, ...deployments.filter((item) => item.contractRoot !== deployment.contractRoot)].slice(0, 12);
  window.localStorage.setItem(deploymentsStorageKey, JSON.stringify(nextDeployments));
  renderSavedDeployments();
}

function renderSavedDeployments() {
  const deployments = getSavedDeployments();
  elements.savedDeployments.innerHTML = '';

  if (deployments.length === 0) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'No saved deployments';
    elements.savedDeployments.appendChild(emptyOption);
    return;
  }

  for (const deployment of deployments) {
    const option = document.createElement('option');
    option.value = deployment.contractRoot;
    option.textContent = `${deployment.contractName || 'Contract'} :: ${deployment.contractAddress}`;
    option.dataset.payload = JSON.stringify(deployment);
    elements.savedDeployments.appendChild(option);
  }
}

function encodeHexJson(value) {
  return `0x${new TextEncoder().encode(JSON.stringify(value)).reduce((buffer, byte) => buffer + byte.toString(16).padStart(2, '0'), '')}`;
}

function decodeHexAscii(value) {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    return value;
  }

  if (value === '0x') {
    return '';
  }

  const pairs = value.slice(2).match(/.{1,2}/g) || [];
  const bytes = new Uint8Array(pairs.map((pair) => Number.parseInt(pair, 16)));
  return new TextDecoder().decode(bytes);
}

function decodeHexValue(value) {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    return value;
  }

  const hexBody = value.slice(2);

  if (/^[0-9a-f]+$/i.test(hexBody) && hexBody.length <= 12) {
    return Number.parseInt(hexBody || '0', 16);
  }

  const ascii = decodeHexAscii(value);
  const trimmed = typeof ascii === 'string' ? ascii.trim() : ascii;

  if (typeof trimmed === 'string' && (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"'))) {
    try {
      return JSON.parse(trimmed);
    } catch (_error) {
      return ascii;
    }
  }

  return ascii;
}

function getActiveDeploymentInput() {
  return {
    contractAddress: elements.callContractAddress.value.trim(),
    contractRoot: elements.callContractRoot.value.trim(),
    functionName: elements.callFunctionName.value.trim(),
    gasLimit: Number.parseInt(elements.callGasLimit.value, 10),
    args: parseJsonInput(elements.callArgs.value, {})
  };
}

function fillDeployment(deployment) {
  elements.callContractAddress.value = deployment.contractAddress || '';
  elements.callContractRoot.value = deployment.contractRoot || '';
}

function renderManagedAccounts(accounts = []) {
  elements.transferFrom.innerHTML = '';

  if (accounts.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No managed accounts';
    elements.transferFrom.appendChild(option);
    return;
  }

  for (const account of accounts) {
    const option = document.createElement('option');
    option.value = account.address;
    option.textContent = `${account.address} (balance ${account.balance})`;
    elements.transferFrom.appendChild(option);
  }
}

async function getEthereum() {
  if (!window.ethereum) {
    throw new Error('MetaMask tidak ditemukan di browser ini.');
  }

  return window.ethereum;
}

async function refreshWalletStatus() {
  if (!window.ethereum) {
    setText(elements.walletAccount, 'MetaMask not installed');
    setText(elements.walletChain, 'Unavailable');
    return;
  }

  const [account] = await window.ethereum.request({ method: 'eth_accounts' });
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });

  setText(elements.walletAccount, account || 'Not connected');
  setText(elements.walletChain, chainId || 'Unknown');
}

async function refreshNodeStatus() {
  const [chainId, blockNumber] = await Promise.all([
    rpcCall('eth_chainId', []),
    rpcCall('eth_blockNumber', [])
  ]);

  setText(elements.nodeChainId, chainId);
  setText(elements.nodeBlockNumber, blockNumber);
}

async function loadNodeInfo() {
  const [clientVersion, netVersion, latestBlock, stateRoot] = await Promise.all([
    rpcCall('web3_clientVersion', []),
    rpcCall('net_version', []),
    rpcCall('eth_getBlockByNumber', ['latest', true]),
    rpcCall('getStateRoot', {})
  ]);

  elements.nodeInfo.textContent = prettyPrint({
    clientVersion,
    latestBlock,
    netVersion,
    stateRoot
  });
}

async function loadExplorer() {
  const [overview, pendingTransactions, latestBlock] = await Promise.all([
    rpcCall('getChainOverview', {}),
    rpcCall('getPendingTransactions', {}),
    rpcCall('eth_getBlockByNumber', ['latest', true])
  ]);

  renderManagedAccounts(overview.managedAccounts || []);
  elements.explorerResult.textContent = prettyPrint({
    chainId: overview.chainId,
    genesisAddress: overview.genesisAddress,
    latestBlock,
    managedAccounts: overview.managedAccounts,
    pendingTransactions
  });
}

async function connectWallet() {
  const ethereum = await getEthereum();
  await ethereum.request({ method: 'eth_requestAccounts' });
  await refreshWalletStatus();
}

async function addLocalNetwork() {
  const ethereum = await getEthereum();
  const nodeChainId = await rpcCall('eth_chainId', []);

  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: nodeChainId || defaultChainHex,
      chainName: 'Prototype Local Chain',
      nativeCurrency: {
        name: 'Prototype Coin',
        symbol: 'PTC',
        decimals: 18
      },
      rpcUrls: [rpcUrl],
      blockExplorerUrls: []
    }]
  });

  await refreshWalletStatus();
}

async function deployContract() {
  const metadata = parseJsonInput(elements.contractMetadata.value, {});
  const result = await rpcCall('deployContract', {
    metadata,
    source: elements.contractSource.value
  });

  elements.deployResult.textContent = prettyPrint(result);
  elements.callContractAddress.value = result.contractAddress || '';
  elements.callContractRoot.value = result.contractRoot || '';
  saveDeployment({
    contractAddress: result.contractAddress,
    contractName: result.contractName,
    contractRoot: result.contractRoot,
    createdAt: new Date().toISOString()
  });
}

async function callContract() {
  const args = parseJsonInput(elements.callArgs.value, {});
  const callerAddress = window.ethereum
    ? (await window.ethereum.request({ method: 'eth_accounts' }))[0] || null
    : null;
  const result = await rpcCall('callContract', {
    args,
    callerAddress,
    contractAddress: elements.callContractAddress.value.trim(),
    contractRoot: elements.callContractRoot.value.trim(),
    functionName: elements.callFunctionName.value.trim(),
    gasLimit: Number.parseInt(elements.callGasLimit.value, 10)
  });

  elements.callResult.textContent = prettyPrint(result);
}

async function dryRunContract() {
  const callerAddress = window.ethereum
    ? (await window.ethereum.request({ method: 'eth_accounts' }))[0] || null
    : null;
  const payload = getActiveDeploymentInput();
  const result = await rpcCall('eth_call', [{
    to: payload.contractAddress,
    from: callerAddress,
    gas: `0x${payload.gasLimit.toString(16)}`,
    data: encodeHexJson({
      contractRoot: payload.contractRoot,
      functionName: payload.functionName,
      args: payload.args
    })
  }, 'latest']);

  const decodedResult = decodeHexValue(result);

  elements.callResult.textContent = prettyPrint({
    ethCallResult: result,
    decodedResult
  });
}

async function estimateGas() {
  const callerAddress = window.ethereum
    ? (await window.ethereum.request({ method: 'eth_accounts' }))[0] || null
    : null;
  const payload = getActiveDeploymentInput();
  const result = await rpcCall('eth_estimateGas', [{
    to: payload.contractAddress,
    from: callerAddress,
    gas: `0x${payload.gasLimit.toString(16)}`,
    data: encodeHexJson({
      contractRoot: payload.contractRoot,
      functionName: payload.functionName,
      args: payload.args
    })
  }]);

  elements.callResult.textContent = prettyPrint({
    estimatedGas: result
  });
}

async function inspectStorage() {
  const contractAddress = elements.callContractAddress.value.trim();
  const storageKey = elements.storageKey.value.trim();
  const [snapshot, rawValue] = await Promise.all([
    rpcCall('getContractStorage', { contractAddress }),
    rpcCall('eth_getStorageAt', [contractAddress, storageKey, 'latest'])
  ]);

  elements.storageResult.textContent = prettyPrint({
    contractAddress,
    decodedStorage: snapshot.storage,
    ethGetStorageAt: rawValue,
    decodedSlotValue: decodeHexValue(rawValue)
  });
}

async function sendTransfer() {
  const fromAddress = elements.transferFrom.value;
  const toAddress = elements.transferTo.value.trim();
  const value = Number.parseInt(elements.transferValue.value, 10);
  const result = await rpcCall('eth_sendTransaction', [{
    from: fromAddress,
    to: toAddress,
    value: `0x${Math.max(0, value).toString(16)}`
  }]);

  elements.transferResult.textContent = prettyPrint({
    transactionHash: result
  });
  await loadExplorer();
}

async function minePending() {
  const result = await rpcCall('minePendingTransactions', {});

  elements.transferResult.textContent = prettyPrint(result);
  await Promise.all([refreshNodeStatus(), loadExplorer(), loadNodeInfo()]);
}

function loadSelectedDeployment() {
  const selectedOption = elements.savedDeployments.selectedOptions[0];

  if (!selectedOption?.dataset.payload) {
    return;
  }

  fillDeployment(JSON.parse(selectedOption.dataset.payload));
}

async function runAndReport(target, action) {
  try {
    await action();
  } catch (error) {
    target.textContent = error.message;
  }
}

elements.connectWalletButton.addEventListener('click', () => {
  runAndReport(elements.deployResult, connectWallet);
});

elements.addNetworkButton.addEventListener('click', () => {
  runAndReport(elements.nodeInfo, addLocalNetwork);
});

elements.refreshStatusButton.addEventListener('click', () => {
  runAndReport(elements.nodeInfo, async () => {
    await Promise.all([refreshWalletStatus(), refreshNodeStatus(), loadNodeInfo()]);
  });
});

elements.deployContractButton.addEventListener('click', () => {
  runAndReport(elements.deployResult, deployContract);
});

elements.callContractButton.addEventListener('click', () => {
  runAndReport(elements.callResult, callContract);
});

elements.dryRunContractButton.addEventListener('click', () => {
  runAndReport(elements.callResult, dryRunContract);
});

elements.estimateGasButton.addEventListener('click', () => {
  runAndReport(elements.callResult, estimateGas);
});

elements.loadNodeInfoButton.addEventListener('click', () => {
  runAndReport(elements.nodeInfo, loadNodeInfo);
});

elements.loadSelectedDeploymentButton.addEventListener('click', () => {
  runAndReport(elements.storageResult, async () => {
    loadSelectedDeployment();
  });
});

elements.inspectStorageButton.addEventListener('click', () => {
  runAndReport(elements.storageResult, inspectStorage);
});

elements.sendTransferButton.addEventListener('click', () => {
  runAndReport(elements.transferResult, sendTransfer);
});

elements.minePendingButton.addEventListener('click', () => {
  runAndReport(elements.transferResult, minePending);
});

elements.refreshExplorerButton.addEventListener('click', () => {
  runAndReport(elements.explorerResult, loadExplorer);
});

if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => {
    refreshWalletStatus().catch(() => {});
  });
  window.ethereum.on('chainChanged', () => {
    refreshWalletStatus().catch(() => {});
  });
}

Promise.all([refreshWalletStatus(), refreshNodeStatus(), loadNodeInfo()]).catch((error) => {
  elements.nodeInfo.textContent = error.message;
});

renderSavedDeployments();
loadExplorer().catch((error) => {
  elements.explorerResult.textContent = error.message;
});
