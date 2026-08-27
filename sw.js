/* SpaceNet SW 20260827133000-city-manual — network-first, same-origin only */
var CACHE = "sn-shell-20260827133000-city-manual";
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(["/"]); }).catch(function () {}));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var href = req.url || "";
  if (href.indexOf(self.location.origin) !== 0) return;
  e.respondWith(
    fetch(req, { cache: "no-store" }).then(function (res) { return res; }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("/"); });
    })
  );
});
