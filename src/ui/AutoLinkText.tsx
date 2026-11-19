import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY, TERM_BY_ID } from '../content/glossary';
import { buildMatcher, splitTerms } from '../lib/autolink';
import { usePrefs } from '../store/prefs';

const cache = new Map<string, ReturnType<typeof buildMatcher>>();

function useMatcher() {
  const lang = usePrefs((s) => s.lang);
  return useMemo(() => {
    if (!cache.has(lang)) {
      cache.set(
        lang,
        buildMatcher(
          GLOSSARY.map((g) => ({ id: g.id, phrases: [g.term[lang], ...g.aliases[lang]] })),
        ),
      );
    }
    return { matcher: cache.get(lang) ?? null, lang };
  }, [lang]);
}

/** Teks dengan istilah glosarium yang tertaut otomatis (kemunculan pertama saja). */
export function AutoLinkText({ text, exclude }: { text: string; exclude?: string }) {
  const { matcher, lang } = useMatcher();
  const chunks = useMemo(
    () => splitTerms(text, matcher, new Set(), exclude),
    [text, matcher, exclude],
  );
  return (
    <>
      {chunks.map((c, i) =>
        c.kind === 'text' ? (
          <span key={i}>{c.text}</span>
        ) : (
          <Link
            key={i}
            to={`/glosarium/${c.id}`}
            className="glossary-link"
            title={TERM_BY_ID.get(c.id)?.definition[lang]}
          >
            {c.text}
          </Link>
        ),
      )}
    </>
  );
}
