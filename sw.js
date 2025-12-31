
/**
 * CERCLE CITOYEN - Service Worker
 * Gère l'installation hors-ligne et l'identité PWA.
 */
const CACHE_NAME = 'cercle-citoyen-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // On laisse passer les requêtes normales pour le moment
  return;
});
