# worldstate

Modul ini menyediakan current world state yang terpisah dari blockchain history.

Komponen utama:

- `AccountState`: model account dengan `balance`, `nonce`, dan `storage`.
- `JsonStateRepository`: persistent JSON database untuk snapshot state saat ini.
- `WorldStateManager`: engine untuk membaca/memperbarui state, transfer balance, storage per-account, dan `stateRoot`.
- `WorldStateManager`: engine untuk membaca/memperbarui state, transfer balance, storage per-account, snapshot storage kontrak, dan `stateRoot`.

Aturan desain:

- history block/transaction tetap milik `core`, bukan `worldstate`.
- seluruh serialization memakai canonical ordering melalui util serialisasi stabil.
- `stateRoot` dihitung dari content hash atas isi state yang sudah dinormalisasi.
- database hanya menyimpan current state snapshot dan metadata `stateRoot`, bukan history chain.
