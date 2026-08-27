(function () {
  "use strict";
  if (window.__SN_GRID_OS) return;
  window.__SN_GRID_OS = true;
  var BUILD = "20260827102000-reboot";
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
  function done(msg) { busy = false; if (msg) say(msg); armCore(); lastBeat = Date.now(); }
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
        }
      }
    } catch (e) {}
    requestAnimationFrame(tick);
  }
  setInterval(function () {
    try {
      if (Date.now() - lastBeat > 8000) { busy = false; armCore(); say("Still running · " + BUILD); lastBeat = Date.now(); }
      if (liveEl && !liveEl.querySelector("button")) armCore();
    } catch (e) {}
  }, 4000);
  window.addEventListener("error", function () { busy = false; armCore(); });
  window.addEventListener("unhandledrejection", function () { busy = false; armCore(); });
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
    document.head.appendChild(s);
  }
  function ensureMap(lat, lng, kind, z) {
    return new Promise(function (resolve) {
      if (!cityEl) { resolve(null); return; }
      mapOn = true; cityEl.classList.add("on"); cityEl.style.pointerEvents = "auto";
      loadLeaflet(function () {
        try {
          var c = [lat || (here && here.lat) || 20, lng || (here && here.lng) || 15];
          if (!leaflet) leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false }).setView(c, z || 14);
          else { leaflet.setView(c, z || 14); try { leaflet.invalidateSize(true); } catch (e) {} }
          if (tileLayer) leaflet.removeLayer(tileLayer);
          tileLayer = L.tileLayer(TILES[kind] || TILES.dark, { maxZoom: kind === "marble" ? 8 : 19 }).addTo(leaflet);
          if (!vendorLayer) vendorLayer = L.layerGroup().addTo(leaflet);
          if (here) {
            try { if (youMarker) leaflet.removeLayer(youMarker); } catch (e) {}
            youMarker = L.circleMarker([here.lat, here.lng], { radius: 8, color: "#7ee9ff", fillColor: "#7ee9ff", fillOpacity: 0.95 }).addTo(leaflet);
          }
          resolve(leaflet);
        } catch (e) { resolve(null); }
      });
    });
  }
  function closeCity() {
    mapOn = false;
    try { if (cityEl) { cityEl.classList.remove("on"); cityEl.style.pointerEvents = "none"; } } catch (e) {}
    done("Globe · " + BUILD);
  }
  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function hunt(c) {
    var body = '[out:json][timeout:12];(nwr["amenity"~"restaurant|cafe|fast_food"](around:8000,' + c.lat + "," + c.lng + ");nwr["cuisine"~"pizza",i](around:8000,' + c.lat + "," + c.lng + "););out center 25;';
    return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var els = (j && j.elements) || [], seen = {};
        return els.map(function (e) {
          var lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon);
          return { name: (e.tags && (e.tags.name || e.tags.brand)) || "Shop", lat: lat, lng: lng };
        }).filter(function (v) {
          if (!v.lat) return false;
          var k = v.name + "|" + v.lat.toFixed(4);
          if (seen[k]) return false; seen[k] = 1; return true;
        });
      }).catch(function () { return []; });
  }
  function paintVendors(list) {
    vendors = list || []; selected = null;
    try { if (vendorLayer) vendorLayer.clearLayers(); } catch (e) {}
    var bounds = []; if (here) bounds.push([here.lat, here.lng]);
    vendors.forEach(function (v, i) {
      var m = L.circleMarker([v.lat, v.lng], { radius: 8, color: "#ffe566", fillColor: "#ffe566", fillOpacity: 0.9 });
      var d = here ? km(here, v).toFixed(1) : "?";
      m.bindTooltip((v.name || "Shop") + " · " + d + " km");
      m.on("click", function () { selectVendor(v); });
      vendorLayer.addLayer(m); bounds.push([v.lat, v.lng]);
      materialize({ id: "v" + i, label: ((v.name || "Shop") + "").slice(0, 14) + " " + d + "km", run: function () { selectVendor(v); } });
    });
    if (bounds.length > 1) try { leaflet.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); } catch (e) {}
    done(vendors.length + " vendors · tap pin · ORDER · tap brand to reboot");
  }
  function selectVendor(v) {
    selected = v;
    materialize({ id: "order", label: "ORDER", run: function () { placeOrder(v); } });
    armCore();
    say((v.name || "Shop") + " · ORDER or pick another");
  }
  function placeOrder(v) {
    if (!v || !here) { done("LOCATE then pick a shop"); return; }
    say("Routing…");
    var url = "https://router.project-osrm.org/route/v1/driving/" + here.lng + "," + here.lat + ";" + v.lng + "," + v.lat + "?overview=full&geometries=geojson";
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var route = j && j.routes && j.routes[0];
      if (!route) { done("No route — pick another"); return; }
      try { if (routeLine) leaflet.removeLayer(routeLine); } catch (e) {}
      var coords = route.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      routeLine = L.polyline(coords, { color: "#7ee9ff", weight: 4 }).addTo(leaflet);
      leaflet.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
      materialize({ id: "pay", label: "PAY", run: function () { payDeposit(10); } });
      done("Route " + (route.distance / 1000).toFixed(1) + " km · ~" + Math.round(route.duration / 60) + " min · PAY");
    }).catch(function () { done("Router offline — still live"); });
  }
  function payDeposit(eur) {
    say("PayPal…");
    fetch("/api/paypal/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: eur || 10, origin: location.origin }) })
      .then(function (r) { return r.json().then(function (j) { return { j: j }; }); })
      .then(function (x) {
        if (x.j && x.j.approve) { location.href = x.j.approve; return; }
        done("Pay · " + ((x.j && (x.j.error || x.j.message)) || "not configured") + " · still live");
      }).catch(function () { done("Pay error — still live"); });
  }
  function locate() {
    if (!navigator.geolocation) { done("No GPS — type go City"); return; }
    say("Locate…");
    navigator.geolocation.getCurrentPosition(function (p) {
      here = { lat: p.coords.latitude, lng: p.coords.longitude };
      ensureMap(here.lat, here.lng, "dark", 15).then(function () {
        done("You · " + here.lat.toFixed(4) + "," + here.lng.toFixed(4) + " · pizza");
      });
    }, function () { done("Allow location, tap LOCATE"); }, { enableHighAccuracy: true, timeout: 15000 });
  }
  function runPizza() {
    if (!here) { locate(); return; }
    say("Hunting…");
    ensureMap(here.lat, here.lng, "dark", 14).then(function () {
      hunt(here).then(function (vs) {
        if (!vs.length) { done("No shops — try again"); return; }
        paintVendors(vs);
      });
    });
  }
  function grok(text) {
    say("…");
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text, system: "Astranov SpaceNet Grok. Short." }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { done((j && (j.text || j.answer || j.reply || j.message)) || "Ready · " + BUILD); })
      .catch(function () { done("AI busy · still live · " + BUILD); });
  }
  function materialize(spec) {
    spec = spec || {};
    var id = spec.id || "m" + Date.now();
    if (things[id]) dematerialize(id);
    things[id] = spec;
    if (!liveEl) return id;
    liveEl.style.display = "flex";
    var b = document.createElement("button");
    b.id = "sn-m-" + id; b.type = "button"; b.textContent = spec.label || id;
    b.onclick = function (ev) {
      if (ev) ev.preventDefault();
      try { if (typeof spec.run === "function") spec.run(); else run(spec.run); } catch (e) { done("still live"); }
    };
    liveEl.appendChild(b); return id;
  }
  function dematerialize(id) {
    delete things[id];
    var n = document.getElementById("sn-m-" + id);
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }
  function run(raw) {
    var t = String(raw || "").trim(); if (!t) return;
    var low = t.toLowerCase();
    if (low === "reboot" || low === "reset" || low === "reload") {
      if (window.SNReboot) return window.SNReboot("cli");
    }
    if (low === "locate" || low === "where am i") return locate();
    if (low === "globe" || low === "earth" || low === "close") return closeCity();
    if (/^map\s*(dark|bright|national|marble)?$/.test(low)) {
      var k = (low.match(/dark|bright|national|marble/) || ["dark"])[0];
      return ensureMap((here && here.lat) || 20, (here && here.lng) || 15, k, k === "marble" ? 3 : 13).then(function () { done("Map · " + k + " · " + BUILD); });
    }
    if (low.indexOf("pizza") >= 0 || low === "order" || low.indexOf("delivery") >= 0) {
      if (low === "order" && selected) return placeOrder(selected);
      return runPizza();
    }
    if (low.indexOf("pay") >= 0 || low.indexOf("deposit") >= 0) return payDeposit(10);
    return grok(t);
  }
  window.SN = { gold: true, build: BUILD, forever: true, run: run, locate: locate };
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
    if (!SR) { done("Type instead"); return; }
    var rec = new SR(); rec.continuous = false; rec.interimResults = true;
    rec.onresult = function (ev) {
      var i, tx = "", fin = false;
      for (i = ev.resultIndex; i < ev.results.length; i++) { tx += ev.results[i][0].transcript; if (ev.results[i].isFinal) fin = true; }
      if (inEl) inEl.value = tx; if (fin && tx.trim()) run(tx.trim());
    };
    try { rec.start(); } catch (err) { done("Mic blocked"); }
  });
  window.addEventListener("resize", size); size(); tick();
  window.__SN_ALIVE = true; window.__SN_FULL = true;
  armCore();
  say("SpaceNet " + BUILD + " · tap ASTRANOV to wipe+reboot · locate then pizza");
})();
