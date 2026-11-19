/** Geometri 2D untuk landmark pose (koordinat ternormalisasi 0..1, y ke bawah seperti gambar). */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** Indeks landmark MediaPipe Pose (33 titik). */
export const LM = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
} as const;

/** Pasangan untuk menggambar kerangka. */
export const POSE_EDGES: readonly [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

/** Sudut dalam di titik b (derajat) dari a–b–c. */
export function angle2d(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (d < 1e-9) return 180;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / d));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Kemiringan segmen a→b terhadap vertikal (derajat, 0 = tegak). */
export function tiltFromVertical(a: Landmark, b: Landmark): number {
  return (Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180) / Math.PI;
}

const vis = (l: Landmark | undefined) => l?.visibility ?? 1;

export type BodySide = 'left' | 'right';

/** Sisi tubuh yang paling terlihat (rata-rata visibility bahu–pinggul–lutut–pergelangan). */
export function bestSide(lms: readonly Landmark[]): BodySide {
  const l = [LM.lShoulder, LM.lElbow, LM.lHip, LM.lKnee, LM.lAnkle].reduce(
    (s, i) => s + vis(lms[i]),
    0,
  );
  const r = [LM.rShoulder, LM.rElbow, LM.rHip, LM.rKnee, LM.rAnkle].reduce(
    (s, i) => s + vis(lms[i]),
    0,
  );
  return r > l ? 'right' : 'left';
}

export interface JointAngles2D {
  knee: number;
  hip: number;
  elbow: number;
  torsoTilt: number;
  /** Sudut lengan atas terhadap torso (bahu), untuk deteksi ayunan. */
  shoulder: number;
  /** Rasio jarak antar-lutut / jarak antar-pergelangan kaki (tampak depan). <~0,75 = lutut masuk. */
  kneeAnkleRatio: number;
  side: BodySide;
  /** Keyakinan rata-rata (0..1). */
  confidence: number;
}

export function computeAngles(lms: readonly Landmark[]): JointAngles2D | null {
  if (lms.length < 29) return null;
  const side = bestSide(lms);
  const P =
    side === 'left'
      ? { s: LM.lShoulder, e: LM.lElbow, w: LM.lWrist, h: LM.lHip, k: LM.lKnee, a: LM.lAnkle }
      : { s: LM.rShoulder, e: LM.rElbow, w: LM.rWrist, h: LM.rHip, k: LM.rKnee, a: LM.rAnkle };
  const g = (i: number) => lms[i] as Landmark;
  const kneeGap = Math.abs(g(LM.lKnee).x - g(LM.rKnee).x);
  const ankleGap = Math.abs(g(LM.lAnkle).x - g(LM.rAnkle).x);
  const confidence = [P.s, P.e, P.h, P.k, P.a].reduce((s, i) => s + vis(lms[i]), 0) / 5;
  return {
    knee: angle2d(g(P.h), g(P.k), g(P.a)),
    hip: angle2d(g(P.s), g(P.h), g(P.k)),
    elbow: angle2d(g(P.s), g(P.e), g(P.w)),
    torsoTilt: tiltFromVertical(g(P.h), g(P.s)),
    shoulder: angle2d(g(P.h), g(P.s), g(P.e)),
    kneeAnkleRatio: ankleGap > 0.02 ? kneeGap / ankleGap : 1,
    side,
    confidence,
  };
}

/** Penghalus eksponensial sederhana. */
export class Ema {
  private v: number | null = null;
  constructor(private readonly alpha = 0.35) {}
  next(x: number): number {
    this.v = this.v === null ? x : this.v + this.alpha * (x - this.v);
    return this.v;
  }
  reset() {
    this.v = null;
  }
}
