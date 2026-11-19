import { lazy } from 'react';
import { BODY_MODEL_SOURCE } from './bodyModelConfig';
import { ProceduralBody } from './ProceduralBody';
import type { BodyModelProps } from './types';

const GltfBody = lazy(() => import('./GltfBody'));

/** Titik masuk tunggal: halaman memakai <BodyModel>, implementasi dipilih lewat konfigurasi. */
export function BodyModel(props: BodyModelProps) {
  if (BODY_MODEL_SOURCE === 'gltf') return <GltfBody {...props} />;
  return <ProceduralBody {...props} />;
}
