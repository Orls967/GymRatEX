import { primeBodyAsset, getBodyAsset, type BodyAsset } from './skin';
import { primeMuscleShells, getMuscleShells, type MuscleShellAsset } from './muscleShells';

interface Built {
  body: BodyAsset;
  shells: MuscleShellAsset;
}

let promise: Promise<Built> | null = null;
let done = false;

/**
 * Membangun aset tubuh sekali per sesi di Web Worker; bila worker tak tersedia/gagal,
 * dibangun di thread utama pada tick berikutnya. Hasil disimpan sebagai cache modul.
 */
export function loadBodyAssets(): Promise<Built> {
  promise ??= new Promise<Built>((resolve) => {
    const finish = (b: Built) => {
      primeBodyAsset(b.body);
      primeMuscleShells(b.shells);
      done = true;
      resolve(b);
    };
    const fallback = () =>
      setTimeout(() => finish({ body: getBodyAsset(), shells: getMuscleShells() }), 0);
    try {
      const w = new Worker(new URL('./bodyWorker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<Built>) => {
        w.terminate();
        finish(e.data);
      };
      w.onerror = () => {
        w.terminate();
        fallback();
      };
      w.postMessage(0);
    } catch {
      fallback();
    }
  });
  return promise;
}

export const bodyAssetsReady = () => done;
