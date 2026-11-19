import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrefs, type ThemePref } from '../store/prefs';

export function LangToggle() {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  return (
    <div role="group" aria-label={t('prefs.language')} className="flex border border-line">
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          data-testid={`lang-${l}`}
          aria-pressed={lang === l}
          aria-label={t('prefs.switchTo', { lang: l.toUpperCase() })}
          onClick={() => setLang(l)}
          className={`min-h-9 min-w-10 px-2 font-mono text-xs font-medium uppercase tracking-wider ${
            lang === l ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePref; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  return (
    <div role="radiogroup" aria-label={t('prefs.theme')} className="flex border border-line">
      {THEME_OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          data-testid={`theme-${value}`}
          aria-checked={theme === value}
          title={t(`prefs.${value}`)}
          aria-label={t(`prefs.${value}`)}
          onClick={() => setTheme(value)}
          className={`grid min-h-9 min-w-9 place-items-center ${
            theme === value ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  );
}
