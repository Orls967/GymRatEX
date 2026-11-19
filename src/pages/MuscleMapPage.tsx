import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, X } from 'lucide-react';
import { MUSCLES, MUSCLE_REGIONS, exercisesForMuscle, getMuscle } from '../content';
import { computeSkeleton, neutralPose } from '../lib/rig';
import { Stage } from '../scene/Stage';
import { CameraRig } from '../scene/CameraRig';
import { BodyModel } from '../scene/body/BodyModel';
import { muscleCentroid } from '../scene/body/muscleMeshes';
import { PageHeader } from '../ui/PageHeader';
import { Segmented } from '../ui/Segmented';
import { MuscleName } from '../ui/MuscleName';
import { VerifyBadge } from '../ui/VerifyBadge';
import { AutoLinkText } from '../ui/AutoLinkText';
import { useL } from '../ui/useL';

const pose = neutralPose();
pose.shoulder.l.abd = 0.28;
pose.shoulder.r.abd = 0.28;
pose.hip.l.abd = 0.08;
pose.hip.r.abd = 0.08;
const SKELETON = { current: computeSkeleton(pose) };

type View = 'front' | 'back';

export default function MuscleMapPage() {
  const { t } = useTranslation();
  const L = useL();
  const navigate = useNavigate();
  const { muscleId } = useParams();
  const selected = getMuscle(muscleId);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layer, setLayer] = useState<'1' | '2' | '3'>('1');
  const [viewOverride, setViewOverride] = useState<{ id: string | undefined; view: View } | null>(
    null,
  );
  const view: View =
    viewOverride && viewOverride.id === selected?.id
      ? viewOverride.view
      : (selected?.side ?? viewOverride?.view ?? 'front');

  const focus = useMemo(() => {
    const c = selected ? muscleCentroid(SKELETON.current, selected.id) : null;
    const dirZ = view === 'front' ? 1 : -1;
    const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
    if (c)
      return {
        target: [c.x * 0.6, c.y, 0] as [number, number, number],
        distance: narrow ? 2.2 : 1.55,
        dir: [0.15 * dirZ, 0.1, dirZ] as [number, number, number],
      };
    return {
      target: [0, 0.98, 0] as [number, number, number],
      distance: narrow ? 4.2 : 3.3,
      dir: [0, 0.08, dirZ] as [number, number, number],
    };
  }, [selected, view]);

  const related = useMemo(() => (selected ? exercisesForMuscle(selected.id) : []), [selected]);
  const hoveredMuscle = getMuscle(hovered ?? undefined);
  const select = (id: string) => navigate(id === selected?.id ? '/otot' : `/otot/${id}`);

  return (
    <div>
      <PageHeader num="01" title={t('muscles.title')} lead={t('muscles.lead')} />
      <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6 lg:px-4 lg:py-4">
        <section className="relative lg:sticky lg:top-16 lg:self-start">
          <Stage
            className="h-[58dvh] min-h-[340px] w-full border-b border-line lg:h-[calc(100dvh-170px)] lg:border"
            label={t('muscles.title')}
            frameloop="demand"
          >
            <BodyModel
              skeleton={SKELETON}
              selected={selected?.id ?? null}
              hovered={hovered}
              minLayer={Number(layer) as 1 | 2 | 3}
              onHover={setHovered}
              onSelect={select}
            />
            <CameraRig
              target={focus.target}
              direction={focus.dir}
              distance={focus.distance}
              nonce={`${selected?.id}-${view}`}
            />
          </Stage>
          <div className="pointer-events-none absolute left-3 top-3 max-w-[70%]">
            {hoveredMuscle && (
              <p className="border border-line bg-surface px-2 py-1 text-sm" aria-live="polite">
                <MuscleName muscle={hoveredMuscle} />
              </p>
            )}
          </div>
          <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-[2fr_3fr] lg:border-x">
            <div>
              <p className="label-mono mb-1">{t('muscles.view')}</p>
              <Segmented
                label={t('muscles.view')}
                value={view}
                onChange={(v) => setViewOverride({ id: selected?.id, view: v })}
                options={[
                  { value: 'front', label: t('muscles.front') },
                  { value: 'back', label: t('muscles.back') },
                ]}
                testId="view-toggle"
              />
            </div>
            <div>
              <p className="label-mono mb-1">{t('muscles.layer')}</p>
              <Segmented
                label={t('muscles.layer')}
                value={layer}
                onChange={setLayer}
                options={(['1', '2', '3'] as const).map((l) => ({
                  value: l,
                  label: t(`muscles.layers.${l}`),
                }))}
                testId="layer-toggle"
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-4 lg:px-0 lg:py-0" aria-live="polite">
          {selected ? (
            <article className="border-l-4 border-accent pl-4" data-testid="muscle-detail">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="label-mono">
                    {t(`muscles.regions.${selected.region}`)} · {t('muscles.layer')}{' '}
                    {selected.layer} — {t(`muscles.layers.${String(selected.layer) as '1'}`)}
                  </p>
                  <h2 className="mt-1 text-3xl">{L(selected.name)}</h2>
                  <p className="font-mono text-sm italic text-ink-muted">{selected.latin}</p>
                </div>
                <Link
                  to="/otot"
                  className="grid min-h-10 min-w-10 place-items-center border border-line"
                  aria-label={t('muscles.clear')}
                >
                  <X size={16} aria-hidden />
                </Link>
              </div>
              {selected.needsVerification && (
                <div className="mt-2">
                  <VerifyBadge />
                </div>
              )}
              <dl className="mt-4 grid gap-3 text-[0.95rem]">
                {(['origin', 'insertion', 'function'] as const).map((k) => (
                  <div
                    key={k}
                    className="grid gap-0.5 border-t border-line pt-2 sm:grid-cols-[7rem_1fr]"
                  >
                    <dt className="label-mono pt-0.5">{t(`muscles.${k}`)}</dt>
                    <dd>
                      <AutoLinkText text={L(selected[k])} />
                    </dd>
                  </div>
                ))}
              </dl>
              <h3 className="label-mono mt-5">{t('muscles.relatedExercises')}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {related.map(({ exercise, role }) => (
                  <li key={exercise.id}>
                    <Link
                      to={`/latihan/${exercise.id}`}
                      className="flex min-h-11 items-center gap-3 py-2 hover:text-accent"
                    >
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0"
                        style={{
                          background: `var(--c-int-${role === 'primary' ? 3 : role === 'synergist' ? 2 : 1})`,
                        }}
                      />
                      <span className="flex-1">{L(exercise.name)}</span>
                      <span className="label-mono">
                        {t(
                          `muscles.as${role === 'primary' ? 'Primary' : role === 'synergist' ? 'Synergist' : 'Stabilizer'}`,
                        )}
                      </span>
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={`/latihan?otot=${selected.id}`} className="btn mt-4">
                {t('muscles.showInLibrary')} <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          ) : (
            <p className="border-l-4 border-line-strong pl-4 text-ink-muted">{t('muscles.none')}</p>
          )}

          <nav aria-label={t('muscles.list')} className="mt-8">
            <h2 className="label-mono">{t('muscles.list')}</h2>
            {MUSCLE_REGIONS.filter((r) => MUSCLES.some((m) => m.region === r)).map((region) => (
              <div key={region} className="mt-3">
                <h3 className="font-display text-lg font-semibold uppercase text-ink-muted">
                  {t(`muscles.regions.${region}`)}
                </h3>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {MUSCLES.filter((m) => m.region === region).map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="chip"
                        aria-pressed={selected?.id === m.id}
                        onClick={() => select(m.id)}
                        onMouseEnter={() => setHovered(m.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(m.id)}
                        onBlur={() => setHovered(null)}
                        data-testid={`muscle-chip-${m.id}`}
                      >
                        {L(m.name)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
