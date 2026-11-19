import type { MovementParams, StudioPattern } from './movements';
import { DEFAULT_PARAMS } from './movements';

/** Penyesuaian parameter per latihan agar peragaan mendekati variasi tersebut (perkiraan visual). */
const OVERRIDES: Record<string, Partial<MovementParams>> = {
  'front-squat': { torso: 18, load: 50 },
  'goblet-squat': { torso: 22, load: 20 },
  deadlift: {},
  'romanian-deadlift': { depth: 0.55, torso: 72, load: 60 },
  'sumo-deadlift': { stance: 0.78, torso: 45 },
  'good-morning': { depth: 0.5, torso: 80, load: 30 },
  'bulgarian-split-squat': { stance: 0.95, depth: 1, load: 20 },
  lunge: { load: 0 },
  'overhead-press': {},
};

export function presetFor(pattern: StudioPattern, exerciseId?: string): MovementParams {
  return { ...DEFAULT_PARAMS[pattern], ...(exerciseId ? OVERRIDES[exerciseId] : undefined) };
}

/** Latihan default yang mewakili tiap pola (dipakai untuk highlight otot bila datang tanpa latihan). */
export const PATTERN_EXERCISE: Record<StudioPattern, string> = {
  squat: 'back-squat',
  hinge: 'deadlift',
  lunge: 'lunge',
  ohp: 'overhead-press',
};
