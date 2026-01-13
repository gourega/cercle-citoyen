// CERCLE V4 - SCRIPT D'AUTO-DESTRUCTION
// Ce script force le navigateur à oublier l'ancienne version.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    })
  );
});