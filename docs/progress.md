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
