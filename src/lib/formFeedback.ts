import type { JointAngles2D } from './pose2d';
import type { RepConfig, RepEvent } from './repCounter';

export type WebcamMode = 'squat' | 'curl' | 'ohp';
export type FeedbackKey = 'good' | 'goDeeper' | 'kneesIn' | 'leanForward' | 'fullExtension' | 'fullRange' | 'swing';

export const REP_CONFIG: Record<WebcamMode, RepConfig> = {
  // lutut: lurus ≈ 170°, squat sejajar ≈ 90–100°. Ambang `low` sengaja longgar agar squat dangkal tetap terhitung lalu diberi umpan balik.
  squat: { low: 125, high: 160, startHigh: true },
  // siku: lurus ≈ 165°, puncak curl ≈ 40–60°
  curl: { low: 75, high: 145, startHigh: true },
  // siku: rak depan ≈ 70–90°, terkunci ≈ 170°
  ohp: { low: 100, high: 150, startHigh: false },
};

/** Sudut yang dipakai penghitung repetisi untuk tiap mode. */
export function repMetric(mode: WebcamMode, a: JointAngles2D): number {
  return mode === 'squat' ? a.knee : a.elbow;
}

/** Umpan balik instan per frame (postur), diprioritaskan dari yang paling penting. */
export function liveFeedback(mode: WebcamMode, a: JointAngles2D): FeedbackKey | null {
  if (mode === 'squat') {
    if (a.knee < 140 && a.kneeAnkleRatio < 0.72) return 'kneesIn';
    if (a.torsoTilt > 55) return 'leanForward';
  }
  if (mode === 'curl' && a.shoulder > 35) return 'swing';
  return null;
}

/** Umpan balik setelah satu repetisi selesai, berdasarkan sudut ekstrem. */
export function repFeedback(mode: WebcamMode, ev: RepEvent): FeedbackKey {
  if (mode === 'squat') return ev.extreme > 105 ? 'goDeeper' : 'good';
  if (mode === 'curl') return ev.extreme > 65 ? 'fullRange' : 'good';
  return ev.extreme < 160 ? 'fullExtension' : 'good';
}
