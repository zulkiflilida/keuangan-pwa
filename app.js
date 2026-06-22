// Ganti dengan URL Web App Anda dari Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwztpzWA1Nz9rDUUT0hMaWU2W3-B0nF9JvzsjoBD5IxGs0rhOSw2_cW6mchkAdh8rFz/exec"; 

document.getElementById('financeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btnSubmit');
    const responseDiv = document.getElementById('autoResponseMsg');
    
    // Ambil nilai form
    const payload = {
        tipe: document.getElementById('tipe').value,
        nominal: document.getElementById('nominal').value,
        deskripsi: document.getElementById('deskripsi').value,
        tanggal: new Date().toISOString().split('T')[0]
    };

    // State Loading
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menyimpan...";
    responseDiv.classList.add('hidden');

    try {
        // Fetch API ke Google Apps Script Web App
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
            // Catatan: mode 'no-cors' tidak memberikan data response, 
            // pastikan GAS dikonfigurasi tanpa batasan CORS atau gunakan redirect text.
            // Karena Fetch standar POST ke GAS memerlukan penanganan khusus (CORS redirect),
            // Disarankan request via 'text/plain' di header jika ada kendala CORS.
        });

        const result = await response.json();

        if (result.status === 201) {
            responseDiv.className = "mt-4 p-4 text-sm rounded whitespace-pre-wrap bg-green-100 text-green-800 block border border-green-300";
            // Menampilkan Auto Responder Text dari server
            responseDiv.innerText = result.data.autoResponderText;
            document.getElementById('financeForm').reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        responseDiv.className = "mt-4 p-4 text-sm rounded bg-red-100 text-red-800 block border border-red-300";
        responseDiv.innerText = "❌ Gagal menyimpan data: " + error.message;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Simpan Data";
    }
});

// Registrasi Service Worker untuk instalasi PWA/APK
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Error', err));
}