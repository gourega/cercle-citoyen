// SCRIPT D'AUTO-DESTRUCTION DU SERVICE WORKER
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// Ne rien intercepter, laisser passer les requêtes vers le réseau direct
self.addEventListener('fetch', (e) => {
  return; 
});