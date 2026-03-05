const CACHE_NAME = 'qikpdf-cache-v5';

const ASSETS = [
  '/', '/style.css', '/app.js', '/manifest.json',
  '/tool-pdfinfo.js', '/tool-pdf2img.js', '/tool-img2pdf.js',
  '/tool-rotate.js',  '/tool-merge.js',   '/tool-metadata.js',
  '/tool-split.js',   '/icon-192.png',    '/icon-512.png', '/content.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('preview.jpg')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE_NAME).then(c => c.put('/', r.clone())); return r; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
