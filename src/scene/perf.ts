/** Deteksi kasar perangkat kelas rendah/HP untuk membatasi DPR dan mematikan efek berat. */
export function isLowPower(): boolean {
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const small = window.innerWidth < 900;
    const cores = navigator.hardwareConcurrency ?? 4;
    return coarse || small || cores <= 4;
  } catch {
    return true;
  }
}

export function dprRange(): [number, number] {
  return isLowPower() ? [1, 1.5] : [1, 2];
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}
