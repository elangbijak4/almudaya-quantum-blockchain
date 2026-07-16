# System Design Specification (SDS)
**Nama Proyek:** Almudaya Quantum Blockchain
**Versi:** 1.0.1
**Tanggal Terbit:** 16 Juli 2026
**Dokumen Induk:** User Requirement Specification (URS)

---

## 1. Pendahuluan
*System Design Specification* (SDS) ini menjabarkan arsitektur perangkat lunak tingkat tinggi (*high-level architecture*) dan spesifikasi desain untuk **Almudaya Quantum Blockchain**. Dokumen ini merincikan bagaimana persyaratan yang tertulis di dalam URS diimplementasikan secara teknis, khususnya integrasi modul *Post-Quantum Cryptography* (CRYSTALS-Dilithium) ke dalam infrastruktur bergaya Ethereum.

---

## 2. Arsitektur Sistem (High-Level Architecture)
Sistem ini menggunakan pola desain **Modular Dependency Injection** yang dikelola oleh *Awilix container*. Seluruh komponen dipisahkan menjadi layanan-layanan tunggal (*single-responsibility services*) yang diregistrasi secara dinamis.

Arsitektur terdiri dari 4 lapisan (Layer) utama:
1. **Application/Network Layer:** JSON-RPC Server (Express.js) & Antarmuka Dashboard (React/Static HTML).
2. **Core Blockchain Layer:** `Blockchain` (State Manager, Block Processor) dan `VirtualMachine` (EVM-like execution).
3. **Cryptography & Wallet Layer:** `WalletManager`, `AddressDeriver`, `CryptoProvider`, dan `SignatureProvider`.
4. **Storage Layer:** `WorldStateManager` dan `PostQuantumObjectStore`.

---

## 3. Spesifikasi Komponen Kunci

### 3.1. Modul SignatureProvider (Kriptografi Kuantum)
Berfungsi sebagai *plug-in* utama untuk menggantikan ECDSA (Elliptic Curve).
- **Kelas:** `DilithiumSignatureProvider`
- **Pustaka Inti:** `@asanrom/dilithium`
- **Fungsi Utama:** 
  - `generateKeypair()`: Membangkitkan *Public Key* (1312 Bytes) dan *Private Key* (2528 Bytes) untuk Dilithium Level 2.
  - `sign(messageDigest, privateKey)`: Menghasilkan tanda tangan digital tahan kuantum berukuran 2420 Bytes.
  - `verify(messageDigest, signature, publicKey)`: Mengonfirmasi integritas transaksi dan kepemilikan dompet.

### 3.2. Manajer Dompet (WalletManager)
- Bertanggung jawab memetakan kunci publik ke alamat jaringan (Address). 
- Alamat (*Address*) diturunkan menggunakan algoritma **Keccak-256** (*hash*) dari gabungan (konkatenasi) *Metadata Algoritma* dan *Public Key* Dilithium, kemudian dipotong (sliced) menjadi ukuran 40 karakter Hex (mirip Ethereum).

### 3.3. JSON-RPC Interface (Transport Protocol)
- **Kelas:** `ExpressJsonRpcTransport`
- Menghandle koneksi HTTP POST pada port `8545`. Payload RPC dikonversi dan diteruskan ke metode internal `BlockchainRpcService`.
- *Handling* tanda tangan PQC pada RPC diselesaikan dengan memastikan `transactionPayload` secara konsisten ter-serialize (menggunakan `stable-serialize`) tanpa data *undefined* (contoh: `data: null`).

### 3.4. Penyimpanan (Storage & World State)
- **State Repository:** `JsonStateRepository` menyimpan keadaan (*state*) buku besar (ledger/saldo) ke dalam berkas `worldstate.json`.
- **PostQuantumObjectStore:** Bertugas menyimpan objek blob besar (seperti payload kontrak pintar atau indeks blok metadata) menggunakan pendekatan *Content-Addressed Storage* berbasis *hash* pohon Merkle.

---

## 4. Alur Proses (Flow) Penandatanganan Transaksi
1. Pengguna (melalui antarmuka dasbor) melakukan permintaan pengiriman token (AGV).
2. `WalletManager` mengambil *Private Key* (Dilithium) pengirim yang tersimpan di memori lokal.
3. Parameter transaksi (From, To, Amount, Nonce, Data) diubah menjadi rentetan *String* (serialize) lalu di-*hash* dengan Keccak-256.
4. `DilithiumSignatureProvider` menggunakan *hash* transaksi tersebut dan *Private Key* untuk mengeksekusi proses `sign()`.
5. Tanda tangan disisipkan kembali ke dalam objek Transaksi.
6. Node menerima transaksi ini dan memanggil `verify()`. Jika valid, saldo diubah di dalam `WorldStateManager`.

---

## 5. Kebutuhan Lingkungan Pengembangan
- **Runtime:** Node.js (v18.0.0 atau lebih tinggi)
- **Sistem Operasi:** Lintas platform (Windows, macOS, Linux)
- **Manajer Paket:** NPM (v9+)
- **Perangkat Keras:** Prosesor x64 / ARM64 standar, RAM minimal 2GB (direkomendasikan 4GB untuk manajemen *state* kunci berukuran besar).

---

## Lampiran: Pseudocode Algoritma (Formal Specification)
Berikut adalah *pseudocode* fungsional dari mekanisme penandatanganan dan verifikasi tanda tangan transaksi menggunakan CRYSTALS-Dilithium di dalam *Wallet Manager* (Memenuhi kriteria TKT 4 untuk deskripsi formal algoritma sistem).

### A. Algoritma Pembangkitan Akun (Keypair & Address Generation)
```pascal
PROCEDURE GenerateQuantumAccount()
BEGIN
    // 1. Bangkitkan pasangan kunci Dilithium
    (PublicKey, PrivateKey) <- Dilithium.KeyGen(Level=2)
    
    // 2. Format metadata
    Metadata <- { "algorithm": "Dilithium2" }
    
    // 3. Serialisasi dan Hashing untuk alamat dompet
    SerializedKey <- JSON.Stringify({ Metadata, PublicKey })
    Digest <- Keccak256(SerializedKey)
    
    // 4. Potong 20 byte terakhir (40 karakter hex) sebagai Address
    Address <- "0x" + Substring(Digest, Length(Digest) - 40, Length(Digest))
    
    RETURN Account(Address, PublicKey, PrivateKey, Metadata)
END
```

### B. Algoritma Penandatanganan Transaksi (Transaction Signing)
```pascal
PROCEDURE SignTransaction(Transaction, PrivateKey)
BEGIN
    // 1. Ekstrak muatan yang akan ditandatangani
    Payload <- {
        from: Transaction.from,
        to: Transaction.to,
        amount: Transaction.amount,
        nonce: Transaction.nonce,
        data: Transaction.data  // pastikan null values direpresentasikan secara konsisten
    }
    
    // 2. Normalisasi Payload menjadi urutan string yang deterministik
    SerializedPayload <- StableSerialize(Payload)
    
    // 3. Buat intisari pesan (Message Digest)
    MessageDigest <- Keccak256(SerializedPayload)
    
    // 4. Proses tanda tangan Kuantum
    Signature <- Dilithium.Sign(MessageDigest, PrivateKey)
    
    RETURN Signature
END
```

### C. Algoritma Verifikasi Transaksi (Transaction Verification)
```pascal
PROCEDURE VerifyTransaction(Transaction, PublicKey, Signature)
BEGIN
    // 1. Bangkitkan ulang intisari pesan dari Transaksi
    Payload <- ExtractPayload(Transaction)
    SerializedPayload <- StableSerialize(Payload)
    MessageDigest <- Keccak256(SerializedPayload)
    
    // 2. Validasi Kriptografis
    IsValid <- Dilithium.Verify(MessageDigest, Signature, PublicKey)
    
    IF IsValid == FALSE THEN
        THROW "SignatureValidationError: Tanda tangan Dilithium tidak valid"
    END IF
    
    // 3. Validasi Kepemilikan Address
    ExpectedAddress <- DeriveAddressFromPublicKey(PublicKey)
    IF ExpectedAddress != Transaction.from THEN
        THROW "AddressMismatchError: Kunci publik tidak sesuai dengan alamat pengirim"
    END IF
    
    RETURN TRUE
END
```

---
*Dokumen dirancang untuk melengkapi portofolio pengembangan perangkat lunak tingkat riset.*
