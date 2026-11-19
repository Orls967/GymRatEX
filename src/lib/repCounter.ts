/**
 * Penghitung repetisi berbasis histeresis pada satu sudut sendi.
 * startHigh = true: posisi awal sudut besar (squat: lutut lurus; curl: siku lurus),
 * repetisi selesai saat sudut turun di bawah `low` lalu kembali di atas `high`.
 * startHigh = false: kebalikannya (overhead press: siku tertekuk di bawah, lurus di atas).
 */
export interface RepConfig {
  low: number;
  high: number;
  startHigh: boolean;
}

export interface RepEvent {
  /** Sudut ekstrem yang dicapai selama repetisi (min bila startHigh, max bila tidak). */
  extreme: number;
  count: number;
}

export type RepPhase = 'start' | 'turn';

export class RepCounter {
  count = 0;
  phase: RepPhase = 'start';
  private extreme: number;

  constructor(private readonly cfg: RepConfig) {
    this.extreme = cfg.startHigh ? Infinity : -Infinity;
  }

  /** Masukkan sudut terbaru; mengembalikan event bila satu repetisi selesai. */
  update(angle: number): RepEvent | null {
    const { low, high, startHigh } = this.cfg;
    if (this.phase === 'start') {
      // lacak ekstrem sejak mulai bergerak menjauh dari posisi awal
      if (startHigh ? angle < high : angle > low) {
        this.extreme = startHigh ? Math.min(this.extreme, angle) : Math.max(this.extreme, angle);
      }
      if (startHigh ? angle < low : angle > high) this.phase = 'turn';
      // kembali ke posisi awal tanpa mencapai ambang → reset ekstrem
      if (startHigh ? angle >= high : angle <= low) this.extreme = startHigh ? Infinity : -Infinity;
      return null;
    }
    this.extreme = startHigh ? Math.min(this.extreme, angle) : Math.max(this.extreme, angle);
    if (startHigh ? angle >= high : angle <= low) {
      this.count += 1;
      const ev = { extreme: this.extreme, count: this.count };
      this.phase = 'start';
      this.extreme = startHigh ? Infinity : -Infinity;
      return ev;
    }
    return null;
  }

  reset() {
    this.count = 0;
    this.phase = 'start';
    this.extreme = this.cfg.startHigh ? Infinity : -Infinity;
  }
}
