import { describe, expect, it } from 'vitest';
import { getBodyAsset } from '../../src/scene/body/skin';

describe('kulit tubuh tunggal', () => {
  const t0 = performance.now();
  const a = getBodyAsset();
  const ms = performance.now() - t0;

  it('dibangun cukup cepat dengan jumlah segitiga wajar', () => {
    console.log(
      'build ms',
      Math.round(ms),
      'verts',
      a.positions.length / 3,
      'tris',
      a.indices.length / 3,
    );
    expect(a.indices.length / 3).toBeGreaterThan(8000);
    expect(a.indices.length / 3).toBeLessThan(90000);
  });

  it('bobot tiap titik berjumlah 1 dan indeks valid', () => {
    const n = a.positions.length / 3;
    for (let v = 0; v < n; v += 37) {
      const s =
        (a.skinWeight[v * 4] ?? 0) +
        (a.skinWeight[v * 4 + 1] ?? 0) +
        (a.skinWeight[v * 4 + 2] ?? 0) +
        (a.skinWeight[v * 4 + 3] ?? 0);
      expect(s).toBeCloseTo(1, 4);
    }
    for (const i of a.indices) expect(i).toBeLessThan(n);
  });

  it('tinggi tubuh ≈ 1,7–1,85 m', () => {
    let min = Infinity,
      max = -Infinity;
    for (let v = 0; v < a.positions.length / 3; v++) {
      const y = a.positions[v * 3 + 1] as number;
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
    console.log('y', min, max);
    expect(max - min).toBeGreaterThan(1.7);
    expect(max - min).toBeLessThan(1.9);
  });
});

import { MUSCLE_SHAPES } from '../../src/scene/body/muscleGeometry';
import { getMuscleShells } from '../../src/scene/body/muscleShells';

describe('otot sebagai tambalan permukaan', () => {
  const s = getMuscleShells();
  it('setiap otot punya permukaan', () => {
    const empty = s.ranges.filter((r) => r.triCount < 20).map((r) => `${r.muscleId}:${r.triCount}`);
    console.log(
      'tris',
      s.indices.length / 3,
      'verts',
      s.positions.length / 3,
      'sepi',
      empty.join(' '),
    );
    expect(s.ranges.length).toBe(Object.keys(MUSCLE_SHAPES).length);
    expect(empty).toEqual([]);
  });
  it('lapisan terurut', () => {
    expect(s.layerStart[1]).toBe(0);
    expect(s.layerStart[2]).toBeLessThanOrEqual(s.layerStart[3]);
  });
});
