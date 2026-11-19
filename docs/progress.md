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
