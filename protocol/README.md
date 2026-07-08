# protocol

Modul ini sekarang juga memuat simulasi consensus abstraction yang sadar availability untuk PQ object.

Komponen utama:

- `PqPropagationService`: mensimulasikan propagasi PQ object ke validator
- `AvailabilityVerifier`: mengecek availability PQ object lokal
- `ValidatorNode`: menerima PQ object, memverifikasi availability, dan memberi vote
- `AvailabilityAwareConsensus`: mengumpulkan vote validator untuk block proposal

Aturan availability:

- block tidak valid jika transaksi PQ-nya merujuk commitment yang objeknya belum tersedia secara lokal
- validator harus menerima dan menyimpan PQ object sebelum voting dapat menerima block
- `pqRoot` harus cocok dengan commitment hash transaksi di block
