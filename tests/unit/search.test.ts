import { describe, expect, it } from 'vitest';
import { normalize, search, type SearchDoc } from '../../src/lib/search';
import { buildSearchIndex } from '../../src/ui/searchIndex';
import type { TFunction } from 'i18next';

const tStub = ((k: string) => k) as unknown as TFunction;

describe('search', () => {
  it('normalisasi diakritik & tanda baca', () => {
    expect(normalize('  Fléksi–Lutut! ')).toBe('fleksi lutut');
  });

  it('prefiks diberi skor lebih tinggi', () => {
    const docs: SearchDoc[] = [
      { key: 'a', group: 'term', title: 'Abduksi pinggul', extra: [], path: '/a' },
      { key: 'b', group: 'term', title: 'Pinggul', extra: [], path: '/b' },
    ];
    expect(search(docs, 'pinggul').map((d) => d.key)).toEqual(['b', 'a']);
  });

  it('bekerja dwibahasa: kueri EN menemukan otot saat bahasa ID', () => {
    const idx = buildSearchIndex('id', tStub);
    expect(search(idx, 'hamstrings').some((d) => d.key === 'muscle:hamstrings')).toBe(true);
    expect(search(idx, 'paha belakang').some((d) => d.key === 'muscle:hamstrings')).toBe(true);
    expect(search(idx, 'gluteus maximus').some((d) => d.key === 'muscle:gluteus-maximus')).toBe(true);
    const en = buildSearchIndex('en', tStub);
    expect(search(en, 'lutut masuk').some((d) => d.key === 'term:knee-valgus')).toBe(true);
  });
});
