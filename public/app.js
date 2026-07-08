const rpcUrl = 'http://127.0.0.1:8545/rpc';
const infoUrl = 'http://127.0.0.1:8545/dashboard-info';

// DOM Elements
const mnemonicDisplay = document.getElementById('mnemonic-display');
const accountsContainer = document.getElementById('accounts-container');
const blocksContainer = document.getElementById('blocks-container');
const transactionsContainer = document.getElementById('transactions-container');
const logsTerminal = document.getElementById('logs-terminal');
const currentBlockHeightEl = document.getElementById('current-block-height');

// Modal Elements
const modal = document.getElementById('pk-modal');
const closeBtn = document.querySelector('.close-btn');
const modalAddress = document.getElementById('modal-address');
const modalPk = document.getElementById('modal-pk');

let accountsData = [];
let currentBlock = 0;

// Utility: Format Hex to Decimal
function hexToDec(hexStr) {
    if (!hexStr) return 0;
    return parseInt(hexStr, 16);
}

// 1. Fetch Basic Dashboard Info (Mnemonic & Accounts List)
async function fetchDashboardInfo() {
    try {
        const res = await fetch(infoUrl);
        const data = await res.json();
        
        // Render Mnemonic
        if (data.mnemonic) {
            mnemonicDisplay.innerHTML = '';
            const words = data.mnemonic.split(' ');
            words.forEach(word => {
                const span = document.createElement('span');
                span.className = 'word';
                span.innerText = word;
                mnemonicDisplay.appendChild(span);
            });
        }

        if (data.accounts && data.accounts.length > 0) {
            accountsData = data.accounts;
            renderAccountsPlaceholder(accountsData);
            updateAccountsBalance(); // Start fetching balances
        }
    } catch (err) {
        logError('Failed to fetch dashboard info: ' + err.message);
    }
}

// 2. Render Accounts Base
function renderAccountsPlaceholder(accounts) {
    accountsContainer.innerHTML = '';
    accounts.forEach((acc, index) => {
        const row = document.createElement('div');
        row.className = 'account-row';
        row.id = `acc-row-${index}`;
        
        row.innerHTML = `
            <span class="address-val">${acc.address}</span>
            <span class="balance-val" id="bal-${index}">Loading...</span>
            <span id="tx-${index}">0</span>
            <div style="display:flex; justify-content: space-between; align-items:center;">
                <span>${index}</span>
                <button class="key-icon" onclick="showPrivateKey('${acc.address}', '${acc.privateKey}')" title="Show Private Key">🔑</button>
            </div>
        `;
        accountsContainer.appendChild(row);
    });
}

// 3. Fetch Balances via RPC
async function updateAccountsBalance() {
    for (let i = 0; i < accountsData.length; i++) {
        const acc = accountsData[i];
        try {
            const res = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_getBalance",
                    params: [acc.address, "latest"],
                    id: Date.now()
                })
            });
            const data = await res.json();
            if (data.result) {
                const balance = hexToDec(data.result);
                document.getElementById(`bal-${i}`).innerText = `${balance} AGV`;
            }
        } catch (err) {
            console.error('Balance error', err);
        }
    }
}

// 4. Fetch Latest Block
async function updateBlockInfo() {
    try {
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_blockNumber",
                params: [],
                id: Date.now()
            })
        });
        const data = await res.json();
        if (data.result) {
            const latestBlock = hexToDec(data.result);
            currentBlockHeightEl.innerText = latestBlock;
            
            // If new block found, fetch block details
            if (latestBlock > currentBlock || currentBlock === 0) {
                currentBlock = latestBlock;
                fetchBlockDetails(latestBlock);
            }
        }
    } catch (err) {
        console.error('Block error', err);
    }
}

// 5. Fetch Block Details
async function fetchBlockDetails(blockNum) {
    try {
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getBlockByNumber",
                params: ["0x" + blockNum.toString(16), true],
                id: Date.now()
            })
        });
        const data = await res.json();
        if (data.result) {
            renderBlock(data.result);
            if (data.result.transactions && data.result.transactions.length > 0) {
                data.result.transactions.forEach(tx => renderTransaction(tx));
            }
        }
    } catch (err) {
        console.error('Block details error', err);
    }
}

// 6. Render Block to UI
function renderBlock(block) {
    if (blocksContainer.querySelector('.empty-state')) {
        blocksContainer.innerHTML = '';
    }
    
    const row = document.createElement('div');
    row.className = 'block-row';
    const timestamp = new Date(hexToDec(block.timestamp) * 1000).toLocaleString();
    
    row.innerHTML = `
        <span class="address-val">${hexToDec(block.number)}</span>
        <span>${timestamp}</span>
        <span>${hexToDec(block.gasUsed)}</span>
        <span>${block.transactions.length}</span>
    `;
    
    blocksContainer.prepend(row);
}

// 7. Render Transaction to UI
function renderTransaction(tx) {
    if (transactionsContainer.querySelector('.empty-state')) {
        transactionsContainer.innerHTML = '';
    }
    
    const row = document.createElement('div');
    row.className = 'tx-row';
    
    row.innerHTML = `
        <span class="address-val" style="font-size: 0.8rem;" title="${tx.hash}">${tx.hash.substring(0, 15)}...</span>
        <span class="address-val" style="font-size: 0.8rem;" title="${tx.from}">${tx.from.substring(0, 15)}...</span>
        <span class="address-val" style="font-size: 0.8rem;" title="${tx.to}">${tx.to ? tx.to.substring(0, 15) + '...' : 'Contract Creation'}</span>
        <span class="balance-val">${hexToDec(tx.value)} AGV</span>
    `;
    
    transactionsContainer.prepend(row);
}

// Tab Navigation Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

// Modal Logic
function showPrivateKey(address, pk) {
    modalAddress.innerText = address;
    modalPk.innerText = pk;
    modal.classList.add('show');
}

closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.classList.remove('show');
    }
});

// Custom Console Logging capture (for Logs Tab)
function logError(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span style="color:var(--red)">ERROR:</span> ${msg}`;
    logsTerminal.prepend(entry);
}

// Initialize Polling
fetchDashboardInfo();
updateBlockInfo();
setInterval(updateAccountsBalance, 5000); // Check balance every 5s
setInterval(updateBlockInfo, 3000); // Check blocks every 3s
