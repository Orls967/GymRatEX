import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowRight, BookOpen, Info, Search } from 'lucide-react';
import { EXERCISES, FORM_ERRORS, GLOSSARY, MUSCLES, STUDIO_PATTERNS } from '../content';
import type { StudioPattern } from '../lib/movements';
import { hasWebGL } from '../scene/perf';
import { NAV_ITEMS } from '../ui/routes';
import { IntensityLegend } from '../ui/IntensityLegend';

const HeroScene = lazy(() => import('../scene/HeroScene'));

const STEPS = NAV_ITEMS.filter((n) =>
  ['muscles', 'exercises', 'studio', 'compare', 'webcam'].includes(n.key),
);

/** Siluet statis: tampil selagi scene 3D dimuat, dan sebagai cadangan tanpa WebGL. */
function HeroPoster() {
  return (
    <svg
      viewBox="0 0 200 320"
      className="mx-auto h-full max-h-full w-auto text-ink-muted"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="100" cy="34" rx="15" ry="19" />
      <path d="M86 56 Q100 62 114 56 M58 74 Q100 60 142 74 L134 140 Q100 150 66 140 Z" />
      <path d="M58 76 L40 140 M142 76 L160 140 M40 140 L36 196 M160 140 L164 196" />
      <path d="M70 142 Q100 156 130 142 L134 190 L66 190 Z" />
      <path
        d="M66 190 L74 258 L72 306 M134 190 L126 258 L128 306"
        stroke="var(--c-accent)"
        strokeWidth="2.5"
      />
      <path d="M66 190 L96 190 L90 258 L74 258 Z M134 190 L104 190 L110 258 L126 258 Z" />
      <path d="M40 316 H160" strokeDasharray="3 5" />
    </svg>
  );
}

const HERO_PATTERNS: readonly StudioPattern[] = ['squat', 'hinge', 'lunge', 'ohp'];

function Hero() {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState<StudioPattern>('squat');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const webgl = hasWebGL();

  // Scene 3D dimuat setelah teks tampil, agar paint pertama cepat.
  useEffect(() => {
    const idle = (window as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    const id = idle ? idle(() => setMounted(true)) : window.setTimeout(() => setMounted(true), 200);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-b border-line" aria-labelledby="home-title">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-12">
        <div className="px-4 pb-8 pt-10 lg:col-span-5 lg:py-20 lg:pr-10">
          <p className="label-mono">{t('home.kicker')}</p>
          <h1
            id="home-title"
            className="mt-3 text-[3.6rem] leading-[0.9] sm:text-8xl lg:text-[5.6rem]"
          >
            {t('home.title')}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">{t('home.lead')}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/otot" className="btn btn-accent" data-testid="hero-cta">
              {t('home.start')} <ArrowRight size={18} aria-hidden />
            </Link>
            <a href="#alur" className="btn" onClick={scrollToFlow}>
              {t('home.seeFlow')} <ArrowDown size={16} aria-hidden />
            </a>
          </div>
        </div>
        <div className="border-t border-line lg:col-span-7 lg:border-l lg:border-t-0">
          <div
            ref={box}
            className="relative h-[52dvh] min-h-[340px] bg-[var(--c-scene-bg)] lg:h-[calc(100dvh-14rem)] lg:min-h-[480px]"
          >
            <div className="absolute inset-0 grid place-items-center p-6">
              <HeroPoster />
            </div>
            {mounted && webgl && (
              <div className="hero-canvas absolute inset-0">
                <Suspense fallback={null}>
                  <HeroScene pattern={pattern} active={visible} label={t('home.heroLabel')} />
                </Suspense>
              </div>
            )}
          </div>
          <div className="grid gap-3 border-t border-line px-4 py-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <div
              role="radiogroup"
              aria-label={t('home.heroPick')}
              className="flex flex-wrap gap-1.5"
            >
              {HERO_PATTERNS.filter((p) => STUDIO_PATTERNS.includes(p)).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={pattern === p}
                  aria-pressed={pattern === p}
                  className="chip"
                  onClick={() => setPattern(p)}
                >
                  {t(`studio.patterns.${p}`)}
                </button>
              ))}
            </div>
            <div className="sm:justify-self-end">
              <IntensityLegend />
            </div>
            <p className="text-xs text-ink-muted sm:col-span-2">
              {t('home.heroHint')} {t('home.heroNote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function scrollToFlow(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById('alur');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

function Flow() {
  const { t } = useTranslation();
  const counts: Record<string, number> = {
    muscles: MUSCLES.length,
    exercises: EXERCISES.length,
    studio: STUDIO_PATTERNS.length,
    compare: FORM_ERRORS.length,
    webcam: 0,
  };
  return (
    <section
      id="alur"
      tabIndex={-1}
      className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 outline-none lg:py-20"
      aria-labelledby="flow-title"
    >
      <p className="label-mono">{t('home.flowKicker')}</p>
      <h2 id="flow-title" className="mt-2 max-w-3xl text-4xl sm:text-6xl">
        {t('home.flowTitle')}
      </h2>
      <p className="mt-3 max-w-xl text-ink-muted">{t('home.flowLead')}</p>
      <ol className="flow-track mt-10 grid gap-0 lg:grid-cols-5">
        {STEPS.map((m, i) => {
          const key = m.key as 'muscles';
          return (
            <li key={m.key} className="flow-step relative">
              <Link
                to={m.path}
                className="group block h-full pb-10 pl-12 pr-2 lg:pb-0 lg:pl-0 lg:pr-6 lg:pt-14"
              >
                <span
                  aria-hidden
                  className="flow-node absolute left-0 top-0 grid h-9 w-9 place-items-center border border-line-strong bg-bg font-mono text-xs group-hover:border-accent group-hover:text-accent lg:top-0"
                >
                  {m.num}
                </span>
                <span className="label-mono block">
                  {t('home.step')} {i + 1}
                </span>
                <span className="mt-1 flex items-center gap-2 font-display text-3xl font-bold uppercase leading-none group-hover:text-accent">
                  {t(`nav.${m.key}`)}
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-ink-muted">
                  {t(`home.steps.${key}`)}
                </span>
                <span className="mt-3 block font-mono text-xs uppercase tracking-wider text-ink">
                  {t(`home.facts.${key}`, { count: counts[m.key] ?? 0 })}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Support() {
  const { t } = useTranslation();
  return (
    <section className="border-t border-line bg-surface" aria-labelledby="support-title">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="label-mono">{t('home.supportKicker')}</p>
          <h2 id="support-title" className="mt-2 text-4xl">
            {t('home.supportTitle')}
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Search size={15} aria-hidden /> {t('home.searchText')}{' '}
            <kbd className="font-mono text-xs text-ink">{t('search.shortcut')}</kbd>
          </p>
        </div>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:col-span-8">
          <li className="bg-surface">
            <Link to="/glosarium" className="group flex h-full gap-3 p-5 hover:bg-surface-2">
              <BookOpen size={20} aria-hidden className="mt-1 shrink-0 text-accent" />
              <span>
                <span className="block font-display text-2xl font-bold uppercase group-hover:text-accent">
                  {t('nav.glossary')}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {t('home.glossaryText', { count: GLOSSARY.length })}
                </span>
              </span>
            </Link>
          </li>
          <li className="bg-surface">
            <Link to="/tentang" className="group flex h-full gap-3 p-5 hover:bg-surface-2">
              <Info size={20} aria-hidden className="mt-1 shrink-0 text-accent" />
              <span>
                <span className="block font-display text-2xl font-bold uppercase group-hover:text-accent">
                  {t('nav.about')}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">{t('home.aboutText')}</span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Flow />
      <Support />
    </div>
  );
}
