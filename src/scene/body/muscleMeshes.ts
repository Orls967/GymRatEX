import { MUSCLES } from '../../content/muscles';
import { boneLocalPoint, type BoneName, type Segment, type Side } from '../../lib/rig';
import { Vector3 } from 'three';
import { MUSCLE_SHAPES, resolveBone, type Belly } from './muscleGeometry';

export interface MuscleMeshDef {
  key: string;
  muscleId: string;
  side: Side;
  belly: Belly;
  layer: 1 | 2 | 3;
}

export const MUSCLE_MESHES: MuscleMeshDef[] = MUSCLES.flatMap((m) => {
  const shape = MUSCLE_SHAPES[m.id];
  if (!shape) return [];
  const sides: Side[] = shape.bilateral ? ['l', 'r'] : ['l'];
  return sides.flatMap((side) =>
    shape.bellies.map((belly, i) => ({
      key: `${m.id}:${side}:${i}`,
      muscleId: m.id,
      side,
      belly,
      layer: m.layer,
    })),
  );
});

export function anchorPoint(
  seg: Segment,
  side: Side,
  off: [number, number],
  t: number,
  isMidline: boolean,
): Vector3 {
  const sg = side === 'l' ? 1 : -1;
  // tulang garis tengah & tulang sisi kanan: offset lateral dicerminkan untuk sisi kanan
  const x = isMidline || side === 'r' ? off[0] * sg : off[0];
  return boneLocalPoint(seg, t, [x, off[1]]);
}

/** Titik tengah (dunia) otot untuk kamera fokus. */
export function muscleCentroid(sk: Record<BoneName, Segment>, muscleId: string): Vector3 | null {
  const defs = MUSCLE_MESHES.filter((d) => d.muscleId === muscleId);
  if (defs.length === 0) return null;
  const c = new Vector3();
  for (const def of defs) {
    const segA = sk[resolveBone(def.belly.a.bone, def.side)];
    const segB = sk[resolveBone(def.belly.b.bone, def.side)];
    c.add(
      anchorPoint(segA, def.side, def.belly.a.off, def.belly.a.t, !def.belly.a.bone.endsWith('_S')),
    );
    c.add(
      anchorPoint(segB, def.side, def.belly.b.off, def.belly.b.t, !def.belly.b.bone.endsWith('_S')),
    );
  }
  return c.multiplyScalar(1 / (defs.length * 2));
}

export const PROCEDURAL_MUSCLE_IDS = [...new Set(MUSCLE_MESHES.map((d) => d.muscleId))];
