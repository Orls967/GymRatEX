/** Pencarian teks sederhana tanpa dependensi: normalisasi diakritik, skor prefiks > kata > substring. */
export interface SearchDoc {
  key: string;
  group: 'page' | 'muscle' | 'exercise' | 'term';
  title: string;
  subtitle?: string;
  /** Teks tambahan yang ikut dicari (mis. nama dalam bahasa lain, nama Latin, alias). */
  extra: string[];
  path: string;
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreText(text: string, q: string): number {
  const n = normalize(text);
  if (!n) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.split(' ').some((w) => w.startsWith(q))) return 60;
  if (n.includes(q)) return 40;
  // semua token kueri ada
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1 && tokens.every((tk) => n.includes(tk))) return 30;
  return 0;
}

export function search(docs: readonly SearchDoc[], query: string, limit = 24): SearchDoc[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    let best = scoreText(doc.title, q);
    for (const e of doc.extra) best = Math.max(best, scoreText(e, q) * 0.9);
    if (best > 0) scored.push({ doc, score: best });
  }
  scored.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return scored.slice(0, limit).map((s) => s.doc);
}
