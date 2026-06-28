const CACHE_NAME = 'moviebox-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event - Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Handle caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass API Route handlers (dynamic streaming and search data must remain Network Only)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Bypass non-GET requests (such as POST)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached asset if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache static assets dynamically as they are loaded (Next.js scripts, CSS, media)
        const isStaticAsset = 
          url.pathname.includes('/_next/static/') ||
          url.pathname.includes('/icons/') ||
          url.pathname.startsWith('/globals.css') ||
          url.pathname.includes('/fonts/');

        if (networkResponse.status === 200 && isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        // Offline fallback: if HTML request fails offline, serve the cached shell
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
        throw err;
      });
    })
  );
});
