import { Vector3 } from 'three';
import type { Side, Skeleton } from './rig';
import type { DemoPattern, MovementFrame } from './movements';

/**
 * Model statis bidang sagital (edukatif):
 *   momen sendi = Σ (berat segmen di atas sendi × jarak horizontal ke sendi) + beban × jarak horizontal.
 * Massa & pusat massa segmen mengikuti tabel antropometri Winter (2009).
 * Nilai positif = kebutuhan momen EKSTENSOR (lutut: beban di belakang lutut; pinggul/lumbal: beban di depan).
 */

export const G = 9.81;

/** Fraksi massa tubuh per segmen (Winter). */
export const SEGMENT_MASS = {
  head: 0.081,
  thorax: 0.216,
  abdomen: 0.139,
  pelvis: 0.142,
  upperArm: 0.028,
  forearm: 0.016,
  hand: 0.006,
  thigh: 0.1,
  shank: 0.0465,
  foot: 0.0145,
} as const;

/** Lokasi pusat massa dari ujung proksimal (fraksi panjang segmen). */
const COM_FRACTION = {
  upperArm: 0.436,
  forearm: 0.43,
  hand: 0.506,
  thigh: 0.433,
  shank: 0.433,
  foot: 0.5,
} as const;

export interface MassPoint {
  name: string;
  mass: number;
  pos: Vector3;
}

const lerpSeg = (sk: Skeleton, name: keyof Skeleton, t: number) =>
  sk[name].start.clone().lerp(sk[name].end, t);

export function segmentMasses(sk: Skeleton, bodyMass: number) {
  const m = (f: number) => f * bodyMass;
  const upper: MassPoint[] = [
    { name: 'head', mass: m(SEGMENT_MASS.head), pos: lerpSeg(sk, 'head', 0.4) },
    { name: 'thorax', mass: m(SEGMENT_MASS.thorax), pos: lerpSeg(sk, 'thorax', 0.5) },
    { name: 'abdomen', mass: m(SEGMENT_MASS.abdomen), pos: lerpSeg(sk, 'lumbar', 0.5) },
  ];
  for (const s of ['l', 'r'] as Side[]) {
    upper.push(
      {
        name: `upperArm_${s}`,
        mass: m(SEGMENT_MASS.upperArm),
        pos: lerpSeg(sk, `upperArm_${s}`, COM_FRACTION.upperArm),
      },
      {
        name: `forearm_${s}`,
        mass: m(SEGMENT_MASS.forearm),
        pos: lerpSeg(sk, `forearm_${s}`, COM_FRACTION.forearm),
      },
      {
        name: `hand_${s}`,
        mass: m(SEGMENT_MASS.hand),
        pos: lerpSeg(sk, `hand_${s}`, COM_FRACTION.hand),
      },
    );
  }
  const pelvis: MassPoint = {
    name: 'pelvis',
    mass: m(SEGMENT_MASS.pelvis),
    pos: lerpSeg(sk, 'pelvis', 0.3),
  };
  const thighs: MassPoint[] = (['l', 'r'] as Side[]).map((s) => ({
    name: `thigh_${s}`,
    mass: m(SEGMENT_MASS.thigh),
    pos: lerpSeg(sk, `thigh_${s}`, COM_FRACTION.thigh),
  }));
  const lower: MassPoint[] = (['l', 'r'] as Side[]).flatMap((s) => [
    {
      name: `shank_${s}`,
      mass: m(SEGMENT_MASS.shank),
      pos: lerpSeg(sk, `shank_${s}`, COM_FRACTION.shank),
    },
    {
      name: `foot_${s}`,
      mass: m(SEGMENT_MASS.foot),
      pos: lerpSeg(sk, `foot_${s}`, COM_FRACTION.foot),
    },
  ]);
  return { upper, pelvis, thighs, lower };
}

export function centerOfMass(points: readonly MassPoint[]): Vector3 {
  const c = new Vector3();
  let total = 0;
  for (const p of points) {
    c.addScaledVector(p.pos, p.mass);
    total += p.mass;
  }
  return total > 0 ? c.multiplyScalar(1 / total) : c;
}

/** Σ m·g·(z_i − z_joint): positif bila massa di depan sendi. */
export function sagittalMoment(points: readonly MassPoint[], joint: Vector3): number {
  let sum = 0;
  for (const p of points) sum += p.mass * G * (p.pos.z - joint.z);
  return sum;
}

export interface JointMoments {
  knee: number;
  hip: number;
  lumbar: number;
  shoulder: number;
  /** Lengan momen horizontal beban (m) terhadap tiap sendi. */
  arms: { knee: number; hip: number; lumbar: number; shoulder: number };
}

export interface BiomechInput {
  frame: MovementFrame;
  pattern: DemoPattern;
  loadKg: number;
  bodyMass: number;
  /** Porsi beban di kaki depan untuk lunge (statis tak tentu, jadi diasumsikan). */
  frontShare?: number;
}

const mid = (a: Vector3, b: Vector3) => a.clone().add(b).multiplyScalar(0.5);

export function computeMoments({
  frame,
  pattern,
  loadKg,
  bodyMass,
  frontShare = 0.8,
}: BiomechInput): JointMoments {
  const sk = frame.skeleton;
  const { upper, pelvis, thighs, lower } = segmentMasses(sk, bodyMass);
  const load: MassPoint[] =
    frame.bar && loadKg > 0 ? [{ name: 'load', mass: loadKg, pos: frame.bar }] : [];

  const lumbarJ = sk.pelvis.end; // ≈ L5/S1
  const hipJ = mid(sk.thigh_l.start, sk.thigh_r.start);
  const kneeJ = mid(sk.thigh_l.end, sk.thigh_r.end);
  const shoulderJ = mid(sk.upperArm_l.start, sk.upperArm_r.start);
  const barZ = frame.bar?.z ?? 0;
  const arms = {
    lumbar: Math.abs(barZ - lumbarJ.z),
    hip: Math.abs(barZ - hipJ.z),
    knee: Math.abs(barZ - kneeJ.z),
    shoulder: Math.abs(barZ - shoulderJ.z),
  };

  const lumbar = sagittalMoment([...upper, ...load], lumbarJ);
  const armPts = upper.filter((p) => /Arm|forearm|hand/.test(p.name));
  // bahu: lengan + beban (dibagi dua lengan → total kedua sisi tetap)
  const shoulder = Math.abs(sagittalMoment([...armPts, ...load], shoulderJ));

  if (pattern === 'lunge') {
    // Metode gaya reaksi lantai (GRF): kaki depan menanggung frontShare dari berat total,
    // dengan garis gaya dari titik tumpu (tengah telapak depan) menuju pusat massa tubuh+beban.
    const com = centerOfMass([...upper, pelvis, ...thighs, ...lower, ...load]);
    const cop = frame.midfoot;
    const fy = (bodyMass + loadKg) * G * frontShare;
    const fz = (fy * (com.z - cop.z)) / Math.max(com.y - cop.y, 0.2);
    /** Momen GRF terhadap sendi J dalam bidang sagital: positif = kebutuhan ekstensor pinggul. */
    const grf = (j: Vector3) => (cop.z - j.z) * fy - (cop.y - j.y) * fz;
    const fk = sk.thigh_l.end;
    const fh = sk.thigh_l.start;
    return {
      knee: -grf(fk),
      hip: grf(fh),
      lumbar,
      shoulder,
      arms: { ...arms, knee: Math.abs(fk.z - cop.z), hip: Math.abs(cop.z - fh.z) },
    };
  }

  const aboveHip = [...upper, pelvis, ...load];
  const hip = sagittalMoment(aboveHip, hipJ);
  const aboveKnee = [...aboveHip, ...thighs];
  const knee = -sagittalMoment(aboveKnee, kneeJ);
  return { knee, hip, lumbar, shoulder, arms };
}
