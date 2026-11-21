import { BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * Bentuk dasar manekin: tiap tulang diberi "loft" (penampang elips yang diubah ukurannya sepanjang tulang)
 * sehingga siluet menyempit di pergelangan, menggembung di betis/paha/dada, dan ujungnya membulat.
 * Ujung bulat yang saling menimpa di sendi membuat bagian tubuh tetap tersambung saat ditekuk.
 * Ini stilisasi, bukan model anatomi klinis.
 *
 * Koordinat lokal tulang: +y sepanjang tulang (dari pangkal), +z anterior, +x lateral.
 * Ring = [y, radius x, radius z, geser z].
 */
export type Ring = readonly [y: number, rx: number, rz: number, cz?: number];

const SEGMENTS = 22;
const SUBDIV = 5;
const CAP_STEPS = 5;

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

function smoothRings(rings: readonly Ring[]): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const get = (i: number) => rings[Math.min(Math.max(i, 0), rings.length - 1)] as Ring;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let s = 0; s < SUBDIV; s++) {
      const t = s / SUBDIV;
      const comp = (k: 0 | 1 | 2 | 3) =>
        cr(get(i - 1)[k] ?? 0, get(i)[k] ?? 0, get(i + 1)[k] ?? 0, get(i + 2)[k] ?? 0, t);
      out.push([comp(0), Math.max(comp(1), 0.001), Math.max(comp(2), 0.001), comp(3)]);
    }
  }
  const last = rings[rings.length - 1] as Ring;
  out.push([last[0], last[1], last[2], last[3] ?? 0]);
  return out;
}

export function loft(rings: readonly Ring[]): BufferGeometry {
  const body = smoothRings(rings);
  const first = body[0] as [number, number, number, number];
  const last = body[body.length - 1] as [number, number, number, number];
  const list: [number, number, number, number][] = [];
  // ujung bawah membulat
  const h0 = Math.min(first[1], first[2]) * 0.95;
  for (let k = CAP_STEPS; k >= 1; k--) {
    const phi = (k / CAP_STEPS) * (Math.PI / 2);
    list.push([
      first[0] - h0 * Math.sin(phi),
      first[1] * Math.cos(phi),
      first[2] * Math.cos(phi),
      first[3],
    ]);
  }
  list.push(...body);
  const h1 = Math.min(last[1], last[2]) * 0.95;
  for (let k = 1; k <= CAP_STEPS; k++) {
    const phi = (k / CAP_STEPS) * (Math.PI / 2);
    list.push([
      last[0] + h1 * Math.sin(phi),
      last[1] * Math.cos(phi),
      last[2] * Math.cos(phi),
      last[3],
    ]);
  }

  const pos: number[] = [];
  for (const [y, rx, rz, cz] of list) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = (j / SEGMENTS) * Math.PI * 2;
      pos.push(rx * Math.cos(a), y, cz + rz * Math.sin(a));
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < list.length - 1; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const j2 = (j + 1) % SEGMENTS;
      const a = i * SEGMENTS + j;
      const b = i * SEGMENTS + j2;
      const c = (i + 1) * SEGMENTS + j;
      const d = (i + 1) * SEGMENTS + j2;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Profil tiap tulang. Panjang tulang: lihat BONE_LENGTH di rig.ts. */
export const CORE_PROFILES: Record<
  'pelvis' | 'lumbar' | 'thorax' | 'neck' | 'head',
  readonly Ring[]
> = {
  pelvis: [
    [-0.085, 0.095, 0.075, -0.005],
    [-0.03, 0.15, 0.1, -0.012],
    [0.04, 0.158, 0.105, -0.01],
    [0.1, 0.135, 0.092, -0.004],
  ],
  lumbar: [
    [0, 0.135, 0.092, 0],
    [0.08, 0.112, 0.08, 0],
    [0.17, 0.122, 0.088, 0.003],
  ],
  thorax: [
    [-0.01, 0.122, 0.088, 0.003],
    [0.07, 0.14, 0.098, 0.006],
    [0.17, 0.158, 0.108, 0.01],
    [0.25, 0.148, 0.098, 0.004],
    [0.285, 0.1, 0.07, -0.004],
  ],
  neck: [
    [-0.02, 0.062, 0.058, 0],
    [0.04, 0.047, 0.047, 0.004],
    [0.085, 0.045, 0.045, 0.01],
  ],
  head: [
    [-0.005, 0.042, 0.05, 0.016],
    [0.04, 0.064, 0.078, 0.01],
    [0.11, 0.074, 0.092, 0.006],
    [0.18, 0.066, 0.082, 0.0],
    [0.215, 0.04, 0.05, -0.004],
  ],
};

/** Profil anggota gerak (sama untuk kiri/kanan). */
export const LIMB_PROFILES = {
  clavicle: [
    [-0.02, 0.034, 0.034, 0],
    [0.09, 0.036, 0.036, 0],
    [0.17, 0.048, 0.048, 0],
  ],
  upperArm: [
    [0, 0.047, 0.047, 0],
    [0.08, 0.04, 0.042, 0.002],
    [0.17, 0.04, 0.043, 0.004],
    [0.3, 0.03, 0.032, 0],
  ],
  forearm: [
    [0, 0.031, 0.033, 0],
    [0.07, 0.036, 0.036, 0.001],
    [0.26, 0.022, 0.024, 0],
  ],
  hand: [
    [-0.01, 0.02, 0.013, 0],
    [0.04, 0.03, 0.014, 0],
    [0.09, 0.019, 0.011, 0],
  ],
  thigh: [
    [-0.035, 0.068, 0.07, -0.004],
    [0.09, 0.08, 0.082, 0.004],
    [0.24, 0.07, 0.072, 0.004],
    [0.43, 0.048, 0.05, 0],
  ],
  shank: [
    [0, 0.048, 0.05, 0],
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
  ],
} as const satisfies Record<string, readonly Ring[]>;
