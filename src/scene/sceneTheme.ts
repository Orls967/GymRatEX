import { useMemo } from 'react';
import { usePrefs, type ResolvedTheme } from '../store/prefs';

/** Warna scene diambil dari CSS variables (satu sumber kebenaran); intensitas cahaya per preset tema. */
export interface SceneTheme {
  mode: ResolvedTheme;
  bg: string;
  grid: string;
  gridSub: string;
  mannequin: string;
  muscle: string;
  muscleDeep: string;
  tissue: string;
  bone: string;
  highlight: string;
  accent: string;
  danger: string;
  intensity: [string, string, string, string];
  light: {
    ambient: number;
    key: number;
    rim: number;
    hemiSky: string;
    hemiGround: string;
    exposure: number;
  };
}

const LIGHT_PRESETS: Record<ResolvedTheme, SceneTheme['light']> = {
  dark: {
    ambient: 0.55,
    key: 2.6,
    rim: 1.6,
    hemiSky: '#cfd6e0',
    hemiGround: '#1a1714',
    exposure: 1.0,
  },
  light: {
    ambient: 0.6,
    key: 1.8,
    rim: 0.6,
    hemiSky: '#fff8ec',
    hemiGround: '#b8ac98',
    exposure: 1.05,
  },
};

function cssVar(name: string): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888';
  } catch {
    return '#888888';
  }
}

export function readSceneTheme(mode: ResolvedTheme): SceneTheme {
  return {
    mode,
    bg: cssVar('--c-scene-bg'),
    grid: cssVar('--c-scene-grid'),
    gridSub: cssVar('--c-scene-grid-sub'),
    mannequin: cssVar('--c-mannequin'),
    muscle: cssVar('--c-muscle'),
    muscleDeep: cssVar('--c-muscle-deep'),
    tissue: cssVar('--c-tissue'),
    bone: cssVar('--c-bone'),
    highlight: cssVar('--c-highlight'),
    accent: cssVar('--c-accent'),
    danger: cssVar('--c-danger'),
    intensity: [cssVar('--c-int-0'), cssVar('--c-int-1'), cssVar('--c-int-2'), cssVar('--c-int-3')],
    light: LIGHT_PRESETS[mode],
  };
}

export function useSceneTheme(): SceneTheme {
  const mode = usePrefs((s) => s.resolvedTheme);
  // data-theme sudah diset sinkron oleh store sebelum render ini, jadi CSS var sudah benar.
  return useMemo(() => readSceneTheme(mode), [mode]);
}
