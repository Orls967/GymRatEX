import { describe, expect, it } from 'vitest';
import { buildMatcher, splitTerms } from '../../src/lib/autolink';
import { GLOSSARY } from '../../src/content/glossary';

describe('auto-link glosarium', () => {
  const m = buildMatcher([
    { id: 'flexion', phrases: ['fleksi'] },
    { id: 'hip-hinge', phrases: ['hip hinge', 'hinge'] },
    { id: 'knee-valgus', phrases: ['valgus lutut', 'valgus'] },
  ]);

  it('menautkan istilah dengan batas kata dan frasa terpanjang', () => {
    const c = splitTerms('Hip hinge memakai fleksi pinggul.', m);
    expect(c.filter((x) => x.kind === 'term').map((x) => x.kind === 'term' && x.id)).toEqual(['hip-hinge', 'flexion']);
  });

  it('tidak menautkan potongan kata (dorsofleksi ≠ fleksi)', () => {
    const c = splitTerms('Dorsofleksi pergelangan.', m);
    expect(c.every((x) => x.kind === 'text')).toBe(true);
  });

  it('hanya kemunculan pertama yang ditautkan', () => {
    const c = splitTerms('valgus lalu valgus lagi', m);
    expect(c.filter((x) => x.kind === 'term')).toHaveLength(1);
  });

  it('bekerja di kedua bahasa dengan data glosarium nyata', () => {
    for (const lang of ['id', 'en'] as const) {
      const matcher = buildMatcher(GLOSSARY.map((g) => ({ id: g.id, phrases: [g.term[lang], ...g.aliases[lang]] })));
      const text = lang === 'id' ? 'Gunakan bracing dan jaga punggung netral.' : 'Use bracing and keep a neutral spine.';
      const ids = splitTerms(text, matcher).flatMap((c) => (c.kind === 'term' ? [c.id] : []));
      expect(ids).toContain('bracing');
      expect(ids).toContain('neutral-spine');
    }
  });
});
