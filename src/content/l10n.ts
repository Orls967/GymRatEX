import { z } from 'zod';

/** Teks dwibahasa. Keduanya wajib terisi — build/test gagal bila ada yang kosong. */
export const L10n = z.object({
  id: z.string().trim().min(1, 'terjemahan ID kosong'),
  en: z.string().trim().min(1, 'terjemahan EN kosong'),
});
export type L10n = z.infer<typeof L10n>;

export type LangCode = 'id' | 'en';

export function pick(text: L10n, lang: LangCode): string {
  return text[lang];
}
