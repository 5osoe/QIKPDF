const CACHE_NAME = 'qikpdf-cache-v2';

// تمت إزالة prev.png و index.html من التخزين المؤقت المسبق الإجباري
const ASSETS =[
    './',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
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
                keys.filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Network-First strategy for HTML documents to ensure fresh metadata
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
            .then(response => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch(() => {
                return caches.match('./index.html');
            })
        );
        return;
    }

    // Cache-First fallback for other assets (prev.png will fetch fresh via network)
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});