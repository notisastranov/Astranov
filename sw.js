/* SpaceNet SW 4146 — shell network-first. Never serve HTML as JS. */
var CACHE = "sn-shell-4146";
var TILES = "sn-tiles-1";
function isTile(url) {
  return /tile\.openstreetmap\.org|openstreetmap\.fr\/hot|tiles\.maps\.eox\.at|server\.arcgisonline\.com/.test(url);
}
function isAsset(url) {
  return /\/js\/|\.js(\?|$)|\/css\/|\.css(\?|$)|leaflet/.test(url);
}
function withShell(html) {
  if (!html || html.indexOf("leaflet.js") === -1) return html;
  if (html.indexOf("leave-flat.js") === -1) {
    html = html.replace(/leaflet\.js(\?v=[^"']*)?"><\/script>/, "leaflet.js$1\"></script>\n<script src=\"/js/spacenet/voice.js?v=4146\"></script>\n<script src=\"/js/spacenet/leave-flat.js?v=4146\"></script>\n<script src=\"/js/spacenet/wallet.js?v=4146\"></script>\n<script src=\"/js/spacenet/power.js?v=4146\"></script>\n<script src=\"/js/spacenet/task-throw.js?v=4146\"></script>");
  } else if (html.indexOf("voice.js") === -1) {
    html = html.replace(/leaflet\.js(\?v=[^"']*)?"><\/script>/, "leaflet.js$1\"></script>\n<script src=\"/js/spacenet/voice.js?v=4146\"></script>");
  } else if (html.indexOf("wallet.js") === -1) {
    html = html.replace(/leave-flat\.js(\?v=[^"']*)?"><\/script>/, "leave-flat.js$1\"></script>\n<script src=\"/js/spacenet/wallet.js?v=4146\"></script>");
  }
  if (html.indexOf("tree.js") === -1 && html.indexOf("labor.js") !== -1) {
    html = html.replace(/labor\.js(\?v=[^"']*)?"><\/script>/, "labor.js$1\"><\/script>\n<script src=\"/js/spacenet/tree.js?v=4146\"><\/script>");
  }
  if (html.indexOf("/js/spacenet/auth.js") === -1 && html.indexOf("app.js") !== -1) {
    html = html.replace(/spacenet\/app\.js(\?v=[^"']*)?"><\/script>/, "spacenet/app.js$1\"></script>\n<script src=\"/js/spacenet/auth.js?v=4146\"></script>\n<script src=\"/js/spacenet/order-menu.js?v=4146\"></script>\n<script src=\"/js/spacenet/support-gate.js?v=4146\"></script>\n<script src=\"/js/spacenet/approvals.js?v=4146\"></script>");
  }
  if (html.indexOf("plus-job.js") === -1 && html.indexOf("app.js") !== -1) {
    html = html.replace(/spacenet\/app\.js(\?v=[^"']*)?"><\/script>/, "spacenet/app.js$1\"></script>\n<script src=\"/js/spacenet/plus-job.js?v=4146\"></script>");
  } else if (html.indexOf("plus-job.js") !== -1) {
    html = html.replace(/plus-job\.js\?v=[^"']+/, "plus-job.js?v=4146");
  }
  if (html.indexOf("map-tap.js") === -1 && html.indexOf("plus-job.js") !== -1) {
    html = html.replace(/plus-job\.js(\?v=[^"']*)?"><\/script>/, "plus-job.js$1\"></script>\n<script src=\"/js/spacenet/map-tap.js?v=4146\"></script>");
  }
  return html;
}
self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(["/", "/index.html", "/manifest.webmanifest"]); }).then(function() { return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(ks) {
    return Promise.all(ks.filter(function(k) { return k !== CACHE && k !== TILES; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
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
    e.respondWith(fetch(e.request).then(function(res) {
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
      return caches.match("/index.html").then(function(r) { return r || new Response("offline", { status: 503 }); });
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
