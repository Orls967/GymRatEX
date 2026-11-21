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
  /** Bila diisi, jarak dihitung agar tinggi (m) ini muat di kanvas pada rasio apa pun. */
  fitHeight?: number;
  /** Putar otomatis pelan sampai pengguna menyentuh model. */
  autoRotate?: boolean;
  /** Sentuhan vertikal menggulir halaman (hanya geser horizontal yang memutar). Untuk kanvas di tengah halaman panjang. */
  pageScroll?: boolean;
}

/** Tinggi tubuh penuh (m) + ruang napas; dipakai semua halaman agar framing seragam. */
export const FIT_BODY = 2.05;

/** Kamera orbit dengan transisi mulus ke fokus baru (dimatikan bila prefers-reduced-motion). */
export function CameraRig({
  target,
  direction,
  distance: distanceProp,
  nonce,
  minDistance = 0.6,
  maxDistance = 6,
  enablePan = false,
  fitHeight,
  autoRotate = false,
  pageScroll = false,
}: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useReducedMotion();
  const size = useThree((s) => s.size);
  const dom = useThree((s) => s.gl.domElement);
  useEffect(() => {
    if (pageScroll) dom.style.touchAction = 'pan-y';
  }, [pageScroll, dom]);
  let distance = distanceProp;
  if (fitHeight) {
    const fov = ((camera as { fov?: number }).fov ?? 35) * (Math.PI / 180);
    const aspect = size.width / Math.max(size.height, 1);
    const half = Math.tan(fov / 2);
    // muat tinggi dan lebar (≈ 0,9× tinggi) tubuh; ambil jarak terbesar
    distance = Math.max(fitHeight / 2 / half, (fitHeight * 0.46) / (half * aspect));
  }
  const first = useRef(true);
  const goal = useRef({ target: new Vector3(...target), pos: new Vector3(), active: true });

  // kunci nilai (bukan identitas array) agar animasi hanya diulang saat fokus benar-benar berubah
  const key = `${target.join(',')}|${direction.join(',')}|${distance.toFixed(3)}|${nonce ?? ''}|${reduced}`;
  const latest = useRef({ target, direction, distance });
  latest.current = { target, direction, distance };

  useEffect(() => {
    const { target: tg, direction: dir, distance: dist } = latest.current;
    const t = new Vector3(...tg);
    const pos = new Vector3(...dir).normalize().multiplyScalar(dist).add(t);
    goal.current = { target: t, pos, active: true };
    // pertama kali muncul: langsung di posisi (tanpa gerak menyapu saat halaman baru tampil)
    const snap = reduced || first.current;
    first.current = false;
    if (snap && controls.current) {
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
    // dt dibatasi: setelah jeda (frameloop demand) dt bisa besar dan membuat kamera meloncat
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 6);
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
      dampingFactor={0.12}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      autoRotate={autoRotate && !reduced}
      autoRotateSpeed={0.8}
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
