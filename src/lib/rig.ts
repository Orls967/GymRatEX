import { Quaternion, Vector3 } from 'three';

/**
 * Rig tulang prosedural (forward kinematics).
 * Kerangka koordinat tubuh: +y atas, +z anterior (depan), +x sisi KIRI subjek.
 * Semua sudut dalam radian dan RELATIF terhadap tulang induk.
 */

export type Side = 'l' | 'r';
export type BoneName =
  | 'pelvis'
  | 'lumbar'
  | 'thorax'
  | 'neck'
  | 'head'
  | `clavicle_${Side}`
  | `upperArm_${Side}`
  | `forearm_${Side}`
  | `hand_${Side}`
  | `thigh_${Side}`
  | `shank_${Side}`
  | `foot_${Side}`;

export interface LimbAngles {
  /** Fleksi (+) / ekstensi (−) */
  flex: number;
  /** Abduksi (+) menjauhi garis tengah */
  abd: number;
  /** Rotasi sumbu panjang (+ = eksternal), opsional; dipakai bahu agar siku bisa menekuk ke belakang. */
  rot?: number;
}

export interface Pose {
  /** Posisi pusat sendi pinggul (tengah panggul) di dunia. */
  root: [number, number, number];
  /** Rotasi seluruh tubuh di sekitar sumbu Y (menghadap). */
  yaw: number;
  /** Rotasi seluruh tubuh di sekitar sumbu X dunia (dipakai untuk posisi berbaring). */
  pitch: number;
  /** Kemiringan panggul ke depan (+ = anterior / torso condong ke depan). */
  pelvisTilt: number;
  /** Fleksi lumbal (+ = membulat). */
  lumbarFlex: number;
  thoracicFlex: number;
  neckFlex: number;
  hip: Record<Side, LimbAngles>;
  knee: Record<Side, number>;
  /** Valgus lutut (+ = lutut masuk ke garis tengah), rad. */
  kneeValgus: Record<Side, number>;
  /** Dorsofleksi (+) */
  ankle: Record<Side, number>;
  shoulder: Record<Side, LimbAngles>;
  elbow: Record<Side, number>;
}

export interface Segment {
  start: Vector3;
  end: Vector3;
  quat: Quaternion;
  length: number;
}
export type Skeleton = Record<BoneName, Segment>;

/** Panjang segmen (meter) untuk tinggi ≈ 1,78 m. */
export const BONE_LENGTH = {
  pelvis: 0.1,
  lumbar: 0.17,
  thorax: 0.28,
  neck: 0.08,
  head: 0.22,
  clavicle: 0.17,
  upperArm: 0.3,
  forearm: 0.26,
  hand: 0.09,
  thigh: 0.43,
  shank: 0.42,
  foot: 0.2,
  hipHalfWidth: 0.09,
  ankleHeight: 0.08,
} as const;

export const STANDING_HIP_HEIGHT = BONE_LENGTH.thigh + BONE_LENGTH.shank + BONE_LENGTH.ankleHeight;

export const SIDES: readonly Side[] = ['l', 'r'];
const sideSign = (s: Side) => (s === 'l' ? 1 : -1);

export function neutralPose(): Pose {
  return {
    root: [0, STANDING_HIP_HEIGHT, 0],
    yaw: 0,
    pitch: 0,
    pelvisTilt: 0,
    lumbarFlex: 0,
    thoracicFlex: 0,
    neckFlex: 0,
    hip: { l: { flex: 0, abd: 0.04 }, r: { flex: 0, abd: 0.04 } },
    knee: { l: 0, r: 0 },
    kneeValgus: { l: 0, r: 0 },
    ankle: { l: 0, r: 0 },
    shoulder: { l: { flex: 0, abd: 0.12 }, r: { flex: 0, abd: 0.12 } },
    elbow: { l: 0.1, r: 0.1 },
  };
}

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const UP = new Vector3(0, 1, 0);
const DOWN = new Vector3(0, -1, 0);

const qAxis = (axis: Vector3, angle: number) => new Quaternion().setFromAxisAngle(axis, angle);

function segment(start: Vector3, quat: Quaternion, restDir: Vector3, length: number): Segment {
  const end = restDir.clone().multiplyScalar(length).applyQuaternion(quat).add(start);
  return { start: start.clone(), end, quat: quat.clone(), length };
}

/** Titik lokal (dalam kerangka tulang) → dunia. */
function at(seg: Segment, local: Vector3): Vector3 {
  return local.clone().applyQuaternion(seg.quat).add(seg.start);
}

/** Forward kinematics: Pose → posisi & orientasi setiap tulang. */
export function computeSkeleton(pose: Pose): Skeleton {
  const L = BONE_LENGTH;
  const rootQ = qAxis(Y, pose.yaw).multiply(qAxis(X, pose.pitch));
  const root = new Vector3(...pose.root);

  const pelvisQ = rootQ.clone().multiply(qAxis(X, pose.pelvisTilt));
  const pelvis = segment(root, pelvisQ, UP, L.pelvis);
  const lumbarQ = pelvisQ.clone().multiply(qAxis(X, pose.lumbarFlex));
  const lumbar = segment(pelvis.end, lumbarQ, UP, L.lumbar);
  const thoraxQ = lumbarQ.clone().multiply(qAxis(X, pose.thoracicFlex));
  const thorax = segment(lumbar.end, thoraxQ, UP, L.thorax);
  const neckQ = thoraxQ.clone().multiply(qAxis(X, pose.neckFlex));
  const neck = segment(thorax.end, neckQ, UP, L.neck);
  const head = segment(neck.end, neckQ, UP, L.head);

  const sk: Partial<Skeleton> = { pelvis, lumbar, thorax, neck, head };

  for (const s of SIDES) {
    const sg = sideSign(s);
    // Bahu
    const clavStart = at(thorax, new Vector3(0, L.thorax - 0.04, 0.0));
    const clav = segment(clavStart, thoraxQ, new Vector3(sg, 0, 0), L.clavicle);
    const sh = pose.shoulder[s];
    const armQ = thoraxQ
      .clone()
      .multiply(qAxis(X, -sh.flex))
      .multiply(qAxis(Z, sg * sh.abd))
      .multiply(qAxis(Y, sg * (sh.rot ?? 0)));
    const upperArm = segment(clav.end, armQ, DOWN, L.upperArm);
    const foreQ = armQ.clone().multiply(qAxis(X, -pose.elbow[s]));
    const forearm = segment(upperArm.end, foreQ, DOWN, L.forearm);
    const hand = segment(forearm.end, foreQ, DOWN, L.hand);

    // Tungkai
    const hipJoint = at(pelvis, new Vector3(sg * L.hipHalfWidth, 0, 0));
    const hp = pose.hip[s];
    const valgus = pose.kneeValgus[s];
    const thighQ = pelvisQ
      .clone()
      .multiply(qAxis(X, -hp.flex))
      .multiply(qAxis(Z, sg * (hp.abd - valgus)));
    const thigh = segment(hipJoint, thighQ, DOWN, L.thigh);
    // valgus: paha aduksi, tungkai bawah kembali keluar sehingga kaki tetap di tempat
    const shankQ = thighQ
      .clone()
      .multiply(qAxis(Z, sg * valgus * 1.8))
      .multiply(qAxis(X, pose.knee[s]));
    const shank = segment(thigh.end, shankQ, DOWN, L.shank);
    const footQ = shankQ.clone().multiply(qAxis(X, -pose.ankle[s]));
    // telapak sedikit mengarah ke bawah dari pergelangan kaki
    const foot = segment(shank.end, footQ, new Vector3(0, -0.38, 0.92).normalize(), L.foot);

    sk[`clavicle_${s}`] = clav;
    sk[`upperArm_${s}`] = upperArm;
    sk[`forearm_${s}`] = forearm;
    sk[`hand_${s}`] = hand;
    sk[`thigh_${s}`] = thigh;
    sk[`shank_${s}`] = shank;
    sk[`foot_${s}`] = foot;
  }
  return sk as Skeleton;
}

/** Titik pada tulang: t = 0..1 dari pangkal ke ujung, offset dalam kerangka lokal tulang (x lateral, z anterior), meter. */
export function boneLocalPoint(seg: Segment, t: number, off: [number, number]): Vector3 {
  return new Vector3(off[0], 0, off[1])
    .applyQuaternion(seg.quat)
    .add(seg.start.clone().lerp(seg.end, t));
}

/** Sudut (rad) antara vektor a→b dan a→c, mis. sudut lutut dari pinggul–lutut–pergelangan. */
export function angleAt(a: Vector3, b: Vector3, c: Vector3): number {
  const v1 = b.clone().sub(a);
  const v2 = c.clone().sub(a);
  return v1.angleTo(v2);
}
