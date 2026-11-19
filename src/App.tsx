import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './ui/Layout';
import { PageFallback } from './ui/PageFallback';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { usePrefs } from './store/prefs';

const HomePage = lazy(() => import('./pages/HomePage'));
const MuscleMapPage = lazy(() => import('./pages/MuscleMapPage'));
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const WebcamPage = lazy(() => import('./pages/WebcamPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function useSystemThemeSync() {
  const sync = usePrefs((s) => s.syncSystemTheme);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [sync]);
}

export default function App() {
  useSystemThemeSync();
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {(
            [
              ['/', HomePage],
              ['/otot', MuscleMapPage],
              ['/otot/:muscleId', MuscleMapPage],
              ['/latihan', ExerciseLibraryPage],
              ['/latihan/:exerciseId', ExerciseLibraryPage],
              ['/studio', StudioPage],
              ['/studio/:exerciseId', StudioPage],
              ['/benar-salah', ComparePage],
              ['/benar-salah/:errorId', ComparePage],
              ['/webcam', WebcamPage],
              ['/glosarium', GlossaryPage],
              ['/glosarium/:termId', GlossaryPage],
              ['/tentang', AboutPage],
              ['*', NotFoundPage],
            ] as const
          ).map(([path, Page]) => (
            <Route
              key={path}
              path={path}
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageFallback />}>
                    <Page />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  );
}
