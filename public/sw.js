// 캐시 버전 — 정책 변경 시 반드시 올릴 것 (구버전 캐시 자동 삭제됨)
const CACHE = 'mintong-branch-v2';

// SW가 관여하지 않는 경로 (인증·API·관리자 — 항상 네트워크 직행)
const NETWORK_ONLY = ['/api/', '/admin'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 외부 도메인(Supabase 등)은 관여하지 않음 — 데이터는 항상 최신
  if (url.origin !== self.location.origin) return;
  if (NETWORK_ONLY.some(p => url.pathname.startsWith(p))) return;

  // 정적 자산(콘텐츠 해시 포함 파일)만 캐시 우선 — 내용이 바뀌면 파일명도 바뀌므로 안전
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|apk)$/.test(url.pathname);

  if (isStatic) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // 페이지(HTML) 등 나머지: 네트워크 우선 — 온라인이면 항상 최신, 오프라인일 때만 캐시
  e.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(req)
        .then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(async () => (await cache.match(req)) || Response.error())
    )
  );
});
