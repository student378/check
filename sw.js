// ============================================================
// 유한대학교 자체점검 시스템 — Service Worker
// ============================================================
const CACHE_NAME = 'yuhan-audit-v1';
const ASSETS = [
  './',
  './dept.html',
  './admin.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // 일부 파일 캐시 실패해도 설치 계속
      });
    })
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리: Network First (오프라인 시 캐시 fallback)
self.addEventListener('fetch', event => {
  // GAS API 요청은 캐시하지 않음
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  // 외부 폰트 등도 네트워크 우선
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공 시 캐시 갱신
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 응답
        return caches.match(event.request).then(cached => {
          return cached || new Response('오프라인 상태입니다.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
