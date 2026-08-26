(function () {
  "use strict";
  if (window.__SN_GRID_OS) return;
  window.__SN_GRID_OS = true;
  var BUILD = "20260826181500-finish";
  var canvas = document.getElementById("g");
  var cityEl = document.getElementById("city");
  var lineEl = document.getElementById("line");
  var inEl = document.getElementById("in");
  var form = document.getElementById("f");
  var liveEl = document.getElementById("sn-live");
  var leaflet = null, mapOn = false, mapKind = "dark", tileLayer = null;
  var yaw = 0.55, pitch = 0.12, dist = 2.15;
  var look = { lat: 36.434, lng: 28.217 };
  var here = null, things = {}, dragging = false, lx = 0, ly = 0;

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
    var w = canvas.width, h = canvas.height, s = Math.min(w, h) * 0.42 / dist, z = z2 + dist;
    if (z < 0.12) return null;
    return [w * 0.5 + x1 * s, h * 0.48 - y2 * s, z2];
  }
  var segs = [];
  (function build() {
    var lat, lng;
    for (lng = -180; lng < 180; lng += 20)
      for (lat = -80; lat < 80; lat += 10) segs.push([ll(lat, lng), ll(lat + 10, lng)]);
    for (lat = -60; lat <= 60; lat += 20)
      for (lng = -180; lng < 180; lng += 10) segs.push([ll(lat, lng), ll(lat, lng + 10)]);
  })();
  function tick() {
    if (!canvas) return;
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
    marble: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
    google: "/api/gtiles?z={z}&x={x}&y={y}"
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
    tileLayer = L.tileLayer(TILES[mapKind], { maxZoom: mapKind === "marble" ? 8 : 19 });
    tileLayer.addTo(leaflet);
  }

  function openCity(lat, lng, kind, z) {
    if (!cityEl) return;
    mapOn = true;
    cityEl.classList.add("on");
    loadLeaflet(function () {
      var c = [lat || look.lat, lng || look.lng];
      if (!leaflet) leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false }).setView(c, z || 14);
      else { leaflet.setView(c, z || leaflet.getZoom() || 14); leaflet.invalidateSize(); }
      setMap(kind || mapKind || "dark");
      if (here) L.circleMarker([here.lat, here.lng], { radius: 7, color: "#7ee9ff", fillColor: "#7ee9ff", fillOpacity: 0.9 }).addTo(leaflet);
    });
  }

  function closeCity() {
    mapOn = false;
    if (cityEl) cityEl.classList.remove("on");
  }

  function geocode(q) {
    return fetch("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(q) + "&format=json&limit=1", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j[0]) return null;
        return { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name };
      })
      .catch(function () { return null; });
  }

  function hunt(q, city) {
    var c = city || here || look;
    var body = '[out:json][timeout:12];(nwr["amenity"~"restaurant|cafe|fast_food"]["name"~' + JSON.stringify(q) + ",i](around:7000," + c.lat + "," + c.lng + "););out center 20;";
    return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: body })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var els = (j && j.elements) || [];
        return els.map(function (e) {
          var lat = e.lat || (e.center && e.center.lat);
          var lng = e.lon || (e.center && e.center.lon);
          return { name: (e.tags && e.tags.name) || q, lat: lat, lng: lng };
        }).filter(function (v) { return v.lat; });
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
        openCity(here.lat, here.lng, "dark", 15);
        say("You · " + here.lat.toFixed(4) + "," + here.lng.toFixed(4));
      },
      function () { say("Allow location for SpaceNet, then LOCATE again."); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function materialize(spec) {
    spec = spec || {};
    var id = spec.id || "m" + Date.now();
    things[id] = spec;
    if (!liveEl) return id;
    liveEl.style.display = "flex";
    var b = document.createElement("button");
    b.id = "sn-m-" + id;
    b.type = "button";
    b.textContent = spec.label || spec.title || id;
    b.onclick = function () {
      if (typeof spec.run === "function") spec.run();
      else if (typeof spec.run === "string") run(spec.run);
    };
    liveEl.appendChild(b);
    return id;
  }

  function dematerialize(id) {
    if (id === "all") {
      Object.keys(things).forEach(dematerialize);
      if (liveEl) liveEl.innerHTML = "";
      return;
    }
    delete things[id];
    var n = document.getElementById("sn-m-" + id);
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function grok(text) {
    say("…");
    return fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: text,
        system: "You are Astranov SpaceNet Grok. Act on Earth. Prefer short answers. No ghost HUD. No kitchen slang."
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        var t = (j && (j.text || j.answer || j.reply || j.message)) || "";
        if (!t && j && j.error) t = String(j.error);
        if (!t) t = "Here.";
        say(t);
        return t;
      })
      .catch(function () { say("AI line down. Globe works: locate · rhodes · pizza · map dark · map marble."); });
  }

  function run(raw) {
    var t = String(raw || "").trim();
    if (!t) return;
    var low = t.toLowerCase();
    if (low === "locate" || low === "where am i") return locate();
    if (low === "globe" || low === "earth") { closeCity(); say("Globe."); return; }
    if (/^map\s*(dark|bright|national|marble|google)?$/.test(low)) {
      var k = (low.match(/dark|bright|national|marble|google/) || ["dark"])[0];
      openCity(look.lat, look.lng, k, k === "marble" ? 3 : 13);
      say("Map · " + k);
      return;
    }
    if (low.indexOf("pizza") >= 0 || low.indexOf("order") >= 0 || low.indexOf("delivery") >= 0) {
      var origin = here || look;
      flyTo(origin.lat, origin.lng);
      openCity(origin.lat, origin.lng, "dark", 14);
      say("Hunting…");
      hunt("pizza", origin).then(function (vs) {
        if (!vs.length) { say("No vendors in range. LOCATE first, then pizza."); return; }
        vs.slice(0, 8).forEach(function (v) {
          if (leaflet && window.L)
            L.circleMarker([v.lat, v.lng], { radius: 6, color: "#ffe566", fillOpacity: 0.85 }).addTo(leaflet).bindTooltip(v.name);
        });
        say(vs.length + " vendors on dark city map.");
      });
      return;
    }
    if (/^(go |fly |show )/.test(low) || /rhodes|athens|nairobi|london|paris/.test(low)) {
      var q = t.replace(/^(go|fly|show)\s+/i, "");
      geocode(q).then(function (g) {
        if (!g) { grok(t); return; }
        flyTo(g.lat, g.lng);
        look = g;
        say(g.name);
        if (/street|city|map|deliver|order|pizza/.test(low)) openCity(g.lat, g.lng, "dark", 14);
      });
      return;
    }
    if (low.indexOf("deposit") >= 0 || low.indexOf("paypal") >= 0) {
      say("Opening PayPal deposit…");
      window.location.href = "/api/paypal";
      return;
    }
    grok(t);
  }

  window.SN = {
    gold: true,
    build: BUILD,
    flyTo: flyTo,
    locate: locate,
    hunt: hunt,
    setMap: setMap,
    openCity: openCity,
    closeCity: closeCity,
    materialize: materialize,
    dematerialize: dematerialize,
    run: run,
    set: function (k, v) {
      if (k === "yaw") yaw = v;
      if (k === "pitch") pitch = v;
      if (k === "dist") dist = v;
    }
  };

  if (canvas) {
    canvas.addEventListener("pointerdown", function (e) { dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lx) * 0.005;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - ly) * 0.003));
      lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      dist = Math.max(1.25, Math.min(4.2, dist + (e.deltaY > 0 ? 0.12 : -0.12)));
    }, { passive: false });
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
    if (!SR) { say("Type instead of mic."); return; }
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
  materialize({ id: "rhodes", label: "RHODES", run: "go Rhodes Greece" });
  materialize({ id: "marble", label: "MARBLE", run: "map marble" });
  say("SpaceNet ready. Globe first. Maps load only on locate / order / map.");
})();
