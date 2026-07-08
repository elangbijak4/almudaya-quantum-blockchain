# vm

Modul ini sekarang memuat VM stack-based deterministik yang terisolasi.

Fitur:

- stack dan memory lokal per eksekusi
- interpreter sinkron berbasis instruction array
- isolated execution context tanpa filesystem, network, waktu, random, atau async
- execution context eksplisit dengan metadata dan placeholder gas
- deterministic step limit untuk mencegah loop tak berujung menggantung proses

Opcode awal:

- `PUSH`
- `POP`
- `ADD`
- `SUB`
- `MUL`
- `DIV`
- `STORE`
- `LOAD`
- `JMP`
- `RETURN`

Format program:

```js
[
  { opcode: 'PUSH', value: 2 },
  { opcode: 'PUSH', value: 3 },
  { opcode: 'ADD' },
  { opcode: 'RETURN' }
]
```

VM menghasilkan output identik untuk input program dan execution context yang identik.

Integrasi world state:

- `executeContractFunction(...)` memuat storage kontrak dari `worldstate`
- key `state.*` dipetakan ke storage kontrak terisolasi per `contractAddress`
- key `arg.*` dipakai untuk parameter call
- setelah sukses, hanya `state.*` yang dikomit kembali ke `worldstate`
