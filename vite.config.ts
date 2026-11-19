/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

/** Menulis daftar aset hasil build agar service worker bisa pra-cache semuanya (mode offline). */
function precacheManifest(): Plugin {
  return {
    name: 'gymrat-precache-manifest',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map') && f !== 'index.html');
      // aset statis kecil di public/ (WASM & model pose di-cache saat pertama dipakai)
      files.push('favicon.svg');
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(files),
      });
    },
  };
}

// `base` harus sama dengan nama repo agar GitHub Pages (https://<user>.github.io/GymRat/) memuat aset dengan benar.
export default defineConfig({
  base: '/GymRat/',
  plugins: [react(), tailwindcss(), precacheManifest()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
