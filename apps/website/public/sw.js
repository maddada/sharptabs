// Service Worker for Sharp Tabs Restore Page
const CACHE_NAME = 'sharptabs-restore-v1';
const urlsToCache = [
  '/restore',
  '/styles/screenshot-background.css',
  '/scripts/screenshot-bridge.js',
  '/scripts/screenshot-loader.js',
  '/scripts/tooltip-manager.js',
  '/icon16.png',
  '/icon48.png',
  '/icon.svg',
  '/anthropic.ico'
];

// Install event - cache all required resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] All resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Only cache same-origin requests for the restore page and its assets
          if (event.request.url.includes('/restore') ||
              event.request.url.includes('/scripts/') ||
              event.request.url.includes('/styles/')) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[Service Worker] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);

          // Return a custom offline page if available in cache
          return caches.match('/restore');
        });
      })
  );
});
