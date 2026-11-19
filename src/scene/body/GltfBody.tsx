import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import { MUSCLE_BY_ID } from '../../content/muscles';
import { useSceneTheme } from '../sceneTheme';
import { GLTF_MAPPING } from './gltfMapping';
import type { BodyModelProps } from './types';

const base = import.meta.env.BASE_URL;
// Decoder di-host lokal (disalin oleh scripts/copy-assets.mjs), bukan dari CDN.
const DRACO_PATH = `${base}decoders/draco/`;

/** Implementasi BodyModel berbasis glTF. Hanya dimuat bila BODY_MODEL_SOURCE = 'gltf'. */
export default function GltfBody({ intensities, selected, hovered, minLayer = 1, onHover, onSelect, interactive = true }: BodyModelProps) {
  const gltf = useGLTF(`${base}${GLTF_MAPPING.url}`, DRACO_PATH);
  const theme = useSceneTheme();
  const invalidate = useThree((s) => s.invalidate);

  const meshToMuscle = useMemo(() => {
    const m = new Map<string, string>();
    for (const [id, names] of Object.entries(GLTF_MAPPING.muscles)) for (const n of names) m.set(n, id);
    return m;
  }, []);

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const id = meshToMuscle.get(o.name);
      if (!(o.material instanceof MeshStandardMaterial) || !o.userData.ototlapisOwned) {
        o.material = new MeshStandardMaterial({ roughness: 0.6 });
        o.userData.ototlapisOwned = true;
      }
      const mat = o.material as MeshStandardMaterial;
      if (!id) {
        mat.color.set(theme.mannequin);
        return;
      }
      const muscle = MUSCLE_BY_ID.get(id);
      o.visible = (muscle?.layer ?? 1) >= minLayer;
      const lvl = intensities?.[id] ?? 0;
      mat.color.set(lvl > 0 ? theme.intensity[lvl] : theme.muscle);
      const sel = selected === id;
      const hov = hovered === id;
      mat.emissive = new Color(sel ? theme.accent : hov ? theme.highlight : '#000000');
      mat.emissiveIntensity = sel ? 0.5 : hov ? 0.15 : 0;
    });
    invalidate();
  }, [scene, meshToMuscle, theme, intensities, selected, hovered, minLayer, invalidate]);

  const handlers = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          const id = meshToMuscle.get(e.object.name);
          if (id) {
            e.stopPropagation();
            onHover?.(id);
          }
        },
        onPointerOut: () => onHover?.(null),
        onClick: (e: ThreeEvent<MouseEvent>) => {
          const id = meshToMuscle.get(e.object.name);
          if (id) {
            e.stopPropagation();
            onSelect?.(id, e);
          }
        },
      }
    : {};

  return (
    <primitive
      object={scene}
      scale={GLTF_MAPPING.scale}
      position={GLTF_MAPPING.offset}
      {...handlers}
    />
  );
}
