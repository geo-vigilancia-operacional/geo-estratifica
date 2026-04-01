// Nome do cache
const CACHE_NAME = 'geoestrat-v1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icons/geoestrati-192.png',
  './icons/geoestrati-512.png'
];

// Instala o Service Worker e guarda os arquivos básicos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Faz o app carregar mesmo se o sinal da rede estiver ruim em campo
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});