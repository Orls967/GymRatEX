import { ProceduralBody } from './ProceduralBody';
import type { BodyModelProps } from './types';

/** Titik masuk tunggal: semua halaman memakai model kulit-tunggal yang sama (lihat skin.ts). */
export function BodyModel(props: BodyModelProps) {
  return <ProceduralBody {...props} />;
}
