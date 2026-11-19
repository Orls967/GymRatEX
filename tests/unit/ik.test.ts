import { describe, expect, it } from 'vitest';
import { angleFromDown, dist2, solveTwoBone2D } from '../../src/lib/ik';

describe('solveTwoBone2D', () => {
  it('menjaga panjang tulang dan mencapai target yang terjangkau', () => {
    const root = { z: 0, y: 1 };
    const target = { z: 0.1, y: 0.3 };
    const r = solveTwoBone2D(root, target, 0.43, 0.42, 1);
    expect(r.reachable).toBe(true);
    expect(dist2(root, r.mid)).toBeCloseTo(0.43, 6);
    expect(dist2(r.mid, r.end)).toBeCloseTo(0.42, 6);
    expect(dist2(r.end, target)).toBeCloseTo(0, 6);
  });

  it('arah tekuk menentukan sisi sendi tengah (lutut ke depan)', () => {
    // pinggul di atas pergelangan: lutut berada di depan (+z) untuk bend = +1 saat root→target mengarah ke bawah
    const hip = { z: 0, y: 0.7 };
    const ankle = { z: 0, y: 0.08 };
    const fwd = solveTwoBone2D(hip, ankle, 0.43, 0.42, 1);
    const back = solveTwoBone2D(hip, ankle, 0.43, 0.42, -1);
    expect(fwd.mid.z).toBeGreaterThan(0);
    expect(back.mid.z).toBeLessThan(0);
  });

  it('target di luar jangkauan: rantai lurus mengarah ke target', () => {
    const r = solveTwoBone2D({ z: 0, y: 0 }, { z: 0, y: -2 }, 0.3, 0.26, 1);
    expect(r.reachable).toBe(false);
    expect(r.end.y).toBeCloseTo(-0.56, 4);
    expect(r.mid.y).toBeCloseTo(-0.3, 4);
  });

  it('angleFromDown positif untuk vektor condong ke depan', () => {
    expect(angleFromDown({ z: 0, y: 1 }, { z: 1, y: 0 })).toBeCloseTo(Math.PI / 4, 6);
    expect(angleFromDown({ z: 0, y: 1 }, { z: 0, y: 0 })).toBeCloseTo(0, 6);
  });
});
