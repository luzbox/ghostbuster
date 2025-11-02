// Service Worker for Ghostbuster webapp
// Provides offline functionality and caching

const CACHE_NAME = 'ghostbuster-v1';
const STATIC_CACHE = 'ghostbuster-static-v1';
const DYNAMIC_CACHE = 'ghostbuster-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/location\/search/,
  /\/api\/location\/analyze/,
  /\/api\/weather\/current/,
  /\/api\/rating\/calculate/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1e293b"/><text x="100" y="100" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle API requests with network-first strategy and fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Only cache certain API endpoints
      if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error(`API request failed: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error.message);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached API response');
      
      // Add header to indicate cached response
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker');
      return response;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - no cached data available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker'
        }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving cached index.html');
    
    // Serve cached index.html for navigation requests when offline
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ghostbuster - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, sans-serif;
              background: #0f172a;
              color: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              max-width: 400px;
              padding: 2rem;
            }
            .ghost {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #f472b6;
              margin-bottom: 1rem;
            }
            button {
              background: #f472b6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              margin-top: 1rem;
            }
            button:hover {
              background: #ec4899;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="ghost">👻</div>
            <h1>You're Offline</h1>
            <p>The Ghostbuster app is currently unavailable. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
          'X-Served-By': 'ServiceWorker'
        }
      }
    );
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Try cache for other requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle any queued requests when connection is restored
  console.log('[SW] Processing background sync');
  
  // You could implement request queuing here
  // For now, just log that sync occurred
}

// Push notifications (for future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'ghostbuster-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View Location'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service worker script loaded');