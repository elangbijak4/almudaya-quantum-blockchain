# wallet

Modul ini menangani akun, address, signing, dan verifikasi signature tanpa mengikat blockchain core ke algoritma tertentu.

Komponen utama:

- `SignatureProviderInterface`: abstraction untuk `generateKeypair()`, `sign()`, dan `verify()`.
- `Secp256k1SignatureProvider`: implementasi awal berbasis ECC `secp256k1`.
- `AddressDeriver`: derivasi address deterministik dari public key dan metadata algoritma.
- `WalletAccount`: model akun wallet.
- `WalletManager`: facade untuk generate wallet, signing, dan verification.

Catatan arsitektur:

- `core` tidak perlu tahu algoritma signature apa yang dipakai.
- metadata `algorithm` dibawa oleh keypair dan signature agar nanti mudah menambah provider post-quantum.
- derivasi address dipisah dari provider signature supaya skema address bisa diganti tanpa mengganti algoritma signature.
