/**
 * Jalur penggantian ke model anatomi glTF.
 *
 * 1. Letakkan file .glb (disarankan Draco + KTX2) di `public/models/`, mis. `public/models/anatomy.glb`.
 * 2. Isi `GLTF_MAPPING.muscles` dengan ID otot GymRat → nama mesh di file glTF (kiri & kanan).
 * 3. Ubah `BODY_MODEL_SOURCE` di `bodyModelConfig.ts` menjadi `'gltf'`.
 * 4. Catat kredit & lisensi aset di `src/content/about.ts` (wajib lisensi bebas, mis. CC BY / CC0).
 *
 * Mesh glTF yang tidak dipetakan dirender sebagai "kulit/tulang" netral dan tidak bisa diklik.
 * Pose: model glTF ditampilkan statis. Bila glTF punya skeleton, isi `bones` agar tulang
 * mengikuti rig prosedural (lihat README → "Mengganti ke model glTF").
 */
export interface GltfMapping {
  url: string;
  /** skala & offset agar tinggi model ≈ 1,78 m dengan kaki di y = 0 */
  scale: number;
  offset: [number, number, number];
  muscles: Record<string, string[]>;
  /** Opsional: nama tulang glTF → nama tulang rig GymRat. */
  bones?: Record<string, string>;
}

export const GLTF_MAPPING: GltfMapping = {
  url: 'models/anatomy.glb',
  scale: 1,
  offset: [0, 0, 0],
  muscles: {
    // Contoh (sesuaikan dengan nama mesh pada aset yang dipakai):
    // 'pectoralis-major': ['Pectoralis_major_L', 'Pectoralis_major_R'],
  },
};
