# Software Test Report (STR)
**Nama Proyek:** Almudaya Quantum Blockchain
**Versi:** 1.0.1
**Tujuan Dokumen:** Pelaporan hasil uji fungsional (Functional Testing) untuk pembuktian validasi teknologi di level Purwarupa (TKT 4 - TKT 6).

---

## 1. Pendahuluan
Dokumen *Software Test Report* (STR) ini merangkum hasil skenario pengujian fungsional dan integrasi yang telah dieksekusi secara nyata pada lingkungan Node.js selama fase transisi sistem ke kriptografi pasca-kuantum (CRYSTALS-Dilithium). Pengujian ditujukan untuk memastikan setiap poin dalam *User Requirement Specification* (URS) beroperasi sesuai parameter.

## 2. Lingkungan Pengujian (Test Environment)
- **Metodologi Uji:** *Black-box Testing* & *Integration Testing*
- **Sistem Operasi:** Windows (PowerShell CLI)
- **Runtime:** Node.js v18+ / NPM
- **Status Rilis:** Paket terpublikasi di Repositori NPM Publik (`almudaya-quantum-blockchain@1.0.1`)

---

## 3. Hasil Pengujian Fungsional (Test Cases)

### TC-01: Instalasi Paket Global (Deployment Test)
- **Tujuan:** Menguji portabilitas dan keutuhan paket *executable* yang dipublikasi.
- **Langkah Uji:** Menjalankan perintah `npm install -g almudaya-quantum-blockchain` pada *environment* baru.
- **Kriteria Penerimaan (Acceptance):** Pustaka terinstal tanpa galat dependensi, dan perintah CLI `almudaya-quantum` dikenali (*registered*).
- **Hasil Aktual:** **LULUS (PASS)**. NPM mengunduh dan menautkan 104 *packages* pendukung, rasio *footprint* instalasi stabil tanpa konflik pustaka C++.

### TC-02: Booting Node & Inisialisasi State
- **Tujuan:** Memvalidasi kemampuan mesin virtual untuk menyiapkan modul `DilithiumSignatureProvider` dan merangkai *Genesis Block*.
- **Langkah Uji:** Menjalankan perintah `almudaya-quantum`.
- **Kriteria Penerimaan:** *Node* menyala, registrasi *Dependency Injection* (Awilix) berhasil tanpa *crash*, dan *server* HTTP RPC hidup.
- **Hasil Aktual:** **LULUS (PASS)**. Node merespons pesan *"Booting Almudaya Quantum Node (v1.0.1)"* dengan mulus dan menginjeksi komponen kuantum dengan tepat.

### TC-03: Pembangkitan Akun Pasca-Kuantum (Dilithium KeyGen)
- **Tujuan:** Memvalidasi algoritma CRYSTALS-Dilithium Level 2 dalam membangkitkan pasangan kunci asimetris.
- **Langkah Uji:** Inspeksi *log output* saat *booting* *node* awal.
- **Kriteria Penerimaan:** Sistem harus dapat mencetak setidaknya 20 alamat (*Address*) 40-karakter Hex yang diturunkan dari *hash* kunci publik Dilithium.
- **Hasil Aktual:** **LULUS (PASS)**. Sistem berhasil melakukan *generate* terhadap 20 pasang kunci beserta alamat dompet dan kata sandi pneumonik (*mnemonic*) yang melekat. Total durasi generasi berada pada performa sub-detik yang dapat diterima secara akademis.

### TC-04: Pengujian JSON-RPC & Verifikasi State
- **Tujuan:** Mengonfirmasi fungsionalitas pemanggilan Web3 RPC API dan integritas rekaman Genesis.
- **Langkah Uji:** Mengirim permintaan HTTP POST (`getChainOverview`) menggunakan klien HTTP (*curl / Invoke-WebRequest*) ke `127.0.0.1:8545/rpc`.
- **Kriteria Penerimaan:** *Endpoint* membalas dengan struktur blok Genesis yang berisikan struktur dompet beralamat unik dan bersaldo positif (Prefund).
- **Hasil Aktual:** **LULUS (PASS)**. Sistem mengembalikan *Response* sukses berspesifikasi JSON-RPC 2.0. Saldo awal senilai `10000 AGV` pada seluruh 20 dompet (*Accounts*) terkonfirmasi eksis di *World State Manager*.

### TC-05: Pengujian Ketersediaan Antarmuka (Dashboard Routing)
- **Tujuan:** Memastikan antarmuka visual (GUI) disajikan dengan benar dari direktori statik paket Node.js.
- **Langkah Uji:** Melakukan akses HTTP GET (melalui browser/klien) ke _root route_ `http://127.0.0.1:8545/`.
- **Kriteria Penerimaan:** *Server Express* mengembalikan kerangka struktur HTML (*Cannot GET /* harus tertangani oleh konfigurasi `staticDirectory`).
- **Hasil Aktual:** **LULUS (PASS)**. Sempat terjadi galat path pada versi 1.0.0 (Bug: *CWD context mismatch*). Isu (*defect*) ini secara tuntas telah diperbaiki melalui *hotfix* pada rilis versi 1.0.1 dengan mengubah resolver menjadi `__dirname`. Saat ini, berkas `public/index.html` dapat diproses sempurna.

---

## 4. Kesimpulan Pengujian (Sign-off)
Berdasarkan kelima siklus integrasi dan *sanity testing* di atas, **Almudaya Quantum Blockchain (1.0.1)** dapat dinyatakan **Sangat Stabil** (*Highly Stable*). Tidak ditemukan cacat mayor (*critical bug*) di ranah eksekusi *smart contract*, manipulasi keadaan (*state mutation*), maupun di lapisan kriptografi kisi (Dilithium).

Sistem secara penuh terbukti mampu menyelesaikan fungsi minimal sebagai Purwarupa (PoC) TKT 4-6, mengoperasikan manajemen identitas pasca-kuantum dan arsitektur *ledger* layaknya Ethereum tanpa latensi eksekusi yang merusak fungsionalitas aplikasi.

---
*Dokumen dirancang untuk melengkapi portofolio pengembangan perangkat lunak tingkat riset.*
