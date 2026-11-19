import type { LucideIcon } from 'lucide-react';
import { Activity, BookOpen, Camera, Dumbbell, Info, ScanLine, SplitSquareHorizontal } from 'lucide-react';

export type NavKey = 'muscles' | 'exercises' | 'studio' | 'compare' | 'webcam' | 'glossary' | 'about';

export const NAV_ITEMS: readonly { key: NavKey; path: string; icon: LucideIcon; num: string }[] = [
  { key: 'muscles', path: '/otot', icon: ScanLine, num: '01' },
  { key: 'exercises', path: '/latihan', icon: Dumbbell, num: '02' },
  { key: 'studio', path: '/studio', icon: Activity, num: '03' },
  { key: 'compare', path: '/benar-salah', icon: SplitSquareHorizontal, num: '04' },
  { key: 'webcam', path: '/webcam', icon: Camera, num: '05' },
  { key: 'glossary', path: '/glosarium', icon: BookOpen, num: '06' },
  { key: 'about', path: '/tentang', icon: Info, num: '07' },
];
