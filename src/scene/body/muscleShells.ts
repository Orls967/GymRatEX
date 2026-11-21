import { Vector3 } from 'three';
import { MUSCLES } from '../../content/muscles';
import { type BoneName, type Side } from '../../lib/rig';
import { anchorPoint } from './muscleMeshes';
import { MUSCLE_SHAPES, resolveBone } from './muscleGeometry';
import { REST_SKELETON, getBodyAsset } from './skin';

/**
 * Otot sebagai tambalan permukaan: bagian kulit tubuh yang berada di atas perut otot
 * ditebalkan sedikit sepanjang normal, sehingga otot MENEMPEL pada tubuh dan ikut ter-skin.
 * Bentuk tambalan mengikuti jenis otot: fusiform (gelendong), kipas, lembaran, atau pita.
 * Posisi & ukuran berasal dari jangkar di muscleGeometry.ts (stilisasi, bukan data klinis).
 */
export type MuscleKind = 'fusiform' | 'fan' | 'sheet' | 'strap';

export const MUSCLE_KIND: Record<string, MuscleKind> = {
  'pectoralis-major': 'fan',
  'pectoralis-minor': 'fan',
  'serratus-anterior': 'fan',
  'deltoid-anterior': 'fan',
  'deltoid-lateral': 'fan',
  'deltoid-posterior': 'fan',
  'rotator-cuff': 'fan',
  'biceps-brachii': 'fusiform',
  brachialis: 'fusiform',
  'triceps-brachii': 'fusiform',
  brachioradialis: 'fusiform',
  'forearm-flexors': 'fusiform',
  'forearm-extensors': 'fusiform',
  'rectus-abdominis': 'strap',
  'obliques-external': 'sheet',
  'obliques-internal': 'sheet',
  'transversus-abdominis': 'sheet',
  trapezius: 'sheet',
  'latissimus-dorsi': 'fan',
  rhomboids: 'sheet',
  'erector-spinae': 'strap',
  multifidus: 'strap',
  'quadratus-lumborum': 'sheet',
  'gluteus-maximus': 'sheet',
  'gluteus-medius': 'fan',
  iliopsoas: 'fusiform',
  adductors: 'fan',
  'rectus-femoris': 'fusiform',
  'vastus-lateralis': 'fusiform',
  'vastus-medialis': 'fusiform',
  'vastus-intermedius': 'fusiform',
  hamstrings: 'fusiform',
  gastrocnemius: 'fusiform',
  soleus: 'fusiform',
  'tibialis-anterior': 'fusiform',
};

const H_FACTOR: Record<MuscleKind, number> = { fusiform: 0.5, fan: 0.34, sheet: 0.3, strap: 0.38 };

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

/** Lebar relatif sepanjang otot (s: 0 = origo, 1 = insersio). */
function widthAt(kind: MuscleKind, s: number): number {
  const sn = Math.sin(Math.PI * clamp01(s));
  switch (kind) {
    case 'fusiform':
      return Math.max(0.28, Math.pow(sn, 0.55));
    case 'fan':
      return 1.0 - 0.7 * s * s;
    case 'sheet':
      return 0.7 + 0.3 * sn;
    case 'strap':
      return 0.85 + 0.15 * sn;
  }
}

function heightAt(kind: MuscleKind, s: number): number {
  const sn = Math.sin(Math.PI * clamp01(s));
  switch (kind) {
    case 'fusiform':
      return 0.45 + 0.55 * Math.pow(sn, 0.8);
    case 'fan':
      return 1.0 - 0.55 * clamp01(s);
    case 'sheet':
      return 0.7 + 0.3 * sn;
    case 'strap':
      return 0.8 + 0.2 * sn;
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface MuscleRange {
  muscleId: string;
  layer: 1 | 2 | 3;
  triStart: number;
  triCount: number;
}

export interface MuscleShellAsset {
  positions: Float32Array;
  normals: Float32Array;
  skinIndex: Uint16Array;
  skinWeight: Float32Array;
  /** per titik: indeks otot dalam `ranges` (untuk pewarnaan) */
  /** per titik: keanggotaan 0..1; fragmen < 0,5 dibuang di shader sehingga tepi otot halus */
  member: Float32Array;
  owner: Uint16Array;
  /** per titik: 0 (superfisial) .. 2 (dalam), untuk pengupasan lapisan */
  depth: Float32Array;
  indices: Uint32Array;
  ranges: MuscleRange[];
  /** indeks awal (dalam elemen indeks) tiap lapisan minimum */
  layerStart: Record<1 | 2 | 3, number>;
}

let cached: MuscleShellAsset | null = null;

export function getMuscleShells(): MuscleShellAsset {
  cached ??= build();
  return cached;
}

export function primeMuscleShells(a: MuscleShellAsset): void {
  cached = a;
}

function build(): MuscleShellAsset {
  const body = getBodyAsset();
  const nv = body.positions.length / 3;
  const defs = MUSCLES.filter((m) => MUSCLE_SHAPES[m.id]).sort((a, b) => a.layer - b.layer);

  const P: number[] = [];
  const N: number[] = [];
  const SI: number[] = [];
  const SW: number[] = [];
  const OW: number[] = [];
  const MB: number[] = [];
  const DP: number[] = [];
  const IDX: number[] = [];
  const ranges: MuscleRange[] = [];
  const layerStart: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  let seenLayer = 0;

  const v = new Vector3();
  const u = new Vector3();
  const o = new Vector3();
  const w = new Vector3();
  const q = new Vector3();
  const n = new Vector3();

  for (const def of defs) {
    const shape = MUSCLE_SHAPES[def.id];
    if (!shape) continue;
    if (def.layer > seenLayer) {
      for (let l = seenLayer + 1; l <= def.layer; l++) layerStart[l as 1 | 2 | 3] = IDX.length;
      seenLayer = def.layer;
    }
    const kind = MUSCLE_KIND[def.id] ?? 'fusiform';
    const sides: Side[] = shape.bilateral ? ['l', 'r'] : ['l'];
    const ownerIdx = ranges.length;
    const triStart = IDX.length / 3;
    for (const side of sides) {
      const m = new Float32Array(nv);
      const h = new Float32Array(nv);
      for (const belly of shape.bellies) {
        const boneA = resolveBone(belly.a.bone, side) as BoneName;
        const boneB = resolveBone(belly.b.bone, side) as BoneName;
        const segA = REST_SKELETON[boneA];
        const segB = REST_SKELETON[boneB];
        const pa = anchorPoint(segA, side, belly.a.off, belly.a.t, !belly.a.bone.endsWith('_S'));
        const pb = anchorPoint(segB, side, belly.b.off, belly.b.t, !belly.b.bone.endsWith('_S'));
        const L = pa.distanceTo(pb);
        if (L < 1e-4) continue;
        u.copy(pb).sub(pa).divideScalar(L);
        const axisMid = segA.start
          .clone()
          .lerp(segA.end, belly.a.t)
          .add(segB.start.clone().lerp(segB.end, belly.b.t))
          .multiplyScalar(0.5);
        o.copy(pa).add(pb).multiplyScalar(0.5).sub(axisMid);
        if (o.length() < 0.008) o.set(0, 0, 1).applyQuaternion(segA.quat);
        o.addScaledVector(u, -o.dot(u)).normalize();
        w.crossVectors(o, u).normalize();
        const rw = belly.r[0];
        const rz = belly.r[1];
        const hMax = Math.min(Math.max(rz * H_FACTOR[kind], 0.004), 0.016);
        const infl = 0.003 + 0.18 * rw;
        for (let i = 0; i < nv; i++) {
          v.set(
            body.positions[i * 3] as number,
            body.positions[i * 3 + 1] as number,
            body.positions[i * 3 + 2] as number,
          );
          q.copy(v).sub(pa);
          const s = q.dot(u) / L;
          if (s < -0.08 || s > 1.08) continue;
          n.set(
            body.normals[i * 3] as number,
            body.normals[i * 3 + 1] as number,
            body.normals[i * 3 + 2] as number,
          );
          const mn = smooth(0.2, 0.5, n.dot(o));
          if (mn <= 0) continue;
          q.addScaledVector(u, -s * L);
          const qo = q.dot(o);
          const qw = q.dot(w);
          const rws = rw * widthAt(kind, clamp01(s)) + infl;
          const mw = 1 - smooth(0.6, 1.0, Math.abs(qw) / rws);
          const mo = 1 - smooth(0.7, 1.0, Math.abs(qo) / (rz + 0.04 + (def.layer - 1) * 0.04));
          const ms = smooth(-0.08, 0.04, s) * (1 - smooth(0.96, 1.08, s));
          const mm = mw * mo * mn * ms;
          if (mm <= 0.01) continue;
          const hh = hMax * heightAt(kind, clamp01(s)) * smooth(0.3, 1, mm);
          if (mm > (m[i] as number)) m[i] = mm;
          if (hh > (h[i] as number)) h[i] = hh;
        }
      }
      const remap = new Int32Array(nv).fill(-1);
      const layerK = def.layer === 1 ? 1 : def.layer === 2 ? 0.55 : 0.3;
      const base = 0.0025 + (ownerIdx % 7) * 0.00012;
      for (let t = 0; t < body.indices.length; t += 3) {
        const a = body.indices[t] as number;
        const b = body.indices[t + 1] as number;
        const c = body.indices[t + 2] as number;
        if (Math.max(m[a] as number, m[b] as number, m[c] as number) < 0.45) continue;
        for (const vi of [a, b, c]) {
          if ((remap[vi] as number) < 0) {
            remap[vi] = P.length / 3;
            const d = base + (h[vi] as number) * layerK;
            const nx = body.normals[vi * 3] as number;
            const ny = body.normals[vi * 3 + 1] as number;
            const nz = body.normals[vi * 3 + 2] as number;
            P.push(
              (body.positions[vi * 3] as number) + nx * d,
              (body.positions[vi * 3 + 1] as number) + ny * d,
              (body.positions[vi * 3 + 2] as number) + nz * d,
            );
            N.push(nx, ny, nz);
            for (let k = 0; k < 4; k++) {
              SI.push(body.skinIndex[vi * 4 + k] as number);
              SW.push(body.skinWeight[vi * 4 + k] as number);
            }
            OW.push(ownerIdx);
            MB.push(m[vi] as number);
            DP.push(def.layer - 1);
          }
        }
        IDX.push(remap[a] as number, remap[b] as number, remap[c] as number);
      }
    }
    ranges.push({
      muscleId: def.id,
      layer: def.layer,
      triStart,
      triCount: IDX.length / 3 - triStart,
    });
  }
  for (let l = seenLayer + 1; l <= 3; l++) layerStart[l as 1 | 2 | 3] = IDX.length;

  return {
    positions: new Float32Array(P),
    normals: new Float32Array(N),
    skinIndex: new Uint16Array(SI),
    skinWeight: new Float32Array(SW),
    member: new Float32Array(MB),
    owner: new Uint16Array(OW),
    depth: new Float32Array(DP),
    indices: new Uint32Array(IDX),
    ranges,
    layerStart,
  };
}
