import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { exerciseIntensities, getExercise } from '../content';
import { movementFrame, phaseAt, type MovementFrame, type StudioPattern } from '../lib/movements';
import { PATTERN_EXERCISE, presetFor } from '../lib/studioPresets';
import { useReducedMotion } from '../lib/reducedMotion';
import { Stage } from './Stage';
import { CameraRig } from './CameraRig';
import { BodyModel } from './body/BodyModel';
import { LoadProp } from './Props';

interface Props {
  pattern: StudioPattern;
  /** false = jeda (mis. di luar layar) agar tidak menghabiskan baterai. */
  active: boolean;
  label: string;
}

const TEMPO = 4.2;

function Loop({
  frameRef,
  pattern,
  active,
}: {
  frameRef: { current: MovementFrame };
  pattern: StudioPattern;
  active: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useReducedMotion();
  const params = useMemo(() => presetFor(pattern, PATTERN_EXERCISE[pattern]), [pattern]);
  const time = useRef(0);
  useFrame((_, dt) => {
    if (reduced) {
      frameRef.current = movementFrame(pattern, params, 0.9);
      return;
    }
    if (!active) return;
    time.current += Math.min(dt, 0.05);
    frameRef.current = movementFrame(pattern, params, phaseAt(time.current, TEMPO));
    invalidate();
  });
  return null;
}

/** Peragaan hero beranda: manekin yang sama dengan Studio Form, otot latihan menyala. */
export default function HeroScene({ pattern, active, label }: Props) {
  const reduced = useReducedMotion();
  const params = useMemo(() => presetFor(pattern, PATTERN_EXERCISE[pattern]), [pattern]);
  const frameRef = useRef<MovementFrame>(movementFrame(pattern, params, reduced ? 0.9 : 0));
  const skeleton = useMemo(
    () => ({
      get current() {
        return frameRef.current.skeleton;
      },
    }),
    [],
  );
  const ex = getExercise(PATTERN_EXERCISE[pattern]);
  const intensities = useMemo(() => (ex ? exerciseIntensities(ex) : {}), [ex]);
  return (
    <Stage
      className="h-full w-full"
      label={label}
      frameloop="demand"
      camera={{ position: [2.2, 1.3, 2.9], fov: 32 }}
    >
      <Loop frameRef={frameRef} pattern={pattern} active={active} />
      <BodyModel skeleton={skeleton} intensities={intensities} dimInactive interactive={false} />
      <LoadProp
        kind={pattern === 'lunge' ? 'dumbbells' : 'barbell'}
        spread={0.5}
        getPosition={() => (params.load > 0 ? frameRef.current.bar : null)}
      />
      <CameraRig
        target={[0, 0.88, 0]}
        direction={[0.75, 0.18, 1]}
        distance={4}
        fitHeight={2.0}
        autoRotate={active}
        pageScroll
        maxDistance={7}
        nonce="hero"
      />
    </Stage>
  );
}
