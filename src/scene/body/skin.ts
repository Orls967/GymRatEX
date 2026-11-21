import { Matrix4, Quaternion, Vector3 } from 'three';
import {
  computeSkeleton,
  neutralPose,
  type BoneName,
  type Pose,
  type Segment,
  type Skeleton,
} from '../../lib/rig';
import { CORE_PROFILES, LIMB_PROFILES, denseProfile, type Ring } from './bodyShapes';

/**
 * Kulit tubuh tunggal.
 * 1. Tiap tulang punya fungsi jarak (SDF) dari profil penampangnya (bodyShapes.ts).
 * 2. Semua dilebur dengan smooth-union → satu permukaan tersambung (bahu, pinggul, leher menyatu).
 * 3. Permukaan diekstrak (surface nets) dalam pose istirahat (lengan sedikit terbuka).
 * 4. Tiap titik diberi bobot ke tulang terdekat → di-skin ke rig yang sama dengan seluruh aplikasi.
 * Hasil di-cache: dibangun sekali per sesi (~100–300 ms).
 */

export const BONES: readonly BoneName[] = [
  'pelvis',
  'lumbar',
  'thorax',
  'neck',
  'head',
  ...(['l', 'r'] as const).flatMap((s) => [
    `clavicle_${s}` as const,
    `upperArm_${s}` as const,
    `forearm_${s}` as const,
    `hand_${s}` as const,
    `thigh_${s}` as const,
    `shank_${s}` as const,
    `foot_${s}` as const,
  ]),
];

const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _m = new Matrix4();
const _ref = new Vector3();

/** Kerangka lokal tulang: Y sepanjang tulang, Z anterior (telapak kaki: Z = atas). */
export function boneQuat(out: Quaternion, seg: Segment, bone: BoneName): Quaternion {
  const dir = _y.copy(seg.end).sub(seg.start).normalize();
  const ref = _ref.copy(bone.startsWith('foot') ? Y : Z).applyQuaternion(seg.quat);
  _z.copy(ref).addScaledVector(dir, -ref.dot(dir));
  if (_z.lengthSq() < 1e-8) _z.set(1, 0, 0).cross(dir);
  _z.normalize();
  _x.crossVectors(dir, _z).normalize();
  _m.makeBasis(_x, dir, _z);
  return out.setFromRotationMatrix(_m);
}

export function boneFrame(out: Matrix4, seg: Segment, bone: BoneName): Matrix4 {
  const q = boneQuat(new Quaternion(), seg, bone);
  return out.compose(seg.start, q, new Vector3(1, 1, 1));
}

/** Pose istirahat pembuatan kulit: lengan & kaki sedikit terbuka agar tidak melebur ke badan. */
export function restPose(): Pose {
  const p = neutralPose();
  p.shoulder = { l: { flex: 0, abd: 0.42 }, r: { flex: 0, abd: 0.42 } };
  p.hip = { l: { flex: 0, abd: 0.07 }, r: { flex: 0, abd: 0.07 } };
  p.elbow = { l: 0.08, r: 0.08 };
  return p;
}

export const REST_SKELETON: Skeleton = computeSkeleton(restPose());

// ---------- SDF ----------
interface Prim {
  bone: BoneName;
  m: Float32Array; // inverse frame 3x4 (baris-mayor)
  prof: Float32Array;
  n: number;
  y0: number;
  y1: number;
  /** AABB dunia (diperbesar) untuk early-out */
  box: [number, number, number, number, number, number];
  /** blob elips (bukan loft) */
  ell?: [number, number, number, number, number, number];
}

const PROFILE_OF = (bone: BoneName): readonly Ring[] => {
  if (bone in CORE_PROFILES) return CORE_PROFILES[bone as keyof typeof CORE_PROFILES];
  const base = bone.replace(/_[lr]$/, '') as keyof typeof LIMB_PROFILES;
  return LIMB_PROFILES[base];
};

const _f = new Matrix4();
function makePrim(bone: BoneName): Prim {
  const seg = REST_SKELETON[bone];
  boneFrame(_f, seg, bone);
  const inv = _f.clone().invert();
  const e = inv.elements; // kolom-mayor
  const m = new Float32Array([
    e[0] as number,
    e[4] as number,
    e[8] as number,
    e[12] as number,
    e[1] as number,
    e[5] as number,
    e[9] as number,
    e[13] as number,
    e[2] as number,
    e[6] as number,
    e[10] as number,
    e[14] as number,
  ]);
  const rings = PROFILE_OF(bone);
  const prof = denseProfile(rings);
  const n = prof.length / 4;
  const y0 = prof[0] as number;
  const y1 = prof[(n - 1) * 4] as number;
  let maxR = 0;
  for (let i = 0; i < n; i++)
    maxR = Math.max(
      maxR,
      prof[i * 4 + 1] as number,
      Math.abs(prof[i * 4 + 2] as number) + Math.abs(prof[i * 4 + 3] as number),
    );
  const a = new Vector3(0, y0, 0).applyMatrix4(_f);
  const b = new Vector3(0, y1, 0).applyMatrix4(_f);
  const r = maxR + 0.03;
  const box: Prim['box'] = [
    Math.min(a.x, b.x) - r,
    Math.max(a.x, b.x) + r,
    Math.min(a.y, b.y) - r,
    Math.max(a.y, b.y) + r,
    Math.min(a.z, b.z) - r,
    Math.max(a.z, b.z) + r,
  ];
  return { bone, m, prof, n, y0, y1, box };
}

function makeEllipsoid(
  bone: BoneName,
  c: [number, number, number],
  r: [number, number, number],
): Prim {
  const p = makePrim(bone);
  p.ell = [c[0], c[1], c[2], r[0], r[1], r[2]];
  // AABB sekitar pusat blob
  const w = new Vector3(...c).applyMatrix4(_f.copy(boneFrameOf(bone)));
  const R = Math.max(...r) + 0.03;
  p.box = [w.x - R, w.x + R, w.y - R, w.y + R, w.z - R, w.z + R];
  return p;
}

function boneFrameOf(bone: BoneName): Matrix4 {
  return boneFrame(new Matrix4(), REST_SKELETON[bone], bone);
}

const BIG = 0.2;

function primDist(p: Prim, x: number, y: number, z: number): number {
  const b = p.box;
  const ox = Math.max(b[0] - x, 0, x - b[1]);
  const oy = Math.max(b[2] - y, 0, y - b[3]);
  const oz = Math.max(b[4] - z, 0, z - b[5]);
  if (ox > 0 || oy > 0 || oz > 0) return Math.hypot(ox, oy, oz) + 0.03;
  const m = p.m;
  const lx = (m[0] as number) * x + (m[1] as number) * y + (m[2] as number) * z + (m[3] as number);
  const ly = (m[4] as number) * x + (m[5] as number) * y + (m[6] as number) * z + (m[7] as number);
  const lz =
    (m[8] as number) * x + (m[9] as number) * y + (m[10] as number) * z + (m[11] as number);
  if (p.ell) {
    const e = p.ell;
    const nx = (lx - (e[0] as number)) / (e[3] as number);
    const ny = (ly - (e[1] as number)) / (e[4] as number);
    const nz = (lz - (e[2] as number)) / (e[5] as number);
    return (Math.hypot(nx, ny, nz) - 1) * Math.min(e[3] as number, e[4] as number, e[5] as number);
  }
  const yc = Math.min(Math.max(ly, p.y0), p.y1);
  const f = ((yc - p.y0) / (p.y1 - p.y0)) * (p.n - 1);
  const i = Math.min(Math.floor(f), p.n - 2);
  const t = f - i;
  const pr = p.prof;
  const rx = (pr[i * 4 + 1] as number) * (1 - t) + (pr[i * 4 + 5] as number) * t;
  const rz = (pr[i * 4 + 2] as number) * (1 - t) + (pr[i * 4 + 6] as number) * t;
  const cz = (pr[i * 4 + 3] as number) * (1 - t) + (pr[i * 4 + 7] as number) * t;
  const re = Math.min(rx, rz);
  const dy = ly - yc;
  const sx = (lx * re) / rx;
  const sz = ((lz - cz) * re) / rz;
  if (dy === 0) return Math.hypot(sx, sz) - re;
  return Math.hypot(sx, sz, dy) - re;
}

function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

const PRIMS: Prim[] = [
  ...BONES.map(makePrim),
  // bokong
  makeEllipsoid('pelvis', [0.08, -0.005, -0.07], [0.075, 0.085, 0.07]),
  makeEllipsoid('pelvis', [-0.08, -0.005, -0.07], [0.075, 0.085, 0.07]),
  // hidung & telinga
  makeEllipsoid('head', [0, 0.1, 0.092], [0.012, 0.02, 0.02]),
  makeEllipsoid('head', [0.076, 0.1, 0.0], [0.014, 0.03, 0.022]),
  makeEllipsoid('head', [-0.076, 0.1, 0.0], [0.014, 0.03, 0.022]),
];
const K = 0.03;

export function bodySdf(x: number, y: number, z: number): number {
  let d = BIG;
  for (const p of PRIMS) d = smin(d, primDist(p, x, y, z), K);
  return d;
}

// ---------- surface nets ----------
export interface BodyAsset {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  skinIndex: Uint16Array; // 4 per titik
  skinWeight: Float32Array; // 4 per titik
  /** 0..1: bagian bertubuh otot (badan/anggota) vs kepala/tangan/kaki */
  cover: Float32Array;
}

const STEP = 0.0135;
const BOUNDS = { x: [-0.62, 0.62], y: [-0.09, 1.86], z: [-0.2, 0.3] } as const;

function grad(x: number, y: number, z: number, out: Vector3): Vector3 {
  const h = 0.003;
  out.set(
    bodySdf(x + h, y, z) - bodySdf(x - h, y, z),
    bodySdf(x, y + h, z) - bodySdf(x, y - h, z),
    bodySdf(x, y, z + h) - bodySdf(x, y, z - h),
  );
  const l = out.length() || 1;
  return out.multiplyScalar(1 / l);
}

const COVERED = new Set([
  'pelvis',
  'lumbar',
  'thorax',
  'clavicle',
  'upperArm',
  'forearm',
  'thigh',
  'shank',
]);

function buildBody(): BodyAsset {
  const nx = Math.ceil((BOUNDS.x[1] - BOUNDS.x[0]) / STEP) + 2;
  const ny = Math.ceil((BOUNDS.y[1] - BOUNDS.y[0]) / STEP) + 2;
  const nz = Math.ceil((BOUNDS.z[1] - BOUNDS.z[0]) / STEP) + 2;
  const ox = BOUNDS.x[0];
  const oy = BOUNDS.y[0];
  const oz = BOUNDS.z[0];
  const val = new Float32Array(nx * ny * nz);
  const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const B = 4;
  const half = B * STEP * 0.5;
  for (let bk = 0; bk < nz; bk += B)
    for (let bj = 0; bj < ny; bj += B)
      for (let bi = 0; bi < nx; bi += B) {
        const cx = ox + (bi + B / 2) * STEP;
        const cy = oy + (bj + B / 2) * STEP;
        const cz = oz + (bk + B / 2) * STEP;
        const dc = bodySdf(cx, cy, cz);
        const skip = Math.abs(dc) > half * 1.9 + 0.01;
        for (let k = bk; k < Math.min(bk + B + 1, nz); k++)
          for (let j = bj; j < Math.min(bj + B + 1, ny); j++)
            for (let i = bi; i < Math.min(bi + B + 1, nx); i++) {
              const id = idx(i, j, k);
              if (skip) {
                if (val[id] === 0) val[id] = dc;
              } else {
                val[id] = bodySdf(ox + i * STEP, oy + j * STEP, oz + k * STEP);
              }
            }
      }

  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const corners = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ] as const;
  const edges = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ] as const;
  const g = new Vector3();
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        const v: number[] = [];
        for (let c = 0; c < 8; c++) {
          const o = corners[c] as readonly [number, number, number];
          const d = val[idx(i + o[0], j + o[1], k + o[2])] as number;
          v.push(d);
          if (d < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0,
          sy = 0,
          sz = 0,
          cnt = 0;
        for (const [a, b] of edges) {
          const da = v[a] as number;
          const db = v[b] as number;
          if (da < 0 === db < 0) continue;
          const t = da / (da - db);
          const oa = corners[a] as readonly [number, number, number];
          const ob = corners[b] as readonly [number, number, number];
          sx += oa[0] + (ob[0] - oa[0]) * t;
          sy += oa[1] + (ob[1] - oa[1]) * t;
          sz += oa[2] + (ob[2] - oa[2]) * t;
          cnt++;
        }
        let px = ox + (i + sx / cnt) * STEP;
        let py = oy + (j + sy / cnt) * STEP;
        let pz = oz + (k + sz / cnt) * STEP;
        // proyeksikan ke permukaan (2 langkah Newton)
        for (let it = 0; it < 2; it++) {
          const d = bodySdf(px, py, pz);
          grad(px, py, pz, g);
          px -= g.x * d;
          py -= g.y * d;
          pz -= g.z * d;
        }
        cellVert[idx(i, j, k)] = pos.length / 3;
        pos.push(px, py, pz);
      }

  const tris: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) tris.push(a, c, b, a, d, c);
    else tris.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const in0 = (val[idx(i, j, k)] as number) < 0;
        const cv = (a: number, b: number, c: number) => cellVert[idx(a, b, c)] as number;
        if ((val[idx(i + 1, j, k)] as number) < 0 !== in0)
          quad(cv(i, j - 1, k - 1), cv(i, j, k - 1), cv(i, j, k), cv(i, j - 1, k), !in0);
        if ((val[idx(i, j + 1, k)] as number) < 0 !== in0)
          quad(cv(i - 1, j, k - 1), cv(i - 1, j, k), cv(i, j, k), cv(i, j, k - 1), !in0);
        if ((val[idx(i, j, k + 1)] as number) < 0 !== in0)
          quad(cv(i - 1, j - 1, k), cv(i, j - 1, k), cv(i, j, k), cv(i - 1, j, k), !in0);
      }

  const nv = pos.length / 3;
  const positions = new Float32Array(pos);
  const normals = new Float32Array(nv * 3);
  const skinIndex = new Uint16Array(nv * 4);
  const skinWeight = new Float32Array(nv * 4);
  const cover = new Float32Array(nv);
  const dist = new Float32Array(BONES.length);
  const primOfBone = BONES.map((b) => PRIMS.find((p) => p.bone === b && !p.ell) as Prim);
  for (let v = 0; v < nv; v++) {
    const x = positions[v * 3] as number;
    const y = positions[v * 3 + 1] as number;
    const z = positions[v * 3 + 2] as number;
    grad(x, y, z, g);
    normals[v * 3] = g.x;
    normals[v * 3 + 1] = g.y;
    normals[v * 3 + 2] = g.z;
    let dmin = Infinity;
    for (let b = 0; b < BONES.length; b++) {
      const d = primDist(primOfBone[b] as Prim, x, y, z);
      dist[b] = d;
      if (d < dmin) dmin = d;
    }
    // bokong ikut panggul, hidung/telinga ikut kepala sudah tercakup oleh jarak ke tulangnya
    const cand: [number, number][] = [];
    for (let b = 0; b < BONES.length; b++) {
      const w = Math.exp(-((dist[b] as number) - dmin) / 0.016);
      if (w > 0.03) cand.push([b, w]);
    }
    cand.sort((a, b) => b[1] - a[1]);
    const top = cand.slice(0, 4);
    const sum = top.reduce((s, c) => s + c[1], 0);
    let cv = 0;
    for (let c = 0; c < 4; c++) {
      const e = top[c];
      skinIndex[v * 4 + c] = e ? e[0] : 0;
      skinWeight[v * 4 + c] = e ? e[1] / sum : 0;
      if (e && COVERED.has((BONES[e[0]] as BoneName).replace(/_[lr]$/, ''))) cv += e[1] / sum;
    }
    cover[v] = cv;
  }
  return { positions, normals, indices: new Uint32Array(tris), skinIndex, skinWeight, cover };
}

let cached: BodyAsset | null = null;
export function getBodyAsset(): BodyAsset {
  cached ??= buildBody();
  return cached;
}
/** Isi cache dengan hasil yang dibangun di Web Worker. */
export function primeBodyAsset(a: BodyAsset): void {
  cached = a;
}
