# core

Modul ini sekarang memuat domain blockchain deterministik dasar:

- `Transaction`: model transaksi sederhana termasuk coinbase transaction.
- `Block`: model block dengan SHA256 hash, Merkle root, `stateRoot`, difficulty mining, dan validasi link ke `previousHash`.
- `Blockchain`: chain manager dengan genesis block, initial supply, pending transaction list, mining reward, finalisasi block ke `worldstate`, dan validasi chain.

Aturan deterministik:

- Tidak memakai `Date.now()` atau random source.
- Genesis block selalu dibentuk dari konfigurasi tetap.
- Timestamp block baru diturunkan dari block sebelumnya.
- Hashing dan serialisasi memakai util stabil agar urutan key object tidak mengubah hasil hash.
- Saat block difinalisasi, transaksi dieksekusi berurutan terhadap snapshot state, `stateRoot` dihitung ulang, lalu dimasukkan ke header sebelum mining.
