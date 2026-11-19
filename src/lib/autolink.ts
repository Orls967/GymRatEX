/** Memecah teks menjadi potongan biasa & istilah glosarium (pencocokan batas kata, tanpa huruf besar/kecil). */
export interface TermPattern {
  id: string;
  phrases: string[];
}

export type Chunk = { kind: 'text'; text: string } | { kind: 'term'; text: string; id: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildMatcher(
  terms: readonly TermPattern[],
): { re: RegExp; lookup: Map<string, string> } | null {
  const lookup = new Map<string, string>();
  const phrases: string[] = [];
  for (const t of terms) {
    for (const p of t.phrases) {
      const k = p.trim().toLowerCase();
      if (k.length < 3 || lookup.has(k)) continue;
      lookup.set(k, t.id);
      phrases.push(k);
    }
  }
  if (phrases.length === 0) return null;
  phrases.sort((a, b) => b.length - a.length);
  // \p{L} agar batas kata bekerja untuk huruf beraksen
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])(${phrases.map(escapeRe).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );
  return { re, lookup };
}

/**
 * @param seen istilah yang sudah ditautkan (hanya kemunculan pertama per blok yang ditautkan)
 * @param exclude ID istilah yang tidak perlu ditautkan (mis. istilah halaman itu sendiri)
 */
export function splitTerms(
  text: string,
  matcher: ReturnType<typeof buildMatcher>,
  seen: Set<string> = new Set(),
  exclude?: string,
): Chunk[] {
  if (!matcher) return [{ kind: 'text', text }];
  const out: Chunk[] = [];
  let last = 0;
  matcher.re.lastIndex = 0;
  for (const m of text.matchAll(matcher.re)) {
    const id = matcher.lookup.get(m[0].toLowerCase());
    const idx = m.index ?? 0;
    if (!id || seen.has(id) || id === exclude) continue;
    seen.add(id);
    if (idx > last) out.push({ kind: 'text', text: text.slice(last, idx) });
    out.push({ kind: 'term', text: m[0], id });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}
