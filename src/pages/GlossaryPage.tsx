import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GLOSSARY, TERM_BY_ID } from '../content';
import { normalize } from '../lib/search';
import { usePrefs } from '../store/prefs';
import { PageHeader } from '../ui/PageHeader';
import { AutoLinkText } from '../ui/AutoLinkText';
import { useL } from '../ui/useL';

export default function GlossaryPage() {
  const { t } = useTranslation();
  const L = useL();
  const lang = usePrefs((s) => s.lang);
  const { termId } = useParams();
  const [q, setQ] = useState('');

  const terms = useMemo(() => {
    const n = normalize(q);
    return [...GLOSSARY]
      .filter(
        (g) =>
          !n ||
          normalize(
            [g.term.id, g.term.en, ...g.aliases.id, ...g.aliases.en, g.definition[lang]].join(' '),
          ).includes(n),
      )
      .sort((a, b) => a.term[lang].localeCompare(b.term[lang], lang));
  }, [q, lang]);

  useEffect(() => {
    if (!termId) return;
    // ditunda satu frame: Layout menggulir ke atas saat rute berubah, dan efek induk berjalan setelah efek anak
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`term-${termId}`);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [termId]);

  return (
    <div>
      <PageHeader num="06" title={t('glossary.title')} lead={t('glossary.lead')} />
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="grid w-full max-w-sm gap-1">
            <span className="label-mono">{t('glossary.filter')}</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-h-11 border border-line bg-surface px-3 text-ink placeholder:text-ink-muted"
              placeholder={t('glossary.filter')}
              data-testid="glossary-filter"
            />
          </label>
          <p className="label-mono" aria-live="polite">
            {t('glossary.count', { count: terms.length })}
          </p>
        </div>
        <dl className="mt-4 border-t border-line" data-testid="glossary-list">
          {terms.map((g) => {
            const active = g.id === termId;
            return (
              <div
                key={g.id}
                id={`term-${g.id}`}
                tabIndex={-1}
                className={`grid gap-1 border-b border-line py-3 outline-none sm:grid-cols-[14rem_1fr] sm:gap-4 ${
                  active ? 'shadow-[inset_4px_0_0_var(--c-accent)] pl-3' : ''
                }`}
              >
                <dt>
                  <Link
                    to={`/glosarium/${g.id}`}
                    className="font-display text-xl font-bold uppercase hover:text-accent"
                  >
                    {L(g.term)}
                  </Link>
                  <span className="block text-sm italic text-ink-muted">
                    {g.term[lang === 'id' ? 'en' : 'id']}
                  </span>
                </dt>
                <dd>
                  <p>
                    <AutoLinkText text={L(g.definition)} exclude={g.id} />
                  </p>
                  {g.related.length > 0 && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {t('glossary.seeAlso')}:{' '}
                      {g.related.map((r, i) => {
                        const rt = TERM_BY_ID.get(r);
                        return rt ? (
                          <span key={r}>
                            {i > 0 && ', '}
                            <Link to={`/glosarium/${r}`} className="glossary-link text-ink">
                              {L(rt.term)}
                            </Link>
                          </span>
                        ) : null;
                      })}
                    </p>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
