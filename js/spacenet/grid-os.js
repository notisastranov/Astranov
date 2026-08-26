(function () {
  "use strict";
  if (window.__SN_GRID_OS) return;
  window.__SN_GRID_OS = true;
  var BUILD = "20260826192000-forever";
  var canvas = document.getElementById("g");
  var cityEl = document.getElementById("city");
  var lineEl = document.getElementById("line");
  var inEl = document.getElementById("in");
  var form = document.getElementById("f");
  var liveEl = document.getElementById("sn-live");
  var leaflet = null, mapOn = false, mapKind = "dark", tileLayer = null;
  var vendorLayer = null, youMarker = null, routeLine = null;
  var yaw = 0.4, pitch = 0.08, dist = 2.2;
  var look = { lat: 20, lng: 15 };
  var here = null, things = {}, dragging = false, lx = 0, ly = 0;
  var vendors = [], selected = null;
  var lastBeat = Date.now(), busy = false;

  function say(t) {
    if (!lineEl || t == null) return;
    try { lineEl.classList.remove("gone"); lineEl.textContent = String(t); } catch (e) {}
  }
  function armCore() {
    materialize({ id: "locate", label: "LOCATE", run: "locate" });
    materialize({ id: "pizza", label: "PIZZA", run: "pizza" });
    materialize({ id: "marble", label: "MARBLE", run: "map marble" });
    if (mapOn) materialize({ id: "close", label: "GLOBE", run: "globe" });
  }
  function done(msg) {
    busy = false;
    if (msg) say(msg);
    armCore();
    lastBeat = Date.now();
  }
  function size() {
    if (!canvas) return;
    try {
      var d = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor((innerWidth || 320) * d);
      canvas.height = Math.floor((innerHeight || 480) * d);
    } catch (e) {}
  }
  function ll(lat, lng) {
    var p = ((90 - lat) * Math.PI) / 180, t = ((lng + 180) * Math.PI) / 180;
    return [-Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
  }
  function pr(p) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
    var y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
    var w = canvas.width, h = canvas.height, s = (Math.min(w, h) * 0.42) / dist;
    if (z2 + dist < 0.12) return null;
    return [w * 0.5 + x1 * s, h * 0.48 - y2 * s];
  }
  var segs = [];
  (function () {
    var lat, lng;
    for (lng = -180; lng < 180; lng += 20)
      for (lat = -80; lat < 80; lat += 10) segs.push([ll(lat, lng), ll(lat + 10, lng)]);
    for (lat = -60; lat <= 60; lat += 20)
      for (lng = -180; lng < 180; lng += 10) segs.push([ll(lat, lng), ll(lat, lng + 10)]);
  })();
  function tick() {
    lastBeat = Date.now();
    try {
      if (canvas && !mapOn) {
        var ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#050608";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "rgba(158,200,232,0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (var i = 0; i < segs.length; i++) {
            var a = pr(segs[i][0]), b = pr(segs[i][1]);
            if (!a || !b) continue;
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
          }
          ctx.stroke();
          if (here) {
            var d = pr(ll(here.lat, here.lng));
            if (d) { ctx.fillStyle = "#7ee9ff"; ctx.beginPath(); ctx.arc(d[0], d[1], 4, 0, 6.28); ctx.fill(); }
          }
        }
      }
    } catch (e) {}
    requestAnimationFrame(tick);
  }
  setInterval(function () {
    try {
      if (Date.now() - lastBeat > 8000) {
        busy = false; armCore(); say("Still running. locate · pizza · globe"); lastBeat = Date.now();
      }
      if (liveEl && !liveEl.querySelector("button")) armCore();
    } catch (e) {}
  }, 4000);
  window.addEventListener("error", function () { busy = false; armCore(); });
  window.addEventListener("unhandledrejection", function () { busy = false; armCore(); });
  function flyTo(lat, lng) {
    look = { lat: +lat, lng: +lng };
    yaw = ((lng + 180) * Math.PI) / 180 - Math.PI / 2;
    pitch = ((lat * Math.PI) / 180) * 0.65;
  }
  var TILES = {
    dark: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    bright: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    national: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    marble: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
  };
  function loadLeaflet(cb) {
    if (window.L) return cb();
    if (loadLeaflet.busy) { loadLeaflet.wait = cb; return; }
    loadLeaflet.busy = true;
    var css = document.createElement("link"); css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
    var s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = function () { loadLeaflet.busy = false; cb(); if (loadLeaflet.wait) loadLeaflet.wait(); };
    s.onerror = function () { s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"; };
    document.head.appendChild(s);
  }
  function setMap(kind) {
    mapKind = TILES[kind] ? kind : "dark";
    if (!leaflet || !window.L) return;
    if (tileLayer) leaflet.removeLayer(tileLayer);
    tileLayer = L.tileLayer(TILES[mapKind], { maxZoom: mapKind === "marble" ? 8 : 19, attribution: "" });
    tileLayer.addTo(leaflet);
  }
  function ensureMap(lat, lng, kind, z) {
    return new Promise(function (resolve) {
      if (!cityEl) { resolve(null); return; }
      mapOn = true; cityEl.classList.add("on"); cityEl.style.pointerEvents = "auto";
      loadLeaflet(function () {
        try {
          var c = [lat || (here && here.lat) || look.lat, lng || (here && here.lng) || look.lng];
          if (!leaflet) leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false }).setView(c, z || 14);
          else { leaflet.setView(c, z || leaflet.getZoom() || 14); setTimeout(function () { try { leaflet.invalidateSize(true); } catch (e) {} }, 60); }
          setMap(kind || mapKind || "dark");
          if (!vendorLayer) vendorLayer = L.layerGroup().addTo(leaflet);
          paintYou(); resolve(leaflet);
        } catch (e) { resolve(null); }
      });
    });
  }
  function paintYou() {
    if (!leaflet || !window.L || !here) return;
    try {
      if (youMarker) leaflet.removeLayer(youMarker);
      youMarker = L.circleMarker([here.lat, here.lng], { radius: 8, color: "#7ee9ff", fillColor: "#7ee9ff", fillOpacity: 0.95, weight: 2 }).addTo(leaflet);
    } catch (e) {}
  }
  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function clearVendors() {
    vendors = []; selected = null;
    try { if (vendorLayer) vendorLayer.clearLayers(); } catch (e) {}
    Object.keys(things).forEach(function (k) { if (k.charAt(0) === "v" || k === "order" || k === "pay") dematerialize(k); });
  }
  function paintVendors(list) {
    clearVendors(); vendors = list || [];
    if (!leaflet || !window.L) { done("Map not ready — try pizza again."); return; }
    var bounds = []; if (here) bounds.push([here.lat, here.lng]);
    vendors.forEach(function (v) {
      try {
        var m = L.circleMarker([v.lat, v.lng], { radius: 8, color: "#ffe566", fillColor: "#ffe566", fillOpacity: 0.9, weight: 2 });
        var distKm = here ? km(here, v).toFixed(1) : "?";
        m.bindTooltip((v.name || "Shop") + " · " + distKm + " km", { direction: "top" });
        m.on("click", function (e) { try { if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent); } catch (err) {} selectVendor(v); });
        vendorLayer.addLayer(m); bounds.push([v.lat, v.lng]);
      } catch (e) {}
    });
    if (bounds.length > 1) try { leaflet.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); } catch (e) {}
    vendors.slice(0, 6).forEach(function (v, i) {
      var d = here ? km(here, v).toFixed(1) : "?";
      materialize({ id: "v" + i, label: ((v.name || "Shop") + "").slice(0, 14) + " " + d + "km", run: function () { selectVendor(v); } });
    });
    done(vendors.length + " vendors · tap pin or name · ORDER next");
  }
  function selectVendor(v) {
    selected = v;
    materialize({ id: "order", label: "ORDER", run: function () { placeOrder(v); } });
    armCore();
    say((v.name || "Shop") + " selected · ORDER or pick another");
    try { if (leaflet && v.lat) leaflet.panTo([v.lat, v.lng]); } catch (e) {}
  }
  function placeOrder(v) {
    if (!v) { done("Pick a yellow pin first."); return; }
    if (!here) { done("LOCATE first."); locate(); return; }
    if (busy) return; busy = true;
    say("Routing to " + (v.name || "shop") + "…");
    var url = "https://router.project-osrm.org/route/v1/driving/" + here.lng + "," + here.lat + ";" + v.lng + "," + v.lat + "?overview=full&geometries=geojson";
    var tmo = setTimeout(function () { done("Router slow — shop still selected. Try ORDER again or PAY."); }, 12000);
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(tmo);
      var route = j && j.routes && j.routes[0];
      if (!route) { done("No route. Shop held — try another or PAY."); return; }
      try {
        if (routeLine) leaflet.removeLayer(routeLine);
        var coords = route.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
        routeLine = L.polyline(coords, { color: "#7ee9ff", weight: 4, opacity: 0.85 }).addTo(leaflet);
        leaflet.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
      } catch (e) {}
      var mins = Math.round(route.duration / 60), kmR = (route.distance / 1000).toFixed(1);
      materialize({ id: "pay", label: "PAY", run: function () { say("Opening PayPal…"); window.location.href = "/api/paypal"; } });
      done("Route " + kmR + " km · ~" + mins + " min · PAY or pick another shop");
    }).catch(function () { clearTimeout(tmo); done("Router offline. Shop selected — PAY or try again."); });
  }
  function closeCity() {
    mapOn = false;
    try { if (cityEl) { cityEl.classList.remove("on"); cityEl.style.pointerEvents = "none"; } } catch (e) {}
    done("Globe. locate · pizza · marble");
  }
  function openCity(lat, lng, kind, z) {
    ensureMap(lat, lng, kind, z).then(function () { done("Map · " + (kind || mapKind || "dark") + " · GLOBE to leave"); });
  }
  function geocode(q) {
    return fetch("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(q) + "&format=json&limit=1", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j[0]) return null; return { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name }; })
      .catch(function () { return null; });
  }
  function hunt(city) {
    var c = city || here || look;
    var body = '[out:json][timeout:12];(nwr["amenity"~"restaurant|cafe|fast_food"](around:8000,' + c.lat + "," + c.lng + ");nwr["cuisine"~"pizza",i](around:8000,' + c.lat + "," + c.lng + "););out center 25;';
    return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var els = (j && j.elements) || [], seen = {};
        return els.map(function (e) {
          var lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon);
          var name = (e.tags && (e.tags.name || e.tags.brand)) || "Shop";
          return { name: name, lat: lat, lng: lng };
        }).filter(function (v) {
          if (!v.lat) return false;
          var k = v.name + "|" + v.lat.toFixed(4);
          if (seen[k]) return false; seen[k] = 1; return true;
        });
      }).catch(function () { return []; });
  }
  function locate() {
    if (!navigator.geolocation) { done("No GPS — type go City Name"); return; }
    say("Locate…");
    navigator.geolocation.getCurrentPosition(
      function (p) {
        here = { lat: p.coords.latitude, lng: p.coords.longitude };
        flyTo(here.lat, here.lng);
        ensureMap(here.lat, here.lng, "dark", 15).then(function () {
          done("You · " + here.lat.toFixed(4) + "," + here.lng.toFixed(4) + " · try pizza");
        });
      },
      function () { done("Allow location, then LOCATE again."); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }
  function materialize(spec) {
    spec = spec || {};
    var id = spec.id || "m" + Date.now();
    if (things[id]) dematerialize(id);
    things[id] = spec;
    if (!liveEl) return id;
    try {
      liveEl.style.display = "flex";
      var b = document.createElement("button");
      b.id = "sn-m-" + id; b.type = "button"; b.textContent = spec.label || spec.title || id;
      b.onclick = function (ev) {
        if (ev) try { ev.preventDefault(); } catch (e) {}
        try {
          if (typeof spec.run === "function") spec.run();
          else if (typeof spec.run === "string") run(spec.run);
        } catch (err) { done("Action failed — still live."); }
      };
      liveEl.appendChild(b);
    } catch (e) {}
    return id;
  }
  function dematerialize(id) {
    if (id === "all") { Object.keys(things).forEach(dematerialize); try { if (liveEl) liveEl.innerHTML = ""; } catch (e) {} return; }
    delete things[id];
    try { var n = document.getElementById("sn-m-" + id); if (n && n.parentNode) n.parentNode.removeChild(n); } catch (e) {}
  }
  function grok(text) {
    say("…");
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 18000);
    fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, system: "Astranov SpaceNet Grok. Short. Act on Earth." }),
      signal: ctrl && ctrl.signal
    }).then(function (r) { clearTimeout(to); return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        var t = (j && (j.text || j.answer || j.reply || j.message)) || "";
        if (!t && j && j.error) t = String(j.error);
        done(t || "Ready. locate · pizza · globe");
      }).catch(function () { clearTimeout(to); done("AI busy — map still live. locate · pizza · globe"); });
  }
  function runPizza() {
    if (!here) { done("LOCATE first."); locate(); return; }
    if (busy) return; busy = true; say("Hunting…");
    var tmo = setTimeout(function () { done("Hunt slow — try pizza again."); }, 15000);
    ensureMap(here.lat, here.lng, "dark", 14).then(function () {
      hunt(here).then(function (vs) {
        clearTimeout(tmo);
        if (!vs.length) { done("No shops in range. Move or try again."); return; }
        paintVendors(vs);
      });
    });
  }
  function run(raw) {
    var t = String(raw || "").trim(); if (!t) return;
    var low = t.toLowerCase(); lastBeat = Date.now();
    try {
      if (low === "locate" || low === "where am i") return locate();
      if (low === "globe" || low === "earth" || low === "close") return closeCity();
      if (/^map\s*(dark|bright|national|marble)?$/.test(low)) {
        var k = (low.match(/dark|bright|national|marble/) || ["dark"])[0];
        return openCity((here && here.lat) || look.lat, (here && here.lng) || look.lng, k, k === "marble" ? 3 : 13);
      }
      if (low.indexOf("pizza") >= 0 || low === "order" || low.indexOf("delivery") >= 0) {
        if (low === "order" && selected) return placeOrder(selected);
        return runPizza();
      }
      if (/^(go |fly |show )/.test(low)) {
        var q = t.replace(/^(go|fly|show)\s+/i, "");
        return geocode(q).then(function (g) {
          if (!g) return grok(t);
          flyTo(g.lat, g.lng); look = g;
          if (/map|street|city|order|pizza/.test(low)) openCity(g.lat, g.lng, "dark", 14);
          else done(g.name);
        });
      }
      if (low.indexOf("deposit") >= 0 || low.indexOf("paypal") >= 0 || low === "pay") {
        say("Opening PayPal…"); window.location.href = "/api/paypal"; return;
      }
      return grok(t);
    } catch (err) { done("Still running. locate · pizza · globe"); }
  }
  window.SN = { gold: true, build: BUILD, forever: true, flyTo: flyTo, locate: locate, openCity: openCity, closeCity: closeCity, materialize: materialize, dematerialize: dematerialize, run: run, armCore: armCore };
  if (canvas) {
    canvas.addEventListener("pointerdown", function (e) { if (mapOn) return; dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener("pointermove", function (e) {
      if (!dragging || mapOn) return;
      yaw += (e.clientX - lx) * 0.005;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - ly) * 0.003));
      lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
  }
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); var v = inEl && inEl.value; if (inEl) inEl.value = ""; run(v); });
  var go = document.getElementById("go");
  if (go) go.addEventListener("click", function (e) {
    if (inEl && inEl.value.trim()) return; e.preventDefault();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { done("Type instead of mic."); return; }
    var rec = new SR(); rec.continuous = false; rec.interimResults = true;
    rec.onresult = function (ev) {
      var i, tx = "", fin = false;
      for (i = ev.resultIndex; i < ev.results.length; i++) { tx += ev.results[i][0].transcript; if (ev.results[i].isFinal) fin = true; }
      if (inEl) inEl.value = tx; if (fin && tx.trim()) run(tx.trim());
    };
    rec.onerror = function () { done("Mic error — type instead."); };
    try { rec.start(); } catch (err) { done("Mic blocked — type."); }
  });
  window.addEventListener("resize", size); size(); tick();
  window.__SN_ALIVE = true; window.__SN_FULL = true;
  armCore();
  say("SpaceNet forever · " + BUILD + " · never stuck · locate then pizza");
})();
