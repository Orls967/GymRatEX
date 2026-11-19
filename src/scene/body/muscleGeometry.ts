import type { BoneName, Side } from '../../lib/rig';

/**
 * Pemetaan ID otot → bentuk prosedural.
 * Tiap otot = satu atau lebih "perut otot" (elipsoid) yang direntangkan di antara dua jangkar.
 * Jangkar = tulang + posisi t (0..1 sepanjang tulang) + offset lokal [x lateral, z anterior] (m).
 * Offset x untuk sisi kanan dicerminkan otomatis. Bila mengganti ke glTF, lihat gltfMapping.ts.
 */
export interface Anchor {
  bone: BoneName | `${string}_S`;
  t: number;
  off: [number, number];
}

export interface Belly {
  a: Anchor;
  b: Anchor;
  /** Jari-jari penampang [lebar, tebal] (m). */
  r: [number, number];
  /** Rotasi penampang di sekitar sumbu panjang (rad), mis. otot miring. */
  twist?: number;
}

export interface MuscleShape {
  /** true = dibuat untuk kedua sisi (kiri & kanan). */
  bilateral: boolean;
  bellies: Belly[];
}

const A = (bone: Anchor['bone'], t: number, x: number, z: number): Anchor => ({
  bone,
  t,
  off: [x, z],
});

export const MUSCLE_SHAPES: Record<string, MuscleShape> = {
  'pectoralis-major': {
    bilateral: true,
    bellies: [
      { a: A('thorax', 0.6, 0.03, 0.1), b: A('upperArm_S', 0.14, 0.0, 0.035), r: [0.06, 0.02] },
      { a: A('thorax', 0.86, 0.04, 0.095), b: A('upperArm_S', 0.1, 0.0, 0.04), r: [0.042, 0.018] },
    ],
  },
  'pectoralis-minor': {
    bilateral: true,
    bellies: [
      { a: A('thorax', 0.55, 0.08, 0.085), b: A('thorax', 0.86, 0.13, 0.06), r: [0.03, 0.015] },
    ],
  },
  'serratus-anterior': {
    bilateral: true,
    bellies: [
      { a: A('thorax', 0.35, 0.12, 0.05), b: A('thorax', 0.62, 0.135, -0.02), r: [0.035, 0.016] },
    ],
  },
  'deltoid-anterior': {
    bilateral: true,
    bellies: [
      {
        a: A('clavicle_S', 0.85, 0.0, 0.04),
        b: A('upperArm_S', 0.42, 0.012, 0.03),
        r: [0.034, 0.026],
      },
    ],
  },
  'deltoid-lateral': {
    bilateral: true,
    bellies: [
      {
        a: A('clavicle_S', 1.0, 0.035, 0.0),
        b: A('upperArm_S', 0.42, 0.035, 0.0),
        r: [0.036, 0.028],
      },
    ],
  },
  'deltoid-posterior': {
    bilateral: true,
    bellies: [
      {
        a: A('clavicle_S', 0.8, 0.0, -0.045),
        b: A('upperArm_S', 0.42, 0.012, -0.03),
        r: [0.034, 0.025],
      },
    ],
  },
  'rotator-cuff': {
    bilateral: true,
    bellies: [
      { a: A('thorax', 0.72, 0.1, -0.085), b: A('upperArm_S', 0.03, 0.0, -0.02), r: [0.04, 0.016] },
    ],
  },
  'biceps-brachii': {
    bilateral: true,
    bellies: [
      { a: A('upperArm_S', 0.15, 0.0, 0.03), b: A('upperArm_S', 0.95, 0.0, 0.03), r: [0.03, 0.03] },
    ],
  },
  brachialis: {
    bilateral: true,
    bellies: [
      {
        a: A('upperArm_S', 0.45, 0.0, 0.018),
        b: A('forearm_S', 0.1, 0.0, 0.012),
        r: [0.03, 0.022],
      },
    ],
  },
  'triceps-brachii': {
    bilateral: true,
    bellies: [
      {
        a: A('upperArm_S', 0.08, 0.0, -0.03),
        b: A('upperArm_S', 0.95, 0.0, -0.028),
        r: [0.035, 0.032],
      },
    ],
  },
  brachioradialis: {
    bilateral: true,
    bellies: [
      {
        a: A('upperArm_S', 0.78, 0.03, 0.01),
        b: A('forearm_S', 0.75, 0.025, 0.01),
        r: [0.022, 0.02],
      },
    ],
  },
  'forearm-flexors': {
    bilateral: true,
    bellies: [
      {
        a: A('forearm_S', 0.05, -0.012, 0.015),
        b: A('forearm_S', 0.8, -0.005, 0.012),
        r: [0.028, 0.02],
      },
    ],
  },
  'forearm-extensors': {
    bilateral: true,
    bellies: [
      {
        a: A('forearm_S', 0.05, 0.01, -0.015),
        b: A('forearm_S', 0.8, 0.005, -0.012),
        r: [0.026, 0.019],
      },
    ],
  },
  'rectus-abdominis': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.15, 0.03, 0.085), b: A('lumbar', 0.6, 0.035, 0.1), r: [0.03, 0.016] },
      { a: A('lumbar', 0.55, 0.035, 0.1), b: A('thorax', 0.42, 0.04, 0.11), r: [0.031, 0.016] },
    ],
  },
  'obliques-external': {
    bilateral: true,
    bellies: [
      {
        a: A('pelvis', 0.5, 0.115, 0.04),
        b: A('thorax', 0.32, 0.12, 0.06),
        r: [0.042, 0.02],
        twist: 0.3,
      },
    ],
  },
  'obliques-internal': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.55, 0.1, 0.03), b: A('lumbar', 0.95, 0.1, 0.06), r: [0.04, 0.016] },
    ],
  },
  'transversus-abdominis': {
    bilateral: true,
    bellies: [
      {
        a: A('pelvis', 0.6, 0.06, 0.06),
        b: A('lumbar', 0.9, 0.08, 0.06),
        r: [0.06, 0.012],
        twist: 1.2,
      },
    ],
  },
  trapezius: {
    bilateral: true,
    bellies: [
      { a: A('neck', 0.7, 0.012, -0.03), b: A('clavicle_S', 0.85, 0.0, -0.02), r: [0.035, 0.018] },
      { a: A('thorax', 0.9, 0.012, -0.08), b: A('thorax', 0.86, 0.13, -0.075), r: [0.032, 0.014] },
      { a: A('thorax', 0.3, 0.012, -0.085), b: A('thorax', 0.75, 0.09, -0.09), r: [0.03, 0.012] },
    ],
  },
  'latissimus-dorsi': {
    bilateral: true,
    bellies: [
      {
        a: A('lumbar', 0.5, 0.04, -0.085),
        b: A('upperArm_S', 0.12, -0.015, -0.01),
        r: [0.065, 0.02],
      },
    ],
  },
  rhomboids: {
    bilateral: true,
    bellies: [
      {
        a: A('thorax', 0.62, 0.015, -0.08),
        b: A('thorax', 0.75, 0.08, -0.08),
        r: [0.035, 0.012],
        twist: 0.3,
      },
    ],
  },
  'erector-spinae': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.3, 0.035, -0.07), b: A('thorax', 0.75, 0.035, -0.075), r: [0.024, 0.026] },
    ],
  },
  multifidus: {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.2, 0.015, -0.06), b: A('lumbar', 1.0, 0.015, -0.065), r: [0.014, 0.018] },
    ],
  },
  'quadratus-lumborum': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.6, 0.065, -0.04), b: A('lumbar', 1.0, 0.06, -0.035), r: [0.02, 0.018] },
    ],
  },
  'gluteus-maximus': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.5, 0.05, -0.085), b: A('thigh_S', 0.2, 0.02, -0.04), r: [0.075, 0.05] },
    ],
  },
  'gluteus-medius': {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.95, 0.12, -0.02), b: A('thigh_S', 0.04, 0.06, 0.0), r: [0.05, 0.03] },
    ],
  },
  iliopsoas: {
    bilateral: true,
    bellies: [
      { a: A('lumbar', 0.6, 0.04, 0.0), b: A('thigh_S', 0.08, -0.01, 0.02), r: [0.025, 0.025] },
    ],
  },
  adductors: {
    bilateral: true,
    bellies: [
      { a: A('pelvis', 0.0, 0.03, 0.02), b: A('thigh_S', 0.7, -0.045, 0.0), r: [0.042, 0.04] },
    ],
  },
  'rectus-femoris': {
    bilateral: true,
    bellies: [
      { a: A('thigh_S', 0.08, 0.0, 0.055), b: A('thigh_S', 0.92, 0.0, 0.05), r: [0.035, 0.03] },
    ],
  },
  'vastus-lateralis': {
    bilateral: true,
    bellies: [
      { a: A('thigh_S', 0.15, 0.05, 0.015), b: A('thigh_S', 0.92, 0.035, 0.02), r: [0.038, 0.036] },
    ],
  },
  'vastus-medialis': {
    bilateral: true,
    bellies: [
      {
        a: A('thigh_S', 0.45, -0.035, 0.03),
        b: A('thigh_S', 0.95, -0.03, 0.035),
        r: [0.034, 0.03],
      },
    ],
  },
  'vastus-intermedius': {
    bilateral: true,
    bellies: [
      { a: A('thigh_S', 0.15, 0.0, 0.025), b: A('thigh_S', 0.85, 0.0, 0.022), r: [0.035, 0.028] },
    ],
  },
  hamstrings: {
    bilateral: true,
    bellies: [
      { a: A('thigh_S', 0.08, 0.02, -0.05), b: A('shank_S', 0.08, 0.035, -0.03), r: [0.032, 0.03] },
      {
        a: A('thigh_S', 0.08, -0.02, -0.05),
        b: A('shank_S', 0.08, -0.03, -0.03),
        r: [0.033, 0.03],
      },
    ],
  },
  gastrocnemius: {
    bilateral: true,
    bellies: [
      {
        a: A('shank_S', 0.0, 0.022, -0.035),
        b: A('shank_S', 0.62, 0.01, -0.035),
        r: [0.026, 0.03],
      },
      {
        a: A('shank_S', 0.0, -0.022, -0.035),
        b: A('shank_S', 0.62, -0.01, -0.035),
        r: [0.028, 0.032],
      },
    ],
  },
  soleus: {
    bilateral: true,
    bellies: [
      { a: A('shank_S', 0.3, 0.0, -0.025), b: A('shank_S', 0.9, 0.0, -0.025), r: [0.035, 0.022] },
    ],
  },
  'tibialis-anterior': {
    bilateral: true,
    bellies: [
      {
        a: A('shank_S', 0.08, 0.022, 0.025),
        b: A('shank_S', 0.85, 0.008, 0.025),
        r: [0.018, 0.02],
      },
    ],
  },
};

export function resolveBone(bone: Anchor['bone'], side: Side): BoneName {
  return (bone.endsWith('_S') ? bone.replace(/_S$/, `_${side}`) : bone) as BoneName;
}
