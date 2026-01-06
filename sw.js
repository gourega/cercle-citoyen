
const CACHE_NAME = 'cercle-citoyen-v15';

// Pas de pré-mise en cache agressive pour éviter les conflits de version en production
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NE JAMAIS intercepter les requêtes vers Supabase ou Cloudflare API
  if (url.hostname.includes('supabase.co') || url.hostname.includes('cloudflare.com')) {
    return;
  }

  // 2. NE JAMAIS intercepter les liens magiques ou tokens d'auth
  if (url.hash.includes('access_token') || url.search.includes('type=')) {
    return;
  }

  // 3. Stratégie simple : Réseau d'abord, sinon rien (pour éviter la 522 fantôme du cache)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
  }
});
