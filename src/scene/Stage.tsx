import { Suspense, useMemo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { dprRange, hasWebGL, isLowPower } from './perf';
import { useSceneTheme } from './sceneTheme';

interface StageProps {
  children: ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
  frameloop?: 'always' | 'demand';
  label: string;
  className?: string;
  showGrid?: boolean;
}

function Lights() {
  const t = useSceneTheme();
  return (
    <>
      <color attach="background" args={[t.bg]} />
      <hemisphereLight args={[t.light.hemiSky, t.light.hemiGround, t.light.ambient]} />
      <directionalLight
        position={[2.5, 4, 3]}
        intensity={t.light.key}
        castShadow={!isLowPower()}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2.5, -3]} intensity={t.light.rim} />
      <ambientLight intensity={t.light.ambient * 0.5} />
    </>
  );
}

function Floor() {
  const t = useSceneTheme();
  return (
    <Grid
      position={[0, 0, 0]}
      args={[10, 10]}
      cellSize={0.1}
      cellThickness={0.6}
      cellColor={t.gridSub}
      sectionSize={0.5}
      sectionThickness={1}
      sectionColor={t.grid}
      fadeDistance={7}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}

function Effects() {
  const low = useMemo(() => isLowPower(), []);
  if (low) return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.35} intensity={1.6} distanceFalloff={0.6} />
      <SMAA />
    </EffectComposer>
  );
}

export function Stage({
  children,
  camera,
  frameloop = 'demand',
  label,
  className,
  showGrid = true,
}: StageProps) {
  const { t } = useTranslation();
  const webgl = useMemo(() => hasWebGL(), []);
  const dpr = useMemo(() => dprRange(), []);
  if (!webgl) {
    return (
      <div
        role="alert"
        className={`grid place-items-center border border-line bg-surface p-6 text-center ${className ?? ''}`}
      >
        <div>
          <p className="font-display text-xl font-bold uppercase">{t('errors.webglTitle')}</p>
          <p className="mt-1 text-sm text-ink-muted">{t('errors.webglText')}</p>
        </div>
      </div>
    );
  }
  return (
    <ErrorBoundary kind="webgl">
      <div className={className} role="img" aria-label={label}>
        <Canvas
          frameloop={frameloop}
          dpr={dpr}
          shadows={!isLowPower()}
          camera={{
            position: camera?.position ?? [0, 1.2, 3.2],
            fov: camera?.fov ?? 35,
            near: 0.05,
            far: 40,
          }}
          gl={{
            antialias: isLowPower(),
            powerPreference: 'high-performance',
            toneMapping: ACESFilmicToneMapping,
          }}
          data-testid="three-canvas"
        >
          <Lights />
          {showGrid && <Floor />}
          <Suspense fallback={null}>{children}</Suspense>
          <Effects />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
