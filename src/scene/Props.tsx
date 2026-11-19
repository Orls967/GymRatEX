import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Vector3 } from 'three';
import { useSceneTheme } from './sceneTheme';

interface BarProps {
  /** Mengembalikan posisi tengah beban tiap frame (null = sembunyikan). */
  getPosition: () => Vector3 | null;
  kind: 'barbell' | 'dumbbells';
  /** Jarak antartangan untuk dumbel (m). */
  spread?: number;
  /** Sumbu batang barbel mengikuti sumbu X dunia; true bila tubuh berbaring (bench). */
  plateScale?: number;
  /** Panjang batang barbel (m). */
  barLength?: number;
  /** Piringan transparan agar tidak menutupi tubuh (tampak samping). */
  ghost?: boolean;
}

/** Barbel/dumbel sederhana yang mengikuti posisi beban dari generator gerakan. */
export function LoadProp({
  getPosition,
  kind,
  spread = 0.42,
  plateScale = 0.85,
  barLength = 2.0,
  ghost = false,
}: BarProps) {
  const ref = useRef<Group>(null);
  const t = useSceneTheme();
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = getPosition();
    g.visible = !!p;
    if (p) g.position.copy(p);
  });
  const steel = t.mode === 'dark' ? '#9a958c' : '#6e6a62';
  const plate = t.mode === 'dark' ? '#2a2826' : '#3a3734';
  if (kind === 'dumbbells') {
    return (
      <group ref={ref}>
        {[-1, 1].map((s) => (
          <group key={s} position={[(s * spread) / 2, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.16, 10]} />
              <meshStandardMaterial color={steel} metalness={0.6} roughness={0.35} />
            </mesh>
            {[-1, 1].map((e) => (
              <mesh key={e} position={[e * 0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.045, 0.045, 0.05, 6]} />
                <meshStandardMaterial color={plate} roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, barLength, 12]} />
        <meshStandardMaterial color={steel} metalness={0.7} roughness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (barLength / 2 - 0.38), 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[plateScale, 1, plateScale]}
        >
          <cylinderGeometry args={[0.225, 0.225, 0.07, 28]} />
          <meshStandardMaterial
            color={plate}
            roughness={0.75}
            transparent={ghost}
            opacity={ghost ? 0.18 : 1}
            depthWrite={!ghost}
          />
        </mesh>
      ))}
    </group>
  );
}
