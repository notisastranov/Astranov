/* 20260825045200-heal — unregister only, never cache, never navigate */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.registration.unregister(); })
  );
});
self.addEventListener("fetch", function (e) {
  e.respondWith(fetch(e.request, { cache: "no-store" }));
});
