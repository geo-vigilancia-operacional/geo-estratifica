const CACHE_NAME = 'geoestrat-v2'; // <--- Mude aqui sempre que atualizar o mapa
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icons/geoestrati-192.png',
  './icons/geoestrati-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo SW a assumir o lugar do velho
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('activate', event => {
  // ESSA É A PARTE QUE LIMPA OS DADOS IGUAL VOCÊ FEZ MANUALMENTE
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Limpando cache antigo...");
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Assume o controle das abas abertas na hora
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
