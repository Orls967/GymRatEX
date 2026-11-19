# Catatan progres OtotLapis

Format: fase, status, catatan singkat. Data yang belum dicek silang ditandai `needsVerification: true` di `src/content`.

## Fase 1 — Scaffold ✅

- Vite + React 19 + TypeScript strict, Tailwind v4 dengan design tokens (CSS variables) untuk tema terang & gelap.
- Tema: Terang / Gelap / Ikuti sistem. Diterapkan oleh skrip inline di `index.html` sebelum render pertama (tanpa kedip), disimpan di `localStorage` (dibungkus try/catch).
- Bahasa: ID (default) / EN via i18next + react-i18next. `en.ts` diketik dengan bentuk `id.ts` sehingga kunci yang hilang gagal saat `tsc`; unit test memastikan kunci, nilai kosong, dan placeholder sama.
- Konten ilmiah dwibahasa `{ id, en }` divalidasi Zod saat modul dimuat (build & test gagal bila kosong).
- HashRouter + lazy-load per halaman, ErrorBoundary per rute, pencarian global Ctrl/⌘+K (dwibahasa).
- Workflow GitHub Actions: lint → unit test → build → Playwright smoke → deploy Pages (hanya push ke `main`).
- Playwright smoke: ganti bahasa, ganti tema, tema sistem, semua rute, pencarian.

## Fase 2 — BodyModel prosedural + Peta Otot ✅

- `src/lib/rig.ts`: rig tulang forward-kinematics (panggul → lumbal → toraks → leher/kepala, bahu–lengan, tungkai), sudut relatif, teruji.
- `src/lib/ik.ts`: IK dua-tulang analitik bidang sagital (dipakai tungkai & lengan).
- `src/scene/body/`: abstraksi `BodyModel` (kontrak `BodyModelProps`), implementasi `ProceduralBody` (otot = elipsoid di antara jangkar tulang, mengikuti skeleton tiap frame), jalur `GltfBody` + `gltfMapping.ts` (Draco lokal) untuk aset anatomi nanti.
- Peta Otot: klik/ketuk otot, hover highlight, depan/belakang, lapisan superfisial → dalam, kamera mulus ke otot (snap bila reduced-motion), daftar otot per regio yang bisa dinavigasi keyboard, latihan terkait per peran.
- Scene ikut tema (warna dari CSS variables, preset cahaya per tema), DPR dibatasi & AO/SMAA dimatikan di HP, fallback bila WebGL tidak ada.
- Catatan: model adalah stilisasi; bentuk & perlekatan disederhanakan (lihat Tentang → Batasan).

## Fase 3 — Data latihan + Pustaka Latihan ✅

- 33 latihan dwibahasa (otot utama/sinergis/stabilisator, alat, pola gerak, isyarat teknik, kesalahan umum), divalidasi Zod + uji referensial.
- Pilih latihan → otot menyala dengan skala sekuensial (stabilisator → sinergis → utama), otot lain diredupkan; sisi kamera otomatis mengikuti otot utama.
- Filter per otot & alat tersimpan di URL (`#/latihan?otot=…&alat=…`), tautan kontekstual ke Peta Otot, Studio Form, Cek Form Webcam, dan Benar vs Salah.

## Fase 4 — Manekin, IK, Studio Form + grafik biomekanika ✅

- `src/lib/movements.ts`: generator gerakan prosedural (back squat, deadlift/hinge, lunge, overhead press, + bench untuk peragaan) memakai IK dua-tulang & keseimbangan barbel di atas tengah telapak; parameter kedalaman, sudut torso, lebar kaki/langkah, beban, tempo.
- `src/lib/biomech.ts`: model statis bidang sagital — momen = berat × lengan momen horizontal, massa segmen Winter; lunge memakai metode gaya reaksi lantai (porsi kaki depan 80%, diasumsikan). Teruji: momen naik dengan kedalaman, torso condong menggeser momen ke pinggul, punggung membulat menaikkan momen lumbal.
- Studio Form: animasi tempo (eksentrik 55%), jeda + slider fase (otomatis berhenti bila reduced-motion), grafik momen vs fase (satu sumbu, legenda + label langsung, crosshair & tooltip, palet kategorikal tervalidasi CVD untuk kedua tema), tabel nilai, sudut sendi, peringatan batas mobilitas.
- Preset per latihan (front squat, RDL, sumo, good morning, Bulgarian split squat).

## Fase 5 — Benar vs Salah ✅

- Empat kesalahan: knee valgus (tampak depan), butt wink & punggung membulat (tampak samping), elbow flare (bench, tampak atas).
- Satu kanvas, dua manekin beranimasi sinkron dari generator gerakan yang sama; versi salah memakai parameter `Faults` (valgus, posterior tilt, fleksi lumbal/torakal, abduksi bahu).
- Zona rawan berdenyut (statis bila reduced-motion), daftar perbaikan, latihan terkait, dan perbandingan momen lumbal (estimasi) untuk kesalahan yang menyangkut punggung bawah.
- Kesalahan yang belum dicek silang ditandai “perlu verifikasi”.

## Fase 6 — Cek Form Webcam ✅

- MediaPipe PoseLandmarker (lite, float16) + WASM di-host lokal (`public/mediapipe/`, WASM disalin saat `npm install`), dimuat malas hanya saat kamera dinyalakan; GPU dengan fallback CPU.
- `src/lib/pose2d.ts` (sudut 2D, sisi paling terlihat, EMA), `src/lib/repCounter.ts` (histeresis), `src/lib/formFeedback.ts` (aturan squat/curl/OHP) — semuanya teruji.
- **Privasi:** MediaPipe ternyata mengirim ping telemetri ke `odml.pa.googleapis.com` dan tidak punya opsi untuk mematikannya. Ditambahkan Content-Security-Policy (`connect-src 'self'`) di `index.html` sehingga browser memblokir semua koneksi keluar. Smoke test Playwright (kamera palsu) memverifikasi model termuat dan tidak ada permintaan ke host luar.

## Fase 7 — Glosarium, pencarian, Tentang, polish, test, README ✅

- Glosarium 34 istilah dwibahasa: saring, tautan langsung `#/glosarium/:id`, “lihat juga”; auto-link istilah (kemunculan pertama, batas kata Unicode) di detail otot, latihan, kesalahan form, dan Tentang.
- Pencarian Ctrl/⌘+K mencari otot, latihan, istilah, dan halaman dalam bahasa aktif sekaligus nama bahasa lain & Latin.
- Tentang: disclaimer, prinsip, batasan model, sumber, lisensi aset, daftar entri “perlu verifikasi”.
- Offline: service worker pra-cache aset build (perbaikan: `ignoreVary` agar cache cocok untuk request modul).
- Kontras token dicek (teks utama/muted/aksen/semantik ≥ 4,5:1 di kedua tema). Lint bersih, Prettier diterapkan.
- Tes: 48 unit test (Vitest), 16 smoke test Playwright (bahasa, tema, rute, pencarian, Peta Otot, Pustaka, Studio, Benar vs Salah, webcam dengan kamera palsu + cek tanpa permintaan keluar, glosarium, Tentang, offline).

## Catatan & langkah berikutnya

- Aktifkan GitHub Pages: Settings → Pages → Source: **GitHub Actions**. Deploy berjalan saat push ke `main`.
- Model tubuh masih stilisasi elipsoid; jalur glTF siap (lihat README).
- Kandidat berikutnya: verifikasi entri bertanda, lebih banyak pola gerak di Studio (bench, row), umpan balik webcam tampak depan/samping otomatis.
