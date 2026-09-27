const CACHE_NAME = 'sandoug-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  '[https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js](https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js)'
];

// Install the service worker and cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline, but always try network first for the CSV
self.addEventListener('fetch', event => {
  // If the request is for the CSV file, ALWAYS go to the network first so you see updates
  if (event.request.url.includes('SANDOUG.csv')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
