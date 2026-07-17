const CACHE_NAME = 'wc-pro-v8';
const urlsToCache = [
  '/css/main.css',
  '/css/gestion.css',
  '/css/ordenes.css',
  '/css/windowscenter.css',
  '/css/dark.css',
  '/css/auth.css',
  '/js/store.js',
  '/js/app.js',
  '/js/utils/helpers.js',
  '/js/utils/fechas.js',
  '/js/utils/excel.js',
  '/js/modules/gestion.js',
  '/js/modules/ordenes.js',
  '/js/modules/windowscenter.js',
  '/js/modules/estados.js',
  '/js/modules/buscar.js',
  '/js/modules/backup.js',
  '/js/modules/shortcuts.js',
  '/js/modules/notificaciones.js',
  '/js/modules/clientes.js',
  '/js/services/firebase.js',
  '/js/auth.js',
  '/js/ui/renderFinanzas.js',
  '/js/ui/renderOrdenes.js',
  '/js/ui/renderWc.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis') || e.request.url.includes('gstatic')) {
    return;
  }
  const isDoc = e.request.destination === 'document' || e.request.mode === 'navigate';
  if (isDoc) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' })))
  );
});
