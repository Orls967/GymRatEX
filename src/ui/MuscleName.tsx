import type { Muscle } from '../content';
import { useL } from './useL';

/** Nama otot sesuai bahasa + nama Latin sebagai sekunder: "Otot dada besar · Pectoralis major". */
export function MuscleName({ muscle, className }: { muscle: Muscle; className?: string }) {
  const L = useL();
  return (
    <span className={className}>
      {L(muscle.name)}
      <span className="text-ink-muted"> · </span>
      <i className="font-normal text-ink-muted not-italic [font-style:italic]">{muscle.latin}</i>
    </span>
  );
}
