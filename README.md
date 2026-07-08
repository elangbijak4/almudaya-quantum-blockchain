# Almudaya Quantum Blockchain (v0.2.0-pqc)

Almudaya Quantum Blockchain adalah sebuah purwarupa (*Proof-of-Concept*/PoC) jaringan blockchain modular bergaya Ethereum yang dirancang dari dasar untuk menghadapi masa depan pasca-kuantum (*Post-Quantum Cryptography*).

Blockchain ini melepaskan ketergantungan pada standar kriptografi rentan kuantum seperti secp256k1 (ECDSA) dan beralih menggunakan standar **NIST FIPS 204: CRYSTALS-Dilithium** (Lattice-Based Cryptography) untuk manajemen kunci dan tanda tangan transaksi. 

## Fitur Utama 🌟

1. **Lattice-Based Signature (Dilithium2):** Keamanan transaksi dilindungi oleh algoritma Post-Quantum yang tahan terhadap serangan logaritma diskret oleh komputer kuantum (algoritma Shor & Grover).
2. **Arsitektur Modular:** Pemisahan lapisan (*Separation of Concerns*) dengan sangat ketat (RPC, WorldState, VM, Storage) menggunakan *Dependency Injection*.
3. **Kompatibilitas Antarmuka Ethereum:** Meski kunci kuantum berukuran besar, *RPC Server* dan *address hashing* (`0x...`) secara sengaja dibuat tetap familier agar ekosistem interaksinya menyerupai lingkungan simulasi Web3 standar (seperti Ganache/Hardhat Local Node).
4. **Post-Quantum Object Store:** Penyimpanan bukti on-chain untuk memastikan ketahanan modifikasi pada tingkat protokol.

## Struktur Modul

- `core`: orkestrasi chain lifecycle dan validation layer (termasuk validasi *signature* PQC).
- `crypto`: implementasi dasar *hashing* deterministik.
- `wallet`: facade manajemen dompet dan antarmuka *SignatureProvider* (menyuntikkan `DilithiumSignatureProvider`).
- `worldstate`: abstraksi *state* dan penyimpanan.
- `vm`: lingkungan eksekusi Smart Contract simulasi.
- `contracts`: kompiler dan pengeksekusi bahasa skrip internal blockchain.
- `rpc`: *JSON-RPC Web3 Endpoint* yang memfasilitasi interaksi pengguna (Node-Managed PQC Accounts).

## Memulai & Menjalankan Node

### Instalasi Dependensi
Pastikan NodeJS 24+ terpasang, lalu jalankan:
```bash
npm install
```

### Menjalankan RPC Server & Node
```bash
npm run rpc:start
```
Node akan mulai berjalan di `http://127.0.0.1:8545` dan mencetak **20 Akun Dompet Dilithium** yang siap digunakan untuk bertransaksi! Tersedia juga Web Dashboard GUI secara langsung saat Anda mengakses alamat tersebut di browser.

## Dokumentasi Pendukung
Kami telah menyiapkan dokumen komprehensif bagi Anda yang ingin mengkaji model PoC ini dari segi akademis dan ilmiah:
1. [Tinjauan Implementasi Post-Quantum (Scientific PoC)](docs/PQC_SCIENTIFIC_DOCUMENTATION.md)
2. [Panduan Penggunaan Akademik (Untuk Dosen & Mahasiswa)](docs/USER_GUIDE_ACADEMIC.md)
