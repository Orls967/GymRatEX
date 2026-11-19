import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from './routes';
import { LangToggle, ThemeToggle } from './PrefsControls';
import { SearchDialog } from './SearchDialog';
import { useSearchShortcut } from './useSearchShortcut';

export function Layout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useSearchShortcut();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        {t('app.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="flex items-baseline gap-2" aria-label={t('nav.home')}>
            <span aria-hidden className="block h-3 w-5 translate-y-[-2px] bg-accent" />
            <span className="font-display text-2xl font-bold uppercase tracking-wide">
              Otot<span className="text-accent">Lapis</span>
            </span>
          </Link>
          <nav aria-label={t('nav.main')} className="ml-6 hidden lg:block">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-2.5 py-1.5 font-display text-[1.02rem] font-semibold uppercase tracking-wide ${
                        isActive ? 'text-ink shadow-[inset_0_-2px_0_var(--c-accent)]' : 'text-ink-muted hover:text-ink'
                      }`
                    }
                  >
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex min-h-9 items-center gap-2 border border-line px-2.5 text-ink-muted hover:text-ink"
              aria-label={t('search.open')}
              data-testid="search-open"
            >
              <Search size={16} aria-hidden />
              <span className="hidden font-mono text-xs sm:inline">{t('search.shortcut')}</span>
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <LangToggle />
              <ThemeToggle />
            </div>
            <button
              type="button"
              className="grid min-h-9 min-w-9 place-items-center border border-line lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
              onClick={() => setMenuOpen((v) => !v)}
              data-testid="menu-toggle"
            >
              {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
            <nav aria-label={t('nav.main')} className="mx-auto max-w-7xl px-4 py-3">
              <ul className="grid grid-cols-1 divide-y divide-line">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex min-h-12 items-center gap-3 font-display text-xl font-semibold uppercase tracking-wide ${
                          isActive ? 'text-accent' : 'text-ink'
                        }`
                      }
                    >
                      <span className="w-6 font-mono text-xs text-ink-muted">{item.num}</span>
                      <item.icon size={18} aria-hidden />
                      {t(`nav.${item.key}`)}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 sm:hidden">
                <LangToggle />
                <ThemeToggle />
              </div>
            </nav>
          </div>
        )}
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-sm text-ink-muted sm:flex-row sm:justify-between">
          <p>{t('app.educationalOnly')}</p>
          <p className="font-mono text-xs uppercase tracking-wider">
            <Link to="/tentang" className="hover:text-ink">
              {t('nav.about')}
            </Link>
          </p>
        </div>
      </footer>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
