# Panduan Lengkap Infrastruktur Almudaya Blockchain untuk Dosen

Panduan komprehensif ini ditujukan bagi dosen atau instruktur yang ingin menggunakan **Almudaya Blockchain** sebagai media pengajaran kelas atau demonstrasi pembuatan *Decentralized Application (DApp)*.

Platform ini adalah purwarupa *blockchain* modular yang dibangun dengan Node.js. Ia memiliki mesin *Virtual Machine* miliknya sendiri (bukan berbasis Ethereum/Solidity), namun dilengkapi dengan lapisan RPC yang dirancang agar **100% kompatibel dengan MetaMask** untuk pengujian transaksi *native*. 

---

## 1. Menjalankan Node & Akun Demonstrasi (Fitur Ganache-like)

Sebelum mahasiswa dapat berinteraksi, Anda harus menjalankan *Node* lokal yang bertugas sebagai *Server RPC* sekaligus blok penambang (_miner_).

**Langkah-langkah:**
1. Buka Terminal/Command Prompt di dalam *folder* proyek.
2. Pastikan paket dependensi telah terinstal:
   ```bash
   npm install
   ```
3. Nyalakan RPC Server:
   ```bash
   npm run rpc:start
   ```
4. **Membaca Terminal Output:**
   Sesaat setelah dijalankan, layar terminal Anda akan mencetak tampilan bergaya **Ganache**, meliputi:
   - **Mnemonic Phrase (BIP39)**: 12 kata rahasia pembentuk seluruh akun.
   - **20 Akun Demonstrasi (HD Wallet)**: Daftar alamat (*Address*) berawalan `0x...` dan setiap akun telah secara otomatis diisi dengan saldo awal sebesar **10.000 AGV**.
   - **Private Keys**: 20 *Private Keys* berformat Hexadecimal standar Ethereum yang dapat langsung disalin oleh mahasiswa.
   - **URL Koneksi & Chain ID**: Informasi URL RPC lokal (`http://127.0.0.1:8545/rpc`) dan ID rantai (`0x539` / Desimal: `1337`).

> [!TIP]
> **Praktik Kelas:** Minta mahasiswa untuk men-*copy* salah satu *Private Key* dari layar proyektor/terminal Anda, karena mereka akan membutuhkannya pada tahap berikutnya.

---

## 2. Koneksi ke MetaMask & Simulasi Transaksi Native

Meskipun ini adalah *blockchain* kustom, ia dapat merespons protokol standar Ethereum (seperti `eth_sendRawTransaction`), sehingga integrasi MetaMask berjalan mulus secara bawaan (*native*).

### A. Mengatur Jaringan (*Custom Network*)
Minta mahasiswa membuka dompet MetaMask di browser mereka dan melakukan langkah berikut:
1. Klik area **Network (Jaringan)** di atas > Pilih **Add Network (Tambah Jaringan)** > **Add a network manually**.
2. Masukkan parameter berikut:
   - **Network Name**: `Almudaya Localnet`
   - **New RPC URL**: `http://127.0.0.1:8545/rpc`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `AGV`

### B. Mengimpor Akun Demo
1. Klik pada daftar akun di MetaMask > Pilih **Import Account**.
2. Paste (tempelkan) salah satu **Private Key** (tanpa spasi ekstra) yang telah dicetak di terminal *Node*.
3. Jika berhasil, saldo akan langsung terbaca sebesar **10.000 AGV**!

### C. Simulasi Transfer Koin
Minta dua mahasiswa yang bersebelahan untuk saling mengirim sejumlah AGV menggunakan tombol **Send** di MetaMask.
*Anda akan melihat log terminal Node bereaksi memvalidasi tanda tangan kriptografi (Signature) dan memproses transaksi tersebut.*

---

## 3. Pengenalan Bahasa Smart Contract Almudaya (AVM)

Berbeda dengan blockchain konvensional, proyek edukasi ini menyertakan *Compiler* dan *Virtual Machine (AVM)* kustom berbasis abstraksi sintaksis yang amat sederhana agar mahasiswa lebih cepat paham.

**Karakteristik Utama:**
- Mendukung logika berorientasi objek yang dibungkus dalam blok `contract`.
- Status data (*World State*) disimpan menggunakan penanda `state`.
- Logika mutasi diatur di dalam `function`.
- Operasi dasar seperti `+`, `-`, `*`, `/` didukung secara _native_.

**Contoh *Smart Contract* Sederhana (Simulasi Token):**
```text
contract DemoToken {
  state totalSupply = 1000;
  state ownerBalance = 1000;

  function transfer(amount) {
    ownerBalance = ownerBalance - amount;
  }
}
```
*Simpan/catat teks kontrak di atas untuk tahap demonstrasi berikutnya.*

---

## 4. Deploy & Interaksi dengan Smart Contract (via JSON-RPC)

Pembuatan DApp sejatinya adalah proses membangun antarmuka web (Frontend) yang menembakkan instruksi JSON-RPC ke backend *Node*. Untuk memperlihatkan bagaimana "mesin" bekerja di balik layar, dosen dapat menggunakan **cURL** atau **Postman** untuk mendemonstrasikan proses kompilasi (*compile*) hingga eksekusi (*call*).

### A. Melakukan Deploy (*Instantiating Contract*)
Gunakan terminal cURL untuk mendeploy kontrak (Kirim _request_ POST ke RPC).

```bash
curl -X POST http://127.0.0.1:8545/rpc \
-H "Content-Type: application/json" \
-d '{
  "jsonrpc": "2.0",
  "method": "deployContract",
  "params": {
    "source": "contract DemoToken { state totalSupply = 1000; state ownerBalance = 1000; function transfer(amount) { ownerBalance = ownerBalance - amount; } }"
  },
  "id": 1
}'
```

**Memahami Response:**
Node akan melakukan kompilasi AST menjadi *Bytecode* seketika itu juga dan mengembalikan JSON berisi:
- `contractAddress`: Alamat permanen dari kontrak pintar Anda.
- `contractRoot`: Pengenal unik dari struktur/hirarki kontrak di dalam _Object Store_.
**(Simpan kedua nilai ini untuk langkah selanjutnya!)**

### B. Memanggil (Call) Fungsi di Dalam Kontrak
Kita akan mencoba memanggil fungsi `transfer` dengan parameter `amount: 250`. (Ganti `<ADDRESS>` dan `<ROOT>` di bawah sesuai *response* sebelumnya).

```bash
curl -X POST http://127.0.0.1:8545/rpc \
-H "Content-Type: application/json" \
-d '{
  "jsonrpc": "2.0",
  "method": "callContract",
  "params": {
    "contractAddress": "<ADDRESS>",
    "contractRoot": "<ROOT>",
    "functionName": "transfer",
    "args": {
      "amount": 250
    }
  },
  "id": 2
}'
```
*Virtual Machine Almudaya akan me-load "Memory" kontrak yang tersimpan, mengeksekusi instruksi pembagian saldo, memperbarui World State, dan melaporkan konsumsi Gas (gasUsed).*

### C. Mengecek Perubahan State (Storage)
Untuk membuktikan saldo `ownerBalance` berkurang karena telah ditransfer sebanyak 250, kita dapat melihat isi *storage* kontrak secara langsung:

```bash
curl -X POST http://127.0.0.1:8545/rpc \
-H "Content-Type: application/json" \
-d '{
  "jsonrpc": "2.0",
  "method": "getContractStorage",
  "params": {
    "contractAddress": "<ADDRESS>"
  },
  "id": 3
}'
```

Anda akan menerima _response_ yang memperlihatkan:
```json
{
  "totalSupply": 1000,
  "ownerBalance": 750
}
```

---

> [!IMPORTANT]
> **Kaitan dengan DApp Frontend**:
> Untuk tugas pengembangan DApp bagi mahasiswa, mahasiswa cukup menggunakan JavaScript murni (menggunakan perintah `fetch`) di sisi antarmuka Frontend mereka untuk mengirimkan _payload_ JSON-RPC (menggantikan penggunaan cURL manual di terminal) menuju endpoint `http://127.0.0.1:8545/rpc`. Hal ini membuka jalan kreasi aplikasi DApp penuh!

---

## 5. Contoh Implementasi Frontend DApp (HTML & Vanilla JS)

Berikut ini adalah *snippet* kode HTML sederhana yang dapat langsung diberikan kepada mahasiswa. Kode ini mendemonstrasikan antarmuka (_user interface_) yang berkomunikasi secara langsung ke jaringan *blockchain* lokal kita menggunakan antarmuka **Fetch API** bawaan *browser*.

Simpan kode di bawah ini sebagai file `index.html`, lalu buka dengan _browser_ (Chrome/Firefox/Edge).

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo DApp Almudaya</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; }
        .card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        input, button { padding: 8px; margin: 5px 0; width: 100%; box-sizing: border-box; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Almudaya DApp Explorer</h1>

    <div class="card">
        <h3>Cek Saldo (Account Balance)</h3>
        <label>Alamat (Address):</label>
        <input type="text" id="addressInput" placeholder="Contoh: 0x123abc..." />
        <button onclick="checkBalance()">Cek Saldo</button>
        <p><strong>Hasil:</strong> <span id="balanceResult">-</span> AGV</p>
    </div>

    <div class="card">
        <h3>Cek Storage Kontrak (Smart Contract)</h3>
        <label>Alamat Kontrak (Contract Address):</label>
        <input type="text" id="contractAddressInput" placeholder="Contoh: 0xabc123..." />
        <button onclick="checkStorage()">Lihat Storage</button>
        <pre id="storageResult">Data storage akan tampil di sini...</pre>
    </div>

    <script>
        // Konfigurasi endpoint RPC Lokal Node Anda
        const RPC_URL = "http://127.0.0.1:8545/rpc";

        // Fungsi Helper untuk memanggil JSON-RPC
        async function rpcCall(method, params = {}) {
            try {
                const response = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: method,
                        params: params,
                        id: Date.now()
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || "RPC Error");
                return data.result;
            } catch (err) {
                alert("Gagal menghubungi Node: " + err.message);
                console.error(err);
            }
        }

        // Fungsi mengecek saldo akun
        async function checkBalance() {
            const address = document.getElementById("addressInput").value;
            if (!address) return alert("Masukkan alamat!");
            
            document.getElementById("balanceResult").innerText = "Memuat...";
            const balance = await rpcCall("getBalance", { address });
            
            if (balance !== undefined) {
                document.getElementById("balanceResult").innerText = balance;
            }
        }

        // Fungsi membaca isi state/storage sebuah smart contract
        async function checkStorage() {
            const contractAddress = document.getElementById("contractAddressInput").value;
            if (!contractAddress) return alert("Masukkan alamat kontrak!");
            
            document.getElementById("storageResult").innerText = "Memuat data dari blockchain...";
            const storage = await rpcCall("getContractStorage", { contractAddress });
            
            if (storage !== undefined) {
                document.getElementById("storageResult").innerText = JSON.stringify(storage, null, 2);
            }
        }
    </script>
</body>
</html>
```

### Penjelasan Skrip untuk Mahasiswa:
1. Kode JS mendefinisikan fungsi `rpcCall()` yang bertindak sebagai jembatan untuk melakukan **HTTP POST** (melalui `fetch`) ke Node lokal Anda di _port_ `8545`.
2. Saat fungsi dijalankan, _browser_ menyusun spesifikasi standar **JSON-RPC** yang berisi `method` (seperti `getBalance` atau `getContractStorage`) dan argument parameternya.
3. Fungsi ini sangat dinamis; Anda bisa dengan mudah mengembangkannya untuk memanggil metode lain seperti `deployContract` atau `callContract` dari antarmuka Web!
