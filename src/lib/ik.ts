/**
 * IK dua-tulang analitik di bidang sagital (z = depan, y = atas).
 * Dipakai untuk tungkai (pinggul → lutut → pergelangan) dan lengan (bahu → siku → tangan).
 */
export interface P2 {
  z: number;
  y: number;
}

export interface TwoBoneResult {
  /** Posisi sendi tengah (lutut/siku). */
  mid: P2;
  /** Ujung yang benar-benar tercapai (sama dengan target bila terjangkau). */
  end: P2;
  reachable: boolean;
}

/**
 * @param root pangkal rantai
 * @param target ujung yang diinginkan
 * @param l1 panjang tulang pertama
 * @param l2 panjang tulang kedua
 * @param bend arah tekuk: +1 = sendi tengah diputar +90° (berlawanan jarum jam di bidang z–y)
 *             dari arah root→target. Untuk rantai yang mengarah ke bawah, +1 = sendi tengah di depan.
 */
export function solveTwoBone2D(root: P2, target: P2, l1: number, l2: number, bend: 1 | -1): TwoBoneResult {
  const dz = target.z - root.z;
  const dy = target.y - root.y;
  const rawD = Math.hypot(dz, dy);
  const maxD = l1 + l2 - 1e-6;
  const minD = Math.abs(l1 - l2) + 1e-6;
  const d = Math.min(Math.max(rawD, minD), maxD);
  const reachable = rawD <= maxD && rawD >= minD;
  const ux = rawD > 1e-9 ? dz / rawD : 0;
  const uy = rawD > 1e-9 ? dy / rawD : -1;
  // hukum kosinus: jarak sepanjang garis root→target dan tinggi tegak lurus
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  // tegak lurus (diputar +90°) = (-uy, ux)
  const mid = { z: root.z + a * ux - bend * h * uy, y: root.y + a * uy + bend * h * ux };
  const end = { z: root.z + d * ux, y: root.y + d * uy };
  return { mid, end, reachable };
}

/** Sudut sebuah vektor relatif terhadap arah "lurus ke bawah", positif bila condong ke depan (+z). */
export function angleFromDown(from: P2, to: P2): number {
  return Math.atan2(to.z - from.z, -(to.y - from.y));
}

/** Sudut relatif terhadap arah "lurus ke atas", positif bila condong ke depan. */
export function angleFromUp(from: P2, to: P2): number {
  return Math.atan2(to.z - from.z, to.y - from.y);
}

export const dist2 = (a: P2, b: P2) => Math.hypot(a.z - b.z, a.y - b.y);
