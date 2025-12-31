
// Service Worker Minimaliste pour validation PWA
const CACHE_NAME = 'cercle-v4';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Stratégie : Toujours réseau pour éviter les bugs de cache pendant le dev
  return;
});
