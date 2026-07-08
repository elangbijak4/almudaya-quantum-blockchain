# Panduan Penggunaan Lengkap: Almudaya Blockchain v0.2.0-pqc
**(Edisi Akademik untuk Dosen dan Mahasiswa)**

Selamat datang di ekosistem **Almudaya Blockchain**! Panduan ini dirancang untuk memandu dosen dan mahasiswa dalam menjalankan simulasi teknologi buku besar terdistribusi berbasis **Post-Quantum Cryptography** (Dilithium) secara lokal.

Di dalam ekosistem ini, *node* akan bertindak layaknya Ganache/Hardhat, di mana dompet dan kunci Anda dikelola oleh *node* secara aman di lingkungan lokal untuk keperluan pembelajaran dan riset Smart Contract.

---

## 1. Prasyarat Sistem
Sebelum memulai, pastikan komputer Anda telah terinstal:
- **Node.js** (Versi 24 atau yang lebih baru sangat direkomendasikan)
- **NPM** (Node Package Manager)
- Akses terminal/Command Prompt/PowerShell.

---

## 2. Instalasi dan Menjalankan Jaringan Blockchain

### Langkah 1: Kloning / Akses Direktori Proyek
Buka terminal dan masuk ke dalam direktori proyek utama blockchain (misalnya `almudaya-blockchain`):
```bash
cd c:\almudaya-blockchain
```

### Langkah 2: Instalasi Dependensi
Pastikan semua pustaka pihak ketiga, termasuk algoritma kriptografi `@asanrom/dilithium`, telah terpasang:
```bash
npm install
```

### Langkah 3: Menjalankan Node dan RPC Server
Mulai blockchain Anda dengan perintah berikut:
```bash
npm run rpc:start
```
Saat dijalankan, terminal akan memunculkan **20 Alamat Demo** beserta saldo awal sebesar `10000 AGV`. Akun-akun ini telah terenkripsi secara otomatis menggunakan algoritma Post-Quantum *Dilithium Level 2*.

---

## 3. Mengakses Dashboard Antarmuka Pengguna (GUI)
Almudaya Blockchain dilengkapi dengan Dashboard Website sederhana untuk memudahkan pemantauan interaksi blockchain tanpa mengetik baris perintah terus-menerus.

1. Saat RPC Server berjalan, buka Web Browser (Chrome, Firefox, Safari).
2. Akses alamat: **[http://127.0.0.1:8545/](http://127.0.0.1:8545/)** atau **[http://localhost:8545/](http://localhost:8545/)**.
3. Di Dashboard, Anda dapat melihat daftar dompet Anda, memeriksa saldo, dan memantau status blockchain secara real-time.

---

## 4. Penulisan dan Deployment Smart Contract (Kontrak Cerdas)
Almudaya Blockchain mendukung bahasa sintaksis sederhana khusus yang sangat cocok untuk keperluan pendidikan.

Berikut adalah sintaksis dasar deklarasi bahasa Almudaya Smart Contract:
- `contract [NamaKontrak]`
- `state [variabel] = [nilai_awal];` (mendeklarasikan penyimpanan di dalam blockchain)
- `function [nama_fungsi](param1, param2) { ... }`

### Contoh 1: Kontrak Pencatatan Kehadiran (Absensi)
```javascript
contract AbsensiMahasiswa {
  // Total kehadiran global
  state totalHadir = 0;
  
  // Mahasiswa mendaftarkan absensi (mengirim angka jam masuk)
  function catatKehadiran(jamMasuk) {
    totalHadir = totalHadir + 1;
  }
}
```

### Contoh 2: Kontrak Penilaian Ujian (Nilai)
```javascript
contract PenilaianUjian {
  state nilaiMahasiswa = 0;
  state rataRataKelas = 75;

  // Dosen memasukkan nilai tugas dan UTS
  function inputNilai(tugas, uts) {
    // Bobot penilaian bisa dilakukan dengan ekspresi aritmatika sederhana
    nilaiMahasiswa = (tugas * 40 / 100) + (uts * 60 / 100);
  }
}
```

### Cara Mendeploy Smart Contract:
Dalam simulasi ini, Anda dapat mendeploy (menerbitkan) *Smart Contract* ini ke dalam *network* lokal dengan melakukan HTTP *request* ke alamat RPC `http://127.0.0.1:8545/rpc`.

Berikut contoh pemanggilan dari terminal atau *script* eksternal menggunakan `curl`:
```bash
curl -X POST http://127.0.0.1:8545/rpc \
-H "Content-Type: application/json" \
-d '{"jsonrpc":"2.0", "method":"deployContract", "params": [{"source": "contract AbsensiMahasiswa { state totalHadir = 0; function catatKehadiran(jamMasuk) { totalHadir = totalHadir + 1; } }"}], "id": 1}'
```
Setelah kontrak ter-*deploy*, Anda akan mendapatkan balasan berupa *Address/Alamat* dari kontrak tersebut untuk dipanggil menggunakan metode `callContract`.

---

## 5. Pemecahan Masalah (Troubleshooting) Umum

**A. "Invalid transaction signature" saat transfer AGV**
> **Solusi:** Hal ini mengindikasikan bahwa data (payload) dari transaksi Anda dimodifikasi sebelum diverifikasi, atau RPC gagal mendapatkan kunci publik Dilithium Anda. Selalu gunakan `eth_sendTransaction` dan pastikan Anda mencantumkan alamat `from` (salah satu dari 20 alamat yang dicetak di terminal) dengan tepat.

**B. "Unknown method: evm_mine"**
> **Solusi:** Almudaya RPC Engine tidak menggunakan standar `evm_mine` bawaan hardhat. Gunakan metode `minePendingTransactions` pada layanan RPC.

**C. RPC Server Gagal Mulai (Port Already in Use)**
> **Solusi:** Port `8545` mungkin digunakan oleh instance Ganache atau proses *node* lain di latar belakang. Tutup aplikasi bersangkutan, atau gunakan port lain dengan menyetel *Environment Variable* `RPC_PORT=8546 npm run rpc:start`.

---
*Dibuat oleh Almudaya Quantum Labs* 
*Selamat Menjelajah Dunia Post-Quantum Web3!*
