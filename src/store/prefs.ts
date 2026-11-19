import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';

export type Lang = 'id' | 'en';
export type ThemePref = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const LANG_KEY = 'ototlapis.lang';
export const THEME_KEY = 'ototlapis.theme';

function initialLang(): Lang {
  const v = readStorage(LANG_KEY);
  return v === 'en' ? 'en' : 'id';
}

function initialTheme(): ThemePref {
  const v = readStorage(THEME_KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

function systemDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true;
  }
}

export function resolveTheme(pref: ThemePref, sysDark = systemDark()): ResolvedTheme {
  if (pref === 'system') return sysDark ? 'dark' : 'light';
  return pref;
}

interface PrefsState {
  lang: Lang;
  theme: ThemePref;
  resolvedTheme: ResolvedTheme;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemePref) => void;
  syncSystemTheme: () => void;
}

export const usePrefs = create<PrefsState>((set, get) => ({
  lang: initialLang(),
  theme: initialTheme(),
  resolvedTheme: resolveTheme(initialTheme()),
  setLang: (lang) => {
    writeStorage(LANG_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
    set({ lang });
  },
  setTheme: (theme) => {
    writeStorage(THEME_KEY, theme);
    const resolvedTheme = resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    set({ theme, resolvedTheme });
  },
  syncSystemTheme: () => {
    const { theme } = get();
    if (theme !== 'system') return;
    const resolvedTheme = resolveTheme('system');
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    set({ resolvedTheme });
  },
}));
