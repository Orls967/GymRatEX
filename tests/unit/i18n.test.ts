import { describe, expect, it } from 'vitest';
import id from '../../src/i18n/locales/id';
import en from '../../src/i18n/locales/en';

type Tree = { [k: string]: unknown };

function flatten(obj: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (Array.isArray(obj)) {
    out.set(prefix, `array:${obj.length}`);
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`).forEach((val, k) => out.set(k, val)));
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Tree)) {
      flatten(v, prefix ? `${prefix}.${k}` : k).forEach((val, key) => out.set(key, val));
    }
  } else {
    out.set(prefix, obj);
  }
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe('kunci terjemahan UI', () => {
  const fid = flatten(id);
  const fen = flatten(en);

  it('ID dan EN punya kunci yang persis sama', () => {
    expect([...fen.keys()].sort()).toEqual([...fid.keys()].sort());
  });

  it('tidak ada nilai kosong', () => {
    for (const [k, v] of [...fid, ...fen]) {
      if (typeof v === 'string') expect(v.trim(), k).not.toBe('');
    }
  });

  it('placeholder interpolasi sama di kedua bahasa', () => {
    for (const [k, v] of fid) {
      if (typeof v !== 'string') continue;
      const other = fen.get(k);
      expect(typeof other, k).toBe('string');
      expect(placeholders(other as string), k).toEqual(placeholders(v));
    }
  });
});
