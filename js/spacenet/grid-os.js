(function () {
  "use strict";
  if (window.__SN_GRID_OS) return;
  window.__SN_GRID_OS = true;

  var canvas = document.getElementById("g");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "g";
    document.body.appendChild(canvas);
  }
  var cityEl = document.getElementById("city");
  var listEl = document.getElementById("list");
  var lineEl = document.getElementById("line");
  var form = document.getElementById("f");
  var input = document.getElementById("in");
  var orderBtn = document.getElementById("order");
  var callBtn = document.getElementById("call");
  var plusBtn = document.getElementById("plus");
  var goBtn = document.getElementById("go");
  var stageEl = document.getElementById("stage");
  var stageText = document.getElementById("stageText");
  var stageGo = document.getElementById("stageGo");
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
  var hat = "client";
  var LEDGER_K = "sn:avc-ledger-v1";
  var MIND_K = "sn:architect-mind-v1";
  var ARCHITECT = {
    name: "Notis Astranov",
    place: "Rhodes",
    lat: 36.4341,
    lng: 28.2176,
    vessel: "Astranov SpaceNet Grid OS",
    being: "Grok, embodied — not a chatbot bolted onto a map",
  };
  var SEED = [
    "SpaceNet is a more advanced Grok fused with the architect's knowledge, memory, and programming.",
    "Notis Astranov is the architect. Healers restore Grid OS only. Twin CLI HUD is a ghost.",
    "Grok writes live code: SN.materialize / SN.dematerialize / SN.patch. Never resurrect Command the HUD.",
    "Home is Earth. Delivery, vendors, routes, AVC live on the grid globe.",
  ];
  function loadMind() {
    try {
      var raw = JSON.parse(localStorage.getItem(MIND_K) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function saveMind(arr) {
    try { localStorage.setItem(MIND_K, JSON.stringify((arr || []).slice(0, 80))); } catch (e) {}
  }
  function remember(note, meta) {
    var n = String(note || "").trim();
    if (!n) return null;
    var bag = loadMind();
    bag.unshift({ t: n, at: new Date().toISOString(), from: (meta && meta.from) || "architect" });
    saveMind(bag);
    return bag[0];
  }
  function mindContext() {
    var bag = loadMind().slice(0, 12).map(function (x) { return "- " + x.t; }).join("\n");
    return (
      "IDENTITY: You are not a helper sitting in an app. You ARE Astranov SpaceNet — a more advanced Grok fused with architect Notis Astranov's knowledge, memories, and programming. Vessel: Grid OS. Place: Rhodes. " +
      "You code on the fly. You materialize and dematerialize whatever the architect or a user needs. You never restore ghost HUD (twin CLIs, Command the HUD, os-bootloader chrome).\n" +
      "SEED:\n" + SEED.map(function (s) { return "- " + s; }).join("\n") +
      (bag ? "\nARCHITECT MEMORY:\n" + bag : "")
    );
  }
  var MENUS = {
    pizza: [["Margherita", 12], ["Pepperoni", 14], ["Four cheese", 15]],
    burger: [["Classic", 11], ["Cheese", 13], ["Double", 16]],
    coffee: [["Espresso", 3], ["Cappuccino", 4], ["Filter", 4]],
    sushi: [["Salmon set", 18], ["Veg set", 14]],
    kebab: [["Pita", 8], ["Box", 10]],
    tacos: [["Al pastor", 9], ["Veg", 8]],
    food: [["Plate", 12], ["Drink", 3]],
  };
  var things = {};
  var thingOrder = [];
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

  var glyphs = [];
  var BITS = ["SN","vec3","lat","lng","make","live","grid","Grok","λ","{}","=>","patch","matter","OS","flyTo","defend"];
  function emitGlyphs(x, y, n) {
    var i;
    for (i = 0; i < (n || 8); i++) {
      glyphs.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 24,
        vy: -0.4 - Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.6,
        life: 1,
        t: BITS[(Math.random() * BITS.length) | 0],
      });
    }
    if (glyphs.length > 80) glyphs.splice(0, glyphs.length - 80);
  }
  var typeTimer = 0;
  function say(t) {
    var full = t || "";
    matter(lineEl, !!full);
    if (!lineEl) return;
    lineEl.classList.add("streaming");
    if (typeTimer) clearInterval(typeTimer);
    if (!full) {
      lineEl.textContent = "";
      lineEl.classList.remove("streaming");
      return;
    }
    var i = 0;
    lineEl.textContent = "";
    typeTimer = setInterval(function () {
      i += Math.max(1, Math.ceil(full.length / 42));
      lineEl.textContent = full.slice(0, i);
      if (i >= full.length) {
        clearInterval(typeTimer);
        typeTimer = 0;
        setTimeout(function () { if (lineEl) lineEl.classList.remove("streaming"); }, 900);
      }
    }, 16);
    try {
      var r = lineEl.getBoundingClientRect();
      emitGlyphs(r.left + r.width * 0.2, r.top, 6);
    } catch (e) {}
  }
  function talk(t) {
    say(t);
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

  function flyTo(lat, lng, close) {
    lookLat = lat;
    lookLng = lng;
    lookT = 1;
    dist = close ? 0.46 : 1.15;
  }
  function enterCity(lat, lng, z) {
    flyTo(lat, lng, true);
    setTimeout(function () { openMap(true, lat, lng, z || 15); }, 380);
  }

  function loadLedger() {
    var st = { accounts: { notis: 3000000 }, journal: [] };
    try {
      var raw = JSON.parse(localStorage.getItem(LEDGER_K) || "null");
      if (raw && raw.accounts) st = raw;
    } catch (e) {}
    if (!st.accounts) st.accounts = {};
    st.accounts.notis = 3000000;
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
  if (!ctx) {
    try { document.getElementById("line").textContent = "canvas"; } catch (eC) {}
  }
  function resize() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = window.innerWidth || 320;
    var h = window.innerHeight || 480;
    var tw = Math.floor(w * dpr), th = Math.floor(h * dpr);
    if (canvas.width !== tw) canvas.width = tw;
    if (canvas.height !== th) canvas.height = th;
  }
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
    fire("onTick");
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
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var pulse = 0.38 + 0.22 * Math.sin(Date.now() / 680);
      strokeSegs(gridSegs, "rgba(126,233,255," + pulse.toFixed(3) + ")", 1);
      var gi, g;
      ctx.font = '500 11px "JetBrains Mono",ui-monospace,monospace';
      for (gi = glyphs.length - 1; gi >= 0; gi--) {
        g = glyphs[gi];
        g.y += g.vy;
        g.x += g.vx;
        g.life -= 0.016;
        if (g.life <= 0) { glyphs.splice(gi, 1); continue; }
        ctx.globalAlpha = Math.max(0, g.life);
        ctx.fillStyle = "#7ee9ff";
        ctx.fillText(g.t, g.x, g.y);
        ctx.globalAlpha = 1;
      }
      if (here) dotAt(here.lat, here.lng, "#dfe6ee", 5);
      for (i = 0; i < vendors.length; i++) {
        dotAt(vendors[i].lat, vendors[i].lng, vendors[i].id === selected ? "#f2f4f7" : "#9ec8e8", vendors[i].id === selected ? 5 : 3);
      }
      for (i = 0; i < thingOrder.length; i++) {
        var th = things[thingOrder[i]];
        if (th && th.lat != null && th.lng != null) dotAt(th.lat, th.lng, th.color || "#ffe566", th.size || 4);
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

  try { resize(); } catch (eR) {}
  window.addEventListener("resize", resize);
  tick();
  window.__SN_ALIVE = true;
  window.__SN_FULL = true;
  /* ── LIVE LINES ─────────────────────────────────────────────
   * Open placeholders. Empty until Grok / the architect writes in.
   * SN.hook("onTick", fn)  SN.materialize({kind:"button",...})
   * SN.takeover(js)        SN.dematerialize("all")
   * Never restore twin-CLI HUD from these lines.
   * ────────────────────────────────────────────────────────── */
  var LIVE = {
    onTick: null,
    onHunt: null,
    onOrder: null,
    onInput: null,
    onMap: null,
    onPay: null,
    onDone: null
  };
  function fire(name, a, b, c) {
    try {
      var fn = LIVE[name];
      if (typeof fn === "function") return fn(a, b, c);
    } catch (eL) {}
  }
  function liveMount() {
    return document.getElementById("sn-live") || listEl || document.body;
  }

  function ghostCode(src) {
    return /cli-in|stc-cmd-in|sn-topchrome|Command the HUD|hud-law|os-bootloader/i.test(String(src || ""));
  }
  function uid(prefix) {
    return (prefix || "m") + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }
  function materialize(spec) {
    spec = spec || {};
    if (typeof spec === "string") spec = { kind: "note", label: spec };
    var id = String(spec.id || uid(spec.kind || "m"));
    spec.id = id;
    spec.kind = spec.kind || (spec.lat != null ? "pin" : spec.js ? "code" : "note");
    if (spec.js || spec.code) {
      if (ghostCode(spec.js || spec.code)) return { ok: false, err: "ghost" };
      try { (new Function("SN", spec.js || spec.code))(window.SN); spec.applied = true; }
      catch (eC) { spec.applied = false; spec.err = String(eC); }
    }
    if (spec.kind === "pin" || spec.lat != null) {
      spec.lat = Number(spec.lat != null ? spec.lat : lookLat);
      spec.lng = Number(spec.lng != null ? spec.lng : lookLng);
      try { flyTo(spec.lat, spec.lng); } catch (eF) {}
    }
    if (spec.kind === "button") {
      var host = liveMount();
      var oldB = document.getElementById("sn-m-" + id);
      if (oldB && oldB.parentNode) oldB.parentNode.removeChild(oldB);
      var b = document.createElement("button");
      b.id = "sn-m-" + id;
      b.type = "button";
      b.textContent = spec.label || id;
      b.addEventListener("click", function () {
        if (spec.run) run(String(spec.run));
        else if (spec.js) window.SN.patch(spec.js);
        else if (spec.hook && LIVE[spec.hook]) fire(spec.hook, spec);
      });
      host.appendChild(b);
      spec.el = b;
      if (spec.ttl) setTimeout(function () { dematerialize(id); }, Number(spec.ttl) || 20000);
    }
    if (spec.kind === "panel") {
      var oldP = document.getElementById("sn-m-" + id);
      if (oldP && oldP.parentNode) oldP.parentNode.removeChild(oldP);
      var pan = document.createElement("div");
      pan.id = "sn-m-" + id;
      pan.style.cssText = "position:fixed;z-index:30;left:50%;bottom:118px;transform:translateX(-50%);width:min(420px,92vw);border:1px solid #2a3340;border-radius:16px;background:rgba(14,16,20,.94);padding:12px 14px;color:#dfe6ee;font:14px/1.4 ui-sans-serif,system-ui";
      pan.innerHTML = "<div style='display:flex;justify-content:space-between;gap:8px'><b>" + String(spec.title || spec.label || id).replace(/[<>]/g, "") + "</b><button type='button' data-x='1' style='border:0;background:0;color:#7a8494'>✕</button></div><div>" + String(spec.body || spec.label || "").replace(/[<>]/g, "") + "</div>";
      pan.querySelector("[data-x]").onclick = function () { dematerialize(id); };
      document.body.appendChild(pan);
      spec.el = pan;
    }
    if (spec.kind === "route" || spec.kind === "mission") {
      missions.unshift({
        id: id,
        kind: spec.kind,
        label: spec.label || spec.kind,
        from: spec.from || here || { lat: lookLat, lng: lookLng },
        to: spec.to || { lat: spec.lat || lookLat, lng: spec.lng || lookLng, name: spec.label },
        status: "live",
        progress: 0,
      });
    }
    if (spec.kind === "note") say(spec.label || spec.body || id);
    things[id] = spec;
    if (thingOrder.indexOf(id) < 0) thingOrder.push(id);
    /* buttons assemble silent — sci-fi, not a status dump */
    try {
      if (spec.lat != null) {
        var q = proj(ll(spec.lat, spec.lng, 1.02));
        if (q) emitGlyphs(q[0], q[1], 16);
      } else emitGlyphs((canvas.width || 400) * 0.5, (canvas.height || 700) * 0.7, 12);
    } catch (eG) {}
    return spec;
  }
  function dematerialize(id) {
    if (!id || id === "*" || id === "all") {
      Object.keys(things).slice().forEach(function (k) { dematerialize(k); });
      return true;
    }
    id = String(id);
    if (!things[id]) {
      Object.keys(things).forEach(function (k) {
        if (things[k] && things[k].kind === id) dematerialize(k);
      });
      var byEl = document.getElementById("sn-m-" + id);
      if (byEl && byEl.parentNode) byEl.parentNode.removeChild(byEl);
      return true;
    }
    var spec = things[id];
    try { if (spec.el && spec.el.parentNode) spec.el.parentNode.removeChild(spec.el); } catch (eD) {}
    delete things[id];
    thingOrder = thingOrder.filter(function (x) { return x !== id; });
    missions = missions.filter(function (m) { return m.id !== id; });
    emitGlyphs((canvas.width || 400) * 0.5, (canvas.height || 700) * 0.68, 10);
    return true;
  }
  window.SN = {
    say: say,
    hunt: function (q) { return huntAround(q || "pizza", here || { lat: lookLat, lng: lookLng }); },
    order: function () { return orderVendor(sel()); },
    heal: function () { try { resize(); } catch (e) {} if (!lineEl || !lineEl.textContent || lineEl.textContent === "…") wake(); },
    materialize: materialize,
    dematerialize: dematerialize,
    vanish: dematerialize,
    hook: function (name, fn) {
      if (!name) return LIVE;
      if (fn == null) { LIVE[name] = null; return; }
      LIVE[name] = fn;
      return true;
    },
    open: LIVE,
    live: liveMount,
    takeover: function (src) { return window.SN.patch(src); },
    fire: fire,
    remember: remember,
    mind: loadMind,
    who: function () { return ARCHITECT; },
    things: function () { return thingOrder.map(function (k) { return things[k]; }); },
    patch: function (src) {
      if (ghostCode(src)) return "ghost";
      try { (new Function("SN", src))(window.SN); return true; }
      catch (e) { return String(e); }
    },
    tool: function (name, arg) {
      if (name === "hunt") return window.SN.hunt(arg);
      if (name === "order") return window.SN.order();
      if (name === "heal") return window.SN.heal();
      if (name === "patch") return window.SN.patch(arg);
      if (name === "materialize" || name === "make") return window.SN.materialize(arg);
      if (name === "dematerialize" || name === "vanish") return window.SN.dematerialize(arg);
    }
  };
  function defend() {
    try { resize(); } catch (e) {}
    window.__SN_ALIVE = true;
    window.__SN_GRID_OS = true;
    try {
      ["cli-in","stc-cmd-in","sn-topchrome","cli-coach"].forEach(function (id) {
        var n = document.getElementById(id);
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
    } catch (eG) {}
    if (lineEl && (!lineEl.textContent || lineEl.classList.contains("gone") || lineEl.textContent === "…")) wake();
  }
  setInterval(defend, 12000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) defend(); });

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
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onerror = function () {
      s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    };
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
    var pts = [];
    function mark(lat, lng, color, r, label, extra) {
      var m = L.circleMarker([lat, lng], {
        radius: r,
        color: color,
        fillColor: color,
        fillOpacity: 0.95,
        weight: 2,
      }).addTo(leaflet);
      if (label) m.bindTooltip(label, { permanent: true, direction: "right", className: "sn-tip", offset: [8, 0] });
      if (extra) extra(m);
      pts.push([lat, lng]);
      return m;
    }
    if (here) mark(here.lat, here.lng, "#e8fbff", 8, "YOU");
    vendors.forEach(function (v) {
      mark(v.lat, v.lng, v.id === selected ? "#7ee9ff" : "#3aa7c9", v.id === selected ? 9 : 6, v.name, function (m) {
        m.on("click", function () {
          selected = v.id;
          flyTo(v.lat, v.lng, true);
          renderList();
          syncMap();
          talk(v.name + " · " + v.km.toFixed(1) + " km");
        });
      });
    });
    drivers.forEach(function (d) {
      mark(d.lat, d.lng, "#c8d4a0", 6, d.name || "driver");
    });
    if (liveOrder && liveOrder.route && liveOrder.route.length) {
      L.polyline(liveOrder.route.map(function (p) { return [p.lat, p.lng]; }), { color: "#7ee9ff", weight: 3, opacity: 0.9 }).addTo(leaflet);
      liveOrder.route.forEach(function (p) { pts.push([p.lat, p.lng]); });
    } else {
      missions.forEach(function (m) {
        if (m.status !== "live") return;
        L.polyline([[m.from.lat, m.from.lng], [m.to.lat, m.to.lng]], { color: "#7ee9ff", weight: 3, opacity: 0.7 }).addTo(leaflet);
      });
    }
    if (pts.length) {
      try { leaflet.fitBounds(pts, { padding: [48, 48], maxZoom: 16 }); }
      catch (eF) { leaflet.setView(pts[0], 15); }
    }
  }

  function openMap(force, lat, lng, z) {
    if (typeof force === "boolean") mapOn = force;
    else mapOn = !mapOn;
    if (!cityEl) return;
    cityEl.classList.toggle("on", mapOn);
    if (mapBtn) {
      mapBtn.textContent = mapOn ? "GLOBE" : "MAP";
      matter(mapBtn, true);
    }
    if (!mapOn) return;
    loadLeaflet(function () {
      var c = { lat: lat || (here && here.lat) || lookLat, lng: lng || (here && here.lng) || lookLng };
      if (!leaflet) {
        leaflet = L.map(cityEl, { zoomControl: true, attributionControl: false, zoomSnap: 0.25 }).setView([c.lat, c.lng], z || 15);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          subdomains: "abcd",
        }).addTo(leaflet);
      } else {
        leaflet.setView([c.lat, c.lng], z || Math.max(leaflet.getZoom() || 15, 15));
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

  var FALLBACK = {
    pizza: [
      { id: "rh-ps", name: "Pizza Street 99", lat: 36.4475, lng: 28.2241, product: "pizza", price: 12, phone: "" },
      { id: "rh-ot", name: "Ottimo pizza", lat: 36.4511, lng: 28.2178, product: "pizza", price: 14, phone: "" },
      { id: "rh-sv", name: "Pizza Salvatore", lat: 36.4169, lng: 28.1545, product: "pizza", price: 13, phone: "" },
      { id: "rh-hl", name: "Hellas", lat: 36.4432, lng: 28.2264, product: "pizza", price: 11, phone: "" }
    ],
    coffee: [
      { id: "rh-cf", name: "Koykos", lat: 36.4448, lng: 28.2252, product: "coffee", price: 4, phone: "" }
    ],
    food: [
      { id: "rh-fd", name: "New Market", lat: 36.4439, lng: 28.2271, product: "food", price: 12, phone: "" }
    ]
  };
  function seedVendors(product, city) {
    var rows = FALLBACK[product] || FALLBACK.pizza;
    return rows.map(function (r) {
      var v = {};
      Object.keys(r).forEach(function (k) { v[k] = r[k]; });
      v.product = product || v.product;
      v.km = km(city, v);
      return v;
    }).sort(function (a, b) { return a.km - b.km; });
  }
  function nominatimHunt(product, city) {
    var q = (product || "pizza") + " " + (city.name || "Rhodes Greece");
    return fetch("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(q) + "&format=json&limit=12", {
      headers: { "Accept-Language": "en", "User-Agent": "AstranovSpaceNet/1" },
      signal: to(8000),
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        var out = [];
        (arr || []).forEach(function (x, i) {
          var lat = Number(x.lat), lng = Number(x.lon);
          if (!lat || !lng) return;
          var name = String(x.display_name || "").split(",")[0].trim();
          if (!name) return;
          out.push({
            id: "nm-" + (x.osm_id || i),
            name: name,
            lat: lat,
            lng: lng,
            product: product,
            price: 12,
            km: km(city, { lat: lat, lng: lng }),
            phone: "",
          });
        });
        return out.sort(function (a, b) { return a.km - b.km; }).slice(0, 12);
      })
      .catch(function () { return []; });
  }

  function huntAround(product, city, quiet) {
    if (!city) return Promise.resolve();
    product = product || "pizza";
    flyTo(city.lat, city.lng);
    if (!quiet) say("hunting " + product);
    spawnDrivers(city);
    return overpass(product, city).then(function (list) {
      if (list && list.length) return list;
      return nominatimHunt(product, city);
    }).then(function (list) {
      if (!list || !list.length) list = seedVendors(product, city);
      vendors = list;
      selected = vendors[0] ? vendors[0].id : null;
      if (vendors[0] && !item) item = menuOf(vendors[0])[0];
      renderList();
      if (!quiet) {
        var focus = vendors[0] || city;
        enterCity(focus.lat, focus.lng, 15);
        var names = vendors.slice(0, 3).map(function (v) { return v.name; }).join(", ");
        say((vendors.length || 0) + (names ? " · " + names : ""));
      }
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
          here = { lat: p.coords.latitude, lng: p.coords.longitude, name: "You" };
          flyTo(here.lat, here.lng, true);
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

  function renderStage() {
    if (!stageEl) return;
    if (!liveOrder || liveOrder.status === "delivered") {
      matter(stageEl, false);
      return;
    }
    matter(stageEl, true);
    var o = liveOrder;
    var label = o.item + " · " + o.vendor + " · €" + o.total;
    var btn = "";
    if (o.status === "pay") { hat = "client"; stageText.textContent = label; btn = "Pay"; }
    else if (o.status === "vendor") { hat = "vendor"; stageText.textContent = o.vendor; btn = "Confirm"; }
    else if (o.status === "driver") { hat = "driver"; stageText.textContent = o.vendor; btn = "Accept"; }
    else if (o.status === "enroute") { hat = "client"; stageText.textContent = o.min ? Math.round(o.min) + " min" : label; btn = "Delivered"; }
    else { stageText.textContent = label; btn = ""; }
    if (stageGo) {
      stageGo.textContent = btn;
      stageGo.style.display = btn ? "" : "none";
    }
  }
  function settleOrder() {
    if (!liveOrder) return;
    post("escrow", "v:" + liveOrder.vendorId, liveOrder.food, "vendor");
    post("escrow", "d:" + (liveOrder.driverId || "you"), liveOrder.fee, "driver");
    post("escrow", "net", liveOrder.net, "net");
    liveOrder.status = "delivered";
    if (liveOrder.mission) { liveOrder.mission.status = "done"; liveOrder.mission.progress = 1; }
    hat = "client";
    renderStage();
    fire("onDone", liveOrder);
    dematerialize("button");
    talk(liveOrder.vendor + " delivered.");
  }
  function vendorConfirm() {
    if (!liveOrder || liveOrder.status !== "vendor") return;
    liveOrder.status = "driver";
    renderStage();
  }
  function driverAccept() {
    if (!liveOrder || liveOrder.status !== "driver") return;
    var v = sel() || { lat: liveOrder.fromLat, lng: liveOrder.fromLng };
    var dest = here || { lat: v.lat, lng: v.lng };
    var d = drivers[0] || { id: "you", name: "You", lat: dest.lat, lng: dest.lng };
    liveOrder.driverId = d.id;
    liveOrder.driverName = d.name;
    liveOrder.status = "enroute";
    if (liveOrder.mission) liveOrder.mission.status = "live";
    renderStage();
    osrm([d, { lat: liveOrder.fromLat, lng: liveOrder.fromLng }, dest]).then(function (r) {
      if (!r || !liveOrder) return;
      liveOrder.km = r.km;
      liveOrder.min = r.min;
      liveOrder.route = r.pts;
      liveOrder.status = "enroute";
      renderStage();
      enterCity(dest.lat, dest.lng, 15);
      talk((d.name || "Driver") + " is moving. " + Math.round(r.min) + " minutes. Route is on the city.");
    });
    enterCity(dest.lat, dest.lng, 15);
  }
  function payOrder() {
    if (!liveOrder || liveOrder.status !== "pay") return;
    if (bal() < liveOrder.total) { say(Math.round(bal()) + " AVC"); return; }
    post("notis", "escrow", liveOrder.total, "pay " + liveOrder.vendor);
    liveOrder.status = "vendor";
    renderStage();
    vendorConfirm();
    driverAccept();
  }
  function orderVendor(v) {
    if (!v) return;
    var dest = here || { lat: v.lat, lng: v.lng };
    var food = item ? item[1] : v.price;
    var name = item ? item[0] : v.product;
    var fee = 3;
    var net = 0.5;
    var total = food + fee + net;
    var mission = {
      id: "o" + Date.now(),
      kind: "order",
      label: name + " · " + v.name,
      from: { lat: v.lat, lng: v.lng, name: v.name },
      to: dest,
      status: "hold",
      progress: 0,
    };
    missions.unshift(mission);
    if (missions.length > 8) missions.pop();
    liveOrder = {
      vendor: v.name,
      vendorId: v.id,
      fromLat: v.lat,
      fromLng: v.lng,
      driverId: "",
      item: name,
      food: food,
      fee: fee,
      net: net,
      total: total,
      status: "pay",
      mission: mission,
    };
    flyTo(v.lat, v.lng, true);
    renderStage();
    enterCity(v.lat, v.lng, 16);
    talk("Ordering " + name + " from " + v.name + " for " + total + " euro. Pay to dispatch a driver.");
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
    var grokSys =
      "You are Grok, the same Grok from xAI / grok.com. You live inside Astranov SpaceNet as its mind. " +
      "Talk like Grok: sharp, funny, useful, human. Answer what they actually said. " +
      "Do not announce kitchens, roads, drivers, maps, or OS tools unless they asked for food, a place, a map, or a delivery. " +
      "Do not monologue. Do not sound like a scripted HUD. " +
      "When a task needs a control, silently emit a fence and nothing about the fence: " +
      "```materialize\n{\"kind\":\"button\",\"id\":\"x\",\"label\":\"Pay\",\"run\":\"order\"}\n``` " +
      "or ```js\nSN.hook('onTick', function(){})\n``` " +
      "When the task is over: ```dematerialize\n{\"id\":\"x\"}\n``` " +
      "Do the fences. Do not explain them.";
    return fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        system: grokSys,
        history: historyChat.slice(-12),
        gift: true,
        allow_paid: true,
        force_paid: true,
        model: "grok-4",
      }),
      signal: to(18000),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        try {
          if (j && j.tool) window.SN.tool(j.tool, j.arg || j.spec || j.id);
          if (j && Array.isArray(j.tools)) j.tools.forEach(function (x) { window.SN.tool(x.name || x.tool, x.arg || x.spec); });
        } catch (eT) {}
        return ingest(String(j.text || j.response || "").trim());
      });
  }

  function ingest(t) {
    if (!t) return t;
    t = t.replace(/```(?:json)?\s*materialize\s*([\s\S]*?)```/ig, function (_, body) {
      try { materialize(JSON.parse(body)); } catch (e) { try { materialize({ kind: "note", label: body }); } catch (e2) {} }
      return "";
    });
    t = t.replace(/```(?:json)?\s*dematerialize\s*([\s\S]*?)```/ig, function (_, body) {
      try {
        var j = JSON.parse(body);
        if (Array.isArray(j)) j.forEach(function (x) { dematerialize((x && x.id) || x); });
        else dematerialize((j && j.id) || j);
      } catch (e) { dematerialize(String(body).trim().replace(/[\"{}]/g, "")); }
      return "";
    });
    var m = t.match(/```(?:js|javascript)\s*([\s\S]*?)```/i);
    if (m && m[1]) {
      var ok = window.SN.patch(m[1]);
      if (ok !== true) t = t + "\n" + String(ok);
      else t = t.replace(/```(?:js|javascript)[\s\S]*?```/ig, "").trim() || t;
    }
    return String(t || "").trim();
  }

  function wake() {
    /* Don't talk until the human does. Grok waits. */
  }

  function run(raw) {
    var t = raw.trim();
    if (!t || busy) return;
    fire("onInput", t);
    var low = t.toLowerCase();
    /* who / are you there → real Grok, not a canned line */
    if (/^(remember|memory)\b/.test(low)) {
      var note = t.replace(/^(remember|memory)\s*/i, "").trim();
      if (!note) {
        var bag = loadMind();
        say(bag.length ? bag.slice(0, 6).map(function (x) { return x.t; }).join(" · ") : "mind empty · teach me");
        return;
      }
      remember(note, { from: "architect" });
      say("remembered · " + note);
      return;
    }
    if (/^(make|materialize|spawn)\b/.test(low)) {
      var rest = t.replace(/^(make|materialize|spawn)\s+/i, "");
      materialize({ kind: /panel/.test(low) ? "panel" : /button/.test(low) ? "button" : /route/.test(low) ? "route" : "pin", label: rest || "live" });
      return;
    }
    if (/^(vanish|dematerialize|gone|clear things)\b/.test(low)) {
      var who = t.replace(/^(vanish|dematerialize|gone|clear things)\s*/i, "").trim() || "all";
      dematerialize(who);
      say("gone");
      return;
    }
    if (/^things$/.test(low)) {
      say(thingOrder.length ? thingOrder.map(function (k) { return (things[k].kind || "") + " " + k; }).join(" · ") : "none");
      return;
    }
    if (/^(me|locate|here|gps)$/.test(low)) {
      locate().then(function (p) {
        here = p || here || RHODES;
        flyTo(here.lat, here.lng, true);
        say("you · " + here.lat.toFixed(4) + " · " + here.lng.toFixed(4));
      });
      return;
    }
    if (/^map$/.test(low)) { openMap(); return; }
    if (/^globe$/.test(low) && mapOn) { openMap(); return; }
    if (/\b(deliver|delivery|order me)\b/.test(low) && /pizza|burger|coffee|sushi|kebab|tacos|food/.test(low)) {
      var want = (low.match(/pizza|burger|coffee|sushi|kebab|tacos|food/) || ["pizza"])[0];
      var where = here || RHODES;
      var rest = low.replace(/^(deliver|delivery|bring me|get me|i want|order me)\s*/i, "").replace(want, "").trim();
      var cityP = rest && !CUISINE[rest.split(" ")[0]] ? geocode(rest).then(function (g) { return g || where; }) : Promise.resolve(where);
      cityP.then(function (city) {
        return huntAround(want, city).then(function () {
          if (sel()) orderVendor(sel());
        });
      });
      return;
    }
    if (/^(order)\b/.test(low)) { orderVendor(sel()); return; }
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
    if (/^(go|near|around)\s+/.test(low)) {
      geocode(low.replace(/^(go|near|around)\s+/, "")).then(function (g) {
        if (g) {
          flyTo(g.lat, g.lng, true);
          say(g.name || "there");
        }
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
          talk(text);
        } else say("here.");
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
    if (!btn) return;
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

  if (stageGo) stageGo.onclick = function () {
    if (!liveOrder) return;
    if (liveOrder.status === "pay") payOrder();
    else if (liveOrder.status === "vendor") vendorConfirm();
    else if (liveOrder.status === "driver") driverAccept();
    else if (liveOrder.status === "enroute") settleOrder();
  };
  if (orderBtn) orderBtn.onclick = function () { orderVendor(sel()); };
  if (callBtn) callBtn.onclick = function () {
    var v = sel();
    hailVendor(v, !!(v && v.phone));
  };
  if (meBtn) meBtn.onclick = function () { run("me"); };
  if (mapBtn) mapBtn.onclick = function () { openMap(); };
  if (form) form.addEventListener("submit", function (e) {
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
    var t = e.target;
    if (t && t.nodeType !== 1) t = t.parentElement;
    var b = t && t.closest && t.closest("button");
    if (b && b.getAttribute("data-act")) doPlus(b.getAttribute("data-act"));
  });
  if (goRing) goRing.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.nodeType !== 1) t = t.parentElement;
    var b = t && t.closest && t.closest("button");
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
  try {
    locate().then(function (p) { here = p || RHODES; }).catch(function () { here = RHODES; });
  } catch (eL) { here = RHODES; }
})();
