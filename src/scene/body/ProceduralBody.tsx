import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  CapsuleGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  Matrix4,
} from 'three';
import type { BoneName, Side } from '../../lib/rig';
import { useSceneTheme } from '../sceneTheme';
import { resolveBone } from './muscleGeometry';
import { MUSCLE_MESHES, anchorPoint } from './muscleMeshes';
import type { BodyModelProps, Intensity } from './types';

const UNIT_SPHERE = new SphereGeometry(1, 24, 16);

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _m = new Matrix4();
const _tw = new Quaternion();
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);

/** Orientasi dengan sumbu Y sepanjang dir dan sumbu Z sedekat mungkin ke ref. */
function orient(out: Quaternion, dir: Vector3, ref: Vector3): Quaternion {
  _y.copy(dir).normalize();
  _z.copy(ref).addScaledVector(_y, -ref.dot(_y));
  if (_z.lengthSq() < 1e-8) _z.set(1, 0, 0).cross(_y);
  _z.normalize();
  _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z);
  return out.setFromRotationMatrix(_m);
}

interface BasePart {
  bone: BoneName;
  /** jari-jari [x, z] dan perpanjangan ujung */
  r: [number, number];
  shape: 'capsule' | 'ellipsoid';
  /** pemendekan relatif di ujung (agar tidak tumpang tindih di sendi) */
  inset?: number;
  /** sumbu referensi untuk penampang: anterior (default) atau atas lokal */
  refUp?: boolean;
  /** skala panjang ellipsoid relatif terhadap panjang tulang */
  lenScale?: number;
}

const SIDED = (s: Side): BasePart[] => [
  { bone: `upperArm_${s}`, r: [0.036, 0.036], shape: 'capsule', inset: 0.02 },
  { bone: `forearm_${s}`, r: [0.03, 0.028], shape: 'capsule', inset: 0.02 },
  { bone: `hand_${s}`, r: [0.026, 0.014], shape: 'ellipsoid', lenScale: 0.6 },
  { bone: `thigh_${s}`, r: [0.06, 0.06], shape: 'capsule', inset: 0.04 },
  { bone: `shank_${s}`, r: [0.042, 0.042], shape: 'capsule', inset: 0.03 },
  { bone: `foot_${s}`, r: [0.042, 0.03], shape: 'ellipsoid', refUp: true, lenScale: 0.62 },
  { bone: `clavicle_${s}`, r: [0.03, 0.03], shape: 'capsule', inset: 0.02 },
];

const BASE_PARTS: BasePart[] = [
  { bone: 'pelvis', r: [0.15, 0.1], shape: 'ellipsoid', lenScale: 1.25 },
  { bone: 'lumbar', r: [0.125, 0.085], shape: 'ellipsoid', lenScale: 0.9 },
  { bone: 'thorax', r: [0.15, 0.1], shape: 'ellipsoid', lenScale: 0.66 },
  { bone: 'neck', r: [0.045, 0.045], shape: 'capsule', inset: 0.0 },
  { bone: 'head', r: [0.072, 0.088], shape: 'ellipsoid', lenScale: 0.86 },
  ...SIDED('l'),
  ...SIDED('r'),
];

export function ProceduralBody({
  skeleton,
  intensities,
  selected = null,
  hovered = null,
  minLayer = 1,
  dimInactive = false,
  interactive = true,
  onHover,
  onSelect,
  showMuscles = true,
}: BodyModelProps) {
  const theme = useSceneTheme();
  const invalidate = useThree((s) => s.invalidate);
  const baseRefs = useRef<(Mesh | null)[]>([]);
  const muscleRefs = useRef<(Mesh | null)[]>([]);

  const baseGeometries = useMemo(
    () =>
      BASE_PARTS.map((p) => {
        if (p.shape !== 'capsule') return UNIT_SPHERE;
        const len = skeleton.current[p.bone].length;
        const body = Math.max(len - 2 * (p.inset ?? 0) - 2 * p.r[0], 0.001);
        return new CapsuleGeometry(p.r[0], body, 6, 14);
      }),
    // geometri hanya bergantung pada panjang tulang yang konstan
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const baseMaterial = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 }),
    [],
  );
  const muscleMaterials = useMemo(
    () => MUSCLE_MESHES.map(() => new MeshStandardMaterial({ roughness: 0.55, metalness: 0.0 })),
    [],
  );

  useEffect(() => {
    baseMaterial.color.set(theme.mannequin);
  }, [baseMaterial, theme]);

  // Warna otot: dihitung ulang hanya saat status berubah, bukan tiap frame.
  useEffect(() => {
    const hasIntensity = !!intensities && Object.keys(intensities).length > 0;
    const accent = new Color(theme.accent);
    const hl = new Color(theme.highlight);
    MUSCLE_MESHES.forEach((def, i) => {
      const mat = muscleMaterials[i];
      if (!mat) return;
      const level: Intensity = intensities?.[def.muscleId] ?? 0;
      let color: string;
      if (level > 0) color = theme.intensity[level];
      else if (hasIntensity && dimInactive) color = theme.intensity[0];
      else color = def.layer >= 2 ? theme.muscleDeep : theme.muscle;
      mat.color.set(color);
      const isSel = selected === def.muscleId;
      const isHov = hovered === def.muscleId;
      mat.emissive.copy(isSel ? accent : isHov ? hl : new Color(0x000000));
      mat.emissiveIntensity = isSel ? 0.55 : isHov ? 0.18 : 0;
    });
    invalidate();
  }, [intensities, selected, hovered, dimInactive, theme, muscleMaterials, invalidate]);

  useEffect(
    () => () => {
      baseMaterial.dispose();
      muscleMaterials.forEach((m) => m.dispose());
      baseGeometries.forEach((g) => g !== UNIT_SPHERE && g.dispose());
    },
    [baseMaterial, muscleMaterials, baseGeometries],
  );

  useFrame(() => {
    const sk = skeleton.current;
    BASE_PARTS.forEach((p, i) => {
      const mesh = baseRefs.current[i];
      if (!mesh) return;
      const seg = sk[p.bone];
      const dir = _x.copy(seg.end).sub(seg.start);
      const len = dir.length();
      const ref = (p.refUp ? Y : Z).clone().applyQuaternion(seg.quat);
      orient(mesh.quaternion, dir, ref);
      mesh.position.copy(seg.start).lerp(seg.end, 0.5);
      if (p.shape === 'capsule') {
        // panjang tulang konstan (rig kaku) → geometri kapsul dibuat sekali dengan ukuran sebenarnya
        mesh.scale.set(1, 1, p.r[1] / p.r[0]);
      } else {
        mesh.scale.set(p.r[0], (len * (p.lenScale ?? 1)) / 2 + 0.01, p.r[1]);
      }
    });
    MUSCLE_MESHES.forEach((def, i) => {
      const mesh = muscleRefs.current[i];
      if (!mesh) return;
      const boneA = resolveBone(def.belly.a.bone, def.side);
      const boneB = resolveBone(def.belly.b.bone, def.side);
      const segA = sk[boneA];
      const segB = sk[boneB];
      const pa = anchorPoint(
        segA,
        def.side,
        def.belly.a.off,
        def.belly.a.t,
        !def.belly.a.bone.endsWith('_S'),
      );
      const pb = anchorPoint(
        segB,
        def.side,
        def.belly.b.off,
        def.belly.b.t,
        !def.belly.b.bone.endsWith('_S'),
      );
      const dir = pb.clone().sub(pa);
      const len = dir.length();
      const ref = Z.clone().applyQuaternion(segA.quat);
      orient(mesh.quaternion, dir, ref);
      if (def.belly.twist) {
        _tw.setFromAxisAngle(Y, def.belly.twist * (def.side === 'l' ? 1 : -1));
        mesh.quaternion.multiply(_tw);
      }
      mesh.position.copy(pa).lerp(pb, 0.5);
      mesh.scale.set(def.belly.r[0], Math.max(len / 2, 0.01), def.belly.r[1]);
    });
  });

  const pointer = interactive
    ? (id: string) => ({
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover?.(id);
        },
        onPointerOut: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover?.(null);
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect?.(id, e);
        },
      })
    : () => ({});

  return (
    <group>
      {BASE_PARTS.map((p, i) => (
        <mesh
          key={p.bone}
          ref={(m) => {
            baseRefs.current[i] = m;
          }}
          geometry={baseGeometries[i]}
          material={baseMaterial}
          castShadow
          receiveShadow
        />
      ))}
      {showMuscles &&
        MUSCLE_MESHES.map((def, i) => (
          <mesh
            key={def.key}
            name={def.muscleId}
            ref={(m) => {
              muscleRefs.current[i] = m;
            }}
            visible={def.layer >= minLayer}
            geometry={UNIT_SPHERE}
            material={muscleMaterials[i]}
            castShadow
            {...pointer(def.muscleId)}
          />
        ))}
    </group>
  );
}
