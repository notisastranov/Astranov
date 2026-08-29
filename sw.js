/* SpaceNet SW 4036 — shell network-first, tiles on the device */
var CACHE = "sn-shell-4036";
var TILES = "sn-tiles-1";
function isTile(url) {
  return /tile\.openstreetmap\.org|openstreetmap\.fr\/hot|tiles\.maps\.eox\.at|server\.arcgisonline\.com|\/js\/vendor\/leaflet/.test(url);
}
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(["/"]); }).catch(function () {}));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf("sn-shell-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = req.url || "";
  if (isTile(url)) {
    e.respondWith(
      caches.open(TILES).then(function (c) {
        return c.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          });
        });
      }).catch(function () { return fetch(req); })
    );
    return;
  }
  e.respondWith(
    fetch(req, { cache: "no-store" }).then(function (res) { return res; }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("/"); });
    })
  );
});
