const CACHE_NAME = 'qikpdf-cache-v4';

const ASSETS = [
  '/',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/tool-pdfinfo.js',
  '/tool-pdf2img.js',
  '/tool-img2pdf.js',
  '/tool-rotate.js',
  '/tool-merge.js',
  '/tool-metadata.js',
  '/tool-split.js',
  '/icon-192.png',
  '/icon-512.png',
  '/content.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('preview.jpg')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
