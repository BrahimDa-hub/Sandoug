const CACHE_NAME = 'sandoug-cache-v3'; // Version bump is mandatory to apply updates
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Forces the waiting service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Delete old v1 and v2 caches
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // CSV Routing: Network First, Fallback to Cache
  if (event.request.url.includes('SANDOUG.csv')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Cache the CSV cleanly without the timestamp query parameter
            cache.put(new Request('SANDOUG.csv'), clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If offline, retrieve the clean CSV from cache
          return caches.match('SANDOUG.csv');
        })
    );
    return;
  }

  // App Routing: Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
