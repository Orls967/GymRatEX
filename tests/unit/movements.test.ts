import { describe, expect, it } from 'vitest';
import { BONE_LENGTH, computeSkeleton, neutralPose, STANDING_HIP_HEIGHT } from '../../src/lib/rig';
import { DEFAULT_PARAMS, movementFrame, phaseAt, type StudioPattern } from '../../src/lib/movements';

const PATTERNS: StudioPattern[] = ['squat', 'hinge', 'lunge', 'ohp'];

describe('rig & gerakan', () => {
  it('pose netral: kaki menapak, kepala ≈ 1,78 m', () => {
    const sk = computeSkeleton(neutralPose());
    expect(sk.shank_l.end.y).toBeCloseTo(BONE_LENGTH.ankleHeight, 2);
    expect(sk.head.end.y).toBeGreaterThan(1.7);
    expect(sk.head.end.y).toBeLessThan(1.85);
    expect(sk.thigh_l.start.x).toBeGreaterThan(0); // kiri = +x
    expect(STANDING_HIP_HEIGHT).toBeCloseTo(0.93, 2);
  });

  it('fleksi pinggul membawa lutut ke depan (+z)', () => {
    const p = neutralPose();
    p.hip.l.flex = Math.PI / 2;
    const sk = computeSkeleton(p);
    expect(sk.thigh_l.end.z).toBeGreaterThan(0.4);
  });

  it.each(PATTERNS)('%s: pergelangan kaki tetap di lantai sepanjang repetisi', (pattern) => {
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      const fr = movementFrame(pattern, DEFAULT_PARAMS[pattern], phase);
      expect(fr.skeleton.shank_l.end.y, `${pattern} @${phase}`).toBeGreaterThan(0.0);
      expect(fr.skeleton.shank_l.end.y, `${pattern} @${phase}`).toBeLessThan(0.2);
      for (const seg of Object.values(fr.skeleton)) {
        expect(Number.isFinite(seg.end.x + seg.end.y + seg.end.z)).toBe(true);
      }
    }
  });

  it('squat: posisi bawah lebih rendah dan barbel dekat tengah telapak', () => {
    const top = movementFrame('squat', DEFAULT_PARAMS.squat, 0);
    const bottom = movementFrame('squat', DEFAULT_PARAMS.squat, 1);
    expect(bottom.pose.root[1]).toBeLessThan(top.pose.root[1] - 0.3);
    expect(bottom.balanced).toBe(true);
    expect(Math.abs(bottom.bar!.z - bottom.midfoot.z)).toBeLessThan(0.03);
  });

  it('deadlift: barbel dekat lantai di bawah dan tetap di atas tengah telapak', () => {
    const fr = movementFrame('hinge', DEFAULT_PARAMS.hinge, 1);
    expect(fr.bar!.y).toBeLessThan(0.32);
    expect(Math.abs(fr.bar!.z - fr.midfoot.z)).toBeLessThan(0.06);
  });

  it('OHP: barbel di atas kepala saat terkunci', () => {
    const fr = movementFrame('ohp', DEFAULT_PARAMS.ohp, 1);
    expect(fr.bar!.y).toBeGreaterThan(fr.skeleton.head.end.y);
  });

  it('valgus memindah lutut ke garis tengah', () => {
    const ok = movementFrame('squat', DEFAULT_PARAMS.squat, 0.9);
    const bad = movementFrame('squat', DEFAULT_PARAMS.squat, 0.9, { valgus: 1 });
    expect(bad.skeleton.thigh_l.end.x).toBeLessThan(ok.skeleton.thigh_l.end.x - 0.03);
    expect(bad.skeleton.thigh_r.end.x).toBeGreaterThan(ok.skeleton.thigh_r.end.x + 0.03);
  });

  it('phaseAt: 0 di awal, 1 di titik terbawah, kembali 0', () => {
    expect(phaseAt(0, 3)).toBeCloseTo(0, 6);
    expect(phaseAt(0.55 * 3, 3)).toBeCloseTo(1, 6);
    expect(phaseAt(3, 3)).toBeCloseTo(0, 6);
  });
});
