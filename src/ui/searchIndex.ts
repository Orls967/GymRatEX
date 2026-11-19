import type { TFunction } from 'i18next';
import { EXERCISES, GLOSSARY, MUSCLES } from '../content';
import type { LangCode } from '../content/l10n';
import type { SearchDoc } from '../lib/search';
import { NAV_ITEMS } from './routes';

const other = (l: LangCode): LangCode => (l === 'id' ? 'en' : 'id');

/** Indeks dibangun per bahasa; nama dalam bahasa lain tetap ikut dicari agar kueri dwibahasa bekerja. */
export function buildSearchIndex(lang: LangCode, t: TFunction): SearchDoc[] {
  const o = other(lang);
  const docs: SearchDoc[] = [];
  for (const n of NAV_ITEMS) {
    docs.push({ key: `page:${n.key}`, group: 'page', title: t(`nav.${n.key}`), extra: [], path: n.path });
  }
  for (const m of MUSCLES) {
    docs.push({
      key: `muscle:${m.id}`,
      group: 'muscle',
      title: m.name[lang],
      subtitle: m.latin,
      extra: [m.latin, m.name[o]],
      path: `/otot/${m.id}`,
    });
  }
  for (const e of EXERCISES) {
    docs.push({
      key: `exercise:${e.id}`,
      group: 'exercise',
      title: e.name[lang],
      subtitle: e.summary[lang],
      extra: [e.name[o]],
      path: `/latihan/${e.id}`,
    });
  }
  for (const g of GLOSSARY) {
    docs.push({
      key: `term:${g.id}`,
      group: 'term',
      title: g.term[lang],
      subtitle: g.definition[lang],
      extra: [g.term[o], ...g.aliases[lang], ...g.aliases[o]],
      path: `/glosarium/${g.id}`,
    });
  }
  return docs;
}
