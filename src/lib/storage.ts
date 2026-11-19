/** Akses localStorage yang aman: bisa gagal di mode privat/thumbnail, jadi selalu dibungkus try/catch. */
export function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* abaikan: preferensi hanya kenyamanan */
  }
}
