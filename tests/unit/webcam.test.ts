import { describe, expect, it } from 'vitest';
import {
  angle2d,
  computeAngles,
  Ema,
  LM,
  tiltFromVertical,
  type Landmark,
} from '../../src/lib/pose2d';
import { RepCounter } from '../../src/lib/repCounter';
import { liveFeedback, REP_CONFIG, repFeedback } from '../../src/lib/formFeedback';

describe('geometri pose 2D', () => {
  it('sudut siku-siku dan lurus', () => {
    expect(angle2d({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90, 6);
    expect(angle2d({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180, 6);
  });

  it('kemiringan dari vertikal', () => {
    expect(tiltFromVertical({ x: 0.5, y: 0.8 }, { x: 0.5, y: 0.4 })).toBeCloseTo(0, 6);
    expect(tiltFromVertical({ x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(45, 6);
  });

  it('computeAngles memilih sisi yang lebih terlihat', () => {
    const lms: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.2 }));
    const set = (i: number, x: number, y: number) => (lms[i] = { x, y, visibility: 0.95 });
    set(LM.rShoulder, 0.5, 0.3);
    set(LM.rElbow, 0.5, 0.45);
    set(LM.rWrist, 0.5, 0.6);
    set(LM.rHip, 0.5, 0.55);
    set(LM.rKnee, 0.6, 0.7);
    set(LM.rAnkle, 0.5, 0.85);
    const a = computeAngles(lms);
    expect(a?.side).toBe('right');
    expect(a!.knee).toBeLessThan(120);
    expect(a!.elbow).toBeCloseTo(180, 3);
  });

  it('EMA menghaluskan lonjakan', () => {
    const e = new Ema(0.5);
    e.next(100);
    expect(e.next(0)).toBe(50);
  });
});

function feed(counter: RepCounter, seq: number[]) {
  const events = [];
  for (const v of seq) {
    const ev = counter.update(v);
    if (ev) events.push(ev);
  }
  return events;
}

describe('RepCounter', () => {
  it('menghitung squat penuh dan mencatat sudut terdalam', () => {
    const c = new RepCounter(REP_CONFIG.squat);
    const down = [170, 150, 130, 110, 95, 90, 95, 120, 150, 168];
    const events = feed(c, [...down, ...down]);
    expect(c.count).toBe(2);
    expect(events[0]?.extreme).toBe(90);
    expect(repFeedback('squat', events[0]!)).toBe('good');
  });

  it('squat dangkal terhitung tapi diberi umpan balik "turun lebih dalam"', () => {
    const c = new RepCounter(REP_CONFIG.squat);
    const events = feed(c, [170, 140, 120, 115, 130, 165]);
    expect(events).toHaveLength(1);
    expect(repFeedback('squat', events[0]!)).toBe('goDeeper');
  });

  it('tidak menghitung goyangan kecil di posisi berdiri (histeresis)', () => {
    const c = new RepCounter(REP_CONFIG.squat);
    feed(c, [170, 158, 166, 150, 165, 140, 168]);
    expect(c.count).toBe(0);
  });

  it('overhead press: dimulai dari bawah, dihitung saat kembali ke bawah', () => {
    const c = new RepCounter(REP_CONFIG.ohp);
    const events = feed(c, [80, 110, 140, 165, 172, 140, 110, 85]);
    expect(c.count).toBe(1);
    expect(events[0]?.extreme).toBe(172);
    expect(repFeedback('ohp', events[0]!)).toBe('good');
  });

  it('umpan balik langsung: lutut masuk', () => {
    expect(
      liveFeedback('squat', {
        knee: 100,
        hip: 90,
        elbow: 170,
        torsoTilt: 30,
        shoulder: 10,
        kneeAnkleRatio: 0.6,
        side: 'left',
        confidence: 1,
      }),
    ).toBe('kneesIn');
    expect(
      liveFeedback('squat', {
        knee: 100,
        hip: 90,
        elbow: 170,
        torsoTilt: 30,
        shoulder: 10,
        kneeAnkleRatio: 1.1,
        side: 'left',
        confidence: 1,
      }),
    ).toBeNull();
  });
});
