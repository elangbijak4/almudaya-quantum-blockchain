# storage

Modul ini sekarang memiliki dua lapisan:

- adapter persistence generik untuk state biasa
- content-addressed object storage untuk smart contract dan contract storage

Fitur content-addressed storage:

- objek immutable disimpan berdasarkan hash kriptografis
- layout direktori `storage/contracts/aa/bb/hash`
- directory hashing ala Git/IPFS untuk tree root
- `contractRoot`, `codeHash`, dan `storageHash` dihasilkan tanpa menyimpan bytecode penuh ke block

Contract block reference yang diharapkan:

- `contractRoot`
- `codeHash`
- `storageHash`
