/**
 * Service Worker for Digital Card PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'digital-card-v1.0.0';
const STATIC_CACHE_NAME = 'static-cache-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1.0.0';

// Files to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/main.js',
  './js/components/ProfileCard.js',
  './js/services/QRService.js',
  './js/services/VCardService.js',
  './js/services/AnalyticsService.js',
  './assets/images/avatar-jessica.jpeg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external API requests
  if (request.url.includes('http://') || request.url.includes('https://')) {
    if (!request.url.includes(self.location.origin)) {
      return;
    }
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response since streams can only be read once
            const responseToCache = response.clone();

            // Cache dynamic requests
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline fallback for specific requests
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }

            if (request.destination === 'image') {
              return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#333"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white">No Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }

            // Return offline page or error message
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'No network connection available'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
      })
  );
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync analytics when back online
function syncAnalytics() {
  return self.clients.matchAll()
    .then((clients) => {
      // Notify all clients to sync analytics
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_ANALYTICS'
        });
      });
    });
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Digital Card',
    icon: './assets/images/icon-192x192.png',
    badge: './assets/images/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: './assets/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './assets/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Digital Card', options)
  );
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case 'UPDATE_CACHE':
      updateCache(data.url, data.content);
      break;

    default:
      break;
  }
});

// Cache utility functions
function updateCache(url, content) {
  return caches.open(DYNAMIC_CACHE_NAME)
    .then((cache) => {
      return cache.put(url, new Response(content));
    });
}

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-update') {
    event.waitUntil(updateStaticCache());
  }
});

// Update static cache periodically
function updateStaticCache() {
  return caches.open(STATIC_CACHE_NAME)
    .then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    });
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const start = performance.now();

  event.waitUntil(
    fetch(event.request)
      .finally(() => {
        const duration = performance.now() - start;
        if (duration > 3000) { // Log slow requests
          console.log('SW: Slow request detected:', event.request.url, duration + 'ms');
        }
      })
  );
});

// Cleanup old dynamic caches periodically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.open(DYNAMIC_CACHE_NAME)
      .then((cache) => {
        return cache.keys()
          .then((keys) => {
            // Keep only recent dynamic entries
            const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
            return Promise.all(
              keys.map((key) => {
                return cache.match(key)
                  .then((response) => {
                    if (response && response.headers.get('date')) {
                      const responseDate = new Date(response.headers.get('date'));
                      if (responseDate.getTime() < cutoff) {
                        return cache.delete(key);
                      }
                    }
                    return Promise.resolve();
                  });
              })
            );
          });
      })
  );
});