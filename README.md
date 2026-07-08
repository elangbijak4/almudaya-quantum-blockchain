# Modular Blockchain Prototype

Prototype ini adalah baseline project blockchain modular berbasis Node.js dengan gaya arsitektur Ethereum-like yang disederhanakan.

## Prinsip desain

- Setiap folder mewakili bounded module dengan entrypoint sendiri.
- `index.js` hanya mengekspor kontrak publik modul.
- `interfaces/` menyimpan abstraction sederhana agar implementasi bisa diganti.
- `services/` berisi placeholder logic awal, bukan implementasi final.
- Antar modul berinteraksi melalui dependency yang eksplisit dan tipis.
- Serialisasi dasar dibuat deterministik untuk kebutuhan hashing, penyimpanan, dan metadata placeholder.

## Struktur modul

- `core`: orkestrasi chain lifecycle dan coordination layer.
- `crypto`: hashing, signature, dan primitive kriptografi.
- `wallet`: manajemen akun dan signing facade.
- `worldstate`: state account/storage abstraction.
- `storage`: persistence adapter abstraction.
- `vm`: execution environment abstraction.
- `contracts`: contract artifact dan registry placeholder.
- `protocol`: message dan sync protocol placeholder.
- `rpc`: transport/API boundary untuk client.
- `utils`: helper umum lintas modul.

## Status

Belum ada fitur blockchain besar yang diimplementasikan. Struktur ini hanya menyiapkan fondasi dependency modular agar pengembangan berikutnya tetap rapi.

## Dokumentasi penggunaan

- Panduan instalasi, first run, RPC, MetaMask, dan smart contract tersedia di `docs/PETUNJUK_APLIKASI_BLOCKCHAIN.md`.
- Entry point server RPC lokal tersedia di `rpc/server.js` dan dapat dijalankan dengan `npm run rpc:start`.
- Demo browser tersedia di `public/` dan otomatis disajikan oleh server pada `http://127.0.0.1:8545/`.
