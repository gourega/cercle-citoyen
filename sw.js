const CACHE_NAME = 'cercle-citoyen-v100'; // Version forcée

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName); // Supprime TOUT pour être sûr
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pas de cache pour les navigations pendant la phase de nettoyage
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }
});