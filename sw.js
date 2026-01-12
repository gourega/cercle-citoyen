// SW RESET 1.1.1
// Ce fichier est intentionnellement vide pour forcer la suppression du cache.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  caches.keys().then(names => {
    for (let name of names) caches.delete(name);
  });
  self.clients.claim();
});