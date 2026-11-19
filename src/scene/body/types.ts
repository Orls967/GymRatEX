import type { ThreeEvent } from '@react-three/fiber';
import type { Skeleton } from '../../lib/rig';

/** 0 = tidak aktif, 1 = stabilisator, 2 = sinergis, 3 = utama */
export type Intensity = 0 | 1 | 2 | 3;

export interface SkeletonSource {
  current: Skeleton;
}

/**
 * Kontrak bersama untuk semua implementasi model tubuh (prosedural maupun glTF).
 * Halaman tidak tahu bentuk mesh: mereka hanya memberi ID otot.
 */
export interface BodyModelProps {
  skeleton: SkeletonSource;
  intensities?: Readonly<Record<string, Intensity>>;
  selected?: string | null;
  hovered?: string | null;
  /** Lapisan minimum yang ditampilkan (1 = semua, 3 = hanya otot dalam). */
  minLayer?: 1 | 2 | 3;
  /** Saat ada intensitas, otot yang tidak aktif dibuat redup. */
  dimInactive?: boolean;
  interactive?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string, e: ThreeEvent<MouseEvent>) => void;
  /** Tampilkan otot sama sekali (Studio bisa memakai manekin polos). */
  showMuscles?: boolean;
}

export type BodyModelKind = 'procedural' | 'gltf';
