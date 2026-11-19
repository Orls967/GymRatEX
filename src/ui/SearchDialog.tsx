import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { search } from '../lib/search';
import { usePrefs } from '../store/prefs';
import { buildSearchIndex } from './searchIndex';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const index = useMemo(() => buildSearchIndex(lang, t), [lang, t]);
  const results = useMemo(() => search(index, q), [index, q]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      const r = results[active];
      if (r) go(r.path);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label={t('search.label')}
      className="m-0 mx-auto mt-[8vh] w-[min(640px,calc(100vw-32px))] max-w-none border border-line-strong bg-surface p-0 text-ink backdrop:bg-black/60"
      data-testid="search-dialog"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} aria-hidden className="text-ink-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-ink-muted"
          data-testid="search-input"
        />
        <kbd className="label-mono border border-line px-1.5">Esc</kbd>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {q.trim() === '' ? (
          <p className="px-4 py-6 text-sm text-ink-muted">{t('search.hint')}</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-muted">{t('search.empty', { q })}</p>
        ) : (
          <ul id={listId} role="listbox" className="py-1">
            {results.map((r, i) => (
              <li
                key={r.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.path)}
                className={`flex cursor-pointer items-baseline gap-3 px-4 py-2.5 ${
                  i === active ? 'bg-surface-2 shadow-[inset_3px_0_0_var(--c-accent)]' : ''
                }`}
              >
                <span className="label-mono w-20 shrink-0">{t(`search.groups.${r.group}`)}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{r.title}</span>
                  {r.subtitle && (
                    <span className="block truncate text-sm text-ink-muted">{r.subtitle}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
