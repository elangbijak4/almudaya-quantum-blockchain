const { performance } = require('perf_hooks');

const RPC_URL = 'http://127.0.0.1:8545/rpc';
const TRANSACTIONS_COUNT = 50;

async function rpcCall(method, params = []) {
  const payload = {
    jsonrpc: "2.0",
    method,
    params,
    id: 1
  };
  
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.result;
}

async function sendTransaction(id, from, to) {
  const payload = {
    jsonrpc: "2.0",
    method: "eth_sendTransaction",
    params: [{
      from: from,
      to: to,
      value: "0x1"
    }],
    id
  };

  const start = performance.now();
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  console.log("=============================================================");
  console.log("   ALMUDAYA QUANTUM - PERFORMANCE & LATENCY BENCHMARK TOOL   ");
  console.log("=============================================================\n");
  
  console.log("Menghubungkan ke Node dan mengambil alamat akun...");
  let accounts;
  try {
    accounts = await rpcCall('eth_accounts');
    if (!accounts || accounts.length < 2) {
      throw new Error("Node tidak memiliki cukup akun (minimal 2 dibutuhkan).");
    }
  } catch (err) {
    console.error("[!] Gagal mengambil akun dari Node:", err.message);
    return;
  }
  
  const accountFrom = accounts[0];
  const accountTo = accounts[1];
  console.log(`Berhasil! Menggunakan Akun Pengirim: ${accountFrom}`);

  console.log(`\nMenguji throughput untuk ${TRANSACTIONS_COUNT} transaksi Post-Quantum (Dilithium)...`);
  
  let totalLatency = 0;
  let successCount = 0;

  // Waktu mulai keseluruhan
  const globalStart = performance.now();

  for (let i = 1; i <= TRANSACTIONS_COUNT; i++) {
    try {
      process.stdout.write(`\rMemproses transaksi ke-${i} / ${TRANSACTIONS_COUNT}...`);
      const latency = await sendTransaction(i, accountFrom, accountTo);
      totalLatency += latency;
      successCount++;
    } catch (err) {
      console.error(`\n[!] Gagal pada transaksi ${i}: ${err.message}`);
      break;
    }
  }

  // Waktu selesai keseluruhan
  const globalEnd = performance.now();
  
  if (successCount === 0) {
    console.log("\n\nTidak ada transaksi yang berhasil. Benchmark dihentikan.");
    return;
  }

  const totalTimeSec = (globalEnd - globalStart) / 1000;
  const avgLatency = totalLatency / successCount;
  const tps = successCount / totalTimeSec;

  console.log("\n\n-------------------------------------------------------------");
  console.log("                    [ HASIL BENCHMARK ]                      ");
  console.log("-------------------------------------------------------------");
  console.log(` ✅ Total Transaksi Berhasil : ${successCount} tx`);
  console.log(` ⏱️ Total Waktu Eksekusi     : ${totalTimeSec.toFixed(3)} detik`);
  console.log(` 🚀 Throughput (TPS)         : ${tps.toFixed(2)} tx/detik`);
  console.log(` ⚡ Rata-rata Latensi        : ${avgLatency.toFixed(2)} ms / transaksi`);
  console.log("-------------------------------------------------------------\n");
  
  console.log("Catatan: Eksekusi transaksi ini menggunakan kriptografi Kuantum Dilithium,");
  console.log("yang secara inheren membutuhkan komputasi lebih tinggi dari ECDSA klasik.");
  console.log("\n=============================================================");
  console.log("      Silakan ambil SCREENSHOT dari tampilan ini!      ");
  console.log("=============================================================");
}

runBenchmark();
