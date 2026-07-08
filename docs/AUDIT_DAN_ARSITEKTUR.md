# Audit dan Arsitektur Proyek Blockchain

Dokumen ini berisi hasil audit, pemetaan flow, cara kerja, visi, tujuan, dan fitur-fitur dari proyek `blockchain-projects-Almudaya`.

## 1. Visi dan Tujuan (Vision & Goals)

Proyek ini dibangun dengan visi untuk menjadi **Prototipe Blockchain Modular** berbasis Node.js. 
Tujuan utamanya bukan untuk langsung menyaingi Ethereum Node secara penuh (*full EVM-compatible node*), melainkan sebagai **laboratorium atau fondasi eksperimental** yang mengadopsi gaya arsitektur mirip Ethereum namun jauh lebih sederhana dan terstruktur.

Fokus utamanya adalah **modularitas (Bounded Contexts)**. Desain proyek ini memisahkan setiap fungsionalitas utama ke dalam direktori (*module*) terpisah yang hanya berinteraksi melalui dependensi yang tipis dan eksplisit. Ini memastikan bahwa pengembangan di masa depan tidak akan mengalami *tight coupling* (ketergantungan antar-modul yang terlalu rumit).

## 2. Arsitektur dan Cara Kerja (Architecture & Flow)

Alur kerja sistem ini dibagi menjadi beberapa lapisan (*layers*) yang berpusat pada `index.js` sebagai pintu masuk (*entrypoint*) ekspor. Saat Node.js dijalankan via `npm run rpc:start`, server Express mulai mendengarkan di port 8545 dan orkestrasi di bawah ini terjadi:

*   **RPC Server (`rpc/`)**: Bertindak sebagai pintu gerbang (*boundary*) HTTP. Menerima *request* JSON-RPC dari *client* (seperti Postman, cURL, UI Demo, atau MetaMask). 
*   **Core (`core/`)**: Menangani siklus hidup blockchain, seperti mengelola transaksi masuk, memvalidasi struktur *block*, dan merangkai rantai *block*.
*   **World State (`worldstate/`)**: Pusat data mutakhir jaringan. Ia mencatat *balance* (saldo akun), *nonce*, serta status *storage* setiap *smart contract*. Penyimpanan utamanya dikonversi secara deterministik ke dalam file JSON (`worldstate/db/worldstate.json`).
*   **Virtual Machine (`vm/`)**: Lingkungan eksekusi ketika ada panggilan *smart contract*. *Input* akan diproses, dan *output* (perubahan *state*) akan dikembalikan ke `worldstate`.
*   **Contracts (`contracts/`)**: Menyediakan kompilator *custom* sederhana (bukan Solidity asli). Mengurai (*parse*) *source code* *smart contract*, lalu mengonversinya menjadi format yang bisa dieksekusi `vm`.
*   **Wallet & Crypto (`wallet/`, `crypto/`)**: Mengurus hal-hal kriptografis seperti pembuatan *hash*, *signature*, dan pengelolaan akun lokal. *Wallet* bertindak sebagai penandatangan transaksi dari perbendaharaan lokal (node-managed).
*   **Storage (`storage/`)**: Abstraksi lapisan basis data (*persistence adapter*) yang menyimpan rekam jejak sistem secara persisten.

## 3. Pemetaan Alur Eksekusi (Flow Pemakaian)

Alur normal ketika pengguna berinteraksi dengan blockchain ini:
1.  **Inisialisasi**: Pengguna menjalankan RPC Server lokal. Sistem otomatis membuat file `worldstate.json` beserta akun genesis default.
2.  **Koneksi Client**: Pengguna membuka Demo Browser (`http://127.0.0.1:8545/`) dan mengkoneksikan MetaMask dengan menambahkan jaringan RPC lokal.
3.  **Deployment Smart Contract**: 
    *   Pengguna mengirim kode kontrak sederhana dari demo browser (`method: deployContract`).
    *   Sistem meneruskan kode tersebut ke *compiler* di modul `contracts`.
    *   Sistem mengembalikan `contractAddress` dan `contractRoot` lalu menyimpannya di file `worldstate`.
4.  **Interaksi Kontrak (Execution)**: 
    *   Pengguna melakukan pemanggilan fungsi (*method*) di kontrak tersebut via RPC (`callContract`).
    *   Modul `core` membungkusnya, `vm` mengeksekusi instruksi aritmetika/state-nya.
    *   *State* baru (misalnya penambahan saldo) di-*commit* ke modul `worldstate`.

## 4. Fitur-Fitur yang Tersedia Saat Ini

Meskipun masih di tahap *prototype*, sistem ini sudah memiliki berbagai kapabilitas teknis yang fungsional:

*   **JSON-RPC API Server**: Server berbasis Express yang menangani *payload* JSON-RPC 2.0 standar.
*   **Frontend UI Terintegrasi**: Memiliki UI di direktori `public/` yang otomatis di-*serve*, untuk menguji pembuatan kontrak, transfer token, cek saldo, dan *block explorer* lokal.
*   **Dukungan Smart Contract Minimalis**: 
    *   Terdapat bahasa pemrograman khusus ber-sintaks mirip Solidity yang mendukung inisiasi `contract`, deklarasi `state`, dan `function`.
    *   Mendukung operasi matematika dasar (`+`, `-`, `*`, `/`) serta *assignment*.
*   **Integrasi Awal dengan MetaMask**: 
    *   Mendukung *subset* standard metode RPC Ethereum (`eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_call`, dll).
    *   Bisa ditambahkan ke MetaMask sebagai *Local Network* dan bisa membaca akun MetaMask yang sedang aktif, walau penandatanganan via raw RPC (`eth_sendRawTransaction`) masih dalam tahap pengembangan.
*   **Block & State Explorer Internal**: Tersedia fungsi transfer (*sendTransaction*), pembuatan *block* manual (*Mine Pending*), cek *state root*, dan pengecekan saldo alamat spesifik (misal: `genesis-treasury`).

## 5. Rencana Evaluasi dan Refactoring (Berdasarkan Catatan)

Sebagai langkah ke depan, arsitektur ini akan direview secara menyeluruh untuk mengidentifikasi dan memperbaiki:
- *Circular dependency*
- *Nondeterministic behavior*
- *Serialization inconsistency*
- *Security issue*
- *Tight coupling*
- *Duplicate logic*
