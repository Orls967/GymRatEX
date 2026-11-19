import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface MomentSeries {
  key: 'knee' | 'hip' | 'lumbar';
  /** nilai per sampel fase (0..1 merata) */
  values: number[];
}

interface Props {
  series: MomentSeries[];
  /** fase saat ini 0..1 */
  cursor: number;
}

const COLORS: Record<MomentSeries['key'], string> = {
  knee: 'var(--c-chart-1)',
  hip: 'var(--c-chart-2)',
  lumbar: 'var(--c-chart-3)',
};

const W = 560;
const H = 240;
const M = { l: 44, r: 92, t: 12, b: 30 };

function niceMax(v: number): number {
  if (v <= 0) return 50;
  const step = v > 400 ? 100 : v > 150 ? 50 : 25;
  return Math.ceil((v * 1.08) / step) * step;
}

/**
 * Grafik garis momen sendi vs posisi (fase 0 = atas, 1 = bawah).
 * Satu sumbu Y (N·m), legenda + label langsung di ujung garis, crosshair hover + tooltip.
 */
export function MomentChart({ series, cursor }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const n = series[0]?.values.length ?? 0;
  const max = useMemo(() => niceMax(Math.max(0, ...series.flatMap((s) => s.values))), [series]);
  const min = useMemo(() => Math.min(0, ...series.flatMap((s) => s.values)), [series]);
  const lo = min < 0 ? -niceMax(-min) : 0;
  const x = (i: number) => M.l + (i / Math.max(n - 1, 1)) * (W - M.l - M.r);
  const y = (v: number) => M.t + (1 - (v - lo) / (max - lo)) * (H - M.t - M.b);
  const ticks = useMemo(() => {
    const step = max - lo > 400 ? 100 : max - lo > 150 ? 50 : 25;
    const out: number[] = [];
    for (let v = lo; v <= max + 1e-6; v += step) out.push(v);
    return out;
  }, [max, lo]);

  const idx = hover ?? Math.round(cursor * (n - 1));
  // label langsung di ujung kanan, dihindarkan dari tabrakan dengan jarak minimum 14px
  const labels = useMemo(() => {
    const items = series.map((s) => ({ key: s.key, y: y(s.values[n - 1] ?? 0) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const cur = items[i];
      if (prev && cur && cur.y - prev.y < 14) cur.y = prev.y + 14;
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, max, lo, n]);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1)))));
  };

  const tipX = x(idx);
  const tipLeft = tipX > W / 2;

  return (
    <figure className="m-0">
      <figcaption id={titleId} className="label-mono mb-2">
        {t('studio.chartTitle')} · {t('studio.nm')}
      </figcaption>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-hidden>
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5" style={{ background: COLORS[s.key] }} />
            {t(`studio.${s.key}`)}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-labelledby={titleId}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--c-chart-grid)" strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={M.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-ink-muted font-mono text-[10px]">
              {v}
            </text>
          </g>
        ))}
        <text x={M.l} y={H - 8} className="fill-ink-muted font-mono text-[10px]">
          {t('studio.phase')} 0
        </text>
        <text x={W - M.r} y={H - 8} textAnchor="end" className="fill-ink-muted font-mono text-[10px]">
          1
        </text>
        {series.map((s) => (
          <polyline
            key={s.key}
            fill="none"
            stroke={COLORS[s.key]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
          />
        ))}
        {labels.map((l) => (
          <text key={l.key} x={W - M.r + 6} y={l.y} dominantBaseline="middle" className="fill-ink text-[11px]">
            {t(`studio.${l.key}`)}
          </text>
        ))}
        <line x1={tipX} x2={tipX} y1={M.t} y2={H - M.b} stroke="var(--c-ink-muted)" strokeDasharray={hover === null ? '3 3' : undefined} />
        {series.map((s) => (
          <circle
            key={s.key}
            cx={tipX}
            cy={y(s.values[idx] ?? 0)}
            r={4.5}
            fill={COLORS[s.key]}
            stroke="var(--c-surface)"
            strokeWidth={2}
          />
        ))}
        {hover !== null && (
          <g transform={`translate(${tipLeft ? tipX - 130 : tipX + 8}, ${M.t + 4})`} pointerEvents="none">
            <rect width={122} height={16 + series.length * 15} fill="var(--c-surface)" stroke="var(--c-line-strong)" />
            <text x={8} y={13} className="fill-ink-muted font-mono text-[10px]">
              {t('studio.phase')} {(idx / (n - 1)).toFixed(2)}
            </text>
            {series.map((s, i) => (
              <g key={s.key} transform={`translate(8, ${27 + i * 15})`}>
                <rect y={-6} width={8} height={3} fill={COLORS[s.key]} />
                <text x={14} y={0} dominantBaseline="middle" className="fill-ink text-[10px]">
                  {t(`studio.${s.key}`)}
                </text>
                <text x={112} y={0} textAnchor="end" dominantBaseline="middle" className="fill-ink font-mono text-[10px]">
                  {Math.round(s.values[idx] ?? 0)}
                </text>
              </g>
            ))}
          </g>
        )}
        <rect
          x={M.l}
          y={M.t}
          width={W - M.l - M.r}
          height={H - M.t - M.b}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </figure>
  );
}
