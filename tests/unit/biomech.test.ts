import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { computeMoments, G, sagittalMoment, SEGMENT_MASS } from '../../src/lib/biomech';
import { DEFAULT_PARAMS, movementFrame } from '../../src/lib/movements';

describe('biomekanika statis sagital', () => {
  it('fraksi massa segmen ≈ 100% berat badan', () => {
    const s = SEGMENT_MASS;
    const total =
      s.head + s.thorax + s.abdomen + s.pelvis + 2 * (s.upperArm + s.forearm + s.hand + s.thigh + s.shank + s.foot);
    expect(total).toBeCloseTo(1, 2);
  });

  it('momen = beban × lengan momen horizontal', () => {
    const m = sagittalMoment([{ name: 'bar', mass: 100, pos: new Vector3(0, 1, 0.2) }], new Vector3(0, 0.5, 0));
    expect(m).toBeCloseTo(100 * G * 0.2, 6);
  });

  it('squat: momen pinggul & lutut naik seiring kedalaman', () => {
    const prm = DEFAULT_PARAMS.squat;
    const top = computeMoments({ frame: movementFrame('squat', prm, 0), pattern: 'squat', loadKg: 60, bodyMass: 75 });
    const bottom = computeMoments({ frame: movementFrame('squat', prm, 1), pattern: 'squat', loadKg: 60, bodyMass: 75 });
    expect(Math.abs(top.hip)).toBeLessThan(40);
    expect(bottom.hip).toBeGreaterThan(top.hip + 100);
    expect(bottom.knee).toBeGreaterThan(top.knee + 50);
    // orde besaran wajar (literatur: puluhan hingga ratusan N·m)
    expect(bottom.hip).toBeLessThan(600);
  });

  it('squat: torso lebih condong → pinggul naik, lutut turun', () => {
    const upright = { ...DEFAULT_PARAMS.squat, torso: 25 };
    const leaned = { ...DEFAULT_PARAMS.squat, torso: 50 };
    const a = computeMoments({ frame: movementFrame('squat', upright, 1), pattern: 'squat', loadKg: 60, bodyMass: 75 });
    const b = computeMoments({ frame: movementFrame('squat', leaned, 1), pattern: 'squat', loadKg: 60, bodyMass: 75 });
    expect(b.hip).toBeGreaterThan(a.hip);
    expect(b.knee).toBeLessThan(a.knee);
  });

  it('beban linear: menggandakan beban menambah momen lumbal', () => {
    const frame = movementFrame('hinge', DEFAULT_PARAMS.hinge, 1);
    const a = computeMoments({ frame, pattern: 'hinge', loadKg: 60, bodyMass: 75 });
    const b = computeMoments({ frame, pattern: 'hinge', loadKg: 120, bodyMass: 75 });
    expect(b.lumbar - a.lumbar).toBeCloseTo(60 * G * a.arms.lumbar, 0);
  });

  it('deadlift: punggung membulat menambah momen lumbal', () => {
    const prm = { ...DEFAULT_PARAMS.hinge, depth: 0.8 };
    const ok = computeMoments({ frame: movementFrame('hinge', prm, 1), pattern: 'hinge', loadKg: 100, bodyMass: 75 });
    const bad = computeMoments({
      frame: movementFrame('hinge', prm, 1, { rounding: 1 }),
      pattern: 'hinge',
      loadKg: 100,
      bodyMass: 75,
    });
    expect(bad.lumbar).toBeGreaterThan(ok.lumbar);
  });
});
