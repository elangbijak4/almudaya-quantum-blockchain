const fs = require('fs');

async function deploy() {
  console.log("-------------------------------------------------");
  console.log(" Almudaya CLI - Smart Contract Deployment Engine ");
  console.log("-------------------------------------------------\n");
  
  console.log("[1] Membaca file QuantumIdentityRegistry.alm...");
  let sourceCode;
  try {
    sourceCode = fs.readFileSync('c:\\almudaya-blockchain\\examples\\smart-contracts\\QuantumIdentityRegistry.alm', 'utf8');
  } catch (err) {
    console.error("Gagal membaca file! Pastikan file ada di path yang benar.");
    return;
  }

  const payload = {
    jsonrpc: "2.0",
    method: "deployContract",
    params: {
      source: sourceCode
    },
    id: 2
  };

  console.log("[2] Mengirim transaksi ke Node (http://127.0.0.1:8545/rpc)...");
  
  try {
    const response = await fetch('http://127.0.0.1:8545/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("\n[3] 🚀 BERHASIL! Respons dari Server Node:\n");
    console.log(JSON.stringify(data, null, 2));
    
    console.log("\n=================================================");
    console.log("  Silakan ambil SCREENSHOT dari tampilan ini!  ");
    console.log("=================================================");

  } catch (err) {
    console.error("\n[!] Gagal terhubung ke node! Pastikan almudaya-quantum sudah berjalan di terminal lain.");
    console.error("Error:", err.message);
  }
}

deploy();
