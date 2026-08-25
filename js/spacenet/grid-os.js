(function () {
  "use strict";

  var canvas = document.getElementById("g");
  var cityEl = document.getElementById("city");
  var listEl = document.getElementById("list");
  var lineEl = document.getElementById("line");
  var form = document.getElementById("f");
  var input = document.getElementById("in");
  var orderBtn = document.getElementById("order");
  var callBtn = document.getElementById("call");
  var plusBtn = document.getElementById("plus");
  var goBtn = document.getElementById("go");
  var plusRing = document.getElementById("plusRing");
  var goRing = document.getElementById("goRing");
  var fileIn = document.getElementById("fileIn");
  var photoIn = document.getElementById("photoIn");
  var meBtn = document.getElementById("me");
  var mapBtn = document.getElementById("mapbtn");
  var menuEl = document.getElementById("menu");
  var txEl = document.getElementById("tx");
  var balEl = document.getElementById("bal");

  var RHODES = { lat: 36.4341, lng: 28.2176, name: "Rhodes" };
  var CUISINE = { pizza: 1, burger: 1, coffee: 1, sushi: 1, kebab: 1, tacos: 1, food: 1 };
  var OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  var here = null;
  var vendors = [];
  var selected = null;
  var mapOn = false;
  var leaflet = null;
  var leafletReady = false;
  var busy = false;
  var historyChat = [];
  var missions = [];
  var calls = [];
  var drivers = [];
  var item = null;
  var liveOrder = null;
  var LEDGER_K = "sn:avc-ledger-v1";
  var MENUS = {
    pizza: [["Margherita", 12], ["Pepperoni", 14], ["Four cheese", 15]],
    burger: [["Classic", 11], ["Cheese", 13], ["Double", 16]],
    coffee: [["Espresso", 3], ["Cappuccino", 4], ["Filter", 4]],
    sushi: [["Salmon set", 18], ["Veg set", 14]],
    kebab: [["Pita", 8], ["Box", 10]],
    tacos: [["Al pastor", 9], ["Veg", 8]],
    food: [["Plate", 12], ["Drink", 3]],
  };
  var yaw = 0.9;
  var pitch = 0.35;
  var dist = 2.7;
  var lookLat = RHODES.lat;
  var lookLng = RHODES.lng;
  var lookT = 0;

  function matter(el, on) {
    if (!el) return;
    var show = !!on;
    var gone = el.classList.contains("gone");
    if (show && gone) {
      el.classList.remove("gone");
      el.classList.remove("in");
      void el.offsetWidth;
      el.classList.add("in");
    } else if (!show && !gone) {
      el.classList.add("gone");
      el.classList.remove("in");
    }
  }

  function say(t) {
    lineEl.textContent = t || "";
    matter(lineEl, !!t);
  }

  function to(ms) {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) return AbortSignal.timeout(ms);
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }

  function ll(lat, lng, r) {
    r = r || 1;
    var phi = ((90 - lat) * Math.PI) / 180;
    var th = ((lng + 180) * Math.PI) / 180;
    return [
      -r * Math.sin(phi) * Math.cos(th),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(th),
    ];
  }

  function km(a, b) {
    var R = 6371;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  function flyTo(lat, lng) {
    lookLat = lat;
    lookLng = lng;
    lookT = 1;
    dist = 1.55;
  }

  function loadLedger() {
    var st = { accounts: { notis: 2000000 }, journal: [] };
    try {
      var raw = JSON.parse(localStorage.getItem(LEDGER_K) || "null");
      if (raw && raw.accounts) st = raw;
    } catch (e) {}
    if (!st.accounts) st.accounts = {};
    if (typeof st.accounts.notis !== "number" || st.accounts.notis < 2000000) st.accounts.notis = 2000000;
    return st;
  }
  var ledger = loadLedger();
  function saveLedger() {
    try { localStorage.setItem(LEDGER_K, JSON.stringify(ledger)); } catch (e) {}
  }
  function bal() {
    return Number(ledger.accounts.notis || 0);
  }
  function paintBal() {
    if (!balEl) return;
    var n = Math.round(bal()).toString();
    balEl.textContent = n.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " AVC";
  }
  function post(from, to, amount, memo) {
    amount = Math.round(amount * 100) / 100;
    ledger.accounts[from] = (ledger.accounts[from] || 0) - amount;
    ledger.accounts[to] = (ledger.accounts[to] || 0) + amount;
    ledger.journal.unshift({ t: Date.now(), from: from, to: to, amount: amount, memo: memo });
    if (ledger.journal.length > 80) ledger.journal.pop();
    saveLedger();
    paintBal();
  }
  function menuOf(v) {
    var key = (v && v.product) || "food";
    return MENUS[key] || MENUS.food;
  }
  function renderMenu() {
    if (!menuEl) return;
    menuEl.innerHTML = "";
    var v = sel();
    if (!v) return;
    menuOf(v).forEach(function (row) {
      var b = document.createElement("button");
      b.type = "button";
      if (item && item[0] === row[0]) b.className = "on";
      var n = document.createElement("b");
      n.textContent = row[0];
      var s = document.createElement("span");
      s.textContent = "€" + row[1];
      b.appendChild(n);
      b.appendChild(s);
      b.onclick = function () {
        item = row;
        v.price = row[1];
        v.product = v.product || "food";
        renderMenu();
      };
      menuEl.appendChild(b);
    });
  }
  function renderTx() {
    if (!txEl) return;
    txEl.innerHTML = "";
    if (!liveOrder) {
      matter(txEl, false);
      return;
    }
    matter(txEl, true);
    var o = liveOrder;
    var p = document.createElement("div");
    p.textContent = o.item + " · " + o.vendor + " → " + o.driverName + " · €" + o.total + " · " + o.status;
    txEl.appendChild(p);
    if (o.status !== "delivered") {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o.status === "enroute" ? "Delivered" : "Pickup";
      b.onclick = function () { advanceOrder(); };
      txEl.appendChild(b);
    }
  }
  function spawnDrivers(city) {
    drivers = [];
    var i;
    for (i = 0; i < 3; i++) {
      var dlat = city.lat + (Math.random() - 0.4) * 0.03;
      var dlng = city.lng + (Math.random() - 0.4) * 0.03;
      drivers.push({
        id: "d" + i,
        name: "Driver " + (i + 1),
        lat: dlat,
        lng: dlng,
        km: km(city, { lat: dlat, lng: dlng }),
      });
    }
    drivers.sort(function (a, b) { return a.km - b.km; });
  }
  function osrm(points) {
    var path = points.map(function (p) { return p.lng + "," + p.lat; }).join(";");
    return fetch("https://router.project-osrm.org/route/v1/driving/" + path + "?overview=full&geometries=geojson", { signal: to(8000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var c = j && j.routes && j.routes[0] && j.routes[0].geometry && j.routes[0].geometry.coordinates;
        if (!c) return null;
        return {
          km: (j.routes[0].distance || 0) / 1000,
          min: (j.routes[0].duration || 0) / 60,
          pts: c.map(function (xy) { return { lng: xy[0], lat: xy[1] }; }),
        };
      })
      .catch(function () { return null; });
  }
  function advanceOrder() {
    if (!liveOrder) return;
    if (liveOrder.status === "paid" || liveOrder.status === "pickup") {
      liveOrder.status = "enroute";
      liveOrder.mission.status = "live";
    } else if (liveOrder.status === "enroute") {
      liveOrder.status = "delivered";
      liveOrder.mission.status = "done";
      liveOrder.mission.progress = 1;
      post("escrow", "v:" + liveOrder.vendorId, liveOrder.food, "vendor");
      post("escrow", "d:" + liveOrder.driverId, liveOrder.fee, "driver");
      post("escrow", "net", liveOrder.net, "net");
      say(liveOrder.vendor + " · settled");
    }
    renderTx();
  }



  var ctx = canvas.getContext("2d");
  var gridSegs = [];
  (function buildGrid() {
    var lat, lng;
    for (lng = -180; lng < 180; lng += 20) {
      for (lat = -80; lat < 80; lat += 10) gridSegs.push([ll(lat, lng), ll(lat + 10, lng)]);
    }
    for (lat = -60; lat <= 60; lat += 20) {
      for (lng = -180; lng < 180; lng += 10) gridSegs.push([ll(lat, lng), ll(lat, lng + 10)]);
    }
  })();

  function rot(p) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = p[0] * cy - p[2] * sy;
    var z1 = p[0] * sy + p[2] * cy;
    var y2 = p[1] * cp - z1 * sp;
    var z2 = p[1] * sp + z1 * cp;
    return [x1, y2, z2];
  }
  function proj(p) {
    var r = rot(p);
    var w = canvas.width, h = canvas.height;
    var scale = Math.min(w, h) * 0.42 / Math.max(0.35, dist);
    var z = r[2] + dist;
    if (z < 0.12) return null;
    return [w * 0.5 + r[0] * scale, h * 0.5 - r[1] * scale, r[2]];
  }
  function strokeSegs(segs, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    var i, a, b;
    for (i = 0; i < segs.length; i++) {
      a = proj(segs[i][0]);
      b = proj(segs[i][1]);
      if (!a || !b) continue;
      if (a[2] < 0 && b[2] < 0) continue;
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }
  function dotAt(lat, lng, color, r) {
    var q = proj(ll(lat, lng, 1.02));
    if (!q || q[2] < 0) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick() {
    if (lookT > 0) {
      var targetYaw = ((lookLng + 180) * Math.PI) / 180;
      yaw += (((targetYaw - yaw + Math.PI) % (Math.PI * 2)) - Math.PI) * 0.08;
      pitch += ((lookLat * Math.PI) / 180 - pitch) * 0.08;
      lookT *= 0.9;
      if (lookT < 0.02) lookT = 0;
    }
    var i;
    for (i = 0; i < missions.length; i++) {
      if (missions[i].status === "live") {
        missions[i].progress = Math.min(1, missions[i].progress + 0.004);
        if (missions[i].progress >= 1) missions[i].status = "done";
      }
    }
    if (liveOrder && liveOrder.route && liveOrder.route.length && liveOrder.status === "enroute") {
      var rp = Math.min(0.999, liveOrder.mission.progress);
      var ix = Math.floor(rp * (liveOrder.route.length - 1));
      var pt = liveOrder.route[ix];
      if (drivers[0] && pt) { drivers[0].lat = pt.lat; drivers[0].lng = pt.lng; }
    }
    if (ctx) {
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      strokeSegs(gridSegs, "rgba(158,200,232,0.55)", 1);
      if (here) dotAt(here.lat, here.lng, "#dfe6ee", 5);
      for (i = 0; i < vendors.length; i++) {
        dotAt(vendors[i].lat, vendors[i].lng, vendors[i].id === selected ? "#f2f4f7" : "#9ec8e8", vendors[i].id === selected ? 5 : 3);
      }
      for (i = 0; i < drivers.length; i++) dotAt(drivers[i].lat, drivers[i].lng, "#c8d4a0", 3);
      var arcs = [];
      var items = missions.concat(calls);
      for (i = 0; i < items.length; i++) {
        var m = items[i];
        var a = ll(m.from.lat, m.from.lng, 1.02);
        var b = ll(m.to.lat, m.to.lng, 1.02);
        var mx = (a[0] + b[0]) * 0.5, my = (a[1] + b[1]) * 0.5, mz = (a[2] + b[2]) * 0.5;
        var nl = Math.hypot(mx, my, mz) || 1;
        mx = (mx / nl) * 1.22; my = (my / nl) * 1.22; mz = (mz / nl) * 1.22;
        var prev = a, k, t, omt, x, y, z;
        for (k = 1; k <= 16; k++) {
          t = k / 16;
          omt = 1 - t;
          x = omt * omt * a[0] + 2 * omt * t * mx + t * t * b[0];
          y = omt * omt * a[1] + 2 * omt * t * my + t * t * b[1];
          z = omt * omt * a[2] + 2 * omt * t * mz + t * t * b[2];
          arcs.push([[prev[0], prev[1], prev[2]], [x, y, z]]);
          prev = [x, y, z];
        }
      }
      if (arcs.length) strokeSegs(arcs, "rgba(158,200,232,0.9)", 1.5);
    }
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  tick();

  var dragging = false, lx = 0, ly = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener("pointerup", function () { dragging = false; });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    yaw -= (e.clientX - lx) * 0.005;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - ly) * 0.005));
    lx = e.clientX;
    ly = e.clientY;
  });
  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    dist = Math.min(5.5, Math.max(1.2, dist * (e.deltaY > 0 ? 1.08 : 0.92)));
  }, { passive: false });

  function sel() {
    var i;
    for (i = 0; i < vendors.length; i++) if (vendors[i].id === selected) return vendors[i];
    return vendors[0] || null;
  }

  function renderList() {
    listEl.innerHTML = "";
    vendors.forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      if (v.id === selected) b.className = "on";
      var n = document.createElement("b");
      n.textContent = v.name;
      var s = document.createElement("span");
      s.textContent = v.km.toFixed(1) + " km · €" + v.price;
      b.appendChild(n);
      b.appendChild(s);
      b.onclick = function () {
        selected = v.id;
        flyTo(v.lat, v.lng);
        renderList();
        syncMap();
      };
      listEl.appendChild(b);
    });
    var v = sel();
    matter(orderBtn.parentElement, !!v);
    if (v) callBtn.textContent = v.phone ? "Call" : "Hail";
    renderMenu();
  }

  function loadLeaflet(cb) {
    if (window.L) { leafletReady = true; cb(); return; }
    if (loadLeaflet.once) { loadLeaflet.wait = cb; return; }
    loadLeaflet.once = true;
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/js/vendor/leaflet.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "/js/vendor/leaflet.js";
    s.onload = function () {
      leafletReady = true;
      cb();
      if (loadLeaflet.wait && loadLeaflet.wait !== cb) loadLeaflet.wait();
    };
    document.head.appendChild(s);
  }

  function syncMap() {
    if (!leaflet || !mapOn || !window.L) return;
    leaflet.eachLayer(function (l) {
      if (l instanceof L.CircleMarker || l instanceof L.Polyline) leaflet.removeLayer(l);
    });
    if (here) {
      L.circleMarker([here.lat, here.lng], { radius: 8, color: "#dfe6ee", fillColor: "#dfe6ee", fillOpacity: 1 }).addTo(leaflet);
      leaflet.setView([here.lat, here.lng], Math.max(leaflet.getZoom() || 14, 14));
    }
    vendors.forEach(function (v) {
      var m = L.circleMarker([v.lat, v.lng], {
        radius: v.id === selected ? 9 : 6,
        color: v.id === selected ? "#f2f4f7" : "#9ec8e8",
        fillColor: v.id === selected ? "#f2f4f7" : "#9ec8e8",
        fillOpacity: 0.95,
      }).addTo(leaflet);
      m.on("click", function () {
        selected = v.id;
        flyTo(v.lat, v.lng);
        renderList();
        syncMap();
      });
    });
    if (liveOrder && liveOrder.route && liveOrder.route.length) {
      L.polyline(liveOrder.route.map(function (p) { return [p.lat, p.lng]; }), { color: "#9ec8e8", weight: 3 }).addTo(leaflet);
    } else {
      missions.forEach(function (m) {
        if (m.status !== "live") return;
        L.polyline([[m.from.lat, m.from.lng], [m.to.lat, m.to.lng]], { color: "#9ec8e8", weight: 3 }).addTo(leaflet);
      });
    }
  }

  function openMap(force) {
    if (typeof force === "boolean") mapOn = force;
    else mapOn = !mapOn;
    cityEl.classList.toggle("on", mapOn);
    mapBtn.textContent = mapOn ? "GLOBE" : "MAP";
    matter(mapBtn, mapOn);
    if (!mapOn) return;
    loadLeaflet(function () {
      var c = here || sel() || RHODES;
      if (!leaflet) {
        leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false }).setView([c.lat, c.lng], 14);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(leaflet);
      } else {
        leaflet.setView([c.lat, c.lng], 14);
        leaflet.invalidateSize();
      }
      syncMap();
    });
  }

  function geocode(q) {
    return fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(q) + "&limit=1", { signal: to(5000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var f = j && j.features && j.features[0];
        var c = f && f.geometry && f.geometry.coordinates;
        if (!c) return null;
        var p = f.properties || {};
        return { lng: c[0], lat: c[1], name: p.name || p.city || q };
      })
      .catch(function () { return null; });
  }

  function overpass(product, city) {
    var amenity = product === "coffee" ? "cafe" : "restaurant";
    var q =
      '[out:json][timeout:8];(' +
      'nwr["amenity"="' + amenity + '"]["cuisine"~"' + product + '",i](around:8000,' + city.lat + "," + city.lng + ");" +
      'nwr["amenity"="fast_food"]["name"~"' + product + '",i](around:8000,' + city.lat + "," + city.lng + ");" +
      'nwr["amenity"="restaurant"]["name"~"' + product + '",i](around:8000,' + city.lat + "," + city.lng + ");" +
      ");out center 20;";
    function one(i) {
      if (i >= OVERPASS.length) return Promise.resolve([]);
      return fetch(OVERPASS[i], {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: q }),
        signal: to(9000),
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (j) {
          var seen = {};
          var out = [];
          (j.elements || []).forEach(function (el) {
            var lat = el.lat != null ? el.lat : el.center && el.center.lat;
            var lng = el.lon != null ? el.lon : el.center && el.center.lon;
            var tags = el.tags || {};
            var name = (tags.name || "").trim();
            if (lat == null || lng == null || !name) return;
            var key = name.toLowerCase();
            if (seen[key]) return;
            seen[key] = 1;
            out.push({
              id: String(el.id),
              name: name,
              lat: lat,
              lng: lng,
              product: product,
              price: 12,
              km: km(city, { lat: lat, lng: lng }),
              phone: tags.phone || tags["contact:phone"] || "",
            });
          });
          out.sort(function (a, b) { return a.km - b.km; });
          return out.length ? out.slice(0, 16) : one(i + 1);
        })
        .catch(function () { return one(i + 1); });
    }
    return one(0);
  }

  function huntAround(product, city, quiet) {
    if (!city) return Promise.resolve();
    flyTo(city.lat, city.lng);
    if (!quiet) say("…");
    spawnDrivers(city);
    return overpass(product || "pizza", city).then(function (list) {
      vendors = list;
      selected = vendors[0] ? vendors[0].id : null;
      if (vendors[0] && !item) item = menuOf(vendors[0])[0];
      renderList();
      syncMap();
      if (!quiet) say(vendors.length ? String(vendors.length) : "");
    });
  }

  function locate() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        matter(meBtn, true);
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (p) {
          here = { lat: p.coords.latitude, lng: p.coords.longitude, name: "" };
          flyTo(here.lat, here.lng);
          matter(meBtn, false);
          resolve(here);
        },
        function () {
          matter(meBtn, true);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });
  }

  function orderVendor(v) {
    if (!v) return;
    var dest = here || { lat: v.lat, lng: v.lng };
    var food = item ? item[1] : v.price;
    var name = item ? item[0] : v.product;
    var fee = 3;
    var net = 0.5;
    var total = food + fee + net;
    if (bal() < total) {
      say(Math.round(bal()) + " AVC");
      return;
    }
    var d = drivers[0] || { id: "d0", name: "Driver", lat: dest.lat + 0.01, lng: dest.lng + 0.01 };
    post("notis", "escrow", total, "hold " + v.name);
    var mission = {
      id: "o" + Date.now(),
      kind: "order",
      label: name + " · " + v.name,
      from: { lat: v.lat, lng: v.lng, name: v.name },
      to: dest,
      status: "live",
      progress: 0,
    };
    missions.unshift(mission);
    if (missions.length > 8) missions.pop();
    liveOrder = {
      vendor: v.name,
      vendorId: v.id,
      driverId: d.id,
      driverName: d.name,
      item: name,
      food: food,
      fee: fee,
      net: net,
      total: total,
      status: "paid",
      mission: mission,
    };
    flyTo(v.lat, v.lng);
    renderTx();
    say(v.name + " · " + name + " · €" + total);
    osrm([d, v, dest]).then(function (r) {
      if (!r || !liveOrder) return;
      liveOrder.km = r.km;
      liveOrder.min = r.min;
      liveOrder.route = r.pts;
      liveOrder.status = "enroute";
      renderTx();
      say(v.name + " · " + Math.round(r.min) + " min");
    });
    if (mapOn) syncMap();
  }

  function hailVendor(v, ring) {
    if (!v) return;
    var from = here || v;
    calls.unshift({
      id: "c" + Date.now(),
      kind: "call",
      from: from,
      to: { lat: v.lat, lng: v.lng, name: v.name },
      status: "live",
      progress: 0,
    });
    if (calls.length > 6) calls.pop();
    flyTo(v.lat, v.lng);
    if (ring && v.phone) location.href = "tel:" + v.phone.replace(/\s+/g, "");
    say(v.name + (v.phone ? " · " + v.phone : " · hail"));
  }

  function grok(msg) {
    return fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: historyChat.slice(-8),
        gift: true,
        allow_paid: true,
        force_paid: true,
        fast: true,
      }),
      signal: to(18000),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { return String(j.text || j.response || "").trim(); });
  }

  function wake() {
    say("…");
    grok("One short sentence: you are Grok on Astranov SpaceNet. Live. Vendors, menus, drivers, routes, AVC.")
      .then(function (t) {
        if (t) {
          historyChat.push({ role: "assistant", content: t });
          say(t);
        } else say("");
      })
      .catch(function () { say(""); });
  }

  function run(raw) {
    var t = raw.trim();
    if (!t || busy) return;
    var low = t.toLowerCase();
    if (/^(me|locate|here|gps)$/.test(low)) {
      locate().then(function (p) { return huntAround("pizza", p || here || RHODES); });
      return;
    }
    if (/^map$/.test(low)) { openMap(); return; }
    if (/^globe$/.test(low) && mapOn) { openMap(); return; }
    if (/^order\b/.test(low)) { orderVendor(sel()); return; }
    if (/^(call|hail)\b/.test(low)) {
      var v = sel();
      hailVendor(v, !!(v && v.phone && /^call/.test(low)));
      return;
    }
    var parts = low.split(/\s+/).filter(Boolean);
    var product = parts[0];
    if (CUISINE[product]) {
      var cityP = Promise.resolve(here || RHODES);
      if (parts.length > 1) cityP = geocode(parts.slice(1).join(" ")).then(function (g) { return g || here || RHODES; });
      cityP.then(function (city) { return huntAround(product === "food" ? "pizza" : product, city); });
      return;
    }
    if (/^(go|in|near|around)\s+/.test(low)) {
      geocode(low.replace(/^(go|in|near|around)\s+/, "")).then(function (g) {
        if (g) huntAround("pizza", g);
      });
      return;
    }
    busy = true;
    say("…");
    historyChat.push({ role: "user", content: t });
    grok(t)
      .then(function (text) {
        if (text) {
          historyChat.push({ role: "assistant", content: text });
          say(text);
        } else say("");
      })
      .catch(function () { say(""); })
      .then(function () { busy = false; });
  }


  var MIC = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.93V21h2v-3.07A7 7 0 0019 11h-2z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4l-1.4 1.4 6.6 6.6H4v2h13.2l-6.6 6.6L12 22l10-10z" transform="rotate(-90 12 12)"/></svg>';
  var rec = null;
  var listening = false;
  function hasText() { return !!(input && input.value.trim()); }
  function paintGo() {
    if (!goBtn) return;
    goBtn.innerHTML = hasText() ? SEND : MIC;
    goBtn.setAttribute("aria-label", hasText() ? "Send" : "Voice");
    if (listening) goBtn.classList.add("listen");
    else goBtn.classList.remove("listen");
  }
  function placeRing(ring, leftSide) {
    if (!ring) return;
    var btns = ring.querySelectorAll("button");
    var n = btns.length;
    var i, a, r = 56, start = leftSide ? 0.35 * Math.PI : 0.65 * Math.PI, span = 0.7 * Math.PI;
    for (i = 0; i < n; i++) {
      a = leftSide ? start + (i / Math.max(1, n - 1)) * span : start - (i / Math.max(1, n - 1)) * span;
      btns[i].style.left = Math.round(Math.cos(a) * r) + "px";
      btns[i].style.top = Math.round(-Math.sin(a) * r) + "px";
    }
  }
  function closeRings() {
    if (plusRing) { plusRing.classList.add("gone"); plusRing.classList.remove("in"); }
    if (goRing) { goRing.classList.add("gone"); goRing.classList.remove("in"); }
  }
  function openRing(ring, leftSide) {
    var other = ring === plusRing ? goRing : plusRing;
    if (other) { other.classList.add("gone"); other.classList.remove("in"); }
    placeRing(ring, leftSide);
    ring.classList.remove("gone");
    ring.classList.remove("in");
    void ring.offsetWidth;
    ring.classList.add("in");
  }
  function toggleRing(ring, leftSide) {
    if (!ring) return;
    if (ring.classList.contains("gone")) openRing(ring, leftSide);
    else closeRings();
  }
  function sendNow() {
    var t = input.value.trim();
    if (!t) return;
    input.value = "";
    input.blur();
    paintGo();
    closeRings();
    run(t);
  }
  function startVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      input.focus();
      return;
    }
    if (listening && rec) {
      try { rec.stop(); } catch (e) {}
      return;
    }
    rec = new SR();
    rec.lang = (navigator.language || "en-US");
    rec.interimResults = true;
    rec.continuous = false;
    listening = true;
    paintGo();
    rec.onresult = function (ev) {
      var i, t = "";
      for (i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      input.value = t;
      paintGo();
      if (ev.results[ev.results.length - 1].isFinal) {
        listening = false;
        paintGo();
        sendNow();
      }
    };
    rec.onerror = function () { listening = false; paintGo(); };
    rec.onend = function () { listening = false; paintGo(); };
    try { rec.start(); } catch (e2) { listening = false; paintGo(); }
  }
  function doPlus(act) {
    closeRings();
    if (act === "post") {
      var t = input.value.trim() || "post";
      var p = here || { lat: lookLat, lng: lookLng };
      missions.unshift({
        id: "p" + Date.now(),
        kind: "post",
        label: t,
        from: p,
        to: p,
        status: "live",
        progress: 0,
      });
      input.value = "";
      paintGo();
      say(t);
      return;
    }
    if (act === "call") {
      var v = sel();
      if (v) hailVendor(v, !!v.phone);
      else startVoice();
      return;
    }
    if (act === "photo" && photoIn) { photoIn.click(); return; }
    if (act === "file" && fileIn) { fileIn.click(); return; }
  }
  function onPick(el, kind) {
    if (!el) return;
    el.addEventListener("change", function () {
      var f = el.files && el.files[0];
      el.value = "";
      if (!f) return;
      var p = here || { lat: lookLat, lng: lookLng };
      missions.unshift({
        id: kind[0] + Date.now(),
        kind: kind,
        label: f.name,
        from: p,
        to: p,
        status: "live",
        progress: 0,
      });
      say(f.name);
    });
  }
  function holdMenu(btn, ring, leftSide, tap) {
    var tmr = 0, held = false;
    function down(e) {
      held = false;
      tmr = setTimeout(function () {
        held = true;
        openRing(ring, leftSide);
      }, 380);
    }
    function up(e) {
      clearTimeout(tmr);
      if (held) { e.preventDefault(); return; }
      tap();
    }
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", function () { clearTimeout(tmr); });
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); openRing(ring, leftSide); });
  }

  orderBtn.onclick = function () { orderVendor(sel()); };
  callBtn.onclick = function () {
    var v = sel();
    hailVendor(v, !!(v && v.phone));
  };
  meBtn.onclick = function () { run("me"); };
  mapBtn.onclick = function () { openMap(); };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    sendNow();
  });
  if (input) {
    input.addEventListener("input", paintGo);
    input.addEventListener("focus", closeRings);
  }
  holdMenu(plusBtn, plusRing, true, function () {
    if (hasText()) doPlus("post");
    else toggleRing(plusRing, true);
  });
  holdMenu(goBtn, goRing, false, function () {
    if (hasText()) sendNow();
    else startVoice();
  });
  if (plusRing) plusRing.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b && b.getAttribute("data-act")) doPlus(b.getAttribute("data-act"));
  });
  if (goRing) goRing.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    var a = b && b.getAttribute("data-act");
    if (a === "voice") { closeRings(); startVoice(); }
    if (a === "send") sendNow();
    if (a === "grok") { closeRings(); if (hasText()) sendNow(); else startVoice(); }
  });
  onPick(fileIn, "file");
  onPick(photoIn, "photo");
  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest || !e.target.closest(".hub")) closeRings();
  });
  paintGo();

  try { paintBal(); } catch (eB) {}
  try { wake(); } catch (eW) {}
  try {
    locate().then(function (p) {
      var city = p || RHODES;
      if (!p) here = RHODES;
      return huntAround("pizza", city, true);
    }).catch(function () {});
  } catch (eL) {}
})();
