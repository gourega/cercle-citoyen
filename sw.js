
/**
 * CERCLE CITOYEN - Service Worker v6
 * Indispensable pour l'installation sur écran d'accueil.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // On laisse le réseau gérer les requêtes pour éviter les bugs de cache en dev
  return;
});
