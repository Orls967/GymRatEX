import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  Camera,
  Dumbbell,
  Info,
  ScanLine,
  SplitSquareHorizontal,
} from 'lucide-react';

export type NavKey =
  'muscles' | 'exercises' | 'studio' | 'compare' | 'webcam' | 'glossary' | 'about';

export const NAV_ITEMS: readonly { key: NavKey; path: string; icon: LucideIcon; num: string }[] = [
  { key: 'muscles', path: '/otot', icon: ScanLine, num: '01' },
  { key: 'exercises', path: '/latihan', icon: Dumbbell, num: '02' },
  { key: 'studio', path: '/studio', icon: Activity, num: '03' },
  { key: 'compare', path: '/benar-salah', icon: SplitSquareHorizontal, num: '04' },
  { key: 'webcam', path: '/webcam', icon: Camera, num: '05' },
  { key: 'glossary', path: '/glosarium', icon: BookOpen, num: '06' },
  { key: 'about', path: '/tentang', icon: Info, num: '07' },
];

/** Muat chunk halaman lebih awal (hover/fokus/idle) agar perpindahan rute tidak menampilkan layar kosong. */
const loaders: Record<string, () => Promise<unknown>> = {
  '': () => import('../pages/HomePage'),
  otot: () => import('../pages/MuscleMapPage'),
  latihan: () => import('../pages/ExerciseLibraryPage'),
  studio: () => import('../pages/StudioPage'),
  'benar-salah': () => import('../pages/ComparePage'),
  webcam: () => import('../pages/WebcamPage'),
  glosarium: () => import('../pages/GlossaryPage'),
  tentang: () => import('../pages/AboutPage'),
};

export function routeModule(pathname: string): string {
  return pathname.split('/')[1] ?? '';
}

export function preloadRoute(path: string): void {
  void loaders[routeModule(path)]?.().catch(() => undefined);
}

export function preloadAllRoutes(): void {
  // aset tubuh 3D dibangun di Web Worker selagi senggang, sebelum halaman 3D dibuka
  void import('../scene/body/assets').then((m) => m.loadBodyAssets()).catch(() => undefined);
  for (const k of Object.keys(loaders)) void loaders[k]?.().catch(() => undefined);
}
