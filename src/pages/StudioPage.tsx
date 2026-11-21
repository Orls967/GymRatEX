import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrame, useThree } from '@react-three/fiber';
import { AlertTriangle, Camera, Pause, Play } from 'lucide-react';
import { exerciseIntensities, getExercise } from '../content';
import { computeMoments } from '../lib/biomech';
import {
  movementFrame,
  PARAM_RANGES,
  phaseAt,
  type MovementFrame,
  type StudioPattern,
} from '../lib/movements';
import { skeletonAngles } from '../lib/jointAngles';
import { presetFor, PATTERN_EXERCISE } from '../lib/studioPresets';
import { useReducedMotion } from '../lib/reducedMotion';
import { useStudio } from '../store/studio';
import { Stage } from '../scene/Stage';
import { CameraRig } from '../scene/CameraRig';
import { BodyModel } from '../scene/body/BodyModel';
import { LoadProp } from '../scene/Props';
import { PageHeader } from '../ui/PageHeader';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { MomentChart, type MomentSeries } from '../ui/MomentChart';
import { IntensityLegend } from '../ui/IntensityLegend';
import { useL } from '../ui/useL';
import { STUDIO_PATTERNS } from '../content';

const SAMPLES = 41;

/** Loop animasi di dalam Canvas: memajukan waktu, menulis frame ke ref, sinkron fase ke store ~15 Hz. */
function Animator({
  frameRef,
  pattern,
}: {
  frameRef: { current: MovementFrame };
  pattern: StudioPattern;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const time = useRef(0);
  const lastSync = useRef(0);
  useFrame((_, dt) => {
    const st = useStudio.getState();
    let phase = st.phase;
    if (st.playing) {
      time.current += Math.min(dt, 0.1);
      phase = phaseAt(time.current, st.tempo);
      if (time.current - lastSync.current > 1 / 15) {
        lastSync.current = time.current;
        useStudio.setState({ phase });
      }
      invalidate();
    }
    frameRef.current = movementFrame(pattern, st.params, phase);
  });
  // saat dijeda, sinkronkan waktu agar melanjutkan dari fase yang dipilih (sisi turun)
  useEffect(
    () =>
      useStudio.subscribe((s, prev) => {
        if (!s.playing && s.phase !== prev.phase) {
          time.current = (Math.acos(1 - 2 * s.phase) / Math.PI) * 0.55 * s.tempo;
          lastSync.current = time.current;
        }
        if (s.params !== prev.params || s.phase !== prev.phase || s.playing !== prev.playing)
          invalidate();
      }),
    [invalidate],
  );
  return null;
}

export default function StudioPage() {
  const { t } = useTranslation();
  const L = useL();
  const { exerciseId } = useParams();
  const exercise = getExercise(exerciseId);
  const reduced = useReducedMotion();
  const { pattern, params, tempo, playing, phase, set, setParam } = useStudio();

  // inisialisasi dari latihan (bila ada)
  useEffect(() => {
    const p = exercise?.studio ?? useStudio.getState().pattern;
    set({ pattern: p, params: presetFor(p, exercise?.id), phase: 0 });
  }, [exercise, set]);
  useEffect(() => {
    if (reduced) set({ playing: false, phase: 0.85 });
  }, [reduced, set]);

  const frameRef = useRef<MovementFrame>(movementFrame(pattern, params, phase));
  const skeletonSource = useMemo(
    () => ({
      get current() {
        return frameRef.current.skeleton;
      },
    }),
    [],
  );

  const exForMuscles = exercise ?? getExercise(PATTERN_EXERCISE[pattern]);
  const intensities = useMemo(
    () => (exForMuscles ? exerciseIntensities(exForMuscles) : {}),
    [exForMuscles],
  );

  const series = useMemo<MomentSeries[]>(() => {
    const knee: number[] = [];
    const hip: number[] = [];
    const lumbar: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const fr = movementFrame(pattern, params, i / (SAMPLES - 1));
      const m = computeMoments({
        frame: fr,
        pattern,
        loadKg: params.load,
        bodyMass: params.bodyMass,
      });
      knee.push(m.knee);
      hip.push(m.hip);
      lumbar.push(m.lumbar);
    }
    return [
      { key: 'knee', values: knee },
      { key: 'hip', values: hip },
      { key: 'lumbar', values: lumbar },
    ];
  }, [pattern, params]);

  const current = useMemo(() => {
    const fr = movementFrame(pattern, params, phase);
    return {
      fr,
      m: computeMoments({ frame: fr, pattern, loadKg: params.load, bodyMass: params.bodyMass }),
      a: skeletonAngles(fr.skeleton),
    };
  }, [pattern, params, phase]);

  const ranges = PARAM_RANGES[pattern];
  const name = exercise ? L(exercise.name) : t(`studio.patterns.${pattern}`);
  const loadKind = pattern === 'lunge' ? 'dumbbells' : 'barbell';
  const peak = (k: MomentSeries['key']) =>
    Math.max(...(series.find((s) => s.key === k)?.values ?? [0]));

  return (
    <div>
      <PageHeader num="03" title={t('studio.title')} lead={t('studio.lead')}>
        {exercise && (
          <p className="label-mono self-end">
            {t('studio.fromExercise', { name: L(exercise.name) })}
          </p>
        )}
      </PageHeader>
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6 lg:px-4 lg:py-4">
        <section className="lg:sticky lg:top-16 lg:self-start">
          <div className="border-b border-line p-3 lg:border lg:border-b-0">
            <Segmented
              label={t('studio.movement')}
              value={pattern}
              onChange={(p) => set({ pattern: p, params: presetFor(p) })}
              options={STUDIO_PATTERNS.map((p) => ({ value: p, label: t(`studio.patterns.${p}`) }))}
              testId="pattern-toggle"
            />
          </div>
          <Stage
            className="h-[48dvh] min-h-[300px] w-full border-b border-line lg:h-[58dvh] lg:border"
            label={t('studio.canvasLabel', { name })}
          >
            <Animator frameRef={frameRef} pattern={pattern} />
            <BodyModel
              skeleton={skeletonSource}
              intensities={intensities}
              dimInactive
              interactive={false}
            />
            <LoadProp
              kind={loadKind}
              spread={0.5}
              getPosition={() => (params.load > 0 ? frameRef.current.bar : null)}
            />
            <CameraRig
              target={[0, pattern === 'ohp' ? 1.0 : 0.9, 0]}
              direction={[1, 0.22, 0.85]}
              distance={3.8}
              fitHeight={pattern === 'ohp' ? 2.6 : 2.15}
              nonce={pattern}
              enablePan
            />
          </Stage>
          <div className="flex items-center gap-3 border-b border-line p-3 lg:border-x">
            <button
              type="button"
              className="btn btn-accent min-w-28 justify-center"
              onClick={() => set({ playing: !playing })}
              aria-pressed={playing}
              data-testid="play-toggle"
            >
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? t('studio.pause') : t('studio.play')}
            </button>
            <div className="flex-1">
              <Slider
                label={t('studio.phase')}
                value={Number(phase.toFixed(2))}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set({ phase: v, playing: false })}
                format={(v) => v.toFixed(2)}
                testId="phase-slider"
              />
            </div>
          </div>
          {reduced && (
            <p className="px-3 py-2 text-sm text-ink-muted">{t('studio.reducedMotion')}</p>
          )}
          <div className="px-3 py-2 lg:px-0">
            <IntensityLegend />
          </div>
        </section>

        <section className="grid content-start gap-5 px-4 py-4 lg:px-0 lg:py-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider
              label={t('studio.depth')}
              value={params.depth}
              {...ranges.depth}
              onChange={(v) => setParam('depth', v)}
              format={(v) => `${Math.round(v * 100)}%`}
              testId="depth-slider"
            />
            <Slider
              label={t('studio.torso')}
              value={params.torso}
              {...ranges.torso}
              onChange={(v) => setParam('torso', v)}
              format={(v) => `${v}°`}
              testId="torso-slider"
            />
            <Slider
              label={t('studio.stance')}
              value={params.stance}
              {...ranges.stance}
              onChange={(v) => setParam('stance', v)}
              format={(v) => `${Math.round(v * 100)} ${t('common.cm')}`}
            />
            <Slider
              label={t('studio.load')}
              value={params.load}
              {...ranges.load}
              onChange={(v) => setParam('load', v)}
              format={(v) => `${v} ${t('common.kg')}`}
              testId="load-slider"
            />
            <Slider
              label={t('studio.bodyMass')}
              value={params.bodyMass}
              min={40}
              max={140}
              step={1}
              onChange={(v) => setParam('bodyMass', v)}
              format={(v) => `${v} ${t('common.kg')}`}
            />
            <Slider
              label={t('studio.tempo')}
              value={tempo}
              min={1.5}
              max={6}
              step={0.5}
              onChange={(v) => set({ tempo: v })}
              format={(v) => `${v} ${t('common.s')}`}
            />
          </div>

          {!current.fr.balanced && (
            <p
              role="status"
              className="flex items-start gap-2 border-l-4 border-danger pl-3 text-sm"
            >
              <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-danger" />
              {t('studio.unbalanced')}
            </p>
          )}

          <MomentChart series={series} cursor={phase} />

          <table className="w-full border-collapse text-sm" data-testid="moment-table">
            <caption className="sr-only">{t('studio.table')}</caption>
            <thead>
              <tr className="label-mono text-left">
                <th className="border-b border-line py-1 font-normal">{t('studio.joint')}</th>
                <th className="border-b border-line py-1 text-right font-normal">
                  {t('studio.current')}
                </th>
                <th className="border-b border-line py-1 text-right font-normal">
                  {t('studio.peak')}
                </th>
                <th className="border-b border-line py-1 text-right font-normal">
                  {t('studio.momentArm')}
                </th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {(['knee', 'hip', 'lumbar'] as const).map((k, i) => (
                <tr key={k}>
                  <th
                    scope="row"
                    className="border-b border-line py-1.5 text-left font-sans font-normal"
                  >
                    <span
                      className="mr-2 inline-block h-0.5 w-4 align-middle"
                      style={{ background: `var(--c-chart-${i + 1})` }}
                    />
                    {t(`studio.${k}`)}
                  </th>
                  <td className="border-b border-line py-1.5 text-right">
                    {Math.round(current.m[k])}
                  </td>
                  <td className="border-b border-line py-1.5 text-right">{Math.round(peak(k))}</td>
                  <td className="border-b border-line py-1.5 text-right">
                    {(current.m.arms[k] * 100).toFixed(0)} {t('common.cm')}
                  </td>
                </tr>
              ))}
              {pattern === 'ohp' && (
                <tr>
                  <th
                    scope="row"
                    className="border-b border-line py-1.5 text-left font-sans font-normal"
                  >
                    <span className="mr-6" />
                    {t('studio.shoulder')}
                  </th>
                  <td className="border-b border-line py-1.5 text-right">
                    {Math.round(current.m.shoulder)}
                  </td>
                  <td className="border-b border-line py-1.5 text-right">—</td>
                  <td className="border-b border-line py-1.5 text-right">
                    {(current.m.arms.shoulder * 100).toFixed(0)} {t('common.cm')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div>
            <p className="label-mono">{t('studio.jointAngles')}</p>
            <dl className="mt-1 grid grid-cols-3 border-y border-line font-mono tabular-nums">
              {(
                [
                  ['knee', current.a.knee],
                  ['hip', current.a.hip],
                  ['torso', current.a.torso],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="border-r border-line px-2 py-2 last:border-r-0">
                  <dt className="label-mono">{t(`studio.${k}`)}</dt>
                  <dd className="text-2xl">{Math.round(v)}°</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="border-l-4 border-line-strong pl-3 text-sm text-ink-muted">
            {t('studio.chartNote')}
          </p>

          {exercise?.webcam && (
            <Link to={`/webcam?mode=${exercise.webcam}`} className="btn justify-self-start">
              <Camera size={16} aria-hidden /> {t('studio.toWebcam')}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
