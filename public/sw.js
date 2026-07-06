const CACHE = 'mintong-branch-v1';

const SKIP_CACHE = ['/api/', '/admin/login', '/login'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (SKIP_CACHE.some(p => url.pathname.startsWith(p))) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      });
      if (cached) {
        fetchPromise.catch(() => {});
        return cached;
      }
      return fetchPromise;
    })
  );
});
