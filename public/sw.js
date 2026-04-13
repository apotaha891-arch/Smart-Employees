/* Self-Destruct Service Worker */
/* This script clears all PWA caches and unregisters itself to fix the "White Screen" issue */

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim(); // Become available to all pages immediately
    }).then(() => {
       console.log('Service Worker: Self-destruct completed. Refreshing page...');
    })
  );
});

// Optionally prevent any fetch observation
self.addEventListener('fetch', (event) => {
  // Do nothing, let the network handle it
  return;
});
