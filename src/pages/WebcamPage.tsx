import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, CameraOff, RotateCcw, ShieldCheck } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { WEBCAM_MODES } from '../content';
import { computeAngles, Ema, POSE_EDGES, type JointAngles2D, type Landmark } from '../lib/pose2d';
import { RepCounter } from '../lib/repCounter';
import { liveFeedback, REP_CONFIG, repFeedback, repMetric, type FeedbackKey, type WebcamMode } from '../lib/formFeedback';
import { PageHeader } from '../ui/PageHeader';
import { Segmented } from '../ui/Segmented';

type Status = 'idle' | 'loading' | 'running' | 'error';

const BASE = import.meta.env.BASE_URL;

async function createLandmarker(): Promise<PoseLandmarker> {
  // dimuat malas: WASM & model di-host lokal di /mediapipe (tidak ada CDN, tidak ada unggahan video)
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`);
  const make = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: `${BASE}mediapipe/pose_landmarker_lite.task`, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  try {
    return await make('GPU');
  } catch {
    return await make('CPU');
  }
}

function cssVar(name: string) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return '#ff6a13';
  }
}

function drawPose(ctx: CanvasRenderingContext2D, lms: readonly Landmark[], w: number, h: number) {
  const accent = cssVar('--c-accent');
  const ink = '#ffffff';
  ctx.lineWidth = Math.max(3, w / 220);
  ctx.strokeStyle = accent;
  for (const [a, b] of POSE_EDGES) {
    const p = lms[a];
    const q = lms[b];
    if (!p || !q || (p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * w, p.y * h);
    ctx.lineTo(q.x * w, q.y * h);
    ctx.stroke();
  }
  ctx.fillStyle = ink;
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = lms[i];
    if (!p || (p.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(4, w / 160), 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function WebcamPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const modeParam = params.get('mode');
  const mode: WebcamMode = (WEBCAM_MODES as readonly string[]).includes(modeParam ?? '') ? (modeParam as WebcamMode) : 'squat';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const counterRef = useRef(new RepCounter(REP_CONFIG[mode]));
  const emaRef = useRef({ knee: new Ema(), elbow: new Ema(), hip: new Ema(), torso: new Ema() });
  const modeRef = useRef(mode);

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [reps, setReps] = useState(0);
  const [angles, setAngles] = useState<JointAngles2D | null>(null);
  const [feedback, setFeedback] = useState<FeedbackKey | null>(null);
  const [personVisible, setPersonVisible] = useState(true);

  useEffect(() => {
    modeRef.current = mode;
    counterRef.current = new RepCounter(REP_CONFIG[mode]);
    setReps(0);
    setFeedback(null);
  }, [mode]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  useEffect(() => stop, [stop]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    if (!video || !canvas || !lm) return;
    let lastVideoTime = -1;
    let lastUi = 0;
    let lastRepFeedback: FeedbackKey | null = null;
    let lastRepAt = 0;
    const ctx = canvas.getContext('2d');
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      const now = performance.now();
      const res = lm.detectForVideo(video, now);
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      const lms = res.landmarks[0];
      if (!lms) {
        if (now - lastUi > 150) {
          lastUi = now;
          setPersonVisible(false);
        }
        return;
      }
      if (ctx) drawPose(ctx, lms, canvas.width, canvas.height);
      const raw = computeAngles(lms);
      if (!raw) return;
      const e = emaRef.current;
      const a: JointAngles2D = {
        ...raw,
        knee: e.knee.next(raw.knee),
        elbow: e.elbow.next(raw.elbow),
        hip: e.hip.next(raw.hip),
        torsoTilt: e.torso.next(raw.torsoTilt),
      };
      const m = modeRef.current;
      const ev = counterRef.current.update(repMetric(m, a));
      if (ev) {
        lastRepFeedback = repFeedback(m, ev);
        lastRepAt = now;
      }
      if (now - lastUi > 100) {
        lastUi = now;
        setPersonVisible(raw.confidence > 0.5);
        setAngles(a);
        setReps(counterRef.current.count);
        const live = liveFeedback(m, a);
        setFeedback(live ?? (now - lastRepAt < 2500 ? lastRepFeedback : null));
      }
    };
    tick();
  }, []);

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError(t('webcam.unsupported'));
      return;
    }
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (err) {
      const e = err as DOMException;
      setStatus('error');
      setError(e?.name === 'NotAllowedError' ? t('webcam.denied') : t('webcam.cameraError', { msg: e?.message ?? String(err) }));
      return;
    }
    try {
      landmarkerRef.current = await createLandmarker();
    } catch (err) {
      stop();
      setStatus('error');
      setError(t('webcam.modelError', { msg: (err as Error)?.message ?? String(err) }));
      return;
    }
    setStatus('running');
    loop();
  };

  const reset = () => {
    counterRef.current.reset();
    setReps(0);
    setFeedback(null);
  };

  const running = status === 'running';
  const feedbackTone = feedback === 'good' ? 'border-ok' : feedback ? 'border-danger' : 'border-line';

  return (
    <div>
      <PageHeader num="05" title={t('webcam.title')} lead={t('webcam.lead')} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-line bg-surface-2">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              aria-hidden
            />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" aria-hidden />
            {!running && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <Camera size={36} aria-hidden className="mx-auto text-ink-muted" />
                  <p className="mt-2 text-sm text-ink-muted">{status === 'loading' ? t('webcam.loadingModel') : t('webcam.tips')}</p>
                </div>
              </div>
            )}
            {running && (
              <div className="absolute left-3 top-3 border border-line bg-surface px-3 py-1">
                <p className="label-mono">{t('webcam.reps')}</p>
                <p className="font-mono text-4xl tabular-nums" data-testid="rep-count" aria-live="polite">
                  {reps}
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {running ? (
              <button type="button" className="btn" onClick={stop} data-testid="camera-stop">
                <CameraOff size={16} aria-hidden /> {t('webcam.stop')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => void start()}
                disabled={status === 'loading'}
                data-testid="camera-start"
              >
                <Camera size={16} aria-hidden /> {status === 'loading' ? t('webcam.loadingModel') : t('webcam.start')}
              </button>
            )}
            <button type="button" className="btn" onClick={reset} disabled={!running}>
              <RotateCcw size={16} aria-hidden /> {t('webcam.reset')}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 border-l-4 border-danger pl-3 text-sm" data-testid="webcam-error">
              {error}
            </p>
          )}
        </section>
        <section className="grid content-start gap-5">
          <aside className="border border-ok/60 p-3" data-testid="privacy-note">
            <p className="flex items-center gap-2 font-display text-lg font-bold uppercase">
              <ShieldCheck size={18} aria-hidden className="text-ok" /> {t('webcam.privacyTitle')}
            </p>
            <p className="mt-1 text-sm">{t('webcam.privacy')}</p>
          </aside>
          <div>
            <p className="label-mono mb-1">{t('webcam.exercise')}</p>
            <Segmented
              label={t('webcam.exercise')}
              value={mode}
              onChange={(m) => setParams({ mode: m }, { replace: true })}
              options={WEBCAM_MODES.map((m) => ({ value: m, label: t(`webcam.modes.${m}`) }))}
            />
          </div>
          <div aria-live="polite">
            <p className="label-mono">{t('webcam.feedback')}</p>
            <p className={`mt-1 min-h-14 border-l-4 ${feedbackTone} pl-3 text-lg`}>
              {running && !personVisible ? t('webcam.noPerson') : feedback ? t(`webcam.msg.${feedback}`) : '—'}
            </p>
          </div>
          <div>
            <p className="label-mono">{t('webcam.angles')}</p>
            <dl className="mt-1 grid grid-cols-2 border-y border-line font-mono tabular-nums sm:grid-cols-4">
              {(
                [
                  ['knee', angles?.knee],
                  ['hip', angles?.hip],
                  ['shoulder', angles?.elbow],
                  ['torso', angles?.torsoTilt],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="border-r border-line px-2 py-2 last:border-r-0">
                  <dt className="label-mono">{k === 'shoulder' ? t('compare.zoneNames.elbow') : t(`studio.${k}`)}</dt>
                  <dd className="text-2xl">{v === undefined ? '—' : `${Math.round(v)}°`}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="border-l-4 border-line-strong pl-3 text-sm text-ink-muted">{t('webcam.limitation')}</p>
        </section>
      </div>
    </div>
  );
}
