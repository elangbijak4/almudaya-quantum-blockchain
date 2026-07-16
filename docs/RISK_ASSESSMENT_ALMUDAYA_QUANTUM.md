# Risk Assessment & Mitigation Report
**Nama Proyek:** Almudaya Quantum Blockchain
**Versi:** 1.0.1
**Tanggal Terbit:** 16 Juli 2026
**Tujuan Dokumen:** Mengidentifikasi, menganalisis, dan memitigasi potensi risiko teknis maupun operasional pada arsitektur blockchain pasca-kuantum di tingkat purwarupa (TKT 4 - TKT 6).

---

## 1. Pendahuluan
Dokumen *Risk Assessment & Mitigation* ini mengevaluasi status kerentanan (*vulnerabilities*) pada implementasi *Proof of Concept* (PoC) Almudaya Quantum Blockchain. Karena sistem ini memelopori integrasi algoritma pasca-kuantum (CRYSTALS-Dilithium) pada ekosistem berstandar Ethereum yang masih eksperimental, manajemen risiko menjadi esensial untuk memandu fase riset lanjutan.

---

## 2. Identifikasi Risiko dan Strategi Mitigasi

### 2.1. Risiko Kinerja dan Penyimpanan (Storage Bloat Risk)
- **Deskripsi Risiko (Severity: Tinggi):** Ukuran *Public Key* Dilithium (~1.3 KB) dan Tanda Tangan (~2.4 KB) jauh lebih raksasa dibandingkan dengan algoritma konvensional ECDSA (masing-masing hanya 33 Bytes dan 65 Bytes). Pada jaringan dengan transaksi masif, hal ini akan menyebabkan *bloatware* penyimpanan memori (*World State*) meroket drastis secara eksponensial.
- **Strategi Mitigasi (Selesai):** Menerapkan arsitektur `PostQuantumObjectStore` yang menggunakan struktur *Content-Addressed Storage* berbasis *hash* pohon Merkle. Payload transaksi besar disimpan terpisah sebagai *blob* dan hanya nilai *hash*-nya yang dicatat dalam state transisi blok.
- **Tindak Lanjut (Riset Mendatang):** Mengeksplorasi penggunaan *Zero-Knowledge Proofs* (ZK-STARKs) untuk melakukan kompresi verifikasi agregasi (*signature aggregation*).

### 2.2. Risiko Kompatibilitas Ekosistem (Usability Friction)
- **Deskripsi Risiko (Severity: Menengah):** Arsitektur Web3 tradisional (seperti ekstensi *browser* MetaMask atau dompet perangkat keras Ledger) sama sekali belum mendukung algoritma kunci Dilithium. Hal ini menghalangi interaksi natural pengguna dengan dApps di Almudaya.
- **Strategi Mitigasi (Selesai):** Menambahkan lapisan abstraksi JSON-RPC kustom (`ExpressJsonRpcTransport`) dan membangun *Internal Dashboard GUI* yang menangani transaksi dompet lokal (*in-memory keystore*) tanpa memerlukan alat pihak ketiga.
- **Tindak Lanjut (Riset Mendatang):** Membangun ekstensi *browser* khusus kuantum (*Quantum Wallet Extension*) atau mendorong adopsi *Account Abstraction* (ERC-4337) agar validasi kunci publik dapat diubah secara dinamis.

### 2.3. Risiko Desentralisasi dan Sybil Attack (Network Architecture)
- **Deskripsi Risiko (Severity: Menengah):** Sebagai PoC TKT menengah, versi 1.0.1 masih berjalan sebagai *node* tunggal (Sentralisasi Pengembangan) tanpa konsensus *Peer-to-Peer* (P2P) untuk mendistribusikan blok. Jaringan ini saat ini rentan terhadap kejatuhan *server* tunggal (*Single Point of Failure*).
- **Strategi Mitigasi (Selesai):** Memastikan arsitektur inti dibangun dengan konsep abstraksi yang sangat ketat melalui *Dependency Injection* (Awilix), sehingga di masa depan modul P2P dapat "disuntikkan" (*plug-and-play*) tanpa merombak algoritma *Virtual Machine*.
- **Tindak Lanjut (Riset Mendatang):** Mengimplementasikan modul *Gossip Protocol* (seperti `libp2p`) dan konsensus *Proof of Authority* (PoA) atau *Delegated Proof of Stake* (DPoS) antar beberapa *node*.

### 2.4. Risiko Keamanan Implementasi Pustaka Kriptografi
- **Deskripsi Risiko (Severity: Tinggi):** Mengandalkan pustaka JavaScript `@asanrom/dilithium`. Meskipun mengikuti standar NIST FIPS 204, pustaka implementasi JavaScript murni acapkali tidak dioptimasi terhadap *Side-Channel Attacks* (seperti analisis *timing* eksekusi memori) dibandingkan dengan implementasi C/Rust.
- **Strategi Mitigasi (Selesai):** Membatasi *node* pada lingkungan eksekusi internal (*sandbox*) tanpa mengekspos variabel-variabel global *Virtual Machine* kepada penyerang luar.
- **Tindak Lanjut (Riset Mendatang):** Migrasi pustaka Kriptografi ke lingkungan WebAssembly (Wasm) berkinerja tinggi atau Native Addons (C/Rust Bindings) yang telah melalui *Security Audit* formal.

---

## 3. Kesimpulan Risiko
Rancangan purwarupa ini memiliki risiko yang **Terkendali (Controlled)** pada fase riset dan laboratorium. Segala batasan teoritis terkait ukuran (size) dan performa integrasi PQC telah dimitigasi oleh sistem partisi penyimpanan berbasis Merkle dan modularitas komponen (IoC). Sistem ini siap dan sangat layak untuk diujicobakan dalam simulasi transaksi akademis sembari mempersiapkan peta jalan (*roadmap*) pengembangan ke arah P2P di masa depan.

---
*Dokumen ini diterbitkan sebagai lampiran tata kelola risiko riset akademis.*
