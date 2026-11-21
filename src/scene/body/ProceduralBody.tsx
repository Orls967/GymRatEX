import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  CanvasTexture,
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
import { CORE_PROFILES, LIMB_PROFILES, loft, type Ring } from './bodyShapes';
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
  rings: readonly Ring[];
  /** bagian bertubuh otot (diberi warna jaringan saat otot ditampilkan) */
  covered?: boolean;
  /** sumbu referensi penampang: anterior (default) atau "atas" lokal (telapak kaki) */
  refUp?: boolean;
}

const SIDED = (s: Side): BasePart[] => [
  { bone: `clavicle_${s}`, rings: LIMB_PROFILES.clavicle, covered: true },
  { bone: `upperArm_${s}`, rings: LIMB_PROFILES.upperArm, covered: true },
  { bone: `forearm_${s}`, rings: LIMB_PROFILES.forearm, covered: true },
  { bone: `hand_${s}`, rings: LIMB_PROFILES.hand },
  { bone: `thigh_${s}`, rings: LIMB_PROFILES.thigh, covered: true },
  { bone: `shank_${s}`, rings: LIMB_PROFILES.shank, covered: true },
  { bone: `foot_${s}`, rings: LIMB_PROFILES.foot, refUp: true },
];

const BASE_PARTS: BasePart[] = [
  { bone: 'pelvis', rings: CORE_PROFILES.pelvis, covered: true },
  { bone: 'lumbar', rings: CORE_PROFILES.lumbar, covered: true },
  { bone: 'thorax', rings: CORE_PROFILES.thorax, covered: true },
  { bone: 'neck', rings: CORE_PROFILES.neck },
  { bone: 'head', rings: CORE_PROFILES.head },
  ...SIDED('l'),
  ...SIDED('r'),
];

const BLOB_TEXTURE = (() => {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (!g) return null;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.38)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const tex = new CanvasTexture(c);
    return tex;
  } catch {
    return null;
  }
})();

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

  const baseGeometries = useMemo(() => BASE_PARTS.map((p) => loft(p.rings)), []);
  const blob = useRef<Mesh>(null);
  const baseMaterial = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 }),
    [],
  );
  const tissueMaterial = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.9, metalness: 0.0 }),
    [],
  );
  const muscleMaterials = useMemo(
    () => MUSCLE_MESHES.map(() => new MeshStandardMaterial({ roughness: 0.55, metalness: 0.0 })),
    [],
  );

  useEffect(() => {
    baseMaterial.color.set(theme.mannequin);
    // Saat lapisan luar dikupas, badan manekin dibuat tembus pandang agar otot dalam terlihat.
    const peeled = showMuscles && minLayer >= 2;
    baseMaterial.transparent = peeled;
    baseMaterial.opacity = peeled ? (minLayer === 3 ? 0.14 : 0.28) : 1;
    baseMaterial.depthWrite = !peeled;
    baseMaterial.needsUpdate = true;
    // Di antara otot terlihat jaringan gelap (bukan manekin abu-abu) agar otot tampak menempel.
    tissueMaterial.color.set(showMuscles ? theme.tissue : theme.mannequin);
    tissueMaterial.transparent = peeled;
    tissueMaterial.opacity = baseMaterial.opacity;
    tissueMaterial.depthWrite = !peeled;
    tissueMaterial.needsUpdate = true;
    invalidate();
  }, [baseMaterial, tissueMaterial, theme, minLayer, showMuscles, invalidate]);

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
      tissueMaterial.dispose();
      muscleMaterials.forEach((m) => m.dispose());
      baseGeometries.forEach((g) => g.dispose());
    },
    [baseMaterial, tissueMaterial, muscleMaterials, baseGeometries],
  );

  useFrame(() => {
    const sk = skeleton.current;
    BASE_PARTS.forEach((p, i) => {
      const mesh = baseRefs.current[i];
      if (!mesh) return;
      const seg = sk[p.bone];
      const dir = _x.copy(seg.end).sub(seg.start);
      const ref = (p.refUp ? Y : Z).clone().applyQuaternion(seg.quat);
      orient(mesh.quaternion, dir, ref);
      mesh.position.copy(seg.start);
    });
    if (blob.current) {
      const fl = sk.foot_l.start;
      const fr = sk.foot_r.start;
      blob.current.position.set((fl.x + fr.x) / 2, 0.004, (fl.z + fr.z) / 2);
    }
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
          material={p.covered ? tissueMaterial : baseMaterial}
        />
      ))}
      {BLOB_TEXTURE && (
        <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial map={BLOB_TEXTURE} transparent depthWrite={false} />
        </mesh>
      )}
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
            {...pointer(def.muscleId)}
          />
        ))}
    </group>
  );
}
