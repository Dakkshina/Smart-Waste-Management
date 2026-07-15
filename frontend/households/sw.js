/* SmartWaste Resident App — Service Worker */
const CACHE = 'swm-resident-v1';
const ASSETS = [
  './', './IV_HouseHolds.html', './IV_HouseHolds.css', './IV_HouseHolds.js', './manifest.json',
  'https://unpkg.com/leaflet/dist/leaflet.css', 'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (new URL(e.request.url).pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ success:false, error:{ code:'OFFLINE' } }), { headers:{ 'Content-Type':'application/json' } })
    )); return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
self.addEventListener('push', e => {
  const d = e.data?.json() || { title:'SmartWaste', body:'New update' };
  e.waitUntil(self.registration.showNotification(d.title, { body:d.body, icon:'/icon-192.png' }));
});
