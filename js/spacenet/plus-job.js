/* SpaceNet 4146 — silent +. Post a job / Post something / Call somebody. Map first. */
(function () {
  window.__snPlusJob = true;
  var FEE = 0.03, SUR = 3, HOUR = 33;
  var mode = "", from = null, to = null, quote = null, pickingKind = "", menuAt = null;
  var weather = { rain: false, t: 0 };
  var visLayer = null;
  function line(s) { var el = document.getElementById("line"); if (el) el.textContent = s || ""; }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
  function peer() { try { var id = localStorage.getItem("sn:peer"); if (id && /^[a-z0-9]+$/i.test(id)) return id; } catch (e) {} return ""; }
  function headers() { var h = { "Content-Type": "application/json", Accept: "application/json" }; var t = token(); if (t.length > 20) h.Authorization = "Bearer " + t; return h; }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function nightNow() { var h = new Date().getHours(); return h >= 21 || h < 9; }
  function visibleOn() { return !!user() && read("sn:visible", "1") !== "0"; }
  function owner() { return email() === "notisastranov@gmail.com" || read("sn:admin") === "1"; }
  function papersOk() { return owner() || read("sn:driver-ok") === "1" || read("sn:vendor-ok") === "1" || read("sn:labor-ok") === "1"; }
  function km(a, b) {
    if (window.SN && SN.km) return SN.km(a, b);
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function nameOf(p) { if (!p) return "This place"; var n = String(p.name || p.label || "").trim(); return n || "This place"; }
  function here() {
    try { var p = JSON.parse(read("sn:place", "null") || "null"); if (p && isFinite(Number(p.lat))) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    try { if (window.SN && SN.getMap) { var m = SN.getMap(); if (m && m.getCenter) { var c = m.getCenter(); return { lat: c.lat, lng: c.lng, name: "YOU" }; } } } catch (e) {}
    return null;
  }
  function getMap() { try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {} return window.__snLeaflet || null; }
  function zoomCity(p) {
    p = p || here(); if (!p || !isFinite(p.lat)) return;
    try { if (window.SN && SN.showCity) SN.showCity(p); } catch (e) {}
    try { if (window.SN && SN.showMap) SN.showMap(p, 16); } catch (e) {}
    var m = getMap(); try { if (m && m.setView) m.setView([p.lat, p.lng], 16); } catch (e) {}
  }
  function shopNear(p) {
    if (!p || !window.SNWork || !SNWork.all) return null;
    var shops = (SNWork.all().shops || []), best = null, d = 99, i, s, k;
    for (i = 0; i < shops.length; i++) { s = shops[i]; if (!s || !isFinite(s.lat)) continue; k = km(p, s); if (k < 0.08 && k < d) { d = k; best = s; } }
    return best;
  }
  function personNear(p) {
    var list = []; try { list = JSON.parse(read("sn:visible-people", "[]") || "[]"); } catch (e) {}
    var best = null, d = 99, i, s, k;
    for (i = 0; i < list.length; i++) { s = list[i]; if (!s || !isFinite(s.lat)) continue; if (s.peer && s.peer === peer()) continue; k = km(p, s); if (k < 0.12 && k < d) { d = k; best = s; } }
    return best;
  }
  function css() {
    var s = document.getElementById("sn-plus-css"); if (s) s.remove();
    s = document.createElement("style"); s.id = "sn-plus-css";
    s.textContent = "#plus,#go{width:44px!important;height:44px!important;min-width:44px;min-height:44px;font-size:22px!important;line-height:44px}.hub button{width:44px!important;height:44px!important}#sn-plus3{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 78px);transform:translateX(-50%);z-index:140;width:min(320px,92vw);display:none;padding:10px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;pointer-events:auto}#sn-plus3.on{display:block}#sn-plus3 button{display:block;width:100%;text-align:left;margin:0 0 6px;padding:12px;border-radius:12px;border:1px solid rgba(126,233,255,.28);background:rgba(8,20,36,.9);color:#e8fbff;font:800 14px/1.25 system-ui}#sn-plus3 button span{display:block;font:600 11px/1.3 system-ui;color:#8ec8d8;margin-top:3px}#sn-plus3 .x{position:absolute;right:8px;top:6px;width:28px;height:28px;padding:0;text-align:center;border:0;background:transparent;color:#7ee9ff}#sn-jobq{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 78px);transform:translateX(-50%);z-index:141;width:min(340px,94vw);max-height:58vh;overflow:auto;display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobq.on{display:block}#sn-jobq .pay{font:900 26px/1 ui-monospace,system-ui;color:#4df0ff}#sn-jobq p{margin:8px 0;font:600 12px/1.35 system-ui}#sn-jobq label{display:block;margin:6px 0;font:700 12px system-ui}#sn-jobq button.go{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 12px system-ui}#sn-jobq button.no{width:100%;height:36px;margin-top:6px;border-radius:12px;border:1px solid #ff3b4e;background:#000;color:#ff3b4e;font:800 11px system-ui}#sn-vis{position:fixed;right:10px;top:calc(env(safe-area-inset-top) + 58px);z-index:48;height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(126,233,255,.4);background:rgba(4,12,22,.9);color:#8ec8d8;font:800 10px system-ui;letter-spacing:.08em}#sn-vis.on{color:#4df0ff;border-color:#4df0ff}";
    document.head.appendChild(s);
  }
  function visBtn() {
    var b = document.getElementById("sn-vis");
    if (!b) { b = document.createElement("button"); b.id = "sn-vis"; b.type = "button"; document.body.appendChild(b); b.onclick = function () { write("sn:visible", visibleOn() ? "0" : "1"); paintVis(); beatPresence(); }; }
    paintVis();
  }
  function paintVis() {
    var b = document.getElementById("sn-vis"); if (!b) return;
    if (!user()) { b.style.display = "none"; return; }
    b.style.display = "block"; b.className = visibleOn() ? "on" : ""; b.textContent = visibleOn() ? "VISIBLE" : "HIDDEN";
  }
  function hideMenu() { var el = document.getElementById("sn-plus3"); if (el) el.classList.remove("on"); }
  function menuEl() {
    var el = document.getElementById("sn-plus3"); if (el) return el;
    el = document.createElement("div"); el.id = "sn-plus3"; document.body.appendChild(el);
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-act]"); if (!b) return; var act = b.getAttribute("data-act"); hideMenu(); if (act === "x") return; start(act, menuAt || here()); });
    return el;
  }
  function showMenu(p) {
    css(); menuAt = p || here(); var el = menuEl();
    el.innerHTML = '<button type="button" class="x" data-act="x">✕</button><button type="button" data-act="job"><b>Post a job</b><span>Tap from, then tap to on the map.</span></button><button type="button" data-act="post"><b>Post something</b><span>Tap where it lives on the map.</span></button><button type="button" data-act="call"><b>Call somebody</b><span>Tap a visible person on the map.</span></button>';
    el.classList.add("on");
  }
  function start(kind, p) {
    mode = kind; from = null; to = null; quote = null; hideQuote(); p = p || here(); zoomCity(p);
    if (kind === "post") { line("Tap the map where this post lives."); armPick("post"); return; }
    if (kind === "call") { line("Tap a visible person, or a pin."); armPick("call"); beatPresence(); return; }
    line("Tap the start on the map. Then tap the destination."); armPick("job");
  }
  function armPick(kind) {
    pickingKind = kind;
    var bar = document.getElementById("sn-pick");
    if (bar) { bar.classList.add("on"); var msg = bar.querySelector(".msg"); if (msg) msg.textContent = kind === "job" ? (from ? "Tap the destination" : "Tap the start") : kind === "call" ? "Tap who to call" : "Tap where to post"; }
  }
  function disarm() { pickingKind = ""; mode = ""; var bar = document.getElementById("sn-pick"); if (bar) bar.classList.remove("on"); }
  function searchName(q, near, cb) {
    q = String(q || "").trim(); if (!q) { cb(null); return; }
    if (window.SNWork && SNWork.match) { var hits = SNWork.match(q, near); if (hits && hits[0] && isFinite(hits[0].lat)) { cb(hits[0]); return; } }
    var url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(q) + "&limit=6";
    if (near && isFinite(near.lat)) url += "&lat=" + near.lat + "&lon=" + near.lng;
    fetch(url, { headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
      var f = (j.features || [])[0], c = f && f.geometry && f.geometry.coordinates, pr = (f && f.properties) || {};
      if (!c) { cb(null); return; }
      cb({ lat: +c[1], lng: +c[0], name: pr.name || q, raw: [pr.street, pr.city || pr.locality].filter(Boolean).join(", ") });
    }).catch(function () { cb(null); });
  }
  function rainAt(p, cb) {
    if (!p || !isFinite(p.lat)) { cb(false); return; }
    if (weather.t && Date.now() - weather.t < 600000) { cb(weather.rain); return; }
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lng + "&current=precipitation,rain,weather_code", { headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
      var cur = (j && j.current) || {};
      var rain = Number(cur.precipitation || cur.rain || 0) > 0.1 || [51,53,55,61,63,65,80,81,82,95,96,99].indexOf(Number(cur.weather_code)) >= 0;
      weather = { rain: rain, t: Date.now() }; cb(rain);
    }).catch(function () { cb(false); });
  }
  function pick(p) {
    if (!p || !isFinite(p.lat)) return false;
    var shop = shopNear(p); if (shop) p = { lat: +shop.lat, lng: +shop.lng, name: shop.name || nameOf(p), id: shop.id, kind: "shop", email: shop.email || "", peer: shop.peer || "" };
    var who = personNear(p); if (who && pickingKind === "call") p = who;
    if (pickingKind === "post") { disarm(); if (window.SNWork) SNWork.open(p, "post"); line("Post at " + nameOf(p) + "."); return true; }
    if (pickingKind === "call") { disarm(); if (window.SNWork) SNWork.open(p, "call"); line("Call " + nameOf(p) + "."); return true; }
    if (pickingKind !== "job" && mode !== "job") return false;
    if (!from) { from = p; line("Start: " + nameOf(from) + ". Tap the destination."); armPick("job"); return true; }
    to = p; rainAt(from, function (raining) { buildQuote(!!raining); }); return true;
  }
  function deliveryBase(dist) { return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3); }
  function extrasCount(q) { var n = 0; if (q.night) n++; if (q.rain) n++; if (q.vip) n++; if (q.floor) n++; n += Math.max(0, Number(q.extra) || 0); return n; }
  function price(q) {
    if (q.kind === "hourly") { q.hours = Math.max(1, Number(q.hours) || 1); q.base = money(HOUR * q.hours); }
    else { q.base = deliveryBase(q.km); }
    q.surcharge = extrasCount(q) * SUR; q.ride = money(q.base + q.surcharge); q.fee = money(q.ride * FEE); q.pay = money(q.ride + q.fee); return q;
  }
  function buildQuote(raining) {
    if (!from || !to) return;
    var dist = Math.max(0.1, km(from, to));
    quote = { from: from, to: to, km: +dist.toFixed(1), kind: (from.kind === "shop" || from.id) ? "delivery" : "hourly", hours: 1, floor: false, vip: false, extra: 0, night: nightNow(), rain: !!raining };
    price(quote); showQuote();
  }
  function hideQuote() { var el = document.getElementById("sn-jobq"); if (el) el.classList.remove("on"); }
  function showQuote() {
    css(); var q = quote; if (!q) return;
    var el = document.getElementById("sn-jobq");
    if (!el) {
      el = document.createElement("div"); el.id = "sn-jobq"; document.body.appendChild(el);
      el.addEventListener("change", function (e) {
        if (!quote || !e.target) return;
        var id = e.target.id;
        if (id === "sn-job-floor") quote.floor = !!e.target.checked;
        if (id === "sn-job-vip") quote.vip = !!e.target.checked;
        if (id === "sn-job-extra") quote.extra = Math.max(0, Number(e.target.value) || 0);
        if (id === "sn-job-hours") quote.hours = Math.max(1, Number(e.target.value) || 1);
        if (id === "sn-job-kind") quote.kind = e.target.value === "hourly" ? "hourly" : "delivery";
        price(quote); showQuote();
      });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "pay") payThrow();
        if (b.getAttribute("data-act") === "cancel") { hideQuote(); disarm(); from = to = quote = null; line(""); }
      });
    }
    var bits = [];
    if (q.kind === "hourly") bits.push("AV€ 33 × " + (q.hours || 1) + " h");
    else bits.push(q.km + " km · first 3 km AV€ 3 · extra km AV€ 1");
    if (q.night) bits.push("night 21–09 +3"); if (q.rain) bits.push("weather +3"); if (q.vip) bits.push("VIP line +3"); if (q.floor) bits.push("floor +3"); if (q.extra) bits.push("requests +" + (q.extra * 3));
    el.innerHTML = '<div class="pay">AV€ ' + q.pay.toFixed(2) + '</div><p>' + nameOf(q.from) + ' → ' + nameOf(q.to) + '</p><p>' + bits.join(" · ") + ' · 3% AV€ ' + q.fee.toFixed(2) + '</p><p>Poster pays through SpaceNet.</p><label>Job <select id="sn-job-kind"><option value="delivery"' + (q.kind !== "hourly" ? " selected" : "") + '>Delivery</option><option value="hourly"' + (q.kind === "hourly" ? " selected" : "") + '>Other · AV€ 33 / hour</option></select></label>' + (q.kind === "hourly" ? '<label>Hours <input id="sn-job-hours" type="number" min="1" step="1" value="' + (q.hours || 1) + '"></label>' : '') + '<label><input type="checkbox" id="sn-job-floor"' + (q.floor ? " checked" : "") + '> Floor / room · not the street + AV€ 3</label><label><input type="checkbox" id="sn-job-vip"' + (q.vip ? " checked" : "") + '> Ships alone · VIP straight line + AV€ 3</label><label>More special requests <input id="sn-job-extra" type="number" min="0" step="1" value="' + (q.extra || 0) + '"> × AV€ 3</label><button type="button" class="go" data-act="pay">PAY THROUGH SPACENET</button><button type="button" class="no" data-act="cancel">CANCEL</button>';
    el.classList.add("on"); line("AV€ " + q.pay.toFixed(2) + " · poster pays.");
  }
  function payThrow() {
    if (!quote) return;
    if (!user()) { line("Sign in. Payment stays inside SpaceNet."); if (window.SNAuth && SNAuth.google) SNAuth.google(); return; }
    var q = quote, id = "j" + Date.now().toString(36);
    var row = { id: id, kind: "job", what: q.kind === "hourly" ? "Hourly work" : "Delivery", from: { lat: q.from.lat, lng: q.from.lng, name: nameOf(q.from), id: q.from.id || "" }, to: { lat: q.to.lat, lng: q.to.lng, name: nameOf(q.to) }, km: q.km, hours: q.hours || 0, ride: q.ride, fee: q.fee, pay: q.pay, floor: !!q.floor, vip: !!q.vip, night: !!q.night, rain: !!q.rain, extra: q.extra || 0, goods: 0, status: "paid", held: true, payer: email(), peer: peer(), email: email(), shop: q.from.kind === "shop" || q.from.id ? { id: q.from.id, name: nameOf(q.from), lat: q.from.lat, lng: q.from.lng, email: q.from.email || "" } : null, drop: { name: nameOf(q.to), lat: q.to.lat, lng: q.to.lng }, t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", tasks.slice(0, 80)); } catch (e) {}
    try { var escrow = JSON.parse(localStorage.getItem("sn:escrow") || "[]") || []; escrow.unshift({ id: id, kind: "job", avc: q.pay, fee: q.fee, held: true, status: "paid", goods: 0, ride: q.ride, floor: q.floor, km: q.km, shop: row.shop, drop: row.drop, customerPeer: peer(), at: Date.now() }); localStorage.setItem("sn:escrow", JSON.stringify(escrow.slice(0, 80))); } catch (e) {}
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    fetch("/api/pay", { method: "POST", headers: headers(), body: JSON.stringify({ action: "settle", orderId: id, goods: 0, ride: q.ride, fee: q.fee, vendorEmail: "", driverEmail: "notisastranov@gmail.com" }) }).catch(function () {});
    try { var avc = Math.max(0, Number(read("sn:avc", "0")) || 0); write("sn:avc", String(Math.max(0, money(avc - q.pay)))); if (window.SNWallet && SNWallet.paint) SNWallet.paint(); } catch (e) {}
    if (window.SN && SN.ingestJobs) SN.ingestJobs([row]);
    if (window.SN && SN.showCall) SN.showCall(q.from, q.to);
    hideQuote(); disarm(); from = to = quote = null;
    line("Paid through SpaceNet. Thrown to Notis and approved contractors.");
  }
  function beatPresence() {
    var p = here(); if (!user() || !p || !isFinite(p.lat)) return;
    var on = visibleOn();
    var row = { id: "vis-" + (peer() || email().replace(/[^a-z0-9]/g, "")).slice(0, 24), kind: "presence", visible: on, name: (user() && user().name) || email(), photo: (user() && user().photo) || "", lat: p.lat, lng: p.lng, peer: peer(), email: email(), t: Date.now() };
    if (on) fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    fetch("/api/space?lat=" + p.lat + "&lng=" + p.lng, { headers: headers() }).then(function (r) { return r.json(); }).then(function (j) {
      var people = [];
      function add(list) { (list || []).forEach(function (r) { if (!r || !isFinite(r.lat)) return; if (r.visible === false) return; people.push({ lat: +r.lat, lng: +r.lng, name: r.name || r.label || "Someone", peer: r.peer || "", email: r.email || "", kind: r.kind || "presence" }); }); }
      add(j && j.posts); add(j && j.drivers); add(j && j.shops); add(j && j.people);
      write("sn:visible-people", people.slice(0, 80)); paintPeople(people);
    }).catch(function () {});
  }
  function paintPeople(people) {
    var m = getMap(); if (!m || !window.L) return;
    if (visLayer) { try { m.removeLayer(visLayer); } catch (e) {} }
    visLayer = L.layerGroup();
    (people || []).forEach(function (p) {
      if (p.peer && p.peer === peer()) return;
      var mk = L.circleMarker([p.lat, p.lng], { radius: 8, color: "#4df0ff", fillColor: "#4df0ff", fillOpacity: 0.8 });
      mk.on("click", function () { if (pickingKind === "call" || mode === "call") pick(p); });
      visLayer.addLayer(mk);
    });
    visLayer.addTo(m);
  }
  function wrapPublish() {
    if (!window.SNWork || !SNWork.publish || SNWork.publish.__pj) return;
    var pub = SNWork.publish;
    SNWork.publish = function (row) {
      if (row && (row.kind === "shop" || row.kind === "vendor") && !papersOk()) {
        row.approved = false; row.papers = "pending"; row.flag = "vendor-apply";
        fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
        line("Vendor papers go to Notis. Legal business proof first. Then you list.");
        return;
      }
      return pub.apply(this, arguments);
    };
    SNWork.publish.__pj = true;
  }
  function wrapPlus() {
    var plus = document.getElementById("plus"); if (!plus || plus.__pj2) return; plus.__pj2 = true;
    plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); showMenu(here()); }, true);
  }
  function wrapWork() {
    if (!window.SNWork || !SNWork.open) return;
    if (!SNWork.open.__pj2) { var open = SNWork.open; SNWork.open = function (place, which) { if (!which || which === "home" || which === "list") { showMenu(place || here()); return; } return open.apply(this, arguments); }; SNWork.open.__pj2 = true; }
    if (SNWork.takePoint && !SNWork.takePoint.__pj2) { var tp = SNWork.takePoint; SNWork.takePoint = function (p) { if (pickingKind) return pick(p); return tp.apply(this, arguments); }; SNWork.takePoint.__pj2 = true; }
  }
  function wrapInput() {
    var inp = document.getElementById("in"); if (!inp || inp.__pj2) return; inp.__pj2 = true;
    inp.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !pickingKind) return;
      var q = String(inp.value || "").trim(); if (!q) return;
      e.preventDefault(); e.stopPropagation(); line("Looking for " + q + "…");
      searchName(q, from || here(), function (hit) { if (!hit) { line("Tap the map."); return; } pick(hit); });
    }, true);
  }
  function wrapPlaceMenu() {
    var el = document.getElementById("sn-place"); if (!el || el.__pj2) return; el.__pj2 = true;
    var obs = new MutationObserver(function () {
      if (!el.classList.contains("on")) return;
      if (/Post a job/.test(el.textContent || "")) return;
      var p = menuAt || here(); el.innerHTML = "";
      var ttl = document.createElement("div"); ttl.className = "ttl"; ttl.textContent = (p && p.name) || "This place"; el.appendChild(ttl);
      [["Post a job", "job"], ["Post something", "post"], ["Call somebody", "call"]].forEach(function (pair) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = pair[0];
        b.onclick = function (ev) { ev.preventDefault(); el.classList.remove("on"); start(pair[1], p); };
        el.appendChild(b);
      });
    });
    obs.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  function boot() { css(); visBtn(); wrapPlus(); wrapWork(); wrapInput(); wrapPlaceMenu(); wrapPublish(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  setInterval(beatPresence, 20000);
  setTimeout(beatPresence, 1500);
  window.SNPlusJob = { start: start, pick: pick, showMenu: showMenu };
})();
