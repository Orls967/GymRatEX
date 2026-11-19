import { useCallback } from 'react';
import type { L10n } from '../content/l10n';
import { usePrefs } from '../store/prefs';

/** Mengembalikan fungsi untuk memilih teks konten sesuai bahasa aktif. */
export function useL(): (text: L10n) => string {
  const lang = usePrefs((s) => s.lang);
  return useCallback((text: L10n) => text[lang], [lang]);
}
