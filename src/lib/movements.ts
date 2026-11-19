import { Vector3 } from 'three';
import {
  BONE_LENGTH as L,
  computeSkeleton,
  neutralPose,
  type Pose,
  type Side,
  type Skeleton,
} from './rig';
import { angleFromDown, solveTwoBone2D, type P2 } from './ik';

/**
 * Generator gerakan prosedural. Tiap gerakan menerima parameter slider dan fase 0..1
 * (0 = posisi awal/atas, 1 = posisi paling bawah) lalu menghasilkan Pose via IK.
 */
export type StudioPattern = 'squat' | 'hinge' | 'lunge' | 'ohp';
export type DemoPattern = StudioPattern | 'bench';

export interface MovementParams {
  /** 0..1 */
  depth: number;
  /** Sudut torso (derajat dari vertikal) di posisi bawah. Untuk OHP: condong ke belakang. */
  torso: number;
  /** Lebar kaki (m, jarak antar-pergelangan) — untuk lunge: panjang langkah. */
  stance: number;
  load: number;
  bodyMass: number;
}

export interface Faults {
  /** 0..1 lutut masuk */
  valgus?: number;
  /** 0..1 panggul berputar ke belakang di bawah (butt wink) */
  buttWink?: number;
  /** 0..1 punggung membulat */
  rounding?: number;
  /** 0..1 siku melebar */
  elbowFlare?: number;
}

export interface MovementFrame {
  pose: Pose;
  skeleton: Skeleton;
  /** Posisi tengah barbel/beban di dunia; null bila tanpa beban eksternal. */
  bar: Vector3 | null;
  /** Titik tumpu (tengah telapak) depan. */
  midfoot: Vector3;
  /** false bila batas mobilitas tercapai sehingga barbel tidak bisa di atas tengah telapak. */
  balanced: boolean;
}

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

export const PARAM_RANGES: Record<
  StudioPattern,
  Record<'depth' | 'torso' | 'stance' | 'load', SliderRange>
> = {
  squat: {
    depth: { min: 0.3, max: 1, step: 0.01 },
    torso: { min: 10, max: 60, step: 1 },
    stance: { min: 0.25, max: 0.7, step: 0.01 },
    load: { min: 0, max: 200, step: 2.5 },
  },
  hinge: {
    depth: { min: 0.3, max: 1, step: 0.01 },
    torso: { min: 30, max: 85, step: 1 },
    stance: { min: 0.2, max: 0.8, step: 0.01 },
    load: { min: 0, max: 250, step: 2.5 },
  },
  lunge: {
    depth: { min: 0.3, max: 1, step: 0.01 },
    torso: { min: -5, max: 35, step: 1 },
    stance: { min: 0.6, max: 1.1, step: 0.01 },
    load: { min: 0, max: 60, step: 2 },
  },
  ohp: {
    depth: { min: 0.3, max: 1, step: 0.01 },
    torso: { min: -20, max: 5, step: 1 },
    stance: { min: 0.2, max: 0.5, step: 0.01 },
    load: { min: 0, max: 120, step: 2.5 },
  },
};

export const DEFAULT_PARAMS: Record<StudioPattern, MovementParams> = {
  squat: { depth: 0.8, torso: 38, stance: 0.42, load: 60, bodyMass: 75 },
  hinge: { depth: 1, torso: 62, stance: 0.3, load: 80, bodyMass: 75 },
  lunge: { depth: 0.85, torso: 8, stance: 0.85, load: 0, bodyMass: 75 },
  ohp: { depth: 1, torso: -6, stance: 0.3, load: 40, bodyMass: 75 },
};

const DEG = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ANKLE_Y = L.ankleHeight;
/** Tengah telapak relatif terhadap pergelangan kaki (z). */
export const MIDFOOT_OFFSET = 0.05;
const ARM_LEN = L.upperArm + L.forearm + L.hand * 0.5;

/** Vektor sagital dari pusat pinggul ke sendi bahu untuk sudut segmen torso tertentu. */
function trunkToShoulder(pelvisTilt: number, lumbarFlex: number, thoracicFlex: number): P2 {
  const a1 = pelvisTilt;
  const a2 = a1 + lumbarFlex;
  const a3 = a2 + thoracicFlex;
  const th = L.thorax - 0.04;
  return {
    z: L.pelvis * Math.sin(a1) + L.lumbar * Math.sin(a2) + th * Math.sin(a3),
    y: L.pelvis * Math.cos(a1) + L.lumbar * Math.cos(a2) + th * Math.cos(a3),
  };
}

/** Mengonversi titik pinggul–lutut–pergelangan (sagital) ke sudut relatif rig. */
function setLeg(pose: Pose, side: Side, hip: P2, knee: P2, ankle: P2, footRot: number) {
  const p = pose.pelvisTilt;
  const t = angleFromDown(hip, knee);
  const u = angleFromDown(knee, ankle);
  pose.hip[side].flex = t + p;
  pose.knee[side] = t - u;
  pose.ankle[side] = -u - footRot;
}

/** Menyusutkan panjang tulang ke proyeksi sagital bila tungkai abduksi. */
function stanceAbduction(stance: number, legLen: number): number {
  return Math.asin(clamp((stance / 2 - L.hipHalfWidth) / legLen, -0.2, 0.8));
}

function finish(
  pose: Pose,
  bar: Vector3 | null,
  balanced: boolean,
  midfootZ: number,
): MovementFrame {
  return {
    pose,
    skeleton: computeSkeleton(pose),
    bar,
    midfoot: new Vector3(0, 0, midfootZ),
    balanced,
  };
}

function squat(prm: MovementParams, phase: number, f: Faults): MovementFrame {
  const pose = neutralPose();
  const abd = stanceAbduction(prm.stance, L.thigh + L.shank);
  const c = Math.cos(abd);
  const Lt = L.thigh * c;
  const Ls = L.shank * c;
  const t = phase * prm.depth * 118 * DEG; // sudut paha dari vertikal
  const kTotal = lerp(4 * DEG, prm.torso * DEG, Math.min(1, phase * 1.15));
  const wink = ((f.buttWink ?? 0) * Math.max(0, phase - 0.6)) / 0.4;
  pose.lumbarFlex = wink * 0.5;
  pose.thoracicFlex = 0.04;
  pose.pelvisTilt = kTotal - pose.lumbarFlex - pose.thoracicFlex;

  const xm = MIDFOOT_OFFSET;
  // posisi barbel relatif pinggul (high-bar di punggung atas)
  const Lb = L.pelvis + L.lumbar + 0.86 * L.thorax;
  const barBack = 0.075;
  const sinS = (xm + Lt * Math.sin(t) - Lb * Math.sin(kTotal) + barBack * Math.cos(kTotal)) / Ls;
  const sRaw = Math.asin(clamp(sinS, -1, 1));
  const s = clamp(sRaw, -4 * DEG, 42 * DEG);
  const balanced = Math.abs(sRaw - s) < 1.5 * DEG && Math.abs(sinS) <= 1;

  const ankle: P2 = { z: 0, y: ANKLE_Y };
  const knee: P2 = { z: ankle.z + Ls * Math.sin(s), y: ankle.y + Ls * Math.cos(s) };
  const hip: P2 = { z: knee.z - Lt * Math.sin(t), y: knee.y + Lt * Math.cos(t) };
  pose.root = [0, hip.y, hip.z];
  const valg = (f.valgus ?? 0) * Math.sin(Math.min(1, phase * 1.2) * Math.PI * 0.5) * 0.32;
  for (const side of ['l', 'r'] as const) {
    setLeg(pose, side, hip, knee, ankle, 0);
    pose.hip[side].abd = abd + 0.12 * Math.sin(t);
    pose.kneeValgus[side] = valg;
    // tangan memegang barbel di punggung atas
    pose.shoulder[side] = { flex: -0.25, abd: 1.25 };
    pose.elbow[side] = 2.1;
  }
  pose.neckFlex = -pose.pelvisTilt * 0.5;
  const fr = finish(pose, null, balanced, xm);
  const bar = fr.skeleton.thorax.start.clone().lerp(fr.skeleton.thorax.end, 0.86);
  bar.add(new Vector3(0, 0, -barBack).applyQuaternion(fr.skeleton.thorax.quat));
  fr.bar = prm.load > 0 ? bar : null;
  return fr;
}

function hinge(prm: MovementParams, phase: number, f: Faults): MovementFrame {
  const pose = neutralPose();
  const abd = stanceAbduction(prm.stance, L.thigh + L.shank);
  const c = Math.cos(abd);
  const Lt = L.thigh * c;
  const Ls = L.shank * c;
  const k = phase * prm.torso * DEG;
  pose.thoracicFlex = 0.05;
  pose.pelvisTilt = k - pose.thoracicFlex;
  const trunk = trunkToShoulder(pose.pelvisTilt, 0, pose.thoracicFlex);

  const ankle: P2 = { z: 0, y: ANKLE_Y };
  const lockHip: P2 = { z: 0.0, y: ANKLE_Y + Lt + Ls - 0.005 };
  const lockBarY = lockHip.y + trunkToShoulder(0, 0, 0.05).y - ARM_LEN;
  const bottomBarY = lerp(0.62, 0.225, prm.depth);
  const barY = lerp(lockBarY, bottomBarY, phase);
  const xm = MIDFOOT_OFFSET;
  const shoulder: P2 = { z: xm + 0.02 * phase, y: barY + ARM_LEN };
  let hip: P2 = { z: shoulder.z - trunk.z, y: shoulder.y - trunk.y };
  const sol = solveTwoBone2D(hip, ankle, Lt, Ls, 1);
  // bila tak terjangkau, pinggul diturunkan agar tungkai lurus tetap tersambung ke pergelangan
  if (!sol.reachable) {
    const dz = hip.z - ankle.z;
    const dy = Math.sqrt(Math.max((Lt + Ls) ** 2 - dz * dz, 0)) - 0.002;
    hip = { z: hip.z, y: ankle.y + dy };
  }
  const leg = solveTwoBone2D(hip, ankle, Lt, Ls, 1);
  pose.root = [0, hip.y, hip.z];

  // kesalahan: punggung membulat (tanpa memindah pinggul) → bahu & barbel maju
  const r = (f.rounding ?? 0) * phase;
  pose.lumbarFlex += 0.55 * r;
  pose.thoracicFlex += 0.35 * r;
  pose.neckFlex = -(k + 0.9 * r) * 0.55;

  for (const side of ['l', 'r'] as const) {
    setLeg(pose, side, hip, leg.mid, ankle, 0);
    pose.hip[side].abd = abd;
    const torsoWorld = pose.pelvisTilt + pose.lumbarFlex + pose.thoracicFlex;
    pose.shoulder[side] = { flex: torsoWorld, abd: 0.1 };
    pose.elbow[side] = 0;
  }
  const fr = finish(pose, null, sol.reachable, xm);
  const hl = fr.skeleton.hand_l;
  const hr = fr.skeleton.hand_r;
  const bar = hl.start
    .clone()
    .lerp(hl.end, 0.5)
    .add(hr.start.clone().lerp(hr.end, 0.5))
    .multiplyScalar(0.5);
  bar.x = 0;
  fr.bar = prm.load > 0 ? bar : null;
  fr.balanced = Math.abs(bar.z - xm) < 0.05;
  return fr;
}

function lunge(prm: MovementParams, phase: number): MovementFrame {
  const pose = neutralPose();
  const step = prm.stance;
  const front: P2 = { z: step / 2, y: ANKLE_Y };
  const backToeZ = -step / 2;
  const backFootRot = 0.95; // telapak belakang jinjit (plantarfleksi)
  const back: P2 = {
    z: backToeZ - L.foot * Math.cos(backFootRot - 0.39),
    y: 0.015 + L.foot * Math.sin(backFootRot - 0.39) + 0.02,
  };
  const legLen = L.thigh + L.shank;
  // pinggul kira-kira satu panjang paha di belakang pergelangan depan → tulang kering depan ≈ vertikal di bawah
  const hipZ = front.z - L.thigh * 1.03;
  const reachY = (a: P2) => a.y + Math.sqrt(Math.max((legLen * 0.985) ** 2 - (hipZ - a.z) ** 2, 0));
  const topY = Math.min(reachY(front), reachY(back));
  const bottomY = 0.47;
  const hipY = lerp(topY, lerp(topY, bottomY, prm.depth), phase);
  const hip: P2 = { z: hipZ, y: hipY };
  pose.pelvisTilt = prm.torso * DEG;
  pose.thoracicFlex = 0.02;
  pose.root = [0, hip.y, hip.z];
  const fl = solveTwoBone2D(hip, front, L.thigh, L.shank, 1);
  const bl = solveTwoBone2D(hip, back, L.thigh, L.shank, 1);
  setLeg(pose, 'l', hip, fl.mid, fl.end, 0);
  setLeg(pose, 'r', hip, bl.mid, bl.end, backFootRot);
  pose.hip.l.abd = 0.07;
  pose.hip.r.abd = 0.07;
  for (const side of ['l', 'r'] as const) {
    pose.shoulder[side] = { flex: pose.pelvisTilt + 0.05, abd: 0.15 };
    pose.elbow[side] = 0.15;
  }
  const fr = finish(pose, null, fl.reachable && bl.reachable, front.z + MIDFOOT_OFFSET);
  if (prm.load > 0) {
    // dumbel di kedua tangan: diwakili titik tengah kedua tangan
    const hl = fr.skeleton.hand_l;
    const hr = fr.skeleton.hand_r;
    fr.bar = hl.end.clone().add(hr.end).multiplyScalar(0.5);
  }
  return fr;
}

function ohp(prm: MovementParams, phase: number): MovementFrame {
  const pose = neutralPose();
  const abd = stanceAbduction(prm.stance, L.thigh + L.shank);
  pose.hip.l.abd = abd;
  pose.hip.r.abd = abd;
  // fase 0 = barbel di bawah (rak depan), 1 = terkunci di atas kepala
  const lean = prm.torso * DEG * (1 - 0.5 * phase);
  pose.pelvisTilt = lean * 0.4;
  pose.lumbarFlex = lean * 0.6;
  pose.thoracicFlex = 0;
  const hipY = ANKLE_Y + (L.thigh + L.shank) * Math.cos(abd) - 0.004;
  const hipZ = -Math.sin(lean) * 0.12;
  pose.root = [0, hipY, hipZ];
  pose.neckFlex = -lean * 0.3 - 0.1 * (1 - phase);
  // tungkai lurus vertikal
  for (const side of ['l', 'r'] as const) {
    pose.hip[side].flex = pose.pelvisTilt;
    pose.knee[side] = 0;
    pose.ankle[side] = 0;
  }
  const base = computeSkeleton(pose);
  const sh = base.upperArm_l.start;
  const shoulder: P2 = { z: sh.z, y: sh.y };
  const xm = MIDFOOT_OFFSET;
  const armAbd = 0.42;
  const ca = Math.cos(armAbd);
  const lo = { z: shoulder.z + 0.1, y: shoulder.y + 0.02 };
  const topReach = (L.upperArm + L.forearm) * ca * 0.995;
  const hi = {
    z: xm,
    y: shoulder.y + Math.sqrt(Math.max(topReach ** 2 - (xm - shoulder.z) ** 2, 0)),
  };
  const p = phase * prm.depth;
  const hand: P2 = { z: lerp(lo.z, hi.z, p), y: lerp(lo.y, hi.y, p) };
  const arm = solveTwoBone2D(shoulder, hand, L.upperArm * ca, L.forearm * ca, -1);
  const theta = pose.pelvisTilt + pose.lumbarFlex + pose.thoracicFlex;
  const phi1 = angleFromDown(shoulder, arm.mid);
  const phi2 = angleFromDown(arm.mid, arm.end);
  for (const side of ['l', 'r'] as const) {
    pose.shoulder[side] = { flex: phi1 + theta, abd: armAbd };
    pose.elbow[side] = phi2 - phi1;
  }
  const fr = finish(pose, null, true, xm);
  const hl = fr.skeleton.forearm_l.end;
  const hr = fr.skeleton.forearm_r.end;
  const bar = hl.clone().add(hr).multiplyScalar(0.5);
  fr.bar = prm.load > 0 ? bar : null;
  fr.balanced = Math.abs(bar.z - xm) < 0.08;
  return fr;
}

/** Bench press berbaring (hanya untuk peragaan Benar vs Salah). Fase 0 = atas, 1 = bawah. */
export function benchFrame(phase: number, f: Faults): MovementFrame {
  const pose = neutralPose();
  pose.pitch = -Math.PI / 2;
  pose.root = [0, 0.56, 0.45];
  for (const side of ['l', 'r'] as const) {
    pose.hip[side] = { flex: 0.35, abd: 0.22 };
    pose.knee[side] = 1.75;
    pose.ankle[side] = 0.25;
  }
  const flare = f.elbowFlare ?? 0;
  const abdBottom = lerp(0.8, 1.45, flare);
  for (const side of ['l', 'r'] as const) {
    pose.shoulder[side] = {
      flex: lerp(Math.PI / 2, -0.25, phase),
      abd: lerp(0.28, abdBottom, phase),
    };
    pose.elbow[side] = lerp(0.05, 1.55, phase);
  }
  const fr = finish(pose, null, true, 0);
  const hl = fr.skeleton.forearm_l.end;
  const hr = fr.skeleton.forearm_r.end;
  fr.bar = hl.clone().add(hr).multiplyScalar(0.5);
  return fr;
}

export function movementFrame(
  pattern: DemoPattern,
  params: MovementParams,
  phase: number,
  faults: Faults = {},
): MovementFrame {
  const p = clamp(phase, 0, 1);
  switch (pattern) {
    case 'squat':
      return squat(params, p, faults);
    case 'hinge':
      return hinge(params, p, faults);
    case 'lunge':
      return lunge(params, p);
    case 'ohp':
      return ohp(params, p);
    case 'bench':
      return benchFrame(p, faults);
  }
}

/**
 * Fase berdasarkan waktu dengan tempo (detik per repetisi): turun (eksentrik) 55%, naik 45%,
 * dengan easing halus. Untuk OHP arah dibalik karena posisi awal di bawah.
 */
export function phaseAt(timeSec: number, tempo: number): number {
  const cyc = (((timeSec % tempo) + tempo) % tempo) / tempo;
  const down = 0.55;
  const raw = cyc < down ? cyc / down : 1 - (cyc - down) / (1 - down);
  return 0.5 - 0.5 * Math.cos(raw * Math.PI);
}
