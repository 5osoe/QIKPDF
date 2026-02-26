// تأكد من عدم وجود index.html أو preview.jpg هنا
const ASSETS =[
    './',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('fetch', event => {
    // 1) منع تخزين صورة المعاينة لضمان جلبها دائماً من الشبكة للمنصات الاجتماعية
    if (event.request.url.includes('preview.jpg')) {
        return; 
    }

    // 2) استراتيجية Network-First لملفات HTML لضمان تحديث الـ Metadata
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
                // في حالة انقطاع الاتصال، حاول جلب آخر نسخة مخزنة من index.html
                return caches.match('./index.html');
            })
        );
        return;
    }

    // 3) استراتيجية Cache-First لباقي الملفات (CSS, JS, Icons)
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});