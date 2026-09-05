const CACHE_NAME = 'pvk-cache-v5';
const STATIC_ASSETS = [
    '/',
    '/index',
    '/menu',
    '/locations',
    '/contact',
    '/css/global.css',
    '/css/client.css',
    '/images/logo.webp',
    '/images/logo.png',
    '/images/hero-bg.jpg',
    '/js/client.js',
    '/js/auth.js',
    '/js/firebase-config.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        }).catch(err => console.warn('Cache addAll failed:', err))
    );
    self.skipWaiting();
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
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    // Never intercept: Firebase APIs, the Cloudflare worker, and all
    // staff areas (admin / host / kitchen must always be live).
    if (url.includes('identitytoolkit') ||
        url.includes('firestore') ||
        url.includes('workers.dev') ||
        url.includes('/admin') ||
        url.includes('/host') ||
        url.includes('/kitchen')) {
        return;
    }

    const dest = event.request.destination;

    // HTML / JS / CSS: network-first so deploys reach users immediately;
    // fall back to cache only when offline.
    if (dest === 'document' || dest === 'script' || dest === 'style' || dest === '') {
        event.respondWith(
            fetch(event.request).then(fetchRes => {
                if (fetchRes.ok) {
                    const clone = fetchRes.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return fetchRes;
            }).catch(() => {
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (dest === 'document') return caches.match('/');
                });
            })
        );
        return;
    }

    // Images / fonts / everything else: cache-first (they rarely change).
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (fetchRes.ok && url.startsWith('http')) {
                        cache.put(event.request, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        }).catch(() => {
            if (event.request.destination === 'document') {
                return caches.match('/');
            }
        })
    );
});
