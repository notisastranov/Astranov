/* SpaceNet 4148 — vendor shop ON with no papers. + / shop pin / client tap throws the job to Notis. */
(function () {
  if (window.__snVendorJob) return;
  window.__snVendorJob = true;
  var FEE = 0.03, SUR = 3, from = null, to = null, quote = null, armed = "";
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
  function km(a, b) {
    if (window.SN && SN.km) return SN.km(a, b);
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function nameOf(p) { return String((p && (p.name || p.label)) || "This place"); }
  function here() {
    try { var p = JSON.parse(read("sn:place", "null") || "null"); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    return null;
  }
  function shops() {
    try { if (window.SNWork && SNWork.all) return SNWork.all().shops || []; } catch (e) {}
    try { return JSON.parse(read("sn:shops", "[]") || "[]"); } catch (e) { return []; }
  }
  function shopNear(p) {
    if (!p) return null;
    var list = shops(), best = null, d = 99, i, s, k;
    for (i = 0; i < list.length; i++) {
      s = list[i]; if (!s || !isFinite(s.lat)) continue;
      k = km(p, s); if (k < 0.12 && k < d) { d = k; best = s; }
    }
    return best;
  }
  function myShop() {
    var e = email(), p = peer(), list = shops(), i, s;
    for (i = 0; i < list.length; i++) {
      s = list[i]; if (!s) continue;
      if (s.email && String(s.email).toLowerCase() === e) return s;
      if (p && s.peer && s.peer === p) return s;
    }
    return list[0] || null;
  }
  function freeShop(row) {
    if (!row) return row;
    row.approved = true; row.papers = "none"; row.flag = "shop-ok"; row.presence = "present";
    return row;
  }
  function wrapPublish() {
    if (!window.SNWork || !SNWork.publish || SNWork.publish.__vj) return;
    var pub = SNWork.publish;
    SNWork.publish = function (row) {
      if (row && (row.kind === "shop" || row.kind === "vendor")) {
        row = freeShop(row);
        row.email = row.email || email();
        row.peer = row.peer || peer();
        line("Shop ON. No contract. Tap the client, or + then the drop.");
      }
      return pub.call(this, row);
    };
    SNWork.publish.__vj = true;
  }
  function wrapSave() {
    if (!window.SNWork || !SNWork.saveShop || SNWork.saveShop.__vj) return;
    var sav = SNWork.saveShop;
    SNWork.saveShop = function (fd) {
      write("sn:vendor-ok", "1");
      var r = sav.apply(this, arguments);
      line("Shop ON. No papers. + or tap the client to throw the job.");
      return r;
    };
    SNWork.saveShop.__vj = true;
  }
  function wrapOpen() {
    if (!window.SNWork || !SNWork.open || SNWork.open.__vj) return;
    var open = SNWork.open;
    SNWork.open = function (place, which) {
      var shop = place && (place.kind === "shop" || place.id) ? place : shopNear(place);
      if (shop && (!which || which === "shop" || which === "home")) {
        from = { lat: +shop.lat, lng: +shop.lng, name: shop.name || nameOf(place), id: shop.id, kind: "shop", email: shop.email || "", peer: shop.peer || "" };
        armed = "to";
        line("From " + nameOf(from) + ". Tap the client.");
      }
      return open.apply(this, arguments);
    };
    SNWork.open.__vj = true;
  }
  function deliveryBase(dist) { return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3); }
  function extras(q) {
    var n = 0; if (q.night) n++; if (q.rain) n++; if (q.vip) n++; if (q.floor) n++;
    n += Math.max(0, Number(q.extra) || 0); return n;
  }
  function price(q) {
    q.base = deliveryBase(q.km); q.surcharge = extras(q) * SUR; q.ride = money(q.base + q.surcharge);
    q.fee = money(q.ride * FEE); q.pay = money(q.ride + q.fee); return q;
  }
  var weather = { rain: false, t: 0 };
  function rainAt(p, cb) {
    if (!p || (weather.t && Date.now() - weather.t < 600000)) { cb(!!weather.rain); return; }
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lng + "&current=precipitation,rain,weather_code")
      .then(function (r) { return r.json(); }).then(function (j) {
        var cur = (j && j.current) || {};
        weather = { rain: Number(cur.precipitation || cur.rain || 0) > 0.1, t: Date.now() }; cb(weather.rain);
      }).catch(function () { cb(false); });
  }
  function take(p) {
    if (!p || !isFinite(p.lat)) return false;
    var shop = shopNear(p);
    if (!from || armed === "from") {
      from = shop ? { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop", email: shop.email || "", peer: shop.peer || "" } : { lat: +p.lat, lng: +p.lng, name: nameOf(p) };
      armed = "to"; line("From " + nameOf(from) + ". Tap the client."); return true;
    }
    to = { lat: +p.lat, lng: +p.lng, name: nameOf(p) }; armed = "";
    rainAt(from, function (r) { buildQuote(r); }); return true;
  }
  function buildQuote(raining) {
    if (!from || !to) return;
    quote = { from: from, to: to, km: +Math.max(0.1, km(from, to)).toFixed(1), floor: false, vip: false, extra: 0, night: nightNow(), rain: !!raining };
    price(quote); showQuote();
  }
  function css() {
    if (document.getElementById("sn-vj-css")) return;
    var s = document.createElement("style"); s.id = "sn-vj-css";
    s.textContent = "#sn-jobq{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 78px);transform:translateX(-50%);z-index:141;width:min(340px,94vw);display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobq.on{display:block}#sn-jobq .pay{font:900 26px/1 ui-monospace;color:#4df0ff}#sn-jobq p{margin:8px 0;font:600 12px system-ui}#sn-jobq label{display:block;margin:6px 0;font:700 12px system-ui}#sn-jobq .go{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 12px system-ui}#sn-jobq .no{width:100%;height:36px;margin-top:6px;border-radius:12px;border:1px solid #ff3b4e;background:#000;color:#ff3b4e}";
    document.head.appendChild(s);
  }
  function showQuote() {
    css(); var q = quote; if (!q) return;
    var el = document.getElementById("sn-jobq");
    if (!el) {
      el = document.createElement("div"); el.id = "sn-jobq"; document.body.appendChild(el);
      el.addEventListener("change", function (e) {
        if (!quote || !e.target) return;
        if (e.target.id === "sn-job-floor") quote.floor = !!e.target.checked;
        if (e.target.id === "sn-job-vip") quote.vip = !!e.target.checked;
        if (e.target.id === "sn-job-extra") quote.extra = Math.max(0, Number(e.target.value) || 0);
        price(quote); showQuote();
      });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "pay") throwJob();
        if (b.getAttribute("data-act") === "cancel") { el.classList.remove("on"); from = to = quote = null; armed = ""; line(""); }
      });
    }
    var bits = [q.km + " km · first 3 km AV€ 3 · extra km AV€ 1"];
    if (q.night) bits.push("night +3"); if (q.rain) bits.push("weather +3"); if (q.vip) bits.push("VIP +3"); if (q.floor) bits.push("floor +3"); if (q.extra) bits.push("requests +" + (q.extra * 3));
    el.innerHTML = '<div class="pay">AV€ ' + q.pay.toFixed(2) + "</div><p>" + nameOf(q.from) + " → " + nameOf(q.to) + "</p><p>" + bits.join(" · ") + " · 3% AV€ " + q.fee.toFixed(2) + "</p><p>Vendor pays through SpaceNet. Job goes to Notis.</p><label><input type=\"checkbox\" id=\"sn-job-floor\"" + (q.floor ? " checked" : "") + "> Floor / room + AV€ 3</label><label><input type=\"checkbox\" id=\"sn-job-vip\"" + (q.vip ? " checked" : "") + "> Ships alone / VIP line + AV€ 3</label><label>More requests <input id=\"sn-job-extra\" type=\"number\" min=\"0\" value=\"" + (q.extra || 0) + "\"> × AV€ 3</label><button type=\"button\" class=\"go\" data-act=\"pay\">THROW JOB TO NOTIS</button><button type=\"button\" class=\"no\" data-act=\"cancel\">CANCEL</button>";
    el.classList.add("on");
    line("AV€ " + q.pay.toFixed(2) + " · thrown to Notis after pay.");
  }
  function plusBlast(e) {
    var mine = myShop() || shopNear(here());
    if (mine && !from) {
      from = { lat: +mine.lat, lng: +mine.lng, name: mine.name, id: mine.id, kind: "shop", email: mine.email || "", peer: mine.peer || "" };
      armed = "to"; line("From " + nameOf(from) + ". Tap the client on the map.");
      if (e) { e.preventDefault(); e.stopPropagation(); }
    } else if (from && !to) {
      line("Tap the client on the map.");
      if (e) { e.preventDefault(); e.stopPropagation(); }
    }
  }
  function wrapPlus() {
    var plus = document.getElementById("plus"); if (!plus || plus.__vj) return; plus.__vj = true;
    plus.addEventListener("click", plusBlast, true);
  }
  function wrapMap() {
    if (window.SNPlusJob && SNPlusJob.pick && !SNPlusJob.pick.__vj) {
      var pk = SNPlusJob.pick;
      SNPlusJob.pick = function (p) {
        if (armed || (from && !to)) return take(p);
        var shop = shopNear(p);
        if (shop) { from = { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop" }; armed = "to"; line("From " + shop.name + ". Tap the client."); return true; }
        return pk.apply(this, arguments);
      };
      SNPlusJob.pick.__vj = true;
    }
    if (window.SNWork && SNWork.takePoint && !SNWork.takePoint.__vj2) {
      var tp = SNWork.takePoint;
      SNWork.takePoint = function (p) { if (armed || (from && !to)) return take(p); return tp.apply(this, arguments); };
      SNWork.takePoint.__vj2 = true;
    }
  }
  function throwJob() {
    if (!quote) return;
    if (!user()) { line("Sign in. Pay through SpaceNet."); if (window.SNAuth && SNAuth.google) SNAuth.google(); return; }
    var q = quote, id = "j" + Date.now().toString(36);
    var row = { id: id, kind: "job", what: "Delivery", from: { lat: q.from.lat, lng: q.from.lng, name: nameOf(q.from), id: q.from.id || "" }, to: { lat: q.to.lat, lng: q.to.lng, name: nameOf(q.to) }, km: q.km, ride: q.ride, fee: q.fee, pay: q.pay, floor: !!q.floor, vip: !!q.vip, night: !!q.night, rain: !!q.rain, extra: q.extra || 0, goods: 0, status: "paid", held: true, payer: email(), peer: peer(), email: email(), toOwner: "notisastranov@gmail.com", shop: q.from.id ? { id: q.from.id, name: nameOf(q.from), lat: q.from.lat, lng: q.from.lng, email: q.from.email || "" } : null, drop: { name: nameOf(q.to), lat: q.to.lat, lng: q.to.lng }, t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", tasks.slice(0, 80)); } catch (e) {}
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    fetch("/api/pay", { method: "POST", headers: headers(), body: JSON.stringify({ action: "settle", orderId: id, goods: 0, ride: q.ride, fee: q.fee, vendorEmail: email(), driverEmail: "notisastranov@gmail.com" }) }).catch(function () {});
    try { var avc = Math.max(0, Number(read("sn:avc", "0")) || 0); write("sn:avc", String(Math.max(0, money(avc - q.pay)))); if (window.SNWallet && SNWallet.paint) SNWallet.paint(); } catch (e) {}
    if (window.SN && SN.ingestJobs) SN.ingestJobs([row]);
    var el = document.getElementById("sn-jobq"); if (el) el.classList.remove("on");
    from = to = quote = null; armed = "";
    line("Job on Notis. AV€ " + q.pay.toFixed(2) + " through SpaceNet.");
  }
  function boot() { wrapPublish(); wrapSave(); wrapOpen(); wrapPlus(); wrapMap(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  window.SNVendorJob = { take: take, throwJob: throwJob };
})();
