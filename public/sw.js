// Anusandhan Autonomous Service Worker (Offline-First & PWA Asset Cache)
const CACHE_NAME = 'anusandhan-v1.0.2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/brand-emblem-dark.svg',
  '/brand-emblem-light.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache assets non-fatal error:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing legacy cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept API endpoints, auth routes, downloads, or hashed assets
  // Vite assigns unique immutable hashes to /assets/*; caching them in SW causes chunk mismatch errors
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('/downloads/') ||
    request.url.includes('/assets/') ||
    request.url.includes('chrome-extension') ||
    request.url.includes('vercel.app/api')
  ) {
    return;
  }

  // Navigation requests: Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response('Offline: Anusandhan is cached and ready. Please reconnect.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // General static assets (SVGs, Icons, Manifest): Cache-First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
