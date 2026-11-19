import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowLeft, Camera, SplitSquareHorizontal } from 'lucide-react';
import {
  EQUIPMENT,
  EXERCISES,
  FORM_ERROR_BY_ID,
  MUSCLES,
  MUSCLE_BY_ID,
  exerciseIntensities,
  getExercise,
  type Exercise,
} from '../content';
import { computeSkeleton, neutralPose } from '../lib/rig';
import { Stage } from '../scene/Stage';
import { CameraRig } from '../scene/CameraRig';
import { BodyModel } from '../scene/body/BodyModel';
import { PageHeader } from '../ui/PageHeader';
import { Segmented } from '../ui/Segmented';
import { IntensityLegend } from '../ui/IntensityLegend';
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

function dominantSide(ex: Exercise): View {
  let front = 0;
  let back = 0;
  for (const id of ex.primary) {
    const m = MUSCLE_BY_ID.get(id);
    if (m?.side === 'back') back += 1;
    else front += 1;
  }
  return back > front ? 'back' : 'front';
}

function MuscleRoleList({ ids, lvl, title }: { ids: readonly string[]; lvl: 1 | 2 | 3; title: string }) {
  if (ids.length === 0) return null;
  return (
    <div className="border-t border-line pt-2">
      <h3 className="label-mono flex items-center gap-2">
        <span aria-hidden className="inline-block h-2.5 w-5" style={{ background: `var(--c-int-${lvl})` }} />
        {title}
      </h3>
      <ul className="mt-1 grid gap-0.5">
        {ids.map((id) => {
          const m = MUSCLE_BY_ID.get(id);
          return m ? (
            <li key={id}>
              <Link to={`/otot/${id}`} className="text-[0.95rem] hover:text-accent">
                <MuscleName muscle={m} />
              </Link>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
}

function ExerciseDetail({ ex }: { ex: Exercise }) {
  const { t } = useTranslation();
  const L = useL();
  const [viewOverride, setViewOverride] = useState<{ id: string; view: View } | null>(null);
  const view = viewOverride?.id === ex.id ? viewOverride.view : dominantSide(ex);
  const intensities = useMemo(() => exerciseIntensities(ex), [ex]);
  const dirZ = view === 'front' ? 1 : -1;
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <article data-testid="exercise-detail">
      <div className="relative">
        <Stage className="h-[52dvh] min-h-[320px] w-full border-y border-line lg:border" label={L(ex.name)}>
          <BodyModel skeleton={SKELETON} intensities={intensities} dimInactive interactive={false} />
          <CameraRig target={[0, 0.98, 0]} direction={[0, 0.06, dirZ]} distance={narrow ? 4.1 : 3.2} nonce={`${ex.id}-${view}`} />
        </Stage>
        <div className="absolute right-3 top-3 w-44">
          <Segmented
            label={t('muscles.view')}
            value={view}
            onChange={(v) => setViewOverride({ id: ex.id, view: v })}
            options={[
              { value: 'front', label: t('muscles.front') },
              { value: 'back', label: t('muscles.back') },
            ]}
          />
        </div>
      </div>
      <div className="px-4 py-4 lg:px-0">
        <IntensityLegend />
        <p className="label-mono mt-4">
          {t(`exercises.patterns.${ex.pattern}`)} · {ex.equipment.map((e) => t(`exercises.equipment.${e}`)).join(' / ')}
        </p>
        <h2 className="mt-1 text-4xl">{L(ex.name)}</h2>
        {ex.needsVerification && (
          <div className="mt-2">
            <VerifyBadge />
          </div>
        )}
        <p className="mt-2 max-w-prose">
          <AutoLinkText text={L(ex.summary)} />
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ex.studio && (
            <Link to={`/studio/${ex.id}`} className="btn btn-accent">
              <Activity size={16} aria-hidden /> {t('exercises.openStudio')}
            </Link>
          )}
          {ex.webcam && (
            <Link to={`/webcam?mode=${ex.webcam}`} className="btn">
              <Camera size={16} aria-hidden /> {t('exercises.openWebcam')}
            </Link>
          )}
        </div>
        {!ex.studio && <p className="mt-2 text-sm text-ink-muted">{t('exercises.notInStudio')}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MuscleRoleList ids={ex.primary} lvl={3} title={t('exercises.primary')} />
          <MuscleRoleList ids={ex.synergist} lvl={2} title={t('exercises.synergist')} />
          <MuscleRoleList ids={ex.stabilizer} lvl={1} title={t('exercises.stabilizer')} />
        </div>

        <h3 className="label-mono mt-6">{t('exercises.cues')}</h3>
        <ol className="mt-2 grid gap-2">
          {ex.cues.map((c, i) => (
            <li key={i} className="grid grid-cols-[2rem_1fr] border-t border-line pt-2">
              <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <AutoLinkText text={L(c)} />
              </span>
            </li>
          ))}
        </ol>

        {ex.errors.length > 0 && (
          <>
            <h3 className="label-mono mt-6">{t('exercises.errors')}</h3>
            <ul className="mt-2 grid gap-2">
              {ex.errors.map((id) => {
                const fe = FORM_ERROR_BY_ID.get(id);
                return fe ? (
                  <li key={id}>
                    <Link
                      to={`/benar-salah/${id}`}
                      className="flex min-h-11 items-center gap-3 border border-line px-3 hover:border-danger"
                    >
                      <SplitSquareHorizontal size={16} aria-hidden className="text-danger" />
                      <span className="flex-1">{L(fe.title)}</span>
                      <span className="label-mono">{t('exercises.openCompare')}</span>
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}

export default function ExerciseLibraryPage() {
  const { t } = useTranslation();
  const L = useL();
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const [params, setParams] = useSearchParams();
  const selected = getExercise(exerciseId);
  const muscleFilter = params.get('otot') ?? '';
  const equipFilter = params.get('alat') ?? '';

  const list = useMemo(
    () =>
      EXERCISES.filter((e) => {
        if (muscleFilter && ![...e.primary, ...e.synergist, ...e.stabilizer].includes(muscleFilter)) return false;
        if (equipFilter && !e.equipment.includes(equipFilter as Exercise['equipment'][number])) return false;
        return true;
      }),
    [muscleFilter, equipFilter],
  );

  const setFilter = (key: 'otot' | 'alat', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const roleOf = (e: Exercise): 1 | 2 | 3 | 0 =>
    !muscleFilter ? 0 : e.primary.includes(muscleFilter) ? 3 : e.synergist.includes(muscleFilter) ? 2 : 1;

  const sortedMuscles = useMemo(() => [...MUSCLES].sort((a, b) => L(a.name).localeCompare(L(b.name))), [L]);

  return (
    <div>
      <PageHeader num="02" title={t('exercises.title')} lead={t('exercises.lead')} />
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-6 lg:px-4 lg:py-4">
        <section className={`order-2 px-4 py-4 lg:order-1 lg:px-0 lg:py-0 ${selected ? 'hidden lg:block' : ''}`}>
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="label-mono">{t('exercises.filterMuscle')}</span>
              <select
                value={muscleFilter}
                onChange={(e) => setFilter('otot', e.target.value)}
                className="min-h-11 w-full min-w-0 border border-line bg-surface px-2 text-ink"
                data-testid="filter-muscle"
              >
                <option value="">{t('exercises.all')}</option>
                {sortedMuscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {L(m.name)} · {m.latin}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="min-w-0">
              <legend className="label-mono mb-1">{t('exercises.filterEquipment')}</legend>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="chip" aria-pressed={!equipFilter} onClick={() => setFilter('alat', '')}>
                  {t('exercises.all')}
                </button>
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    className="chip"
                    aria-pressed={equipFilter === eq}
                    onClick={() => setFilter('alat', equipFilter === eq ? '' : eq)}
                  >
                    {t(`exercises.equipment.${eq}`)}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <p className="label-mono mt-4" aria-live="polite">
            {t('exercises.results', { count: list.length })}
          </p>
          <ul className="mt-2 border-t border-line" data-testid="exercise-list">
            {list.map((e) => {
              const role = roleOf(e);
              return (
                <li key={e.id} className="border-b border-line">
                  <Link
                    to={`/latihan/${e.id}${params.toString() ? `?${params.toString()}` : ''}`}
                    aria-current={selected?.id === e.id ? 'true' : undefined}
                    className={`flex min-h-14 items-center gap-3 py-2 pr-2 ${
                      selected?.id === e.id ? 'shadow-[inset_3px_0_0_var(--c-accent)] pl-3' : 'pl-0 hover:pl-1'
                    } transition-[padding]`}
                  >
                    {role > 0 && <span aria-hidden className="h-8 w-1.5 shrink-0" style={{ background: `var(--c-int-${role})` }} />}
                    <span className="flex-1">
                      <span className="block font-display text-xl font-semibold uppercase leading-tight">{L(e.name)}</span>
                      <span className="block text-xs text-ink-muted">
                        {t(`exercises.patterns.${e.pattern}`)} · {e.equipment.map((q) => t(`exercises.equipment.${q}`)).join(' / ')}
                      </span>
                    </span>
                    {e.studio && <Activity size={15} aria-label={t('nav.studio')} className="text-ink-muted" />}
                    {e.webcam && <Camera size={15} aria-label={t('nav.webcam')} className="text-ink-muted" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="order-1 lg:order-2 lg:sticky lg:top-16 lg:self-start">
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => navigate(`/latihan${params.toString() ? `?${params.toString()}` : ''}`)}
                className="flex min-h-11 items-center gap-2 px-4 font-mono text-xs uppercase tracking-wider text-ink-muted hover:text-ink lg:hidden"
              >
                <ArrowLeft size={14} aria-hidden /> {t('exercises.back')}
              </button>
              <ExerciseDetail ex={selected} />
            </>
          ) : (
            <div className="hidden h-full min-h-[300px] place-items-center border border-dashed border-line p-8 text-center text-ink-muted lg:grid">
              <p>{t('exercises.lead')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
