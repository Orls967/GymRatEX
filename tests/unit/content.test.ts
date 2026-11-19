import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ABOUT,
  EXERCISES,
  FORM_ERRORS,
  FORM_ERROR_BY_ID,
  GLOSSARY,
  MUSCLES,
  MUSCLE_BY_ID,
  TERM_BY_ID,
  exerciseIntensities,
  exercisesForMuscle,
} from '../../src/content';
import { L10n } from '../../src/content/l10n';

/** Telusuri seluruh objek dan validasi setiap pasangan {id, en}. */
function collectL10n(value: unknown, path: string, out: { path: string; v: unknown }[]) {
  if (Array.isArray(value)) value.forEach((v, i) => collectL10n(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes('id') && keys.includes('en'))
      out.push({ path, v: value });
    else for (const [k, v] of Object.entries(value)) collectL10n(v, `${path}.${k}`, out);
  }
}

describe('konten ilmiah dwibahasa', () => {
  it('semua teks dwibahasa terisi di kedua bahasa', () => {
    const all: { path: string; v: unknown }[] = [];
    collectL10n({ MUSCLES, EXERCISES, GLOSSARY, FORM_ERRORS, ABOUT }, 'content', all);
    expect(all.length).toBeGreaterThan(300);
    for (const { path, v } of all) {
      // aliases glosarium berbentuk {id: string[], en: string[]}
      if (Array.isArray((v as { id: unknown }).id)) continue;
      expect(L10n.safeParse(v).success, path).toBe(true);
    }
  });

  it('skema menolak terjemahan kosong', () => {
    expect(L10n.safeParse({ id: 'Ada', en: '' }).success).toBe(false);
    expect(L10n.safeParse({ id: '  ', en: 'x' }).success).toBe(false);
  });

  it('ID unik', () => {
    for (const list of [MUSCLES, EXERCISES, GLOSSARY, FORM_ERRORS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('latihan hanya merujuk otot dan kesalahan yang ada', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(28);
    for (const ex of EXERCISES) {
      for (const m of [...ex.primary, ...ex.synergist, ...ex.stabilizer]) {
        expect(MUSCLE_BY_ID.has(m), `${ex.id} → ${m}`).toBe(true);
      }
      for (const e of ex.errors) expect(FORM_ERROR_BY_ID.has(e), `${ex.id} → ${e}`).toBe(true);
      const all = [...ex.primary, ...ex.synergist, ...ex.stabilizer];
      expect(new Set(all).size, `${ex.id}: otot dobel antar-peran`).toBe(all.length);
    }
  });

  it('glosarium related & kesalahan form valid', () => {
    for (const g of GLOSSARY)
      for (const r of g.related) expect(TERM_BY_ID.has(r), `${g.id} → ${r}`).toBe(true);
    for (const f of FORM_ERRORS) {
      for (const e of f.exercises)
        expect(
          EXERCISES.some((x) => x.id === e),
          `${f.id} → ${e}`,
        ).toBe(true);
    }
  });

  it('setiap otot dipakai minimal oleh satu latihan', () => {
    for (const m of MUSCLES) expect(exercisesForMuscle(m.id).length, m.id).toBeGreaterThan(0);
  });

  it('intensitas: utama mengalahkan peran lain', () => {
    const ex = EXERCISES.find((e) => e.id === 'back-squat');
    expect(ex).toBeDefined();
    const map = exerciseIntensities(ex!);
    expect(map['gluteus-maximus']).toBe(3);
    expect(map['adductors']).toBe(2);
    expect(map['erector-spinae']).toBe(1);
  });

  it('z dipakai konsisten (sanity)', () => {
    expect(z.string().safeParse('ok').success).toBe(true);
  });
});
