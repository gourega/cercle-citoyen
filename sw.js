
const CACHE_NAME = 'cercle-citoyen-v14';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation : Mise en cache des ressources de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage immédiat de TOUS les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache citoyen:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITIQUE : Ne pas intercepter les requêtes d'authentification Supabase
  // Cela évite les erreurs 522 ou les timeouts lors des redirections complexes
  if (
    url.hash.includes('access_token') || 
    url.search.includes('type=recovery') || 
    url.search.includes('type=signup') ||
    url.hostname.includes('supabase.co')
  ) {
    return; // Laisser passer normalement sans toucher au cache
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Pour les autres ressources (images, scripts), on tente le réseau, sinon le cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
