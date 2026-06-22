const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwztpzWA1Nz9rDUUT0hMaWU2W3-B0nF9JvzsjoBD5IxGs0rhOSw2_cW6mchkAdh8rFz/exec"; 
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

function showAlert(message, isError = false) {
    const box = document.getElementById('alertBox');
    if (!box) return; 
    box.className = `p-4 rounded-lg text-sm font-bold text-white shadow-lg mb-4 block ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
    box.innerText = message;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => box.classList.add('hidden'), 5000);
}

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

// FUNGSI NAVIGASI TAB
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('text-emerald-600', 'border-emerald-600');
        el.classList.add('text-gray-500', 'border-transparent');
    });
    document.getElementById('btn-' + tabId).classList.add('text-emerald-600', 'border-emerald-600');
    document.getElementById('btn-' + tabId).classList.remove('text-gray-500', 'border-transparent');
}

async function loadData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const json = await res.json();
        if (json.status === 200) {
            const d = json.data;
            
            // --- DATA KAS ---
            document.getElementById('txtSaldo').innerText = formatRp(d.kas.saldo);
            document.getElementById('txtMasuk').innerText = formatRp(d.kas.masuk);
            document.getElementById('txtKeluar').innerText = formatRp(d.kas.keluar);
            
            const tbodyKas = document.getElementById('tabelRiwayat');
            if(tbodyKas) {
                tbodyKas.innerHTML = '';
                if(d.kas.histori.length === 0) {
                    tbodyKas.innerHTML = `<tr><td class="py-4 text-center text-gray-400">Belum ada transaksi</td></tr>`;
                } else {
                    d.kas.histori.forEach(trx => {
                        const isMasuk = trx.tipe === 'Masuk';
                        const formatTgl = new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                        const notaHTML = trx.url_bukti !== "-" && trx.url_bukti !== "Gagal Upload" 
                            ? `<a href="${trx.url_bukti}" target="_blank" class="text-xs text-blue-500 hover:underline">Lihat Nota</a>` 
                            : `<span class="text-xs text-gray-400">Tanpa Nota</span>`;
                        const textPcs = (trx.jumlahPcs && trx.jumlahPcs > 0) ? `(${trx.jumlahPcs} Pcs)` : '';
                        
                        tbodyKas.innerHTML += `
                            <tr>
                                <td class="py-3 px-2 border-b">
                                    <p class="font-bold text-gray-800">${trx.kategori} <span class="text-emerald-600">${textPcs}</span></p>
                                    <p class="text-xs text-gray-500">${formatTgl} • ${notaHTML}</p>
                                </td>
                                <td class="py-3 px-2 text-right border-b">
                                    <p class="font-bold ${isMasuk ? 'text-blue-600' : 'text-red-600'}">
                                        ${isMasuk ? '+' : '-'}${formatRp(trx.nominal)}
                                    </p>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            // --- DATA LAPORAN ---
            if(document.getElementById('lapPiutang')) document.getElementById('lapPiutang').innerText = formatRp(d.utang.totalPiutang);
            if(document.getElementById('lapHutang')) document.getElementById('lapHutang').innerText = formatRp(d.utang.totalHutang);
            if(document.getElementById('lapAset')) document.getElementById('lapAset').innerText = formatRp(d.inventaris.aset);

            // --- DATA UTANG ---
            const tbodyUtang = document.getElementById('tabelUtang');
            if(tbodyUtang) {
                tbodyUtang.innerHTML = d.utang.list.length === 0 ? `<tr><td colspan="2" class="py-4 text-center text-gray-400">Tidak ada tagihan</td></tr>` : '';
                d.utang.list.forEach(u => {
                    tbodyUtang.innerHTML += `<tr><td class="py-3 px-2 border-b"><p class="font-bold text-gray-800">${u.kontak}</p><p class="text-xs text-gray-500">${u.jenis} • Jatuh Tempo: ${new Date(u.tempo).toLocaleDateString('id-ID')}</p></td><td class="py-3 px-2 text-right border-b font-bold text-red-500">${formatRp(u.sisa)}</td></tr>`;
                });
            }

            // --- DATA INVENTARIS ---
            const tbodyInv = document.getElementById('tabelInv');
            if(tbodyInv) {
                tbodyInv.innerHTML = d.inventaris.list.length === 0 ? `<tr><td colspan="3" class="py-4 text-center text-gray-400">Belum ada barang</td></tr>` : '';
                d.inventaris.list.forEach(i => {
                    tbodyInv.innerHTML += `<tr><td class="py-3 px-2 border-b font-bold text-sm text-gray-800">${i.nama}</td><td class="py-3 px-2 border-b text-center font-bold text-gray-600">${i.stok}</td><td class="py-3 px-2 border-b text-right text-emerald-600 font-bold">${formatRp(i.jual)}</td></tr>`;
                });
            }

            // --- DATA KONTAK ---
            const tbodyKontak = document.getElementById('tabelKontak');
            const selectKontak = document.getElementById('inputUKontak');
            if(tbodyKontak) {
                tbodyKontak.innerHTML = '';
                if(selectKontak) selectKontak.innerHTML = '<option value="">Pilih Kontak...</option>';
                
                d.kontak.list.forEach(k => {
                    tbodyKontak.innerHTML += `<tr><td class="py-3 px-2 border-b"><p class="font-bold text-gray-800">${k.nama}</p><p class="text-xs text-gray-500">${k.wa} • ${k.tipe}</p></td></tr>`;
                    if(selectKontak) selectKontak.innerHTML += `<option value="${k.nama}">${k.nama}</option>`;
                });
            }
        }
    } catch (error) {
        console.error("Gagal load data", error);
    }
}

async function submitFormPayload(payload, btnId, originalText, formElement) {
    const btn = document.getElementById(btnId);
    btn.disabled = true;
    btn.innerText = "Memproses...";
    btn.classList.add('opacity-70');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST', redirect: 'follow',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.status === 201) {
            showAlert("Data berhasil disimpan!");
            formElement.reset();
            loadData();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showAlert(error.message, true);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
        btn.classList.remove('opacity-70');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchTab('tab-kas'); // Default tab
    const tglInput = document.getElementById('inputTanggal');
    if (tglInput) tglInput.valueAsDate = new Date();
    loadData();

    // 1. SUBMIT KAS
    document.getElementById('formKas')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('inputFoto');
        const btn = document.getElementById('btnSubmit');
        btn.disabled = true; btn.innerText = "Mengunggah Data..."; btn.classList.add('opacity-70');
        
        try {
            let base64String = null, mimeType = null;
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if(file.size > 2 * 1024 * 1024) throw new Error("Ukuran foto maksimal 2MB");
                mimeType = file.type; base64String = await getBase64(file);
            }
            const payload = {
                action: 'kas',
                tanggal: document.getElementById('inputTanggal').value,
                tipe: document.getElementById('inputTipe').value,
                nominal: document.getElementById('inputNominal').value,
                jumlahPcs: document.getElementById('inputPcs') ? document.getElementById('inputPcs').value : 0, 
                kategori: document.getElementById('inputKategori').value,
                metodeBayar: document.getElementById('inputMetode').value,
                catatan: document.getElementById('inputCatatan').value,
                fotoBase64: base64String, mimeType: mimeType
            };
            const response = await fetch(SCRIPT_URL, { method: 'POST', redirect: 'follow', body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.status === 201) {
                showAlert("Berhasil mencatat transaksi kas!");
                e.target.reset(); if (tglInput) tglInput.valueAsDate = new Date(); loadData();
            } else throw new Error(result.message);
        } catch (error) {
            showAlert(error.message, true);
        } finally {
            btn.disabled = false; btn.innerText = "Simpan Transaksi"; btn.classList.remove('opacity-70');
        }
    });

    // 2. SUBMIT UTANG
    document.getElementById('formUtang')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFormPayload({
            action: 'utang',
            jenis: document.getElementById('inputUJenis').value,
            kontak: document.getElementById('inputUKontak').value,
            total: document.getElementById('inputUTotal').value,
            tglMulai: document.getElementById('inputUTglMulai').value,
            tglTempo: document.getElementById('inputUTglTempo').value
        }, 'btnSubmitUtang', 'Simpan Utang/Piutang', e.target);
    });

    // 3. SUBMIT INVENTARIS
    document.getElementById('formInv')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFormPayload({
            action: 'inv',
            nama: document.getElementById('inputINama').value,
            hpp: document.getElementById('inputIHPP').value,
            jual: document.getElementById('inputIJual').value,
            stok: document.getElementById('inputIStok').value
        }, 'btnSubmitInv', 'Simpan Barang', e.target);
    });

    // 4. SUBMIT KONTAK
    document.getElementById('formKontak')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFormPayload({
            action: 'kontak',
            nama: document.getElementById('inputKNama').value,
            wa: document.getElementById('inputKWA').value,
            tipe: document.getElementById('inputKTipe').value
        }, 'btnSubmitKontak', 'Simpan Kontak', e.target);
    });
});