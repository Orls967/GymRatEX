import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from '../lib/reducedMotion';

interface Props {
  /** Titik fokus kamera. */
  target: [number, number, number];
  /** Arah kamera dari target (akan dinormalisasi) × jarak. */
  direction: [number, number, number];
  distance: number;
  /** Ubah nilai ini untuk memaksa animasi ulang walau target sama. */
  nonce?: string | number;
  minDistance?: number;
  maxDistance?: number;
  enablePan?: boolean;
}

/** Kamera orbit dengan transisi mulus ke fokus baru (dimatikan bila prefers-reduced-motion). */
export function CameraRig({
  target,
  direction,
  distance,
  nonce,
  minDistance = 0.6,
  maxDistance = 6,
  enablePan = false,
}: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useReducedMotion();
  const goal = useRef({ target: new Vector3(...target), pos: new Vector3(), active: true });

  // kunci nilai (bukan identitas array) agar animasi hanya diulang saat fokus benar-benar berubah
  const key = `${target.join(',')}|${direction.join(',')}|${distance}|${nonce ?? ''}|${reduced}`;
  const latest = useRef({ target, direction, distance });
  latest.current = { target, direction, distance };

  useEffect(() => {
    const { target: tg, direction: dir, distance: dist } = latest.current;
    const t = new Vector3(...tg);
    const pos = new Vector3(...dir).normalize().multiplyScalar(dist).add(t);
    goal.current = { target: t, pos, active: true };
    if (reduced && controls.current) {
      controls.current.target.copy(t);
      camera.position.copy(pos);
      controls.current.update();
      goal.current.active = false;
    }
    invalidate();
  }, [key, reduced, camera, invalidate]);

  useFrame((_, dt) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g.active) return;
    const k = 1 - Math.exp(-dt * 5);
    c.target.lerp(g.target, k);
    camera.position.lerp(g.pos, k);
    c.update();
    if (c.target.distanceTo(g.target) < 0.002 && camera.position.distanceTo(g.pos) < 0.004)
      g.active = false;
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      enablePan={enablePan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI * 0.92}
      onStart={() => {
        goal.current.active = false;
      }}
    />
  );
}
