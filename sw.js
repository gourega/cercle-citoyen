// SW Pass-through : Aucune mise en cache pour forcer la mise à jour réseau
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne rien mettre en cache, tout demander au réseau
  return;
});