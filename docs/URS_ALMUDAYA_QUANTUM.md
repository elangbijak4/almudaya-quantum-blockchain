# User Requirement Specification (URS)
**Nama Proyek:** Almudaya Quantum Blockchain
**Versi:** 1.0.1
**Fase Riset:** Purwarupa (Proof of Concept / Beta)
**Tingkat Kesiapterapan Teknologi (TKT) Target:** TKT 4 - TKT 6

---

## 1. Pendahuluan
Dokumen *User Requirement Specification* (URS) ini mendefinisikan persyaratan pengguna dan spesifikasi fungsional untuk sistem **Almudaya Quantum Blockchain**. Sistem ini merupakan purwarupa (Proof of Concept) jaringan blockchain termodularisasi yang mengimplementasikan skema kriptografi pasca-kuantum (*Post-Quantum Cryptography*/PQC) standar NIST, secara spesifik menggunakan algoritma **CRYSTALS-Dilithium**, untuk mengantisipasi ancaman komputasi kuantum di masa depan (Q-Day).

Tujuan dari dokumen ini adalah untuk memenuhi standar dokumentasi luaran riset sesuai panduan Tingkat Kesiapterapan Teknologi (TKT) di Indonesia, khususnya untuk inovasi perangkat lunak tingkat menengah.

---

## 2. Profil Pengguna (User Persona)

1. **Peneliti / Dosen (Akademisi):** Pengguna yang bertindak sebagai inisiator *node*, melakukan pengujian algoritma Dilithium, menganalisis struktur metrik blok, dan menerbitkan jurnal berdasarkan kinerja sistem.
2. **Mahasiswa / Pengembang Aplikasi (Developer):** Pengguna yang berinteraksi dengan API JSON-RPC untuk membangun aplikasi desentralisasi (dApps) sederhana di atas jaringan dan mempelajari struktur kriptografi kuantum.

---

## 3. Persyaratan Fungsional (Functional Requirements)

Sistem Almudaya Quantum Blockchain harus mampu menyediakan fungsi-fungsi berikut:

### FR-01: Manajemen Kriptografi Pasca-Kuantum
- **FR-01.1:** Sistem harus mampu menghasilkan pasangan kunci (*keypair*) publik dan privat menggunakan algoritma PQC CRYSTALS-Dilithium (Level 2).
- **FR-01.2:** Sistem harus mampu menandatangani (*sign*) transaksi digital menggunakan kunci privat Dilithium.
- **FR-01.3:** Sistem harus mampu memverifikasi (*verify*) validitas tanda tangan transaksi menggunakan kunci publik Dilithium secara absolut sebelum transaksi dimasukkan ke dalam blok.

### FR-02: Manajemen Akun dan Dompet (Wallet)
- **FR-02.1:** Sistem harus secara otomatis membangkitkan setidaknya 20 akun *demo* (dengan saldo bawaan/prefund) berbasis Dilithium saat inisialisasi jaringan (Genesis Block).
- **FR-02.2:** Sistem harus mendemonstrasikan penyimpanan kunci dan memori (*keystore*) yang sesuai untuk mendukung format struktur parameter Dilithium yang lebih besar dibandingkan ECDSA standar.

### FR-03: Manajemen Transaksi
- **FR-03.1:** Sistem harus menerima format *payload* transaksi yang kompatibel dengan standar Web3, namun dimodifikasi untuk mengakomodasi tanda tangan Dilithium.
- **FR-03.2:** Sistem harus memvalidasi nonce, saldo (balance), dan integritas tanda tangan sebelum memindahkan transaksi ke *mempool* (*pending transactions*).

### FR-04: Antarmuka JSON-RPC (Web3 Compatibility)
- **FR-04.1:** Sistem harus menyediakan *endpoint* RPC melalui HTTP (default: `http://127.0.0.1:8545/rpc`).
- **FR-04.2:** Sistem harus mendukung pemanggilan fungsi standar RPC seperti `getChainOverview`, yang mampu merespons struktur blok *Genesis*, saldo akun, dan status jaringan secara instan.

### FR-05: Antarmuka Dasbor (Dashboard UI)
- **FR-05.1:** Sistem harus menyajikan antarmuka *dashboard* visual (*front-end*) yang di-host secara lokal di rute *root* (`/`).
- **FR-05.2:** Dasbor harus menampilkan daftar dompet, kunci publik, serta menyimulasikan transaksi kuantum antar-pengguna secara interaktif.

---

## 4. Persyaratan Non-Fungsional (Non-Functional Requirements)

### NFR-01: Arsitektur Termodularisasi (*Modularity*)
- Sistem harus menggunakan injeksi dependensi (*Dependency Injection* melalui pustaka Awilix) untuk memastikan komponen seperti `SignatureProvider` dapat dilepas dan diganti tanpa merombak inti (*core*) dari *Virtual Machine* (VM) atau basis data.

### NFR-02: Kinerja dan Ukuran Penyimpanan
- Mengingat kunci publik Dilithium berukuran ~1.3 KB dan tanda tangannya berukuran ~2.4 KB (jauh lebih besar dari ECDSA), sistem penyimpanan *State Repository* harus mampu menangani peningkatan beban data (overhead) tanpa mengalami kerusakan korupsi memori lokal.

### NFR-03: Ketersediaan (Availability) dan Portabilitas
- Sistem harus dapat dijalankan (di-*boot*) sebagai paket Node.js *standalone* yang diunduh melalui pengelola paket global (`npm install -g almudaya-quantum-blockchain`) baik di lingkungan Windows, Linux, maupun macOS.

---

## 5. Batasan Sistem (System Constraints)
- **C-01:** Sebagai sistem *Proof of Concept* (PoC), versi 1.0.1 ini dikonfigurasi sebagai *node* tunggal (Sentralisasi Pengembangan) dan belum dilengkapi jaringan *Peer-to-Peer* (P2P) antar-mesin yang ekstensif (seperti PQC Kyber KEM).
- **C-02:** Kompatibilitas dengan ekstensi *browser* pihak ketiga (seperti MetaMask) tidak dapat dilakukan secara *native* (tanpa adaptasi tambahan) karena MetaMask belum mendukung algoritma PQC NIST secara *built-in*.

---
*Dokumen ini diterbitkan sebagai panduan riset akademik untuk validasi pencapaian TKT.*
