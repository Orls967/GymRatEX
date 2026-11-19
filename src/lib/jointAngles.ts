import { Vector3 } from 'three';
import type { Skeleton } from './rig';

const DEG = 180 / Math.PI;

/** Sudut dalam (interior) di b untuk titik a–b–c, derajat. 180 = lurus. */
export function interiorAngle(a: Vector3, b: Vector3, c: Vector3): number {
  const v1 = a.clone().sub(b);
  const v2 = c.clone().sub(b);
  const d = v1.length() * v2.length();
  if (d < 1e-9) return 180;
  return Math.acos(Math.min(1, Math.max(-1, v1.dot(v2) / d))) * DEG;
}

export interface Angles {
  knee: number;
  hip: number;
  /** Kemiringan torso dari vertikal (derajat). */
  torso: number;
  elbow: number;
}

export function skeletonAngles(sk: Skeleton, side: 'l' | 'r' = 'l'): Angles {
  const shoulder = sk[`upperArm_${side}`].start;
  const hip = sk[`thigh_${side}`].start;
  const knee = sk[`thigh_${side}`].end;
  const ankle = sk[`shank_${side}`].end;
  const trunk = sk.thorax.end.clone().sub(sk.pelvis.start);
  const torso = Math.atan2(Math.hypot(trunk.x, trunk.z), trunk.y) * DEG;
  return {
    knee: interiorAngle(hip, knee, ankle),
    hip: interiorAngle(shoulder, hip, knee),
    torso,
    elbow: interiorAngle(shoulder, sk[`forearm_${side}`].start, sk[`forearm_${side}`].end),
  };
}
