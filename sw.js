const CACHE_NAME = 'sandoug-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  './SANDOUG.csv' // Cache the CSV for offline use
];

// Install and force the new service worker to take over immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Clean up old caches to prevent stale data
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
});

// Fetch routing
self.addEventListener('fetch', event => {
  // NETWORK-FIRST for the CSV file to ensure live updates
  if (event.request.url.includes('SANDOUG.csv')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online, clone the response and quietly update the offline cache
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./SANDOUG.csv', clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If offline, return the cached CSV, ignoring the ?v= timestamp
          return caches.match('./SANDOUG.csv', { ignoreSearch: true });
        })
    );
    return;
  }

  // CACHE-FIRST for everything else (HTML, Manifest, JS) to ensure fast loading
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
