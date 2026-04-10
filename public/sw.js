const CACHE_NAME = '24shift-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy for dynamic content
  // Cache-first for static assets
  const url = new URL(event.request.url);
  
  // Bypass Service Worker for Vite internal development requests and external resources
  if (url.pathname.startsWith('/@vite') || 
      url.pathname.startsWith('/src') || 
      url.pathname.startsWith('/node_modules') ||
      url.hostname !== self.location.hostname) {
    return;
  }

  if (ASSETS_TO_CACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(response => {
          return response || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  }
});
