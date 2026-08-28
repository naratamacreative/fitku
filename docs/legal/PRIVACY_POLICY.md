# Kebijakan Privasi FitKu

> **STATUS: DRAFT — belum final.** Dokumen ini disusun berdasarkan fitur dan alur data yang benar-benar berjalan di kode FitKu per 2026-08-29 (branch `feat/midtrans-sandbox`). Bagian yang ditandai 🔶 **[BUTUH INPUT ANDA]** adalah fakta bisnis/legal yang tidak bisa disimpulkan dari kode dan wajib diisi oleh Anda sebelum dokumen ini dipakai di Production. Tanggal berlaku juga akan diisi saat difinalisasi.

Terakhir diperbarui: 🔶 **[BUTUH INPUT ANDA — tanggal publikasi resmi]**

## 1. Siapa Kami

FitKu ("kami", "aplikasi") adalah aplikasi pelacak nutrisi dan kebiasaan sehat berbasis web, dioperasikan oleh:

🔶 **[BUTUH INPUT ANDA]**
- Nama entitas/pihak yang bertanggung jawab (perorangan atau badan usaha terdaftar)
- Alamat/domisili
- Email kontak resmi untuk pertanyaan privasi

Kebijakan ini menjelaskan data apa yang FitKu kumpulkan, untuk apa data itu dipakai, ke mana data itu bisa dibagikan, dan hak apa yang kamu miliki atas datamu sendiri.

## 2. Data yang Kami Kumpulkan

Kami hanya mengumpulkan data yang benar-benar dibutuhkan agar fitur FitKu berfungsi. Berikut rincian sesuai struktur data yang sungguh-sungguh disimpan:

### 2.1 Data akun
- **Email** dan **password** — dikelola oleh Supabase Auth (penyedia layanan autentikasi kami). Password tidak pernah disimpan dalam bentuk teks biasa oleh FitKu maupun Supabase; keduanya menggunakan hashing standar industri.
- Kami **tidak** meminta nama, nomor telepon, atau alamat saat pendaftaran — hanya email dan password.

### 2.2 Data profil kesehatan (diisi saat onboarding)
Jenis kelamin, usia, tinggi badan, berat badan, tujuan (turun berat/naik otot/jaga berat), motivasi (teks bebas), berat target, level aktivitas, frekuensi makan per hari, serta target kalori/protein/karbohidrat/lemak harian yang dihitung dari data tersebut.

### 2.3 Data aktivitas harian yang kamu catat sendiri
- Log makanan (jenis makanan, tanggal, porsi, kalori/makro, kategori waktu makan)
- Log berat badan (tanggal, angka berat, catatan opsional)
- Log minum air (jumlah gelas per hari)
- Catatan harian (teks bebas per tanggal)
- Log olahraga (kategori, durasi, estimasi kalori terbakar, catatan opsional)
- Makanan buatanmu sendiri ("My Foods") yang kamu tambahkan ke katalog pribadimu
- Laporan kesalahan data makanan yang kamu kirim ("Laporkan Makanan")

### 2.4 Data langganan dan pembayaran
Status paket (Free/Pro), tanggal mulai/berakhir, dan riwayat transaksi (ID transaksi, jumlah, status, jenis pembayaran). **FitKu tidak pernah menerima atau menyimpan nomor kartu kredit/debit, CVV, atau kredensial rekening bank kamu** — proses pembayaran ditangani langsung oleh Midtrans lewat tampilan pembayaran mereka sendiri (Midtrans Snap); server FitKu hanya menerima email kamu, paket yang dipilih, dan nominal untuk membuat transaksi, lalu menerima notifikasi status dari Midtrans setelah pembayaran selesai.

### 2.5 Pesan ke AI Coach
Saat kamu mengirim pesan ke fitur chat AI Coach (fitur Premium), isi pesanmu beserta ringkasan angka konteks (tujuanmu, target kalori, kalori hari ini, target berat, berat sekarang) dikirim secara real-time ke penyedia layanan AI pihak ketiga (OpenAI) untuk menghasilkan balasan. **Riwayat chat ini tidak disimpan di server FitKu** — begitu kamu me-refresh atau menutup halaman, riwayat percakapan hilang dari sisi FitKu. Data yang sempat dikirim ke OpenAI tunduk pada kebijakan privasi dan retensi data OpenAI sendiri, di luar kendali langsung FitKu.

### 2.6 Data yang TIDAK kami kumpulkan
FitKu saat ini **tidak** menggunakan cookie pelacakan, alat analitik pihak ketiga, atau iklan. Kami juga tidak meminta akses kamera, mikrofon, atau lokasi perangkatmu — ini diblokir secara eksplisit di tingkat browser (`Permissions-Policy`) pada seluruh halaman FitKu.

## 3. Bagaimana Kami Menggunakan Data

- Menjalankan fitur inti: menghitung target harian, menampilkan riwayat & grafik, menghasilkan insight (Weekly Insight, Target Adaptif, Tren Skor untuk pengguna Premium).
- Menentukan status akses (Free/Trial/Premium) agar fitur yang tepat ditampilkan ke akun yang tepat.
- Memproses pembayaran dan mengaktifkan Premium setelah pembayaran terverifikasi oleh Midtrans.
- Menjawab pesan AI Coach (khusus pengguna Premium aktif).
- Keamanan: mendeteksi dan mencegah penyalahgunaan (misalnya pembatasan jumlah pesan AI Coach per hari).

Kami **tidak** menjual data pribadi ke pihak mana pun, dan **tidak** menggunakan datamu untuk iklan bertarget.

## 4. Dengan Siapa Data Dibagikan

FitKu menggunakan penyedia layanan pihak ketiga berikut untuk menjalankan aplikasi. Masing-masing hanya menerima data yang benar-benar mereka perlukan untuk perannya:

| Penyedia | Peran | Data yang diterima |
|---|---|---|
| **Supabase** | Autentikasi & database utama | Seluruh data akun dan aktivitas di atas (2.1–2.4) |
| **OpenAI** | Menghasilkan balasan chat AI Coach | Isi pesan chat + ringkasan angka konteks kesehatan (2.5) — bukan email/identitas akun |
| **Midtrans** | Pemroses pembayaran | Email, paket yang dipilih, nominal transaksi. Data kartu/pembayaran itu sendiri ditangani langsung oleh Midtrans, tidak lewat server FitKu |
| **Vercel** | Hosting aplikasi & fungsi server | Log akses server standar (mis. alamat IP saat request) sebagaimana lazimnya penyedia hosting |

🔶 **[BUTUH INPUT ANDA]** — lokasi/wilayah server Supabase yang dipakai (memengaruhi apakah ada transfer data lintas negara yang perlu dijelaskan lebih lanjut sesuai UU PDP).

Kami tidak membagikan data ke pihak ketiga lain di luar tabel ini.

## 5. Keamanan Data

- Setiap baris data pengguna (log makanan, berat, dsb.) dilindungi **Row Level Security** di database — secara teknis, satu akun tidak bisa membaca atau mengubah data akun lain, bukan hanya dibatasi tampilan.
- Status langganan Premium hanya bisa diubah lewat verifikasi tanda tangan resmi dari Midtrans di server — tidak bisa diubah langsung oleh klien/browser.
- Seluruh trafik berjalan lewat HTTPS, dengan header keamanan browser (Content-Security-Policy, X-Frame-Options, dll.) aktif di semua halaman.
- Kunci rahasia (API key, kunci server pembayaran) hanya hidup di server, tidak pernah dikirim ke browser.

## 6. Hak Kamu atas Data

- **Akses & koreksi** — kamu bisa melihat dan mengubah sebagian besar datamu langsung lewat aplikasi (profil, log harian, dsb.).
- **Penghapusan akun/data** — 🔶 **[BUTUH INPUT ANDA]**: saat ini FitKu **belum punya fitur hapus akun mandiri di dalam aplikasi**. Permintaan penghapusan akun/data harus dilakukan secara manual lewat email kontak di atas. Perlu Anda tentukan: alamat email tujuan permintaan, dan target waktu pemrosesan (mis. maksimal berapa hari kerja).
- **Portabilitas data** — FitKu saat ini belum menyediakan fitur ekspor data mandiri di dalam aplikasi.

## 7. Berapa Lama Data Disimpan

Data disimpan selama akunmu aktif. Karena belum ada fitur hapus akun otomatis (lihat §6), data akan tetap tersimpan sampai ada permintaan penghapusan manual yang diproses oleh kami.

## 8. Usia Pengguna

🔶 **[BUTUH INPUT ANDA]** — FitKu saat ini **tidak memiliki batas usia minimum** yang diberlakukan secara teknis saat pendaftaran (kolom usia hanya divalidasi sebagai angka positif, bukan usia minimum tertentu). Sebagai aplikasi yang memberi saran terkait kalori/berat badan, Anda perlu menentukan kebijakan usia minimum penggunanya (mis. 13, 16, atau 18 tahun), dan kami akan menyesuaikan dokumen ini sekaligus mempertimbangkan apakah perlu penambahan validasi teknis.

## 9. Perubahan Kebijakan Ini

Kami akan memperbarui halaman ini jika ada perubahan signifikan pada cara FitKu mengumpulkan atau menggunakan data, dan akan mencantumkan tanggal pembaruan terbaru di bagian atas dokumen.

## 10. Kontak

Pertanyaan seputar privasi dan data pribadi bisa disampaikan ke: 🔶 **[BUTUH INPUT ANDA — email kontak]**
