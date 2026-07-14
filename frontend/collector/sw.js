/* ══════════════════════════════════════════════
   SmartWaste Collector — Service Worker (PWA)
   Offline-first caching + background sync
   ══════════════════════════════════════════════ */

const CACHE_NAME  = 'swm-collector-v2';
const ASSETS = [
  './',
  './IV_Collector.html',
  './IV_Collector.css',
  './IV_Collector.js',
  './manifest.json',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
];

// ── INSTALL: cache app shell ──────────────────
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ───────────────
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: serve from cache, fallback to network
self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);

  // Always network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    evt.respondWith(
      fetch(evt.request)
        .catch(() => new Response(
          JSON.stringify({ success: false, error: { code: 'OFFLINE', message: 'You are offline. Data will sync when reconnected.' } }),
          { headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // Cache-first for static assets
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(evt.request, clone));
        }
        return res;
      }).catch(() => caches.match('./IV_Collector.html'));
    })
  );
});

// ── BACKGROUND SYNC ──────────────────────────
self.addEventListener('sync', evt => {
  if (evt.tag === 'sync-collections') {
    evt.waitUntil(syncPendingCollections());
  }
});

async function syncPendingCollections() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_TRIGGER' }));
}

// ── PUSH NOTIFICATIONS ───────────────────────
self.addEventListener('push', evt => {
  const data = evt.data?.json() || { title: 'SmartWaste', body: 'New update' };
  evt.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icon-192.png',
      badge: '/badge-72.png',
      data:  { url: data.url || '/' },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  if (evt.action !== 'dismiss') {
    evt.waitUntil(clients.openWindow(evt.notification.data?.url || '/'));
  }
});
