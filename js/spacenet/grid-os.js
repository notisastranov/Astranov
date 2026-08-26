(function () {
  "use strict";
  if (window.__SN_GRID_OS) return;
  window.__SN_GRID_OS = true;
  var BUILD = "20260826191500-alive";
  var canvas = document.getElementById("g");
  var cityEl = document.getElementById("city");
  var lineEl = document.getElementById("line");
  var inEl = document.getElementById("in");
  var form = document.getElementById("f");
  var liveEl = document.getElementById("sn-live");
  var leaflet = null, mapOn = false, mapKind = "dark", tileLayer = null;
  var vendorLayer = null, youMarker = null;
  var yaw = 0.4, pitch = 0.08, dist = 2.2;
  var look = { lat: 20, lng: 15 };
  var here = null, things = {}, dragging = false, lx = 0, ly = 0;
  var vendors = [], selected = null;

  function say(t) {
    if (!lineEl || t == null) return;
    lineEl.classList.remove("gone");
    lineEl.textContent = String(t);
  }
  function size() {
    if (!canvas) return;
    var d = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor((innerWidth || 320) * d);
    canvas.height = Math.floor((innerHeight || 480) * d);
  }
  function ll(lat, lng) {
    var p = (90 - lat) * Math.PI / 180, t = (lng + 180) * Math.PI / 180;
    return [-Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
  }
  function pr(p) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
    var y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
    var w = canvas.width, h = canvas.height, s = Math.min(w, h) * 0.42 / dist;
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
    if (!canvas || mapOn) { requestAnimationFrame(tick); return; }
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(158,200,232,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < segs.length; i++) {
      var a = pr(segs[i][0]), b = pr(segs[i][1]);
      if (!a || !b) continue;
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
    if (here) {
      var d = pr(ll(here.lat, here.lng));
      if (d) {
        ctx.fillStyle = "#7ee9ff";
        ctx.beginPath();
        ctx.arc(d[0], d[1], 4, 0, 6.28);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }
  function flyTo(lat, lng) {
    look = { lat: +lat, lng: +lng };
    yaw = ((lng + 180) * Math.PI) / 180 - Math.PI / 2;
    pitch = (lat * Math.PI) / 180 * 0.65;
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
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
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
      if (!cityEl) return resolve(null);
      mapOn = true;
      cityEl.classList.add("on");
      cityEl.style.pointerEvents = "auto";
      loadLeaflet(function () {
        var c = [lat || (here && here.lat) || look.lat, lng || (here && here.lng) || look.lng];
        if (!leaflet) {
          leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false, tap: true }).setView(c, z || 14);
        } else {
          leaflet.setView(c, z || leaflet.getZoom() || 14);
          setTimeout(function () { try { leaflet.invalidateSize(true); } catch (e) {} }, 80);
        }
        setMap(kind || mapKind || "dark");
        if (!vendorLayer) vendorLayer = L.layerGroup().addTo(leaflet);
        paintYou();
        resolve(leaflet);
      });
    });
  }

  function paintYou() {
    if (!leaflet || !window.L || !here) return;
    if (youMarker) { try { leaflet.removeLayer(youMarker); } catch (e) {} }
    youMarker = L.circleMarker([here.lat, here.lng], {
      radius: 8, color: "#7ee9ff", fillColor: "#7ee9ff", fillOpacity: 0.95, weight: 2
    }).addTo(leaflet);
    youMarker.bindTooltip("YOU", { permanent: false, direction: "top" });
  }

  function clearVendors() {
    vendors = [];
    selected = null;
    if (vendorLayer) vendorLayer.clearLayers();
    dematerialize("vendors");
    dematerialize("order");
    dematerialize("close");
  }

  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function paintVendors(list) {
    clearVendors();
    vendors = list || [];
    if (!leaflet || !window.L) return;
    var bounds = [];
    if (here) bounds.push([here.lat, here.lng]);
    vendors.forEach(function (v, i) {
      var m = L.circleMarker([v.lat, v.lng], {
        radius: 8, color: "#ffe566", fillColor: "#ffe566", fillOpacity: 0.9, weight: 2
      });
      var distKm = here ? km(here, v).toFixed(1) : "?";
      m.bindTooltip(v.name + " · " + distKm + " km", { direction: "top" });
      m.on("click", function (e) {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        selectVendor(v, i);
      });
      vendorLayer.addLayer(m);
      bounds.push([v.lat, v.lng]);
    });
    if (bounds.length > 1) {
      try { leaflet.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); } catch (e) {}
    }
    materialize({ id: "close", label: "GLOBE", run: function () { closeCity(); } });
    vendors.slice(0, 6).forEach(function (v, i) {
      var d = here ? km(here, v).toFixed(1) : "?";
      materialize({
        id: "v" + i,
        label: (v.name || "Shop").slice(0, 14) + " " + d + "km",
        run: function () { selectVendor(v, i); }
      });
    });
  }

  function selectVendor(v, i) {
    selected = v;
    say((v.name || "Shop") + " · tap ORDER or say order");
    dematerialize("order");
    materialize({ id: "order", label: "ORDER", run: function () { placeOrder(v); } });
    if (leaflet && v.lat) leaflet.panTo([v.lat, v.lng]);
  }

  function placeOrder(v) {
    if (!v) { say("Pick a yellow pin or vendor button first."); return; }
    if (!here) { say("LOCATE first."); return locate(); }
    say("Order · " + (v.name || "Shop") + " · route…");
    var url = "https://router.project-osrm.org/route/v1/driving/" +
      here.lng + "," + here.lat + ";" + v.lng + "," + v.lat + "?overview=full&geometries=geojson";
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var route = j && j.routes && j.routes[0];
        if (!route) { say("Route failed. Order held at shop."); return; }
        var coords = route.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
        if (window.__snRoute) { try { leaflet.removeLayer(window.__snRoute); } catch (e) {} }
        window.__snRoute = L.polyline(coords, { color: "#7ee9ff", weight: 4, opacity: 0.85 }).addTo(leaflet);
        leaflet.fitBounds(window.__snRoute.getBounds(), { padding: [30, 30] });
        var mins = Math.round(route.duration / 60);
        var kmR = (route.distance / 1000).toFixed(1);
        say("Route " + kmR + " km · ~" + mins + " min. Pay when ready.");
        materialize({ id: "pay", label: "PAY", run: function () {
          say("Opening PayPal…");
          window.location.href = "/api/paypal";
        }});
      })
      .catch(function () { say("Router offline. Shop selected — try pay."); });
  }

  function closeCity() {
    mapOn = false;
    if (cityEl) { cityEl.classList.remove("on"); cityEl.style.pointerEvents = "none"; }
    say("Globe.");
  }

  function openCity(lat, lng, kind, z) {
    ensureMap(lat, lng, kind, z).then(function () {
      say("Map · " + (kind || mapKind || "dark"));
      materialize({ id: "close", label: "GLOBE", run: function () { closeCity(); } });
    });
  }

  function geocode(q) {
    return fetch("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(q) + "&format=json&limit=1",
      { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j[0]) return null;
        return { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name };
      })
      .catch(function () { return null; });
  }

  function hunt(q, city) {
    var c = city || here || look;
    var body = '[out:json][timeout:12];(' +
      'nwr["amenity"~"restaurant|cafe|fast_food"](around:8000,' + c.lat + "," + c.lng + ");" +
      'nwr["cuisine"~"pizza",i](around:8000,' + c.lat + "," + c.lng + ");" +
      ');out center 25;';
    return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var els = (j && j.elements) || [];
        var seen = {};
        return els.map(function (e) {
          var lat = e.lat || (e.center && e.center.lat);
          var lng = e.lon || (e.center && e.center.lon);
          var name = (e.tags && (e.tags.name || e.tags.brand)) || "Shop";
          return { name: name, lat: lat, lng: lng };
        }).filter(function (v) {
          if (!v.lat) return false;
          var k = v.name + "|" + v.lat.toFixed(4) + "|" + v.lng.toFixed(4);
          if (seen[k]) return false;
          seen[k] = 1;
          return true;
        });
      })
      .catch(function () { return []; });
  }

  function locate() {
    if (!navigator.geolocation) { say("No GPS on this device."); return; }
    say("Locate…");
    navigator.geolocation.getCurrentPosition(
      function (p) {
        here = { lat: p.coords.latitude, lng: p.coords.longitude };
        flyTo(here.lat, here.lng);
        ensureMap(here.lat, here.lng, "dark", 15).then(function () {
          say("You · " + here.lat.toFixed(4) + "," + here.lng.toFixed(4) + " · try pizza");
        });
      },
      function () { say("Allow location, then LOCATE again."); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  function materialize(spec) {
    spec = spec || {};
    var id = spec.id || "m" + Date.now();
    if (things[id]) dematerialize(id);
    things[id] = spec;
    if (!liveEl) return id;
    liveEl.style.display = "flex";
    var b = document.createElement("button");
    b.id = "sn-m-" + id;
    b.type = "button";
    b.textContent = spec.label || spec.title || id;
    b.onclick = function (ev) {
      if (ev) ev.preventDefault();
      try {
        if (typeof spec.run === "function") spec.run();
        else if (typeof spec.run === "string") run(spec.run);
      } catch (err) { say("Action failed."); }
    };
    liveEl.appendChild(b);
    return id;
  }

  function dematerialize(id) {
    if (id === "all" || id === "vendors") {
      Object.keys(things).forEach(function (k) {
        if (id === "all" || k.indexOf("v") === 0) dematerialize(k);
      });
      if (id === "all" && liveEl) liveEl.innerHTML = "";
      return;
    }
    delete things[id];
    var n = document.getElementById("sn-m-" + id);
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function grok(text) {
    say("…");
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: text,
        system: "You are Astranov SpaceNet Grok. Short. Act on Earth. No kitchen monologue."
      }),
      signal: ctrl && ctrl.signal
    })
      .then(function (r) { clearTimeout(to); return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        var t = (j && (j.text || j.answer || j.reply || j.message)) || "";
        if (!t && j && j.error) t = String(j.error);
        if (!t) t = "Here.";
        say(t);
        return t;
      })
      .catch(function () {
        clearTimeout(to);
        say("AI busy. Map still live: locate · pizza · order · globe.");
      });
  }

  function runPizza() {
    if (!here) { say("LOCATE first."); return locate(); }
    say("Hunting vendors…");
    ensureMap(here.lat, here.lng, "dark", 14).then(function () {
      hunt("pizza", here).then(function (vs) {
        if (!vs.length) { say("No shops in range. Move or try again."); return; }
        paintVendors(vs);
        say(vs.length + " vendors · tap a yellow pin or name · then ORDER");
      });
    });
  }

  function run(raw) {
    var t = String(raw || "").trim();
    if (!t) return;
    var low = t.toLowerCase();
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
          flyTo(g.lat, g.lng);
          look = g;
          say(g.name);
          if (/map|street|city|order|pizza/.test(low)) openCity(g.lat, g.lng, "dark", 14);
        });
      }
      if (low.indexOf("deposit") >= 0 || low.indexOf("paypal") >= 0 || low === "pay") {
        say("Opening PayPal…");
        window.location.href = "/api/paypal";
        return;
      }
      return grok(t);
    } catch (err) {
      say("Still alive. locate · pizza · globe");
    }
  }

  window.SN = {
    gold: true, build: BUILD, flyTo: flyTo, locate: locate, hunt: hunt,
    openCity: openCity, closeCity: closeCity, materialize: materialize,
    dematerialize: dematerialize, run: run
  };

  if (canvas) {
    canvas.addEventListener("pointerdown", function (e) {
      if (mapOn) return;
      dragging = true; lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging || mapOn) return;
      yaw += (e.clientX - lx) * 0.005;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - ly) * 0.003));
      lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = inEl && inEl.value;
    if (inEl) inEl.value = "";
    run(v);
  });

  var go = document.getElementById("go");
  if (go) go.addEventListener("click", function (e) {
    if (inEl && inEl.value.trim()) return;
    e.preventDefault();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { say("Type instead."); return; }
    var rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = function (ev) {
      var i, t = "", fin = false;
      for (i = ev.resultIndex; i < ev.results.length; i++) {
        t += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fin = true;
      }
      if (inEl) inEl.value = t;
      if (fin && t.trim()) run(t.trim());
    };
    try { rec.start(); } catch (err) {}
  });

  window.addEventListener("resize", size);
  size();
  tick();
  window.__SN_ALIVE = true;
  window.__SN_FULL = true;
  materialize({ id: "locate", label: "LOCATE", run: "locate" });
  materialize({ id: "pizza", label: "PIZZA", run: "pizza" });
  materialize({ id: "marble", label: "MARBLE", run: "map marble" });
  say("SpaceNet · " + BUILD + " · locate then pizza · pins stay live");
})();
