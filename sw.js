/ 1. Mudamos para v2 (Sempre que atualizar o index.html, mude esse número)
const CACHE_NAME = 'geoestrat-v2';

const assets = [
  './',
  './index.html',
  './manifest.json',
  './icons/geoestrati-192.png',
  './icons/geoestrati-512.png'
];

// Instala o Service Worker
self.addEventListener('install', event => {
  // O skipWaiting faz o novo SW assumir o controle na hora, sem esperar fechar o app
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. LÓGICA DE LIMPEZA (Essencial para atualizações)
// Isso apaga o cache 'v1' quando o 'v2' é instalado
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Apagando cache antigo:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Carregamento Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
