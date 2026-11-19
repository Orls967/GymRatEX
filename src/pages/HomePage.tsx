import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { EXERCISES } from '../content';
import { NAV_ITEMS } from '../ui/routes';

const MODULES = NAV_ITEMS.filter((n) => n.key !== 'about');

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-12 md:py-16">
          <div className="md:col-span-8">
            <p className="label-mono">{t('home.kicker')}</p>
            <h1 className="mt-2 text-5xl leading-[0.95] sm:text-7xl">{t('home.title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">{t('home.lead')}</p>
            <Link to="/otot" className="btn btn-accent mt-6">
              {t('home.start')} <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
          <aside className="border-l-4 border-accent pl-4 md:col-span-4 md:self-end">
            <p className="label-mono">{t('home.flow')}</p>
            <p className="mt-1 font-display text-2xl font-semibold uppercase leading-tight">{t('home.flowText')}</p>
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="label-mono mb-3">{t('home.modules')}</h2>
        <ol className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <li key={m.key} className="border-b border-line sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
              <Link to={m.path} className="group flex h-full gap-4 p-4 hover:bg-surface">
                <span className="font-mono text-sm text-accent">{m.num}</span>
                <span>
                  <span className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
                    <m.icon size={20} aria-hidden className="text-ink-muted group-hover:text-accent" />
                    {t(`nav.${m.key}`)}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {t(`home.desc.${m.key as 'muscles'}`, { count: EXERCISES.length })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
