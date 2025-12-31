
/**
 * CERCLE CITOYEN - Service Worker
 * Version optimisée pour la compatibilité Cross-Origin.
 */
const CACHE_NAME = 'cercle-v8';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Stratégie : Network First pour le développement
self.addEventListener('fetch', (event) => {
  // On ne capture rien pour éviter les problèmes de MIME type dans l'IDE
  return;
});
