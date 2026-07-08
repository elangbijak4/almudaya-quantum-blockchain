# Tinjauan Implementasi Kriptografi Post-Quantum (PQC) pada Almudaya Blockchain

## Abstrak
Almudaya Blockchain adalah sebuah purwarupa (*Proof-of-Concept*/PoC) jaringan blockchain modular bergaya Ethereum yang dirancang untuk mengatasi kerentanan sistem kriptografi klasik terhadap ancaman komputasi kuantum di masa depan. Purwarupa ini telah memigrasikan standar *Elliptic Curve Digital Signature Algorithm* (ECDSA/secp256k1) konvensional ke arsitektur **Post-Quantum Cryptography (PQC)** menggunakan algoritma **CRYSTALS-Dilithium**. Dokumen ini merangkum arsitektur, algoritma yang digunakan, serta kelebihan dan implementasi teknis PQC pada Almudaya Blockchain.

---

## 1. Pendahuluan
Algoritma komputasi kuantum, khususnya algoritma Shor, secara teoritis mampu memecahkan masalah logaritma diskret (*Discrete Logarithm Problem*) yang mendasari keamanan kriptografi kurva eliptik (ECC/secp256k1). Mengingat blockchain Ethereum bergantung penuh pada algoritma ECDSA untuk membuktikan kepemilikan aset, ancaman *Q-Day* (hari di mana komputer kuantum praktis tersedia) merupakan ancaman eksistensial.

Almudaya Blockchain bertindak sebagai eksperimen dan PoC arsitektur modular yang merespons ancaman tersebut dengan mengintegrasikan standar keamanan kuantum secara *native*.

---

## 2. Kriptografi Post-Quantum: CRYSTALS-Dilithium
Almudaya Blockchain mengimplementasikan **CRYSTALS-Dilithium** (Level 2), sebuah algoritma *Lattice-based cryptography* yang direkomendasikan dan distandardisasi oleh **NIST (National Institute of Standards and Technology)** pada standar **FIPS 204**. 

### Mengapa Dilithium?
1. **Keamanan Berbasis Kisi (Lattice-based):** Dilithium mendasarkan keamanannya pada kesulitan menyelesaikan masalah *Module Learning with Errors* (MLWE) dan *Short Integer Solution* (SIS), dua problem matematika yang diyakini tahan terhadap serangan dari algoritma Shor maupun algoritma Grover.
2. **Keseimbangan Performa:** Dilithium memiliki ukuran tanda tangan dan kunci yang sangat wajar bila dibandingkan dengan skema berbasis hash (*Hash-based signatures*) seperti SPHINCS+, serta sangat cepat dalam penandatanganan dan verifikasi di sisi *node*.
3. **Standarisasi NIST:** Sebagai algoritma yang memenangkan kompetisi NIST, Dilithium memiliki jaminan keamanan dan uji akademis (*peer-reviewed*) global yang ekstensif.

---

## 3. Desain Arsitektur dan Penerapan PQC
Desain arsitektur PQC di Almudaya dipisahkan dari logika *state machine* melalui pola **Dependency Injection** (via kontainer `awilix`). Hal ini memungkinkan algoritma `dilithium2` disuntikkan langsung sebagai *Signature Provider* inti.

### 3.1. Struktur Modul dan Dependency Injection
Pembuatan tanda tangan dikelola oleh kelas tersendiri bernama `DilithiumSignatureProvider` yang mengimplementasikan antarmuka *SignatureProviderInterface*.
Penyedia ini didaftarkan di tingkat RPC Server:
```javascript
// Di dalam rpc/server.js
signatureProvider: awilix.asClass(DilithiumSignatureProvider).singleton()
```

### 3.2. Proses Keypair Generation
Setiap kali akun dompet baru dibuat, node menghasilkan pasangan kunci (Public Key dan Private Key) dengan panjang byte sesuai spesifikasi Dilithium Level 2:
- Panjang Kunci Publik: 1312 byte
- Panjang Kunci Privat: 2528 byte

Berdasarkan panjang ini, alamat bergaya Ethereum direduksi menggunakan fungsi hash `keccak256` untuk menghasilkan identitas 40-karakter heksadesimal (`0x...`), sehingga tetap mendukung standar *addressing* Ethereum tradisional.

### 3.3. Penandatanganan Transaksi dan Verifikasi (Transaction Signing)
Setiap mutasi *state* (misal: Transfer nilai `eth_sendTransaction` atau panggilan Smart Contract `eth_call`) yang berasal dari alamat pengguna harus divalidasi.
- **Payload Pre-Hashing:** Data transaksi terlebih dahulu di-*serialize* secara deterministik dan di-hash dengan `keccak256` untuk menghasilkan *digest* 32 byte.
- **Signing:** Kunci privat Dilithium menghasilkan nilai *signature* sepanjang 2420 byte untuk menjamin integritas.
- **Verification:** Verifikasi dilakukan di dalam mempool (`WalletManager.verifyTransactionSignature`) dan pada tingkat Block Validation sebelum state dikonfirmasi (`Transaction.isValid()`).

### 3.4. Post-Quantum Object Store Attachment
Selain mengamankan kepemilikan aset dengan tanda tangan, Almudaya juga menyertakan komponen **Post-Quantum Object Store**. Fitur ini memfasilitasi penyimpanan bukti kuantum *on-chain* di mana setiap hash objek (*pqObjectHash*) yang mengikat transaksi disimpan dan divalidasi selama proses pertambangan (*mining*).

---

## 4. Model Proof of Concept (PoC) bergaya Ganache
Saat ini ekosistem Web3 standar (seperti MetaMask) **belum** mendukung kunci berukuran besar atau implementasi kurva selain `secp256k1`.
Oleh karena itu, Almudaya Blockchain berfungsi secara analog dengan *Ganache* atau *Hardhat Network*:
1. **Node-Managed Accounts:** Server blockchain (RPC) menampung dan mengelola dompet Dilithium secara *in-memory* ketika *node* dijalankan.
2. **Seamless RPC Interoperability:** Meskipun *backend*-nya menggunakan kriptografi kuantum, *endpoint* RPC JSON yang disediakan (`eth_sendTransaction`, `eth_getBalance`, dll) mematuhi format standar Web3. Ini memfasilitasi integrasi mudah dengan dApps atau *dashboard* GUI tanpa harus membangun ekstensi dompet khusus dari awal.

---

## 5. Kesimpulan dan Rencana Masa Depan (Future Work)
Penerapan *Lattice-Based Cryptography* via CRYSTALS-Dilithium di dalam arsitektur Almudaya Blockchain membuktikan bahwa platform buku besar terdistribusi dapat dibangun dengan resistansi kuantum dengan tetap mempertahankan kompatibilitas antarmuka pengguna (UI/RPC). 

Pekerjaan di masa mendatang meliputi:
1. Peningkatan dompet lokal yang sepenuhnya terdesentralisasi agar tidak bergantung pada *Node-Managed Accounts*.
2. Implementasi Key Encapsulation Mechanism (KEM) algoritma **Kyber** (ML-KEM) untuk enkripsi antar *node* (P2P Gossip Network).
3. Penguatan modul kompilator *Smart Contract* untuk sepenuhnya kompatibel dengan *Ethereum Virtual Machine* (EVM).
