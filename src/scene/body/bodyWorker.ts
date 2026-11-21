import { getBodyAsset } from './skin';
import { getMuscleShells } from './muscleShells';

/** Membangun kulit & otot di luar thread utama agar halaman 3D tidak tersendat saat pertama dibuka. */
self.onmessage = () => {
  const body = getBodyAsset();
  const shells = getMuscleShells();
  const buffers = [
    body.positions.buffer,
    body.normals.buffer,
    body.indices.buffer,
    body.skinIndex.buffer,
    body.skinWeight.buffer,
    body.cover.buffer,
    shells.positions.buffer,
    shells.normals.buffer,
    shells.skinIndex.buffer,
    shells.skinWeight.buffer,
    shells.member.buffer,
    shells.owner.buffer,
    shells.depth.buffer,
    shells.indices.buffer,
  ];
  (self as unknown as Worker).postMessage({ body, shells }, buffers);
};
