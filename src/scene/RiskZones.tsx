import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Skeleton } from '../lib/rig';
import type { FormError } from '../content';
import { useReducedMotion } from '../lib/reducedMotion';
import { useSceneTheme } from './sceneTheme';
import type { Vector3 } from 'three';

type Zone = FormError['zones'][number];

const POINTS: Record<Zone, (sk: Skeleton) => Vector3[]> = {
  knee: (sk) => [sk.thigh_l.end, sk.thigh_r.end],
  lumbar: (sk) => [sk.pelvis.end.clone().lerp(sk.lumbar.end, 0.4)],
  shoulder: (sk) => [sk.upperArm_l.start, sk.upperArm_r.start],
  elbow: (sk) => [sk.forearm_l.start, sk.forearm_r.start],
  hip: (sk) => [sk.thigh_l.start, sk.thigh_r.start],
};

const RADIUS: Record<Zone, number> = {
  knee: 0.075,
  lumbar: 0.11,
  shoulder: 0.085,
  elbow: 0.06,
  hip: 0.08,
};

/** Penanda zona rawan: bola semi-transparen berdenyut di sendi yang terbebani berlebih. */
export function RiskZones({
  zones,
  skeleton,
}: {
  zones: readonly Zone[];
  skeleton: { current: Skeleton };
}) {
  const theme = useSceneTheme();
  const reduced = useReducedMotion();
  const refs = useRef<(Mesh | null)[]>([]);
  const items = zones.flatMap((z) =>
    [0, 1].slice(0, z === 'lumbar' ? 1 : 2).map((i) => ({ z, i })),
  );
  useFrame(({ clock }) => {
    const s = reduced ? 1 : 1 + 0.15 * Math.sin(clock.elapsedTime * 4);
    items.forEach(({ z, i }, k) => {
      const m = refs.current[k];
      const p = POINTS[z](skeleton.current)[i];
      if (!m || !p) return;
      m.position.copy(p);
      m.scale.setScalar(RADIUS[z] * s);
    });
  });
  return (
    <>
      {items.map(({ z, i }, k) => (
        <mesh
          key={`${z}-${i}`}
          ref={(m) => {
            refs.current[k] = m;
          }}
          renderOrder={10}
        >
          <sphereGeometry args={[1, 20, 14]} />
          <meshBasicMaterial
            color={theme.danger}
            transparent
            opacity={0.38}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
