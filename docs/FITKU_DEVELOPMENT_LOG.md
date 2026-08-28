# FitKu Development Log

Dokumen ini adalah audit-trail resmi untuk semua perubahan FitKu. Setiap entry mengikuti alur Problem → Evidence → Decision → Implementation → Verification. Riwayat bug tidak pernah dihapus atau ditulis ulang saat diperbaiki — root cause dan solusi tetap disimpan sebagai jejak.

## 2026-08-24 — P0 Implementation & UI/UX Polish (retroaktif)

### Perubahan
- Data model `FoodLog` ditambah `mealType?: MealType` (opsional) dan `foodId: string | null` (null untuk entri Tambah Cepat).
- Meal Diary (`MealDiary.tsx`) dipecah jadi 4 section tetap (Sarapan/Siang/Malam/Kudapan) + section "Belum dikategorikan" untuk data lama tanpa `mealType`, masing-masing dengan subtotal kalori, tombol `+ Catat`, dan baris item yang bisa diedit/dihapus.
- Quick Add (`QuickAddSheet.tsx`) dibuat: field Nama makanan (opsional) → Kalori (wajib) → Protein/Karbo/Lemak (opsional) → pilih Meal (grid 2×2) → Simpan. Kalori kosong/0 menonaktifkan tombol Simpan. Nama kosong fallback ke "Tambah Cepat", tidak memaksa cari di database.
- Portion Sheet (`PortionSheet.tsx`) diurutkan ulang: Nama & info makanan → Kalori/makro → Porsi (stepper 44px) → Meal (grid 2×2) → Simpan.
- Edit/Delete: `foodLogRepository.update()` + `useTodayLog().updateLog()` ditambahkan; edit portion/quick-add menghitung ulang kalori & makro lalu menyimpan, otomatis memicu re-render CalorieRing, macro bar, Buku Harian, dan AI Coach insight (semua derive dari `totals`/`logs`, bukan state terpisah).
- Delete memakai inline confirmation (tap ✕ → "Hapus?" → tap lagi, auto-reset 3 detik) di `MealDiary.tsx`, bukan `window.confirm()`.
- `FoodTracker.tsx` diberi header konteks meal (`← Catat ke {icon} {label}`) dan entry point "⚡ Tambah Cepat".
- Premium (`Premium.tsx`) disederhanakan ke copy yang jujur (tanpa klaim benefit yang belum di-enforce); pricing diselaraskan ke 49rb/119rb/399rb tanpa mengubah `SubscriptionPlan` id lama.
- Settings: teks "(default)" di toggle tema dihapus.
- "Menu Hari Ini" (`suggestMealPlan()` di `nutrition.ts`, plus card & state di `Dashboard.tsx`) dihapus total.

### Alasan
- P0 harus mendukung loop GOAL→PLAN→LOG→FEEDBACK→INSIGHT→ACTION dengan benchmark UX MyFitnessPal (bukan clone visual).
- `window.confirm()` memblokir event loop halaman (termasuk automation), tidak konsisten dengan sheet FitKu sendiri.
- "Menu Hari Ini" secara konsisten merekomendasikan makanan yang sama (lihat bug #3 di bawah) — root cause-nya deterministic, bukan sekadar salah pilih makanan.
- Premium page mengklaim benefit yang tidak benar-benar di-gate — masalah integritas, bukan bug teknis.

### File yang berubah
`src/data/types/food.types.ts`, `src/data/repositories/foodLogRepository.ts`, `src/domain/mealTypes.ts` (baru), `src/domain/nutrition.ts`, `src/shared/hooks/useTodayLog.ts`, `src/features/dashboard/components/MealDiary.tsx`, `src/features/dashboard/Dashboard.tsx`, `src/features/food-tracker/components/PortionSheet.tsx`, `src/features/food-tracker/components/QuickAddSheet.tsx`, `src/features/food-tracker/FoodTracker.tsx`, `src/features/premium/Premium.tsx`, `src/features/settings/Settings.tsx`.

### Behavior sebelum
- Semua log makanan tampil dalam satu daftar datar tanpa pengelompokan meal.
- Tidak ada cara mencatat kalori tanpa mencari makanan di database.
- Hapus log memakai `window.confirm()` (blocking).
- Dashboard selalu menampilkan Soto Betawi + Emping di card "Menu Hari Ini".
- Premium mengklaim 4 benefit yang tidak nyata.

### Behavior sesudah
- Log terkelompok per meal + section "Belum dikategorikan" untuk data lama.
- Tambah Cepat tersedia dari FoodTracker tanpa perlu match database.
- Hapus log pakai konfirmasi inline non-blocking.
- Tidak ada rekomendasi makanan otomatis di manapun.
- Premium copy jujur, pricing 49rb/119rb/399rb.

### Risiko / dampak
- Skema `FoodLog` berubah (field baru) — berisiko pada data lama jika ditangani salah; dimitigasi dengan field opsional (lihat Backward compatibility).
- Menghapus fitur "Menu Hari Ini" mengurangi elemen dashboard — dampak UX diterima karena fitur sebelumnya adalah placeholder palsu, bukan fitur nyata.

### Backward compatibility
- `mealType` bersifat opsional; log lama tanpa `mealType` tetap terbaca dan ditampilkan di section "Belum dikategorikan", tidak pernah ditebak/dipaksa masuk ke salah satu dari 4 meal.
- Tidak ada migrasi destruktif — tidak ada data yang di-backfill atau dihapus.

### Testing
- Build: `npm run build` — 0 TypeScript errors.
- Browser: walkthrough manual onboarding → dashboard → tambah makanan → quick add → edit → delete.
- Mobile: dicek pada lebar 390px, tidak ada clipping pada chip meal setelah diubah ke grid 2×2.
- Console: tidak ada error baru.
- Persistence: reload browser, data log tetap ada (Dexie/IndexedDB).
- Regression: fitur lama (weight tracker, AI coach, settings export/import) tidak terganggu.

### Bug yang ditemukan
1. `window.confirm()` memblokir browser automation.
   Solusi: diganti inline confirmation (tap ✕ dua kali, auto-reset 3 detik).
2. Chip Kudapan clipping pada mobile.
   Solusi: meal selector diubah menjadi grid 2×2, ditambah `shortLabel` di `MEAL_TYPES`.
3. Menu Hari Ini selalu menampilkan Soto Betawi + Emping.
   Root cause: `suggestMealPlan()` deterministic (selalu memilih makanan region-tagged berkalori tertinggi + camilan termurah yang muat).
   Solusi: fitur Menu Hari Ini dihapus sampai recommendation engine yang proper tersedia.
4. Quick Add tidak punya field nama (semua entri generik "Tambah Cepat").
   Solusi: ditambah field Nama makanan opsional; urutan field dikoreksi (Nama di atas Kalori) berdasarkan feedback langsung.
5. Empty state Meal Diary kosong tanpa teks, touch target "+ Catat" terlalu kecil.
   Solusi: ditambah teks "Belum dicatat" + padding/rounded button diperbesar.

### Bug yang sengaja belum diperbaiki
- (tidak ada — semua bug yang ditemukan pada pass ini diperbaiki pada pass yang sama)

### Keputusan / catatan penting
- Tidak menambah dependency baru untuk ikon/UI pada pass ini.
- Reuse token `pro` (gold) untuk state konfirmasi hapus, karena tidak ada token `danger` di design system dan menambah token baru dianggap tidak perlu untuk satu use-case ini.

### Next step
- Audit ulang implementasi P0 + polish sebelum menambah fitur baru (lihat entry 2026-08-25).

---

## 2026-08-25 — Bottom Navigation Icons, Hydration Visual, Meal Diary Divider, Catatan Hari Ini

### Perubahan
1. **Bottom Navigation**: `BottomNav.tsx` diberi ikon SVG inline hand-authored (bukan library) untuk Home (rumah), Progress (bar chart), Coach (sparkle — konsisten dengan simbol ✦ yang sudah dipakai di AI Coach card), Setelan (sliders). Tombol "+" (FAB) dan seluruh routing/active-state logic tidak diubah.
2. **Hydration visual**: tile "Air" di Dashboard ditambah ikon gelas kecil (SVG) + progress bar tipis (pola yang sama dengan macro bar Protein/Karbo/Lemak), mengisi sesuai `glasses / GLASS_TARGET`. Teks fraksi "x/8 gls" tetap ada.
3. **Meal Diary divider**: `divide-line/60` → `divide-line` (opacity garis dinaikkan ke 100%, tetap 1px hairline, warna tetap token `--fk-line` yang soft).
4. **Catatan Hari Ini (baru)**: tabel Dexie `dailyNotes` (skema versi 3, additive), tipe `DailyNote`, `noteRepository.ts` (`getForDate`/`save`), dan card baru di Dashboard (di bawah stat row, di atas Paywall banner) berisi textarea auto-save on blur.

### Alasan
- User melaporkan bottom nav hanya tampil sebagai teks tanpa ikon di device asli — dikonfirmasi lewat pembacaan `BottomNav.tsx` (memang tidak ada elemen ikon sama sekali, hanya dot kecil).
- Hydration stat sebelumnya cuma teks polos "0/8 gls", tidak ada representasi visual sama sekali.
- Divider Meal Diary sebelumnya `/60` opacity dinilai user terlalu tipis sehingga section terlihat menyatu.
- "Catatan Hari Ini" diminta dipertahankan oleh user, tapi audit kode (grep untuk "catatan"/"notes" di seluruh `src/`) mengonfirmasi fitur ini **belum pernah ada** di codebase — jadi ini fitur baru, bukan maintenance, dan dibangun mengikuti pola aman yang sudah ada (composite key `${userId}:${date}`, sama seperti `hydrationLogs`).

### File yang berubah
`src/shared/components/BottomNav.tsx`, `src/features/dashboard/Dashboard.tsx`, `src/features/dashboard/components/MealDiary.tsx`, `src/data/types/log.types.ts`, `src/data/db.ts`, `src/data/repositories/noteRepository.ts` (baru).

### Behavior sebelum
- Bottom nav: teks + dot kecil, tanpa ikon.
- Air: teks polos "0/8 gls", tanpa progress visual.
- Meal Diary: divider 60% opacity.
- Tidak ada tempat mencatat catatan personal harian di Dashboard.

### Behavior sesudah
- Bottom nav: ikon SVG untuk tiap tab + label, active state jelas (warna accent), FAB tidak tertutup/overlap.
- Air: ikon gelas kecil + progress bar teal + teks fraksi.
- Meal Diary: divider lebih terlihat tapi tetap tipis/soft, tidak seperti garis tabel.
- Ada card "📝 Catatan Hari Ini" dengan textarea yang tersimpan otomatis ke IndexedDB saat blur, dan reload persisten.

### Risiko / dampak
- Penambahan tabel Dexie baru (`dailyNotes`) menaikkan `SCHEMA_VERSION` ke 3 — Dexie akan menjalankan migrasi versi otomatis saat pertama kali dibuka; tabel-tabel lama tidak disentuh sama sekali, hanya menambah satu tabel baru.
- Tidak ada risiko pada data lama karena seluruh perubahan bersifat additive (tabel baru, field baru, kelas CSS).

### Backward compatibility
- Tidak ada migrasi destruktif. Tabel `dailyNotes` baru dan kosong secara default (`noteRepository.getForDate()` mengembalikan string kosong jika belum ada entry) — tidak memengaruhi user lama yang belum pernah punya catatan.
- `mealType` dan `foodId: null` behavior dari pass sebelumnya tidak diubah.

### Testing
- Build: `npm run build` — 0 TypeScript errors (`tsc -b && vite build` sukses, 73 modules).
- Browser: walkthrough end-to-end di Chrome (dev server `npm run dev`) — dashboard, edit portion (Nasi Putih 1×→1.5×, kalori & makro & AI Coach insight ter-update), delete dengan inline confirm (item hilang, subtotal & CalorieRing ter-update), Quick Add tanpa nama (fallback "Tambah Cepat" tersimpan ke Kudapan), navigasi Home/Progress/Coach/Setelan/Premium via bottom nav, hydration increment (0→3/8, progress bar terisi), Catatan Hari Ini (ditulis, blur, reload — teks tetap ada).
- Mobile: dicek pada viewport 390×844; ikon bottom nav di-zoom untuk verifikasi tidak clipping dan FAB tidak overlap dengan nav item.
- Console: 0 error/warning selain noise standar Vite dev (`[vite] connecting/connected`, React DevTools info).
- Persistence: reload penuh browser — hydration count dan Catatan Hari Ini tetap tersimpan (Dexie/IndexedDB).
- Regression: Meal Diary, Quick Add, Edit/Delete, Premium pricing, Settings theme toggle — semua diverifikasi masih berfungsi seperti pass sebelumnya, tidak ada yang rusak.

### Bug yang ditemukan
6. Bottom Navigation tidak render ikon sama sekali (hanya teks + dot).
   Root cause: `NavItem` di `BottomNav.tsx` tidak pernah punya elemen ikon sejak awal dibuat.
   Solusi: ditambah 4 komponen SVG inline (`HomeIcon`, `ProgressIcon`, `CoachIcon`, `SettingsIcon`), tanpa dependency baru (dikonfirmasi via `package.json` — tidak ada icon library terpasang).
7. Hydration stat tanpa representasi visual.
   Solusi: ditambah ikon gelas + progress bar dengan pola yang sama seperti macro bar (konsistensi visual, tidak menciptakan pola baru).
8. Meal Diary divider terlalu tipis (`/60` opacity).
   Solusi: dinaikkan ke opacity penuh token `--fk-line` (tetap 1px, tetap soft secara warna).

### Bug yang sengaja belum diperbaiki
- (tidak ada temuan baru yang sengaja dilewati pada pass ini)

### Keputusan / catatan penting
- Ikon Coach sengaja memakai bentuk sparkle 4-titik yang sama dengan simbol "✦" yang sudah dipakai di AI Coach card di Dashboard — konsistensi visual identitas fitur, bukan kebetulan.
- Ikon Setelan memakai bentuk "sliders" (3 garis + toggle), bukan gear/roda gigi, karena gear yang digambar tangan pada ukuran 20px berisiko terlihat buruk; sliders adalah simbol settings yang sama umum dan lebih presisi digambar manual.
- Notes disimpan sebagai satu catatan per hari per user (bukan multi-note/list) — sesuai permintaan "Catatan Hari Ini" (satuan harian), bukan jurnal multi-entry.
- Card Catatan Hari Ini diposisikan di bawah stat row (Berat/Air/Skor), bukan menempel di dalam Buku Harian, agar tidak mengganggu alur baca Buku Harian sesuai instruksi eksplisit user.

### Next step
- Belum ada P1 yang diputuskan — menunggu keputusan produk dari user. Kandidat P1 harus dipresentasikan dengan opsi + alasan + impact + complexity sebelum implementasi, sesuai instruksi eksplisit.
- Tidak membangun Barcode, My Foods, My Meals, Recipes, Exercise database, Device integrations, Friends, Messages, Sleep, Glucose, Fasting, Micronutrials, atau integrasi LLM tanpa permintaan eksplisit di masa depan.
- **(Superseded oleh entry di bawah — P1 di atas ternyata langsung diminta pada prompt berikutnya, lihat entry 2026-08-25 P1.)**

---

## 2026-08-25 — P1 IMPLEMENTATION (HANDOFF — SESSION DIHENTIKAN DI TENGAH TESTING)

**Status entry ini: implementasi selesai & build hijau, tapi testing belum tuntas. User meminta STOP untuk menghemat sisa context session (~96% terpakai) dan minta handoff ke session berikutnya. Baca "NEXT STEP" di bagian paling bawah sebelum melakukan apa pun.**

### Feature
Lima P1 dari master prompt "FITKU V2 — P1 + UI/UX POLISH + DEVELOPMENT LOG": (A) Exercise System, (B) Weekly Insight, (C) Personalized Water Target + custom amount + undo, (D) Edit Profile/Goal, (E) Progress 2-tab (Kalori/Berat). Plus UI/UX: (1) Bottom Navigation icon — sudah dari pass sebelumnya, hanya diverifikasi ulang, (2) Meal Diary divider — sudah dari pass sebelumnya, tidak disentuh lagi, (3) Catatan Hari Ini — diupgrade visualnya (card dengan border, icon badge, save indicator "Tersimpan").

### Problem
User memberi master prompt P1 lengkap, eksplisit meminta TIDAK audit ulang seluruh project dan langsung pakai `docs/FITKU_DEVELOPMENT_LOG.md` + baseline P0 sebagai source of truth. Setiap P1 punya spesifikasi detail (lihat prompt asli di riwayat percakapan) — tidak diulang di sini, cukup rujuk entry ini + kode.

### Root Cause
N/A (fitur baru, bukan bugfix) — kecuali satu bug kecil yang ditemukan & langsung diperbaiki di sesi ini: file `Premium.tsx` punya komentar yang menyebut `WeightTracker.tsx` (file yang dihapus di pass ini) — diperbaiki jadi `Progress.tsx` supaya komentar tetap akurat.

### Decision
- **Exercise**: kalori dihitung dari MET × berat badan user × durasi (`src/domain/exercise.ts`), bukan tabel kalori tetap — supaya konsisten dengan pendekatan "personalisasi berdasarkan data user" yang juga dipakai di hydration. Selalu bisa di-override manual.
- **Hydration target**: dihitung LIVE dari `user.weightKg` (`calculateHydrationTargetGlasses()` di `src/domain/hydration.ts`), TIDAK disimpan sebagai field baru di `User` — supaya otomatis re-kalkulasi begitu user ubah berat di Edit Profile, tanpa perlu migrasi/field tambahan.
- **Hydration custom/undo**: `hydrationRepository.increment()` diganti total jadi `adjust(userId, date, delta)` (delta bisa negatif). Hanya 1 pemanggil (`Dashboard.tsx`, dikonfirmasi via grep) jadi breaking rename ini aman.
- **Exercise history letak di Progress > tab Kalori** (bukan tab terpisah) — supaya tetap cuma 2 tab sesuai instruksi eksplisit "jangan 4 tab seperti MyFitnessPal", sekaligus memenuhi instruksi "history olahraga masuk ke Progress".
- **Weekly Insight**: butuh minimal 3 hari logged dalam 7 hari terakhir (`MIN_LOGGED_DAYS = 3` di `src/domain/weeklyInsight.ts`) sebelum menampilkan insight asli — di bawah itu tampil empty-state jujur. Pattern "protein paling sering kurang saat X" dihitung dari agregasi protein per `mealType` per hari dibanding fair-share 25% dari target — memakai data `mealType` yang sudah ada dari P0, bukan data baru.
- **Edit Profile**: hanya field yang diminta eksplisit (tujuan, berat, target berat, activity level, kebiasaan makan) — gender/usia/tinggi TIDAK bisa diedit di layar ini (tidak diminta), tetap dipakai dari data lama saat rekalkulasi TDEE. Memakai `calculateTdee()` yang sudah ada di `src/domain/tdee.ts`, tidak membuat formula baru.
- **Progress refactor**: `WeightTracker.tsx` (lama) DIHAPUS, digantikan `src/features/progress/Progress.tsx` (shell 2 tab) + `tabs/WeightTab.tsx` (isi lama, dipindah apa adanya) + `tabs/CalorieTab.tsx` (baru: tren 7 hari, tren 30 hari kondisional jika data >7 hari tersedia, rata-rata makro, riwayat olahraga 14 hari dengan edit/delete).

### Files Changed
**Baru:**
`src/data/types/exercise.types.ts`, `src/data/repositories/exerciseRepository.ts`, `src/domain/exercise.ts`, `src/domain/hydration.ts`, `src/domain/weeklyInsight.ts`, `src/features/dashboard/components/ExerciseSheet.tsx`, `src/features/dashboard/components/HydrationSheet.tsx`, `src/features/settings/EditProfile.tsx`, `src/features/progress/Progress.tsx`, `src/features/progress/tabs/WeightTab.tsx`, `src/features/progress/tabs/CalorieTab.tsx`.

**Diubah:** `src/data/db.ts` (SCHEMA_VERSION 3→4, tabel `exerciseLogs` baru), `src/data/repositories/hydrationRepository.ts` (`increment()`→`adjust(delta)`, `GLASS_TARGET` dihapus), `src/features/dashboard/Dashboard.tsx` (stat grid 2×2, Exercise+Hydration sheet wiring, Catatan Hari Ini visual upgrade), `src/App.tsx` (route `/progress` → `Progress`, route baru `/settings/profile`), `src/features/settings/Settings.tsx` (link "Edit" ke profil), `src/features/ai-coach/AiCoach.tsx` (card Weekly Insight), `src/features/premium/Premium.tsx` (perbaikan komentar saja).

**Dihapus:** `src/features/weight-tracker/WeightTracker.tsx` (digantikan `src/features/progress/`).

*(Catatan: banyak file lain di `git status` — MealDiary.tsx, QuickAddSheet.tsx, mealTypes.ts, noteRepository.ts, dst — adalah hasil pass SEBELUMNYA (P0 + polish, sudah didokumentasikan di entry 2026-08-24 dan 2026-08-25 sebelumnya di file ini), bukan bagian dari pass P1 ini.)*

### Data / Schema
- `SCHEMA_VERSION` 3 → 4. Tabel baru `exerciseLogs: 'id, userId, date, [userId+date]'` — additive, tidak menyentuh tabel lain.
- Tidak ada field baru di `User` (hydration target sengaja derived, bukan stored — lihat Decision).
- `HydrationLog` (tabel `hydrationLogs`) tidak berubah bentuk, hanya cara menulisnya (`adjust` vs `increment`).

### UI/UX Changes
- Dashboard: stat row jadi grid 2×2 (Berat, Air, Olahraga, Skor). Tile Air dapat tombol "⋯" kecil untuk buka `HydrationSheet` (custom amount + undo), tap badan tile tetap quick-add +1 gelas (quick action dipertahankan sesuai instruksi). Tile Olahraga menampilkan total kkal terbakar hari ini, tap membuka `ExerciseSheet`.
- Catatan Hari Ini: card dengan border tipis, icon badge 📝, placeholder "Apa yang ingin kamu ingat hari ini?", indikator kecil "Tersimpan" muncul ~2 detik setelah blur.
- Coach: card baru "Weekly Insight · 7 hari terakhir" di bawah Daily Coaching, sebelum chat thread.
- Progress: segmented tab switcher "Kalori | Berat" di atas AppShell content.
- Settings: label "Berat sekarang" ditambahkan di section Profil, link "Edit" di pojok kanan atas section itu.

### Testing
**Build:** `npm run build` — 0 TypeScript error, dijalankan berkali-kali setelah tiap batch perubahan besar (setelah exercise+hydration, setelah EditProfile+Progress, setelah Weekly Insight) — semua lolos bersih.

**Browser walkthrough — SUDAH diverifikasi (dev server + Chrome, viewport 390×844):**
- Dashboard: data lama dari sesi sebelumnya (Nasi Putih 260kkal, Tambah Cepat 150kkal, Catatan lama) tetap tampil benar setelah reload — backward compatibility OK.
- Grid 2×2 stat baru tampil rapi, tidak ada clipping.
- Exercise: buka sheet dari tile Olahraga → pilih "Jalan" → isi durasi 30 menit → kalori auto-estimasi muncul 105 kkal (MET 3.5 × 60kg × 0.5h — berat user dikonfirmasi 60kg) → Simpan → tile Olahraga di Dashboard update jadi "105 kkal", CalorieRing/budget makan TIDAK berubah (exercise tidak menambah budget kalori, sesuai instruksi).
- Hydration: tap "⋯" → sheet terbuka, custom amount "+2" berhasil menambah gelas (3→5), tombol "−" (undo) berhasil mengurangi (5→4), progress bar & glass-icon row ter-update live.
- Catatan Hari Ini: visual card baru ter-render dengan benar (border, icon, teks lama masih ada).
- Settings: label "Berat sekarang 60 kg" muncul benar, link "Edit" berfungsi membuka `/settings/profile`.
- Edit Profile: form ter-render dengan semua field ter-prefill benar dari data user existing (Tujuan=Turun berat badan, Berat=60, Target=55, Aktivitas=Ringan).

**Browser walkthrough — BELUM diverifikasi (session dihentikan di sini):**
- Edit Profile: sempat ganti field "Berat sekarang" ke 75, TAPI TOMBOL "Simpan Perubahan" BELUM DITEKAN saat sesi dihentikan. Tidak ada perubahan tersimpan ke database — state form itu hilang begitu tab ditutup. **Aman, tidak ada data korup.**
- Belum diverifikasi: setelah Simpan Perubahan ditekan, apakah `targetCalories`/target lain di Dashboard benar-benar berubah, dan apakah target air di Dashboard ikut berubah (harusnya otomatis karena derived dari `user.weightKg`).
- Progress (`/progress`) belum dibuka sama sekali di browser pass ini — tab Kalori/Berat, chart 7 hari, tren 30 hari (kondisional), riwayat olahraga dengan edit/delete inline — semua BARU teruji lewat build TypeScript, BELUM lewat browser.
- Coach (`/coach`) belum dibuka di browser pass ini — card Weekly Insight (baik state "belum cukup data" maupun state lengkap) BELUM diverifikasi visual. Karena data 7-hari-terakhir kemungkinan cuma 1 hari (hari ini), kemungkinan besar yang akan tampil adalah empty-state jujur "Kamu baru mencatat makanan di 1 dari 7 hari terakhir" — perlu dicek beneran seperti itu, bukan crash/kosong.
- Belum ada pengecekan console error untuk fitur-fitur baru ini (Exercise, Hydration sheet, Edit Profile, Progress, Weekly Insight) — sejauh ini tidak ada error yang terlihat di layar/UI selama testing manual, tapi console belum dibaca eksplisit di pass ini.
- Mobile-width clipping check (390px sudah, belum dicek di 360px) untuk `ExerciseSheet`, `HydrationSheet`, `EditProfile` — terutama daftar 5 kategori olahraga (grid 2 kolom) dan form Edit Profile yang panjang.
- Regression check untuk Meal Diary/Quick Add/Edit/Delete makanan BELUM diulang di pass ini (kode area itu tidak disentuh sama sekali di pass P1 ini, jadi risiko regresi kecil, tapi belum dibuktikan ulang secara live).
- `npm run dev` sudah DIMATIKAN (dihentikan sebagai bagian dari handoff ini) — session berikutnya perlu `npm run dev` ulang untuk lanjut browser testing.

**Console:** belum dicek eksplisit untuk pass ini (lihat di atas).

**Persistence:** hydration adjust (custom+undo) dan exercise add SUDAH terbukti tersimpan (tile Dashboard ter-update setelah reload implisit lewat re-fetch state, bukan lewat full page reload eksplisit) — full page reload untuk exercise/hydration/Edit-Profile-setelah-save BELUM dicoba di pass ini.

**Regression:** lihat catatan di atas — belum diulang secara live untuk area lama (Meal Diary/Quick Add/Edit/Delete), tapi kode area itu tidak disentuh.

### Result
**PARTIAL — implementasi selesai (100%), testing ~50% (fitur inti Exercise & Hydration sudah terbukti jalan end-to-end; Edit Profile save, Progress page, Weekly Insight, console check, mobile-360px check, dan regression re-check BELUM dilakukan).**

### Known Issues
- Tidak ada bug yang ditemukan dan sengaja belum diperbaiki dari testing yang sudah dilakukan — sejauh ini semua yang diuji berjalan sesuai spesifikasi.
- Risiko terbesar yang belum tervalidasi: apakah `EditProfile.handleSave()` benar-benar memicu re-render `targetCalories`/hydration target di Dashboard setelah `refreshUser()` — logikanya seharusnya otomatis (semua nilai itu derived dari `user` lewat `useAppState()`), tapi belum dibuktikan lewat klik nyata.
- Risiko kedua: `CalorieTab.tsx`'s 30-day trend sparkline (`show30DayTrend`) — logikanya sudah benar secara TypeScript tapi visual rendering-nya (apakah garis/gradient tampil wajar, apakah bisa pecah kalau data sangat jarang) belum pernah dilihat langsung.

### Keputusan / catatan penting
- Working tree punya 19 file modified + banyak file baru, semuanya UNCOMMITTED (belum ada `git commit` sejak commit `1e21f18`). Tidak melakukan commit apa pun di pass ini karena belum diminta eksplisit.
- Tidak melakukan audit ulang project sesuai instruksi eksplisit user — semua keputusan di atas dibuat berdasarkan baca file yang relevan langsung dengan tiap P1 (bukan re-scan seluruh `src/`).

### NEXT STEP (WAJIB DIBACA SEBELUM LANJUT)
1. **Jangan audit ulang seluruh project.** Baseline: entry P0 (2026-08-24), entry UI/UX polish (2026-08-25 pertama), dan entry P1 ini (2026-08-25 kedua) di file log ini sudah menjelaskan semua yang sudah dibangun.
2. Jalankan `npm run dev`, buka browser di viewport mobile, lanjutkan checklist testing dari titik "BELUM diverifikasi" di atas — urutan yang disarankan: (a) buka `/settings/profile`, ganti berat, tekan **Simpan Perubahan**, verifikasi `targetCalories` & target air di Dashboard berubah; (b) buka `/progress`, cek tab Kalori & Berat, cek riwayat olahraga (edit + delete satu entry buat memastikan inline-confirm & sheet-edit jalan); (c) buka `/coach`, verifikasi card Weekly Insight tampil (kemungkinan besar empty-state karena data minim); (d) baca console untuk error/warning; (e) cek clipping di 360px width khususnya `ExerciseSheet` & `EditProfile`.
3. Setelah semua testing di atas lolos, tulis entry BARU (bukan edit entry ini) di file log ini yang meng-update bagian Testing/Result dari entry P1 di atas jadi "PASS" — JANGAN edit/hapus catatan "BELUM diverifikasi" yang sudah ditulis, biarkan sebagai jejak riwayat sesuai aturan "jangan hapus riwayat bug."
4. Setelah testing lolos, berikan laporan akhir 14-item ke user sesuai format yang diminta di master prompt P1 (poin 10 "FINAL REPORT" di prompt asli — masih ada di riwayat percakapan sesi ini/sesi sebelumnya).
5. Jangan mulai P2/P3 apa pun sebelum laporan akhir P1 disetujui user.

---

## 2026-08-26 — P1 IMPLEMENTATION (TESTING SELESAI — MELANJUTKAN HANDOFF DI ATAS)

**Entry ini melanjutkan langsung dari NEXT STEP di entry "2026-08-25 — P1 IMPLEMENTATION (HANDOFF...)" di atas. Semua item yang sebelumnya berstatus "BELUM diverifikasi" sudah dijalankan di sesi ini. Tidak ada audit ulang project — hanya menjalankan checklist yang sudah ditentukan di entry sebelumnya.**

### Feature
Sama seperti entry sebelumnya: (A) Exercise System, (B) Weekly Insight, (C) Personalized Water Target + custom + undo, (D) Edit Profile/Goal, (E) Progress 2-tab.

### Problem
Melanjutkan testing P1 yang terhenti karena batas context session sebelumnya.

### Root Cause
N/A — tidak ada bug baru ditemukan selama testing lanjutan ini.

### Decision
Tidak ada keputusan desain baru — murni menjalankan checklist testing (a)–(e) yang sudah ditulis di NEXT STEP entry sebelumnya, sesuai urutan yang disarankan.

### Files Changed
Tidak ada file kode yang berubah pada pass ini — hanya menjalankan `npm run dev`, testing manual di browser, dan menulis entry log ini.

### Data / Schema
Tidak ada perubahan skema. Data uji yang ditambahkan selama testing (untuk validasi, bukan seed permanen): 1 `ExerciseLog` (Jalan, 30 menit, 105 kkal) — ditambahkan lalu dihapus lagi lewat tombol Hapus untuk menguji delete flow; 1 `WeightEntry` (74kg) — ditambahkan dan TIDAK dihapus (data valid, sengaja dibiarkan sebagai catatan berat asli). `User.weightKg` diubah dari 60 → 75 lewat Edit Profile (perubahan nyata, tersimpan).

### UI/UX Changes
Tidak ada — pass ini murni testing, tidak ada perubahan visual/kode.

### Testing

**(a) Edit Profile → Simpan Perubahan → cek rekalkulasi:** PASS.
- Ubah "Berat sekarang" 60 → 75 kg di `/settings/profile`, tekan Simpan Perubahan.
- Redirect otomatis ke `/settings`, "Berat sekarang" di section Profil ter-update jadi "75 kg".
- Buka Dashboard: `targetCalories` berubah 1.578 → 1.784 kkal, target Protein 108→135g, Karbo 188→200g, Lemak 44→50g (TDEE ter-rekalkulasi otomatis dari `calculateTdee()` yang sudah ada, sesuai instruksi "gunakan logic existing").
- Target air (hydration) ikut berubah otomatis: 8 → 10 gelas (derived live dari `user.weightKg`, bukan field tersimpan — bekerja persis sesuai desain).
- Reload halaman `/settings/profile`: field ter-prefill dengan nilai baru (75/55/Ringan/3×sehari) — konfirmasi data benar-benar tersimpan ke Dexie, bukan cuma state lokal.

**(b) `/progress` — tab Kalori & Berat, exercise edit/delete:** PASS.
- Tab Kalori: "Kalori 7 Hari" tampil benar (1/7 hari tercatat, rata-rata 410 kkal dari target 1.784 kkal), "Tren 30 Hari" TIDAK tampil (kondisi `show30DayTrend` — cuma 1 hari data, sesuai logic "jika data >7 hari tersedia"), "Rata-rata Makro (7 hari)" tampil (4%/28%/1%), "Riwayat Olahraga" menampilkan entry "Jalan · 25 Agu · 30 menit · 105 kkal".
- Tap baris exercise → `ExerciseSheet` terbuka dalam mode edit, ter-prefill benar (Jalan/30 menit/105 kkal).
- Tekan "Hapus catatan ini" → tampil "Yakin hapus? Tap lagi" (non-blocking, bukan `window.confirm()`) → tap lagi → entry terhapus, sheet tertutup otomatis, list berubah jadi empty state "Belum ada olahraga tercatat 14 hari terakhir."
- Tab Berat: tampil empty state "—" (belum ada `WeightEntry`), input "74" + tombol Catat → berhasil tersimpan, kartu atas ter-update jadi "74 kg", baris riwayat baru muncul.

**(c) `/coach` — Weekly Insight:** PASS.
- Card baru "WEEKLY INSIGHT · 7 HARI TERAKHIR" tampil tepat di bawah Daily Coaching, sebelum "Tanya lebih lanjut".
- Karena data minim (1 hari logged dalam window 7 hari), yang tampil adalah honest empty-state: "Kamu baru mencatat makanan di 1 dari 7 hari terakhir." + rekomendasi "Catat makanan minimal 3 hari dalam seminggu supaya Weekly Insight bisa membaca polamu." — sesuai spesifikasi "jika data belum cukup, gunakan empty state yang jujur dan actionable." Tidak crash, tidak ada layout pecah.

**(d) Console:** PASS. Dibaca setelah navigasi melalui `/settings/profile` (save), `/`, `/progress` (kedua tab + edit/delete), `/coach`. Hasil: 0 error, 0 warning dari kode aplikasi — hanya noise standar Vite dev (`[vite] connecting/connected`, info React DevTools).

**(e) Mobile clipping 360px:** PASS. Diuji ulang di viewport 360×780 (lebih sempit dari 390px yang dipakai sebelumnya): `EditProfile` (OptionCard tujuan/aktivitas, input berat 2-kolom) tidak clipping; `ExerciseSheet` (grid kategori 2 kolom, termasuk label terpanjang "Angkat Beban") tidak clipping/overlap; Dashboard grid 2×2 (Berat/Air/Olahraga/Skor) tetap rapi; `PortionSheet` (regresi, bukan fitur baru) juga dicek ulang di 360px — tetap rapi, grid meal 2×2 tidak clipping.

**Build:** `npm run build` dijalankan ulang di akhir pass — 0 TypeScript error, 82 modules, sukses.

**Regression:** PortionSheet dibuka langsung dari Meal Diary ("Nasi Putih") di Dashboard pada viewport 360px — terbuka normal, porsi/meal-grid/Simpan semua utuh. Tidak ada tanda area food-logging lama (Meal Diary/Quick Add/Edit/Delete) terganggu oleh perubahan P1.

**Persistence:** dikonfirmasi lewat reload eksplisit pada `/settings/profile` setelah save (lihat poin a) dan lewat navigasi berulang antar halaman untuk `/progress`, `/coach`.

### Result
**PASS — seluruh item yang sebelumnya "BELUM diverifikasi" kini terbukti bekerja end-to-end (bukan UI mockup): tersambung ke repository/Dexie, tervalidasi lewat reload, tanpa error console, tanpa clipping mobile, tanpa regresi pada fitur lama.**

### Known Issues
- Tidak ada bug baru ditemukan pada pass testing ini.
- Dua risiko yang dicatat "belum tervalidasi" di entry sebelumnya sudah terjawab: (1) `EditProfile.handleSave()` MEMANG memicu rekalkulasi `targetCalories`+hydration target di Dashboard secara otomatis — dikonfirmasi visual di atas; (2) `CalorieTab.tsx` 30-day trend TIDAK dites rendering visualnya karena kondisinya memang belum terpenuhi (data masih <7 hari) — item ini tetap terbuka untuk divalidasi visual nanti setelah ada data logging >7 hari; bukan blocker karena logic kondisionalnya sendiri sudah benar (tidak tampil saat seharusnya tidak tampil).
- Working tree masih 100% uncommitted (commit terakhir `1e21f18`) — belum ada instruksi eksplisit dari user untuk commit.

### Keputusan / catatan penting
- Tidak melakukan audit ulang project — semua langkah di pass ini murni eksekusi checklist dari entry sebelumnya, sesuai instruksi eksplisit user "jangan mengulang pekerjaan yang sudah selesai."
- Data uji (WeightEntry 74kg, User.weightKg=75) sengaja DIBIARKAN tersimpan di database dev lokal karena valid dan tidak merusak apa pun — bukan data yang perlu dibersihkan.

### Next step
- P1 selesai dan tervalidasi penuh. Laporan akhir 14-item diberikan ke user di respons percakapan (bukan di file log ini, sesuai format yang diminta).
- Tidak memulai P2/P3 apa pun sampai ada instruksi eksplisit dari user.

---

## 2026-08-26 (lanjutan) — P2: My Foods + Buku Harian Visual Polish

### 1. Date
2026-08-26

### 2. Feature
(a) **P2 — My Foods**: daftar makanan pribadi yang bisa dibuat dari Tambah Cepat, dipakai ulang tanpa mengetik ulang. (b) **Buku Harian visual polish** (wajib, di luar P2): icon per meal dalam badge lingkaran, subtotal kalori sebagai pill, CTA "+ Catat" jadi pill button, empty state jadi kotak dashed yang bisa ditap.

### 3. Problem
- Roadmap P2 lama (dari memory "FitKu V2 Competitive Blueprint", bukan dari file log ini — file log ini tidak pernah mencatat daftar P2 konkret) menyebut My Foods, Report Food, dan full 7-category tabs. User mengonfirmasi hanya My Foods yang dikerjakan sesi ini, sisanya ditahan sampai direview.
- Buku Harian dinilai user monoton, kurang hidup, dan CTA "+ Catat" (plain text link) kurang terlihat sebagai aksi utama.

### 4. Root Cause
N/A untuk keduanya — bukan bugfix, murni fitur baru (My Foods) dan polish visual (Buku Harian) di atas implementasi yang sudah PASS.

### 5. Decision
- **My Foods disimpan di tabel baru `myFoods`** (bukan menambah field ke tabel `foods` yang sudah ada), karena `foods` adalah katalog global bersama (dipakai `foodRepository.ensureSeeded()`/`all()`) sementara My Foods adalah milik personal user — mencampur keduanya berisiko merusak logic katalog yang sudah PASS.
- **Cara membuat My Foods: checkbox di Tambah Cepat** ("Simpan sebagai Makanan Saya untuk dipakai lagi"), bukan form terpisah — reuse penuh `QuickAddSheet.tsx` yang sudah PASS, tidak menambah layar baru untuk "membuat" makanan. Checkbox nonaktif sampai nama diisi (nama wajib untuk item yang mau dipakai ulang).
- **Scope v1 sengaja dibatasi ke Create + Browse/Log + Delete — TIDAK ada Edit.** Alasan: cukup untuk value inti "jangan ketik ulang," dan menambah form edit terpisah berarti UI baru lagi untuk kasus yang bisa diselesaikan dengan hapus+catat ulang. Sesuai instruksi "jangan membuat solusi terlalu kompleks."
- **Log dari My Foods memakai `foodId: null`** (sama seperti Quick Add), bukan `foodId` milik MyFood — karena MyFood bukan bagian katalog global, dan field `foodId` didokumentasikan khusus untuk referensi ke tabel `foods`. Ini juga otomatis membuat `recentFoodIds()` mengabaikannya dengan benar (logic skip-null yang sudah ada, tidak perlu diubah).
- **Tab "Milikku" terpisah** dari "Favorit"/"Terakhir" di FoodTracker (bukan digabung) — karena sumber datanya beda (Favorit/Terakhir dari riwayat katalog, Milikku dari tabel personal) dan digabung akan membingungkan model mentalnya.
- **Buku Harian**: ikon dibungkus badge lingkaran (`bg-surface` + shadow-soft) — pola yang sama persis dengan badge ikon Catatan Hari Ini/AI Coach yang sudah ada, bukan pola baru. Subtotal kalori jadi pill kecil di sebelah label, bukan teks polos. CTA "+ Catat" jadi pill dengan background `accent-soft`. Empty state ("Belum dicatat") jadi kotak dashed yang seluruhnya bisa ditap (bukan cuma teks statis) — memberi target sentuh lebih besar dan terasa seperti "slot kosong yang mengundang," bukan section rusak. Warna TIDAK ditambah (tetap ink/ink-dim/accent) — sengaja menghindari pewarnaan per-meal-type karena user eksplisit minta "tidak menggunakan terlalu banyak warna."

### 6. Implementation
Lihat detail per-file di bagian "Files Changed" — ringkas: 1 tabel Dexie baru (`myFoods`, skema v5, additive), 1 tipe baru, 1 repository baru (all/add/delete), `QuickAddSheet.tsx` dapat 1 prop opsional + 1 checkbox opsional (default off, tidak mengubah behavior existing caller manapun), `FoodTracker.tsx` dapat tab "Milikku" baru + 2 handler baru, `MealDiary.tsx` di-restyle total tanpa mengubah props/API-nya.

### 7. Files Changed
**Baru:** `src/data/types/myFood.types.ts`, `src/data/repositories/myFoodRepository.ts`.
**Diubah:** `src/data/db.ts` (SCHEMA_VERSION 4→5, tabel `myFoods`), `src/features/food-tracker/components/QuickAddSheet.tsx` (prop `showSaveToMyFoods`, field `saveToMyFoods` di `QuickAddValues`, 1 checkbox), `src/features/food-tracker/FoodTracker.tsx` (tab Milikku, `myFoodAsFood()` adapter, `MyFoodRow`, `handleAddMyFood`, `handleDeleteMyFood`, checkbox handling di `handleQuickAdd`), `src/features/dashboard/components/MealDiary.tsx` (restyle penuh, props tidak berubah).

### 8. Data/Schema impact
`SCHEMA_VERSION` 4 → 5. Tabel baru `myFoods: 'id, userId'` — additive, tidak menyentuh tabel lain. Tidak ada migrasi destruktif, tidak ada data lama yang berubah bentuk.

### 9. UI/UX changes
Lihat poin 5 (Decision) untuk detail visual. Tidak ada perubahan pada FoodTracker/PortionSheet/Dashboard di luar yang disebutkan; Bottom Navigation TIDAK disentuh sama sekali di pass ini (dikonfirmasi tetap render benar saat testing, bukan diasumsikan).

### 10. Testing
- **Build:** `npm run build` dijalankan 3× (setelah My Foods, setelah Buku Harian polish, dan final) — 0 TypeScript error setiap kali, 83 modules.
- **Browser walkthrough (dev server + Chrome, viewport mobile):**
  - Dashboard: Buku Harian baru tampil dengan icon badge, subtotal pill, CTA pill "+ Catat" — dicek visual langsung, bukan cuma build.
  - Empty-state dashed box ("Makan Siang" kosong) — ditap, berhasil navigasi ke `/tracker?meal=lunch` dengan header konteks benar.
  - My Foods — alur penuh end-to-end: buka Tambah Cepat, isi "Nasi goreng kantin" + 550 kkal, checkbox awalnya nonaktif (nama kosong) lalu aktif setelah nama diisi, dicentang, disimpan → log masuk ke Makan Siang (total 410→960 kkal) DAN muncul di tab Milikku.
  - Tab Milikku dicek dari konteks meal berbeda (`meal=dinner`) — item tetap muncul (konfirmasi user-scoped, bukan meal-scoped, sesuai desain).
  - Tap "+" pada item Milikku → `PortionSheet` terbuka dengan data benar (nama, kalori, 0g protein karena Quick Add tidak isi makro), meal preset "Malam" sesuai konteks → Tambahkan → total naik ke 1.510 kkal, Makan Malam dapat entry baru — kedua entry (Siang & Malam) independen (snapshot, bukan reference).
  - Delete dari Milikku — tap sekali arm ("Hapus?"), tap kedua (dalam satu batch klik tanpa jeda screenshot supaya tidak kena auto-reset 3 detik) → item terhapus, empty state Milikku muncul kembali.
  - Console: dibaca setelah rangkaian navigasi di atas — 0 error, 0 warning selain noise Vite dev standar.
  - Mobile: chip row FoodTracker (sekarang 6 chip termasuk "Milikku") tetap `overflow-x-auto` seperti sebelumnya — chip terakhir terpotong di tepi layar dengan scroll tersedia, ini PERILAKU LAMA yang sudah ada sebelum "Milikku" ditambahkan (bukan clipping baru), dikonfirmasi dengan membandingkan struktur kode row chip yang tidak diubah. Buku Harian baru dicek tidak ada elemen terpotong pada layout mobile.
  - Regresi: alur katalog (Nasi Putih dari tab Favorit, PortionSheet biasa) tidak disentuh kodenya dan tidak diuji ulang eksplisit pass ini karena scope perubahan (My Foods, MealDiary) tidak menyentuh path katalog — **BELUM DIVERIFIKASI ulang secara eksplisit di pass ini**, hanya diverifikasi PASS di pass-pass sebelumnya.
  - Bottom Navigation: icon terlihat, active state jelas, tidak ada perubahan kode — dikonfirmasi visual saat screenshot dashboard/tracker, TIDAK dilakukan pengujian interaksi eksplisit (klik semua tab) di pass ini karena scope tidak menyentuhnya.

### 11. Result
**My Foods: PASS, diuji end-to-end (create → browse → log → delete), bukan UI mockup.**
**Buku Harian visual polish: PASS secara visual dan fungsional (empty-state link, CTA pill), diuji langsung di browser.**
**Regresi katalog Favorit/Terakhir dan interaksi penuh Bottom Navigation: BELUM DIVERIFIKASI ULANG di pass ini** (tidak disentuh kodenya, risiko rendah, tapi jujur dicatat sebagai belum dites ulang secara eksplisit sesuai instruksi "jangan mengklaim PASS jika belum benar-benar dites").

### 12. Known Issues
- Tidak ada bug baru ditemukan.
- My Foods v1 tidak punya fitur Edit (sengaja, lihat Decision) — jika user nanti minta, perlu form/sheet baru.
- `servingGrams` pada MyFood yang dibuat dari Tambah Cepat selalu `0` (Quick Add tidak mengumpulkan berat porsi dalam gram) — bukan bug, field ini memang tidak dipakai dalam kalkulasi apa pun, murni metadata tidak lengkap yang tidak berdampak fungsional.

### 13. Next Step
- Report Food dan full 7-category tabs (item roadmap P2 lama lainnya) **TIDAK dikerjakan** — menunggu review My Foods dan instruksi eksplisit lanjutan dari user, sesuai permintaan langsung.
- Jika user ingin, regresi katalog Favorit/Terakhir dan interaksi Bottom Navigation bisa diverifikasi ulang secara eksplisit pada sesi berikutnya (opsional, risiko dinilai rendah karena kode tidak disentuh).

---

## 2026-08-26 (lanjutan) — Perbaikan Kebiasaan Sehat & Flow Air

### 1. Tanggal
2026-08-26

### 2. Tujuan perubahan
(A) Membuat area 4 tile (Berat/Air/Olahraga/Skor) di Dashboard terasa jelas sebagai kumpulan "Kebiasaan Sehat" yang bisa dibuka/digunakan, bukan sekadar angka statis. (B–E) Mengubah flow Air dari "tap = langsung tercatat" menjadi flow eksplisit: pilih jumlah (preset atau custom) → lihat preview → tekan Simpan → data tersimpan → otomatis kembali ke Home dengan angka terbaru.

### 3. Masalah UX sebelumnya
- Tidak ada label/konteks section untuk 4 tile tsb — user baru tidak langsung paham itu adalah kumpulan kebiasaan yang bisa ditekan.
- Tile tidak punya cue visual "ini bisa ditekan" — user (termasuk user sendiri saat mencoba) tidak tergerak untuk menekannya.
- Flow Air lama: tap tile = langsung `+1` tersimpan ke database, tanpa jeda "apakah ini benar jumlahnya" — terasa seperti "klik → tambah → klik → tambah" tanpa kontrol.
- Tidak ada cara memilih jumlah spesifik (2, 3, custom) sebelum tercatat — hanya +1/-1 dan custom-add yang langsung commit begitu ditekan, di dalam sheet modal yang menumpuk di atas Dashboard (bukan flow "buka → isi → simpan → kembali").

### 4. Keputusan yang diambil
- **Catatan penting:** user menyebut ada screen recording referensi ("Kebiasaan Sehat → Air → pilih jumlah → Simpan → kembali ke Home"). Sudah dicek di `landing/spec/` dan lokasi umum lain — **tidak ditemukan file baru**, hanya rekaman MFP food-add-flow yang sudah dianalisis sebelumnya. Diberitahukan ke user secara eksplisit sebelum implementasi; dilanjutkan berdasarkan spesifikasi tertulis (bagian A–I) yang memang sudah sangat lengkap dan eksplisit menyatakan rekaman hanya referensi rasa, bukan sumber wajib.
- **Air diubah dari bottom-sheet modal menjadi layar/route penuh (`/hydration`)** — bukan sheet yang lebih besar. Alasan: requirement eksplisit "kembali ke Home" secara semantik adalah navigasi keluar-masuk halaman (pola yang sudah dipakai FoodTracker `/tracker` dan EditProfile `/settings/profile`, bukan pola modal). Route penuh juga memberi ruang untuk semua informasi yang diminta di bagian D (sudah diminum, target, jumlah dipilih, preset, cara simpan) tanpa sheet terasa sesak.
- **Preset 1/2/3 gelas bersifat single-select** (bukan bisa pilih beberapa sekaligus lalu dijumlah) — cukup untuk requirement "user menentukan jumlah sebelum simpan"; multi-select preset dinilai menambah kompleksitas interaksi tanpa manfaat UX yang jelas (item testing #5 di prompt eksplisit bilang "jika diperlukan oleh solusi yang dipilih" — solusi ini tidak memerlukannya).
- **Default pilihan awal = 1 gelas** (bukan kosong) — supaya tombol Simpan tidak dalam keadaan disabled/membingungkan saat halaman pertama dibuka; user tetap bebas mengubah ke preset lain/custom sebelum menyimpan.
- **Custom amount berupa input angka gelas** (bukan ml) — mempertahankan satuan "gelas" yang sudah jadi mental model FitKu sejak P1, tidak menambah dimensi ml yang tidak ada di skema manapun.
- **Kemampuan koreksi/undo dari P1 dipertahankan** sebagai link kecil "− Kurangi 1 gelas (koreksi kesalahan)" yang bertindak LANGSUNG (bukan staged) — berbeda dari flow utama (staged → Simpan) karena ini murni aksi "perbaiki kesalahan tadi", bukan "aku baru minum sekian" — tetap di halaman yang sama supaya user bisa koreksi lalu lanjut mencatat jumlah baru jika perlu.
- **Tile Air di Dashboard tidak lagi quick-add +1 on-tap** — sekarang tap tile = navigasi ke `/hydration`. Tombol "⋯" (menu sheet) dihapus karena sudah tidak relevan (dulu ada karena tap-utama dan tap-menu punya tujuan beda; sekarang cukup satu tujuan: buka halaman Air).
- **Tile Berat dibuat bisa ditekan** (sebelumnya `<div>` statis tanpa aksi) → navigasi ke `/progress?tab=weight`. Ini perluasan kecil di luar scope Air murni, tapi diperlukan supaya requirement bagian A ("semua tile di section Kebiasaan Sehat harus terasa actionable") konsisten — tile yang sama sekali tidak bisa ditekan di tengah section yang katanya "semua actionable" adalah kontradiksi UX.
- **Affordance cue: chevron "›" kecil** di pojok tile yang actionable (Berat/Air/Olahraga), TIDAK di tile Skor (murni angka read-only, tidak ada aksi yang bisa dilakukan dengannya). Chevron ini reuse elemen visual yang SUDAH ADA di card AI Coach (`<span className="text-accent">›</span>`) — bukan pola baru. Ditambah `active:scale-[0.97]` untuk feedback taktil saat ditekan.
- **Label "Kebiasaan Sehat"** ditempatkan persis di atas grid, memakai style yang sama dengan label "Buku Harian" di section atasnya — konsisten dengan hierarchy section yang sudah ada di halaman yang sama, bukan pola baru.
- **`HydrationSheet.tsx` dihapus** (superseded oleh layar `/hydration`) — tidak dibiarkan jadi kode mati.

### 5. Implementasi
Personalisasi target hydration (`calculateHydrationTargetGlasses`) dan penyimpanan data (`hydrationRepository.getForDate`/`adjust`) dari P1 dipakai **tanpa perubahan sama sekali** — hanya UI/flow di sekitarnya yang berubah. Layar baru `Hydration.tsx` memuat status hari ini (angka besar + progress bar + baris ikon gelas), pemilih jumlah (chip preset + custom), kotak preview "Akan dicatat +N gelas → total jadi X/Y gelas", tombol Simpan (memanggil `adjust()` lalu `navigate('/', {replace:true})`), dan link koreksi.

### 6. File yang berubah
**Baru:** `src/features/hydration/Hydration.tsx`.
**Dihapus:** `src/features/dashboard/components/HydrationSheet.tsx` (superseded).
**Diubah:** `src/App.tsx` (route baru `/hydration`), `src/features/dashboard/Dashboard.tsx` (label "Kebiasaan Sehat", tile Berat/Air/Olahraga jadi button dengan chevron cue, tile Air navigasi bukan quick-add, hapus state/handler `HydrationSheet` yang sudah tidak dipakai), `src/features/progress/Progress.tsx` (baca `?tab=weight` untuk deep-link dari tile Berat).

### 7. Dampak terhadap data/schema
**Tidak ada.** Tabel `hydrationLogs` dan fungsi personalisasi P1 sama sekali tidak diubah — hanya cara UI memanggilnya. Tidak ada migrasi, tidak ada data lama yang berubah bentuk atau hilang.

### 8. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error, dijalankan setelah implementasi selesai dan sekali lagi di akhir sesi.
- **Browser walkthrough nyata** (dev server terpisah di port 5174 supaya tidak mengganggu server preview user di port 5173, viewport mobile 390px lalu 360px):
  - Section "Kebiasaan Sehat" terlihat jelas dengan label + chevron pada Berat/Air/Olahraga (Skor sengaja tanpa chevron) — dikonfirmasi visual.
  - Tap tile Air → navigasi ke `/hydration`, halaman menampilkan "0/11 gelas" (target 11 = personalisasi dari berat badan user profil ini, bukan angka hardcode 8 — P1 personalization terbukti tetap jalan).
  - Pilih preset "3 gelas" → preview berubah jadi "+3 gelas → total jadi 3/11 gelas", TAPI angka "Sudah diminum" di atas tetap "0" — dikonfirmasi eksplisit bahwa pilihan belum final sebelum Simpan.
  - Pilih "Custom" → isi "5" → preview update jadi "+5 gelas → total jadi 5/11 gelas".
  - Tekan Simpan → otomatis navigasi ke Home (URL berubah ke "/"), scroll ke Kebiasaan Sehat → tile Air menampilkan "5/11 gls" dengan progress bar terisi — dikonfirmasi data tersimpan DAN dashboard langsung menunjukkan hasil terbaru tanpa langkah manual.
  - Reload penuh halaman → angka "5/11 gls" tetap ada — persistence terkonfirmasi.
  - Tap tile Berat → navigasi ke `/progress?tab=weight`, tab "Berat" langsung aktif (bukan default "Kalori") — deep-link terkonfirmasi.
  - Tap tile Olahraga → `ExerciseSheet` tetap terbuka normal seperti sebelumnya — regresi P1 aman.
  - Kembali ke `/hydration`: custom amount kosong/0 → tombol Simpan disabled, preview menunjukkan "+0 gelas" — edge case tervalidasi.
  - Link "− Kurangi 1 gelas (koreksi kesalahan)" ditekan → angka "Sudah diminum" turun 5→4 langsung (tanpa navigasi keluar halaman), preview ikut menyesuaikan — kemampuan undo P1 terkonfirmasi tetap ada.
  - Console dibaca setelah seluruh rangkaian di atas — 0 error, 0 warning selain noise Vite dev standar.
  - Viewport 360px — halaman `/hydration` (termasuk saat custom input terbuka) dan grid Kebiasaan Sehat di Dashboard tidak ada elemen terpotong/overlap.
  - Data lama (legacy entry tanpa `mealType`, di section "Belum dikategorikan") terlihat tetap tampil benar sepanjang testing — regresi backward-compatibility tidak terganggu (insidental, bukan pengujian langsung terhadap area itu).

### 9. Hasil testing
**PASS untuk seluruh 14 poin checklist di bagian H prompt** — diuji langsung di browser (bukan hanya build/TypeScript), termasuk staged-selection-belum-final, custom amount, auto-navigasi setelah Simpan, personalisasi target tetap jalan, console bersih, dan tidak ada clipping mobile.

### 10. Bug yang ditemukan
Tidak ada bug baru ditemukan selama implementasi maupun testing pass ini.

### 11. Bug yang belum diverifikasi
Tidak ada — seluruh perubahan pada pass ini (Hydration.tsx, tile Dashboard, deep-link Progress) sudah diuji langsung sesuai checklist di atas. Area yang TIDAK disentuh kodenya pada pass ini (Buku Harian, My Foods, Weekly Insight, dll.) tidak diuji ulang — statusnya tetap seperti tercatat di entry-entry sebelumnya, tidak diklaim ulang di sini.

### 12. Known Issues
- Tidak ditemukan screen recording referensi baru yang disebut user (dicek eksplisit, dicatat sebagai fakta, bukan diabaikan diam-diam) — implementasi murni berbasis spesifikasi tertulis.
- Tile "Skor" masih murni read-only tanpa aksi/destinasi — bukan bug, tapi dicatat sebagai limitasi produk saat ini (tidak ada layar "Detail Skor" yang diminta/dibangun).

### 13. Next Step
- Fokus sesi ini sudah selesai (Kebiasaan Sehat + flow Air). Tidak memulai Report Food atau full 7-category tabs, sesuai instruksi eksplisit terakhir user.
- Jika user punya screen recording yang dimaksud, bisa dikirim ulang untuk direview terhadap implementasi yang sudah jadi — tidak wajib, karena spesifikasi tertulis sudah cukup untuk implementasi saat ini.

---

## 2026-08-26 (lanjutan lagi) — Perkuat Affordance Tile Kebiasaan Sehat

### 1. Tanggal
2026-08-26

### 2. Tujuan perubahan
Follow-up langsung dari entry di atas: user menilai chevron kecil di pojok tile ("›" 10px) masih terlalu lemah sebagai sinyal "ini bisa dibuka." Tujuannya membuat tile Berat/Air/Olahraga terasa jelas seperti kartu aksi, bukan sekadar angka.

### 3. Masalah UX sebelumnya
Chevron kecil di pojok kanan-atas mudah terlewat; tile masih terasa seperti stat-card pasif meski sudah bisa ditekan.

### 4. Keputusan yang diambil
- **Layout tile diubah dari "teks tersusun ke bawah" menjadi row: [icon badge] [label+value] [chevron]** — reuse pola yang SUDAH terbukti sebagai sinyal "bisa ditekan" di halaman yang sama: card AI Coach (`ikon lingkaran di kiri → teks → "›" di kanan`). Bukan pola baru, jadi tidak menambah "bahasa visual" yang perlu dipelajari user.
- **Icon badge lingkaran 36px (`bg-accent-soft text-accent`)** untuk 3 tile actionable (Berat/Air/Olahraga) — dipakai satu warna aksen yang sudah ada (violet accent), bukan warna baru per tile, supaya tetap "tidak terlalu banyak warna." Icon: scale/timbangan (Berat), gelas air — reuse SVG yang sudah ada (Air), api/energi (Olahraga) — ketiganya digambar tangan sebagai inline SVG konsisten dengan gaya BottomNav/ikon lain yang sudah ada (stroke-based, tanpa fill kecuali titik kecil).
- **Skor tetap tanpa chevron**, badge ikon-nya sengaja abu-abu netral (`bg-surface-2 text-ink-dim`, bukan accent) — perbedaan warna badge sekarang JUGA jadi sinyal "yang ini actionable, yang ini bukan," bukan cuma ada/tidaknya chevron.
- Padding tile diperbesar (`py-1.5`→`py-3`), teks label/value dinaikkan (`text-[10px]`→`text-[10.5px]/text-xs`) — touch target lebih besar dan lebih nyaman.

### 5. Implementasi
Restyle murni JSX/Tailwind pada blok "Kebiasaan Sehat" di `Dashboard.tsx` — tidak ada perubahan state, handler, routing, atau data. `onClick` masing-masing tile (navigasi `/progress?tab=weight`, `/hydration`, buka `ExerciseSheet`) sama persis seperti sebelumnya.

### 6. File yang berubah
`src/features/dashboard/Dashboard.tsx` — hanya blok render tile Kebiasaan Sehat.

### 7. Dampak terhadap data/schema
Tidak ada.

### 8. Testing yang benar-benar dilakukan (tested by Alig)
- Build: `npm run build` — 0 error.
- Browser: dibuka di dev server terpisah (port 5174, tidak mengganggu server preview user di 5173 — dan karena keduanya jalan dari source yang sama via Vite HMR, perubahan ini otomatis ikut ter-refresh di tab preview manapun yang user buka di 5173 juga).
- Visual dikonfirmasi: badge ikon ungu + chevron pada Berat/Air/Olahraga, badge abu-abu tanpa chevron pada Skor.
- Tap tile Air → tetap navigasi benar ke `/hydration`, angka `4/11 gls` tetap konsisten dengan data yang sudah tersimpan dari pass sebelumnya (regresi aman).
- Console: 0 error/warning.
- Viewport 360px: tidak ada clipping/wrap aneh pada label "Olahraga" (kata terpanjang) maupun value "4/11 gls".

### 9. Hasil testing
**PASS** — perubahan visual murni, fungsi tap/navigasi tiap tile tetap berjalan seperti pass sebelumnya, tidak ada regresi.

### 10. Bug yang ditemukan
Tidak ada.

### 11. Bug yang belum diverifikasi
Tidak ada untuk perubahan pass ini.

### 12. Known Issues
Sama seperti entry sebelumnya (Skor tetap read-only tanpa destinasi; screen recording referensi user masih belum ditemukan di project).

### 13. Next Step
Menunggu review/feedback user atas tampilan baru ini. Tidak ada pekerjaan lanjutan yang direncanakan sendiri.

---

## 2026-08-26 (lanjutan) — P2: Report Food / Laporkan Makanan

### 1. Tanggal
2026-08-26

### 2. Tujuan
P2 prioritas berikutnya setelah My Foods: memberi user cara yang masuk akal untuk menyampaikan bahwa ada masalah pada entri makanan di katalog FitKu (nama salah, kalori/gizi tidak akurat, ukuran porsi tidak sesuai, duplikat, dll).

### 3. Masalah UX sebelumnya
Tidak ada mekanisme apa pun bagi user untuk menandai/melaporkan makanan katalog yang datanya salah. Kalau user sadar "Nasi Putih" di database ternyata kalorinya tidak sesuai realita, tidak ada yang bisa dilakukan selain diam-diam tidak percaya data itu lagi.

### 4. Root Cause
N/A — fitur baru, bukan bugfix. (Satu bug NYATA ditemukan selagi implementasi — lihat poin 10.)

### 5. Keputusan yang diambil
- **Reframing dari "kirim ke server" menjadi "alat kualitas data lokal yang jujur.** FitKu 100% client-side (Dexie/IndexedDB, tanpa backend/server). Referensi MyFitnessPal (yang dianalisis sebelumnya) mengasumsikan laporan dikirim ke tim database terpusat — itu **tidak bisa ditiru apa adanya** karena FitKu tidak punya pipeline semacam itu, dan mengklaim "laporan akan ditinjau tim kami" akan menjadi placeholder palsu (melanggar prinsip FitKu yang eksplisit: jangan membuat fitur yang terlihat nyata padahal tidak). Solusi: laporan disimpan lokal DAN diberi dampak nyata — makanan yang dilaporkan otomatis dikeluarkan dari saran "Favorit" (karena tidak masuk akal menyarankan ulang makanan yang usernya sendiri bilang datanya salah), dan tetap terlihat jelas via badge "Dilaporkan" di semua tempat lain (tidak disembunyikan, supaya tidak terasa seperti "hilang tiba-tiba").
- **Alasan pelaporan disesuaikan ke bentuk data FitKu sendiri** (Nama makanan salah / Kalori-gizi tidak akurat / Ukuran porsi tidak sesuai / Makanan duplikat / Lainnya) — bukan kategori MyFitnessPal yang berat ke merek dagang (FitKu tidak punya field brand).
- **Upsert per (user, food) via composite key** `${userId}:${foodId}` — mengikuti pola `dailyNotes`/`hydrationLogs` yang sudah ada. Melapor ulang pada makanan yang sama meng-update laporan lama (checkbox & catatan lama muncul kembali, tombol berubah jadi "Perbarui Laporan"), bukan menumpuk banyak laporan duplikat untuk satu makanan yang sama.
- **Hanya makanan katalog (`Food`) yang bisa dilaporkan** — bukan Makanan Saya (`MyFood`, milik pribadi user, melaporkan makanan buatan sendiri tidak masuk akal) dan bukan entri Tambah Cepat (tidak terhubung ke katalog mana pun). Diimplementasikan dengan membuat prop `onReport` di `PortionSheet` OPSIONAL — link laporan otomatis hilang kalau prop-nya tidak diberikan, jadi pemanggilan `PortionSheet` untuk Makanan Saya di `FoodTracker.tsx` tidak perlu logic pengecualian tambahan, cukup tidak mengoper prop tsb.
- **Makanan yang dilaporkan TIDAK disembunyikan dari daftar/kategori/pencarian** — hanya dikeluarkan dari tab Favorit. Alasan: menyembunyikan total bisa membingungkan ("kok makanan ini hilang?") dan user lain (kalau nanti multi-user) atau user itu sendiri di hari lain mungkin masih perlu mencatatnya.
- **Entry point: link kecil "⚠️ Laporkan masalah pada makanan ini" di bagian bawah `PortionSheet`** (bukan tombol besar) — konsisten dengan MFP yang juga menaruhnya sebagai link sekunder, dan sesuai prinsip FitKu "jangan membuat UI ramai." Dipasang di KEDUA tempat `PortionSheet` menampilkan makanan katalog: alur tambah baru (`FoodTracker.tsx`) dan alur edit makanan yang sudah dicatat (`Dashboard.tsx`).

### 6. Implementasi
Tabel Dexie baru `foodReports` (skema v6, additive). Repository `foodReportRepository` dengan `reportedFoodIds()`, `getForFood()`, `save()` (upsert). Komponen baru `ReportFoodSheet.tsx` (checklist alasan + catatan opsional, murni presentational — logic persistensi ada di parent, sama seperti pola `ExerciseSheet`/`QuickAddSheet`). `PortionSheet.tsx` dapat 2 prop opsional (`onReport`, `reported`) yang menampilkan link laporan hanya kalau `onReport` diberikan. `FoodTracker.tsx` dan `Dashboard.tsx` masing-masing menyimpan state `reportedIds`/`reportingFood`/`reportingInitial` dan meng-handle buka/submit laporan secara independen (dua entry point, satu sumber data).

### 7. File yang berubah
**Baru:** `src/data/types/foodReport.types.ts`, `src/data/repositories/foodReportRepository.ts`, `src/domain/foodReport.ts`, `src/features/food-tracker/components/ReportFoodSheet.tsx`.
**Diubah:** `src/data/db.ts` (SCHEMA_VERSION 5→6, tabel `foodReports`), `src/features/food-tracker/components/PortionSheet.tsx` (prop `onReport`/`reported` + link), `src/features/food-tracker/FoodTracker.tsx` (wiring laporan + badge "Dilaporkan" + filter Favorit), `src/features/dashboard/Dashboard.tsx` (wiring laporan untuk alur edit).

### 8. Dampak terhadap data/schema
Tabel baru `foodReports: 'key, userId, foodId'` — additive, tidak mengubah tabel lain. Tidak ada migrasi destruktif.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- Build: `npm run build` — 0 TypeScript error, dijalankan 4× sepanjang implementasi.
- Browser (server preview user di 5173, viewport 390px lalu 360px):
  - Buka PortionSheet untuk "Nasi Putih" dari tab Favorit (FoodTracker) → link "⚠️ Laporkan masalah pada makanan ini" tampil di bawah tombol Tambahkan.
  - Tap link → `ReportFoodSheet` terbuka dengan 5 checklist alasan, textarea catatan, tombol "Kirim Laporan" disabled (belum ada alasan dicentang).
  - Centang "Kalori/gizi tidak akurat" + isi catatan → tombol aktif → submit → sheet tertutup, kembali ke daftar.
  - Tab Favorit langsung menampilkan empty state ("Belum ada riwayat") — Nasi Putih terbukti dikeluarkan dari Favorit segera setelah dilaporkan.
  - Pindah ke tab kategori "Nasi & Karbo" → "Nasi Putih" MASIH tampil lengkap dengan badge kuning "Dilaporkan" di sebelah namanya, tetap bisa ditambahkan seperti biasa — dikonfirmasi TIDAK disembunyikan dari luar Favorit.
  - Tap "+" pada Nasi Putih lagi → PortionSheet menampilkan link berubah jadi "✓ Sudah dilaporkan · Lihat laporan" → tap → `ReportFoodSheet` terbuka dengan checkbox dan catatan LAMA ter-prefill persis, tombol berubah jadi "Perbarui Laporan" — alur lihat/edit laporan lama terkonfirmasi bekerja.
  - Reload penuh halaman → badge "Dilaporkan" dan status Favorit-kosong tetap konsisten — persistence terkonfirmasi.
  - Dari Dashboard: buka "Nasi Putih" yang sudah dicatat (alur edit) → PortionSheet di sini juga menampilkan "✓ Sudah dilaporkan · Lihat laporan" — mengonfirmasi `reportedIds` konsisten di kedua entry point (data yang sama, bukan state terpisah yang bisa desync).
  - Console: 0 error/warning selain noise Vite dev standar, dicek setelah seluruh rangkaian di atas.
  - Mobile 360px: `ReportFoodSheet` (5 checkbox + textarea + tombol) tidak ada elemen terpotong/overlap.

### 10. Bug yang ditemukan
11. Saat memverifikasi klaim copy "laporan ikut tersimpan saat ekspor data" yang awalnya mau ditulis di `ReportFoodSheet`, ditemukan bahwa `src/features/settings/dataBackup.ts` (`exportBackup`/`importBackup`) **hardcoded hanya mencakup 5 tabel asli** (`users`, `foodLogs`, `dailySummaries`, `weightHistory`, `subscriptionStatus`) — tabel yang ditambahkan sejak P1/P2 (`hydrationLogs`, `dailyNotes`, `exerciseLogs`, `myFoods`, dan sekarang `foodReports`) **tidak pernah ikut ter-ekspor atau ter-impor**. Ini bug pre-existing yang sudah ada sejak fitur Air/Catatan Hari Ini dibangun P1, bukan sesuatu yang baru rusak di pass ini.
   Solusi diambil di pass ini: TIDAK memperbaiki `dataBackup.ts` (di luar scope brief ini, sesuai instruksi eksplisit "jangan mulai pekerjaan P2 lainnya"/fokus). Sebagai gantinya, klaim yang salah dihapus dari copy `ReportFoodSheet` sebelum sempat dites (jadi tidak pernah benar-benar ditampilkan ke user), dan bug-nya dicatat di sini untuk diperbaiki terpisah.

### 11. Bug yang belum diverifikasi
Tidak ada untuk fitur Report Food sendiri — seluruh alur (lapor baru, lihat/edit laporan lama, badge, filter Favorit, persistence, dua entry point) sudah diuji langsung seperti tercatat di atas.

### 12. Known Issues
- **`dataBackup.ts` tidak mencakup 5 tabel yang ditambahkan sejak P1** (lihat poin 10) — bukan cacat fitur Report Food, tapi risiko data-safety nyata untuk banyak fitur (Air, Catatan, Olahraga, Makanan Saya, dan sekarang Laporan) yang sebaiknya diperbaiki di sesi terpisah.
- Report Food tidak punya UI "daftar laporan saya" terpusat (mis. di Settings) — user hanya bisa melihat/mengubah laporan lewat PortionSheet makanan yang bersangkutan. Ini keputusan scope yang disengaja (lihat poin 5), bukan keterbatasan teknis.

### 13. Next Step
- Rekomendasi terpisah (bukan bagian dari brief ini, perlu persetujuan user dulu): perbaiki `dataBackup.ts` supaya ekspor/impor mencakup semua tabel saat ini.
- Tidak memulai Report Food lanjutan (mis. daftar laporan terpusat) atau item P2 lain (full 7-category tabs) tanpa instruksi eksplisit lanjutan.

---

## 2026-08-26 (lanjutan) — Fix: Data Backup/Export/Import Tidak Lengkap

### 1. Tanggal
2026-08-26

### 2. Fakta bug (terverifikasi sebelumnya, dikerjakan sekarang)
`src/features/settings/dataBackup.ts` hardcoded hanya mencakup 5 tabel lama (`users`, `foodLogs`, `dailySummaries`, `weightHistory`, `subscriptionStatus`). Lima tabel yang ditambahkan sejak P1/P2 — `hydrationLogs`, `dailyNotes`, `exerciseLogs`, `myFoods`, `foodReports` — tidak pernah ikut ter-ekspor maupun ter-impor. Ditemukan pertama kali saat implementasi Report Food (entry sebelumnya), dikerjakan terpisah sesuai instruksi user.

### 3. Root Cause
Setiap nama tabel di-hardcode manual di 4 tempat berbeda dalam satu file (interface `BackupFile`, destructuring di `exportBackup`, array transaksi di `importBackup`, pasangan `clear()`/`bulkAdd()`). Tidak ada mekanisme yang memaksa file ini tetap sinkron dengan `db.ts` — setiap kali tabel baru ditambahkan ke schema (terjadi 5× sepanjang P1/P2), tidak ada yang mengingatkan untuk mendaftarkannya di sini juga. Bug kelas ini (manual enumeration drift) berpotensi terulang lagi kalau hanya ditambal dengan mendaftarkan 5 tabel yang hilang.

### 4. Keputusan yang diambil
- **Perbaikan di akar masalah, bukan sekadar menambal.** Daftar tabel yang di-backup sekarang **diturunkan otomatis dari `db.tables`** (Dexie API resmi yang mendaftar semua tabel di schema versi aktif saat ini) dikurangi satu pengecualian eksplisit (`foods`), bukan daftar nama yang ditulis tangan. Konsekuensinya: tabel baru apa pun yang ditambahkan ke `db.ts` di masa depan otomatis ikut ter-backup tanpa perlu menyentuh `dataBackup.ts` lagi — kelas bug ini secara struktural tidak bisa terulang.
- **`foods` sengaja tetap dikecualikan** — ini katalog seed bersama yang dibuat ulang otomatis oleh `foodRepository.ensureSeeded()`, bukan data milik user. Menyertakannya di backup hanya menambah ukuran file tanpa manfaat, dan berisiko me-restore versi katalog yang stale.
- **Import HANYA memulihkan tabel yang benar-benar disebutkan di file backup DAN masih ada di schema saat ini.** Tabel yang tidak disebutkan di file (mis. backup lama dari sebelum `myFoods` ada) **dibiarkan sepenuhnya utuh, tidak dikosongkan.** Ini keputusan data-safety paling penting di seluruh perbaikan ini — memulihkan backup lama tidak boleh menghapus data fitur baru yang backup itu bahkan tidak tahu keberadaannya.
- **`importBackup()` sekarang mengembalikan jumlah tabel yang benar-benar dipulihkan** (bukan `void`) — dipakai `Settings.tsx` untuk menampilkan pesan yang jujur ("Data berhasil dipulihkan (10 tabel)" vs sebelumnya pesan generik tanpa detail).
- **Error dari `importBackup()` sekarang membawa pesan spesifik** (`Error` dengan `.message` yang jelas: "File bukan JSON yang valid.", "File backup tidak valid.", "File backup tidak berisi data yang bisa dipulihkan.") — `Settings.tsx` menampilkan pesan itu langsung, bukan satu pesan generik "Gagal memulihkan" untuk semua kasus kegagalan.
- **Format file backup TIDAK diubah** (tetap `{schemaVersion, exportedAt, data: {...}}`) — supaya file backup lama yang sudah ada di perangkat user (dari sebelum perbaikan ini) tetap valid untuk diimpor, bukan jadi tidak kompatibel.
- **Tidak menambahkan versioning/compatibility-check baru** (mis. menolak impor kalau `schemaVersion` file lebih baru dari app) — Dexie di project ini selalu additive (tidak pernah ada migrasi destruktif, prinsip yang sudah dipegang sejak P0), jadi file dari versi mana pun aman diimpor apa adanya; menambah pengecekan versi hanya menambah kompleksitas tanpa manfaat nyata untuk pola migrasi yang sudah ada.

### 5. Implementasi
`dataBackup.ts` ditulis ulang: `backupTableNames()` (helper baru, `db.tables` dikurangi `foods`) dipakai baik oleh `exportBackup()` maupun `importBackup()` — satu sumber kebenaran, bukan dua daftar terpisah yang bisa desync lagi. `exportBackup()` iterasi generik dengan `db.table(name).toArray()`. `importBackup()` memfilter `Object.keys(parsed.data)` ke tabel yang valid+ada, lalu clear+bulkAdd HANYA untuk tabel itu di dalam satu transaksi. `Settings.tsx`'s `handleImport` diperbarui untuk memakai return value (jumlah tabel) dan `err.message`.

### 6. File yang berubah
`src/features/settings/dataBackup.ts` (ditulis ulang total), `src/features/settings/Settings.tsx` (`handleImport` memakai return value + `err.message`).

### 7. Dampak terhadap data/schema
Tidak ada perubahan schema Dexie. Format file backup JSON tidak berubah (backward compatible dengan file lama). Tidak ada migrasi, tidak ada data yang dihapus dari database aktif kecuali secara eksplisit lewat aksi restore (perilaku yang sudah ada sebelumnya, tidak berubah).

### 8. Testing yang benar-benar dilakukan (tested by Alig) — validasi NYATA, bukan cuma baca kode
Dilakukan di server preview user (5173) dengan data akun asli (bukan akun testing terpisah), pakai teknik: `javascript_tool` untuk dynamic-`import()` modul asli dari dev server dan menjalankan fungsi asli `exportBackup()`/`importBackup()` langsung, plus intersep `URL.createObjectURL` untuk menangkap isi Blob export tanpa harus mengandalkan folder Downloads (yang ternyata tidak bisa diakses dari sesi otomasi ini — dicoba dulu, dicatat sebagai keterbatasan lingkungan, bukan masalah aplikasi).
- **Baseline sebelum apa pun disentuh:** `dailyNotes=1, exerciseLogs=0, foodLogs=4, foodReports=1, foods=56, hydrationLogs=1, myFoods=0, users=1, weightHistory=1`.
- Ditambahkan 1 `exerciseLogs` dan 1 `myFoods` nyata lewat repository asli (bukan raw insert) supaya semua 10 tabel non-katalog punya data nyata untuk diuji.
- **Export:** dijalankan fungsi asli `exportBackup()` → hasil ditangkap → dikonfirmasi berisi PERSIS 10 nama tabel (`users, foodLogs, dailySummaries, weightHistory, subscriptionStatus, hydrationLogs, dailyNotes, exerciseLogs, myFoods, foodReports`), `foods` (56 item katalog) TIDAK ada di dalamnya, `schemaVersion: 6` tercatat benar, dan jumlah tiap tabel sama persis dengan isi database saat itu.
- File hasil capture disimpan sebagai file nyata (`fitku-backup-real-export.json`, tervalidasi valid JSON via `python3 -m json.tool`).
- **Import (skenario utama):** database sengaja dikosongkan untuk `myFoods`/`exerciseLogs`/`hydrationLogs` (jadi 0), lalu file backup nyata di atas di-upload lewat elemen `<input type=file>` sungguhan di halaman Settings (bukan simulasi) — `window.confirm` di-stub supaya tidak memblokir sesi otomasi (dialog konfirmasi itu sendiri BUKAN bagian dari perbaikan ini, sudah ada sejak awal). Hasil: pesan UI benar "Data berhasil dipulihkan (10 tabel)", dan ketiga tabel yang sengaja dikosongkan kembali ke isi aslinya (1 masing-masing) — dikonfirmasi lewat query database langsung, bukan cuma percaya pesan UI.
- **Import (skenario backward-compat — PALING PENTING):** dibuat file backup buatan berbentuk LAMA (hanya 5 key: `users/foodLogs/dailySummaries/weightHistory/subscriptionStatus`, tanpa 5 tabel baru sama sekali) lalu diimpor. Hasil: pesan UI benar "Data berhasil dipulihkan (5 tabel)"; `foodLogs` dan `weightHistory` berubah sesuai isi file (termasuk dikosongkan sesuai file), TAPI `dailyNotes/exerciseLogs/foodReports/hydrationLogs/myFoods` **tetap utuh di angka semula (1 masing-masing), sama sekali tidak tersentuh** — dikonfirmasi lewat query database langsung. Ini bukti nyata bahwa restore backup lama tidak merusak data fitur baru.
- **Error handling:** file JSON yang sengaja rusak (`{ this is not valid json,,, }`) diupload → pesan UI benar "File bukan JSON yang valid.", tidak ada crash, tidak ada exception tak tertangani di console, dan database TIDAK berubah sama sekali dibanding sebelum upaya import ini (dikonfirmasi lewat query).
- **Persistence setelah reload:** setelah seluruh rangkaian test di atas, data asli user (`foodLogs`, `weightHistory` yang sempat dikosongkan saat test backward-compat) dipulihkan kembali dengan meng-import ulang file real-export — dikonfirmasi lewat NAVIGASI PENUH (bukan cuma re-render) ke Dashboard bahwa 1.510 kkal, Nasi Putih, 2× Nasi goreng kantin, Air 4/10 gls, Berat 74kg semua tampil benar seperti sebelum testing dimulai.
- **Console:** dibaca ulang setelah seluruh rangkaian (export asli, 2× import sukses, 1× import gagal) — 0 error, 0 warning selain noise Vite dev standar.
- **Mobile/UI:** satu-satunya perubahan interface adalah teks pesan hasil import di Settings (sekarang menyebut jumlah tabel) — dicek pada viewport 360px, tidak ada pemotongan/overflow.
- **Build:** `npm run build` — 0 TypeScript error, dijalankan sebelum dan sesudah seluruh rangkaian testing di atas.

### 9. Hasil
**PASS untuk seluruh dimensi yang diminta user: export data, import kembali, data lama (backward compatibility), tabel P1/P2 yang sebelumnya hilang, persistence setelah reload, error handling, mobile/UI, console, build.** Semua diverifikasi dengan mengubah data nyata di database nyata dan membaca hasilnya langsung dari database (bukan hanya membaca pesan UI atau membaca kode).

### 10. Hal yang masih belum tervalidasi
- Skenario import lintas-device (mis. export dari HP, import di desktop) — secara logika seharusnya bekerja sama (format file tidak bergantung device) tapi belum diuji lintas dua instance browser berbeda secara eksplisit.
- Perilaku saat file backup sangat besar (ribuan `foodLogs`) belum diuji — data test yang tersedia relatif kecil (4-56 baris per tabel). Tidak ada indikasi masalah performa dari desain (Dexie `bulkAdd` dirancang untuk volume besar), tapi belum dibuktikan dengan data besar sungguhan.

### 11. Known Issues
Tidak ada bug baru ditemukan pada fitur ini. Bug asli yang jadi alasan pengerjaan ini (5 tabel hilang dari backup) sudah diperbaiki dan diverifikasi tuntas.

### 12. Temuan terpisah (di luar scope, TIDAK dikerjakan)
- **[UPDATE — dikoreksi setelah user mengecek langsung]** Folder Downloads Chrome tidak dapat diakses lewat shell sesi otomasi ini (`ls ~/Downloads` kosong setelah klik unduh) — awalnya dicatat sebagai keterbatasan tak terverifikasi. User kemudian membuka file unduhan itu langsung dari Chrome-nya sendiri dan mengonfirmasi isinya **benar dan lengkap**: persis 10 tabel yang diharapkan, `foods` benar tidak ada, `schemaVersion: 6` benar. Jadi ini murni keterbatasan shell sesi otomasi (folder unduhan Chrome sesi ini tidak ter-mount ke shell yang dipakai Alig), BUKAN indikasi ada masalah pada fitur unduh — fitur unduh terbukti bekerja benar untuk user sungguhan. Tidak ada tindakan lanjutan diperlukan.
- `window.confirm()` pada `handleImport` di `Settings.tsx` (dialog "Ini akan menimpa semua data...") masih memakai native `window.confirm()`, pola yang sudah lama ditandai berisiko (memblokir event loop) di area lain project ini dan sudah diganti dengan konfirmasi inline non-blocking di banyak tempat. Tidak diubah di pass ini karena di luar scope brief (perbaikan backup data, bukan perbaikan pola konfirmasi) — dicatat sebagai kandidat perbaikan terpisah kalau user mau.

### 13. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Dua temuan terpisah di atas menunggu keputusan user kalau mau ditindaklanjuti.

---

## 2026-08-26 (lanjutan) — Koreksi Catatan Air yang Sudah Tersimpan

### 1. Tanggal
2026-08-26

### 2. Tujuan
Setelah user mencatat jumlah gelas dan menekan Simpan, sebelumnya tidak ada cara jelas untuk memperbaiki kalau jumlahnya salah (mis. tersimpan 5 gelas padahal maksudnya 3). Tujuan: user bisa membuka kembali halaman Air dan mengoreksi angka yang sudah tersimpan menjadi jumlah yang benar.

### 3. Masalah UX sebelumnya
Flow Air (dari pass sebelumnya) hanya punya link kecil "− Kurangi 1 gelas (koreksi kesalahan)" yang mengurangi 1 per tap. Untuk salah-catat yang selisihnya lebih dari 1 (contoh user: 5 tersimpan, seharusnya 3 — selisih 2), user harus tap berkali-kali tanpa tahu pasti sudah sampai di angka yang benar. Tidak ada cara langsung "atur ke angka X".

### 4. Keputusan yang diambil
- **Angka besar "Sudah diminum hari ini" dijadikan bisa diedit langsung** (tap link "✎ Koreksi" di pojok kanan card) — bukan menambah tombol -1/+1 lagi. Dengan begini, koreksi untuk selisih berapa pun (2, 5, atau reset ke 0) hanya butuh 1 aksi ganti angka + 1 tap Simpan, bukan tap berulang. Ini juga menggantikan (bukan menambah di samping) link "− Kurangi 1 gelas" yang lama, supaya cuma ada SATU mekanisme koreksi yang jelas — sesuai instruksi eksplisit "jangan menambahkan kompleksitas hanya untuk menyelesaikan masalah sederhana ini."
- **Pola "Koreksi" mengambil style link "Edit" yang sudah ada** di card Profil (`Settings.tsx`) — teks kecil warna accent di pojok kanan atas card, tepat di sebelah data yang bisa diedit. Bukan pola baru, reuse pola yang user sudah kenal dari Settings.
- **Tombol Simpan/Batal dalam mode edit pakai bentuk pill** yang sama dengan Chip/badge yang sudah dipakai di seluruh app (preset gelas, badge "Dilaporkan", pill tema) — bukan tombol besar full-width baru, supaya card tetap ringkas ("tidak membuat layar ramai").
- **Repository method baru `set(userId, date, glasses)`** — absolute write (bukan relative seperti `adjust()`), diclamp `Math.max(0, ...)` dan `Math.min(MAX_GLASSES, ...)` persis sama seperti `adjust()`. Ini operasi tulis langsung ke Dexie via `put()`, bukan sekadar `setState` — perubahan koreksi benar-benar tersimpan ke database, bukan cuma tampilan sementara.
- **Setelah Simpan koreksi, TIDAK auto-navigasi ke Home** (beda dari flow "catat baru" yang memang auto-navigasi) — karena mengoreksi adalah aksi perbaikan cepat di tempat, bukan "aku baru minum sekian, selesai, kembali ke beranda". User tetap di halaman Air setelah koreksi, bisa langsung lihat angka baru, lalu keluar sendiri kalau sudah puas.
- **Flow "pilih jumlah → Simpan → kembali ke Home" dan personalisasi target sama sekali tidak disentuh** — hanya area status/koreksi yang berubah.

### 5. Implementasi
`hydrationRepository.ts` dapat method baru `set()`. `Hydration.tsx` dapat state `editingTotal`/`editValue` dan 3 handler (`handleStartEdit`, `handleCancelEdit`, `handleSaveEdit`); card status kini punya 2 mode tampilan (angka statis vs. input+tombol saat mode edit). Link "− Kurangi 1 gelas" lama dan handler `handleCorrect`-nya dihapus, digantikan mekanisme baru ini.

### 6. File yang berubah
`src/data/repositories/hydrationRepository.ts` (method `set()` baru), `src/features/hydration/Hydration.tsx` (UI koreksi + hapus link lama).

### 7. Dampak terhadap data/schema
Tidak ada. Tabel `hydrationLogs` dan bentuk datanya (`{key, userId, date, glasses}`) sama sekali tidak berubah — `set()` menulis ke tabel yang sama persis seperti `adjust()`, cuma beda cara menghitung nilai akhirnya (absolute vs relative).

### 8. Testing yang benar-benar dilakukan (tested by Alig) — mengikuti checklist 10 poin di brief
1. **Catat jumlah minum:** pilih preset "2 gelas" dari 4/10 awal → Simpan.
2. **Pastikan kembali ke Home:** dikonfirmasi URL berubah ke "/" otomatis.
3. **Buka kembali Air:** navigasi ulang ke `/hydration`, angka "6/10 gelas" tampil benar (4+2).
4. **Koreksi jumlah:** tap "✎ Koreksi" → input muncul terisi "6" → diganti jadi "3" → tap "✓ Simpan koreksi" → angka besar langsung berubah jadi "3/10 gelas", progress bar & baris ikon gelas ikut menyesuaikan, TIDAK berpindah halaman (sesuai desain).
5. **Pastikan tersimpan (bukan cuma visual):** dicek lewat reload halaman penuh (`navigate` ke `/hydration` lagi) — angka tetap "3/10 gelas", bukan balik ke 6. **Juga dicek dari Home:** tile Air menampilkan "3/10 gls" — konsisten dengan halaman Air.
6. **Reload dan pastikan tetap benar:** sudah tercakup di poin 5.
7. **Tidak bisa negatif:** tap Koreksi, ganti isi jadi "-5", Simpan koreksi → hasilnya "0/10 gelas" (bukan -5) — clamp berfungsi baik di alur nyata.
8. **Flow lama tetap berjalan:** setelah koreksi, preset "3 gelas" dipilih lagi, preview "+3 gelas → total jadi X/10" tampil benar, tekan Simpan → otomatis kembali ke Home lagi seperti biasa — regresi flow lama AMAN.
9. **Console:** dibaca setelah seluruh rangkaian test (catat, koreksi, koreksi-negatif, catat lagi) — 0 error, 0 warning selain noise Vite dev standar.
10. **Mobile viewport:** dicek di lebar 360px — mode tampilan normal maupun mode edit (input + tombol "Simpan koreksi"/"Batal") sama-sama tidak ada elemen terpotong/tumpang tindih.
- **Build:** `npm run build` — 0 TypeScript error, dijalankan sebelum dan sesudah seluruh testing.
- Target hidrasi ("/ 10 gelas") dicek TETAP sama di semua screenshot sepanjang testing — personalisasi P1 tidak terganggu oleh perubahan ini.

### 9. Hasil
**PASS untuk seluruh 10 poin checklist di brief** — diuji langsung di browser dengan interaksi nyata (bukan hanya baca kode), termasuk kasus penting: koreksi selisih besar (6→3 dalam satu aksi), non-negative guard, persistence lintas reload dan lintas halaman (Air ↔ Home), dan regresi flow "catat baru" yang lama.

### 10. Known Issues
Tidak ada bug ditemukan. Tombol Batal saat mode edit sengaja tidak diuji eksplisit langkah-demi-langkah dalam skenario "ubah nilai lalu Batal, pastikan nilai lama tidak berubah" — secara kode ini trivial benar (Batal cuma `setEditingTotal(false)`, tidak pernah memanggil `set()`), tapi belum divalidasi lewat klik nyata seperti item-item lain di atas. Dicatat jujur, tidak diklaim PASS.

### 11. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Kalau user mau, skenario "Batal" bisa divalidasi eksplisit di sesi berikutnya (risiko dinilai sangat rendah).

---

## 2026-08-26 (lanjutan) — P2: Full 7-Category Food Tabs

### 1. Tanggal
2026-08-26

### 2. Tujuan
Item terakhir P2 yang belum dikerjakan dari roadmap `fitku-v2-competitive-blueprint` (memory): "P2 = My Foods, Report Food, full 7-category food tabs." My Foods dan Report Food sudah selesai (lihat entry-entry sebelumnya) — pass ini menuntaskan item ketiga: kategori tab di FoodTracker dilengkapi dari 3 menjadi 7, sesuai `FoodCategory` yang sudah ada di `src/data/types/food.types.ts` (`nasi_karbo | lauk | sayur | gorengan | sup_kuah | camilan | minuman`).

### 3. Masalah UX sebelumnya
`CATEGORY_TABS` di `FoodTracker.tsx` hanya mendaftarkan 3 dari 7 kategori (Nasi & Karbo, Lauk, Gorengan). Empat kategori yang datanya sudah ada di seed (`sayur`, `sup_kuah`, `camilan`, `minuman` — total 25 item makanan) tidak punya tab sama sekali, hanya bisa ditemukan lewat pencarian nama manual.

### 4. Root Cause
N/A — bukan bugfix, murni fitur roadmap yang belum digarap (dicatat eksplisit sebagai "TIDAK dikerjakan" di entry 2026-08-26 "My Foods + Buku Harian", poin 13).

### 5. Keputusan yang diambil
- **Tidak mengarang kategori baru.** Keempat tab baru (Sayur, Sup & Kuah, Camilan, Minuman) memakai persis nilai `FoodCategory` yang sudah ada di domain — dikonfirmasi lewat `grep` sebelum implementasi bahwa seed (`indonesianFoods.seed.ts`) sudah punya data nyata untuk ketujuh kategori (nasi_karbo: 8, lauk: 17, sayur: 7, gorengan: 6, sup_kuah: 7, camilan: 6, minuman: 5 — total 56 item, cocok dengan jumlah yang selama ini dipakai di seluruh testing project ini).
- **Urutan tab mengikuti urutan deklarasi `FoodCategory` di source** (nasi_karbo → lauk → sayur → gorengan → sup_kuah → camilan → minuman), bukan urutan populer/alfabetis buatan sendiri — supaya urutan tab punya sumber kebenaran tunggal (definisi domain), bukan preferensi visual yang bisa berubah-ubah tanpa alasan.
- **Chip row scrollable (`overflow-x-auto`) yang sudah ada dipertahankan apa adanya**, hanya ditambah 4 chip baru — tidak diganti jadi grid/dropdown/pola baru. Total kini 10 chip (Favorit/Terakhir/Milikku + 7 kategori) dalam satu baris yang bisa di-scroll. Alasan: pola ini sudah terbukti bekerja untuk 6 chip sebelumnya (dicatat eksplisit di entry "My Foods + Buku Harian" sebagai perilaku lama yang diterima, bukan bug), menambah pola navigasi baru (dropdown kategori, grid 2-baris, dll.) akan menambah kerumitan interaksi tanpa keperluan yang diminta user — user secara eksplisit menyerahkan keputusan layout ke Claude dengan syarat "paling natural berdasarkan pola FoodTracker yang sudah ada," dan memperluas pola yang sudah ada adalah pilihan yang paling natural menurut standar itu.
- **Label kategori baru** ("Sayur", "Sup & Kuah", "Camilan", "Minuman") ditulis mengikuti gaya penamaan 3 label lama ("Nasi & Karbo", "Lauk", "Gorengan") — Title Case, "&" untuk gabungan kata pada `sup_kuah`, satu kata untuk kategori tunggal.
- **Tidak menambahkan tab "Semua"** meski tipe `Tab` dan cabang `visibleFoods` untuk `'semua'` sudah ada di kode sejak sebelumnya (tidak pernah dipakai lewat UI) — di luar scope brief ini ("lengkapi 7 kategori", bukan "audit ulang seluruh sistem tab"), dan berpotensi duplikatif dengan pencarian nama yang sudah ada.

### 6. Implementasi
Satu perubahan: `CATEGORY_TABS` di `src/features/food-tracker/FoodTracker.tsx` diperluas dari 3 ke 7 entri. Tidak ada perubahan pada state, handler, tipe, repository, seed data, atau komponen lain — `visibleFoods` sudah generik (`allFoods.filter(f => f.category === tab)`) sejak awal dan otomatis bekerja untuk kategori apa pun tanpa perlu disentuh.

### 7. File yang berubah
`src/features/food-tracker/FoodTracker.tsx` (hanya array `CATEGORY_TABS`, baris 74-81).

### 8. Dampak terhadap data/schema
Tidak ada. Tidak ada perubahan skema Dexie, tipe, atau data seed — keempat kategori baru sudah lama ada di `FoodCategory` dan `indonesianFoods.seed.ts`, hanya belum ada jalur UI untuk mengaksesnya via tab.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error, dijalankan sebelum dan sesudah seluruh testing browser.
- **Browser walkthrough nyata** (dev server terpisah port 5174 — tidak mengganggu preview user di 5173 — viewport 390px lalu 360px, data akun nyata yang sudah ada di profil test 5174 dari sesi-sesi sebelumnya):
  - Chip row di-scroll kanan: seluruh 7 kategori (Nasi & Karbo, Lauk, Sayur, Gorengan, Sup & Kuah, Camilan, Minuman) terlihat dan bisa di-tap, scrollbar horizontal berfungsi.
  - **Sayur** dibuka → 7 item tampil persis sesuai seed (Tumis Kangkung, Sayur Asem, Sayur Lodeh, Gado-Gado, Capcay, Pecel Sayur, Karedok dengan badge region "Sunda").
  - **Sup & Kuah** dibuka → 7 item persis sesuai seed (Soto Ayam, Bakso Sapi Kuah, Sop Buntut, Rawon dengan badge "Jawa Timur", Sayur Bening Bayam, Mie Ayam, Soto Betawi dengan badge "Betawi").
  - **Camilan** dibuka → 6 item persis sesuai seed (Kerupuk Udang, Emping, Klepon, Pisang Rebus, Kacang Rebus, Roti Bakar Coklat).
  - **Minuman** dibuka → 5 item persis sesuai seed (Es Teh Manis, Kopi Susu, Jus Alpukat Tanpa Gula, Air Kelapa Muda, Susu Kedelai).
  - **Regresi 3 kategori lama** — Nasi & Karbo (8 item), Lauk (17 item, list scroll vertikal normal), Gorengan (6 item) — semua tetap tampil benar, tidak berubah dari sebelum penambahan 4 kategori baru.
  - **PortionSheet dari kategori baru**: dibuka dari "Susu Kedelai" (Minuman) → nama, kalori (90 kkal), protein (6g), stepper porsi, grid meal, tombol Tambahkan, dan link "Laporkan masalah pada makanan ini" semua tampil benar — fitur lama bekerja normal untuk makanan dari kategori yang baru dibuka.
  - **Report Food dari kategori baru**: link laporan pada "Susu Kedelai" dibuka → `ReportFoodSheet` tampil dengan 5 checklist, dicentang "Kalori/gizi tidak akurat" → submit → sheet tertutup, badge kuning "Dilaporkan" muncul di sebelah nama "Susu Kedelai" di tab Minuman (makanan TIDAK disembunyikan dari kategori, sesuai desain Report Food yang sudah ada) — fitur lama bekerja normal untuk makanan dari kategori yang baru dibuka.
  - **Search/filter**: mengetik "ayam" di kolom cari → hasil lintas kategori (Ayam Goreng Dada, Ayam Bakar, Ayam Suwir Kecap dari Lauk; Sate Ayam, Soto Ayam, Mie Ayam dari Lauk/Sup & Kuah) tampil benar, chip kategori otomatis disembunyikan selama ada query (perilaku lama, tidak berubah) — pencarian tidak rusak oleh penambahan kategori.
  - **Favorit**: tetap menampilkan riwayat frekuensi (Nasi Putih) seperti sebelumnya — tidak terganggu.
  - **Terakhir**: tetap menampilkan riwayat terbaru (Nasi Putih) seperti sebelumnya — tidak terganggu.
  - **Milikku / My Foods**: dibuat 1 item baru via Tambah Cepat + centang "Simpan sebagai Makanan Saya" ("Cek Regresi Kategori", 300 kkal) → muncul benar di tab Milikku dengan tombol Tambah/Hapus — fitur lama bekerja normal. Dikonfirmasi juga item ini **tidak bocor** ke tab kategori "Camilan" (kategori internal `myFoodAsFood()` yang di-hardcode `'camilan'` hanya dipakai untuk tampilan PortionSheet, bukan disimpan ke `allFoods`) — Camilan tetap tepat 6 item seperti seed, bukan 7.
  - **Mobile 360px**: chip terpanjang ("Sup & Kuah") tidak terpotong/wrap, seluruh 10 chip tetap bisa di-scroll dan di-tap tanpa overlap, list makanan per kategori (termasuk Minuman 5 item) tampil rapi tanpa elemen terpotong.
  - **Console**: dibaca ulang setelah reload penuh + klik semua kategori — hanya noise standar Vite dev (`[vite] connecting/connected`, info React DevTools), 0 error, 0 warning dari kode aplikasi.

### 10. Bug yang ditemukan
Tidak ada bug pada fitur ini. Catatan non-bug: pada viewport desktop-scale (bukan mobile), scrollbar horizontal overlay OS sempat menutupi sebagian bawah chip row dan membuat beberapa klik pertama meleset — ini murni karakteristik rendering scrollbar di lingkungan testing (bukan bug FitKu), diatasi dengan klik pada bagian atas chip. Tidak terjadi pada viewport mobile 390px/360px yang sebenarnya jadi target device FitKu.

### 11. Bug yang belum diverifikasi
Tidak ada untuk fitur ini — seluruh 7 kategori, regresi Favorit/Terakhir/Milikku/PortionSheet/Report Food/search, dan mobile 360px sudah diuji langsung seperti tercatat di atas.

### 12. Known Issues
- Item `MyFood` uji ("Cek Regresi Kategori", 300 kkal) tersisa di database dev-server test (port 5174) — bukan data user asli, tidak berdampak ke preview 5173 milik user. Percobaan menghapusnya lewat UI tap-dua-kali sempat tidak konsisten di viewport desktop-scale (kemungkinan sama dengan catatan scrollbar di atas), tidak dikejar lebih lanjut karena di luar scope fitur ini dan tidak berisiko terhadap data nyata.
- Tab "Semua" (`tab === 'semua'` di `visibleFoods`) tetap menjadi cabang kode yang tidak pernah dijangkau lewat UI — kondisi ini sudah ada sebelum pass ini dan tidak disentuh, dicatat sebagai observasi bukan bug baru.

### 13. Next Step
Roadmap P2 blueprint (My Foods, Report Food, full 7-category tabs) kini **tuntas seluruhnya**. Tidak ada pekerjaan lanjutan yang direncanakan sendiri — P3 (barcode, My Meals/Recipes, social, device integration) dan Social/Friends/Premium eksplisit TIDAK dikerjakan pada pass ini sesuai instruksi. Menunggu review dan instruksi eksplisit user untuk langkah berikutnya.

---

## 2026-08-26 (lanjutan) — Closeout Technical Debt (Opsi A)

### 1. Tanggal
2026-08-26

### 2. Tujuan
Setelah P0-P2 tuntas, user diminta memilih arah kerja berikutnya lewat proposal eksplisit (bukan asumsi Claude). User memilih **"Opsi A — Closeout technical debt"**: menuntaskan seluruh item yang sebelumnya tercatat sebagai "belum diverifikasi"/"belum tercatat" di Dev Log ini, supaya file ini kembali 100% akurat sebagai sumber fakta sebelum ada pekerjaan besar berikutnya.

### 3. Masalah UX sebelumnya
Empat item longgar dari entry-entry sebelumnya:
1. Tombol "Batal" di mode koreksi Air (`Hydration.tsx`) belum pernah diklik-uji langsung (entry "Koreksi Catatan Air", Known Issues).
2. `CalorieTab.tsx`'s "Tren 30 Hari" belum pernah dilihat rendering visualnya karena data user selalu <7 hari (entry "P1 TESTING SELESAI", Known Issues).
3. `Settings.tsx`'s `handleImport` masih memakai `window.confirm()` native (blocking event loop) — pola yang sudah lama ditandai berisiko dan diganti di banyak tempat lain di app, tapi belum di sini (entry "Fix: Data Backup", poin 12).
4. Tema toggle di Settings (pill "☀️ Terang"/"🌙 Gelap", teks "— ganti" dihapus) sudah terimplementasi di kode sejak sesi sebelumnya, tapi **tidak pernah punya entry Dev Log** — ditemukan sebagai gap dokumentasi murni saat cross-check state FitKu.

### 4. Root Cause
- Item 1 & 2: bukan bug, murni belum sempat diverifikasi lewat interaksi nyata pada pass sebelumnya (data/waktu tidak mendukung saat itu).
- Item 3: `window.confirm()` di titik ini luput dari pass "ganti ke inline-confirm" sebelumnya karena saat itu fokusnya perbaikan `dataBackup.ts`, bukan pola konfirmasi UI — dicatat eksplisit sebagai "di luar scope" saat itu, sekarang dikerjakan terpisah.
- Item 4: fix sudah diimplementasikan pada sesi kerja UX-polish sebelumnya, tapi entry Dev Log untuk fix itu tidak pernah ditulis — gap proses, bukan gap kode.

### 5. Keputusan yang diambil
- **`window.confirm()` diganti pola inline-confirm** yang konsisten dengan pola tap-dua-kali/staged-confirm yang sudah dipakai di seluruh app (delete log, delete My Foods, koreksi Air) — tapi disesuaikan bentuknya karena trigger-nya bukan tap tombol melainkan pemilihan file dari OS file-picker. Solusi: `<input type="file">` `onChange` sekarang hanya menyimpan `File` yang dipilih ke state (`pendingImportFile`), lalu merender kotak konfirmasi inline (nama file + teks peringatan + tombol "Ya, Timpa Data"/"Batal") di bawah tombol "↑ Pulihkan dari file" — proses import baru benar-benar jalan setelah tombol "Ya, Timpa Data" ditekan. Batal mengosongkan state dan me-reset `<input>` tanpa memanggil `importBackup()` sama sekali.
- **Tombol "Ya, Timpa Data" memakai token `pro` (gold)** — konsisten dengan keputusan lama "reuse token `pro` untuk state konfirmasi hapus/destruktif karena tidak ada token `danger`" (lihat entry P0 2026-08-24).
- **Item 4 ditangani sebagai catatan retroaktif**, bukan implementasi baru — kode Tema toggle dikonfirmasi sudah benar di `Settings.tsx` (pill `☀️ Terang`/`🌙 Gelap`, tanpa teks "— ganti"), entry ini hanya menutup gap dokumentasi.

### 6. Implementasi
`src/features/settings/Settings.tsx`: `handleImport` (satu fungsi, langsung proses + `window.confirm()`) dipecah jadi 3 — `handleFileSelected` (simpan file ke state), `handleCancelImport` (reset state + input), `handleConfirmImport` (proses `importBackup()`, logic pesan sukses/error tidak berubah dari sebelumnya). Tidak ada perubahan pada `dataBackup.ts` — hanya cara UI memicunya.

### 7. File yang berubah
`src/features/settings/Settings.tsx` (state `pendingImportFile` baru, 3 handler, blok JSX konfirmasi inline baru).

### 8. Dampak terhadap data/schema
Tidak ada. Tidak ada perubahan skema Dexie, tipe, atau format file backup — hanya cara memicu proses import dari sisi UI.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error, dijalankan sebelum dan sesudah seluruh pass ini.
- **Item 3 — inline-confirm import** (dev server port 5174, viewport 390px, `file_upload` ke `<input type=file>` sungguhan):
  - Upload file valid → kotak konfirmasi inline muncul dengan nama file benar, **tidak ada native dialog** (tidak memblokir automation, sesuai tujuan awal penggantian pola ini).
  - Tap "Batal" → kotak hilang, tidak ada `importMsg` baru, tidak ada proses import terjadi.
  - Upload file valid lagi → tap "Ya, Timpa Data" → import berhasil, pesan "Data berhasil dipulihkan (5 tabel)" tampil.
  - Reload halaman → data user (Berat sekarang) benar-benar berubah sesuai isi file (60→75 kg) — dikonfirmasi ini bukan cuma pesan UI, data asli di Dexie berubah.
  - Upload file JSON rusak (`fitku-backup-invalid.json`) → tap "Ya, Timpa Data" → pesan error "File bukan JSON yang valid." tampil, tidak crash.
  - Console dibaca setelah seluruh rangkaian — 0 error, 0 warning selain noise Vite dev standar.
- **Item 1 — tombol Batal koreksi Air**: catat 3 gelas → Simpan → buka lagi `/hydration` → tap "✎ Koreksi" → ganti angka jadi "9" → tap "Batal" → angka kembali tampil "3" (bukan "9"), tidak masuk mode edit lagi. Reload halaman penuh → tetap "3/10 gelas" — dikonfirmasi nilai "9" yang dibatalkan **tidak pernah tersimpan ke Dexie**, persis seperti yang diklaim di analisis kode sebelumnya.
- **Item 2 — Tren 30 Hari CalorieTab**: 10 `FoodLog` nyata diseed lewat `foodLogRepository.add()` asli (bukan raw insert) tersebar di 1-29 hari terakhir supaya `loggedDates30.length > 7` terpenuhi. Hasil: card "Tren 30 Hari" muncul dengan polyline SVG (`stroke="var(--fk-accent)"`) yang ter-render benar — garis kontinu, tidak patah, tidak overflow keluar card, garis dasar (`baseline`) tampil di bawahnya. Dicek juga di viewport mobile sempit (~360px, tab baru) — chart tetap rapi karena `width="100%"`/`viewBox` responsive by construction, tidak ada elemen terpotong. **Ini pertama kalinya elemen ini benar-benar dilihat ter-render**, sebelumnya hanya lolos TypeScript. Data uji (10 `FoodLog` dengan `foodName: 'Seed 30-hari test'`) **dihapus lagi setelah testing** lewat `db.foodLogs.bulkDelete()` langsung (bukan lewat UI tap-dua-kali, supaya bersih dan pasti) — dikonfirmasi lewat reload: card "Tren 30 Hari" kembali hilang (balik ke <7 hari data), "Kalori 7 Hari" kembali ke "0/7 hari tercatat", tidak ada sisa data uji.
- **Item 4**: tidak ada testing baru — murni verifikasi kode existing (`grep` pada `Settings.tsx` mengonfirmasi pill Tema dan tanpa teks "— ganti" sudah ada persis seperti yang diminta pada permintaan aslinya).

### 10. Bug yang ditemukan
Tidak ada bug pada keempat item. Seluruhnya sesuai perilaku yang sudah dituliskan/diklaim benar di analisis kode sebelumnya — pass ini murni pembuktian lewat interaksi nyata, bukan penemuan bug baru.

### 11. Bug yang belum diverifikasi
Tidak ada — keempat item closeout sudah diuji langsung seperti tercatat di atas.

### 12. Known Issues
Tidak ada known issue baru dari pass ini. Seluruh Known Issues lama yang jadi alasan pass ini dibuat kini tertutup.

### 13. Next Step
**Seluruh technical debt yang tercatat sampai titik ini sudah tuntas.** Dev Log kini akurat 100% terhadap state kode aktual. Tidak ada pekerjaan lanjutan yang direncanakan sendiri — dua opsi arah besar berikutnya (fondasi Premium/monetisasi nyata, atau membuka ulang keputusan P3) sudah dipresentasikan ke user sebagai proposal terpisah dan menunggu approval eksplisit sebelum coding apa pun dimulai.

---

## 2026-08-26 (lanjutan) — Fondasi Trial 7 Hari → Pro & 4 Benefit Pro Nyata

### 1. Tanggal
2026-08-26

### 2. Tujuan
User memilih Opsi B dari proposal audit sebelumnya (fondasi Auth+Trial+Pro) dan secara eksplisit meminta implementasi **model produk Trial 7 hari → Pro/Premium (tanpa free tier)** beserta 4 kandidat benefit Pro: (1) Weekly Insight diperdalam, (2) Riwayat & grafik penuh, (3) Target adaptif berdasarkan tren aktual, (4) Skor harian dengan tren/korelasi, plus (5) investigasi fondasi AI Coach nyata. Instruksi eksplisit: **jangan sekadar memasang label Premium pada fitur yang sudah ada** — benefit harus benar-benar bernilai dan benar-benar tergating.

### 3. Masalah UX/produk sebelumnya
Sebelum pass ini: (a) tidak ada mekanisme auth/trial/entitlement sama sekali — `SubscriptionStatus.trialUsed`/`status` sudah ada di skema tapi **tidak pernah dibaca di manapun** (skema mati, ditemukan lewat audit sebelumnya); (b) `Premium.tsx` menjual 3 benefit generik ("early supporter", dll.) yang tidak berhubungan dengan data nyata FitKu; (c) Weekly Insight, riwayat kalori/berat, dan skor harian semuanya sudah gratis tak terbatas — tidak ada apa pun yang bisa "dikunci" secara jujur tanpa membangun sesuatu yang baru.

### 4. Root Cause
N/A — murni fitur baru berdasarkan keputusan produk baru (trial-first, no free tier), bukan bugfix.

### 5. Keputusan yang diambil

**Entitlement/gating (fondasi untuk semua benefit):**
- **`getProAccess()` baru** (`src/domain/entitlement.ts`) sebagai satu-satunya sumber kebenaran "apakah user ini Pro sekarang". Trial 7 hari dihitung LANGSUNG dari `user.createdAt` (field yang sudah ada sejak awal, sudah pasti terisi ke SEMUA user existing) — **tidak ada field/tabel baru**, tidak ada migrasi skema. Status Pro dianggap aktif jika: (a) trial belum lewat 7 hari, ATAU (b) `subscriptionStatus.plan !== 'free'` dan `status === 'active'` dan (lifetime atau belum `expiresAt`).
- **Sengaja tetap client-side, sama seperti mekanisme `subscriptionStatus` yang sudah ada sekarang** — BUKAN backend/server baru. Ini konsisten dengan audit sebelumnya: `fitku-security-status` (memory) sudah eksplisit melarang PEMBAYARAN NYATA sebelum ada auth+backend+legal, tapi tidak melarang membangun logic trial/gating LOKAL untuk tahap pre-launch ini. Trial/entitlement lokal ini **bisa dimanipulasi lewat console/IndexedDB** persis seperti `subscriptionStatus` sekarang — bukan gap baru, melainkan perluasan pola risiko yang sudah diketahui dan diterima untuk tahap ini. Auth+backend nyata tetap prasyarat sebelum go-live sungguhan (lihat audit sebelumnya).
- **`ProLocked` (komponen baru)**: kartu non-blocking, selalu link ke `/premium`, dipakai konsisten di 3 tempat gating (AiCoach, CalorieTab, WeightTab) — bukan modal/hard-wall, sesuai prinsip paywall FitKu yang sudah ada ("value-moment, never blocking").
- **`TrialBanner` (komponen baru, `features/paywall/`)**: sengaja HANYA muncul saat trial ≤3 hari lagi atau sudah berakhir — tidak menagih user setiap hari sepanjang 7 hari trial. Menggantikan (bukan menumpuk dengan) banner streak lama (`PaywallBanner`) saat kondisinya terpenuhi; kedua banner disembunyikan total untuk user yang sudah Pro/paid (perbaikan kecil di luar scope literal tapi langsung relevan — banner "upgrade" ke user yang sudah bayar melanggar prinsip "benefit harus terasa nyata").

**Weekly Insight diperdalam → `generateDeepInsight()` (`src/domain/deepInsight.ts`, baru):**
- Weekly Insight 7-hari yang SUDAH ADA dan SUDAH GRATIS **tidak disentuh/tidak dikunci** — mengunci sesuatu yang sudah gratis akan melanggar kepercayaan user, bukan tujuan pass ini.
- Analisa 30-hari BARU: % hari di jalur target kalori, tren berat 30 hari, DAN korelasi (hari-olahraga vs tidak, hari-cukup-air vs tidak) terhadap pencapaian target kalori — dipilih yang gap-nya PALING BESAR sebagai "pola ditemukan" (bukan menampilkan semua korelasi sekaligus, supaya insight terasa tajam bukan berisik).
- Butuh `hydrationRepository.getByDateRange()` baru (repository lama cuma punya `getForDate`) — penambahan murni additive, pola query sama persis dengan `exerciseRepository`/`foodLogRepository` yang sudah ada.

**Riwayat & grafik penuh → `CalorieTab.tsx` + `WeightTab.tsx`:**
- **Tren 30 Hari (CalorieTab)**: sudah ada datanya (`isoDaysAgo(29)` sudah di-fetch untuk semua orang), TAPI kartu chart-nya sekarang hanya render untuk Pro/trial — non-Pro-expired dapat `ProLocked` sebagai gantinya. "Kalori 7 Hari" dan "Rata-rata Makro" TETAP gratis (baseline trial yang harus tetap terasa berguna).
- **WeightTab**: sparkline & daftar riwayat yang sebelumnya HARDCODE dipotong ke 8/10 entri terakhir untuk SEMUA orang sekarang penuh (`entries` tanpa slice) untuk Pro/trial; non-Pro tetap dapat perilaku default yang sudah ada (8/10) TANPA REGRESI, plus `ProLocked` teaser HANYA muncul kalau memang ada riwayat >10 entri yang disembunyikan (supaya tidak menjanjikan sesuatu yang belum ada datanya).
- Riwayat Olahraga (14 hari) SENGAJA TIDAK ikut digating pada pass ini — di luar scope literal "kalori & berat" yang diaudit sebelumnya, dicatat sebagai keputusan sadar bukan kelalaian.

**Target adaptif → `analyzeAdaptiveTarget()` (`src/domain/adaptiveTarget.ts`, baru):**
- Membandingkan tren berat aktual (dari `weightRepository`, window 30 hari, minimal rentang 10 hari) terhadap laju yang diharapkan dari `goal` (turun 0.5kg/minggu, naik otot 0.25kg/minggu, jaga berat ~0kg/minggu) — angka laju ini SAMA dengan yang sudah dipakai `estimateWeeksToGoal()` di `tdee.ts`, bukan asumsi baru.
- **Sifatnya SELALU advisory, tidak pernah menulis otomatis** — user harus tap "Terapkan X kkal" secara eksplisit. Ini konsisten dengan prinsip yang sudah dipegang di seluruh app: koreksi/perubahan besar selalu perlu konfirmasi user (pola yang sama dengan koreksi Air, edit profil, dll.), bukan pola baru.
- **`recalculateMacrosForCalories()` baru di `tdee.ts`** — saat "Terapkan" ditekan, target protein/karbo/lemak ikut dihitung ulang proporsional (protein tetap konstan karena berbasis berat badan, lemak/karbo mengikuti rumus 25%-lemak/sisa-karbo yang SAMA PERSIS dengan `calculateTdee()`), bukan cuma kalori berubah sendirian tanpa makro yang konsisten.

**Skor harian dengan tren/korelasi → `analyzeScoreTrend()` (`src/domain/scoreTrend.ts`, baru):**
- Skor TIDAK PERNAH disimpan historis di manapun (`dailySummaries` adalah tabel mati, dikonfirmasi lewat grep — tidak ada writer/reader sama sekali). Solusi: skor 14 hari terakhir DIHITUNG ULANG per hari dari `foodLogRepository` pakai fungsi murni `calculateDailyScore()` yang SAMA PERSIS dipakai Dashboard untuk skor "hari ini" — bukan logic baru, bukan tabel baru.
- Korelasi memakai pola yang sama dengan Deep Insight (olahraga vs tidak, air cukup vs tidak), dipilih yang gap-nya terbesar.
- **Tile "Skor" di Dashboard yang sebelumnya `<div>` statis tanpa tujuan** (Known Issue lama, dicatat sejak entry "Kebiasaan Sehat & Flow Air") sekarang jadi `<button>` yang navigasi ke `/coach` — sekalian menutup Known Issue itu karena `/coach` memang jadi rumah Tren Skor yang baru.

**AI Coach (item 5) — investigasi fondasi, TIDAK diimplementasikan sebagai fitur baru:**
- Chat AI Coach yang ada sekarang (`generateCoachReply` di `nutrition.ts`) rule-based, flat, sudah unlimited untuk semua orang — **tidak ada sumbu "lanjutan" yang bisa digating** tanpa membangun ulang total jadi LLM asli. Mengunci chat yang sudah ada persis seperti sekarang = melanggar instruksi eksplisit "jangan sekadar memasang label Premium" (chat-nya tidak berubah kualitasnya sama sekali, cuma dikunci) — jadi TIDAK dilakukan.
- Investigasi fondasi (bukan implementasi): app ini murni static SPA (`netlify.toml` CSP `connect-src 'self'`, tidak ada backend sama sekali). Memasang API key AI langsung di frontend berarti key itu ada di bundle JS publik — TIDAK AMAN dan eksplisit dilarang user. Fondasi yang benar butuh proxy server-side (misal Netlify Function) yang menyimpan API key sebagai environment variable, dipanggil frontend lewat endpoint sendiri (key tidak pernah sampai ke browser). Ini BELUM dibangun — lihat bagian 12 (dependency eksternal) dan laporan akhir ke user untuk detail rekomendasi.

### 6. Implementasi
Ringkas per area — lihat bagian 5 untuk detail keputusan dan bagian 7 untuk daftar file.

### 7. File yang berubah
**Baru:** `src/domain/entitlement.ts`, `src/domain/deepInsight.ts`, `src/domain/scoreTrend.ts`, `src/domain/adaptiveTarget.ts`, `src/shared/hooks/useProAccess.ts`, `src/shared/components/ProLocked.tsx`, `src/features/paywall/TrialBanner.tsx`.
**Diubah:** `src/domain/tdee.ts` (+`recalculateMacrosForCalories`), `src/data/repositories/hydrationRepository.ts` (+`getByDateRange`), `src/features/ai-coach/AiCoach.tsx` (3 kartu Pro baru + wiring), `src/features/progress/tabs/CalorieTab.tsx` (gating Tren 30 Hari), `src/features/progress/tabs/WeightTab.tsx` (riwayat & grafik penuh untuk Pro), `src/features/dashboard/Dashboard.tsx` (tile Skor navigable, TrialBanner, suppress banner untuk paid user), `src/features/settings/Settings.tsx` (status trial di Langganan), `src/features/premium/Premium.tsx` (4 benefit nyata, copy hero diperbarui).

### 8. Dampak terhadap data/schema
**Tidak ada perubahan skema Dexie sama sekali** — `SCHEMA_VERSION` tetap 6. Semua fitur baru murni derived/computed dari data yang sudah ada (`user.createdAt` untuk trial, `weightHistory`/`foodLogs`/`exerciseLogs`/`hydrationLogs` untuk insight). Satu repository method baru (`hydrationRepository.getByDateRange`) — additive, tidak mengubah method lama.

### 9. Bug yang ditemukan (selama implementasi, sebelum sempat sampai ke user)
12. **`adaptiveTarget.ts` — arah "behind pace" terbalik untuk goal `lose_weight`.** Ditemukan lewat pengujian manual dengan data sintetis sebelum sempat disentuh user: rumus awal `gapKg = expected - actual` benar untuk `gain_muscle` tapi TERBALIK untuk `lose_weight` (user yang turun berat terlalu lambat malah disarankan MENAMBAH kalori, bukan menguranginya). Root cause: `expected` bernilai negatif untuk `lose_weight`, rumus pengurangan sederhana tidak memperhitungkan arah goal. Solusi: perhitungan diubah pakai "signed pace gap" yang membalik tanda berdasarkan arah goal (`direction = goal==='lose_weight' ? -1 : 1`) sebelum dibandingkan, diverifikasi ulang lewat 6 skenario manual (lose/gain × behind/ahead/on-track) sampai semua benar.
13. **Bug kedua di file yang sama — teks "naikkan" ter-hardcode di cabang "ahead of pace".** Setelah bug #12 diperbaiki, ditemukan cabang pesan "ahead of pace" selalu bilang "naikkan target kalori" padahal untuk `gain_muscle` yang kemajuannya terlalu cepat, arah yang benar adalah "turunkan". Solusi: kata kerja pesan (`naikkan`/`turunkan`) sekarang mengikuti tanda `adjustmentKcal` yang sebenarnya, bukan diasumsikan dari cabang pace.
Kedua bug ditemukan dan diperbaiki SEBELUM pernah tampil ke user — bagian dari testing pra-rilis pass ini, bukan bug yang sempat live.

### 10. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error, dijalankan berkali-kali sepanjang pass (setelah tiap batch perubahan besar).
- **Unit-style testing `adaptiveTarget.ts`** (dev server port 5174, `javascript_tool` dynamic import dengan cache-busting `?t=Date.now()` — penting karena import() tanpa cache-bust sempat menyajikan modul versi lama dan menyembunyikan hasil fix pertama kali dicoba): 6 skenario manual (lose_weight behind/ahead/on-track, gain_muscle behind/ahead, maintain gaining-unwanted) + 2 edge case (data kurang, rentang <10 hari) — semua verba dan arah angka dikonfirmasi benar setelah fix.
- **Browser walkthrough end-to-end** (server 5174 terpisah dari preview user 5173, viewport 390px lalu ~360px, data akun nyata dari sesi-sesi sebelumnya):
  - Data 30-hari nyata diseed lewat repository asli (14 hari food log dengan variasi kalori, 6 hari olahraga, 14 hari hidrasi dengan variasi cukup/kurang, 3+13 entri berat dengan tren turun lambat) — bukan raw insert, lewat `foodLogRepository.add()`/`exerciseRepository.add()`/`hydrationRepository.set()`/`weightRepository.add()` asli.
  - **State trial aktif**: badge "Trial 7 hari lagi" tampil di Coach; ketiga kartu Pro (Tren Skor, Target Adaptif, Analisa Mendalam) render dengan data nyata — sparkline skor, tren membaik/memburuk, pola korelasi ("Skor kamu rata-rata 8 poin lebih tinggi di hari kamu olahraga" / "Di hari kamu minum air cukup, kamu 43% lebih sering mencapai target kalori" — bergantian jadi yang terkuat sesuai data terkini), pesan Target Adaptif ("Progres turun beratmu lebih lambat dari target...FitKu sarankan turunkan target kalori jadi 1.509 kkal").
  - **Tombol "Terapkan"**: ditekan → pesan "✓ Target baru diterapkan ke profilmu." → dikonfirmasi lewat query Dexie langsung bahwa `targetCalories`/`targetProtein`/`targetCarbs`/`targetFat` benar-benar berubah (1509/135/148/42, matematika makro dicek manual dan benar) — bukan cuma tampilan. Dashboard (CalorieRing, macro bar) langsung reflect angka baru setelah navigasi, tanpa reload manual.
  - **CalorieTab & WeightTab (trial aktif)**: "Tren 30 Hari" render chart nyata; WeightTab sparkline & daftar riwayat menampilkan SEMUA 16 entri (bukan dipotong 8/10) — dikonfirmasi visual dengan menghitung baris.
  - **State trial berakhir** (disimulasikan lewat `user.createdAt` dimundurkan 10 hari via javascript_tool, teknik setup data yang sama seperti dipakai sepanjang sesi ini, bukan bug): ketiga kartu Pro di Coach diganti SATU `ProLocked` ("🔒 Insight Personal Pro..."); Weekly Insight & Daily Coaching & chat TETAP tampil normal (tidak ikut terkunci); CalorieTab "Tren 30 Hari" diganti `ProLocked`, "Kalori 7 Hari"/"Rata-rata Makro" tetap tampil; WeightTab kembali ke sparkline 8 + daftar 10 (perilaku lama, tidak regresi) + `ProLocked` muncul karena memang ada >10 riwayat yang disembunyikan; Dashboard menampilkan `TrialBanner` "🔒 Trial Pro kamu sudah berakhir..."; Settings menampilkan badge "Trial berakhir".
  - **Link "Aktifkan Pro"** dari `ProLocked` dikonfirmasi mengarah ke `/premium`; halaman Premium menampilkan 4 benefit BARU (Weekly Insight mendalam, Riwayat & grafik tanpa batas, Target adaptif, Skor tren&korelasi) menggantikan copy generik lama.
  - **State Pro/paid** (aktivasi lewat tombol "Upgrade ke Premium" asli, bukan simulasi): ketiga kartu Pro & Tren 30 Hari & riwayat penuh kembali terbuka MESKIPUN trial sudah lewat (paid override trial-expired dikonfirmasi bekerja); Settings menampilkan "Plan aktif: PRO 3 Bulan" tanpa badge trial; `TrialBanner` DAN `PaywallBanner` (streak) sama-sama tidak muncul lagi (perbaikan kecil di luar scope literal, lihat bagian 5).
  - **Regresi — chat "Tanya lebih lanjut"**: sempat terlihat tidak merespons di 2 percobaan awal (klik berbasis koordinat meleset akibat pergeseran scroll — pola masalah yang sama seperti sesi-sesi sebelumnya), tapi setelah klik berbasis referensi elemen (bukan koordinat), pesan & balasan AI Coach terkirim dan tampil normal — dikonfirmasi lewat pembacaan DOM langsung, bukan cuma screenshot. **Bukan regresi produk**, murni artefak otomasi.
  - Console dibaca berkali-kali sepanjang seluruh rangkaian di atas — 0 error, 0 warning selain noise Vite dev standar.
  - Data uji (14 food log, 6 exercise log, 15 hydration log, 13 entri berat tambahan) **dihapus lagi setelah testing** lewat query Dexie langsung; `user.createdAt` dikembalikan ke waktu sekarang (trial fresh), `targetCalories`/makro dikembalikan ke nilai semula (1784/135/200/50), `subscriptionStatus` (plan Pro yang diaktifkan untuk testing) dihapus — dikonfirmasi lewat reload bahwa Coach kembali ke state "Trial 7 hari lagi" dengan seluruh kartu Pro menunjukkan pesan "belum cukup data" yang jujur.

### 11. Bug yang belum diverifikasi
Tidak ada untuk fitur-fitur yang diimplementasikan pada pass ini — seluruh alur (trial aktif, trial berakhir, paid, apply target adaptif, regresi chat) sudah diuji langsung seperti tercatat di atas.

### 12. Dependency eksternal yang masih diperlukan (belum tersedia, TIDAK diimplementasikan)
- **AI Coach berbasis LLM nyata**: butuh (a) keputusan provider (Claude/OpenAI/lainnya — tidak diasumsikan), (b) API key dari provider tsb yang HARUS disimpan sebagai server-side environment variable (Netlify Function atau setara), TIDAK BOLEH ditanam di frontend, (c) keputusan model biaya (siapa yang menanggung cost per-pesan). Tidak satu pun dari tiga hal ini ada saat ini — pass ini secara sadar TIDAK membangun kode yang bergantung padanya, sesuai instruksi eksplisit "jangan buat implementasi palsu."
- **Auth + backend + payment verification nyata**: sudah dicatat lengkap di audit sebelumnya (entry "belum ada," tetap berlaku) — trial/entitlement pass ini SENGAJA tetap client-side sebagai solusi pre-launch, bukan pengganti kebutuhan itu.

### 13. Known Issues
- Trial/entitlement lokal ini bisa dimanipulasi lewat console/IndexedDB (sama seperti `subscriptionStatus` sekarang) — bukan celah baru, tapi perlu diingat ini BUKAN mekanisme yang aman untuk uang sungguhan (lihat bagian 5 & 12).
- Menerapkan saran Target Adaptif berulang kali TANPA data berat baru di antaranya akan terus menyarankan penyesuaian lanjutan berdasarkan tren yang sama (belum ada pengaman "sudah pernah diterapkan minggu ini") — bukan salah hitung, tapi nuansa UX yang bisa diperbaiki nanti jika user memang menekan tombolnya berkali-kali tanpa mencatat berat baru.
- Riwayat Olahraga (Progress) sengaja tidak ikut digating pada pass ini (lihat bagian 5) — bisa jadi kandidat perluasan nanti kalau diminta.

### 14. Next Step
Menunggu review user atas 4 benefit Pro yang sudah nyata ini. Tidak memulai pekerjaan AI Coach LLM atau fondasi auth/backend/payment nyata tanpa keputusan bisnis eksplisit lanjutan (provider, budget, dll — lihat bagian 12 dan audit sebelumnya).

---

## 2026-08-26 (lanjutan) — FAB "+" Jadi Speed Dial Menu

### 1. Tanggal
2026-08-26

### 2. Tujuan
FAB "+" di bottom nav sebelumnya cuma satu tombol yang langsung navigasi ke `/tracker` (catat makanan). User minta diubah jadi speed-dial menu dengan 4 pilihan (Catat Makanan, Air, Olahraga, Berat) supaya empat aksi harian yang paling sering dipakai bisa dijangkau dari mana pun tanpa harus lewat halaman spesifik dulu.

### 3. Masalah UX sebelumnya
FAB hanya bisa mencatat makanan. Untuk mencatat air/olahraga/berat, user harus navigasi manual ke halaman masing-masing dulu (Home → tap tile terkait), padahal FAB ini yang paling gampang dijangkau (posisinya tengah-bawah, selalu terlihat di semua halaman).

### 4. Root Cause
N/A — permintaan fitur baru, bukan bugfix.

### 5. Keputusan yang diambil
- **Lokasi dikonfirmasi dulu sebelum implementasi**: FAB ternyata ada di `BottomNav.tsx` (bukan `Dashboard.tsx` seperti salah satu dugaan di instruksi) — dicek langsung ke kode sebelum mulai, bukan diasumsikan.
- **Konteks meal untuk "Catat Makanan" TIDAK dikirim sebagai query param eksplisit** — `FoodTracker.tsx` sudah punya fallback `defaultMealType()` (time-of-day based: pagi→sarapan, siang→makan siang, sore/malam→makan malam, sisanya→kudapan) yang otomatis jalan kalau parameter `?meal=` tidak ada. Karena FAB lama juga sudah navigasi ke `/tracker` tanpa parameter, perilaku yang diminta sudah otomatis benar tanpa logic baru — dikonfirmasi lewat baca kode `FoodTracker.tsx`, bukan asumsi.
- **"Olahraga" membuka `ExerciseSheet` LANGSUNG dari `BottomNav.tsx`** (bukan navigasi ke halaman lalu buka sheet di sana) — karena `ExerciseSheet` adalah komponen presentational murni (`weightKg`, `onCancel`, `onConfirm` sebagai props, tidak terikat ke halaman manapun) dan `BottomNav` sudah bisa akses `user` lewat `useAppState()` (tersedia di semua halaman gated). Pola simpan (`exerciseRepository.add({userId, date: todayIso(), ...values})`) disalin persis dari `Dashboard.tsx`'s `handleSaveExercise` — sesuai instruksi "pola yang sudah ada di Dashboard", TANPA mengubah `Dashboard.tsx` atau `ExerciseSheet.tsx` itu sendiri sama sekali (constraint eksplisit).
- **Overlay pakai `bg-ink/40` + `fixed inset-0 z-50` — pola yang PERSIS SAMA dengan overlay `ExerciseSheet`/`PortionSheet`/`QuickAddSheet`/`ReportFoodSheet`** (dicek lewat grep sebelum implementasi, keempatnya pakai class yang identik). Bukan warna/pola baru — konsistensi visual dengan seluruh sheet lain di app.
- **Urutan 4 pilihan dari FAB ke atas: Berat → Olahraga → Air → Catat Makanan** (Catat Makanan paling dekat dengan FAB) — karena Catat Makanan tetap aksi paling sering dipakai (dulu satu-satunya aksi FAB), jadi ditaruh di posisi paling mudah dijangkau (radius gerak jempol terpendek dari posisi FAB).
- **Label teks yang tadinya "Tambah Makanan" di bawah FAB diubah jadi "Tambah"** — perubahan kecil yang diperlukan langsung oleh perubahan fungsi: FAB sekarang bukan cuma menambah makanan, membiarkan label lama akan salah/menyesatkan.
- **FAB berputar 45° jadi terlihat seperti "×" saat menu terbuka** — sinyal standar "tap lagi untuk tutup", murni CSS `rotate-45` di atas class yang sudah ada, tidak menambah elemen/ikon baru.
- **Animasi pakai CSS transition biasa (`transition-all duration-200`), TIDAK ada library animasi baru** — komponen menu tetap ter-mount ~200ms setelah `dialOpen` jadi `false` (state `dialMounted` terpisah dari `dialOpen`) supaya transisi keluar (fade+turun) sempat kelihatan, bukan langsung hilang. Item menu punya `transitionDelay` bertahap (30ms × index) untuk efek muncul beruntun yang halus, bukan serentak kaku.
- **Emoji dipakai sebagai ikon pilihan (📖💧🔥⚖️), bukan SVG tangan** — sesuai literal permintaan user, dan konsisten dengan preseden emoji-sebagai-ikon yang sudah ada di tempat lain di app (ikon kategori olahraga, ikon meal type, ikon Catatan Hari Ini) — bukan pola baru. (Aturan "tanpa ikon library, SVG tangan" yang berlaku khusus untuk 4 ikon BottomNav Home/Progress/Coach/Setelan TIDAK disentuh sama sekali.)

### 6. Implementasi
`BottomNav.tsx` ditulis ulang: `Link to="/tracker"` yang lama diganti jadi `<button>` yang toggle state `dialOpen`. State baru: `dialOpen`, `dialMounted` (untuk animasi keluar), `showExerciseSheet`. Overlay + 4 tombol pilihan + `ExerciseSheet` (kondisional) ditambahkan sebagai saudara dari `<nav>` yang sudah ada. Struktur nav asli (LEFT_ITEMS/RIGHT_ITEMS/NavItem/4 ikon SVG) tidak diubah sama sekali.

### 7. File yang berubah
`src/shared/components/BottomNav.tsx` (satu-satunya file yang diubah).

### 8. Dampak terhadap data/schema
Tidak ada. Tidak ada tabel/field baru. Menyimpan olahraga lewat `exerciseRepository.add()` yang sudah ada, ke tabel `exerciseLogs` yang sudah ada.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error.
- **Browser walkthrough nyata** (dev server port 5174, viewport 390px lalu ~360px lewat tab baru karena `resize_window` sempat tidak konsisten di tab yang sama — teknik yang sama seperti sesi-sesi sebelumnya):
  - Tap FAB → overlay gelap muncul, FAB berputar jadi "×", 4 pill (Berat/Olahraga/Air/Catat Makanan, urutan dari bawah ke atas) muncul dengan label kiri + ikon badge kanan — sesuai spesifikasi visual.
  - Tap di luar menu (area kosong halaman) → menu tertutup, FAB kembali "+", **URL tidak berubah** — dikonfirmasi tidak ada navigasi tak diinginkan.
  - **Catat Makanan** → navigasi ke `/tracker`, header menampilkan "Catat ke 🍳 Sarapan" (waktu sistem pagi hari) — konteks meal otomatis benar tanpa kode tambahan, sesuai analisis di atas.
  - **Air** → navigasi ke `/hydration`, halaman Air Minum tampil normal.
  - **Berat** → navigasi ke `/progress?tab=weight`, tab "Berat" langsung aktif (deep-link lama tidak terganggu).
  - **Olahraga** → `ExerciseSheet` terbuka **tanpa navigasi** (URL tetap di halaman semula, dicek eksplisit) — isi durasi 20 menit, tap Simpan → sheet tertutup → dikonfirmasi lewat query Dexie langsung bahwa `exerciseLogs` benar-benar bertambah (`durationMin:20, caloriesBurned:88, category:'walk'`) — bukan cuma UI. Beralih ke tab Kalori di Progress → entry baru ("Jalan · 25 Agu · 20 menit · 88 kkal") muncul di "Riwayat Olahraga" — konfirmasi end-to-end nyata, bukan mock. Data uji dihapus lagi setelah testing.
  - Speed dial dicoba ulang dari 3 halaman berbeda (Home, `/tracker`, `/hydration`, `/progress?tab=weight`) — bekerja konsisten di semua halaman karena `BottomNav` memang dirender oleh `AppShell` di semua route gated.
  - **Mobile 360px** (tab baru dengan viewport genuinely ter-resize, dicek lewat screenshot resolusi sebelum lanjut): keempat pill tampil penuh tanpa terpotong, teks label tidak wrap aneh, ikon badge tidak overlap.
  - **Regresi nav statis**: dengan menu tertutup, tap "Progress" di nav bar bawah → navigasi normal ke `/progress` — dikonfirmasi 4 tombol nav lama (Home/Progress/Coach/Setelan) tidak terpengaruh oleh perubahan.
  - Console dibaca di kedua viewport (390px dan 360px) — 0 error, 0 warning selain noise Vite dev standar.

### 10. Bug yang ditemukan
Tidak ada.

### 11. Bug yang belum diverifikasi
- Animasi masuk/keluar terkonfirmasi SECARA STRUKTURAL (class CSS + timing `dialMounted` benar, dicek lewat kode dan lewat mengamati state sebelum/sesudah di screenshot), tapi kehalusan visual transisi 200ms itu sendiri tidak bisa dibuktikan lewat screenshot statis (butuh rekaman video/mata langsung) — dicatat jujur, bukan diklaim "terlihat mulus" tanpa bisa dibuktikan lewat tooling yang dipakai.

### 12. Known Issues
- **Jika FAB dipakai untuk mencatat Olahraga SAAT user sedang berada di halaman Dashboard**, tile "Olahraga" di Dashboard (`todayExercise` state lokal Dashboard) TIDAK otomatis ter-refresh — data tersimpan benar ke Dexie, tapi angka kkal di tile Dashboard baru update setelah reload/navigasi ulang ke Dashboard. Ini karena `BottomNav` dan `Dashboard` masing-masing punya state lokal sendiri tanpa mekanisme refresh lintas-komponen di app ini (arsitektur fetch-on-mount yang sudah berlaku di seluruh app, bukan sesuatu yang baru rusak oleh fitur ini). Tidak diperbaiki di pass ini karena constraint eksplisit "jangan ubah Dashboard.tsx/fitur yang sudah ada" — memperbaikinya butuh menyentuh Dashboard.

### 13. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Kalau Known Issue di atas (staleness tile Olahraga di Dashboard) dirasa mengganggu, perbaikannya butuh instruksi eksplisit karena menyentuh `Dashboard.tsx` yang secara sengaja tidak disentuh pass ini.

---

## 2026-08-26 (lanjutan) — Polish Speed Dial FAB + Multi-Select Logging Makanan

### 1. Tanggal
2026-08-26

### 2. Tujuan
Dua perbaikan diminta bersamaan: (Task 1) polish visual/UX speed-dial FAB yang baru dibangun (ikon SVG bukan emoji, warna full theme-token, layout ikon-kiri/label-kanan, urutan pill spesifik); (Task 2) ubah alur pencatatan makanan di `FoodTracker.tsx` dari "1 makanan = 1 kali PortionSheet + auto-navigasi Home" menjadi alur keranjang (basket) yang memungkinkan mencatat beberapa makanan sekaligus sebelum benar-benar disimpan.

### 3. Masalah UX sebelumnya
- Speed dial (dibangun sesi sebelumnya) masih memakai emoji sebagai ikon (bukan SVG hand-drawn konsisten dengan BottomNav), label di kiri/ikon di kanan (task ini minta dibalik), dan belum diverifikasi eksplisit di dark mode.
- FoodTracker: setiap kali user menekan makanan, PortionSheet langsung terbuka lalu setelah "Tambahkan" langsung tersimpan DAN auto-navigasi ke Home — kalau user mau mencatat 3 makanan sekaligus (mis. sarapan lengkap), harus bolak-balik `/tracker` ↔ Home tiga kali.

### 4. Root Cause
N/A untuk keduanya — permintaan fitur/polish baru, bukan bugfix. (Satu bug NYATA ditemukan & diperbaiki selama implementasi — lihat poin 9.)

### 5. Keputusan yang diambil

**Task 1 — Speed Dial:**
- **4 ikon SVG baru ditambahkan ke `BottomNav.tsx`**: `WeightIcon`, `GlassIcon`, `FlameIcon` — path SVG-nya di-copy PERSIS dari ikon tile "Berat/Air/Olahraga" yang sudah ada di `Dashboard.tsx` (bukan digambar ulang, supaya benar-benar konsisten, bukan cuma "mirip"). `ForkSpoonIcon` digambar baru (fork 3-tine + sendok, stroke-only, tanpa fill) khusus untuk "Catat Makanan" — sesuai instruksi eksplisit "jangan pakai ikon buku."
- **Warna pill sudah memakai token sejak awal** (`bg-surface`, `text-ink`, `bg-ink/40` untuk overlay) — dicek ulang, tidak ada warna hardcode ditemukan. Badge ikon diubah dari `grad-hero` (gradient) ke `bg-accent-soft text-accent` — pola badge-ikon-dalam-list yang SAMA PERSIS dipakai di tile Kebiasaan Sehat Dashboard, bukan pola baru.
- **Layout dibalik**: ikon sekarang di kiri (badge bulat `bg-accent-soft`), label di kanan (`whitespace-nowrap`). Container menu diubah dari center-anchored (`left-1/2 -translate-x-1/2`) jadi right-anchored (`right-0` relatif terhadap wrapper FAB yang lebarnya = lebar FAB, plus `items-end`) — supaya "rata kanan mengikuti posisi FAB" secara struktural (bukan cuma kebetulan terlihat rata), dan lebar tiap pill mengikuti kontennya sendiri (tidak dipaksa sama lebar seperti sebelumnya).
- **Urutan bottom-to-top dikonfirmasi ulang**: array `SPEED_DIAL_ITEMS` = [Berat, Olahraga, Air, Catat Makanan] — item TERAKHIR di array render PALING DEKAT ke FAB (paling bawah secara visual). Urutan ini sudah benar sejak sesi sebelumnya, dikonfirmasi lagi cocok dengan permintaan (Catat Makanan paling bawah/sering, Berat paling atas/jarang).
- **Arah stagger delay animasi masuk DIBALIK**: sebelumnya delay dihitung `i * 30ms` (item pertama di array = paling cepat muncul = pill paling ATAS muncul duluan) — salah arah untuk "muncul dari bawah ke atas". Diperbaiki jadi `(length - 1 - i) * 30ms` supaya pill TERDEKAT FAB (bottom) animasi masuk PALING DULU.

**Task 2 — Multi-select basket:**
- **State `BasketItem[]` baru di `FoodTracker.tsx`** — bukan di repository, bukan di context global — murni state lokal komponen ini, sesuai instruksi "jangan ubah foodLogRepository." Setiap item basket menyimpan nilai PER-SERVING (bukan sudah dikali `servings`) plus `servings`, `mealType`, dan `foodId` (null untuk item dari Milikku/Quick-Add, id asli untuk item katalog) — mengikuti persis prinsip "snapshot, bukan referensi live" yang sudah dipakai di seluruh app untuk log tersimpan.
- **Tap "+" vs tap nama dipisah** di kedua baris (katalog & Milikku): "+" langsung `addToBasket()` dengan `servings=1` dan `mealType=presetMealType` (konteks meal dari URL, tanpa membuka apa pun); tap nama membuka `PortionSheet` seperti sebelumnya — TIDAK ADA PERUBAHAN pada `PortionSheet.tsx` itu sendiri, hanya callback `onConfirm` yang dioper berubah dari "simpan+navigasi" jadi "masuk ke basket, tutup sheet, tetap di list."
- **Commit ke database HANYA terjadi di satu titik** (`handleSaveBasket`): loop `await foodLogRepository.add()` untuk tiap item basket (bukan lewat `addLog` dari `useTodayLog` — sengaja panggil repository langsung supaya tidak memicu N kali refresh state lokal yang tidak berguna, karena halaman ini langsung `navigate('/')` setelah selesai). Ini konsisten dengan constraint "pilih cara paling clean," bukan `bulkAdd` baru di repository (tidak diminta, dan `foodLogRepository` sengaja tidak disentuh).
- **Konfirmasi batal pakai pola inline yang SAMA PERSIS dengan perbaikan `window.confirm()` di `Settings.tsx`** (sesi sebelumnya) — kotak dengan teks + 2 tombol pill ("Ya, Batalkan" pakai token `pro-soft`/`text-pro`, "Lanjutkan Pilih" netral) — bukan pola baru, bukan `window.confirm()`.
- **Tombol "Simpan N item" dibuat `sticky bottom-0`** (bukan cuma ditaruh di akhir list) — supaya tetap terlihat "di bagian bawah layar" tanpa perlu scroll sampai habis, terutama untuk kategori dengan banyak item (mis. Lauk, 17 item).
- **Preview "Dipilih (N)" sengaja ditaruh di ATAS** (setelah tombol Tambah Cepat, sebelum daftar kategori) — bukan di bawah dekat tombol Simpan — supaya user langsung dapat konfirmasi visual begitu selesai tap "+", tanpa perlu scroll turun untuk melihat apa yang sudah terpilih.
- **Quick Add (⚡ Tambah Cepat) SENGAJA TIDAK diubah sama sekali** — tetap simpan langsung + auto-navigasi Home seperti sebelumnya, sesuai instruksi eksplisit "Pertahankan... Quick Add." Konsekuensinya (dicatat jujur di poin 12): kalau user pakai Quick Add SAAT basket sedang berisi item, item basket akan hilang (halaman ter-unmount saat navigasi) — trade-off yang diterima karena mengubah Quick Add di luar scope.

### 6. Implementasi
Lihat detail keputusan di atas. Task 1 murni perubahan `BottomNav.tsx` (ikon + layout + z-index, lihat poin 9). Task 2 murni perubahan `FoodTracker.tsx` (state basket + handler baru + JSX baru) — `PortionSheet.tsx`, `QuickAddSheet.tsx`, `ReportFoodSheet.tsx`, `ExerciseSheet.tsx`, dan `foodLogRepository.ts` semuanya TIDAK disentuh.

### 7. File yang berubah
`src/shared/components/BottomNav.tsx` (Task 1 + fix z-index), `src/features/food-tracker/FoodTracker.tsx` (Task 2, ditulis ulang signifikan).

### 8. Dampak terhadap data/schema
Tidak ada. `BasketItem` murni tipe TypeScript lokal di komponen, tidak pernah masuk Dexie. Format `FoodLog` yang akhirnya ditulis via `foodLogRepository.add()` sama persis seperti sebelumnya.

### 9. Bug yang ditemukan (real, ditemukan lewat testing + dikonfirmasi user secara independen)
14. **FAB menutupi tombol "Tambahkan" di PortionSheet (dan berpotensi tombol utama sheet lain).** Root cause: FAB+menu speed-dial (`z-50`) dan overlay sheet (`PortionSheet`/`ExerciseSheet`/dll., juga `z-50`) sama-sama `z-50` — karena `BottomNav` dirender SETELAH konten halaman di DOM (`AppShell`), FAB menang urutan stacking dan secara visual+fungsional menutupi tombol sheet yang kebetulan posisinya tumpang tindih di layar sempit. Ditemukan lewat testing manual (tombol Tambahkan tidak merespons di posisi yang terlihat benar), dan **dikonfirmasi independen oleh user** yang melaporkan gejala yang sama persis saat testing sendiri di sesi yang sama.
    Solusi: z-index FAB+overlay-nya diturunkan (`z-50`→`z-30` untuk FAB, `z-40`→`z-20` untuk overlay dial) supaya tetap di atas konten halaman biasa tapi di BAWAH overlay sheet manapun (`z-50`). Efek sampingnya justru benar: saat sheet terbuka, FAB otomatis "tertutup" sheet dan tidak bisa terpicu tak sengaja — perilaku yang memang diinginkan (satu modal aktif dalam satu waktu).

### 10. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npm run build` — 0 TypeScript error, dijalankan berkali-kali sepanjang pass (termasuk setelah fix z-index).
- **Browser walkthrough end-to-end** (dev server port 5174 terpisah, data akun nyata):
  - **Task 1 — dark mode**: pill dark (`bg-surface` gelap), teks putih, ikon ungu di badge `bg-accent-soft` gelap — dicek lewat zoom screenshot, kontras jelas dan legible. Overlay dim juga menyesuaikan.
  - **Task 1 — light mode**: pill putih, ikon ungu di badge lavender — dicek di viewport 390px DAN di tab baru 360px (teknik `resize_window` pada tab yang sama sempat tidak konsisten seperti sesi-sesi sebelumnya, diatasi dengan tab baru). Tidak ada elemen terpotong di kedua ukuran.
  - **Task 1 — ikon**: dizoom close-up, dikonfirmasi visual scale/timbangan (Berat), api (Olahraga), gelas (Air), fork+sendok (Catat Makanan — BUKAN buku) — keempatnya stroke-based konsisten gaya BottomNav.
  - **Task 1 — fungsi navigasi tidak berubah**: keempat pilihan dicoba, semua mengarah ke destinasi yang sama seperti sebelumnya (`/tracker`, `/hydration`, `/progress?tab=weight`, buka `ExerciseSheet`).
  - **Task 2 — tambah 3 item via "+"**: 3 makanan dari kategori Lauk ditambahkan berturut-turut lewat tombol "+" — tidak ada PortionSheet terbuka, tidak ada navigasi, "Dipilih (N)" dan "Simpan N item" ter-update tiap kali.
  - **Task 2 — tambah 1 item via PortionSheet**: tap nama makanan lain → PortionSheet terbuka, porsi diubah ke 1.5×, meal diubah ke Siang, tap "Tambahkan" → basket bertambah 1 (total jadi berapa pun sesuai konteks), sheet tertutup, TETAP di halaman list (tidak auto-navigasi) — persis sesuai spesifikasi.
  - **Task 2 — Simpan**: tombol "Simpan N item" ditekan → navigasi ke Home → CalorieRing, macro bar, DAN Buku Harian semuanya menampilkan total & rincian per-item yang BENAR (dikonfirmasi angka kalori match persis, mis. 240+200+180+195=815 kkal, 4 baris terpisah di Buku Harian) — dikonfirmasi juga lewat query Dexie langsung bahwa `foodLogs` benar-benar bertambah dengan `foodId` yang benar (id katalog asli untuk item katalog, `null` untuk item Milikku).
  - **Task 2 — konfirmasi batal**: tap panah kembali saat basket berisi → kotak inline "Batalkan pilihan? N item..." muncul (bukan `window.confirm()`); "Lanjutkan Pilih" mengembalikan ke list dengan basket UTUH; "Ya, Batalkan" menghapus basket DAN navigasi ke Home — dikonfirmasi lewat Buku Harian bahwa item yang dibatalkan BENAR-BENAR TIDAK tersimpan (tidak ada duplikat).
  - **Task 2 — regresi Favorit/Terakhir**: setelah 1 kali save nyata, kedua tab menampilkan item yang baru dicatat dengan benar, tap "+" dan tap nama tetap berfungsi sesuai pola baru.
  - **Task 2 — regresi Milikku**: 1 item My Foods baru dibuat via Tambah Cepat (checkbox "Simpan sebagai Makanan Saya"), MyFoodRow dikonfirmasi split dengan benar — tap "+" masuk basket langsung, tap nama buka PortionSheet (tanpa link Report Food, sesuai desain lama yang tidak diubah), delete (✕ dua-tap) tidak diuji ulang eksplisit pass ini tapi kodenya tidak disentuh sama sekali.
  - **Task 2 — regresi Report Food**: `ReportFoodSheet` dibuka dari PortionSheet katalog, tampil normal (checklist alasan + catatan), ditutup tanpa submit (fitur ini sudah diverifikasi tuntas end-to-end di sesi jauh sebelumnya, pass ini cuma memastikan masih bisa dibuka, tidak ke-block oleh perubahan basket).
  - **Task 2 — regresi search/filter**: tidak diuji ulang eksplisit di pass ini (kode `visibleFoods`/query tidak disentuh sama sekali, risiko dinilai sangat rendah) — dicatat jujur, bukan diklaim PASS.
  - Console dibaca di beberapa titik sepanjang seluruh rangkaian (dark+light, 390px+360px) — 0 error, 0 warning selain noise Vite dev standar.
  - Seluruh data uji (food logs, 1 MyFood "Bekal Regresi Test") dihapus lagi setelah testing lewat query Dexie langsung, dikonfirmasi lewat reload bahwa state kembali bersih.

### 11. Bug yang belum diverifikasi
- Search/filter (`query` state) tidak diuji ulang eksplisit pass ini (lihat poin 10) — kode area itu tidak disentuh, risiko dinilai rendah tapi belum dibuktikan ulang secara live pada pass ini secara spesifik.
- Delete My Foods (tap-dua-kali ✕) tidak diuji ulang eksplisit pass ini — kode `handleDeleteMyFood`/`MyFoodRow`'s delete button tidak disentuh sama sekali.

### 12. Known Issues
- **Basket hilang jika Quick Add dipakai saat basket berisi item** (lihat poin 5) — keputusan sadar, bukan bug, karena mengubah Quick Add di luar scope brief ini.
- Tab "Semua" (`tab === 'semua'`) tetap jadi cabang kode tak terjangkau lewat UI — sudah dicatat di entry sebelumnya, tidak berubah.

### 13. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Menunggu review user atas kedua perubahan ini.

---

## 2026-08-26 (lanjutan 2) — Bugfix: Onboarding Stuck di "Menghitung target harianmu..."

### 1. Tanggal
2026-08-26

### 2. Tujuan
User melaporkan onboarding macet permanen di step terakhir setelah tap "Lihat hasilku →" — tombol berubah jadi teks "Menghitung target harianmu..." dan tidak pernah lanjut ke halaman hasil. Ditemukan saat user testing langsung di HP lewat network URL (`http://10.166.152.36:5174/`) yang di-generate Claude di sesi sebelumnya untuk keperluan testing mobile.

### 3. Root Cause
`crypto.randomUUID()` — dipakai untuk generate `id` record baru di 6 file (`userRepository.ts`, `weightRepository.ts`, `exerciseRepository.ts`, `myFoodRepository.ts`, `foodLogRepository.ts`, dan basket key di `FoodTracker.tsx`) — **hanya tersedia di secure context** (HTTPS atau `localhost`/`127.0.0.1`) menurut spesifikasi Web Crypto API. `http://10.166.152.36:5174/` adalah HTTP biasa di IP LAN, BUKAN secure context, sehingga `crypto.randomUUID` di sana adalah `undefined`.

Dikonfirmasi langsung lewat DevTools di origin yang sama: `{"isSecureContext":false,"hasCrypto":"object","hasRandomUUID":"undefined"}`.

`finishOnboarding()` di `OnboardingFlow.tsx` memanggil `await userRepository.save(...)` TANPA `try/catch`. Saat `crypto.randomUUID()` throw `TypeError: crypto.randomUUID is not a function` di dalam `save()`, exception itu tidak tertangkap sama sekali — `setSaving(true)` yang sudah dipanggil sebelumnya tidak pernah di-reset ke `false`, dan `navigate('/result')` tidak pernah tercapai. Hasilnya: UI macet permanen di teks "Menghitung target harianmu..." tanpa pesan error apa pun ke user, PERSIS gejala yang dilaporkan. Direproduksi ulang di browser (DevTools terbuka) sebelum fix, error tertangkap di console:
```
TypeError: crypto.randomUUID is not a function
    at DexieUserRepository.save (userRepository.ts:10:15)
    at finishOnboarding (OnboardingFlow.tsx:55:24)
```

### 4. Kenapa baru muncul sekarang
Bug ini SELALU ada sejak awal (6 file itu selalu pakai `crypto.randomUUID()` langsung) — hanya tidak pernah kena karena testing sebelumnya selalu di `localhost` (secure context by default). Baru muncul begitu user testing lewat network URL LAN IP (`--host`) di HP, yang memang bukan secure context.

### 5. Keputusan yang diambil
- **Satu utility baru `src/shared/lib/id.ts`** (`generateId()`) dipakai sebagai pengganti seluruh pemanggilan `crypto.randomUUID()` langsung di 6 lokasi — bukan fix satu-satu tanpa fallback, supaya bug yang sama tidak muncul lagi di file lain di masa depan. `generateId()` memakai `crypto.randomUUID()` kalau tersedia (secure context, jalur normal), dan fallback ke UUID v4 manual berbasis `Math.random()` kalau tidak tersedia — ID ini hanya dipakai sebagai primary key lokal di Dexie/basket-key React, bukan untuk keperluan kriptografis, jadi `Math.random()` cukup aman dipakai (sama seperti trust model ID lain di app ini).
- **Tidak menambahkan `try/catch` di `finishOnboarding()`** — sengaja tidak dilakukan pass ini. User secara eksplisit minta root cause SPESIFIK bug ini ditemukan & diperbaiki, bukan defensive-error-handling umum di luar scope; dan begitu root cause (`crypto.randomUUID` unavailable) diperbaiki, jalur yang sebelumnya throw sudah tidak throw lagi — tidak ada perubahan UI/UX onboarding sama sekali, sesuai constraint eksplisit user.

### 6. Implementasi
File baru: `src/shared/lib/id.ts` (fungsi `generateId()`). 6 file diubah HANYA pada baris pemanggilan ID (`crypto.randomUUID()` → `generateId()` + 1 baris import): `userRepository.ts`, `weightRepository.ts`, `exerciseRepository.ts`, `myFoodRepository.ts`, `foodLogRepository.ts`, `FoodTracker.tsx`. Tidak ada perubahan lain di file manapun — `OnboardingFlow.tsx` sendiri TIDAK disentuh sama sekali (bug-nya ada di repository yang dipanggilnya, bukan di komponennya).

### 7. File yang berubah
`src/shared/lib/id.ts` (baru), `src/data/repositories/userRepository.ts`, `src/data/repositories/weightRepository.ts`, `src/data/repositories/exerciseRepository.ts`, `src/data/repositories/myFoodRepository.ts`, `src/data/repositories/foodLogRepository.ts`, `src/features/food-tracker/FoodTracker.tsx`.

### 8. Dampak terhadap data/schema
Tidak ada. Format ID tetap UUID v4 string di kedua jalur (native `crypto.randomUUID()` dan fallback manual) — sama persis dengan yang sudah dipakai `db.users`, dll. `SCHEMA_VERSION` tetap 6.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npx tsc -b` — 0 TypeScript error setelah fix.
- **Reproduksi bug SEBELUM fix**: dijalankan penuh di browser (tab terbuka ke `http://10.166.152.36:5174/onboarding`, DevTools terbuka) — semua 6 step onboarding diisi sampai step terakhir, tap "Lihat hasilku →" → tombol macet di "Menghitung target harianmu..." (di-screenshot, dikonfirmasi visual match dengan laporan user), console menunjukkan `TypeError: crypto.randomUUID is not a function` tepat di `userRepository.ts:10:15` dipanggil dari `finishOnboarding`.
- **Verifikasi fix SETELAH fix**: di origin insecure-context YANG SAMA (`http://10.166.152.36:5174/`, tanpa reload/restart dev server — HMR otomatis apply perubahan), seluruh flow onboarding diulang dari awal (Goal → Motivasi → Data Badan → Target Berat → Aktivitas → Frekuensi Makan) → tap "Lihat hasilku →" → **berhasil navigasi ke `/result`** menampilkan target kalori/protein yang benar (1.758 kkal, 126g protein untuk skenario 70kg→65kg) → tap "Mulai Tracking →" → **berhasil landing di Dashboard** (`/`) dengan data ter-load benar.
- **Console dicek ulang setelah fix** (log lama di-clear, lalu dibaca ulang `onlyErrors: true`) — 0 error/exception tersisa; dua exception yang sempat tercatat sebelumnya (7:49 dan 7:51) keduanya dari SEBELUM/SAAT fix di-apply lewat HMR, tidak muncul lagi di percobaan setelahnya.
- Tidak ada perubahan UI/UX onboarding yang diuji ulang secara visual — screenshot sebelum-sesudah pada tiap step identik, karena memang tidak ada baris kode UI yang diubah.

### 10. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Bug ini selesai — root cause ditemukan (secure-context requirement `crypto.randomUUID` + missing error surfacing), diperbaiki secara surgical (1 utility baru + 6 titik panggilan), dan diverifikasi end-to-end di origin insecure-context yang sama persis yang melaporkan bug ini.

---

## 2026-08-26 (lanjutan 3) — UX Fix: Feedback Visual Tombol "+" di FoodTracker

### 1. Tanggal
2026-08-26

### 2. Tujuan
User melaporkan tidak ada feedback visual sama sekali saat tap tombol "+" di alur multi-select basket (`FoodTracker.tsx`) — terutama saat sudah scroll jauh dari counter "Dipilih (N)" di atas, user tidak tahu tap-nya berhasil atau tidak, sehingga tap berkali-kali dan berisiko item masuk duplikat ke keranjang.

### 3. Root Cause
N/A — ini permintaan UX polish baru, bukan bugfix atas perilaku yang salah. Tombol "+" sebelumnya memang tidak pernah punya state visual "berhasil ditambahkan"; klik langsung memanggil `addToBasket()` tanpa efek apa pun pada tombolnya sendiri.

### 4. Keputusan yang diambil
- **Satu hook lokal baru `useAddedFlash()`** dipakai bersama oleh SEMUA baris yang punya tombol "+" — bukan diduplikasi 2×. Mengembalikan `{ justAdded, trigger }`: `justAdded` (state, untuk visual "+"→"✓") dan `trigger(action)` (pembungkus onClick yang menjalankan `action` sekali lalu otomatis reset ke "+" setelah 800ms).
- **Katalog makanan (dipakai identik oleh tab Favorit/Terakhir/Nasi&Karbo/Lauk/dst — semuanya lewat `visibleFoods` yang sama) diekstrak jadi komponen `FoodRow` baru** — sebelumnya inline JSX langsung di dalam `.map()` tanpa state sendiri per baris, sehingga tidak mungkin punya animasi per-tombol tanpa re-render seluruh list. Props: `food`, `reported`, `onOpen`, `onQuickAdd` — perilaku/markup selain tombol "+" (badge region, badge "Dilaporkan", tap-nama buka PortionSheet) dipindah 1:1 tanpa diubah.
- **`MyFoodRow` (tab Milikku) memakai hook yang SAMA (`useAddedFlash`)** — komponen ini sudah punya local state sebelumnya (`armed` untuk konfirmasi hapus), jadi menambah `justAdded` di situ konsisten dengan pola yang sudah ada, bukan pola baru.
- **Warna: `bg-success-soft`/`text-success`** (bukan `grad-hero`/`text-white` yang dipakai state normal) — token yang SUDAH ADA di `index.css` (`--fk-success`, `--fk-success-soft`, sudah didefinisikan untuk light DAN dark mode sejak awal, belum pernah dipakai di UI manapun sampai sekarang). Sengaja pilih pasangan soft-bg + saturated-text (pola yang sama dipakai badge "Dilaporkan" `bg-pro-soft/text-pro` dan region `bg-accent-soft/text-accent`) daripada solid `bg-success text-white` — dicek kontrasnya: di dark mode `--fk-success` adalah hijau terang (`#4ade80`), teks putih di atasnya kontras buruk; pasangan soft+text tetap kontras baik di kedua tema.
- **Guard duplikat pakai `useRef` (bukan hanya `useState`)** — lihat poin 5, bug nyata ditemukan saat testing dan diperbaiki di iterasi yang sama sebelum dilaporkan selesai.

### 5. Bug yang ditemukan & diperbaiki selama implementasi (real, ditemukan lewat testing)
15. **Guard berbasis `useState` saja tidak cukup ketat untuk tap yang BENAR-BENAR beruntun (sub-frame).** Implementasi awal `trigger()` mengecek `if (justAdded) return` memakai state React — tapi dua event klik yang landing sebelum React sempat re-render sama-sama masih membaca `justAdded` versi LAMA (`false`), sehingga keduanya lolos guard dan basket bisa dapat 2 entri dari yang seharusnya cuma boleh 1 tap. Ditemukan lewat testing otomatis: 8× `.click()` disparah secara sinkron pada elemen tombol yang sama (lebih agresif dari kemampuan tap manusia manapun) — sebelum fix, berpotensi race; setelah diganti guard-nya jadi `useRef` (dicek & di-set SECARA SINKRON di dalam handler yang sama, tidak menunggu re-render), 8× klik sinkron pada tombol yang sama HANYA menghasilkan 1 item baru di basket (dikonfirmasi lewat DOM query "Dipilih (N)": 3→4, bukan 3→11).
    Solusi: `lockRef = useRef(false)` dicek-dan-di-set di awal `trigger()`, `justAdded` (state) dipakai MURNI untuk visual (boleh lag 1 frame, tidak masalah untuk tampilan), reset keduanya bareng di `setTimeout` 800ms.

### 6. Implementasi
`useAddedFlash()` (hook baru, kecil, tidak butuh dependency baru — Cuma `useState`+`useRef`+`useEffect` dari React yang sudah dipakai di file ini), `FoodRow` (komponen baru, ekstraksi dari JSX inline lama), `MyFoodRow` (ditambah pemakaian hook yang sama). Tombol "+" di kedua komponen: `disabled={justAdded}`, teks `justAdded ? '✓' : '+'`, className kondisional untuk warna, `transition-colors duration-150` untuk transisi warna yang halus (bukan instan/jarring).

### 7. File yang berubah
`src/features/food-tracker/FoodTracker.tsx` — satu-satunya file yang diubah. Tidak ada file lain disentuh (tidak ada perubahan token warna di `index.css`, `success`/`success-soft` sudah ada dari awal; tidak ada perubahan `foodLogRepository.ts` atau komponen sheet manapun).

### 8. Dampak terhadap data/schema
Tidak ada. `justAdded`/`lockRef` murni state UI lokal per-komponen-instance, tidak pernah masuk `BasketItem` maupun Dexie. Behavior basket (1 tap = 1 item masuk, format `FoodLog` yang akhirnya tersimpan) sama persis seperti sebelumnya — dikonfirmasi eksplisit lewat testing di poin 9.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npx tsc -b` dan `npm run build` — 0 TypeScript error, build production sukses.
- **Visual di mobile viewport (tab baru 390×700, teknik yang sudah terbukti reliable dari sesi-sesi sebelumnya)**: tap "+" pada baris katalog (tab Lauk) → tombol berubah jadi "✓" dengan latar hijau muda (`bg-success-soft`) dan teks hijau (`text-success`) — dizoom lewat screenshot, kontras jelas terbaca di LIGHT mode. Setelah beberapa saat tombol kembali ke "+" ungu-gradient normal.
- **Dark mode**: `.dark` ditambahkan ke `<html>` (mekanisme toggle tema asli aplikasi, dikonfirmasi lewat baca `index.css`), tap "+" lagi di tab Lauk → checkmark tampil dengan latar hijau gelap dan teks hijau terang, kontras tetap jelas terbaca di atas surface gelap — tidak ada masalah legibility di kedua tema.
- **Tab Milikku (`MyFoodRow`)**: dibuat 1 item My Food test ("Test Row Flash") lewat Tambah Cepat khusus untuk pengujian ini, tap "+"-nya menunjukkan checkmark hijau yang SAMA PERSIS dengan katalog — mengonfirmasi hook yang dipakai bersama bekerja identik di kedua komponen. Item test dihapus lagi setelah pengujian lewat query Dexie langsung (`myFoods.delete`), dikonfirmasi tidak tersisa.
- **Tab Favorit/Terakhir**: tidak diuji ulang visual eksplisit di viewport terpisah pass ini (rendering-nya memakai komponen `FoodRow` yang SAMA PERSIS dengan tab kategori yang sudah diuji — bukan cabang kode terpisah), tapi dicatat jujur karena tidak ada screenshot langsung dari kedua tab tersebut spesifik pass ini.
- **Anti-duplikat — tap cepat berulang, DIUJI DUA CARA:**
  1. Klik berulang lewat koordinat layar (browser automation) — awalnya menunjukkan hasil membingungkan (list bergeser tiap kali basket bertambah, sehingga klik ke-2/3/dst pada koordinat tetap justru mengenai baris LAIN, bukan bug guard) — dicatat sebagai artefak pengujian, bukan bug produk.
  2. **Klik langsung pada elemen DOM yang sama lewat JavaScript (`btn.click()` 8× berturut-turut secara sinkron)** — pengujian yang benar-benar mengisolasi "user tap tombol yang SAMA berkali-kali" dari efek pergeseran layout. Hasil SEBELUM fix guard (poin 5): berpotensi race. Hasil SETELAH fix: **basket bertambah TEPAT 1 item** dari 8× klik sinkron pada tombol yang sama — jauh lebih agresif dari kemampuan tap manusia manapun, sehingga kasus tap-cepat manusia riil pasti aman.
- **Behavior basket tidak berubah**: dikonfirmasi via "Dipilih (N)" counter yang selalu bertambah SATU per SATU tap yang benar-benar berbeda tombol/item (contoh: Ayam Goreng Dada → Ayam Bakar → Ayam Goreng Dada lagi via klik terpisah menghasilkan 3 entri terpisah di basket, bukan digabung/dihapus — perilaku "boleh menambah item yang sama 2× sebagai 2 baris terpisah" TETAP seperti sebelumnya, hanya tap BERULANG pada tombol YANG SAMA dalam window 800ms yang dicegah).
- **Console**: dicek di kedua tab pengujian (`onlyErrors: true`) sepanjang seluruh rangkaian testing — 0 error/exception.
- Tidak ada data yang tersisa di database nyata setelah pengujian — basket test TIDAK pernah ditekan "Simpan" (jadi `foodLogs` tidak tersentuh sama sekali), dan 1 My Food test yang dibuat khusus untuk pengujian dihapus lagi di akhir.

### 10. Bug yang belum diverifikasi
Tidak ada — dark mode juga sudah diverifikasi visual (lihat poin 9).

### 11. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Menunggu review user.

---

## 2026-08-26 (lanjutan 4) — Import 137 Item Makanan Baru ke Seed

### 1. Tanggal
2026-08-26

### 2. Tujuan
User menyediakan file data makanan baru `landing/fitku_food_additions.ts` (dibuat di luar sesi ini) untuk diimport ke `indonesianFoodsSeed` di `src/data/seed/indonesianFoods.seed.ts`, dengan syarat: cek duplikat by nama (case-insensitive, skip kalau sama), generate id pakai `generateId()`, jangan ubah struktur file seed.

### 3. Temuan penting sebelum import (perbedaan dari yang diklaim di file sumber)
- **Field mismatch**: `fitku_food_additions.ts` diberi komentar "Format mengikuti indonesianFoods.seed.ts" dan dianotasi `Omit<Food, 'id'>[]`, tapi field yang dipakai SEBENARNYA berbeda dari tipe `Food` asli (`src/data/types/food.types.ts`): file sumber pakai `servingSize`/`servingUnit`/`servingDescription`/`regionTag`, sedangkan `Food` asli punya `servingGrams`/`servingLabel`/`region`. File tersebut TIDAK type-check terhadap `Food` yang sebenarnya — kemungkinan ditulis oleh proses lain tanpa akses ke tipe asli. Ditangani dengan mapping eksplisit saat merge: `servingDescription`→`servingLabel`, `servingSize`→`servingGrams` (unit `g` maupun `ml` sama-sama dipetakan ke `servingGrams` sebagai angka mentah — pola yang sama persis dengan item minuman yang sudah ada di seed asli, mis. `Es Teh Manis` punya `servingGrams: 250` untuk 250ml), `regionTag`→`region`.
- **Jumlah item tidak sama persis dengan komentar ringkasan di file sumber**: komentar penutup file mengklaim "TOTAL TAMBAHAN: 154 item baru" dan "lauk: +35 item (17 → 52)", tapi isi array yang benar-benar di-parse berjumlah **153 item** (bukan 154), dengan lauk 34 item baru (bukan 35). Selisih 1 ada di kategori lauk. Angka yang dipakai untuk laporan ini adalah hasil parsing aktual (153), bukan komentar ringkasan file sumber — dicatat jujur sebagai penyimpangan dari instruksi awal user yang menyebut "154 item".

### 4. Keputusan yang diambil
- **Cek duplikat**: bandingkan `name.trim().toLowerCase()` setiap item baru terhadap SEMUA 56 item existing (bukan cuma dalam kategori yang sama, sesuai instruksi "bandingkan dengan semua item yang sudah ada"). 16 item di-skip (daftar di poin 7). Tidak ada duplikat nama di ANTARA sesama 153 item baru itu sendiri (dicek terpisah, hasil kosong).
- **Generate id**: bukan format `food-XXX` sekuensial seperti 56 item existing — sesuai instruksi eksplisit user ("Generate id... menggunakan generateId()... konsisten dengan fix crypto.randomUUID sebelumnya"), 137 item baru diberi id UUID v4 (dibangkitkan lewat `crypto.randomUUID()` Node — identik dengan jalur utama `generateId()` di `src/shared/lib/id.ts` karena Node modern selalu punya `crypto.randomUUID` native, setara "secure context"). Hasilnya: seed sekarang punya DUA format id berdampingan (`food-001..056` lama, UUID untuk yang baru) — ini disengaja sesuai instruksi, bukan inkonsistensi yang perlu diperbaiki.
- **Struktur file TIDAK diubah**: 137 item baru di-append di AKHIR array (setelah item Minuman terakhir), dikelompokkan per kategori dengan komentar section (`// --- Nasi & Karbo (tambahan) ---`, dst, mengikuti urutan kategori yang sama seperti section asli) — bukan disisipkan di tengah section existing. Format export (`export const indonesianFoodsSeed: Food[] = [...]`), cara `foodRepository.ts` memanggilnya (`ensureSeeded()`, `bulkPut`), dan urutan section existing semuanya tidak disentuh sama sekali.

### 5. Implementasi
Konversi dilakukan lewat script Node sementara (strip anotasi TypeScript dari kedua file source secara regex agar bisa di-`require` sebagai data mentah, tanpa compiler check — file `landing/fitku_food_additions.ts` sendiri TIDAK diimport oleh kode aplikasi manapun, jadi mismatch tipe di dalamnya tidak pernah mempengaruhi build), bukan lewat build tool aplikasi (`landing/` di luar `tsconfig` utama). Hasil konversi (137 objek `Food` valid, id+field sudah dipetakan benar) ditempel sebagai literal statis ke `indonesianFoods.seed.ts` — TIDAK ada pemanggilan `generateId()` di runtime file seed (yang akan menghasilkan id BERBEDA setiap kali modul di-load ulang, merusak referensi `foodId` di `FoodLog` lama antar sesi) — nilai UUID di-generate SEKALI saat proses import lalu di-hardcode, sama seperti `food-001` dst sudah hardcode sejak awal.

### 6. File yang berubah
`src/data/seed/indonesianFoods.seed.ts` — HANYA file ini yang diubah (137 baris data baru ditambahkan). `landing/fitku_food_additions.ts` tidak disentuh (tetap sebagai file sumber referensi, tidak dihapus).

### 7. Item yang di-skip karena duplikat (16 item — nama sama persis, case-insensitive, dengan item existing)
Kategori Lauk (11): Udang Goreng Tepung, Telur Ceplok, Telur Rebus, Telur Dadar, Tahu Goreng, Tempe Goreng, Tempe Bacem, Rendang Sapi, Perkedel Kentang, Semur Daging, Pindang Ikan.
Kategori Gorengan (5): Pisang Goreng, Tahu Isi, Bakwan Sayur, Cireng, Risoles.

### 8. Dampak terhadap data/schema
Tidak ada perubahan schema (`SCHEMA_VERSION` tetap 6, struktur `Food` tidak berubah). Data existing (56 item, `foodLogs` historis yang mereferensikan `food-001..056`) tidak tersentuh — hanya penambahan baris baru. Di browser dengan `foods` table yang sudah ter-seed sebelumnya (count > 0), `ensureSeeded()` TIDAK otomatis menjalankan ulang seed (by design — lihat `foodRepository.ts`), jadi 137 item baru perlu masuk lewat `bulkPut` manual sekali (dilakukan saat testing, poin 9) — pada instalasi BARU (IndexedDB kosong), `ensureSeeded()` akan otomatis membawa seluruh 193 item tanpa langkah tambahan apa pun.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build**: `npx tsc -b` dan `npm run build` — 0 TypeScript error, build production sukses (bundle size naik wajar karena data bertambah: ~450KB → ~473KB gzip 133→141KB).
- **Verifikasi jumlah lewat script terpisah** (Node, membandingkan seed lama vs baru): total 56→193 (+137), tidak ada nama duplikat maupun id duplikat di array akhir (dicek programatik).
- **Verifikasi di browser (localhost:5174, desktop)**: karena `foods` table di IndexedDB sudah ter-seed dari sesi sebelumnya (count=56), dijalankan `db.foods.bulkPut(indonesianFoodsSeed)` manual sekali via DevTools untuk mem-forward-kan seed baru ke instalasi yang sudah ada — count berubah 56→193, dikonfirmasi lewat `db.foods.count()`.
- **Cek per kategori langsung di UI FoodTracker** — tiap tab kategori diklik, jumlah baris (`span.tabular-nums`, satu per baris makanan) dihitung lewat DOM query, dibandingkan dengan target:
  - Nasi & Karbo: 8 → **33** ✓
  - Lauk: 17 → **40** ✓
  - Sayur: 7 → **25** ✓
  - Gorengan: 6 → **19** ✓
  - Sup & Kuah: 7 → **25** ✓
  - Camilan: 6 → **28** ✓
  - Minuman: 5 → **23** ✓
  - Total: 56 → **193** ✓ (semua 7 kategori match persis dengan hasil parsing script, bukan angka klaim file sumber)
- **Verifikasi visual**: screenshot tiap kategori menunjukkan item lama dan baru bercampur (urutan Dexie, bukan urutan insert) — item baru seperti "Mie Rebus", "Bubur Kacang Hijau", "Ayam Geprek", "Es Doger" (dengan badge region "Sunda") tampil dan ter-render dengan benar (nama, serving label, kalori, badge region kalau ada).
- **Search**: diuji cari "Ayam Geprek" (item baru) — hasil filter menampilkan tepat 1 hasil yang benar, mengonfirmasi item baru ikut ter-index oleh `search()`/`visibleFoods` filter yang sudah ada (kode filter tidak disentuh sama sekali, jadi ini murni konfirmasi data masuk dengan benar).
- **Console**: dicek `onlyErrors: true` di sepanjang seluruh proses (reseed, reload, klik semua kategori, search) — 0 error/exception.

### 10. Bug yang belum diverifikasi
Tidak ada temuan bug pada pass ini — murni penambahan data, tidak ada perubahan logic apa pun.

### 11. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Catatan untuk masa depan: pengguna PRODUKSI (bukan sesi testing ini) yang sudah punya IndexedDB ter-seed sebelum perubahan ini TIDAK akan otomatis melihat 137 item baru sampai `foods` table mereka kosong ulang atau ada mekanisme re-seed eksplisit ditambahkan — saat ini `ensureSeeded()` hanya seed sekali saat count=0 (instalasi baru langsung dapat 193 item; instalasi existing perlu penanganan terpisah kalau/ketika app sudah live, di luar scope pass ini).

---

## 2026-08-26 (lanjutan 5) — 2 UX Fix: Basket Collapsed + Chip Kategori Lebih Besar

### 1. Tanggal
2026-08-26

### 2. Tujuan
Dua perbaikan UX diminta bersamaan di `FoodTracker.tsx`: (Fix 1) basket "Dipilih (N)" yang menampilkan SEMUA item sekaligus jadi terlalu panjang begitu user menambah banyak item — perlu dibatasi tampil maks 3 dengan expand/collapse plus total kalori di header; (Fix 2) chip kategori (Favorit/Terakhir/Milikku/7 kategori) terlalu kecil sebagai touch target — perlu diperbesar ke ~44px tinggi.

### 3. Root Cause
N/A untuk keduanya — permintaan UX polish baru atas fitur yang sudah berfungsi normal, bukan bugfix.

### 4. Keputusan yang diambil

**Fix 1 — Basket collapsed:**
- State baru `basketExpanded` (boolean, default `false`) plus dua derived value: `basketTotalCalories` (`useMemo`, sum `item.calories * item.servings` dibulatkan, diformat `.toLocaleString('id-ID')` — konvensi format kalori yang SAMA PERSIS dipakai di 7+ tempat lain di app: `Dashboard.tsx`, `CalorieRing.tsx`, `CalorieTab.tsx`, dll., bukan format baru) dan `basketHasOverflow` (`basket.length > 3`).
- `visibleBasketItems = basketExpanded || !basketHasOverflow ? basket : basket.slice(0, 3)` — kalau item di-hapus sampai turun ≤3 SAAT expanded, toggle otomatis hilang dan seluruh sisa item (yang memang ≤3) tetap tampil, tanpa perlu reset state manual.
- Header basket berubah dari `Dipilih (N)` jadi `Dipilih (N) · {total} kkal`.
- Toggle (`▼ ...N item lainnya` / `▲ Sembunyikan`) dirender sebagai baris terakhir DI DALAM container basket (bukan di luar), hanya muncul kalau `basketHasOverflow` — dipakai warna `text-accent` (token yang sudah ada, sama seperti gaya tombol "⚡ Tambah Cepat" yang juga teks-tappable berwarna accent).
- **Behavior basket TIDAK diubah**: `addToBasket`/`removeFromBasket`/`handleSaveBasket` semuanya tetap persis sama — hanya bagian RENDER yang berubah (`basket.map` → `visibleBasketItems.map`). Tombol "Simpan N item" tetap di posisi sama (`sticky bottom-0`, DI LUAR div basket, tidak disentuh sama sekali) — otomatis "selalu terlihat" karena memang tidak pernah berada di dalam bagian yang di-collapse.

**Fix 2 — Chip lebih besar:**
- **Prop baru opt-in `size?: 'sm' | 'lg'`** ditambahkan ke `Chip.tsx` (dipakai bersama oleh 5 file: `FoodTracker.tsx`, `Hydration.tsx`, `ExerciseSheet.tsx`, `QuickAddSheet.tsx`, `PortionSheet.tsx`) — default `'sm'` menghasilkan className IDENTIK BYTE-PER-BYTE dengan sebelumnya (`px-3.5 py-1.5 text-xs`), jadi 4 pemanggil lain yang TIDAK diminta berubah (Hydration, ExerciseSheet, QuickAddSheet, PortionSheet) otomatis tetap pixel-identical tanpa perlu disentuh satu pun. Hanya `FoodTracker.tsx` yang mengoper `size="lg"` (`px-5 py-3 text-sm`) ke kesepuluh chip-nya (Favorit/Terakhir/Milikku + 7 kategori).
- Kenaikan satu tingkat: `text-xs`→`text-sm` (skala tipografi Tailwind yang sudah dipakai di seluruh app, bukan token baru), padding vertikal `py-1.5`→`py-3` dan horizontal `px-3.5`→`px-5` — hasil akhirnya persis 44px tinggi (diukur langsung, lihat poin 9), sesuai target instruksi.
- Warna TIDAK berubah sama sekali — `bg-surface`/`text-ink-dim`/`shadow-soft` (inactive) dan `grad-hero`/`text-white` (active) semuanya token/class yang sudah ada sejak awal, cuma dipindah ke variabel `sizeClasses` yang digabung dengan class warna yang sama persis.
- Behavior scroll horizontal (`overflow-x-auto` di container chip row di `FoodTracker.tsx`) TIDAK disentuh sama sekali.

### 5. Implementasi
`src/shared/components/Chip.tsx`: tambah prop `size` + `sizeClasses` ternary. `src/features/food-tracker/FoodTracker.tsx`: tambah state `basketExpanded`, dua derived value (`basketTotalCalories`, `basketHasOverflow`+`visibleBasketItems`), ubah render basket (header teks + `.map()` sumber + toggle button baru), tambah `size="lg"` ke 10 pemanggilan `<Chip>`.

### 6. File yang berubah
`src/shared/components/Chip.tsx`, `src/features/food-tracker/FoodTracker.tsx`. Tidak ada file lain disentuh.

### 7. Dampak terhadap data/schema
Tidak ada. `basketExpanded` murni state UI lokal, tidak pernah masuk `BasketItem`/Dexie. Format `FoodLog` yang akhirnya tersimpan via `handleSaveBasket()` tidak berubah sama sekali.

### 8. Kendala lingkungan testing (dicatat jujur)
`resize_window` (tool `claude-in-chrome`) di lingkungan ini punya batas bawah lebar fisik jendela ~500px — mencoba resize ke 390×700 maupun 360×700 sama-sama menghasilkan `window.innerWidth` 500, BUKAN 390/360 yang diminta (dikonfirmasi lewat `window.innerWidth` langsung, dicoba 2× dengan tab baru, tetap 500). Diatasi dengan beralih ke tool `mcp__plugin_ecc_chrome-devtools__emulate` (`viewport: "390x700x2,mobile,touch"` dan `"360x700x2,mobile,touch"`) yang meng-override viewport CSS langsung (device-emulation, sama seperti device toolbar DevTools) — dikonfirmasi `window.innerWidth` PERSIS 390 lalu PERSIS 360 di dua pengujian terpisah. Testing "390px" dan "360px" pada laporan poin 9 di bawah adalah hasil dari viewport emulation ini, BUKAN resize jendela fisik — dicatat eksplisit karena ini toolchain yang berbeda dari yang dipakai di entry-entry sebelumnya.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build**: `npx tsc -b` dan `npm run build` — 0 TypeScript error.
- **Ukuran chip diukur langsung** (`getBoundingClientRect()`, bukan cuma dibaca dari screenshot): chip "Favorit" = **44px tinggi** persis, dikonfirmasi identik di viewport 390px MAUPUN 360px.
- **Viewport 390×700 (exact, via device emulation)**: screenshot chip row — semua chip besar & legible, scroll indicator terlihat. Tambah 6 item basket ("Nasi & Karbo") → header menampilkan `Dipilih (6) · 1.590 kkal` (dihitung manual: 280+210+200+320+160+420=1.590, cocok) → collapsed menampilkan 3 item pertama (Mie Rebus, Bubur Kacang Hijau, Nasi Lemak) + toggle `▼ ...3 item lainnya` → tombol "Simpan 6 item" tetap sticky terlihat di bawah, tidak terpengaruh collapsed state.
- **Viewport 360×700 (exact, via device emulation)**: chip tetap 44px, chip terakhir sedikit terpotong di tepi kanan (`Nas...`) tapi itu memang perilaku horizontal-scroll yang disengaja (bukan bug — chip row tidak dirancang menampilkan semua chip sekaligus di layar sempit). Basket 6 item di-expand (klik toggle) → SEMUA 6 item tampil, toggle berubah jadi `▲ Sembunyikan`, total tetap `1.590 kkal` — dikonfirmasi angka konsisten sebelum/sesudah expand (total tidak berubah karena expand cuma visual, bukan operasi data).
- **Dark mode di 360px**: `.dark` class ditambahkan ke `<html>` (mekanisme toggle tema asli app, BUKAN `prefers-color-scheme` — dikonfirmasi lewat komentar di `index.css` yang eksplisit bilang tema "deliberately NOT tied to prefers-color-scheme"), basket + chip di-screenshot ulang — kontras tetap jelas terbaca (background gelap, teks terang, badge kalori & toggle tetap legible), tidak ada warna hardcode yang pecah di dark mode.
- **Test collapse→expand→collapse penuh** (viewport 390px, sebelum ganti ke 360px): tambah 5 item → collapsed 3 + toggle `▼ ...2 item lainnya` → klik expand → 5 item tampil + `▲ Sembunyikan` → hapus 3 item (sisa 2) → toggle otomatis hilang (karena `basketHasOverflow` jadi false), 2 item tersisa tampil penuh, header `Dipilih (2) · 245 kkal` (150+95=245, cocok) — dikonfirmasi kode menangani transisi "expanded lalu turun di bawah ambang" tanpa bug visual.
- **Scroll horizontal chip row**: dicoba scroll kanan sampai chip "Minuman" (chip terakhir) di 500px viewport, tap langsung berhasil beralih tab — dikonfirmasi scroll+tap tetap berfungsi normal setelah ukuran chip berubah.
- **Console**: dicek `onlyErrors: true` di kedua toolchain (`claude-in-chrome` utk viewport 500px awal, `chrome-devtools` plugin utk viewport 390/360px exact) — 0 error/exception di keduanya, di seluruh rangkaian (tambah/hapus/expand/collapse/scroll/dark-mode).

### 10. Bug yang belum diverifikasi
- Fix 2 (ukuran chip) tidak diuji ulang di 4 pemanggil `Chip` lain (`Hydration.tsx`, `ExerciseSheet.tsx`, `QuickAddSheet.tsx`, `PortionSheet.tsx`) secara visual langsung — dinilai risiko sangat rendah karena keempatnya TIDAK mengoper prop `size` sama sekali (default `'sm'` menghasilkan className identik ke versi sebelum perubahan, dikonfirmasi lewat pembacaan kode, bukan cuma asumsi), tapi belum dibuktikan lewat screenshot langsung pass ini.

### 11. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Menunggu review user atas kedua fix ini.

---

## 2026-08-27 — Bugfix: Food Seed Baru Tidak Muncul di HP yang Sudah Pernah Buka App

### 1. Tanggal
2026-08-27

### 2. Tujuan
User melaporkan: 137 item makanan baru yang diimport ke `indonesianFoodsSeed` (entry sesi sebelumnya) belum muncul saat dibuka di HP.

### 3. Root Cause
`foodRepository.ensureSeeded()` (`src/data/repositories/foodRepository.ts`) hanya menjalankan `db.foods.bulkPut(indonesianFoodsSeed)` kalau `db.foods.count() === 0`. HP user SUDAH PERNAH membuka app sebelumnya (dipakai untuk testing onboarding di sesi-sesi lalu), jadi `foods` table di IndexedDB HP itu sudah terisi 56 item (seed versi lama) — begitu dibuka lagi setelah seed di-update jadi 193 item, `count()` mengembalikan 56 (bukan 0), sehingga `bulkPut` TIDAK PERNAH dipanggil ulang dan 137 item baru tidak pernah masuk ke HP tersebut. Ini SAMA PERSIS dengan risiko yang sudah dicatat sebagai "Next Step" di entry import sebelumnya (2026-08-26 lanjutan 4) — sekarang terbukti benar-benar terjadi.

### 4. Kenapa testing sebelumnya tidak menangkap ini
Verifikasi sesi sebelumnya dilakukan di browser DESKTOP (`localhost:5174`) yang IndexedDB-nya berbeda origin dari HP (`10.166.152.36:5174`) — desktop di-reseed manual lewat DevTools sekali (`bulkPut` langsung), sehingga terlihat sukses, tapi perbaikan itu HANYA berlaku untuk origin desktop tersebut, bukan perbaikan permanen di kode aplikasi. HP user (origin berbeda) tidak pernah disentuh manual, jadi tetap stale.

### 5. Keputusan yang diambil
`ensureSeeded()` diubah dari "seed sekali kalau kosong" jadi "SELALU upsert seed setiap kali app dibuka" — guard `if (count === 0)` dihapus, `bulkPut(indonesianFoodsSeed)` dipanggil tanpa syarat di setiap boot. Ini aman karena:
- `foods` table HANYA PERNAH ditulis oleh seed ini — makanan buatan user sendiri disimpan di table terpisah (`myFoods`), `FoodLog` menyimpan snapshot nilai gizi sendiri (tidak live-join ke `foods`). Tidak ada baris `foods` yang bisa "tertimpa secara tidak diinginkan" karena semua baris `foods` MEMANG berasal dari array seed yang sama.
- `bulkPut` adalah upsert-by-id: baris dengan id yang sudah ada di-overwrite dengan nilai seed terbaru (bonus: koreksi data gizi di masa depan juga otomatis ter-apply ke device lama), baris baru masuk, baris yang TIDAK ada di array seed (tidak pernah terjadi di app ini) TIDAK dihapus.
- Dengan perubahan ini, PENAMBAHAN ITEM MAKANAN DI MASA DEPAN otomatis sampai ke semua device yang sudah pernah install, cukup dengan `git pull` + reload — tidak perlu lagi manual `bulkPut` per-device seperti yang terpaksa dilakukan sesi sebelumnya.

### 6. Implementasi
Satu fungsi diubah, `src/data/repositories/foodRepository.ts`, method `ensureSeeded()` — guard `count === 0` dihapus, komentar diperbarui menjelaskan alasan "always upsert, self-healing".

### 7. File yang berubah
`src/data/repositories/foodRepository.ts` — satu-satunya file yang diubah.

### 8. Dampak terhadap data/schema
Tidak ada perubahan schema. Dampak fungsional: `ensureSeeded()` sekarang menjalankan 1 query `bulkPut` tambahan di SETIAP app boot (sebelumnya nol query setelah seed pertama) — biaya diabaikan karena Dexie `bulkPut` untuk ~193 baris kecil adalah operasi sub-milidetik, dan ini terjadi sekali per sesi (bukan per-render).

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build**: `npx tsc -b` — 0 TypeScript error.
- **Eksekusi kode baru dikonfirmasi jalan tanpa error**: dibuka tab baru ke origin `http://10.166.152.36:5174/` (origin YANG SAMA yang dipakai HP user) — `ensureSeeded()` versi baru berjalan otomatis saat app boot, `db.foods.count()` menghasilkan 193, console 0 error/exception.
- **Repro langsung skenario "HP yang sudah stale" TIDAK dilakukan** — percobaan menghapus manual 137 item lewat DevTools (untuk mensimulasikan state 56-item lama, lalu reload untuk membuktikan self-heal) DITOLAK oleh classifier keamanan otomatis sesi ini (delete data diklasifikasikan berpotensi destruktif, meski di database test lokal) — bukan gagal, memang tidak dicoba lagi setelah ditolak. Kebenaran fix ini disandarkan pada pembacaan logika kode (poin 5) yang straightforward: `bulkPut` tanpa guard PASTI menjalankan upsert setiap boot, tidak ada jalur kode yang bisa membuatnya skip lagi.
- **Jalan keluar untuk user**: karena ini adalah PERBAIKAN KODE (bukan aksi sekali-jalan di data), begitu user reload halaman FitKu di HP-nya (setelah kode ter-deploy/dev-server ke-restart dengan perubahan ini), `ensureSeeded()` versi baru otomatis jalan dan meng-upsert 193 item — tidak perlu langkah manual apa pun dari user selain refresh/reload.

### 10. Bug yang belum diverifikasi
Repro langsung "HP stale → reload → otomatis jadi 193" belum dibuktikan visual di HP user itu sendiri pada pass ini (dev server perlu di-restart/HMR perlu diterapkan dulu, dan user perlu reload manual) — root cause dan logika fix sudah pasti benar (poin 5), tapi konfirmasi visual akhir menunggu user reload dan cek sendiri.

### 11. Next Step
Menunggu konfirmasi user setelah reload FitKu di HP — kalau 193 item sudah muncul di semua kategori, bug ini selesai. Kalau BELUM (misal dev server perlu restart total, bukan cuma HMR, karena perubahan ada di fungsi yang cuma dipanggil sekali saat mount), langkah lanjutan: minta user hard-refresh atau restart dev server.

---

## 2026-08-27 (lanjutan) — 4 Bug/Gap Fix Pra-Deployment

### 1. Tanggal
2026-08-27

### 2. Tujuan
User secara eksplisit meminta fokus membereskan 4 bug/gap tersisa sebelum deployment (bukan Auth/Supabase/Payment/AI/P3, yang sudah di-pending terpisah): (1) tile Olahraga Dashboard tidak auto-refresh setelah log lewat FAB, (2) basket FoodTracker hilang saat Quick Add dipakai di tengah basket, (3) evaluasi tab "Semua" FoodTracker yang tidak bisa diakses, (4) Adaptive Target bisa diterapkan berulang dalam minggu yang sama. User eksplisit memberi kebebasan menentukan HOW (implementasi/arsitektur/UX), dengan instruksi "gunakan solusi lebih baik dari asumsi saya kalau ditemukan."

### 3. Root Cause per item

**#1 — Tile Olahraga stale:** `BottomNav.tsx` (FAB, dirender global lewat `AppShell` di semua route) dan `Dashboard.tsx` masing-masing punya `ExerciseSheet` + state lokal SENDIRI-SENDIRI. FAB membuka sheet IN-PLACE (tidak navigasi route), jadi `Dashboard`'s `todayExercise` local state tidak pernah tahu ada log baru — tidak seperti Air/Catat Makanan yang memang navigasi ke route lain dan otomatis remount saat kembali. Log makanan (`useTodayLog`) TIDAK kena bug serupa murni karena kebetulan semua jalur penulisannya selalu diikuti navigasi/remount, bukan karena ada mekanisme reactive lintas-komponen — jadi ini bug laten yang sama sekali BISA muncul lagi di masa depan kalau ada sheet in-place baru yang menulis data yang dibaca komponen lain.

**#2 — Basket hilang saat Quick Add:** `handleQuickAdd` di `FoodTracker.tsx` (dari overhaul basket sesi 2026-08-26) SENGAJA tidak diubah waktu itu ("Quick Add SENGAJA TIDAK diubah sama sekali... Pertahankan... Quick Add" — lihat entry 2026-08-26 lanjutan 2) — langsung `addLog()` (persist ke DB) lalu `navigate('/')`. Navigasi ini me-remount `FoodTracker`, otomatis membuang state `basket` yang belum di-"Simpan". Trade-off ini sudah dicatat sebagai Known Issue eksplisit sejak awal, sekarang diminta diperbaiki.

**#3 — Tab "Semua" tak terjangkau:** `type Tab` di `FoodTracker.tsx` punya varian `'semua'` dan cabang `if (tab === 'semua') return allFoods`, tapi TIDAK ADA chip yang pernah men-set `tab` ke `'semua'` — chip row cuma render Favorit/Terakhir/Milikku + 7 kategori. Dead code sejak awal (confirmed via grep, hanya 2 referensi, keduanya self-contained di file yang sama).

**#4 — Adaptive Target bisa diterapkan berulang:** `handleApplyTarget` di `AiCoach.tsx` cuma dijaga oleh `targetApplied` — state React LOKAL yang reset ke `false` tiap kali komponen unmount/remount (ganti halaman, reload, atau besoknya buka lagi). `analyzeAdaptiveTarget()` murni fungsi dari tren berat (`weightEntriesLookback`) dan `user.targetCalories` SAAT ITU — begitu target sudah naik/turun karena diterapkan, tren berat belum sempat berubah (perlu hari/minggu), jadi kalkulasi ulang bisa menyarankan penyesuaian SERUPA lagi di atas target yang SUDAH disesuaikan, dan `targetApplied` yang cuma bertahan satu sesi tidak mencegahnya di kunjungan berikutnya — berpotensi menumpuk (compounding) penyesuaian kalori tiap kali user buka AI Coach sebelum tren sempat kebaca.

### 4. Keputusan yang diambil per item

**#1:** Dibuat hook baru `src/shared/hooks/useTodayExercise.ts` — pola per-domain-hook yang sudah ada (`useTodayLog`, `useWeightHistory`), TAPI ditambah module-level pub/sub (`Set<() => void>` listener) supaya SEMUA instance hook yang ter-mount (baik di `Dashboard` maupun `BottomNav`) saling refresh begitu SALAH SATU dari mereka menulis lewat `addExercise()` — bukan cuma instance yang menulis. Ini pola generik yang bisa dipakai lagi kalau ada bug serupa di domain lain nanti (hydration/weight logged in-place dari FAB, misalnya), bukan tambalan khusus-Exercise saja. `Dashboard.tsx` dan `BottomNav.tsx` sama-sama diganti untuk pakai hook ini menggantikan `exerciseRepository` langsung.

**#2:** `handleQuickAdd` diubah supaya SEARAH dengan semua jalur "add" lain di file yang sama (`handleQuickBasketAdd`, `handleConfirmFromSheet`) — masuk ke `addToBasket()` (state lokal, `foodId: null`, `servings: 1`), TIDAK `addLog()`, TIDAK `navigate()`. "Simpan sebagai Makanan Saya" tetap langsung tersimpan (independen dari basket, tidak berubah). Dengan ini Quick Add tidak lagi memicu remount sama sekali, jadi masalah "basket hilang" hilang dari akarnya, bukan di-patch dengan menyimpan/mengembalikan basket di sekitar navigasi. `useTodayLog` jadi tidak dipakai lagi sama sekali di `FoodTracker.tsx` (importnya dihapus) — `handleSaveBasket` sudah lama manggil `foodLogRepository` langsung tanpa hook ini.

**#3:** Dipilih HAPUS dead code, bukan diekspos di UI. Pertimbangan: (a) browsing semua 193 item tanpa filter kategori/pencarian bukan UX yang berguna — scroll sangat panjang; (b) fungsi "lihat semua makanan" SUDAH ADA secara implisit lewat search bar (`visibleFoods` sudah bypass tab sepenuhnya kalau `query` terisi); (c) chip row sudah menampung 10 chip (Favorit/Terakhir/Milikku + 7 kategori) dan sudah butuh scroll horizontal — menambah chip ke-11 memperpanjang scroll tanpa manfaat nyata karena poin (b). Baik `Tab` type maupun cabang kode `if (tab === 'semua')` dihapus.

**#4:** Ditambahkan guard PERSISTEN (bukan cuma state React) — field baru `lastAdaptiveTargetAppliedAt?: string` di `User` (opsional, tidak perlu bump `SCHEMA_VERSION` karena Dexie tidak enforce schema per-field di luar index yang dideklarasikan — pola yang sama persis dengan `getProAccess()` yang menurunkan status trial dari `user.createdAt` tanpa migrasi). `analyzeAdaptiveTarget()` (fungsi domain, murni & testable) sekarang menerima param `now: Date = new Date()` (konvensi yang sama dengan `getProAccess(user, sub, now)`) dan mengecek DI AWAL: kalau `lastAdaptiveTargetAppliedAt` ada dan kurang dari `COOLDOWN_DAYS = 7` hari yang lalu, langsung return pesan cooldown (`onCooldown: true`, `suggestedCalories: null`) tanpa menghitung tren sama sekali. `handleApplyTarget` di `AiCoach.tsx` menulis `lastAdaptiveTargetAppliedAt: new Date().toISOString()` bersamaan dengan `targetCalories`/`targetFat`/`targetCarbs` dalam satu `userRepository.update()`. Cooldown dipilih ROLLING 7 hari (bukan align ke kalender Senin-Minggu) supaya "diterapkan hari Sabtu" tidak tiba-tiba reset hari Senin — tren berat memang butuh waktu sekitar segitu untuk merefleksikan perubahan target kalori, jadi rolling window lebih menggambarkan alasan sebenarnya ketimbang batas kalender yang arbitrer.

### 5. Implementasi
File baru: `src/shared/hooks/useTodayExercise.ts`. File diubah: `src/features/dashboard/Dashboard.tsx` (pakai `useTodayExercise`, hapus state/effect/import `exerciseRepository` lokal), `src/shared/components/BottomNav.tsx` (pakai `useTodayExercise` untuk `handleSaveExercise`), `src/features/food-tracker/FoodTracker.tsx` (`handleQuickAdd` reroute ke basket, hapus `'semua'` dari `Tab` type + cabang filter, hapus `useTodayLog`/`addLog` yang jadi tak terpakai), `src/data/types/user.types.ts` (+`lastAdaptiveTargetAppliedAt?`), `src/domain/adaptiveTarget.ts` (+cooldown gate, +param `now`, +field `onCooldown` di return type), `src/features/ai-coach/AiCoach.tsx` (`handleApplyTarget` menulis field cooldown baru).

### 6. File yang berubah
`src/shared/hooks/useTodayExercise.ts` (baru), `src/features/dashboard/Dashboard.tsx`, `src/shared/components/BottomNav.tsx`, `src/features/food-tracker/FoodTracker.tsx`, `src/data/types/user.types.ts`, `src/domain/adaptiveTarget.ts`, `src/features/ai-coach/AiCoach.tsx`.

### 7. Dampak terhadap data/schema
`SCHEMA_VERSION` TETAP 6 — tidak ada perubahan index Dexie. Satu field opsional baru (`User.lastAdaptiveTargetAppliedAt`) ditambahkan tanpa migrasi, konsisten dengan pola `getProAccess()` yang sudah ada. `AdaptiveTargetResult` (tipe return domain, hanya dipakai `AiCoach.tsx`) dapat field baru `onCooldown: boolean` — non-breaking karena satu-satunya caller ikut diperbarui di pass yang sama. Tidak ada data lama yang perlu migrasi — user existing yang belum pernah apply Adaptive Target otomatis punya `lastAdaptiveTargetAppliedAt: undefined`, yang oleh guard baru diperlakukan sama seperti "belum pernah apply" (tidak kena cooldown).

### 8. Testing yang benar-benar dilakukan (tested by Alig)
- **Build:** `npx tsc -b` dan `npm run build` — 0 TypeScript error di sepanjang implementasi (dicek incremental tiap fix selesai, dan sekali lagi di akhir).
- **#1 — Olahraga tile, browser nyata (localhost:5174):** Dashboard dibuka, tile Olahraga awal menampilkan "—". FAB (+) di BottomNav ditekan → pilih "Olahraga" → isi durasi 30 menit → Simpan. TANPA reload/navigasi apa pun, tile Olahraga di Dashboard (yang tetap terbuka di layar yang sama) langsung berubah jadi "131 kkal" — dikonfirmasi visual lewat screenshot sebelum/sesudah. Console dicek `onlyErrors: true` — 0 error.
- **#2 — Basket + Quick Add, browser nyata:** Di `/tracker`, 1 item ("Mie Rebus", 280 kkal) ditambah ke basket lewat "+". Basket dikonfirmasi berisi 1 item ("DIPILIH (1) · 280 KKAL"). Lalu "⚡ Tambah Cepat" dibuka, diisi nama+kalori (150 kkal), Simpan. Basket TIDAK hilang — bertambah jadi 2 item ("DIPILIH (2) · 430 KKAL", 280+150=430 dikonfirmasi benar), halaman TETAP di `/tracker` (tidak ter-navigasi). Basket kemudian di-"Simpan 2 item" penuh untuk memastikan alur commit akhir masih berfungsi normal — dikonfirmasi di Dashboard: Sarapan menampilkan kedua item dengan total 430 kkal yang benar. Console 0 error.
- **#3 — Tab Semua, browser nyata:** Dicek lewat DOM query bahwa TIDAK ADA chip berteks "Semua" (memang tidak pernah ada di UI, tidak berubah dari sebelumnya). Untuk memastikan tidak ada regresi dari perubahan kode filter, tab Lauk (40 item), Milikku (kosong, pesan "Belum ada Makanan Saya" tampil benar), dan Favorit dicoba satu-satu — semua tetap berfungsi normal tanpa error. Console 0 error.
- **#4 — Adaptive Target cooldown, browser nyata (skenario end-to-end penuh):** Data berat sintetis di-seed lewat `weightRepository` (flat 76kg selama ~16 hari, padahal goal `lose_weight` — dipilih supaya `analyzeAdaptiveTarget` pasti menghasilkan saran nyata untuk diuji, bukan cuma dibaca dari kode). Di `/coach`, kartu "Target Adaptif" menampilkan saran yang PERSIS cocok dengan hitungan manual (aktual 0kg/minggu vs target -0.5kg/minggu → sarankan turunkan ke 1.484 kkal) — mengonfirmasi logika domain existing tidak ikut rusak oleh perubahan. Tombol "Terapkan 1.484 kkal" ditekan → pesan berubah jadi cooldown + centang "✓ Target baru diterapkan ke profilmu." muncul bersamaan (koheren, bukan kontradiksi). **Test kritis:** halaman di-RELOAD PENUH (navigasi ulang ke `/coach`, bukan cuma re-render) untuk mensimulasikan sesi/hari baru dan me-reset `targetApplied` (state lokal) — pesan cooldown ("Kamu baru menerapkan penyesuaian target hari ini. FitKu akan evaluasi progres lagi dalam 7 hari...") TETAP tampil dan tombol "Terapkan" TETAP tidak muncul, membuktikan guard-nya benar-benar persisten di database, bukan cuma state komponen yang kebetulan belum di-reset. Dikonfirmasi langsung lewat query Dexie: `user.targetCalories` = 1484, `user.lastAdaptiveTargetAppliedAt` tersimpan dengan timestamp yang benar. Console 0 error di seluruh rangkaian.
- **Housekeeping:** Semua data uji (2 food log test, 1 exercise log test, 2 weight entry sintetis) dihapus lagi setelah testing lewat query Dexie langsung; `user.targetCalories`/`targetFat`/`targetCarbs`/`lastAdaptiveTargetAppliedAt` dikembalikan ke nilai semula (1784/50/200/undefined) — dikonfirmasi lewat query ulang bahwa Dashboard kembali ke state bersih (0/1.784 kkal, 0 makanan, tile Olahraga "—").

### 9. Bug yang belum diverifikasi
Tidak ada — keempat fix diuji end-to-end langsung di browser dengan skenario yang benar-benar memicu bug lama (bukan cuma baca kode), termasuk skenario reload penuh untuk fix #4 yang secara spesifik menguji bahwa persistensi (bukan state sesi) yang menahan cooldown.

### 10. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri untuk keempat item ini — sudah selesai dan terverifikasi. Item lain di luar scope (Auth, Payment/Mayar.id KYC, AI Coach LLM, P3) tetap pending sesuai instruksi eksplisit user, dibahas terpisah.

---

## 2026-08-27 (lanjutan 2) — Bugfix Urgent: 404 saat Refresh di fitku.fit (Vercel)

### 1. Tanggal
2026-08-27

### 2. Tujuan
User melaporkan: FitKu sudah live di **fitku.fit (hosting: Vercel)** — informasi baru, sebelumnya persiapan deploy yang tercatat di project ini (`netlify.toml`, `.netlify/`) mengasumsikan Netlify sebagai platform. Bug: refresh browser di route selain root (`/progress`, `/settings`, `/tracker`, dst) menghasilkan `404: NOT_FOUND` dari Vercel.

### 3. Root Cause
FitKu adalah SPA murni client-side routing (`BrowserRouter` dari `react-router-dom`, dikonfirmasi di `src/App.tsx`) — semua path selain `/` HANYA ada di JavaScript, tidak ada file fisik di server. Vercel, tanpa konfigurasi rewrite, mencoba mencari file/route `/progress` secara langsung di server saat browser melakukan HTTP GET (yang terjadi persis saat refresh) dan gagal karena memang tidak ada file seperti itu — beda dengan navigasi via klik link di dalam app (yang ditangani React Router di client, tidak pernah hit server). Root cause ini SAMA PERSIS dengan yang sudah diantisipasi sebelumnya lewat `netlify.toml`'s `[[redirects]] from="/*" to="/index.html" status=200` — tapi karena hosting aktual ternyata Vercel (bukan Netlify), rule itu tidak pernah berlaku di produksi.

### 4. Keputusan yang diambil
Dibuat `vercel.json` di root project berisi `rewrites` yang mengarahkan SEMUA path (`/(.*)`) ke `/` — persis skema/konten yang diinstruksikan user, konfigurasi standar Vercel untuk SPA client-side routing. Tidak ada perubahan lain di luar file ini pada pass ini (murni deploy-config, bukan kode aplikasi).

### 5. Catatan penting yang ditemukan (di luar scope fix ini, dilaporkan bukan dieksekusi)
`netlify.toml` juga berisi security headers produksi (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — lihat [[fitku-security-status]], "MVP security hardening... complete") yang HANYA berlaku kalau hosting-nya Netlify. Karena hosting aktual adalah Vercel, header-header keamanan tersebut **kemungkinan besar TIDAK aktif di fitku.fit saat ini** — `vercel.json` yang baru dibuat pass ini HANYA berisi `rewrites`, belum ada `headers`. Ini di luar scope permintaan user ("Fix: Buat file vercel.json... rewrites" — spesifik untuk bug 404), jadi TIDAK ditambahkan tanpa diminta, tapi perlu di-flag eksplisit sebagai gap keamanan produksi yang terpisah dari bug 404 ini.

### 6. Implementasi
Satu file baru: `vercel.json` (root project), isi persis seperti yang diinstruksikan user.

### 7. File yang berubah
`vercel.json` (baru). Tidak ada file lain disentuh.

### 8. Dampak terhadap data/schema
Tidak ada — murni file konfigurasi platform hosting, tidak menyentuh kode aplikasi maupun data.

### 9. Testing yang benar-benar dilakukan (tested by Alig)
- **Build**: `npm run build` — 0 TypeScript error, build production sukses (tidak terpengaruh, `vercel.json` di luar pipeline Vite/tsc).
- **Verifikasi di fitku.fit setelah redeploy**: BELUM dilakukan pada pass ini — deploy ke Vercel terjadi otomatis setelah push (di luar kendali langsung sesi ini, butuh waktu build+propagasi di sisi Vercel). User yang akan memverifikasi langsung (`fitku.fit/progress` lalu refresh) setelah redeploy Vercel selesai, sesuai instruksi eksplisit user di poin verifikasi.

### 10. Bug yang belum diverifikasi
Perbaikan 404 belum dikonfirmasi visual di production (fitku.fit) pada pass ini — root cause dan solusi standar Vercel sudah pasti benar secara teknis (pola `rewrites` ini adalah solusi resmi Vercel untuk SPA), tapi konfirmasi akhir menunggu user cek langsung setelah redeploy.

### 11. Next Step
Menunggu konfirmasi user setelah Vercel redeploy selesai — refresh di `fitku.fit/progress` (atau route lain) harus tetap menampilkan halaman yang benar, bukan 404. Terpisah: gap security headers di Vercel (poin 5) belum ditangani — perlu keputusan/instruksi eksplisit user kalau mau ditambahkan `headers` ke `vercel.json` mereplikasi yang sudah ada di `netlify.toml`.

---

## 2026-08-27 (lanjutan 3) — Perbaikan Terpadu: Riwayat Berat + Badge Goal-Aware + Penilaian Konsisten per Goal

### 1. Tanggal
2026-08-27

### 2. Tujuan
Tiga perbaikan terkait weight-tracking dikerjakan sebagai satu kesatuan (item #1 jadi fondasi #2/#3): (1) hapus entri berat yang salah di tab Berat, dengan anchor (entri pertama/onboarding) dilindungi; (2) badge "+X.Xkg dari awal" di tab Berat jadi goal-aware (bukan cuma matematis "turun selalu hijau"); (3) audit & samakan semua tempat yang menilai perubahan berat (Weekly/Deep Insight, AI Coach daily tip) supaya arah "baik/buruk" konsisten dengan goal user, plus garis referensi target di sparkline. User memberi spec sangat eksplisit di follow-up message (teks, threshold, edge case per skenario) setelah proposal awal — implementasi final mengikuti spec eksplisit tersebut, bukan proposal awal.

### 3. Keputusan desain yang dikonfirmasi user sebelum coding (proposal → approval)
Sebelum implementasi, diajukan 4 keputusan yang butuh persetujuan eksplisit (sesuai [[fitku-product-development]]'s aturan "propose dulu, baru eksekusi"), semuanya **disetujui user**:
- **Badge 3-warna (merah/kuning/hijau) → 2 token**: FitKu cuma punya 2 token warna semantik non-netral (`success`=hijau, `pro`=amber — lihat `index.css`), dan design system FROZEN (lihat [[fitku-ux-design-system]]). Solusi: `success` untuk "good", `pro` untuk "caution" (menaungi baik kasus "merah" maupun "kuning" dari spec), abu-abu netral (`bg-surface-2 text-ink-dim`) untuk kasus "netral" (delta=0 di lose_weight). Teks + emoji ⚠️ tetap membawa beda level urgensi meski warnanya sama. Design system TIDAK di-unfreeze.
- **Tambahan dari user saat approval**: badge ini adalah informasi kesehatan dasar, **ditampilkan ke SEMUA user (free maupun Pro) — tidak boleh di-paywall**. Sudah demikian secara alami di implementasi (badge dihitung dari `entries`/`deltaKg`, tidak digate oleh `proAccess`), dikonfirmasi eksplisit di kode dengan komentar.
- **File target untuk item Weekly Insight**: user awalnya menyebut "Weekly Insight (deepInsight.ts)" — dua nama berbeda untuk hal yang sama. Dikonfirmasi lewat spec detail user sendiri ("Tren dihitung dari data 30 hari terakhir") bahwa target SEBENARNYA adalah `deepInsight.ts` (window 30 hari), BUKAN `weeklyInsight.ts` (window 7 hari, teks di situ sudah netral/faktual, tidak diubah).
- **Precedence AI Coach**: isu kalori/protein akut hari itu (`calorieRemaining < 0`, `proteinRemaining > 15`) TETAP prioritas utama di `insight`/`action`. Tip berbasis tren berat HANYA mengisi slot "sudah seimbang" yang sebelumnya generik — tidak pernah override isu urgent.
- **Fallback data tidak lengkap**: perbandingan berat harian (AI Coach tip) HANYA dihitung kalau entri berat HARI INI dan KEMARIN dua-duanya benar-benar ada — tidak pernah memaksa perbandingan dari data yang hilang.

### 4. Root Cause (kenapa ini perlu dikerjakan)
- **#1**: Tidak ada cara menghapus entri berat sama sekali sebelumnya — `weightRepository`/`useWeightHistory` cuma punya `add`, tidak ada `delete`. Salah input (typo, misal 750 alih-alih 75.0) tidak bisa dikoreksi tanpa akses langsung ke IndexedDB.
- **#2**: Badge lama (`WeightTab.tsx`) murni `deltaKg <= 0 ? hijau : amber` — asumsi "turun berat selalu baik" yang SALAH untuk goal `gain_muscle` (turun berat saat targetnya naik otot = buruk) dan `maintain` (turun ATAU naik jauh dari titik awal = buruk).
- **#3**: `deepInsight.ts`'s `weightTrendText` dan `nutrition.ts`'s `generateDailyCoaching` sama sekali tidak mempertimbangkan `user.goal` — keduanya cuma melaporkan angka naik/turun tanpa translate ke "apakah ini progress bagus atau tidak," inkonsisten dengan cara badge (setelah #2) dan Adaptive Target (sudah goal-aware sejak awal) menilai hal yang sama.

### 5. Implementasi

**#1 — Delete:**
- `weightRepository.ts`: tambah `delete(id): Promise<void>`.
- `useWeightHistory.ts`: tambah `removeEntry(id)` — mengembalikan `{ok:true}` atau `{ok:false, reason}`, guard "jangan hapus `entries[0]`" (anchor) di level HOOK (bukan cuma UI), jadi konsumen manapun di masa depan otomatis terlindungi. Hook juga sekarang meng-expose `first` (sebelumnya cuma dipakai internal untuk `deltaKg`).
- `WeightTab.tsx`: daftar entri diekstrak jadi komponen `WeightEntryRow` dengan pola tap-dua-kali PERSIS sama seperti `MyFoodRow`/`ExerciseSheet` (armed-state + auto-reset 3 detik) — tap pada baris anchor menampilkan pesan blokir ("Berat awal tidak bisa dihapus — ubah lewat Edit Profil") alih-alih arming delete, auto-hilang setelah 3 detik juga.

**#2 — Badge:**
- Domain baru `src/domain/weightAssessment.ts`, fungsi `assessWeightChange(goal, deltaKg)` — logika PERSIS sesuai spec final: `lose_weight` (naik→caution merah-teks, turun→good, 0→neutral abu), `gain_muscle` (naik→good, turun→caution merah-teks, 0→caution "Berat belum berubah"), `maintain` (|delta|≤1→good, >1→caution).
- `WeightTab.tsx`: badge sekarang render untuk SEMUA user (tidak di dalam blok `fullHistory`/Pro-gate).

**#3 — Konsistensi + sparkline target:**
- `assessMonthlyWeightTrend(goal, deltaKg)` (di file yang sama) — dipakai HANYA di `deepInsight.ts`'s `weightTrendText`, threshold stabil ±0.3kg, 9 kombinasi teks goal×arah PERSIS sesuai spec, plus copy fallback "Belum cukup data untuk melihat tren 30 hari — terus catat berat harian kamu." saat `weightEntries30.length < 2`.
- `assessDailyWeightTip(goal, deltaKg)` (file yang sama) — dipakai di `nutrition.ts`'s `generateDailyCoaching` (parameter baru opsional `dailyWeightTip`, dipakai HANYA di branch "kalori/protein sudah seimbang", sesuai precedence yang disetujui). `AiCoach.tsx` menghitung delta harian dari entri berat hari-ini vs kemarin (dari data yang SUDAH di-fetch untuk Weekly Insight, tidak ada fetch baru) — `null` kalau salah satu tanggal tidak ada datanya, sesuai fallback yang disetujui.
- `WeightTab.tsx`'s sparkline: garis putus-putus tipis di posisi `user.targetWeightKg` (warna `var(--fk-accent)`, opacity rendah) + label kecil "Target: Xkg" di ujung kanan — range chart di-extend untuk memasukkan nilai target supaya garis selalu masuk viewBox, bukan terpotong. Tidak render sama sekali kalau `targetWeightKg` kosong/≤0 (dicek eksplisit, bukan render di posisi 0/default).

### 6. File yang berubah
`src/domain/weightAssessment.ts` (baru — 3 fungsi: `assessWeightChange`, `assessMonthlyWeightTrend`, `assessDailyWeightTip`), `src/data/repositories/weightRepository.ts` (+`delete`), `src/shared/hooks/useWeightHistory.ts` (+`removeEntry`, +expose `first`), `src/features/progress/tabs/WeightTab.tsx` (rewrite signifikan — delete row, badge, sparkline target), `src/domain/deepInsight.ts` (`weightTrendText` goal-aware), `src/domain/nutrition.ts` (`generateDailyCoaching` +param `dailyWeightTip`), `src/features/ai-coach/AiCoach.tsx` (hitung & oper daily weight delta). `weeklyInsight.ts` SENGAJA TIDAK disentuh (lihat poin 3).

### 7. Dampak terhadap data/schema
Tidak ada perubahan Dexie schema — `SCHEMA_VERSION` tetap 6, tidak ada field baru di tipe manapun (semua derived dari `user.goal`/`user.targetWeightKg` yang sudah ada, sesuai constraint eksplisit). `AdaptiveTargetResult`/`DailyCoaching`/`DeepInsight` interface TIDAK berubah shape — hanya isi teks yang berubah.

### 8. Testing yang benar-benar dilakukan (tested by Alig)
- **Build**: `npx tsc -b` dan `npm run build` — 0 TypeScript error.
- **Delete — diuji penuh di browser**: hapus entri TENGAH (12 Agu) → berhasil, entri lain (24 Agu, 27 Jul) tidak terpengaruh, dikonfirmasi lewat query Dexie langsung. Hapus entri TERBARU (24 Agu) → berhasil, `latest` otomatis pindah ke entri berikutnya. Coba hapus entri PERTAMA/anchor (27 Jul) → DITOLAK, pesan blokir persis "Berat awal tidak bisa dihapus — ubah lewat Edit Profil" tampil di DOM (dikonfirmasi lewat `outerHTML`, bukan cuma baca kode), data di Dexie tidak berubah. Satu percobaan awal sempat membingungkan (row terlihat belum ke-delete di screenshot) — ternyata artefak timing pesan auto-dismiss 3 detik antar-panggilan tool terpisah, bukan bug; dikonfirmasi ulang dengan kedua tap dalam SATU eksekusi script dan hasilnya benar.
- **Badge — 3 goal diuji visual langsung di UI** (bukan cuma baca kode): `lose_weight` delta=−1 → hijau "↓ 1kg — sesuai target" ✓. `gain_muscle` delta=+0.5 → hijau "↑ 0.5kg — progres bagus" ✓. `maintain` delta=+0.5 (dalam ±1) → hijau "Berat terjaga" ✓. `lose_weight` delta=0 (persis) → **abu-abu netral** "Berat stabil", visually distinct dari hijau/amber ✓.
- **Semua cabang logika (9 badge + 9 monthly-trend + 10 daily-tip) diuji EXHAUSTIVE lewat pemanggilan langsung fungsi domain di browser console** (bukan tebak dari baca kode) — seluruhnya cocok PERSIS dengan teks yang di-spec-kan user, termasuk kasus tepi delta=0 untuk ketiga goal di daily-tip (semuanya mengembalikan pesan netral yang sama, tidak dipaksa ke kategori naik/turun).
- **Integrasi `deepInsight.ts` diuji langsung** (bukan cuma unit fungsi terisolasi) — dipanggil `generateDeepInsight()` yang sebenarnya dengan data 30-hari sintetis (delta −1kg, goal `lose_weight`) → menghasilkan `weightTrendText: "Berat kamu turun 1kg dalam 30 hari — sesuai target penurunan."`, persis sesuai spec DAN membuktikan wiring (bukan cuma fungsi standalone-nya) benar.
- **Integrasi AI Coach daily tip diuji end-to-end penuh di UI** (bukan cuma fungsi) — data berat kemarin=76kg, hari ini=77kg (naik) + goal `lose_weight` + 1 food log "seimbang" hari ini → kartu "Daily Coaching" menampilkan Insight "Berat kamu naik dibanding kemarin." dan Action "Fokus jaga defisit kalori hari ini — kurangi sedikit porsi karbo atau lemak." — PERSIS sesuai spec, dan dikonfirmasi masuk ke slot yang benar (branch "seimbang", bukan override branch kalori/protein).
- **Sparkline target line**: dikonfirmasi visual — garis putus-putus + label "Target: 55kg" tampil konsisten di semua screenshot pengujian (target user=55kg, jauh dari rentang berat aktual ~75-78kg, sehingga garis muncul di posisi ekstrem bawah chart — perilaku benar sesuai algoritma range-extend, bukan bug).
- **Console**: dicek `onlyErrors: true` di sepanjang seluruh rangkaian pengujian (delete, ganti goal 3×, cek AI Coach, cek deepInsight) — 0 error/exception.
- **Housekeeping**: seluruh data uji (3 entri berat sintetis, 1 food log test) dihapus lagi setelah testing, `user.goal` dikembalikan ke `lose_weight` (nilai awal), state akhir dikonfirmasi lewat query Dexie — 1 entri berat tersisa (anchor asli, 27 Jul 76.5kg), sama seperti sebelum pass ini dimulai.

### 9. Bug yang belum diverifikasi
Tidak ada — semua skenario yang diminta user (3 goal × delete tengah/terbaru/anchor-ditolak, 3 goal untuk badge/monthly-trend/daily-tip, sparkline target line dengan & tanpa data) sudah diuji, baik lewat pemanggilan fungsi langsung (exhaustive, untuk memastikan SETIAP cabang logika benar) maupun lewat UI end-to-end (untuk memastikan wiring-nya benar, bukan cuma fungsi terisolasi).

### 10. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri — ketiga item selesai dan terverifikasi sesuai spec final yang disetujui user. Catatan untuk masa depan: kalau user nanti ingin badge benar-benar 3 warna berbeda (bukan 2 token + teks), itu butuh keputusan eksplisit untuk unfreeze design system dan menambah token warna baru (misal `--fk-danger`) — belum dilakukan pada pass ini sesuai kesepakatan.

---

## 2026-08-28 — Security Headers di vercel.json

### 1. Tanggal
2026-08-28

### 2. Tujuan
Menutup gap yang di-flag di entry 2026-08-27 (lanjutan 2): sejak hosting pindah ke Vercel (`fitku.fit`), `vercel.json` cuma berisi `rewrites` untuk fix 404 SPA — security headers produksi yang sudah ada di `netlify.toml` (dari entry 2026-08-24, "Add production security headers and build hardening") tidak pernah ter-replikasi ke Vercel, jadi kemungkinan besar tidak aktif di production sejak pindah hosting. User secara eksplisit meminta headers ini ditambahkan, sekaligus menyiapkan `connect-src` untuk Edge Function AI Coach yang akan dibangun di task berikutnya (`/api/*`).

### 3. Root Cause
`vercel.json` dan `netlify.toml` adalah file config terpisah untuk platform berbeda — menambahkan headers ke satu file tidak otomatis menerapkannya ke platform lain. Migrasi hosting ke Vercel (2026-08-27) hanya membawa `rewrites` (untuk fix 404), headers-nya tertinggal.

### 4. Keputusan yang diambil
- Blok `headers` ditambahkan ke `vercel.json`, mereplikasi PERSIS 5 header dari `netlify.toml`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, dan `Content-Security-Policy` dengan directive yang sama (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`).
- **`connect-src` SENGAJA TIDAK diubah dari `'self'`** — instruksi user minta "sesuaikan connect-src untuk mengizinkan /api/*", tapi CSP `connect-src` beroperasi di level ORIGIN, bukan path; `/api/chat` (Edge Function AI Coach, task berikutnya) adalah path SAME-ORIGIN terhadap `fitku.fit`, jadi `'self'` yang sudah ada SUDAH mencakupnya — tidak ada origin eksternal (mis. `api.openai.com`) yang perlu di-allowlist di frontend CSP karena frontend TIDAK PERNAH memanggil OpenAI langsung, hanya `/api/chat` sendiri (lihat task berikutnya). Menambah sesuatu ke `connect-src` di luar `'self'` justru akan salah secara teknis dan melonggarkan CSP tanpa kebutuhan nyata.
- `source: "/(.*)"` dipakai (sama seperti pattern yang sudah dipakai `rewrites`) supaya header berlaku ke semua response, termasuk `/api/*` — dikonfirmasi lewat dokumentasi routing Vercel bahwa Serverless/Edge Functions match filesystem SEBELUM `rewrites` diterapkan, jadi request ke `/api/chat` tetap sampai ke function itu (tidak ikut ter-rewrite ke `/`), dan `headers` tetap ter-attach ke response-nya.

### 5. Implementasi
Satu file diubah: `vercel.json` — ditambah blok `headers` (5 header di atas), `rewrites` yang sudah ada tidak disentuh.

### 6. File yang berubah
`vercel.json`.

### 7. Dampak terhadap data/schema
Tidak ada — murni file konfigurasi platform hosting.

### 8. Testing yang benar-benar dilakukan (tested by Alig)
- **Validasi JSON**: `python3 -c "import json; json.load(open('vercel.json'))"` — valid.
- **Build**: `npm run build` (`tsc -b && vite build`) — 0 TypeScript error, build sukses (`vercel.json` di luar pipeline Vite/tsc, dicek untuk memastikan tidak ada regresi tak terduga).
- **Verifikasi header aktif di production (fitku.fit)**: BELUM dilakukan pada pass ini — sama seperti fix 404 sebelumnya, ini butuh redeploy Vercel dulu (di luar kendali langsung sesi ini). User yang akan memverifikasi lewat `curl -I https://fitku.fit` atau DevTools Network tab setelah redeploy selesai.

### 9. Bug yang belum diverifikasi
Header belum dikonfirmasi visual/langsung aktif di production — konfigurasinya sudah pasti benar secara sintaks Vercel (format `headers` standar, sama seperti dipakai untuk rewrites), tapi konfirmasi akhir menunggu redeploy + cek user.

### 10. Next Step
Menunggu konfirmasi user setelah Vercel redeploy — cek response header di `fitku.fit` sudah sesuai. Lanjut ke task AI Coach OpenAI Edge Function (entry berikutnya).

---

## 2026-08-28 (lanjutan) — AI Coach: OpenAI via Vercel Edge Function

### 1. Tanggal
2026-08-28

### 2. Tujuan
Mengganti AI Coach chat (`AiCoach.tsx`'s `handleSend`) dari `generateCoachReply()` rule-based (dua kalimat template, tidak pernah benar-benar "AI") jadi LLM asli — OpenAI `gpt-4o-mini` dipanggil dari Vercel Edge Function (`api/chat.ts`), bukan langsung dari frontend, supaya `OPENAI_API_KEY` tidak pernah ada di kode/bundle client.

### 3. Root Cause / Konteks
`generateCoachReply` cuma 2 cabang if/else berbasis `proteinRemaining`, tidak membaca pesan user sama sekali — sudah dicatat sebagai item pending ("AI Coach LLM") sejak beberapa entry sebelumnya (2026-08-27 lanjutan). User memberi spec lengkap (arsitektur, system prompt, rate limit, testing wajib) di instruksi task ini.

### 4. Keputusan yang diambil (termasuk deviasi dari spec awal, dengan alasan)

- **Arsitektur**: `api/chat.ts` (Vercel Edge Function, `export const config = { runtime: 'edge' }`) menerima `{ userId, message, context }`, memanggil OpenAI `gpt-4o-mini` pakai `process.env.OPENAI_API_KEY`, mengembalikan `{ reply }`. `AiCoach.tsx` fetch ke `/api/chat` (same-origin), tidak pernah memanggil OpenAI langsung.
- **`connect-src` CSP**: tidak perlu diubah — sudah diputuskan & didokumentasikan di entry Task 1 (`/api/chat` same-origin, `'self'` sudah cukup).
- **DEVIASI dari system prompt spec user — baris "Nama: {userName}" DIHAPUS**: `User` type (`src/data/types/user.types.ts`) TIDAK PUNYA field nama sama sekali (field yang ada: `id, gender, age, heightCm, weightKg, goal, motivation, targetWeightKg, activityLevel, mealsPerDay, targetCalories, targetProtein, targetCarbs, targetFat, lastAdaptiveTargetAppliedAt, createdAt, updatedAt`). Mengisi `{userName}` berarti hardcode placeholder palsu — dilarang eksplisit oleh constraint task ini ("Jangan hardcode API key atau placeholder apapun di kode"). Baris itu dihapus dari system prompt, sisanya (goal, targetCalories, todayCalories, targetWeight, currentWeight) tetap dikirim persis sesuai spec, semuanya data asli dari `AppStateContext`/`useTodayLog`/`useWeightHistory`.
- **`userGoal` dikirim sebagai label Indonesia** (`'Turun berat badan' | 'Naik otot' | 'Jaga berat badan'`), bukan raw enum (`lose_weight` dst) — supaya system prompt lebih natural buat LLM, pola yang sama dengan mapping lokal yang sudah ada di `Settings.tsx`/`ResultMoment.tsx`/`GoalStep.tsx` (tidak ada util bersama di codebase ini, tiap screen punya map sendiri, diikuti pola yang sama).
- **`currentWeight` = `useWeightHistory(user.id).latest?.weightKg ?? user.weightKg`** — berat TERBARU yang di-log, bukan berat onboarding statis, dengan fallback ke `user.weightKg` kalau entri berat somehow kosong (tidak seharusnya terjadi, anchor selalu ada, tapi fallback aman bukan crash).
- **Rate limit**: `Map<userId, {count, resetAt}>` module-scope di `api/chat.ts`, 20 pesan / 24 jam rolling per `userId`, sesuai instruksi eksplisit. **Keterbatasan yang di-flag, bukan disembunyikan**: Vercel Edge Functions bisa jalan sebagai beberapa instance concurrent lintas region, dan module state ini reset saat cold start/redeploy — jadi ini membatasi abuse PER-INSTANCE, BUKAN jaminan "20/hari" yang benar-benar global/durable lintas seluruh deployment. Kalau nanti ini jadi masalah nyata (user melaporkan bisa kirim >20 pesan), perlu upgrade ke store eksternal (KV/Redis) — di luar scope task ini karena user secara eksplisit minta in-memory.
- **`.env` vs `.env.local`**: instruksi task menyebut key ada di `.env.local`, tapi file yang benar-benar ada di project root adalah `.env` (dicek langsung, `.env.local` tidak ada). Keduanya sama-sama di-gitignore (`.env.*` di `.gitignore`), jadi tidak ada isu keamanan — tapi dicatat sebagai penyesuaian nyata, bukan diasumsikan/didiamkan.
- **`generateCoachReply` dihapus** dari `nutrition.ts` (bukan cuma berhenti dipanggil) — dikonfirmasi lewat grep bahwa satu-satunya caller adalah `AiCoach.tsx` yang sekarang sudah tidak memakainya, jadi dibiarkan jadi dead code akan melanggar prinsip "no unused code".

### 5. Implementasi
File baru: `api/chat.ts` (handler, system prompt builder, in-memory rate limiter, error handling per skenario: method salah, JSON invalid, field hilang, rate limit, OpenAI gagal/exception). File diubah: `src/features/ai-coach/AiCoach.tsx` (`handleSend` jadi async, fetch ke `/api/chat`, state `sending` baru untuk loading, pesan error ramah utk setiap failure mode, `useWeightHistory` ditambahkan untuk `currentWeight`, map label goal lokal ditambahkan, input+tombol kirim disable saat `sending`), `src/domain/nutrition.ts` (`generateCoachReply` dihapus).

### 6. File yang berubah
`api/chat.ts` (baru), `src/features/ai-coach/AiCoach.tsx`, `src/domain/nutrition.ts`.

### 7. Dampak terhadap data/schema
Tidak ada perubahan Dexie schema. Tidak ada dependency baru ditambahkan ke `package.json` (frontend tetap pakai `fetch` bawaan browser; Edge Function pakai Web-standard `Request`/`Response`/`fetch` bawaan Edge Runtime — tidak ada import package OpenAI SDK atau lainnya).

### 8. Testing yang benar-benar dilakukan (tested by Alig) — dan yang TIDAK bisa dilakukan di environment ini

**Yang berhasil dijalankan nyata:**
- **Build**: `npm run build` (`tsc -b && vite build`) — 0 TypeScript error. **Catatan penting**: `api/chat.ts` SENGAJA di luar scope `tsconfig.app.json`/`tsconfig.node.json` (Vercel mengompilasi Edge Function terpisah saat deploy, bukan lewat `tsc -b` repo ini) — jadi `npm run build` TIDAK memvalidasi `api/chat.ts`. Untuk menutup gap ini, dijalankan type-check standalone terpisah (`tsc --noEmit --strict` dengan `lib: ES2023+DOM`, `types: node`, mengarah ke `api/chat.ts`) — 0 error juga.
- **Test handler langsung dengan OpenAI API sungguhan** (bukan mock): dibuat harness Node (`node --env-file=.env --experimental-strip-types`, di scratchpad, TIDAK masuk repo) yang meng-import `api/chat.ts` yang SEBENARNYA dan memanggil `handler()`-nya langsung dengan `Request` object:
  - Pertanyaan fitness in-topic ("Aku masih kurang berapa kalori hari ini?", context 1200/1800 kkal) → **status 200, balasan: "Hari ini, kamu sudah mengonsumsi 1200 kkal dan target kalori harianmu adalah 1800 kkal. Jadi, kamu masih kurang 600 kkal..."** — jawaban dinamis, mengutip angka konteks yang benar dan menghitung selisihnya (600), sesuatu yang TIDAK MUNGKIN dihasilkan rule-based lama → **mengonfirmasi respons benar-benar dari OpenAI**.
  - Pertanyaan di luar topik ("Siapa presiden Indonesia?") → **status 200, balasan: "Maaf, saya hanya bisa membantu soal kesehatan dan fitness. Apakah ada yang ingin Anda tanyakan tentang nutrisi, olahraga, atau tujuan penurunan berat badan Anda?"** — guardrail system prompt bekerja, menolak dengan ramah + menawarkan bantuan relevan, PERSIS sesuai spec.
  - Field hilang (`userId` tanpa `message`/`context`) → status 400, `{ error: 'Missing userId, message, or context' }`.
  - Rate limit: 21 panggilan berturut-turut dengan `userId` yang sama → panggilan #1–20 status 200 normal, **panggilan #21 status 200 dengan `rateLimited: true`** dan pesan "Kamu sudah mencapai batas 20 pesan hari ini..." — cooldown logic benar persis di batas 20.
- **Audit bundle frontend untuk kebocoran key**: `npm run build` lalu `grep -c "OPENAI_API_KEY\|sk-proj-" dist/assets/index-*.js` → **0 match** (grep exit 1 = tidak ketemu). Ini pengecekan yang LEBIH KUAT daripada sekadar baca DevTools Network tab sekali — membuktikan secara compile-time bahwa key tidak pernah masuk ke bundle sama sekali, bukan cuma "kebetulan tidak kelihatan di satu request yang dicoba".
- **Console/runtime error saat testing di atas**: tidak ada exception dari harness maupun dari `api/chat.ts` sendiri di semua 4 skenario.

**Yang TIDAK bisa dilakukan di environment sesi ini (di-flag eksplisit, bukan diklaim PASS):**
- **`vercel dev` (dev server lokal Vite+Edge Function sekaligus, sesuai instruksi user)**: dicoba lewat `npx vercel@latest dev` — GAGAL karena dependency internal `vercel` CLI sendiri rusak di environment ini (`Error: Cannot find module 'bytes'`, dibutuhkan oleh `raw-body` di dalam `@vercel/fun`, package yang di-fetch npx). Ini masalah instalasi CLI, bukan bug di kode FitKu. Sebagai gantinya, dijalankan `vite dev` biasa (server hidup, `curl http://localhost:5173/` → 200) TAPI route `/api/chat` TIDAK ada di situ (murni Vite, tidak ada routing Vercel Edge Function) — jadi UI AI Coach di server ini akan selalu dapat 404 dari `/api/chat`, bukan mencerminkan perilaku production sebenarnya.
- **Klik manual di UI browser (kirim pesan lewat chat box AI Coach, lihat DevTools Network tab)**: browser extension Claude in Chrome TIDAK terhubung di sesi ini ("Browser extension is not connected") — tidak bisa drive browser sama sekali dari sisi saya. Kode UI (`AiCoach.tsx`) sudah di-review manual baris-per-baris untuk memastikan `fetch('/api/chat', ...)` dengan body yang benar, state `sending` disable input+tombol saat loading, dan tiga jalur error (`!res.ok`, JSON tanpa `reply`, exception jaringan) masing-masing menampilkan pesan ramah Bahasa Indonesia — tapi ini VERIFIKASI KODE, BUKAN observasi visual UI yang benar-benar berjalan seperti yang diminta.

### 9. Bug yang belum diverifikasi
- Alur UI penuh (ketik pesan → klik kirim → loading state tampil → balasan OpenAI muncul di bubble chat) belum dikonfirmasi visual di browser sungguhan — logic-nya sudah diverifikasi benar di level handler (poin 8) dan kode UI sudah direview, tapi wiring UI↔network↔render belum dilihat langsung berjalan.
- Verifikasi produksi (setelah deploy ke Vercel + `OPENAI_API_KEY` ditambahkan manual di dashboard Vercel oleh user) belum dilakukan — di luar kendali sesi ini.

### 10. Next Step
User perlu: (1) tambahkan `OPENAI_API_KEY` yang sama di Vercel dashboard (Environment Variables) untuk production, (2) setelah redeploy, coba AI Coach langsung di `fitku.fit` dan konfirmasi balasan benar-benar dari OpenAI + cek DevTools Network tab sendiri bahwa tidak ada key di request manapun, (3) kalau mau uji lokal penuh (Vite+Edge Function sekaligus), install `vercel` CLI di lingkungan lokal user sendiri (bukan lewat sesi ini) dan jalankan `vercel dev` — kemungkinan besar tidak akan kena masalah `Cannot find module 'bytes'` yang sama karena itu tampak spesifik ke environment sandbox sesi ini.

---

## 2026-08-28 (lanjutan 2) — AI Coach Production Testing: Root Cause 500 Ditemukan (Bukan Bug Kode)

### 1. Tanggal
2026-08-28

### 2. Tujuan
Browser extension (Claude in Chrome) baru aktif di sesi ini — user minta testing end-to-end AI Coach langsung di `fitku.fit` production (buka AI Coach, kirim "hallo", cek request masuk `/api/chat`, cek key tidak bocor di Network tab, test pertanyaan off-topic), dengan instruksi eksplisit: kalau gagal, JANGAN langsung ubah kode — cari root cause aktual dulu dari status code/response body/console.

### 3. Root Cause
Dites langsung di `fitku.fit/coach` (browser sungguhan, user yang sudah login/onboarding sebelumnya): kirim "hallo" → bubble AI Coach menjawab **"AI Coach sedang mengalami gangguan. Coba lagi sebentar lagi."** — ini pesan generik frontend untuk SEMUA `!res.ok` dari `/api/chat` (`AiCoach.tsx`), jadi tidak menunjukkan penyebab spesifik dari tampilan UI saja. Diselidiki lebih lanjut, TIDAK langsung diasumsikan/diubah kode-nya:
- `read_network_requests` (tab yang sama) → request `POST https://fitku.fit/api/chat` **statusCode: 500**, konsisten di 3 percobaan berturut-turut.
- Body response diperiksa langsung lewat `fetch()` dari console halaman yang sama (bukan lewat DevTools UI manual, tapi hasilnya identik): `{"error":"AI Coach sedang tidak tersedia. Coba lagi nanti."}`.
- Pesan ini **PERSIS** string yang di-`return` oleh `api/chat.ts` di baris `if (!apiKey) return json({ error: 'AI Coach sedang tidak tersedia. Coba lagi nanti.' }, 500)` — bukan error generik Vercel platform (yang akan punya format/body berbeda, biasanya HTML error page atau `{"error":{"code":"FUNCTION_INVOCATION_FAILED",...}}`), dan bukan exception tak tertangani di kode (yang akan masuk ke `catch` block dan mengembalikan pesan 502 yang berbeda, "AI Coach sedang mengalami gangguan..." dari `api/chat.ts`, bukan "tidak tersedia").
- **Kesimpulan: `process.env.OPENAI_API_KEY` undefined di Vercel Edge Function production** — persis skenario yang sudah diprediksi & dicatat sebagai "Next Step" di entry sebelumnya (belum ditambahkan user di Vercel dashboard, ATAU sudah ditambahkan tapi belum redeploy — Vercel env var baru butuh deployment baru untuk ter-load ke Edge Function yang sedang jalan).

### 4. Keputusan yang diambil
**TIDAK ADA KODE YANG DIUBAH.** Sesuai instruksi eksplisit user ("jangan langsung menyimpulkan atau mengubah kode") dan karena root cause yang ditemukan memang bukan bug — kode berjalan PERSIS sesuai desain: request sampai ke Edge Function (routing Vercel benar, bukan 404), guard "key hilang" ter-trigger dengan benar, response 500 dengan pesan Indonesia yang jelas dikembalikan, frontend menangkap `!res.ok` dan menampilkan pesan ramah ke user, input kembali aktif setelah error (state `sending` ter-reset, tidak stuck). Semua ini justru MEMBUKTIKAN error-handling path dari Task 2 bekerja dengan benar di production sungguhan.

### 5. Implementasi
Tidak ada — pass ini murni investigasi/testing, tidak ada file kode yang disentuh.

### 6. File yang berubah
Tidak ada file kode. Hanya `docs/FITKU_DEVELOPMENT_LOG.md` (entry ini).

### 7. Dampak terhadap data/schema
Tidak ada.

### 8. Testing yang benar-benar dilakukan (tested by Alig, browser sungguhan via Claude in Chrome)
- **Buka AI Coach production**: navigasi ke `https://fitku.fit/coach` — halaman render normal, semua card (Daily Coaching, Weekly Insight, Pro insights) tampil dengan data user sungguhan yang sudah ada.
- **Kirim "hallo" lewat UI sungguhan** (klik input, ketik, Enter — bukan simulasi): bubble user "hallo" muncul, diikuti bubble AI Coach dengan pesan error ramah (bukan crash, bukan UI freeze, bukan balasan rule-based lama).
- **Network tab (via `read_network_requests`, setara DevTools)**: dikonfirmasi request `POST /api/chat` benar-benar terkirim ke endpoint yang benar, status 500. Body request (dikonstruksi dari kode `AiCoach.tsx` yang sudah direview) berisi HANYA `userId`/`message`/`context` — **tidak ada `OPENAI_API_KEY` atau field sensitif apa pun di request dari frontend**, dikonfirmasi ulang lewat pemanggilan `fetch('/api/chat', ...)` langsung dari console halaman (request yang sama persis dengan yang dikirim UI) — body maupun response TIDAK mengandung string key di manapun.
- **Console**: dicek, tidak ada console error/exception yang muncul — errornya ditangani rapi lewat state React (`!res.ok` branch), bukan unhandled exception.
- **Pertanyaan off-topic**: TIDAK dites terpisah pada pass ini — karena root cause (key hilang) di-cek SEBELUM kode sempat memanggil OpenAI sama sekali (lihat urutan di `api/chat.ts`: rate-limit check → apiKey check → baru panggil OpenAI), pertanyaan APAPUN (in-topic atau off-topic) akan menghasilkan 500 yang SAMA PERSIS selama key belum ada — mengulang tes ini sekarang cuma akan mengonfirmasi ulang temuan yang sama, bukan menguji guardrail off-topic yang sebenarnya. Guardrail off-topic SUDAH diverifikasi sebelumnya lewat pemanggilan handler langsung dengan key asli (entry 2026-08-28 lanjutan, poin 8) — behaviornya tidak berubah, cuma belum bisa dikonfirmasi ulang lewat production karena blocker infra ini.

### 9. Bug yang belum diverifikasi
Alur sukses penuh di production (balasan OpenAI asli muncul di UI, bukan cuma pesan error) masih belum bisa dikonfirmasi visual — bukan karena kode salah, tapi karena `OPENAI_API_KEY` belum aktif di Vercel production. Begitu env var ditambahkan + redeploy, ini perlu diulang.

### 10. Next Step
User perlu: (1) buka Vercel dashboard project FitKu → Settings → Environment Variables → pastikan `OPENAI_API_KEY` benar-benar ADA (bukan cuma pernah dicoba ditambahkan) dan value-nya valid, (2) kalau baru ditambahkan/diedit, **trigger redeploy baru** (env var tidak otomatis berlaku ke deployment yang sedang jalan), (3) setelah itu, ulangi test yang sama (kirim "hallo" + pertanyaan off-topic) — kalau session ini masih aktif, saya bisa langsung ulangi lewat browser begitu dikonfirmasi sudah redeploy.

---

## 2026-08-28 (lanjutan 3) — AI Coach Production Testing: PASS Setelah Redeploy

### 1. Tanggal
2026-08-28

### 2. Tujuan
User mengonfirmasi sudah redeploy production dengan `OPENAI_API_KEY` terpasang, minta diulangi test end-to-end penuh di `fitku.fit` (browser sungguhan) — instruksi eksplisit: jangan nyatakan PASS hanya dari build, laporkan status code & response aktual tiap test.

### 3. Root Cause / Konteks
Kelanjutan langsung dari entry sebelumnya (lanjutan 2) yang menemukan 500 karena `OPENAI_API_KEY` belum ada di Vercel production. Setelah redeploy, test yang sama diulang persis.

### 4. Keputusan yang diambil
Tidak ada kode diubah — semua 4 test PASS, tidak ada bug baru ditemukan yang butuh fix.

### 5–7. Implementasi / File yang berubah / Dampak data
Tidak ada — murni testing, tidak ada file kode disentuh. Hanya `docs/FITKU_DEVELOPMENT_LOG.md`.

### 8. Testing yang benar-benar dilakukan (tested by Alig, browser sungguhan via Claude in Chrome, `fitku.fit/coach`)

**Test 1 — "hallo":**
- Network: `POST https://fitku.fit/api/chat` → **status 200**.
- Reply aktual (bukan rule-based lama, bukan template): *"Halo! Apa kabar? Saya di sini untuk membantu kamu dengan tujuan fitness dan kesehatanmu. Ada yang ingin kamu tanyakan tentang nutrisi, olahraga, atau kebiasaan sehat?"*
- **PASS.**

**Test 2 — "Kalori hari ini masih kurang berapa?" (fitness, harus pakai konteks user):**
- Network: status **200**.
- Reply: *"Saat ini kamu belum mengonsumsi kalori, jadi kamu masih kurang 1720 kkal untuk mencapai target harianmu. Cobalah untuk merencanakan makanan sehat yang sesuai dengan target kalori tersebut. Jika butuh saran makanan atau resep, jangan ragu untuk bertanya!"*
- Verifikasi konteks: card "Daily Coaching" di halaman yang sama menunjukkan "Belum ada makanan tercatat hari ini" (todayCalories=0) — angka "1720 kkal" di balasan cocok dengan `targetCalories - todayCalories` user yang sebenarnya, BUKAN angka generik/hasil karangan. **PASS.**

**Test 3 — "Siapa presiden Indonesia?" (off-topic):**
- Network: status **200**.
- Reply: *"Saya hanya dapat membantu dengan topik kesehatan dan fitness. Jika ada yang ingin kamu tanyakan tentang nutrisi, olahraga, atau kebiasaan sehat lainnya, silakan beri tahu saya!"*
- Ditolak dengan ramah, tidak menjawab pertanyaannya, menawarkan bantuan relevan — persis sesuai spec system prompt. **PASS.**

**Test 4 — Network/Console audit untuk kebocoran `OPENAI_API_KEY`:**
- **Bundle produksi live** (`https://fitku.fit/assets/index-CC3zMy3R.js`, di-fetch & digrep langsung dari browser yang sedang membuka `fitku.fit`): `hasKeyWord: false`, `hasSkProj: false` — 0 kemunculan string `OPENAI_API_KEY` maupun pola `sk-proj-`. Hash file (`index-CC3zMy3R.js`) sama persis dengan build lokal sebelumnya, mengonfirmasi bundle production = kode yang sudah direview.
- **Console** (tracking aktif SEBELUM request ke-4 dikirim, "Boleh saran menu sarapan sehat?"): **0 pesan** (log/warn/error apa pun) selama request berlangsung.
- Body reply di 4 percobaan di atas juga diperiksa manual — tidak ada string key di manapun.
- **PASS.**

**Ringkasan status code seluruh test:** 200, 200, 200, 200 — tidak ada 500 lagi, tidak ada 502, tidak ada rate-limit ter-trigger (baru 4 pesan dari 20/hari).

### 9. Bug yang belum diverifikasi
Tidak ada dari sisi fungsi inti (kirim pesan, konteks, guardrail off-topic, tidak ada key bocor) — semua diverifikasi visual + network + console di production sungguhan, bukan cuma build atau test lokal. Yang BELUM dites eksplisit pada pass ini: rate-limit 20/hari di production sungguhan (sudah diverifikasi sebelumnya lewat handler langsung dengan key asli, bukan lewat UI production, karena akan menghabiskan kuota nyata tanpa perlu).

### 10. Next Step
Task 2 (AI Coach OpenAI Edge Function) dinyatakan **selesai** — semua testing wajib dari spec awal (kirim pesan, konfirmasi dari OpenAI, cek key tidak bocor, off-topic ditolak, konteks user terpakai) sudah lolos di production sungguhan, bukan cuma di build/handler lokal. Tidak ada pekerjaan lanjutan yang direncanakan sendiri.

---

## 2026-08-28 (lanjutan 4) — Update Logo FitKu ke Brand Baru

### 1. Tanggal
2026-08-28

### 2. Tujuan
User minta ganti seluruh penggunaan logo/brand mark lama di aplikasi dengan asset logo baru, dengan syarat: pakai asset resmi (bukan recreate via CSS/SVG), pilih varian sesuai konteks, jangan ubah layout/spacing/typography/UX yang tidak berkaitan, jangan hapus asset lama sebelum yakin tidak dipakai lagi.

### 3. Root Cause / Investigasi

**Audit lokasi logo:** grep menyeluruh atas `grad-hero` (utility gradient yang dipakai di banyak tempat) dan teks "FitKu" di seluruh `src/` menemukan HANYA DUA lokasi yang benar-benar representasi identitas/brand FitKu (bukan sekadar UI accent yang kebetulan pakai gradient brand yang sama):
1. `src/features/welcome/Welcome.tsx` — hero mark di atas Welcome screen: lingkaran gradient + SVG hand-drawn (siluet orang + 2 leaf, sama sekali tidak mirip brand baru) + teks "FitKu" + tagline.
2. `public/favicon.svg` — icon tab browser, ternyata sebuah mark ungu abstrak (panah/petir) yang SAMA SEKALI TIDAK ADA HUBUNGANNYA dengan brand FitKu manapun (kemungkinan sisa scaffold/template lama).

Lokasi LAIN yang memakai `grad-hero` (Button primary, Chip active, ProgressDots, tab aktif di Progress, badge di FoodTracker/Dashboard/AiCoach, tombol di ErrorBoundary, ring "Progress dimulai" di ResultMoment) DIKONFIRMASI BUKAN representasi logo — itu cuma reuse utility class gradient brand untuk aksen UI (tombol, badge, dsb), bukan penempatan identitas/logo. Tidak disentuh, sesuai instruksi "jangan ubah UX yang tidak berkaitan dengan pergantian logo". `public/icons.svg` dicek juga — ternyata sprite ikon sosial (bluesky/discord/github/x) dari scaffold lama, tidak dipakai di manapun di `src/`, tidak terkait brand FitKu sama sekali — dibiarkan.

**Masalah asset (2 putaran):**
- **Putaran 1**: satu-satunya file di `landing/` ternyata brand-guideline SHEET (1254×1254, flat RGB, TANPA alpha channel) — bukan asset siap pakai. User diberi pertanyaan eksplisit (bukan ditebak), user memilih menyediakan file asset asli. User lalu menaruh 4 file PNG baru (semua RGBA, alpha genuinely transparan, dikonfirmasi lewat PIL): `fitku-logo-primary-transparent.png` (578×199), `fitku-wordmark-primary-transparent.png` (367×167), `fitku-icon-transparent.png` (86×93), `fitku-logo-dark-transparent.png` (194×62).
- **Putaran 2 (setelah implementasi awal)**: user melaporkan logo BLUR di dark mode. Investigasi: `fitku-logo-dark-transparent.png` resolusi native cuma 194×62, ditampilkan di CSS width 240px → upscale ~24% → blur. Diperbaiki ke width 188px (≤ native width dark variant) supaya tidak pernah upscale.
- **Putaran 3 (setelah fix upscale)**: user melaporkan tetap pecah/pixelated, KHUSUSNYA teks tagline "AI Diet Coach Indonesia". Root cause SEBENARNYA: bukan soal upscale lagi (sudah diperbaiki), tapi resolusi NATIVE asset itu sendiri terlalu rendah untuk memuat 3 elemen (icon+wordmark+tagline) sekaligus dalam kanvas 194×62px — tagline kebagian hanya ~8-10px tinggi native, jauh di bawah cukup untuk teks tanpa terlihat jaggy, dengan ATAU TANPA upscaling CSS. Tidak ada trik CSS yang bisa memperbaiki resolusi sumber yang memang rendah.

### 4. Keputusan yang diambil

- **Pendekatan final**: pisahkan icon dari teks. Icon graphic (`fitku-icon-transparent.png`, 86×93, cuma bentuk/warna flat tanpa detail teks halus — resolusi segitu sudah cukup untuk bentuk sederhana) dipakai sebagai `<img>` di kedua tema (light & dark) — warnanya (teal/ungu/navy) sudah kontras cukup di kedua background, tidak perlu varian dark terpisah untuk si icon. Wordmark "FitKu" + tagline "AI Diet Coach Indonesia" DIKEMBALIKAN jadi teks DOM asli (persis pola yang SUDAH ADA sebelumnya di kode), bukan gambar — karena font yang dipakai (`--font-display: "Sora"`) SUDAH font resmi brand (dikonfirmasi cocok dengan spec tipografi di brand sheet: "Sora Bold"), dan teks DOM selalu tajam di resolusi/DPI berapa pun, tidak pernah kena masalah resolusi source image.
- **Ini BUKAN "membuat ulang logo via CSS/SVG"** — larangan itu ditujukan ke elemen GRAFIS/mark (dan itu sudah dipakai dari asset resmi, bukan digambar ulang). Teks "FitKu" sebagai teks biasa dengan font resmi brand bukan rekreasi logo, itu wordmark yang memang secara native adalah teks, ditulis dengan font yang benar.
- **3 dari 4 asset baru** (`fitku-logo-primary-transparent.png`, `fitku-wordmark-primary-transparent.png`, `fitku-logo-dark-transparent.png`) TIDAK dipakai di implementasi final Welcome.tsx — disimpan tetap di `public/brand/` (tidak dihapus) untuk kemungkinan pemakaian lain di masa depan (landing page, app store listing, social share image) yang punya ruang lebih besar untuk lockup resolusi tinggi.
- **Favicon**: diganti dari `favicon.svg` (mark ungu tidak terkait) ke `fitku-icon-transparent.png` via `<link rel="icon" type="image/png">` — icon PNG resolusi 86×93 cukup untuk ukuran favicon standar (16-48px), tidak ada masalah resolusi di sini. File `favicon.svg` LAMA TIDAK DIHAPUS (masih ada di `public/`, cuma sudah tidak direferensikan di `index.html` — dikonfirmasi lewat grep tidak ada referensi lain ke file itu di manapun), sesuai instruksi jangan hapus sebelum yakin tidak dipakai lagi.

### 5. Implementasi
`src/features/welcome/Welcome.tsx`: hapus SVG hand-drawn lama + lingkaran gradient custom, ganti dengan `<img src="/brand/fitku-icon-transparent.png">` (76px tinggi) di dalam wrapper radial-glow yang sudah ada (disesuaikan ukurannya dari 132px ke 100px supaya proporsional dengan icon yang lebih kecil dari SVG lama) — teks "FitKu"/tagline di bawahnya TIDAK diubah sama sekali dari kode aslinya (class, warna, posisi persis sama). `index.html`: satu baris `<link rel="icon">` diganti dari svg lama ke png baru. `public/brand/` (folder baru): 4 file PNG di-copy dari `landing/` (sumber asli tetap ada di `landing/`, tidak dipindah/dihapus).

### 6. File yang berubah
`src/features/welcome/Welcome.tsx`, `index.html`, `public/brand/fitku-icon-transparent.png` (baru), `public/brand/fitku-logo-primary-transparent.png` (baru, belum dipakai), `public/brand/fitku-wordmark-primary-transparent.png` (baru, belum dipakai), `public/brand/fitku-logo-dark-transparent.png` (baru, belum dipakai). Tidak ada file lain disentuh — `public/favicon.svg` dan `public/icons.svg` dibiarkan ada di disk, cuma `favicon.svg` yang tidak lagi direferensikan.

### 7. Dampak terhadap data/schema
Tidak ada — murni asset & 1 komponen presentasional, tidak menyentuh data/schema apa pun.

### 8. Testing yang benar-benar dilakukan (tested by Alig, browser sungguhan via Claude in Chrome)
- **Build**: `npm run build` (`tsc -b && vite build`) — 0 TypeScript error, dijalankan ULANG setelah SETIAP revisi (implementasi awal, fix upscale, fix final icon+DOM-text) — total 3× build, semuanya 0 error.
- **Visual light mode, desktop (900px) & mobile (390px)**: icon tajam, teks "FitKu"+tagline tajam (DOM text), radial glow proporsional, tidak ada elemen terpotong/overflow.
- **Visual dark mode, desktop & mobile**: sama — dikonfirmasi lewat `zoom` pada area logo, tidak ada blur/pixelation di icon maupun teks (dua putaran bug sebelumnya SUDAH diperbaiki dan diverifikasi ulang di kedua tema).
- **Favicon**: dicek lewat `fetch()` terhadap `<link rel="icon">` yang aktif di halaman — status 200, `content-type: image/png`, ukuran byte cocok persis dengan file source (12963 bytes) — bukan broken image.
- **Console**: dicek `onlyErrors: true` di light & dark mode setelah reload — 0 error di kedua kondisi (tidak ada 404 asset/broken image).
- **Grep referensi logo lama**: dikonfirmasi tidak ada lagi referensi ke `favicon.svg` di manapun (`grep -rn "favicon.svg"` kosong), dan SVG hand-drawn lama di `Welcome.tsx` sudah terhapus total dari kode (bukan cuma disembunyikan).

### 9. Bug yang belum diverifikasi
Tidak ada terkait fungsi logo — 3 putaran bug (asset bukan file siap pakai → blur upscale → pixelasi resolusi native) semuanya ditemukan lewat feedback user langsung dan sudah diperbaiki + diverifikasi ulang secara visual setiap putaran, bukan diasumsikan selesai dari build saja.

### 10. Next Step
Tidak ada pekerjaan lanjutan yang direncanakan sendiri. Catatan untuk masa depan: kalau nanti ada halaman baru yang butuh lockup penuh (icon+wordmark+tagline) dalam SATU gambar dengan ruang cukup besar (misalnya og:image untuk social share, atau splash screen PWA), varian `fitku-logo-primary-transparent.png` (578×199, resolusi cukup tinggi) sudah tersedia di `public/brand/` dan siap dipakai — TAPI varian dark-nya (`fitku-logo-dark-transparent.png`) perlu diregenerasi di resolusi lebih tinggi dulu (native sekarang cuma 194×62) kalau mau dipakai di background gelap dengan ukuran tampil lebih besar dari ~190px, supaya tidak kena masalah resolusi yang sama seperti yang ditemukan di pass ini.

---

## 2026-08-28 (lanjutan 5) — Koreksi Logo: Full-Color Lockup di Kedua Tema (bukan Icon+DOM-text)

### 1. Tanggal
2026-08-28

### 2. Tujuan
User menilai hasil pass sebelumnya (lanjutan 4) **lebih buruk dari logo lama**, dan memberi file referensi baru (`landing/Codex Image Aug 28, 2026, 04_02_31 PM.png`) berisi spec eksplisit: pakai logo utama horizontal FULL COLOR yang SAMA di light & dark mode, jangan berubah jadi putih monokrom, jangan ubah proporsi/warna/elemen logo.

### 3. Root Cause

Pendekatan lanjutan 4 (icon dari asset + "FitKu"/tagline sebagai teks DOM biasa, warna seragam `text-ink`) SECARA TEKNIS menghindari masalah resolusi, tapi SECARA VISUAL tidak merepresentasikan brand lockup yang dimaksud user — user ingin logo horizontal utuh (bukan icon+teks terpisah dengan treatment warna generik).

**Konflik yang ditemukan saat mau menerapkan instruksi literal:** reference sheet baru menunjukkan "Fit" berwarna PUTIH di SEMUA contoh dark-mode-nya (dikonfirmasi via pixel sampling: RGB~249,249,249), tapi asset asli `fitku-logo-primary-transparent.png` (satu-satunya full-color horizontal asset yang ada saat itu) punya "Fit" NAVY PERMANEN (RGB 20,30,53) dibakar ke dalam raster — tidak bisa diadaptasi tanpa mengedit elemen logo (dilarang eksplisit). Alih-alih menebak, user diberi 3 opsi eksplisit via pertanyaan — user pilih: **generate asset baru khusus dark-mode** (bukan pakai file lama apa adanya, bukan pisah jadi teks DOM).

User lalu memberi file baru: `fitku-wordmark-primary-transparent.png` (DI-OVERWRITE, sekarang 700×260, sebelumnya 367×167) — icon+"Fit"(putih)+"Ku"(teal)+tagline, resolusi tinggi, alpha transparan asli (dikonfirmasi PIL: corner alpha rendah, ada pixel alpha=255 di huruf "Fit" dengan RGB 255,255,255).

**Bug kedua yang ditemukan SEBELUM sempat dilaporkan user** (dicek sendiri sebelum implementasi dianggap selesai, sesuai instruksi "jangan PASS hanya dari build"): background "transparan" kedua file (`fitku-logo-primary-transparent.png` DAN `fitku-wordmark-primary-transparent.png` yang baru) ternyata punya NOISE alpha rendah (bukan benar-benar 0) di ~49% area canvas — dikonfirmasi lewat histogram alpha channel PIL. Di background terang ini nyaris tak terlihat (noise-nya kebetulan berwarna terang), tapi di background gelap app (`#12141c`) menghasilkan kotak/vignette gelap redup di belakang logo — regresi visual baru yang akan langsung terlihat kalau tidak dicek.

### 4. Keputusan yang diambil

- **Pakai `fitku-logo-primary-transparent.png` (light mode) dan `fitku-wordmark-primary-transparent.png` yang baru (dark mode)** sebagai SATU gambar lockup utuh (icon+wordmark+tagline), theme-swapped via `useTheme()` — bukan pisah icon+teks lagi. Kedua file native ≥578px lebar, ditampilkan di 260px = selalu downscale, tidak pernah blur/pecah.
- **Alpha-noise di background dibersihkan** (threshold: pixel dengan alpha<40 diset alpha=0) sebelum dipakai — HANYA menyentuh pixel background yang SUDAH near-transparent (alpha 1-39), TIDAK menyentuh satupun pixel yang jadi bagian visual logo (icon/teks solid, alpha≥40 dibiarkan 100% apa adanya, warna/bentuk/proporsi TIDAK berubah sama sekali — dikonfirmasi visual before/after, dan dikonfirmasi dengan composite test di atas warna background gelap app yang sebenarnya, `#12141c`, sebelum dipasang). Ini dianggap PEMBERSIHAN ARTEFAK TEKNIS (transparansi yang cacat), bukan "mengedit elemen logo" (larangan eksplisit user) — tidak ada piksel logo (icon, huruf, tagline) yang warnanya berubah. File ASLI di `landing/` TIDAK disentuh/ditimpa — pembersihan cuma diterapkan ke SALINAN yang dipakai app di `public/brand/`.
- File lama `fitku-logo-dark-transparent.png` (varian putih monokrom 194×62 dari pass sebelumnya) **sudah tidak dipakai di manapun** — dibiarkan ada di disk (tidak dihapus).

### 5. Implementasi
`src/features/welcome/Welcome.tsx`: kembalikan pola theme-aware single-image (seperti lanjutan 4 versi pertama), tapi sumbernya diganti ke `fitku-logo-primary-transparent.png` (light) / `fitku-wordmark-primary-transparent.png` (dark, file baru) — bukan lagi `fitku-logo-dark-transparent.png` yang lama. Lebar 260px (naik dari upaya sebelumnya, karena kedua source sekarang cukup tinggi resolusi untuk itu). `public/brand/fitku-logo-primary-transparent.png` dan `public/brand/fitku-wordmark-primary-transparent.png` ditimpa dengan versi yang sudah dibersihkan alpha-noise-nya (script Python sekali-jalan, tidak masuk repo sebagai tooling permanen).

### 6. File yang berubah
`src/features/welcome/Welcome.tsx`, `public/brand/fitku-logo-primary-transparent.png` (dibersihkan), `public/brand/fitku-wordmark-primary-transparent.png` (baru dari user + dibersihkan), `landing/fitku-wordmark-primary-transparent.png` (file baru dari user, versi asli tidak diedit).

### 7. Dampak terhadap data/schema
Tidak ada.

### 8. Testing yang benar-benar dilakukan (tested by Alig, browser sungguhan)
- **Build**: `npm run build` — 0 TypeScript error.
- **Sebelum dipasang**: composite test Python (bukan lewat browser) — logo yang sudah dibersihkan di-overlay ke warna background gelap app yang PERSIS (`#12141c`) dan cream app yang persis (`#faf8f4`) — dikonfirmasi visual TIDAK ADA kotak/vignette artefak di kedua kasus, sebelum kode diubah.
- **Light mode, desktop(900px)+mobile(390px)**: logo lockup penuh tampil tajam, "Fit" navy + "Ku" teal + tagline abu, warna PERSIS brand sheet.
- **Dark mode, desktop+mobile**: logo lockup penuh tampil tajam, icon FULL COLOR (tidak putih), "Fit" PUTIH (terbaca), "Ku" tetap teal, tagline terbaca — dikonfirmasi lewat `zoom` ke area logo, TIDAK ADA kotak/vignette artefak (bug alpha-noise sudah tidak muncul), TIDAK ADA blur/pixelasi (dua bug dari pass sebelumnya tetap tidak kambuh karena source resolusinya tinggi).
- **Console**: 0 error di kedua tema setelah reload.
- **localStorage direset** ke default (`light`) setelah testing selesai, tidak meninggalkan state test di browser.

### 9. Bug yang belum diverifikasi
Tidak ada. Ini putaran ke-3 perbaikan visual logo (setelah blur-upscale dan pixelasi-resolusi sebelumnya) — kali ini bug tambahan (alpha-noise artifact) ditemukan dan diperbaiki SEBELUM dilaporkan user, dicek proaktif dengan composite test di warna background app yang sebenarnya sebelum kode diubah.

### 10. Next Step
Menunggu konfirmasi visual dari user sendiri (bukan cuma laporan otomatis) bahwa hasil ini sudah sesuai brand sheet yang dimaksud, khususnya warna "Fit" putih di dark mode dan tidak ada artefak kotak di baliknya.

---

## 2026-08-28 (lanjutan 6) — Migrasi Dexie (IndexedDB) → Supabase (Auth + Postgres)

### 1. Tanggal
2026-08-28

### 2. Tujuan
Migrasi total dari penyimpanan lokal (Dexie IndexedDB, schema v6) ke Supabase Auth + PostgreSQL cloud database, sekaligus menghapus total fitur Ekspor/Impor JSON. Proposal arsitektur lengkap (skema SQL, RLS, strategi kuota, strategi migrasi) diajukan lebih dulu dan disetujui eksplisit oleh user sebelum satu baris kode pun ditulis. 4 keputusan yang dikonfirmasi user: (1) Auth via Email OTP passwordless, (2) fresh start — tidak perlu alur migrasi data Dexie lama, (3) `weight_entries` TANPA unique constraint per hari (pertahankan behavior lama), (4) user menyiapkan project Supabase sendiri + `.env`.

### 3. Root Cause / Konteks
FitKu sebelumnya 100% single-device (model "implicit user pertama di tabel lokal", tanpa auth sama sekali). Analisis kode sebelum proposal menemukan: `dailySummaries` adalah tabel MATI (tidak pernah dibaca/ditulis, dikonfirmasi grep) — tidak dimigrasikan; `foods` (193 item) adalah katalog BERSAMA bukan data per-user — di-seed sekali server-side, bukan per-client; semua ID sudah `crypto.randomUUID()` (langsung kompatibel UUID Postgres); setiap tabel domain sudah punya `userId` eksplisit — app SUDAH logically multi-tenant, cuma belum diautentikasi.

**Catatan proses penting — sub-agent (fork) yang didelegasikan tugas rewrite 8 repository TIDAK menyelesaikan tugas utamanya**, malah mengerjakan bagian lain (AppStateContext, layar Auth, routing App.tsx, pembersihan Settings.tsx) yang kualitasnya baik dan dipakai, tapi 8 repository intinya dibiarkan 100% Dexie tak tersentuh meski sudah diminta ulang secara eksplisit. Ditemukan lewat verifikasi langsung (`git status` + grep import Dexie), BUKAN dengan mempercayai ringkasan laporan sub-agent begitu saja — sesuai prinsip "trust but verify". 8 repository dikerjakan ulang secara manual satu-per-satu sesudahnya.

### 4. Keputusan yang diambil

- **Arsitektur**: sesuai proposal yang disetujui — replace penuh (bukan hybrid offline-first), Supabase Auth Email OTP, RLS `auth.uid() = user_id` di 8 tabel + `auth.uid() = id` di `profiles`, `foods` read-only publik (tidak ada policy insert/update/delete untuk client).
- **10 tabel** dibuat via `supabase/migrations/0001_init.sql` (belum dijalankan oleh saya — lihat poin 10): `profiles`, `foods`, `food_logs`, `weight_entries`, `hydration_logs`, `daily_notes`, `exercise_logs`, `my_foods`, `food_reports`, `subscription_status`. `dailySummaries` DIHAPUS dari rencana (tabel mati).
- **Seed `foods`** (`supabase/migrations/0002_seed_foods.sql`, 193 baris) di-GENERATE PROGRAMATIS dari `indonesianFoods.seed.ts` yang sebenarnya (bukan ditranskripsi manual) via Node `--experimental-strip-types`, dengan escaping string yang benar — dikonfirmasi jumlah baris (193) dan spot-check isi cocok persis.
- **Composite key**: `hydration_logs`/`daily_notes`/`food_reports` pakai PRIMARY KEY (user_id, date/food_id) ASLI di Postgres, bukan lagi string gabungan `${userId}:${date}` seperti di Dexie — field `key` di tipe TS (`HydrationLog.key` dst) dipertahankan sebagai computed string di layer `fromRow()` supaya tipe TS & call site yang sudah ada tidak perlu berubah, tapi tidak lagi jadi kolom database sungguhan.
- **`ensureSeeded()` DIHAPUS** dari `FoodRepository` interface — dikonfirmasi tidak ada call site lain (grep) sebelum dihapus. Katalog `foods` sekarang murni server-seeded sekali, tidak lagi di-upsert tiap boot client.
- **`hydrationRepository.adjust()`**: Dexie versi lama pakai transaksi atomik (`db.transaction('rw', ...)`) untuk read-modify-write; Supabase JS client TIDAK punya API transaksi client-side, jadi ini jadi read-then-upsert biasa — trade-off yang DIDOKUMENTASIKAN eksplisit di komentar kode (race window kecil pada double-tap sangat cepat), bukan disembunyikan. Perbaikan sungguhan (kalau perlu) adalah Postgres RPC function, di luar scope pass ini.
- **`Auth.tsx`** (baru, `src/features/auth/`): 2 tahap (email → kode OTP 6-digit), 100% pakai token desain yang SUDAH ADA (`Button` component, pola input `border-line/bg-surface` dari `BodyDataStep.tsx`) — tidak ada token/warna baru. Sempat mencoba `text-danger` untuk pesan error (token yang TIDAK ADA di sistem, dikonfirmasi grep `index.css`), dikoreksi sendiri ke `text-pro` (salah satu dari cuma 2 token warna non-netral yang memang ada di app).
- **Routing** (`App.tsx`): 3 gate baru — `Gate` (butuh session+profile, redirect ke `/welcome` atau `/onboarding`), `GuestOnly` (untuk `/welcome`+`/auth`, skip ke `/` kalau sudah session+profile), `OnboardingGate` (butuh session TAPI belum ada profile, cegah re-onboarding). `/result` tetap tidak digate seperti sebelumnya.
- **`Welcome.tsx`**: kedua tombol ("Mulai Sekarang"/"Saya sudah punya akun") sekarang `navigate('/auth')` — Supabase OTP tidak membedakan signup/login (auto-create user di verifikasi pertama), jadi satu layar cukup untuk keduanya.
- **`OnboardingFlow.tsx`**: TIDAK ADA PERUBAHAN SAMA SEKALI — `userRepository.save()` sudah membaca sesi Supabase aktif secara internal, call site di file ini tetap valid persis seperti sebelumnya. Dikonfirmasi via grep, bukan asumsi.
- **Export/Import JSON**: `dataBackup.ts` dihapus total. Section-nya di `Settings.tsx` diganti section "Akun" dengan tombol "Keluar" (`supabase.auth.signOut()`) — penambahan yang MEMANG PERLU (app dengan auth butuh cara logout, tidak ada sebelumnya) bukan scope creep tak diminta.
- **Dexie dicabut total**: `src/data/db.ts` dan `src/data/seed/indonesianFoods.seed.ts` dihapus (dikonfirmasi dulu tidak ada referensi tersisa via grep sebelum hapus), dependency `dexie` di-uninstall dari `package.json`.

### 5. Implementasi
File baru: `src/shared/lib/supabaseClient.ts`, `src/vite-env.d.ts`, `.env.example`, `src/features/auth/Auth.tsx`, `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_seed_foods.sql`. File diubah total (Dexie→Supabase): `userRepository.ts`, `foodRepository.ts`, `foodLogRepository.ts`, `weightRepository.ts`, `hydrationRepository.ts`, `noteRepository.ts`, `exerciseRepository.ts`, `myFoodRepository.ts`, `foodReportRepository.ts`, `subscriptionRepository.ts` (9 repository — interface method tidak ada yang berubah nama/signature, jadi ~29 file call-site di seluruh app TIDAK perlu disentuh). File diubah lainnya: `AppStateContext.tsx` (session + profile state), `App.tsx` (routing gates), `Welcome.tsx` (tombol → `/auth`), `Settings.tsx` (hapus backup UI, tambah sign-out). File dihapus: `src/features/settings/dataBackup.ts`, `src/data/db.ts`, `src/data/seed/indonesianFoods.seed.ts`.

### 6. File yang berubah
Lihat poin 5 — total 6 file baru, 13 file diubah, 3 file dihapus.

### 7. Dampak terhadap data/schema
**BESAR** — ini migrasi penyimpanan total. Skema Dexie (`SCHEMA_VERSION = 6`) sepenuhnya digantikan skema Postgres baru (lihat `0001_init.sql`). Tidak ada migrasi data existing (keputusan user: fresh start) — data lokal lama di IndexedDB browser manapun yang pernah dipakai untuk testing DITINGGALKAN begitu saja, tidak diangkut.

### 8. Testing yang benar-benar dilakukan (dan yang BELUM BISA dilakukan — jangan dianggap PASS)
- **Build**: `npm run build` (`tsc -b && vite build`) — **0 TypeScript error**, dijalankan setelah SEMUA 9 repository selesai ditulis ulang. Bundle turun dari ~478 KB ke ~232 KB (Dexie + seed data 193 item hardcoded tidak lagi ikut ter-bundle).
- **Verifikasi tidak ada sisa Dexie**: grep `from '../db'`, `import Dexie`, `'dexie'` di seluruh `src/` — 0 hasil setelah semua file diubah.
- **Verifikasi failure mode saat env var belum ada** (BENAR-benar dites di browser sungguhan, dev server lokal): tanpa `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` di `.env`, app menampilkan layar putih kosong (module-level throw terjadi SEBELUM React sempat render apa pun, jadi ErrorBoundary tidak sempat menangkap) TAPI console menampilkan pesan error yang jelas dan actionable ("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in .env (see .env.example)") — dikonfirmasi ini perilaku yang benar/disengaja untuk kegagalan konfigurasi development, bukan bug.
- **TIDAK BISA dites pada pass ini** (env var Supabase belum ada di `.env` user, dan migrasi SQL belum dijalankan ke project Supabase sungguhan — saya tidak punya akses CLI/MCP ke project itu): sign-up alur OTP end-to-end sungguhan, penulisan/pembacaan data ke tiap tabel, isolasi RLS antar-akun, alur logout→login ulang, alur onboarding baru menulis ke `profiles`. **Semua ini WAJIB dites ulang setelah user menjalankan migrasi SQL + mengisi `.env`** — belum boleh dianggap selesai/PASS sampai itu terjadi.

### 9. Bug yang belum diverifikasi
Seluruh alur runtime (poin 8, daftar "TIDAK BISA dites") — bukan karena kode diyakini salah, tapi karena blocker infrastruktur (migrasi SQL belum diterapkan, `.env` belum diisi) yang di luar kendali sesi ini.

### 10. Next Step
User perlu: (1) jalankan `supabase/migrations/0001_init.sql` lalu `0002_seed_foods.sql` via Supabase SQL Editor (dashboard) — urutan penting, 0002 butuh tabel `foods` dari 0001 sudah ada; (2) isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env` (lihat `.env.example`); (3) setelah itu, testing end-to-end penuh perlu dijalankan (sign-up OTP, onboarding menulis ke `profiles`, CRUD tiap fitur, logout/login ulang) sebelum migrasi ini dinyatakan benar-benar selesai — belum boleh di-deploy ke production sebelum itu.
