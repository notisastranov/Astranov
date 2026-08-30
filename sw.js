/* SpaceNet SW 4092 — shell network-first, tiles on the device. Never serve HTML as JS. */
var CACHE = "sn-shell-4092";
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
    html = html.replace(/leaflet\.js(\?v=[^"']*)?"><\/script>/, "leaflet.js$1\"></script>\n<script src=\"/js/spacenet/voice.js?v=4092\"></script>\n<script src=\"/js/spacenet/leave-flat.js?v=4092\"></script>\n<script src=\"/js/spacenet/wallet.js?v=4092\"></script>");
  } else if (html.indexOf("voice.js") === -1) {
    html = html.replace(/leaflet\.js(\?v=[^"']*)?"><\/script>/, "leaflet.js$1\"></script>\n<script src=\"/js/spacenet/voice.js?v=4092\"></script>");
  } else if (html.indexOf("wallet.js") === -1) {
    html = html.replace(/leave-flat\.js(\?v=[^"']*)?"><\/script>/, "leave-flat.js$1\"></script>\n<script src=\"/js/spacenet/wallet.js?v=4092\"></script>");
  }
  if (html.indexOf("/js/spacenet/auth.js") === -1 && html.indexOf("app.js") !== -1) {
    html = html.replace(/spacenet\/app\.js(\?v=[^"']*)?"><\/script>/, "spacenet/app.js$1\"></script>\n<script src=\"/js/spacenet/auth.js?v=4092\"></script>\n<script src=\"/js/spacenet/order-menu.js?v=4092\"></script>\n<script src=\"/js/spacenet/support-gate.js?v=4092\"></script>\n<script src=\"/js/spacenet/approvals.js?v=4092\"></script>");
  } else if (html.indexOf("support-gate.js") === -1 && html.indexOf("order-menu.js") !== -1) {
    html = html.replace(/order-menu\.js(\?v=[^"']*)?"><\/script>/, "order-menu.js$1\"></script>\n<script src=\"/js/spacenet/support-gate.js?v=4092\"></script>\n<script src=\"/js/spacenet/approvals.js?v=4092\"></script>");
  } else if (html.indexOf("approvals.js") === -1 && html.indexOf("support-gate.js") !== -1) {
    html = html.replace(/support-gate\.js(\?v=[^"']*)?"><\/script>/, "support-gate.js$1\"></script>\n<script src=\"/js/spacenet/approvals.js?v=4092\"></script>");
  } else if (html.indexOf("support-gate.js") === -1 && html.indexOf("auth.js") !== -1) {
    html = html.replace(/auth\.js(\?v=[^"']*)?"><\/script>/, "auth.js$1\"></script>\n<script src=\"/js/spacenet/support-gate.js?v=4092\"></script>\n<script src=\"/js/spacenet/approvals.js?v=4092\"></script>");
  }
  if (html.indexOf("power.js") === -1 && html.indexOf("approvals.js") !== -1) {
    html = html.replace(/approvals\.js(\?v=[^"']*)?"><\/script>/, "approvals.js$1\"></script>\n<script src=\"/js/spacenet/power.js?v=4092\"></script>");
  } else if (html.indexOf("power.js") === -1 && html.indexOf("app.js") !== -1) {
    html = html.replace(/spacenet\/app\.js(\?v=[^"']*)?"><\/script>/, "spacenet/app.js$1\"></script>\n<script src=\"/js/spacenet/power.js?v=4092\"></script>");
  }
  if (html.indexOf("you-bike.js") === -1 && html.indexOf("power.js") !== -1) {
    html = html.replace(/power\.js(\?v=[^"']*)?"><\/script>/, "power.js$1\"></script>\n<script src=\"/js/spacenet/you-bike.js?v=4092\"></script>");
  } else if (html.indexOf("you-bike.js") === -1 && html.indexOf("app.js") !== -1) {
    html = html.replace(/spacenet\/app\.js(\?v=[^"']*)?"><\/script>/, "spacenet/app.js$1\"></script>\n<script src=\"/js/spacenet/you-bike.js?v=4092\"></script>");
  }
  return html;
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
  if (isAsset(url)) {
    e.respondWith(fetch(req, { cache: "no-store" }).catch(function () { return caches.match(req); }));
    return;
  }
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
    fetch(req, { cache: "no-store" }).then(function (res) {
      var ct = (res.headers && res.headers.get("content-type")) || "";
      if (ct.indexOf("text/html") === -1) return res;
      return res.text().then(function (html) {
        var h = new Headers(res.headers);
        h.delete("content-length");
        return new Response(withShell(html), { status: res.status, statusText: res.statusText, headers: h });
      });
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("/"); });
    })
  );
});
