/* ============================================
   SCOTLAND 40 — Service Worker
   Provides offline support and faster repeat loads.

   IMPORTANT: When you push site changes, bump the
   CACHE_VERSION number below to force users' phones
   to fetch the new files. (Otherwise their phones may
   keep showing the old cached version for up to 24h.)
   ============================================ */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `scotland40-${CACHE_VERSION}`;

// Files we want available offline
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/nav.css',
  '/js/supabase.js',
  '/js/image-compress.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

// Install: pre-cache the core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
        // Don't fail install if some files aren't found
        console.warn('Some precache URLs failed');
      }))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('scotland40-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Same-origin GET requests: network first, fall back to cache
// - Other requests (Supabase API, fonts, etc.): just pass through
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests for our own origin
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Don't cache Supabase storage URLs or analytics
  if (url.pathname.includes('/storage/') || url.pathname.includes('/auth/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Network failed → try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If it's a navigation request and nothing cached, fall back to index
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});