// Nabung Woi service worker.
// Strategy:
//   - HTML navigations: network-first, fall back to cached shell so the app
//     opens offline after at least one successful online load.
//   - Static assets (JS, CSS, fonts, images): stale-while-revalidate so the
//     UI paints instantly from cache while a fresh copy downloads in the
//     background.
//   - Everything else (POST, cross-origin opaque, etc.): pass through.
//
// Bump CACHE_VERSION on every deploy so old caches get evicted on activate.

const CACHE_VERSION = 'v2';
const RUNTIME_CACHE = `nabung-runtime-${CACHE_VERSION}`;
const SHELL_CACHE = `nabung-shell-${CACHE_VERSION}`;
const APP_SHELL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== RUNTIME_CACHE && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico|json)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests — network first, fall back to cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const shellCache = await caches.open(SHELL_CACHE);
          shellCache.put(APP_SHELL, fresh.clone()).catch(() => undefined);
          return fresh;
        } catch {
          const cached = await caches.match(APP_SHELL);
          if (cached) return cached;
          return new Response(
            '<!doctype html><meta charset=utf-8><title>Offline</title><h1>Offline</h1><p>Open Nabung Woi while online once, then it will work offline.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Static assets — stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => undefined);
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })()
    );
  }
});
