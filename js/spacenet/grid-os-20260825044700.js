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
    var st = { accounts: { notis: 2000000, client: 200 }, journal: [] };
    try {
      var p = JSON.parse(localStorage.getItem(LEDGER_K) || "null");
      if (p && p.accounts) st = p;
    } catch (e) {}
    if (typeof st.accounts.notis !== "number") st.accounts.notis = 2000000;
    if (typeof st.accounts.client !== "number") st.accounts.client = 200;
    return st;
  }
  var ledger = loadLedger();
  function saveLedger() {
    try { localStorage.setItem(LEDGER_K, JSON.stringify(ledger)); } catch (e) {}
  }
  function bal() {
    return Number(ledger.accounts.client || 0);
  }
  function paintBal() {
    if (balEl) balEl.textContent = Math.round(bal()) + " AVC";
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


  /* —— tiny WebGL globe —— */
  var gl = canvas.getContext("webgl", { antialias: true, alpha: false }) ||
    canvas.getContext("experimental-webgl");
  var prog, uMVP, aPos, aCol, gridBuf, pinBuf, arcBuf, gridN = 0;

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function buildGrid() {
    var v = [];
    var lat, lng, a, b, i;
    for (lng = -180; lng < 180; lng += 20) {
      for (lat = -80; lat < 80; lat += 10) {
        a = ll(lat, lng);
        b = ll(lat + 10, lng);
        v.push(a[0], a[1], a[2], 0.62, 0.78, 0.91, b[0], b[1], b[2], 0.62, 0.78, 0.91);
      }
    }
    for (lat = -60; lat <= 60; lat += 20) {
      for (lng = -180; lng < 180; lng += 10) {
        a = ll(lat, lng);
        b = ll(lat, lng + 10);
        v.push(a[0], a[1], a[2], 0.62, 0.78, 0.91, b[0], b[1], b[2], 0.62, 0.78, 0.91);
      }
    }
    gridN = v.length / 6;
    gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  }

  function mul(a, b) {
    var o = new Float32Array(16);
    var i, j, k;
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 4; j++) {
        var s = 0;
        for (k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
    }
    return o;
  }

  function persp(fovy, aspect, near, far) {
    var f = 1 / Math.tan((fovy * Math.PI) / 360);
    var m = new Float32Array(16);
    m[0] = f / aspect;
    m[5] = f;
    m[10] = (far + near) / (near - far);
    m[11] = -1;
    m[14] = (2 * far * near) / (near - far);
    return m;
  }

  function lookAt(ex, ey, ez) {
    var zx = -ex, zy = -ey, zz = -ez;
    var len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;
    var ux = 0, uy = 1, uz = 0;
    var xx = uy * zz - uz * zy;
    var xy = uz * zx - ux * zz;
    var xz = ux * zy - uy * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    var m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx;
    m[4] = xy; m[5] = yy; m[6] = zy;
    m[8] = xz; m[9] = yz; m[10] = zz;
    m[12] = -(xx * ex + xy * ey + xz * ez);
    m[13] = -(yx * ex + yy * ey + yz * ez);
    m[14] = -(zx * ex + zy * ey + zz * ez);
    m[15] = 1;
    return m;
  }

  function bind(buf, n) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.LINES, 0, n);
  }

  function pinVerts() {
    var v = [];
    function add(lat, lng, r, g, b, s) {
      var p = ll(lat, lng, 1.02);
      var d = s || 0.018;
      v.push(p[0] - d, p[1], p[2], r, g, b, p[0] + d, p[1], p[2], r, g, b);
      v.push(p[0], p[1] - d, p[2], r, g, b, p[0], p[1] + d, p[2], r, g, b);
    }
    if (here) add(here.lat, here.lng, 0.87, 0.9, 0.93, 0.022);
    var i;
    for (i = 0; i < vendors.length; i++) {
      var on = vendors[i].id === selected;
      add(vendors[i].lat, vendors[i].lng, on ? 0.95 : 0.62, on ? 0.96 : 0.78, on ? 0.97 : 0.91, on ? 0.02 : 0.012);
    }
    for (i = 0; i < drivers.length; i++) {
      add(drivers[i].lat, drivers[i].lng, 0.78, 0.84, 0.55, 0.014);
    }
    return v;
  }

  function arcVerts() {
    var v = [];
    var items = missions.concat(calls);
    var i, t, k;
    for (i = 0; i < items.length; i++) {
      var m = items[i];
      var a = ll(m.from.lat, m.from.lng, 1.02);
      var b = ll(m.to.lat, m.to.lng, 1.02);
      var mx = (a[0] + b[0]) * 0.5, my = (a[1] + b[1]) * 0.5, mz = (a[2] + b[2]) * 0.5;
      var nl = Math.hypot(mx, my, mz) || 1;
      mx = (mx / nl) * 1.22; my = (my / nl) * 1.22; mz = (mz / nl) * 1.22;
      var prev = a;
      for (k = 1; k <= 20; k++) {
        t = k / 20;
        var omt = 1 - t;
        var x = omt * omt * a[0] + 2 * omt * t * mx + t * t * b[0];
        var y = omt * omt * a[1] + 2 * omt * t * my + t * t * b[1];
        var z = omt * omt * a[2] + 2 * omt * t * mz + t * t * b[2];
        var c = m.kind === "call" ? [0.72, 0.77, 0.83] : [0.62, 0.78, 0.91];
        v.push(prev[0], prev[1], prev[2], c[0], c[1], c[2], x, y, z, c[0], c[1], c[2]);
        prev = [x, y, z];
      }
    }
    return v;
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    if (leaflet) leaflet.invalidateSize();
  }

  if (gl) {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER,
      "attribute vec3 p;attribute vec3 c;uniform mat4 mvp;varying vec3 vc;void main(){vc=c;gl_Position=mvp*vec4(p,1.0);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
      "precision mediump float;varying vec3 vc;void main(){gl_FragColor=vec4(vc,1.0);}"));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    uMVP = gl.getUniformLocation(prog, "mvp");
    aPos = gl.getAttribLocation(prog, "p");
    aCol = gl.getAttribLocation(prog, "c");
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aCol);
    gl.clearColor(0.02, 0.024, 0.031, 1);
    gl.enable(gl.DEPTH_TEST);
    buildGrid();
    pinBuf = gl.createBuffer();
    arcBuf = gl.createBuffer();
  }

  function tick() {
    if (lookT > 0) {
      var targetYaw = ((lookLng + 180) * Math.PI) / 180;
      yaw += (((targetYaw - yaw + Math.PI) % (Math.PI * 2)) - Math.PI) * 0.08;
      pitch += (lookLat * Math.PI / 180 - pitch) * 0.08;
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
    if (gl) {
      var ex = dist * Math.sin(yaw) * Math.cos(pitch);
      var ey = dist * Math.sin(pitch);
      var ez = dist * Math.cos(yaw) * Math.cos(pitch);
      var mvp = mul(persp(42, canvas.width / canvas.height, 0.1, 40), lookAt(ex, ey, ez));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uMVP, false, mvp);
      bind(gridBuf, gridN);
      var pv = pinVerts();
      if (pv.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, pinBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pv), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 24, 12);
        gl.drawArrays(gl.LINES, 0, pv.length / 6);
      }
      var av = arcVerts();
      if (av.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, arcBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(av), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 24, 12);
        gl.drawArrays(gl.LINES, 0, av.length / 6);
      }
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
    post("client", "escrow", total, "hold " + v.name);
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

  orderBtn.onclick = function () { orderVendor(sel()); };
  callBtn.onclick = function () {
    var v = sel();
    hailVendor(v, !!(v && v.phone));
  };
  meBtn.onclick = function () { run("me"); };
  mapBtn.onclick = function () { openMap(); };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var t = input.value.trim();
    input.value = "";
    input.blur();
    if (t) run(t);
  });

  paintBal();
  wake();
  locate().then(function (p) {
    var city = p || RHODES;
    if (!p) here = RHODES;
    return huntAround("pizza", city, true);
  });
})();
