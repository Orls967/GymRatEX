/**
 * Profil tubuh: tiap tulang diberi penampang elips yang berubah sepanjang tulang.
 * Profil ini bukan mesh akhir; ia dipakai sebagai fungsi jarak (SDF) lalu dilebur halus menjadi
 * SATU kulit tubuh (lihat skin.ts). Ini stilisasi, bukan model anatomi klinis.
 *
 * Koordinat lokal tulang: +y sepanjang tulang (dari pangkal), +z anterior, +x lateral.
 * Ring = [y, radius x, radius z, geser z].
 */
export type Ring = readonly [y: number, rx: number, rz: number, cz?: number];

export const CORE_PROFILES: Record<
  'pelvis' | 'lumbar' | 'thorax' | 'neck' | 'head',
  readonly Ring[]
> = {
  pelvis: [
    [-0.09, 0.11, 0.08, -0.01],
    [-0.03, 0.155, 0.105, -0.02],
    [0.03, 0.16, 0.105, -0.015],
    [0.1, 0.14, 0.095, -0.005],
  ],
  lumbar: [
    [0, 0.14, 0.095, 0],
    [0.08, 0.118, 0.083, 0.002],
    [0.17, 0.128, 0.09, 0.004],
  ],
  thorax: [
    [-0.01, 0.126, 0.09, 0.004],
    [0.07, 0.142, 0.1, 0.008],
    [0.17, 0.16, 0.11, 0.012],
    [0.245, 0.15, 0.098, 0.006],
    [0.285, 0.105, 0.075, 0],
  ],
  neck: [
    [-0.03, 0.07, 0.065, 0],
    [0.03, 0.05, 0.05, 0.004],
    [0.085, 0.046, 0.046, 0.012],
  ],
  head: [
    [-0.01, 0.04, 0.05, 0.02],
    [0.035, 0.062, 0.078, 0.014],
    [0.1, 0.074, 0.09, 0.008],
    [0.17, 0.068, 0.084, 0],
    [0.195, 0.062, 0.076, -0.002],
    [0.212, 0.046, 0.058, -0.003],
    [0.224, 0.026, 0.034, -0.004],
    [0.23, 0.01, 0.014, -0.004],
  ],
};

/** Profil anggota gerak (sama untuk kiri/kanan). */
export const LIMB_PROFILES = {
  clavicle: [
    [-0.03, 0.04, 0.05, 0],
    [0.08, 0.036, 0.04, 0],
    [0.17, 0.05, 0.05, 0],
  ],
  upperArm: [
    [0, 0.05, 0.05, 0],
    [0.07, 0.043, 0.045, 0.002],
    [0.16, 0.04, 0.044, 0.004],
    [0.3, 0.031, 0.033, 0],
  ],
  forearm: [
    [0, 0.032, 0.034, 0],
    [0.07, 0.036, 0.036, 0.001],
    [0.26, 0.023, 0.025, 0],
  ],
  hand: [
    [-0.01, 0.022, 0.014, 0],
    [0.045, 0.032, 0.015, 0],
    [0.09, 0.02, 0.011, 0],
    [0.11, 0.008, 0.007, 0],
  ],
  thigh: [
    [-0.035, 0.07, 0.072, -0.004],
    [0.09, 0.083, 0.085, 0.004],
    [0.24, 0.073, 0.075, 0.004],
    [0.43, 0.05, 0.052, 0],
  ],
  shank: [
    [0, 0.049, 0.051, 0],
    [0.13, 0.054, 0.058, -0.012],
    [0.3, 0.04, 0.042, -0.004],
    [0.42, 0.031, 0.032, 0],
  ],
  // sumbu Y = arah telapak; Z lokal = atas
  foot: [
    [-0.045, 0.036, 0.042, -0.012],
    [0.05, 0.042, 0.036, -0.022],
    [0.14, 0.043, 0.026, -0.034],
    [0.2, 0.036, 0.018, -0.04],
    [0.215, 0.015, 0.01, -0.042],
  ],
} as const satisfies Record<string, readonly Ring[]>;

/** Catmull-Rom satu dimensi. */
function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/** Tabel padat [y, rx, rz, cz] × n sampel, dihaluskan dengan Catmull-Rom. */
export function denseProfile(rings: readonly Ring[], n = 28): Float32Array {
  const out = new Float32Array(n * 4);
  const y0 = rings[0]?.[0] ?? 0;
  const y1 = rings[rings.length - 1]?.[0] ?? 1;
  const get = (i: number, k: 1 | 2 | 3) => {
    const r = rings[Math.min(Math.max(i, 0), rings.length - 1)] as Ring;
    return r[k] ?? 0;
  };
  for (let s = 0; s < n; s++) {
    const y = y0 + ((y1 - y0) * s) / (n - 1);
    let i = 0;
    while (i < rings.length - 2 && y > (rings[i + 1] as Ring)[0]) i++;
    const ya = (rings[i] as Ring)[0];
    const yb = (rings[i + 1] as Ring)[0];
    const t = yb === ya ? 0 : Math.min(Math.max((y - ya) / (yb - ya), 0), 1);
    out[s * 4] = y;
    for (const k of [1, 2, 3] as const)
      out[s * 4 + k] = cr(get(i - 1, k), get(i, k), get(i + 1, k), get(i + 2, k), t);
    out[s * 4 + 1] = Math.max(out[s * 4 + 1] ?? 0.004, 0.004);
    out[s * 4 + 2] = Math.max(out[s * 4 + 2] ?? 0.004, 0.004);
  }
  return out;
}
