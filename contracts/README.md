# contracts

Modul ini sekarang memiliki compiler minimal Solidity-like ke custom bytecode VM.

Pipeline:

- `source`
- `tokenizer`
- `parser`
- `AST`
- `bytecode`

Syntax minimal yang didukung:

- `contract`
- `state`
- `function`
- assignment
- arithmetic sederhana `+ - * /`

Output compiler:

- token stream
- AST contract
- initial state memory
- bytecode per function yang kompatibel dengan opcode VM
