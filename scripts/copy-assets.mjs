// Menyalin file WASM MediaPipe dari node_modules ke public/ agar di-host lokal (tanpa CDN).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const dest = join(root, 'public/mediapipe/wasm');
if (!existsSync(src)) {
  console.warn('[copy-assets] @mediapipe/tasks-vision belum terpasang, dilewati.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  cpSync(join(src, f), join(dest, f));
}
console.log('[copy-assets] WASM disalin ke public/mediapipe/wasm');
