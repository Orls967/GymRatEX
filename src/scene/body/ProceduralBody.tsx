import { use, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Vector3,
} from 'three';
import { useSceneTheme } from '../sceneTheme';
import { BONES, REST_SKELETON, boneFrame, boneQuat, getBodyAsset } from './skin';
import { getMuscleShells } from './muscleShells';
import { loadBodyAssets } from './assets';
import type { BodyModelProps, Intensity } from './types';

/**
 * Model tubuh tunggal untuk seluruh aplikasi: satu kulit tersambung (skin.ts) di-skin ke rig,
 * ditambah otot sebagai tambalan permukaan yang menempel pada kulit (muscleShells.ts).
 * Skeleton, geometri, dan aset dibagi antar-instans; hanya warna & tulang yang per-instans.
 */

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
    return new CanvasTexture(c);
  } catch {
    return null;
  }
})();

const PEEL_DEPTH = 0.016;

interface Rig {
  bones: Bone[];
  skeleton: Skeleton;
  skin: SkinnedMesh;
  muscles: SkinnedMesh;
  skinGeo: BufferGeometry;
  muscleGeo: BufferGeometry;
  skinMat: MeshStandardMaterial;
  muscleMat: MeshStandardMaterial;
  peel: { value: number };
}

function createRig(): Rig {
  const body = getBodyAsset();
  const shells = getMuscleShells();

  const bones = BONES.map(() => new Bone());
  const inverses = BONES.map((b, i) => {
    const m = boneFrame(new Matrix4(), REST_SKELETON[b], b);
    const bone = bones[i] as Bone;
    bone.position.copy(REST_SKELETON[b].start);
    boneQuat(bone.quaternion, REST_SKELETON[b], b);
    return m.invert();
  });
  const skeleton = new Skeleton(bones, inverses);

  const skinGeo = new BufferGeometry();
  skinGeo.setAttribute('position', new BufferAttribute(body.positions, 3));
  skinGeo.setAttribute('normal', new BufferAttribute(body.normals, 3));
  skinGeo.setAttribute('skinIndex', new BufferAttribute(body.skinIndex, 4));
  skinGeo.setAttribute('skinWeight', new BufferAttribute(body.skinWeight, 4));
  skinGeo.setAttribute(
    'color',
    new BufferAttribute(new Float32Array((body.positions.length / 3) * 3), 3),
  );
  skinGeo.setIndex(new BufferAttribute(body.indices, 1));

  const muscleGeo = new BufferGeometry();
  muscleGeo.setAttribute('position', new BufferAttribute(shells.positions, 3));
  muscleGeo.setAttribute('normal', new BufferAttribute(shells.normals, 3));
  muscleGeo.setAttribute('skinIndex', new BufferAttribute(shells.skinIndex, 4));
  muscleGeo.setAttribute('skinWeight', new BufferAttribute(shells.skinWeight, 4));
  muscleGeo.setAttribute('aDepth', new BufferAttribute(shells.depth, 1));
  muscleGeo.setAttribute('aM', new BufferAttribute(shells.member, 1));
  muscleGeo.setAttribute(
    'color',
    new BufferAttribute(new Float32Array((shells.positions.length / 3) * 3), 3),
  );
  muscleGeo.setIndex(new BufferAttribute(shells.indices, 1));

  const skinMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const muscleMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 });
  const peel = { value: 0 };
  muscleMat.onBeforeCompile = (shader) => {
    shader.uniforms.uPeel = peel;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aDepth;\nattribute float aM;\nvarying float vM;\nuniform float uPeel;',
      )
      .replace('void main() {', 'void main() {\n  vM = aM;')
      .replace(
        '#include <skinning_vertex>',
        `#include <skinning_vertex>\ntransformed -= normalize(objectNormal) * aDepth * uPeel * ${PEEL_DEPTH.toFixed(4)};`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vM;')
      .replace('void main() {', 'void main() {\n  if (vM < 0.5) discard;');
  };

  const skin = new SkinnedMesh(skinGeo, skinMat);
  skin.bind(skeleton, new Matrix4());
  skin.frustumCulled = false;
  skin.raycast = () => undefined;
  const muscles = new SkinnedMesh(muscleGeo, muscleMat);
  muscles.bind(skeleton, new Matrix4());
  muscles.frustumCulled = false;
  muscles.raycast = () => undefined;
  return { bones, skeleton, skin, muscles, skinGeo, muscleGeo, skinMat, muscleMat, peel };
}

function ownerOfTriangle(ranges: { triStart: number; triCount: number }[], tri: number): number {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((ranges[mid] as { triStart: number }).triStart <= tri) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

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
  use(loadBodyAssets()); // menunda (Suspense) sampai aset tubuh siap
  const theme = useSceneTheme();
  const invalidate = useThree((s) => s.invalidate);
  const root = useRef<Group>(null);
  const blob = useRef<Mesh>(null);
  const pick = useRef<Mesh>(null);
  const pickedFor = useRef<unknown>(null);
  const rig = useMemo(createRig, []);
  const shells = useMemo(getMuscleShells, []);
  const body = useMemo(getBodyAsset, []);

  const pickGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(shells.positions.length), 3));
    g.setIndex(new BufferAttribute(shells.indices, 1));
    return g;
  }, [shells]);
  useEffect(() => () => pickGeo.dispose(), [pickGeo]);

  const peeled = showMuscles && minLayer >= 2;

  // warna kulit: kepala/tangan/kaki abu manekin; badan & anggota bernuansa jaringan bila otot tampil
  useEffect(() => {
    const mannequin = new Color(theme.mannequin);
    const tissue = new Color(showMuscles ? theme.tissue : theme.mannequin);
    const c = new Color();
    const attr = rig.skinGeo.getAttribute('color') as BufferAttribute;
    for (let i = 0; i < body.cover.length; i++) {
      c.copy(mannequin).lerp(tissue, body.cover[i] as number);
      attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
    rig.skinMat.transparent = peeled;
    rig.skinMat.opacity = peeled ? (minLayer === 3 ? 0.14 : 0.28) : 1;
    rig.skinMat.depthWrite = !peeled;
    rig.skinMat.needsUpdate = true;
    invalidate();
  }, [rig, body, theme, showMuscles, peeled, minLayer, invalidate]);

  // warna otot, dihitung ulang hanya saat status berubah
  useEffect(() => {
    const hasIntensity = !!intensities && Object.keys(intensities).length > 0;
    const accent = new Color(theme.accent);
    const hl = new Color(theme.highlight);
    const colors = shells.ranges.map((r) => {
      const level: Intensity = intensities?.[r.muscleId] ?? 0;
      let hex: string;
      if (level > 0) hex = theme.intensity[level];
      else if (hasIntensity && dimInactive) hex = theme.intensity[0];
      else hex = r.layer >= 2 ? theme.muscleDeep : theme.muscle;
      const col = new Color(hex);
      if (selected === r.muscleId) col.lerp(accent, 0.75);
      else if (hovered === r.muscleId) col.lerp(hl, 0.25);
      return col;
    });
    const attr = rig.muscleGeo.getAttribute('color') as BufferAttribute;
    for (let i = 0; i < shells.owner.length; i++) {
      const col = colors[shells.owner[i] as number] as Color;
      attr.setXYZ(i, col.r, col.g, col.b);
    }
    attr.needsUpdate = true;
    invalidate();
  }, [rig, shells, intensities, selected, hovered, dimInactive, theme, invalidate]);

  // lapisan: otot superfisial disembunyikan saat dikupas, otot dalam digeser ke bawah kulit
  useEffect(() => {
    const start = shells.layerStart[minLayer];
    const total = shells.indices.length;
    rig.muscleGeo.setDrawRange(start, total - start);
    rig.peel.value = peeled ? 1 : 0;
    rig.muscles.visible = showMuscles;
    pickGeo.setDrawRange(start, total - start);
    invalidate();
  }, [rig, shells, pickGeo, minLayer, peeled, showMuscles, invalidate]);

  useLayoutEffect(
    () => () => {
      rig.skinGeo.dispose();
      rig.muscleGeo.dispose();
      rig.skinMat.dispose();
      rig.muscleMat.dispose();
      rig.skeleton.dispose();
    },
    [rig],
  );

  const tmp = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const sk = skeleton.current;
    BONES.forEach((name, i) => {
      const bone = rig.bones[i] as Bone;
      const seg = sk[name];
      bone.position.copy(seg.start);
      boneQuat(bone.quaternion, seg, name);
    });
    if (blob.current) {
      const fl = sk.foot_l.start;
      const fr = sk.foot_r.start;
      blob.current.position.set((fl.x + fr.x) / 2, 0.004, (fl.z + fr.z) / 2);
    }
    // geometri untuk picking: salinan statis pose saat ini (pose Peta Otot tidak berubah)
    const pm = pick.current;
    if (interactive && pm && pickedFor.current !== sk) {
      root.current?.updateMatrixWorld(true);
      rig.skeleton.update();
      const pos = pm.geometry.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        rig.muscles.getVertexPosition(i, tmp);
        pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      pos.needsUpdate = true;
      pm.geometry.computeBoundingSphere();
      pm.geometry.computeBoundingBox();
      pickedFor.current = sk;
    }
  });

  const idAt = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    if (e.faceIndex == null) return null;
    return shells.ranges[ownerOfTriangle(shells.ranges, e.faceIndex)]?.muscleId ?? null;
  };

  return (
    <group ref={root}>
      {rig.bones.map((b) => (
        <primitive key={b.uuid} object={b} />
      ))}
      <primitive object={rig.skin} />
      <primitive object={rig.muscles} />
      {interactive && showMuscles && (
        <mesh
          ref={pick}
          geometry={pickGeo}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHover?.(idAt(e));
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover?.(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            const id = idAt(e);
            if (id) onSelect?.(id, e);
          }}
        >
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      )}
      {BLOB_TEXTURE && (
        <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial map={BLOB_TEXTURE} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
