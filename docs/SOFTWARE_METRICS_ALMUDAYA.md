# Software Metrics & Sizing Report
**Nama Proyek:** Almudaya Quantum Blockchain
**Versi:** 1.0.1
**Tanggal Terbit:** 16 Juli 2026
**Tujuan Dokumen:** Melengkapi persyaratan administratif dan rekayasa perangkat lunak untuk skema riset dan pengukuran kelayakan operasional (TKT).

---

## 1. Ukuran Perangkat Lunak (Software Sizing)
Berdasarkan analisis repositori secara statis (*static analysis*) pada *source code* murni, berikut adalah metrik ukurannya:

- **Estimasi Lines of Code (LOC):** ~4.710 baris kode murni (JavaScript) tidak termasuk pustaka pihak ketiga (*node_modules*).
- **Jumlah Berkas JavaScript:** 66 berkas modul internal.
- **Total Keseluruhan Berkas:** 141 berkas terdistribusi (termasuk JSON, konfigurasi, MD, dan Aset).

## 2. Metrik Distribusi & Penyebaran (Deployment Metrics)
Sistem ini dipaketkan menggunakan standar *Node Package Manager* (NPM). Berikut adalah ukuran jejak (*footprint*) dari paket instalasinya:
- **Ukuran Paket Terkompresi (Tarball Packed):** 51.9 kB
- **Ukuran Beban Terekstraksi (Unpacked Size):** 209.8 kB
*(Catatan: Ukuran ini sangat efisien (*lightweight*) untuk sebuah infrastruktur *node* blockchain karena arsitekturnya difokuskan pada injeksi dependensi modul tanpa memuat beban bloatware).*

## 3. Komposisi Modul (Modularity Ratio)
Arsitektur dibagi menjadi setidaknya 7 domain (*Bounded Contexts*):
1. `core/` : Entitas utama (Blok, Transaksi, Engine)
2. `crypto/` : Abstraksi *Hashing* (Keccak256)
3. `contracts/` : Pemroses bahasa kontrak pintar (Parser, Bytecode Generator)
4. `rpc/` : Server transportasi antarmuka (Express JSON-RPC)
5. `storage/` : *Post-Quantum Object Store* (Merkle Trees)
6. `vm/` : Eksekusi Opcodes (Virtual Machine)
7. `wallet/` : Kriptografi Dilithium (SignatureProvider)

## 4. Estimasi Kompleksitas Perangkat Lunak (Software Complexity)
**Tingkat Kompleksitas: Tinggi (Level 4/5)**
Berdasarkan pendekatan arsitekturnya, kerumitan perangkat lunak ini diestimasi memiliki kompleksitas yang tinggi dengan alasan:
1. **Algoritmik Matematika Kuantum:** Penanganan struktur byte array dari kriptografi kisi (*lattice-based cryptography*) CRYSTALS-Dilithium memerlukan validasi serialisasi memori yang presisi.
2. **Deterministic State Management:** VM dan *World State* harus menangani transisi status ledger secara *immutable* (tidak dapat diubah) berbasis pohon *Merkle-Patricia-like*, di mana sedikit ketidaksesuaian *hash* dapat menyebabkan kegagalan konsensus.
3. **Inversion of Control (IoC):** Menggunakan pola *Dependency Injection* (melalui pustaka Awilix) untuk 17+ layanan yang diregistrasi dan di-resolve secara dinamis (*runtime injection*).

## 5. Metodologi Pengukuran
Untuk memastikan objektivitas, pengukuran dilakukan dengan parameter berikut:
- **Lines of Code (LOC):** Dihitung dari *source code* JavaScript internal yang ditulis secara spesifik untuk proyek ini. Direktori `node_modules`, file hasil kompilasi/build, serta dependensi pihak ketiga sama sekali tidak dihitung.
- **Ukuran Paket:** Diperoleh secara presisi menggunakan perintah pembungkusan arsip internal dari Node.js (`npm pack`).
- **Jumlah Berkas:** Dihitung dari keseluruhan struktur direktori repositori yang terpetakan (*tracked*) di dalam Git pada rilis versi 1.0.1.

---
*Dokumen ini merupakan lampiran rekayasa perangkat lunak (Software Engineering) untuk validasi TKT.*
