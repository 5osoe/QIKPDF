
const CACHE_NAME = 'qikpdf-cache-v7';

const ASSETS = [
  '/',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/content.json'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {

  // 🚫 Never cache preview image (for social bots)
  if (event.request.url.includes('preview.jpg')) {
    return;
  }

  // 🌐 Network First for navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('/', copy);
          });
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // 📦 Cache First for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});