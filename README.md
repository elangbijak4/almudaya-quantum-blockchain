# Almudaya Quantum Blockchain (AQB)

> Building the Foundation of Post-Quantum Blockchain for Research, Education, and Industrial Innovation.

Almudaya Quantum Blockchain (AQB) is a modular Ethereum-inspired blockchain prototype designed from the ground up for the post-quantum era.

Instead of relying on classical public-key cryptography such as secp256k1 (ECDSA), AQB adopts NIST-standardized Post-Quantum Cryptography (PQC) as the foundation of its cryptographic architecture. The current prototype integrates lattice-based digital signatures while preserving a familiar Ethereum-like developer experience.

---

# Features

- 🔐 Post-Quantum Digital Signatures (NIST FIPS 204 / ML-DSA-Dilithium)
- 🧩 Modular Blockchain Architecture
- 🌐 Ethereum-style JSON-RPC Interface
- ⚡ Developer-Friendly Local Blockchain Environment
- 📦 Post-Quantum Object Store
- 🏛 Research & Educational Platform

---

# Architecture

The project is organized into independent modules:

| Module | Description |
|---------|-------------|
| core | Blockchain lifecycle, validation, consensus orchestration |
| crypto | Hashing and cryptographic primitives |
| wallet | PQC wallet management and signature providers |
| worldstate | State abstraction and storage |
| vm | Smart contract execution environment |
| contracts | Internal scripting language compiler |
| rpc | Ethereum-compatible JSON-RPC server |

---

# Getting Started

## Requirements

- Node.js 24+
- npm

Install dependencies

```bash
npm install
```

Run the blockchain node

```bash
npm run rpc:start
```

The node starts at

```
http://127.0.0.1:8545
```

Upon startup, AQB automatically generates 20 Post-Quantum wallets ready for experimentation. A built-in Web Dashboard is also available through the browser.

---

# Documentation

Detailed documentation is available in:

- Scientific Documentation
- Academic User Guide

---

# AI-Assisted Development

This project was developed using an AI-assisted software engineering workflow.

The software architecture was iteratively designed and refined through conversations with ChatGPT, helping define the modular blockchain structure, subsystem responsibilities, and development roadmap.

Implementation was primarily accelerated using Codex for code generation, refactoring, and iterative component development. As development progressed, additional AI-assisted coding tools were used to continue implementation after Codex usage limits were reached.

All architectural decisions, integration, testing, debugging, and final validation were performed by the project author.

---

# Roadmap

- ✅ Modular blockchain node
- ✅ Ethereum-style JSON-RPC
- ✅ Post-Quantum wallet support
- ✅ PQC transaction signatures
- 🔄 Smart Contract enhancements
- 🔄 ML-KEM integration
- 🔄 Cross-node networking
- 🔄 Performance benchmarking
- 🔄 Developer SDK

---

# License

This project is intended for research and educational purposes.
