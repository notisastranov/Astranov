/* SpaceNet 4145 — + and map: POST · JOB · CALL. Two taps throw a paid ride. */
(function () {
  if (window.__snPlusJob) return;
  window.__snPlusJob = true;
  var FEE = 0.03, SUR = 3, mode = "", from = null, to = null, quote = null, pickingKind = "", menuAt = null;
  var weather = { rain: false, t: 0 };
  function talk(s) { if (window.SN && SN.talk) SN.talk(s); else if (window.SN && SN.say) SN.say(s); }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
  function peer() { try { var id = localStorage.getItem("sn:peer"); if (id && /^[a-z0-9]+$/i.test(id)) return id; } catch (e) {} return ""; }
  function headers() { var h = { "Content-Type": "application/json", Accept: "application/json" }; var t = token(); if (t.length > 20) h.Authorization = "Bearer " + t; return h; }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function nightNow() { var h = new Date().getHours(); return h >= 22 || h < 6; }
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
  function shopNear(p) {
    if (!p || !window.SNWork || !SNWork.all) return null;
    var shops = (SNWork.all().shops || []), best = null, d = 99, i, s, k;
    for (i = 0; i < shops.length; i++) { s = shops[i]; if (!s || !isFinite(s.lat)) continue; k = km(p, s); if (k < 0.08 && k < d) { d = k; best = s; } }
    return best;
  }
  function css() {
    if (document.getElementById("sn-plus-css")) return;
    var s = document.createElement("style"); s.id = "sn-plus-css";
    s.textContent = "#sn-plus3{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 72px);transform:translateX(-50%);z-index:140;width:min(320px,92vw);display:none;padding:10px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff;pointer-events:auto}#sn-plus3.on{display:block}#sn-plus3 b.ttl{display:block;font:800 11px/1.2 system-ui;letter-spacing:.14em;color:#7ee9ff;margin:0 0 8px}#sn-plus3 button{display:block;width:100%;text-align:left;margin:0 0 6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(126,233,255,.28);background:rgba(8,20,36,.9);color:#e8fbff;font:800 13px/1.25 system-ui}#sn-plus3 button span{display:block;font:600 11px/1.3 system-ui;color:#8ec8d8;margin-top:3px}#sn-plus3 .x{position:absolute;right:8px;top:6px;width:28px;height:28px;padding:0;text-align:center;border:0;background:transparent;color:#7ee9ff}#sn-jobq{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 72px);transform:translateX(-50%);z-index:141;width:min(340px,94vw);display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobq.on{display:block}#sn-jobq .pay{font:900 26px/1 ui-monospace,system-ui;color:#4df0ff}#sn-jobq p{margin:8px 0;font:600 12px/1.35 system-ui}#sn-jobq label{display:block;margin:6px 0;font:700 12px system-ui}#sn-jobq button.go{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 12px system-ui;letter-spacing:.08em}#sn-jobq button.no{width:100%;height:36px;margin-top:6px;border-radius:12px;border:1px solid #ff3b4e;background:#000;color:#ff3b4e;font:800 11px system-ui}";
    document.head.appendChild(s);
  }
  function menuEl() {
    var el = document.getElementById("sn-plus3");
    if (el) return el;
    el = document.createElement("div"); el.id = "sn-plus3"; document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act"); hideMenu(); if (act === "x") return; start(act, menuAt || here());
    });
    return el;
  }
  function hideMenu() { var el = document.getElementById("sn-plus3"); if (el) el.classList.remove("on"); }
  function showMenu(p) {
    css(); menuAt = p || here();
    var el = menuEl();
    el.innerHTML = '<button type="button" class="x" data-act="x">✕</button><b class="ttl">THREE MOVES</b><button type="button" data-act="post"><b>POST</b><span>Social or postal. Where to put it?</span></button><button type="button" data-act="job"><b>JOB</b><span>Delivery, errand. From → to.</span></button><button type="button" data-act="call"><b>CALL</b><span>Who. Name, shop, street.</span></button>';
    el.classList.add("on"); talk("Post, job, or call.");
  }
  function start(kind, p) {
    mode = kind; from = null; to = null; quote = null; hideQuote(); p = p || here();
    if (kind === "post") { talk("Where to post? Tap the map or type a street."); armPick("post"); if (p && isFinite(p.lat)) pick(p); return; }
    if (kind === "call") { talk("Who to call? Type a name or tap them on the map."); armPick("call"); return; }
    talk("Tap the shop first. Then tap the customer."); armPick("job"); if (p && isFinite(p.lat) && shopNear(p)) pick(p);
  }
  function armPick(kind) {
    pickingKind = kind;
    var bar = document.getElementById("sn-pick");
    if (bar) { bar.classList.add("on"); var msg = bar.querySelector(".msg"); if (msg) msg.textContent = kind === "job" ? (from ? "Tap where it goes" : "Tap the shop, or type the street") : kind === "call" ? "Type who, or tap them" : "Tap where this post lives"; }
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
      cb({ lat: +c[1], lng: +c[0], name: pr.name || q, raw: [pr.street, pr.city || pr.locality].filter(Boolean).join(", "), kind: pr.osm_value || "" });
    }).catch(function () { cb(null); });
  }
  function rainAt(p, cb) {
    if (!p || !isFinite(p.lat)) { cb(false); return; }
    if (weather.t && Date.now() - weather.t < 600000) { cb(weather.rain); return; }
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lng + "&current=precipitation,rain,weather_code", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); }).then(function (j) {
        var cur = (j && j.current) || {};
        var rain = Number(cur.precipitation || cur.rain || 0) > 0.1 || [51,53,55,61,63,65,80,81,82,95,96,99].indexOf(Number(cur.weather_code)) >= 0;
        weather = { rain: rain, t: Date.now() }; cb(rain);
      }).catch(function () { cb(false); });
  }
  function pick(p) {
    if (!p || !isFinite(p.lat)) return false;
    var shop = shopNear(p);
    if (shop) p = { lat: +shop.lat, lng: +shop.lng, name: shop.name || nameOf(p), id: shop.id, kind: "shop", email: shop.email || "", peer: shop.peer || "", tags: shop };
    if (pickingKind === "post") { disarm(); if (window.SNWork) SNWork.open(p, "post"); else talk("Post at " + nameOf(p) + "."); return true; }
    if (pickingKind === "call") { disarm(); if (window.SNWork) SNWork.open(p, "call"); talk("Call " + nameOf(p) + ". Type another name if this is the wrong end."); return true; }
    if (pickingKind !== "job" && mode !== "job") return false;
    if (!from) { from = p; talk("From " + nameOf(from) + ". Now tap the customer, or type the street."); armPick("job"); return true; }
    to = p; rainAt(from, function (raining) { buildQuote(!!raining); }); return true;
  }
  function price(q) { q.surcharge = (q.floor ? SUR : 0) + (q.night ? SUR : 0) + (q.rain ? SUR : 0); q.ride = money(q.base + q.surcharge); q.fee = money(q.ride * FEE); q.pay = money(q.ride + q.fee); return q; }
  function buildQuote(raining) {
    if (!from || !to) return;
    var dist = Math.max(0.3, km(from, to));
    quote = { from: from, to: to, km: +dist.toFixed(1), base: Math.max(1, Math.round(dist)), floor: false, night: nightNow(), rain: !!raining };
    price(quote); showQuote();
  }
  function hideQuote() { var el = document.getElementById("sn-jobq"); if (el) el.classList.remove("on"); }
  function showQuote() {
    css(); var q = quote; if (!q) return;
    var el = document.getElementById("sn-jobq");
    if (!el) {
      el = document.createElement("div"); el.id = "sn-jobq"; document.body.appendChild(el);
      el.addEventListener("change", function (e) { if (!quote) return; if (e.target && e.target.id === "sn-job-floor") { quote.floor = !!e.target.checked; price(quote); showQuote(); } });
      el.addEventListener("click", function (e) { var b = e.target.closest("[data-act]"); if (!b) return; if (b.getAttribute("data-act") === "pay") payThrow(); if (b.getAttribute("data-act") === "cancel") { hideQuote(); disarm(); from = to = quote = null; talk("Job cancelled."); } });
    }
    var bits = [q.km + " km · base AV€ " + q.base];
    if (q.night) bits.push("night +3"); if (q.rain) bits.push("rain +3"); if (q.floor) bits.push("floor +3");
    el.innerHTML = '<div class="pay">AV€ ' + q.pay.toFixed(2) + '</div><p>' + nameOf(q.from) + ' → ' + nameOf(q.to) + '</p><p>' + bits.join(" · ") + ' · SpaceNet 3% AV€ ' + q.fee.toFixed(2) + '</p><label><input type="checkbox" id="sn-job-floor"' + (q.floor ? " checked" : "") + '> Floor / room service + AV€ 3</label><button type="button" class="go" data-act="pay">PAY RIDE THROUGH SPACENET</button><button type="button" class="no" data-act="cancel">CANCEL</button>';
    el.classList.add("on");
    talk(nameOf(q.from) + " to " + nameOf(q.to) + ". " + q.km + " km. Pay AV€ " + q.pay.toFixed(2) + " through SpaceNet." + (q.night ? " Night +3." : "") + (q.rain ? " Rain +3." : ""));
  }
  function payThrow() {
    if (!quote) return;
    if (!user()) { talk("Sign in so the ride is paid through SpaceNet. We keep the 3%."); if (window.SNAuth && SNAuth.google) SNAuth.google(); return; }
    var q = quote, id = "j" + Date.now().toString(36);
    var row = { id: id, kind: "job", what: "Delivery", from: { lat: q.from.lat, lng: q.from.lng, name: nameOf(q.from), id: q.from.id || "" }, to: { lat: q.to.lat, lng: q.to.lng, name: nameOf(q.to) }, km: q.km, ride: q.ride, fee: q.fee, pay: q.pay, floor: !!q.floor, night: !!q.night, rain: !!q.rain, goods: 0, status: "paid", held: true, peer: peer(), email: email(), shop: q.from.kind === "shop" || q.from.id ? { id: q.from.id, name: nameOf(q.from), lat: q.from.lat, lng: q.from.lng, email: q.from.email || "", peer: q.from.peer || "" } : null, drop: { name: nameOf(q.to), lat: q.to.lat, lng: q.to.lng }, t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", tasks.slice(0, 80)); } catch (e) {}
    try { var escrow = JSON.parse(localStorage.getItem("sn:escrow") || "[]") || []; escrow.unshift({ id: id, kind: "job", avc: q.pay, fee: q.fee, held: true, status: "paid", goods: 0, ride: q.ride, floor: q.floor, km: q.km, shop: row.shop, drop: row.drop, customerPeer: peer(), at: Date.now() }); localStorage.setItem("sn:escrow", JSON.stringify(escrow.slice(0, 80))); } catch (e) {}
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    fetch("/api/pay", { method: "POST", headers: headers(), body: JSON.stringify({ action: "settle", orderId: id, goods: 0, ride: q.ride, fee: q.fee, vendorEmail: "", driverEmail: "notisastranov@gmail.com" }) }).catch(function () {});
    try { var avc = Math.max(0, Number(read("sn:avc", "0")) || 0); write("sn:avc", String(Math.max(0, money(avc - q.pay)))); if (window.SNWallet && SNWallet.paint) SNWallet.paint(); } catch (e) {}
    if (window.SN && SN.ingestJobs) SN.ingestJobs([row]);
    if (window.SN && SN.showCall) SN.showCall(q.from, q.to); else if (window.SN && SN.showMap) SN.showMap(q.to, 15);
    hideQuote(); disarm(); from = to = quote = null;
    talk("Task thrown. Ride paid through SpaceNet. Notis and approved agents see it. 3% stays in the pool.");
  }
  function wrapPlus() {
    var plus = document.getElementById("plus"); if (!plus || plus.__pj) return; plus.__pj = true;
    plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); showMenu(here()); }, true);
  }
  function wrapWork() {
    if (!window.SNWork || SNWork.open.__pj) return;
    var open = SNWork.open;
    SNWork.open = function (place, which) { if (!which || which === "home" || which === "list") { showMenu(place || here()); return; } return open.apply(this, arguments); };
    SNWork.open.__pj = true;
    if (SNWork.takePoint && !SNWork.takePoint.__pj) { var tp = SNWork.takePoint; SNWork.takePoint = function (p) { if (pickingKind) return pick(p); return tp.apply(this, arguments); }; SNWork.takePoint.__pj = true; }
  }
  function wrapInput() {
    var inp = document.getElementById("in"); if (!inp || inp.__pj) return; inp.__pj = true;
    inp.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !pickingKind) return;
      var q = String(inp.value || "").trim(); if (!q) return;
      e.preventDefault(); e.stopPropagation(); talk("Finding " + q + "…");
      searchName(q, from || here(), function (hit) { if (!hit) { talk("No named place for that. Tap the map."); return; } pick(hit); });
    }, true);
  }
  function wrapPlaceMenu() {
    var el = document.getElementById("sn-place"); if (!el || el.__pj) return; el.__pj = true;
    var obs = new MutationObserver(function () {
      if (!el.classList.contains("on")) return;
      var btns = el.querySelectorAll("button"); if (!btns.length) return;
      var txt = el.textContent || ""; if (/JOB|THREE MOVES/.test(txt) && btns.length <= 5) return;
      var p = menuAt || here(); el.innerHTML = "";
      var ttl = document.createElement("div"); ttl.className = "ttl"; ttl.textContent = (p && p.name) || "This place"; el.appendChild(ttl);
      [["POST", "post"], ["JOB", "job"], ["CALL", "call"]].forEach(function (pair) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = pair[0];
        b.onclick = function (ev) { ev.preventDefault(); el.classList.remove("on"); start(pair[1], p); };
        el.appendChild(b);
      });
    });
    obs.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  function boot() { css(); wrapPlus(); wrapWork(); wrapInput(); wrapPlaceMenu(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  window.SNPlusJob = { start: start, pick: pick, showMenu: showMenu };
})();
