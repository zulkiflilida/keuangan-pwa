// ====== GANTI DENGAN URL WEB APP ANDA ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwztpzWA1Nz9rDUUT0hMaWU2W3-B0nF9JvzsjoBD5IxGs0rhOSw2_cW6mchkAdh8rFz/exec"; 

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// Helper Notifikasi
function showAlert(message, isError = false) {
    const box = document.getElementById('alertBox');
    if (!box) return; // Safety check
    box.className = `p-4 rounded-lg text-sm font-bold text-white shadow-lg mb-4 block ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
    box.innerText = message;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => box.classList.add('hidden'), 5000);
}

// Helper membaca File ke murni Base64 Text
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}

// Fungsi Load Data
async function loadData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const json = await res.json();
        
        if (json.status === 200) {
            const d = json.data;
            document.getElementById('txtSaldo').innerText = formatRp(d.saldo);
            document.getElementById('txtMasuk').innerText = formatRp(d.masuk);
            document.getElementById('txtKeluar').innerText = formatRp(d.keluar);
            
            const tbody = document.getElementById('tabelRiwayat');
            if(!tbody) return;
            
            tbody.innerHTML = '';
            if(d.histori.length === 0) {
                tbody.innerHTML = `<tr><td class="py-4 text-center text-gray-400">Belum ada transaksi</td></tr>`;
                return;
            }

            d.histori.forEach(trx => {
                const isMasuk = trx.tipe === 'Masuk';
                const formatTgl = new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                const notaHTML = trx.url_bukti !== "-" && trx.url_bukti !== "Gagal Upload" 
                    ? `<a href="${trx.url_bukti}" target="_blank" class="text-xs text-blue-500 hover:underline">Lihat Nota</a>` 
                    : `<span class="text-xs text-gray-400">Tanpa Nota</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-3 px-2">
                        <p class="font-bold text-gray-800">${trx.kategori}</p>
                        <p class="text-xs text-gray-500">${formatTgl} • ${notaHTML}</p>
                    </td>
                    <td class="py-3 px-2 text-right">
                        <p class="font-bold ${isMasuk ? 'text-blue-600' : 'text-red-600'}">
                            ${isMasuk ? '+' : '-'}${formatRp(trx.nominal)}
                        </p>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Gagal load data", error);
    }
}

// PEMBUNGKUS UTAMA: Menunggu HTML benar-benar siap
document.addEventListener('DOMContentLoaded', () => {
    // 1. Set default tanggal
    const tglInput = document.getElementById('inputTanggal');
    if (tglInput) tglInput.valueAsDate = new Date();

    // 2. Load data awal
    loadData();

    // 3. Event Listener Form
    const formKas = document.getElementById('formKas');
    if (formKas) {
        formKas.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            const fileInput = document.getElementById('inputFoto');
            
            btn.disabled = true;
            btn.innerText = "Mengunggah Data...";
            btn.classList.add('opacity-70');

            try {
                let base64String = null;
                let mimeType = null;

                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if(file.size > 2 * 1024 * 1024) throw new Error("Ukuran foto maksimal 2MB");
                    mimeType = file.type;
                    base64String = await getBase64(file);
                }

                const payload = {
                    tanggal: document.getElementById('inputTanggal').value,
                    tipe: document.getElementById('inputTipe').value,
                    nominal: document.getElementById('inputNominal').value,
                    kategori: document.getElementById('inputKategori').value,
                    metodeBayar: document.getElementById('inputMetode').value,
                    catatan: document.getElementById('inputCatatan').value,
                    fotoBase64: base64String,
                    mimeType: mimeType
                };

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    redirect: 'follow',
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                
                if (result.status === 201) {
                    showAlert("Berhasil mencatat transaksi kas!");
                    formKas.reset();
                    if (tglInput) tglInput.valueAsDate = new Date();
                    loadData();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                showAlert(error.message, true);
            } finally {
                btn.disabled = false;
                btn.innerText = "Simpan Transaksi";
                btn.classList.remove('opacity-70');
            }
        });
    }
});