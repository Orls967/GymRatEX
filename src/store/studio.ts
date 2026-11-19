import { create } from 'zustand';
import type { MovementParams, StudioPattern } from '../lib/movements';
import { DEFAULT_PARAMS } from '../lib/movements';

interface StudioState {
  pattern: StudioPattern;
  params: MovementParams;
  tempo: number;
  playing: boolean;
  /** 0 = atas, 1 = bawah (disinkronkan dari loop animasi ~15 Hz) */
  phase: number;
  set: (p: Partial<Omit<StudioState, 'set' | 'setParam'>>) => void;
  setParam: <K extends keyof MovementParams>(k: K, v: MovementParams[K]) => void;
}

export const useStudio = create<StudioState>((set) => ({
  pattern: 'squat',
  params: DEFAULT_PARAMS.squat,
  tempo: 3,
  playing: true,
  phase: 0,
  set: (p) => set(p),
  setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } })),
}));
