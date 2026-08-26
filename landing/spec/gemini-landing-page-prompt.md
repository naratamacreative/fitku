# Prompt untuk Gemini — FitKu Landing Page

Prompt siap paste ke Gemini. Sumber kebenarannya adalah `landing-page-spec.json` dan
`asset-manifest.json` di folder ini — kalau spec itu berubah, update prompt ini juga
supaya tidak divergen.

---

## PROMPT (copy dari sini ke bawah)

Buatkan satu file HTML lengkap (self-contained, boleh pakai Tailwind CDN) untuk landing page produk bernama **FitKu** — aplikasi diet coach AI untuk orang Indonesia. Ikuti instruksi di bawah ini SECARA PERSIS. Jangan mengubah, memparafrase, menambah, atau menghapus apa pun di luar yang diminta — ini bukan brief kreatif bebas, tapi implementasi dari spesifikasi yang sudah final.

### 1. Desain — warna & tipografi (WAJIB, jangan diganti)

Gunakan custom property CSS berikut, JANGAN pakai warna default Tailwind (jangan indigo/amber/teal bawaan):

```css
--bg: #FAF8F4;       /* background utama, default LIGHT — jangan dark theme */
--surface: #FFFFFF;
--surface-2: #F3F0E9;
--ink: #1E2333;       /* teks utama */
--ink-dim: #6B7280;   /* teks sekunder */
--line: #E9E4D8;      /* border/divider */
--teal: #0D9488;      /* warna utama brand */
--teal-soft: #E1F1EE;
--violet: #7C3AED;    /* aksen sekunder */
--violet-soft: #F1EBFD;
--gold: #C9971F;      /* aksen premium/harga */
--gold-soft: #FAF1DE;
```

Gradient tombol utama: `linear-gradient(135deg, var(--teal), var(--violet))`.
Gradient tombol premium/gold: `linear-gradient(120deg, var(--gold), var(--violet))`.

Font: **Sora** (700/800) untuk semua heading, **Plus Jakarta Sans** (400–700) untuk body text. Load dari Google Fonts.

Layout: mobile-first, single column, lebar konten maksimal ~460px di-center (seperti frame HP), boleh sedikit lebih lebar di desktop tapi jangan jadi layout multi-kolom yang ramai.

### 2. Struktur — HARUS 9 section, urutan ini, JANGAN digabung atau ditambah section lain

Setiap section pakai copy PERSIS seperti di bawah — jangan diparafrase.

**Section 1 — Hero**
- Headline: "Bingung Mulai Diet dari Mana?"
- Subheadline: "FitKu bantu kamu punya rencana makan yang sesuai tubuh dan kebiasaan makan orang Indonesia — bukan sekadar hitung kalori."
- Tombol CTA: "Coba Gratis Sekarang →" → `href="/onboarding"`
- Social proof: "⭐⭐⭐⭐⭐ Dipercaya orang Indonesia yang mulai hidup lebih sehat" — **JANGAN tambahkan angka/jumlah user apa pun** (mis. "12.450+"), itu data yang belum kami punya dan tidak boleh dikarang.
- Slot foto: placeholder (lihat aturan foto di bawah), deskripsi: wanita Indonesia 25–35 tahun, casual, memegang smartphone, ekspresi percaya diri natural.

**Section 2 — Masalah** (eyebrow: "KAMU TIDAK SENDIRI")
- Headline: "Bukan Kamu yang Gagal Diet"
- Body: "Kamu cuma belum punya panduan yang paham makanan sehari-harimu — nasi, ayam, sambal — bukan menu diet ala luar negeri yang bikin bingung dan gampang menyerah."
- Slot foto: meja makan rumahan Indonesia (nasi, ayam, sambal), tanpa orang.

**Section 3 — Solusi** (eyebrow: "KENAPA FITKU BEDA")
- Headline: "FitKu Ngerti Makanan Indonesia"
- Slot foto: PLACEHOLDER khusus bertuliskan "Screenshot asli fitur Menu Hari Ini dari app FitKu" — JANGAN diisi foto stok apa pun, ini butuh screenshot asli aplikasi.
- 4 checklist item (pakai ikon centang):
  1. **Personal calorie goal** — Dihitung dari tubuh & targetmu, bukan angka generik
  2. **Menu Hari Ini** — Saran makanan Indonesia sesuai sisa kalorimu
  3. **AI Diet Coach** — Ngobrol harian, bukan cuma catat angka
  4. **Makanan Indonesia** — Porsi centong, potong, piring — bukan gram asing

**Section 4 — Personal AI Coach** (eyebrow: "LEBIH DARI SEKADAR APLIKASI")
- Headline: "Punya Teman yang Selalu Mengingatkan"
- Subheadline: "Bukan cuma teknologi — AI Coach FitKu ngobrol sama kamu tiap hari, kayak temen yang beneran perhatian sama progressmu."
- Chat bubble contoh (styling seperti chat UI, gradient teal→violet soft): **AI Coach**: "Hari ini protein kamu masih kurang. Coba tambahkan telur atau ayam saat makan malam. 🙂"
- Slot foto: close-up tangan memegang smartphone, konteks santai (rumah/kafe), tanpa wajah.

**Section 5 — Hasil** (eyebrow: "BUKAN TRANSFORMASI EKSTREM")
- Headline: "Progress Kecil, Perubahan Besar"
- Body: "Bukan soal turun drastis dalam semalam. FitKu bantu kamu konsisten — sampai suatu hari kamu sadar semuanya terasa lebih mudah: pakaian favorit muat lagi, naik tangga nggak ngos-ngosan."
- Slot foto: orang jalan pagi/beraktivitas santai dengan percaya diri. JANGAN before-after, JANGAN transformasi ekstrem/gym.

**Section 6 — Premium Offer** (eyebrow: "UNTUK KAMU YANG SERIUS") — **section TERPISAH dari Pricing, jangan digabung**
- Headline: "Punya Coach Pribadi, Bukan Cuma Aplikasi"
- Value stack card (hanya 2 item ini, jangan tambah item lain):
  - 🤖 AI Diet Coaching Personal — Rp249.000
  - 🏃 Daily Movement Plan — Rp199.000
  - Total Value: **Rp448.000+**
- Slot foto: momen sehari-hari dengan pencahayaan golden-hour hangat, aksen gold, premium tapi understated (bukan mewah berlebihan).
- Price reveal: harga dicoret Rp99.000 → **Rp49.000**/bulan
- Tagline: "Dapatkan coach pribadi dengan harga secangkir kopi."
- Tombol CTA gold: "Mulai Premium" → `href="/waitlist"` (BUKAN halaman pembayaran — ini rute ke waitlist/pendaftaran minat, karena payment gateway belum aktif)

**Section 7 — Pricing** (eyebrow: "PILIH PAKETMU") — section sendiri, setelah Premium Offer
- Headline: "Pilih Paketmu"
- 3 kartu paket:
  1. 1 BULAN — coret Rp99.000 → **Rp49.000**
  2. 3 BULAN — coret Rp297.000 → **Rp119.000** — beri badge "⭐ PALING POPULER", kartu ini di-highlight (border gold)
  3. 12 BULAN — coret Rp1.188.000 → **Rp399.000**
- Footnote: "Harga peluncuran untuk early adopter."
- Tombol CTA gold: "Mulai Premium" → `href="/waitlist"`

**Section 8 — FAQ**
- Headline: "Pertanyaan yang Sering Ditanyakan"
- 5 item accordion, PERSIS ini (jangan tambah/kurangi pertanyaan):
  1. Q: "Apakah cocok untuk pemula?" — A: "Ya — onboarding FitKu dirancang seperti sesi pertama dengan personal trainer, bukan form rumit."
  2. Q: "Apakah makanan Indonesia tersedia?" — A: "Database FitKu berisi puluhan makanan Indonesia dengan porsi yang biasa kamu pakai — centong, potong, piring."
  3. Q: "Apakah harus olahraga?" — A: "Tidak wajib. Daily Movement Plan itu bonus Premium opsional — fokus utama FitKu tetap di pola makan."
  4. Q: "Apakah bisa berhenti kapan saja?" — A: "Bisa, tanpa kontrak jangka panjang."
  5. Q: "Apakah data saya aman?" — A: "Datamu tersimpan langsung di perangkatmu sendiri, tidak dikirim ke server manapun."

**Section 9 — Final CTA**
- Slot foto: orang tersenyum genuine menghadap ke depan/horizon — idealnya gaya visual sama dengan foto di Section 1 (bookend).
- Headline (center): "Mulai Perjalanan Diet yang Lebih Mudah Hari Ini"
- Tombol CTA gold: "Mulai Gratis" → `href="/onboarding"`
- Tombol teks/ghost di bawahnya: "Lihat cara kerjanya dulu" → scroll halus ke `#solusi` (bukan link biasa)

### 3. Aturan foto (WAJIB)

- **JANGAN** ambil foto dari Unsplash, Pexels, atau CDN foto stok manapun.
- Setiap slot foto dirender sebagai **placeholder box** bergaya dashed border, background `var(--surface-2)`, isi: ikon kamera 📷 + teks italic kecil berisi deskripsi foto yang dibutuhkan (persis seperti deskripsi di masing-masing section di atas).
- Tambahkan HTML comment di atas tiap placeholder: `<!-- IMG PLACEHOLDER: {nama-singkat-asset} -->` supaya gampang dicari-ganti manual nanti dengan file foto asli.

### 4. Tombol & tracking

- Semua CTA yang mengarah ke Premium ("Mulai Premium") HARUS ke `/waitlist`, TIDAK PERNAH ke halaman pembayaran/checkout sungguhan — produk ini belum punya payment gateway aktif.
- Sertakan comment placeholder untuk Meta Pixel & TikTok Pixel di `<head>` (boleh kosong/dummy ID), dan sertakan `onclick` sederhana yang memanggil fungsi JS kosong `trackEvent('Lead', {...})` di CTA utama, dan `trackEvent('UpgradeIntent', {...})` di CTA premium — JANGAN pakai event standar `Purchase` atau `Subscribe`, karena belum ada transaksi nyata yang terjadi.

### 5. Larangan eksplisit

- Jangan buat/isi angka statistik, jumlah user, rating, atau testimoni apa pun yang tidak tertulis di prompt ini.
- Jangan ganti skema warna jadi dark theme atau palet lain (amber/indigo/dsb) — pakai token warna Section 1 di atas persis, default terang (light).
- Jangan gabungkan Section 6 (Premium Offer) dan Section 7 (Pricing) jadi satu section.
- Jangan ubah label/teks tombol CTA dari yang sudah ditentukan.
- Jangan tambah section baru di luar 9 section ini (header/nav sticky sederhana boleh, tapi opsional dan minimal).

---

## Setelah hasil dari Gemini keluar

Kirim balik hasilnya ke saya untuk saya cek kesesuaian dengan spec ini sebelum dipakai — terutama bagian angka/statistik dan rute CTA premium, dua hal yang paling sering meleset.

---

## Follow-up correction — 2026-08-25: ganti foto stok jadi placeholder

Hasil generate pertama sudah benar di hampir semua hal (tidak ada angka dikarang, warna sudah light/teal/violet/gold, section 6 & 7 sudah terpisah, CTA & tracking sudah benar) — TAPI semua slot foto masih pakai `<img src="https://images.unsplash.com/...">` padahal instruksinya harus placeholder box. Paling bermasalah: Section 3 fotonya diberi caption "screenshot app" padahal itu foto stok acak, bukan screenshot asli.

Paste follow-up ini ke Gemini di percakapan yang sama (supaya konteks HTML sebelumnya masih ada):

> Di HTML yang barusan kamu buatkan, tolong revisi HANYA bagian foto — jangan ubah apa pun yang lain (copy, warna, struktur section, CTA, tracking sudah benar, jangan disentuh sama sekali).
>
> Ganti SEMUA elemen `<img src="https://images.unsplash.com/...">` (ada di 7 tempat: Hero, Masalah, Solusi, AI Coach, Hasil, Premium Offer, Final CTA) menjadi placeholder box dengan style:
> - `<div>` dengan border dashed 1.5px warna `var(--line)`, border-radius 16px, padding 20px, text-align center, background `var(--surface-2)`
> - isi: satu emoji kamera 📷 di baris pertama (ukuran besar), lalu teks italic kecil warna `var(--ink-dim)` berisi PERSIS deskripsi yang sudah ada di HTML comment `<!-- IMG: ... -->` di atas tiap gambar — jangan bikin caption baru
> - Khusus Section 3 (Solusi), placeholder-nya harus jelas bertuliskan: "Screenshot asli fitur Menu Hari Ini dari app FitKu — belum tersedia, isi manual nanti" supaya tidak disalahartikan sebagai screenshot sungguhan
>
> Jangan ubah bagian lain dari HTML.
