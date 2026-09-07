/* SpaceNet 4166 — city radar gadgets. Map only. No HUD chrome. */
(function () {
  if (window.__SN_RADAR_4166) return;
  window.__SN_RADAR_4166 = true;
  var RADAR_M = 800;
  var HOT_MIN = 2;
  var CELL_KM = 0.7;
  var lastSig = "";
  var layers = [];
  var lastZoom = 0;

  function injectCss() {
    if (document.getElementById("sn-radar-css")) return;
    var s = document.createElement("style");
    s.id = "sn-radar-css";
    s.textContent =
      ".sn-radar-wrap{background:transparent!important;border:0!important;pointer-events:none!important}" +
      ".sn-radar{border-radius:999px;pointer-events:none;opacity:.55;" +
      "background:conic-gradient(from 0deg,transparent 0 68%,rgba(77,240,255,.42) 86%,transparent 100%);" +
      "animation:sn-radar-spin 4.2s linear infinite;box-shadow:inset 0 0 0 1px rgba(77,240,255,.35)}" +
      ".sn-radar.hot{background:conic-gradient(from 0deg,transparent 0 68%,rgba(232,197,107,.42) 86%,transparent 100%);box-shadow:inset 0 0 0 1px rgba(232,197,107,.35)}" +
      ".sn-radar-lab{background:transparent!important;border:0!important;box-shadow:none!important;color:#e8c56b!important;font-weight:800;letter-spacing:.08em}" +
      "@keyframes sn-radar-spin{to{transform:rotate(360deg)}}" +
      "@media (prefers-reduced-motion:reduce){.sn-radar{animation:none}}";
    document.head.appendChild(s);
  }

  function km(a, b) {
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
    var h = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function compass(from, to) {
    var p1 = (from.lat * Math.PI) / 180, p2 = (to.lat * Math.PI) / 180, D = ((to.lng - from.lng) * Math.PI) / 180;
    var y = Math.sin(D) * Math.cos(p2);
    var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(D);
    var brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(brng / 45) % 8];
  }
  function cellKey(lat, lng) {
    var step = CELL_KM / 111.32;
    var latC = Math.round(lat / step);
    var lngC = Math.round(lng / (step / Math.max(0.2, Math.cos((lat * Math.PI) / 180))));
    return latC + ":" + lngC;
  }
  function readJson(k, d) {
    try {
      var v = localStorage.getItem(k);
      if (v == null) return d;
      var j = JSON.parse(v);
      return j == null ? d : j;
    } catch (e) {
      return d;
    }
  }
  function youPin() {
    var p = readJson("sn:place", null);
    if (p && isFinite(+p.lat) && isFinite(+p.lng)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" };
    try {
      var map = getMap();
      if (map && map.getCenter) {
        var c = map.getCenter();
        return { lat: c.lat, lng: c.lng, name: "YOU" };
      }
    } catch (e) {}
    return null;
  }
  function blips() {
    var out = [];
    function add(list, kind, nameKey) {
      if (!Array.isArray(list)) return;
      list.forEach(function (x) {
        if (!x) return;
        var lat = +x.lat, lng = +x.lng;
        if (!isFinite(lat) || !isFinite(lng)) {
          lat = +x.fromLat || +x.toLat || NaN;
          lng = +x.fromLng || +x.toLng || NaN;
        }
        if (!isFinite(lat) || !isFinite(lng)) return;
        out.push({ lat: lat, lng: lng, kind: kind, name: x[nameKey] || x.title || x.name || x.where || "" });
      });
    }
    function live(list) {
      if (window.__SN_IS_LIVE_JOB) return (list || []).filter(window.__SN_IS_LIVE_JOB);
      return (list || []).filter(function (t) {
        if (!t || t.demo || t.sample) return false;
        if (String(t.id || "").indexOf("off-") === 0) return false;
        var k = String(t.kind || "").toLowerCase();
        if (/find|hunt|shop|pin|place|vendor|post|call/.test(k)) return false;
        return !!(t.phone || t.pay != null || t.ave != null || t.thrown || t.driver);
      });
    }
    add(live(readJson("sn:jobs", [])), "job", "title");
    add(live(readJson("sn:tasks", [])), "job", "title");
    return out;
  }
  function zones(you, pts) {
    var around = pts.filter(function (b) { return km(you, b) <= RADAR_M / 1000; });
    var youZ = { lat: you.lat, lng: you.lng, count: around.length, jobs: around.filter(function (b) { return b.kind === "job"; }).length, you: true, label: "YOU" };
    var buckets = {};
    pts.forEach(function (b) {
      if (km(you, b) < CELL_KM * 0.85) return;
      var k = cellKey(b.lat, b.lng);
      (buckets[k] = buckets[k] || []).push(b);
    });
    var hot = [];
    Object.keys(buckets).forEach(function (k) {
      var group = buckets[k];
      var jobs = group.filter(function (b) { return b.kind === "job"; }).length;
      if (jobs < HOT_MIN && group.length < HOT_MIN + 1) return;
      var lat = 0, lng = 0, name = "";
      group.forEach(function (b) { lat += b.lat; lng += b.lng; if (!name && b.name) name = b.name; });
      hot.push({ lat: lat / group.length, lng: lng / group.length, count: group.length, jobs: jobs, you: false, label: name || (jobs || group.length) + " JOBS" });
    });
    hot.sort(function (a, b) { return b.jobs - a.jobs || b.count - a.count; });
    return [youZ].concat(hot.slice(0, 4));
  }
  function line(you, zs) {
    var me = zs.filter(function (z) { return z.you; })[0];
    var hots = zs.filter(function (z) { return !z.you; });
    var near = me ? me.jobs + " job" + (me.jobs === 1 ? "" : "s") + " in " + RADAR_M + " m" : "radar on";
    if (!hots.length) {
      if (me && me.jobs > 0) return "Radar: " + near + ". No hotter cluster yet.";
      return "Radar on you. Quiet here — a second gadget lights where jobs pile up.";
    }
    var top = hots[0];
    var d = km(you, top).toFixed(1);
    return "Radar: " + near + ". Hot: " + (top.jobs || 0) + " jobs · " + d + " km " + compass(you, top) + " — go there next.";
  }
  function sig(zs) {
    return zs.map(function (z) { return (z.you ? "Y" : "H") + ":" + z.jobs + ":" + z.lat.toFixed(3) + ":" + z.lng.toFixed(3); }).join("|");
  }
  function notify(msg) {
    var el = document.getElementById("line");
    if (el) el.textContent = msg;
  }
  function getMap() {
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    return window.__snLeaflet || null;
  }
  function cityOn() {
    var el = document.getElementById("city");
    return !!(el && el.classList.contains("on"));
  }
  function clear(map) {
    layers.forEach(function (l) { try { map.removeLayer(l); } catch (e) {} });
    layers = [];
  }
  function paint() {
    if (!cityOn()) return;
    var L = window.L;
    var map = getMap();
    if (!L || !map || !L.circle) return;
    var you = youPin();
    if (!you) return;
    injectCss();
    clear(map);
    var zs = zones(you, blips());
    zs.forEach(function (z) {
      var col = z.you ? "#4df0ff" : "#e8c56b";
      var ring = L.circle([z.lat, z.lng], {
        radius: RADAR_M, color: col, weight: 1, fillColor: col, fillOpacity: 0.1, opacity: 0.4, interactive: false,
        className: z.you ? "sn-radar-ring" : "sn-radar-ring hot",
      }).addTo(map);
      layers.push(ring);
      var px = 64;
      try {
        px = Math.max(64, Math.round(map.latLngToLayerPoint([z.lat, z.lng]).distanceTo(map.latLngToLayerPoint([z.lat + RADAR_M / 111320, z.lng])) * 2));
      } catch (e) {}
      var mark = L.marker([z.lat, z.lng], {
        interactive: false, keyboard: false, zIndexOffset: -400,
        icon: L.divIcon({
          className: "sn-radar-wrap",
          html: '<div class="sn-radar' + (z.you ? "" : " hot") + '" style="width:' + px + "px;height:" + px + 'px"></div>',
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        }),
      });
      if (!z.you) {
        try { if (z.jobs) mark.bindTooltip(z.jobs + " JOBS", { permanent: true, direction: "center", className: "sn-tip sn-radar-lab", opacity: 0.92 }); } catch (e) {}
      }
      mark.addTo(map);
      layers.push(mark);
    });
    var s = sig(zs);
    if (s !== lastSig) {
      lastSig = s;
      notify(line(you, zs));
    }
  }
  function tick() {
    try {
      var map = getMap();
      if (!map || !cityOn()) {
        if (map) clear(map);
        return;
      }
      var you = youPin();
      if (!you) return;
      var zs = zones(you, blips());
      var s = sig(zs);
      var z = map.getZoom ? map.getZoom() : 0;
      if (s === lastSig && z === lastZoom && layers.length) return;
      lastZoom = z;
      paint();
    } catch (e) {}
  }
  injectCss();
  setInterval(tick, 1800);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
  try { window.addEventListener("storage", tick); } catch (e) {}
})();
