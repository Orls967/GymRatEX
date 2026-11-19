# OtotLapis

**Anatomi otot 3D & biomekanika gerakan gym — alat edukasi berbahasa Indonesia (dan Inggris).**
100% di sisi klien: tanpa backend, tanpa akun, tanpa pelacakan, bisa dipakai offline setelah dimuat.

> _English summary:_ OtotLapis is a client-side 3D educational web app about muscle anatomy and the
> biomechanics of gym movements. Indonesian by default, with a full English toggle. No backend, no
> accounts, no tracking; works offline after the first load.

> ⚠️ Alat edukasi — bukan pengganti pelatih bersertifikat, dokter, atau fisioterapis.

## Modul

| #   | Modul               | Isi                                                                                                                                                                                         |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | **Peta Otot**       | Tubuh 3D prosedural, 34 otot bisa diklik (nama ID/EN + Latin, origo, insersio, fungsi, latihan terkait). Lapisan superfisial → dalam, depan/belakang, kamera mulus ke otot terpilih.        |
| 02  | **Pustaka Latihan** | 33 latihan. Otot utama/sinergis/stabilisator menyala dengan skala intensitas sekuensial. Filter per otot & alat.                                                                            |
| 03  | **Studio Form**     | Manekin prosedural (tulang + IK dua-tulang, tanpa file animasi). Slider kedalaman, sudut torso, lebar kaki, beban, berat badan, tempo. Grafik momen lutut/pinggul/punggung bawah real-time. |
| 04  | **Benar vs Salah**  | Dua manekin berdampingan: knee valgus, butt wink, punggung membulat, elbow flare, dengan zona rawan.                                                                                        |
| 05  | **Cek Form Webcam** | MediaPipe PoseLandmarker di browser: sudut sendi, hitung repetisi, umpan balik. Video tidak pernah dikirim ke mana pun.                                                                     |
| 06  | **Glosarium**       | Istilah gym & anatomi, ditautkan otomatis di seluruh konten (ID & EN).                                                                                                                      |
| 07  | **Tentang**         | Sumber, lisensi aset, batasan model, disclaimer, daftar data “perlu verifikasi”.                                                                                                            |

Navigasi kontekstual: otot → latihan → Studio Form → webcam, plus pencarian global **Ctrl/⌘ + K** (dwibahasa).

## Menjalankan

```bash
npm install        # juga menyalin WASM MediaPipe & decoder Draco ke public/ (scripts/copy-assets.mjs)
npm run dev        # http://localhost:5173/GymRat/
npm test           # unit test (Vitest) untuk src/lib, konten, i18n
npm run e2e        # smoke test Playwright (build + preview otomatis)
npm run lint
npm run build      # hasil di dist/
```

Node 20+. Bila Chromium sudah terpasang di mesin, `PW_CHROMIUM_PATH=/path/ke/chrome npm run e2e` melewati `playwright install`.

## Tech stack

Vite + React 19 + TypeScript (strict, tanpa `any`) · three.js via @react-three/fiber, drei, postprocessing ·
Tailwind CSS v4 (design tokens di CSS variables) · Zustand · React Router (HashRouter) · Zod ·
i18next + react-i18next · @mediapipe/tasks-vision · lucide-react · @fontsource (Barlow Condensed, Archivo, IBM Plex Mono) ·
Vitest · Playwright · ESLint + Prettier.

## Struktur

```
src/content   data otot, latihan, glosarium, kesalahan form, Tentang — dwibahasa {id, en}, divalidasi Zod
src/lib       logika murni & teruji: rig (FK), IK, gerakan, biomekanika, sudut sendi, pose 2D, hitung repetisi, pencarian, auto-link
src/scene     komponen R3F: Stage, CameraRig, BodyModel (prosedural / glTF), props, zona rawan
src/ui        komponen UI (layout, kontrol, grafik, pencarian)
src/pages     satu file per modul (lazy-load)
src/store     Zustand: preferensi (bahasa, tema), Studio
src/i18n      teks UI ID/EN (EN wajib berstruktur sama dengan ID — dicek tsc + unit test)
tests/unit    Vitest · tests/e2e  Playwright
docs/         catatan progres
```

## Bahasa & tema

- **Bahasa:** default Indonesia; toggle ID/EN di header, tersimpan di `localStorage` dan diterapkan ke `<html lang>`.
  Semua teks UI lewat kunci i18next; konten ilmiah berbentuk `{ id, en }` dan Zod menolak terjemahan kosong.
- **Tema:** Terang / Gelap / Ikuti sistem. Skrip inline di `index.html` menerapkan `data-theme` sebelum render
  pertama (tanpa kedip). Warna hanya didefinisikan di `src/index.css`; scene 3D membaca CSS variable yang sama
  dan punya preset cahaya per tema. Palet grafik divalidasi untuk buta warna di kedua tema.

## Model 3D & cara mengganti ke glTF

Halaman hanya memakai `<BodyModel>` dengan kontrak `BodyModelProps` (`src/scene/body/types.ts`): skeleton,
intensitas per ID otot, otot terpilih/hover, lapisan minimum. Implementasi default `ProceduralBody` membentuk
setiap otot sebagai elipsoid di antara dua jangkar tulang (`src/scene/body/muscleGeometry.ts`), sehingga otot
otomatis mengikuti animasi rig.

**Mengganti ke model anatomi glTF:**

1. Siapkan aset berlisensi bebas (mis. CC0 / CC BY), kompres dengan Draco (dan KTX2 untuk tekstur), simpan di
   `public/models/anatomy.glb`. Atur skala agar tinggi ≈ 1,78 m dengan kaki di y = 0 (atau isi `scale`/`offset`).
2. Isi `GLTF_MAPPING.muscles` di `src/scene/body/gltfMapping.ts`: ID otot OtotLapis → nama mesh di file
   (biasanya kiri & kanan), mis. `'pectoralis-major': ['Pectoralis_major_L', 'Pectoralis_major_R']`.
   ID otot yang tersedia ada di `src/content/muscles.ts`.
3. Ubah `BODY_MODEL_SOURCE` di `src/scene/body/bodyModelConfig.ts` menjadi `'gltf'`.
4. Catat kredit & lisensi di `src/content/about.ts` → `licenses`.

Decoder Draco di-host lokal (`public/decoders/draco/`, disalin dari three.js saat `npm install`) — tidak ada CDN.
Model glTF saat ini ditampilkan statis; agar ikut beranimasi di Studio, petakan tulang glTF ke nama tulang rig
(`bones` di mapping) dan terapkan quaternion dari `computeSkeleton()` ke tulang tersebut.

## Model biomekanika (dan batasannya)

`src/lib/biomech.ts` memakai model **statis bidang sagital**: momen sendi = Σ(berat segmen di atas sendi × jarak
horizontal ke sendi) + beban × lengan momen horizontal, dengan massa & pusat massa segmen dari tabel Winter.
Lunge memakai metode gaya reaksi lantai dengan asumsi 80% beban di kaki depan. Percepatan, gaya geser,
ko-kontraksi, dan bidang frontal diabaikan — angka adalah **estimasi edukatif**, bukan pengukuran.

## Privasi

- Tidak ada analytics, cookie, atau backend. Preferensi (bahasa, tema) hanya di `localStorage` browser Anda.
- Cek Form Webcam memproses video sepenuhnya di perangkat; model `pose_landmarker_lite.task` dan WASM di-host di situs ini.
- MediaPipe Tasks secara bawaan mengirim ping telemetri ke `odml.pa.googleapis.com` dan tidak menyediakan opsi
  untuk mematikannya. `index.html` memasang **Content-Security-Policy** (`connect-src 'self'`) sehingga browser
  memblokir semua koneksi keluar. Smoke test `tests/e2e/webcam.spec.ts` memverifikasi tidak ada permintaan ke host luar.

## Offline

`public/sw.js` (service worker sederhana, hanya build produksi) pra-cache semua aset build dari
`precache-manifest.json` (dibuat oleh plugin di `vite.config.ts`). WASM & model pose di-cache saat pertama dipakai.

## Deploy ke GitHub Pages

`vite.config.ts` memakai `base: '/GymRat/'` (nama repo) dan routing memakai HashRouter.
Workflow `.github/workflows/deploy.yml`: lint → unit test → build → Playwright smoke → deploy, setiap push ke `main`.

Sekali saja di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Data “perlu verifikasi”

Seperti di BumiLapis, entri konten yang belum dicek silang dengan sumber primer memakai `needsVerification: true`
dan ditampilkan dengan lencana “Perlu verifikasi”. Daftar lengkapnya ada di halaman Tentang.

## Lisensi

Kode: MIT. Aset pihak ketiga: three.js & ekosistem R3F (MIT), MediaPipe Tasks + model pose (Apache-2.0),
font Barlow Condensed / Archivo / IBM Plex Mono (SIL OFL 1.1), lucide (ISC). Model tubuh dibuat prosedural di proyek ini.
