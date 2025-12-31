
const CACHE_NAME = 'cercle-citoyen-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
});

self.addEventListener('fetch', (event) => {
  // On laisse passer les requêtes API en direct
  if (event.request.url.includes('supabase.co') || event.request.url.includes('googleapis')) {
    return;
  }

  // Pour le reste, on tente le réseau, sinon le cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
