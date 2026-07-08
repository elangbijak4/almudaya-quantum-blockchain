# Petunjuk Aplikasi Blockchain

Dokumen ini menjelaskan cara memasang, menjalankan pertama kali, menguji RPC, memahami integrasi MetaMask tahap awal, memakai demo browser, dan membuat smart contract pada prototype blockchain ini.

## 1. Gambaran singkat

Project ini adalah prototype blockchain modular berbasis Node.js dengan komponen utama:

- `core`: blockchain, block, transaction
- `wallet`: pembuatan akun, address, signing
- `worldstate`: penyimpanan state akun dan storage contract
- `contracts`: compiler contract sederhana
- `vm`: virtual machine custom
- `rpc`: JSON-RPC server berbasis Express

Penting:

- Ini belum setara node Ethereum penuh.
- RPC custom project tetap ada, tetapi sekarang sudah ditambah subset method `eth_*` tahap awal.
- MetaMask sekarang bisa dipakai untuk menambahkan network lokal dan konek wallet di frontend demo.
- Namun transaksi dan eksekusi contract masih memakai method custom internal project ini, bukan flow EVM penuh.

## 2. Kebutuhan sistem

- Node.js 18 atau lebih baru
- npm 9 atau lebih baru
- Sistem operasi Windows, Linux, atau macOS

Untuk cek versi:

```powershell
node -v
npm -v
```

## 3. Cara install

Dari root project `C:\blockchain-projects`, jalankan:

```powershell
npm install
```

Perintah ini akan memasang dependency utama, saat ini `express`.

## 4. Cara menjalankan pertama kali

### 4.1 Cek modul berhasil dimuat

```powershell
npm run check
```

Jika tidak ada error, berarti struktur modul dapat di-load oleh Node.js.

### 4.2 Jalankan server RPC dan demo browser

Sekarang project ini sudah memiliki entrypoint server:

```powershell
npm run rpc:start
```

Jika sukses, Anda akan melihat output seperti:

```text
RPC server listening on http://127.0.0.1:8545/rpc
Frontend demo available at http://127.0.0.1:8545/
Ethereum-compatible chain id: 0x539
```

### 4.3 File state pertama kali

Saat server dijalankan, file state akan dibuat otomatis di:

`C:\blockchain-projects\worldstate\db\worldstate.json`

File ini menyimpan akun, balance, nonce, storage contract, dan `stateRoot`.

## 5. Method RPC yang tersedia

Server menyediakan method custom:

- `sendTransaction`
- `getBalance`
- `deployContract`
- `callContract`
- `getBlock`
- `getStateRoot`

Server juga menyediakan subset method Ethereum-compatible tahap awal:

- `web3_clientVersion`
- `net_version`
- `eth_chainId`
- `eth_blockNumber`
- `eth_getBalance`
- `eth_getBlockByNumber`
- `eth_getBlockByHash`
- `eth_getTransactionCount`
- `eth_getCode`
- `eth_getStorageAt`
- `eth_call`
- `eth_estimateGas`
- `eth_sendTransaction`
- `eth_gasPrice`
- `eth_accounts`
- `eth_coinbase`
- `eth_mining`
- `eth_syncing`

Endpoint default:

- URL: `http://127.0.0.1:8545/rpc`
- Method HTTP: `POST`
- Format: JSON-RPC 2.0

## 6. Contoh uji RPC pertama kali

### 6.1 Ambil state root

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":1,"method":"getStateRoot","params":{}}'
```

### 6.2 Ambil block terbaru

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":2,"method":"getBlock","params":{}}'
```

### 6.3 Cek balance alamat genesis

Default genesis address adalah `genesis-treasury`.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":3,"method":"getBalance","params":{"address":"genesis-treasury"}}'
```

## 7. Cara konekkan dengan MetaMask

### 7.1 Status saat ini

Pada versi sekarang, aplikasi ini **sudah bisa dipakai dengan MetaMask secara terbatas**.

Yang sudah bisa:

- frontend browser bisa meminta koneksi akun MetaMask
- MetaMask bisa menambahkan local network project ini
- frontend bisa membaca account aktif MetaMask sebagai `callerAddress`
- node juga menyediakan akun managed lokal untuk pengujian transfer via `eth_sendTransaction`

Yang belum bisa:

- project ini belum punya flow `eth_sendRawTransaction`
- belum ada EVM/ABI/Solidity compatibility penuh
- deploy dan call contract masih memakai method custom `deployContract` dan `callContract`
- format transaksi internal project ini belum sama dengan transaksi Ethereum biasa
- akun MetaMask belum dipakai untuk menandatangani transaksi yang divalidasi node ini

### 7.2 Apa yang tetap bisa dilakukan sekarang

Anda tetap bisa:

- menjalankan node RPC lokal
- menambahkan local network ke MetaMask
- menghubungkan akun MetaMask ke demo browser
- deploy contract lewat `deployContract`
- memanggil contract lewat `callContract`
- menguji state blockchain tanpa MetaMask

### 7.3 Cara mencoba MetaMask sekarang

1. Jalankan `npm run rpc:start`
2. Buka `http://127.0.0.1:8545/` di browser
3. Klik `Connect MetaMask`
4. Klik `Add Local Network`
5. Setujui penambahan network di MetaMask
6. Gunakan form deploy dan call contract dari halaman demo

Catatan:

- MetaMask dipakai sebagai wallet browser
- deploy dan call tetap dikirim oleh frontend demo ke endpoint JSON-RPC project
- ini bukan berarti MetaMask sudah bisa memperlakukan node ini sebagai node Ethereum penuh

### 7.4 Agar integrasi MetaMask lebih penuh di masa depan

Agar MetaMask bisa dipakai, project ini perlu ditambah:

- method RPC standar Ethereum (`eth_*`)
- format transaksi Ethereum-compatible
- dukungan raw signed transaction
- `chainId` yang diekspos via `eth_chainId`
- model account dan signature yang kompatibel dengan wallet Ethereum
- idealnya ABI dan EVM compatibility yang lebih dekat ke Solidity/Ethereum

Singkatnya: tahap saat ini cocok untuk koneksi wallet browser dan demonstrasi jaringan lokal, tetapi belum cocok sebagai pengganti node Ethereum sungguhan.

## 8. Cara membuat smart contract di dalam aplikasi ini

### 8.1 Bahasa contract yang dipakai

Project ini belum memakai Solidity penuh. Compiler di folder `contracts` memakai syntax minimal yang mirip Solidity, dengan fitur:

- `contract`
- `state`
- `function`
- assignment
- operasi aritmetika `+`, `-`, `*`, `/`

### 8.2 Aturan penting syntax

- Contract harus diawali `contract NamaContract { ... }`
- State dideklarasikan sebagai `state nama = nilai;`
- Function dideklarasikan sebagai `function nama(param1, param2) { ... }`
- Isi function saat ini berupa assignment sederhana
- Variabel state diakses dengan nama biasa, lalu compiler memetakannya ke `state.*`
- Parameter function diakses lewat nama parameter

### 8.3 Contoh contract

Contoh contract saldo sederhana:

```text
contract Wallet {
  state balance = 0;

  function deposit(amount) {
    balance = balance + amount;
  }

  function withdraw(amount) {
    balance = balance - amount;
  }
}
```

Catatan:

- `deposit(amount)` akan menambah `balance`
- `withdraw(amount)` akan mengurangi `balance`
- Belum ada validasi seperti `require`, `if`, event, mapping, modifier, constructor, atau inheritance

## 9. Cara deploy smart contract

Jalankan request JSON-RPC berikut:

```powershell
$body = @"
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "deployContract",
  "params": {
    "source": "contract Wallet { state balance = 0; function deposit(amount) { balance = balance + amount; } function withdraw(amount) { balance = balance - amount; } }"
  }
}
"@

Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Response akan berisi data penting seperti:

- `contractAddress`
- `contractRoot`
- `contractName`
- `codeHash`
- `storageHash`
- `initialStorage`

Simpan terutama:

- `contractAddress`
- `contractRoot`

Karena keduanya dibutuhkan untuk pemanggilan function contract.

## 10. Cara memakai demo browser

Setelah server aktif, buka:

- `http://127.0.0.1:8545/`

Fungsi utama halaman demo:

- koneksi akun MetaMask
- penambahan local network ke MetaMask
- deploy contract dari textarea source
- dry-run contract lewat `eth_call`
- estimasi gas lewat `eth_estimateGas`
- pemanggilan function contract dengan input `contractAddress` dan `contractRoot`
- riwayat deploy yang disimpan di browser
- inspeksi storage contract
- explorer transfer, pending transaction, dan mining
- tampilan info node dan subset method `eth_*`

## 11.1 Format `eth_call` dan `eth_estimateGas` pada prototype ini

Karena project ini belum memakai ABI/EVM standar, field `data` untuk `eth_call` dan `eth_estimateGas` diisi hex dari JSON UTF-8.

Payload JSON dasarnya:

```json
{
  "contractRoot": "HASH_ROOT_CONTRACT",
  "functionName": "deposit",
  "args": {
    "amount": 5
  }
}
```

Lalu payload JSON itu diubah ke hex dan dikirim sebagai `data`.

Artinya:

- method ini sudah mengikuti nama RPC Ethereum
- tetapi isi `data` masih memakai format bridge milik project ini
- jadi belum kompatibel dengan ABI Solidity biasa

## 11.2 Cara memakai `eth_sendTransaction` pada prototype ini

Method `eth_sendTransaction` sekarang sudah tersedia, tetapi dengan batasan penting:

- hanya mendukung akun node-managed yang dikembalikan oleh `eth_accounts`
- belum mendukung akun MetaMask sebagai signer transaksi blockchain internal
- dipakai terutama untuk demo transfer dan explorer lokal

Alur pengujiannya:

1. buka halaman demo
2. lihat daftar akun pada bagian transfer explorer
3. isi alamat tujuan dan nominal
4. klik `Send Transfer`
5. klik `Mine Pending` agar transaksi masuk ke block baru

Secara konsep:

- node menyimpan satu bridge wallet lokal di `wallet/db/bridge-wallet.json`
- wallet itu dipakai sebagai akun treasury/unlocked account
- transaksi dikirim lewat `eth_sendTransaction`
- node melakukan signing internal sebelum memasukkan transaksi ke pending pool

## 11. Cara memanggil smart contract

Misalnya hasil deploy memberi:

- `contractAddress = 0xabc...`
- `contractRoot = 1234abcd...`

Maka panggil function `deposit` seperti ini:

```powershell
$body = @"
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "callContract",
  "params": {
    "contractAddress": "GANTI_DENGAN_CONTRACT_ADDRESS",
    "contractRoot": "GANTI_DENGAN_CONTRACT_ROOT",
    "functionName": "deposit",
    "args": {
      "amount": 5
    },
    "gasLimit": 1000
  }
}
"@

Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Response biasanya memuat:

- `returnValue`
- `gasUsed`
- `stateRoot`
- `storageHash`

Jika contract `Wallet` dipanggil berulang kali, nilai `balance` akan berubah di storage contract pada world state.

## 12. Lokasi data contract

Contract yang di-deploy disimpan pada dua area utama:

- `C:\blockchain-projects\storage\contracts`
- `C:\blockchain-projects\worldstate\db\worldstate.json`

Secara konsep:

- bytecode dan descriptor contract disimpan content-addressed
- storage awal dan storage hasil eksekusi dikelola melalui world state

## 13. Batasan versi sekarang

Yang belum ada atau belum lengkap:

- `eth_sendRawTransaction`
- `eth_call` yang kompatibel EVM
- `eth_estimateGas` yang realistis
- `eth_sendTransaction` untuk signer MetaMask asli
- RPC standar Ethereum yang lengkap
- ABI lengkap
- Solidity penuh
- EVM compatibility penuh
- event/log
- `if`, loop, `require`, mapping, constructor
- frontend dApp
- deployment pipeline seperti Hardhat/Truffle/Foundry

## 14. Saran alur penggunaan saat ini

Urutan yang paling realistis untuk versi sekarang:

1. `npm install`
2. `npm run check`
3. `npm run rpc:start`
4. buka `http://127.0.0.1:8545/`
5. connect MetaMask dan tambahkan local network
6. uji `eth_chainId`, `eth_blockNumber`, dan info node dari browser
7. deploy contract dengan `deployContract`
8. simpan `contractAddress` dan `contractRoot`
9. panggil function contract dengan `callContract`
10. cek perubahan state di file world state atau response RPC

## 15. Ringkasan

Project ini sekarang sudah bisa dipakai sebagai:

- prototype blockchain modular
- laboratorium eksperimen world state dan VM
- compiler contract minimal custom
- server JSON-RPC internal untuk pengujian
- demo browser untuk MetaMask connect, deploy, dan contract call

Tetapi project ini belum siap diperlakukan sebagai node Ethereum penuh yang kompatibel total dengan ekosistem EVM.
