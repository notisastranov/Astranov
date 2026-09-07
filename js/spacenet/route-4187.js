/* SpaceNet 4187 — city map shows only what you are looking for. Route design keeps streets clear. No HUD restyle. */
(function () {
  if (window.__SN_ROUTE_4187) return;
  window.__SN_ROUTE_4187 = true;

  function keyOf(lat, lng) {
    return Number(lat).toFixed(4) + "|" + Number(lng).toFixed(4);
  }
  function addKeep(keys, p) {
    if (!p || !isFinite(+p.lat) || !isFinite(+p.lng)) return;
    keys[keyOf(p.lat, p.lng)] = 1;
  }
  function huntList() {
    var h = window.__SN_LAST_HUNT && window.__SN_LAST_HUNT.list;
    return Array.isArray(h) ? h.slice(0, 12) : [];
  }
  function looking() {
    return huntList().length > 0;
  }
  function routing() {
    return !!(
      document.getElementById("sn-pick") ||
      document.getElementById("sn-jobq") ||
      document.querySelector("[data-act=cancel-pick]")
    );
  }
  function youPin() {
    try {
      if (window.SN && SN.here) {
        var h = SN.here();
        if (h && isFinite(+h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" };
      }
    } catch (e) {}
    try {
      var p = JSON.parse(localStorage.getItem("sn:place") || "null");
      if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" };
    } catch (e) {}
    return null;
  }
  function keepKeys() {
    var keys = {};
    addKeep(keys, youPin());
    huntList().forEach(function (p) { addKeep(keys, p); });
    return keys;
  }
  function keepLabel(tip) {
    return /^(FROM |TO |YOU|PIN\b|CLIENT|DRIVER)/i.test(String(tip || ""));
  }
  function mapObj() {
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    return null;
  }
  function prune() {
    var m = mapObj();
    if (!m || !m._layers) return;
    var keys = keepKeys();
    var look = looking();
    var route = routing();
    var city = document.getElementById("city");
    if (city) {
      city.classList.toggle("sn-route", route);
      city.classList.toggle("sn-looking", look);
    }
    Object.keys(m._layers).forEach(function (id) {
      var layer = m._layers[id];
      if (!layer) return;
      var icon = layer._icon;
      var cls = icon ? String(icon.className || "") : "";
      var html = icon ? String(icon.innerHTML || "") : "";
      var ll = layer.getLatLng && layer.getLatLng();
      var k = ll ? keyOf(ll.lat, ll.lng) : "";
      var tip = "";
      try {
        if (layer.getTooltip && layer.getTooltip()) tip = String(layer.getTooltip().getContent() || "");
      } catch (e) {}
      var keep = keepLabel(tip) || !!(k && keys[k]);
      var isDoor = html.indexOf("sn-red-door") !== -1 || cls.indexOf("sn-door") !== -1;
      var isRadar = cls.indexOf("sn-radar") !== -1 || html.indexOf("sn-radar") !== -1;
      if (isRadar && (route || look)) {
        try { m.removeLayer(layer); } catch (e) {}
        return;
      }
      if (isDoor && !keep) {
        try { m.removeLayer(layer); } catch (e) {}
        return;
      }
      if (!look && !keep && layer._tooltip && layer._tooltip.options && layer._tooltip.options.permanent) {
        if (isDoor || /leaflet-marker-icon/.test(cls)) {
          try { m.removeLayer(layer); } catch (e) {}
        }
      }
    });
  }

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var q = "";
    try { q = decodeURIComponent(String(url)); } catch (e) { q = String(url); }
    if (/overpass/.test(q) && /amenity~/.test(q) && /restaurant\|cafe\|fast_food/.test(q) && !looking()) {
      return Promise.resolve(new Response('{"elements":[]}', { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return origFetch.apply(this, arguments);
  };

  function wrapRepaint() {
    if (!window.SN || !SN.repaint || SN.repaint.__r4187) return;
    var prev = SN.repaint;
    SN.repaint = function () {
      var r = prev.apply(this, arguments);
      setTimeout(prune, 0);
      setTimeout(prune, 200);
      return r;
    };
    SN.repaint.__r4187 = true;
  }

  function wrapHunt() {
    var last = window.__SN_LAST_HUNT;
    if (last && Array.isArray(last.list) && last.list.length > 12) {
      last.list = last.list.slice(0, 12);
    }
  }

  function css() {
    if (document.getElementById("sn-4187-css")) return;
    var s = document.createElement("style");
    s.id = "sn-4187-css";
    s.textContent =
      "#city.sn-route .sn-radar-wrap,#city.sn-looking .sn-radar-wrap{display:none!important}" +
      "#city.sn-route .sn-radar-ring,#city.sn-looking .sn-radar-ring{display:none!important}";
    document.head.appendChild(s);
  }

  function tick() {
    css();
    wrapRepaint();
    wrapHunt();
    prune();
  }

  setInterval(tick, 700);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  window.addEventListener("load", function () { setTimeout(tick, 80); });
})();
