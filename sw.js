const CACHE_NAME = 'sandoug-cache-v5'; // Design overhaul — force refresh
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', event => {
  // 1. CSV Data: Network-First to ensure live updates
  if (event.request.url.includes('SANDOUG.csv')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(new Request('SANDOUG.csv'), cloned));
          return response;
        })
        .catch(() => caches.match('SANDOUG.csv'))
    );
    return;
  }

  // 2. HTML Pages: Network-First (Fixes the black screen issue)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)
          .then(response => response || caches.match('./index.html')))
    );
    return;
  }

  // 3. Static Assets: Cache-First for speed
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
