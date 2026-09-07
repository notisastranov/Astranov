/* SpaceNet SW 4170 — network-first shell. Never cache a stub. Never serve HTML as JS. */
var CACHE = "sn-shell-4170";
var TILES = "sn-tiles-1";
function isTile(url) {
  return /tile\.openstreetmap\.org|openstreetmap\.fr\/hot|tiles\.maps\.eox\.at|server\.arcgisonline\.com/.test(url);
}
function isAsset(url) {
  return /\/js\/|\.js(\?|$)|\/css\/|\.css(\?|$)|leaflet|icon-192|icon-512|apple-touch-icon|manifest/.test(url);
}
function withShell(html) {
  if (!html || html.indexOf("leaflet.js") === -1) return html;
  function inject(afterNeedle, src) {
    if (html.indexOf(src.split("/").pop().split("?")[0]) !== -1) return;
    var tag = '<script src="' + src + '"><\/script>';
    if (html.indexOf(afterNeedle) !== -1) {
      html = html.replace(afterNeedle, afterNeedle + "\n" + tag);
    }
  }
  inject('leaflet.js?v=4127"></script>', "/js/spacenet/voice.js?v=4164");
  inject('leaflet.js?v=4127"></script>', "/js/spacenet/leave-flat.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/auth.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/order-menu.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/plus-job.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/jobs-stack.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/plus-mic.js?v=4164");
  inject('spacenet/app.js?v=4160"></script>', "/js/spacenet/install.js?v=4164");
  inject('list-4161.js?v=4163"></script>', "/js/spacenet/calm-4164.js?v=4164");
  inject('calm-4164.js?v=4164"></script>', "/js/spacenet/radar-4166.js?v=4166");
  inject('radar-4166.js?v=4166"></script>', "/js/spacenet/post-4169.js?v=4169");
  inject('post-4169.js?v=4169"></script>', "/js/spacenet/post-4170.js?v=4170");
  inject('land-4162.js?v=4163"></script>', "/js/spacenet/calm-4164.js?v=4164");
  return html;
}
self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return c.addAll(["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]);
  }).then(function() { return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(ks) {
    return Promise.all(ks.filter(function(k) { return k !== CACHE && k !== TILES; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }).then(function() {
    return self.clients.matchAll({ type: "window" }).then(function(cs) {
      cs.forEach(function(c) {
        try { c.postMessage({ type: "SN_RELOAD", v: "4170" }); } catch (err) {}
        if (c.navigate) {
          try { c.navigate("/?v=4170&t=" + Date.now()); } catch (err) {}
        }
      });
    });
  }));
});
self.addEventListener("message", function(e) {
  if (e.data === "SKIP_WAITING" && self.skipWaiting) self.skipWaiting();
});
self.addEventListener("fetch", function(e) {
  var u = e.request.url;
  if (e.request.method !== "GET") return;
  if (isTile(u)) {
    e.respondWith(caches.open(TILES).then(function(c) {
      return c.match(e.request).then(function(r) {
        if (r) return r;
        return fetch(e.request).then(function(res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function() { return r || new Response("", { status: 504 }); });
      });
    }));
    return;
  }
  if (u.indexOf(self.location.origin) !== 0) return;
  if (e.request.mode === "navigate" || (e.request.headers.get("accept") || "").indexOf("text/html") !== -1) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then(function(res) {
      if (!res || !res.ok) return res;
      var ct = res.headers.get("content-type") || "";
      if (ct.indexOf("text/html") === -1) return res;
      return res.text().then(function(t) {
        t = withShell(t);
        var h = new Headers(res.headers);
        h.set("Cache-Control", "no-store");
        return new Response(t, { status: res.status, statusText: res.statusText, headers: h });
      });
    }).catch(function() {
      return new Response("SpaceNet offline — open astranov.eu when you have signal.", { status: 503, headers: { "Content-Type": "text/plain" } });
    }));
    return;
  }
  if (isAsset(u)) {
    e.respondWith(fetch(e.request).then(function(res) {
      if (res && res.ok) caches.open(CACHE).then(function(cache) { cache.put(e.request, res.clone()); });
      return res;
    }).catch(function() { return caches.match(e.request); }));
  }
});
