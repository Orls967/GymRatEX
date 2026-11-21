import { useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrame, useThree } from '@react-three/fiber';
import { Check, X } from 'lucide-react';
import { EXERCISE_BY_ID, FORM_ERRORS, FORM_ERROR_BY_ID, type FormError } from '../content';
import { computeMoments } from '../lib/biomech';
import {
  DEFAULT_PARAMS,
  movementFrame,
  phaseAt,
  type Faults,
  type MovementFrame,
  type MovementParams,
} from '../lib/movements';
import { useReducedMotion } from '../lib/reducedMotion';
import type { Skeleton } from '../lib/rig';
import { Stage } from '../scene/Stage';
import { CameraRig } from '../scene/CameraRig';
import { BodyModel } from '../scene/body/BodyModel';
import { LoadProp } from '../scene/Props';
import { RiskZones } from '../scene/RiskZones';
import { PageHeader } from '../ui/PageHeader';
import { VerifyBadge } from '../ui/VerifyBadge';
import { AutoLinkText } from '../ui/AutoLinkText';
import { useL } from '../ui/useL';
import { useSceneTheme } from '../scene/sceneTheme';

const FAULTS: Record<string, Faults> = {
  'knee-valgus': { valgus: 1 },
  'butt-wink': { buttWink: 1 },
  'rounded-back': { rounding: 1 },
  'elbow-flare': { elbowFlare: 1 },
};

function demoParams(fe: FormError): MovementParams {
  if (fe.demo === 'hinge') return { ...DEFAULT_PARAMS.hinge, depth: 0.85 };
  if (fe.id === 'butt-wink') return { ...DEFAULT_PARAMS.squat, depth: 1, torso: 40 };
  return { ...DEFAULT_PARAMS.squat };
}

const SEP = { front: 0.72, side: 0.75, top: 0.85 } as const;

function Bench({ x }: { x: number }) {
  const t = useSceneTheme();
  return (
    <mesh position={[x, 0.22, 0.22]}>
      <boxGeometry args={[0.3, 0.44, 1.2]} />
      <meshStandardMaterial color={t.mode === 'dark' ? '#2b2926' : '#8d867b'} roughness={0.9} />
    </mesh>
  );
}

function Pair({ fe }: { fe: FormError }) {
  const reduced = useReducedMotion();
  const invalidate = useThree((s) => s.invalidate);
  const params = useMemo(() => demoParams(fe), [fe]);
  const faults = FAULTS[fe.id] ?? {};
  const good = useRef<MovementFrame>(movementFrame(fe.demo, params, 0.9));
  const bad = useRef<MovementFrame>(movementFrame(fe.demo, params, 0.9, faults));
  const goodSk = useMemo(
    () => ({
      get current(): Skeleton {
        return good.current.skeleton;
      },
    }),
    [],
  );
  const badSk = useMemo(
    () => ({
      get current(): Skeleton {
        return bad.current.skeleton;
      },
    }),
    [],
  );
  useFrame(({ clock }) => {
    const ph = reduced ? 0.95 : 0.15 + 0.85 * phaseAt(clock.elapsedTime, 3.4);
    good.current = movementFrame(fe.demo, params, ph);
    bad.current = movementFrame(fe.demo, params, ph, faults);
    if (!reduced) invalidate();
  });
  const sep = SEP[fe.view];
  const rotY = fe.view === 'side' ? Math.PI / 2 : 0;
  const barKind = 'barbell' as const;
  return (
    <>
      {[
        { x: -sep, sk: goodSk, ref: good, wrong: false },
        { x: sep, sk: badSk, ref: bad, wrong: true },
      ].map(({ x, sk, ref, wrong }) => (
        <group key={String(wrong)} position={[x, 0, 0]} rotation={[0, rotY, 0]}>
          <BodyModel skeleton={sk} interactive={false} />
          <LoadProp
            kind={barKind}
            getPosition={() => ref.current.bar}
            plateScale={fe.demo === 'bench' ? 0.6 : 0.85}
            barLength={fe.view === 'side' ? 2 : 1.3}
            ghost={fe.view === 'side'}
          />
          {wrong && <RiskZones zones={fe.zones} skeleton={sk} />}
        </group>
      ))}
      {fe.demo === 'bench' && (
        <>
          <Bench x={-sep} />
          <Bench x={sep} />
        </>
      )}
    </>
  );
}

export default function ComparePage() {
  const { t } = useTranslation();
  const L = useL();
  const navigate = useNavigate();
  const { errorId } = useParams();
  const fe = FORM_ERROR_BY_ID.get(errorId ?? '') ?? FORM_ERRORS[0];
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;

  const lumbar = useMemo(() => {
    if (!fe || fe.demo === 'bench') return null;
    const params = demoParams(fe);
    const calc = (f: Faults) =>
      computeMoments({
        frame: movementFrame(fe.demo, params, 1, f),
        pattern: fe.demo,
        loadKg: params.load,
        bodyMass: params.bodyMass,
      }).lumbar;
    return { ok: calc({}), bad: calc(FAULTS[fe.id] ?? {}) };
  }, [fe]);

  if (!fe) return null;
  const cam =
    fe.view === 'top'
      ? {
          target: [0, 0.55, 0.1] as [number, number, number],
          dir: [0, 1, 0.45] as [number, number, number],
          dist: narrow ? 4.6 : 3.4,
        }
      : {
          target: [0, 0.64, 0] as [number, number, number],
          dir: [0, 0.12, 1] as [number, number, number],
          dist: narrow ? 4.7 : 3.9,
        };

  return (
    <div>
      <PageHeader num="04" title={t('compare.title')} lead={t('compare.lead')} />
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <p className="label-mono mb-1">{t('compare.pick')}</p>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('compare.pick')}>
          {FORM_ERRORS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === fe.id}
              aria-current={f.id === fe.id ? 'true' : undefined}
              className="chip"
              onClick={() => navigate(`/benar-salah/${f.id}`)}
              data-testid={`error-tab-${f.id}`}
            >
              {L(f.title)}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-0 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:px-4">
        <section className="relative" aria-label={t('compare.title')}>
          <Stage
            className="h-[50dvh] min-h-[320px] w-full border-y border-line lg:h-[62dvh] lg:border"
            label={`${L(fe.title)} — ${t('compare.correct')} / ${t('compare.wrong')}`}
          >
            <Pair key={fe.id} fe={fe} />
            <CameraRig target={cam.target} direction={cam.dir} distance={cam.dist} nonce={fe.id} />
          </Stage>
          <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-2">
            <p className="m-3 flex items-center gap-1.5 justify-self-start border border-ok bg-surface px-2 py-1 font-display text-lg font-bold uppercase text-ok">
              <Check size={16} aria-hidden /> {t('compare.correct')}
            </p>
            <p className="m-3 flex items-center gap-1.5 justify-self-end border border-danger bg-surface px-2 py-1 font-display text-lg font-bold uppercase text-danger">
              <X size={16} aria-hidden /> {t('compare.wrong')}
            </p>
          </div>
          <p className="label-mono px-4 pt-2 lg:px-0">{t(`compare.views.${fe.view}`)}</p>
        </section>
        <article className="px-4 lg:px-0" data-testid="error-detail">
          <p className="label-mono">{t('compare.error')}</p>
          <h2 className="mt-1 text-4xl">{L(fe.title)}</h2>
          {fe.needsVerification && (
            <div className="mt-2">
              <VerifyBadge />
            </div>
          )}
          <p className="mt-2 text-lg">
            <AutoLinkText text={L(fe.summary)} />
          </p>
          <h3 className="label-mono mt-5">{t('compare.zones')}</h3>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {fe.zones.map((z) => (
              <li
                key={z}
                className="flex items-center gap-1.5 border border-danger px-2 py-1 text-sm"
              >
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-danger" />
                {t(`compare.zoneNames.${z}`)}
              </li>
            ))}
          </ul>
          <h3 className="label-mono mt-5">{t('compare.why')}</h3>
          <p className="mt-1">
            <AutoLinkText text={L(fe.why)} />
          </p>
          {lumbar && fe.zones.includes('lumbar') && (
            <div className="mt-4 border-y border-line py-2">
              <p className="label-mono">{t('compare.momentCompare')}</p>
              <p className="mt-1 font-mono text-xl tabular-nums">
                <span className="text-ok">{Math.round(lumbar.ok)}</span>
                <span className="text-ink-muted"> → </span>
                <span className="text-danger">{Math.round(lumbar.bad)}</span> {t('studio.nm')}
              </p>
            </div>
          )}
          <h3 className="label-mono mt-5">{t('compare.fix')}</h3>
          <ol className="mt-1 grid gap-2">
            {fe.fix.map((f, i) => (
              <li key={i} className="grid grid-cols-[2rem_1fr] border-t border-line pt-2">
                <span className="font-mono text-sm text-ok">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <AutoLinkText text={L(f)} />
                </span>
              </li>
            ))}
          </ol>
          <h3 className="label-mono mt-5">{t('compare.seen')}</h3>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {fe.exercises.map((id) => {
              const ex = EXERCISE_BY_ID.get(id);
              return ex ? (
                <li key={id}>
                  <Link to={`/latihan/${id}`} className="chip hover:text-ink">
                    {L(ex.name)}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </article>
      </div>
    </div>
  );
}
