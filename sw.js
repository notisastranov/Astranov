/* SpaceNet SW 4182 LOCK — network-first shell. Never cache a stub. */
var CACHE = "sn-shell-4182";
var TILES = "sn-tiles-1";
function isTile(url) {
  return /tile\.openstreetmap\.org|openstreetmap\.fr\/hot|tiles\.maps\.eox\.at|server\.arcgisonline\.com/.test(url);
}
function isAsset(url) {
  return /\/js\/|\.js(\?|$)|\/css\/|\.css(\?|$)|leaflet|icon-192|icon-512|apple-touch-icon|manifest/.test(url);
}
function isStub(html) {
  if (!html) return true;
  if (html.length < 4000) return true;
  if (/PLACEHOLDER|sn-index\/c|index\.part|boot failed/i.test(html)) return true;
  if (html.indexOf('id="g"') === -1) return true;
  if (html.indexOf('id="plus"') === -1) return true;
  if (html.indexOf('id="go"') === -1) return true;
  if (html.indexOf('id="in"') === -1) return true;
  if (html.indexOf('id="island"') === -1) return true;
  return false;
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
  inject('post-4170.js?v=4170"></script>', "/js/spacenet/post-4171.js?v=4171");
  inject('post-4171.js?v=4171"></script>', "/js/spacenet/post-4173.js?v=4173");
  inject('land-4162.js?v=4163"></script>', "/js/spacenet/calm-4164.js?v=4164");
  inject('post-4173.js?v=4173"></script>', "/js/spacenet/ui-lock.js?v=4175");
  inject('ui-lock.js?v=4175"></script>', "/js/spacenet/job-chain-4176.js?v=4176");
  inject('job-chain-4176.js?v=4176"></script>', "/js/spacenet/search-4177.js?v=4177");
  inject('search-4177.js?v=4177"></script>', "/js/spacenet/vendor-card-4178.js?v=4178");
  inject('vendor-card-4178.js?v=4178"></script>', "/js/spacenet/vendor-ask-4179.js?v=4179");
  inject('vendor-ask-4179.js?v=4179"></script>', "/js/spacenet/plus-upload-4180.js?v=4180");
  inject('plus-upload-4180.js?v=4180"></script>', "/js/spacenet/jobs-real-4181.js?v=4181");
  inject('jobs-real-4181.js?v=4181"></script>', "/js/spacenet/brand-wipe-4182.js?v=4182");
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
  }).then(function() { return self.clients.claim(); }));
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
        if (isStub(t)) {
          return fetch("/index.html?lock=1", { cache: "no-store" }).then(function(r) {
            if (!r || !r.ok) return new Response(t, { status: res.status, headers: res.headers });
            return r.text().then(function(full) {
              if (isStub(full)) return new Response(t, { status: res.status, headers: res.headers });
              var h = new Headers(r.headers); h.set("Cache-Control", "no-store");
              return new Response(withShell(full), { status: 200, headers: h });
            });
          });
        }
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
