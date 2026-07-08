# rpc

Modul ini sekarang menyediakan JSON-RPC layer berbasis Express.js.

Method yang tersedia:

- `sendTransaction`
- `getBalance`
- `deployContract`
- `callContract`
- `getBlock`
- `getStateRoot`

Arsitektur:

- `ExpressJsonRpcTransport`: HTTP transport JSON-RPC 2.0 berbasis Express
- `BlockchainRpcService`: implementasi method RPC untuk blockchain, state, dan contract runtime
- `RpcServer`: wiring antara transport dan service methods
