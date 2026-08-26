/* Astranov SpaceNet — installable app SW 20260826174000
   Stay registered. Network-first. Minimal shell cache for offline shell. */
var CACHE = "sn-shell-20260826174000";
var SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  /* API always network */
  if (url.pathname.indexOf("/api/") === 0) {
    e.respondWith(fetch(req));
    return;
  }
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok && (url.pathname === "/" || url.pathname.indexOf("/js/") === 0 || url.pathname.indexOf("manifest") >= 0)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("/");
        });
      })
  );
});
