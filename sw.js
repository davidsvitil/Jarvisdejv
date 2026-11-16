// Offline cache: appka naběhne i bez signálu (mapa a hledání trasy internet potřebují dál).
var C = 'r125-v1';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) { return c.addAll(['./', 'index.html']); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
// network-first pro vlastní soubory, aby se aktualizace projevily hned; cache jen jako záloha
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copy = r.clone();
      caches.open(C).then(function (c) { c.put(e.request, copy); });
      return r;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
