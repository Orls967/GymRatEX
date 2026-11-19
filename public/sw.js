/* OtotLapis service worker: membuat aplikasi bisa dipakai offline setelah dimuat sekali.
   - install: pra-cache semua aset hasil build (daftar dari precache-manifest.json)
   - navigasi: network-first, jatuh ke cache bila offline
   - aset lain (termasuk WASM & model pose saat pertama dipakai): cache-first + isi cache saat runtime
   Hanya permintaan ke origin sendiri yang ditangani. */
const VERSION = 'ototlapis-v2';
const SCOPE = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await fetch(new URL('precache-manifest.json', SCOPE), { cache: 'no-store' });
        const files = await res.json();
        // satu per satu: satu file gagal tidak membatalkan seluruh pra-cache
        await Promise.allSettled(['./', ...files].map((f) => cache.add(new URL(f, SCOPE).toString())));
      } catch (e) {
        // tetap aktif; cache akan terisi saat runtime
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(VERSION);
          cache.put(new URL('./', SCOPE).toString(), fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(new URL("./", SCOPE).toString(), { ignoreVary: true })) || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreVary: true, ignoreSearch: false });
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const cache = await caches.open(VERSION);
        cache.put(req, res.clone());
      }
      return res;
    })(),
  );
});
