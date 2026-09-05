/* SpaceNet 4149 — shop then client. Phone + address. 13.3 cap. Notis accept/decline. */
(function () {
  window.__snVendorJob = true;
  var FEE = 0.03, SUR = 3, MAX = 13.3, HEAVY = 13;
  var from = null, to = null, quote = null, armed = "";
  function line(s) { var el = document.getElementById("line"); if (el) el.textContent = s || ""; }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
  function peer() { try { var id = localStorage.getItem("sn:peer"); if (id && /^[a-z0-9]+$/i.test(id)) return id; } catch (e) {} return ""; }
  function owner() { return email() === "notisastranov@gmail.com" || read("sn:admin") === "1"; }
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
  function nameOf(p) { return String((p && (p.name || p.label || p.address)) || "This place"); }
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
  function wrapPublish() {
    if (!window.SNWork || !SNWork.publish || SNWork.publish.__vj) return;
    var pub = SNWork.publish;
    SNWork.publish = function (row) {
      if (row && (row.kind === "shop" || row.kind === "vendor")) {
        row.approved = true; row.papers = "none"; row.flag = "shop-ok"; row.email = row.email || email(); row.peer = row.peer || peer();
      }
      return pub.call(this, row);
    };
    SNWork.publish.__vj = true;
  }
  function deliveryBase(dist) { return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3); }
  function extras(q) {
    var n = 0; if (q.night) n++; if (q.rain) n++; if (q.vip) n++; if (q.floor) n++; if (q.heavy) n++; return n;
  }
  function price(q) {
    q.base = deliveryBase(q.km); q.surcharge = extras(q) * SUR; q.ride = money(q.base + q.surcharge);
    q.fee = money(q.ride * FEE); q.pay = money(q.ride + q.fee); return q;
  }
  function rainAt(p, cb) { cb(false); }
  function reverse(p, cb) {
    if (!p) { cb(""); return; }
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng).then(function (r) { return r.json(); }).then(function (j) {
      var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
      cb([pr.name, pr.street, pr.housenumber, pr.city || pr.locality].filter(Boolean).join(" "));
    }).catch(function () { cb(nameOf(p)); });
  }
  function take(p) {
    if (!p || !isFinite(p.lat)) return false;
    var shop = shopNear(p);
    if (!from || armed === "from") {
      from = shop ? { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop", email: shop.email || "" } : { lat: +p.lat, lng: +p.lng, name: nameOf(p) };
      armed = "to"; line("From " + nameOf(from) + ". Tap the client."); return true;
    }
    to = { lat: +p.lat, lng: +p.lng, name: nameOf(p) }; armed = "";
    reverse(to, function (addr) { to.address = addr || nameOf(to); to.name = to.address; rainAt(from, function () { buildQuote(false); }); });
    return true;
  }
  function buildQuote() {
    if (!from || !to) return;
    quote = { from: from, to: to, km: +Math.max(0.1, km(from, to)).toFixed(1), phone: "", address: to.address || nameOf(to), floor: false, vip: false, heavy: false, mass: 0, night: nightNow(), rain: false };
    price(quote); showQuote();
  }
  function css() {
    if (document.getElementById("sn-vj-css")) return;
    var s = document.createElement("style"); s.id = "sn-vj-css";
    s.textContent = "#sn-jobq,#sn-jobboard{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom)+78px);transform:translateX(-50%);z-index:141;width:min(340px,94vw);max-height:62vh;overflow:auto;display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobq.on,#sn-jobboard.on{display:block}#sn-jobq .pay{font:900 26px/1 ui-monospace;color:#4df0ff}#sn-jobq p,#sn-jobboard p{margin:8px 0;font:600 12px system-ui}#sn-jobq label{display:block;margin:6px 0;font:700 12px system-ui}#sn-jobq input[type=text],#sn-jobq input[type=tel],#sn-jobq input[type=number]{width:100%;height:36px;border-radius:8px;border:1px solid rgba(126,233,255,.35);background:#041018;color:#e8fbff}#sn-jobq .go,.yes{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 12px system-ui}#sn-jobq .no,.no{width:100%;height:36px;margin-top:6px;border-radius:12px;border:1px solid #ff3b4e;background:#000;color:#ff3b4e}";
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
        if (e.target.id === "sn-job-night") quote.night = !!e.target.checked;
        if (e.target.id === "sn-job-phone") quote.phone = String(e.target.value || "").trim();
        if (e.target.id === "sn-job-addr") quote.address = String(e.target.value || "").trim();
        if (e.target.id === "sn-job-mass") { quote.mass = Number(e.target.value) || 0; quote.heavy = quote.mass > HEAVY && quote.mass <= MAX; }
        price(quote); showQuote();
      });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "pay") throwJob();
        if (b.getAttribute("data-act") === "cancel") { el.classList.remove("on"); from = to = quote = null; armed = ""; }
      });
    }
    if (q.mass > MAX) {
      el.innerHTML = "<p>Over 13.3 kilos or litres. Not accepted.</p><button type=\"button\" class=\"no\" data-act=\"cancel\">CLOSE</button>";
      el.classList.add("on"); return;
    }
    var bits = [q.km + " km · first 3 km AV€ 3 · extra km AV€ 1"];
    if (q.night) bits.push("night 21-09 +3"); if (q.vip) bits.push("VIP +3"); if (q.floor) bits.push("floor +3"); if (q.heavy) bits.push("over 13 +3");
    el.innerHTML = '<div class="pay">AV€ ' + q.pay.toFixed(2) + "</div><p>" + nameOf(q.from) + " → client</p><p>" + bits.join(" · ") + " · 3% AV€ " + q.fee.toFixed(2) + "</p>" +
      '<label>Client address<input id="sn-job-addr" type="text" value="' + String(q.address || "").replace(/"/g, "") + '"></label>' +
      '<label>Client telephone<input id="sn-job-phone" type="tel" value="' + String(q.phone || "") + '"></label>' +
      '<label>Kg or litres<input id="sn-job-mass" type="number" min="0" max="13.3" step="0.1" value="' + (q.mass || 0) + '"> max 13.3</label>' +
      '<label><input type="checkbox" id="sn-job-vip"' + (q.vip ? " checked" : "") + '> VIP fast straight + AV€ 3</label>' +
      '<label><input type="checkbox" id="sn-job-floor"' + (q.floor ? " checked" : "") + '> Floor / room + AV€ 3</label>' +
      '<label><input type="checkbox" id="sn-job-night"' + (q.night ? " checked" : "") + '> Night 21:00-09:00 + AV€ 3</label>' +
      '<button type="button" class="go" data-act="pay">THROW TO NOTIS</button><button type="button" class="no" data-act="cancel">CANCEL</button>';
    el.classList.add("on");
  }
  function throwJob() {
    if (!quote) return;
    quote.phone = String((document.getElementById("sn-job-phone") || {}).value || quote.phone || "").trim();
    quote.address = String((document.getElementById("sn-job-addr") || {}).value || quote.address || "").trim();
    quote.mass = Number((document.getElementById("sn-job-mass") || {}).value || quote.mass || 0);
    if (quote.mass > MAX) { line("Over 13.3 kg / L. Not accepted."); showQuote(); return; }
    quote.heavy = quote.mass > HEAVY; price(quote);
    if (!quote.address) { line("Verify the client address."); return; }
    if (!quote.phone || quote.phone.replace(/\D/g, "").length < 8) { line("Client telephone is required."); return; }
    if (!user()) { line("Sign in."); return; }
    var q = quote, id = "j" + Date.now().toString(36);
    var row = { id: id, kind: "job", what: "Delivery", status: "offered", from: { lat: q.from.lat, lng: q.from.lng, name: nameOf(q.from), id: q.from.id || "" }, to: { lat: q.to.lat, lng: q.to.lng, name: q.address, address: q.address }, phone: q.phone, address: q.address, km: q.km, ride: q.ride, fee: q.fee, pay: q.pay, floor: !!q.floor, vip: !!q.vip, night: !!q.night, heavy: !!q.heavy, mass: q.mass, goods: 0, payer: email(), peer: peer(), email: email(), toOwner: "notisastranov@gmail.com", shop: q.from.id ? { id: q.from.id, name: nameOf(q.from), lat: q.from.lat, lng: q.from.lng } : null, drop: { name: q.address, lat: q.to.lat, lng: q.to.lng, phone: q.phone }, t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", tasks.slice(0, 80)); } catch (e) {}
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    if (window.SN && SN.ingestJobs) SN.ingestJobs([row]);
    var el = document.getElementById("sn-jobq"); if (el) el.classList.remove("on");
    from = to = quote = null; armed = "";
    line("Job offered to Notis. AV€ " + q.pay.toFixed(2) + ".");
    paintBoard();
  }
  function tasks() { try { return JSON.parse(read("sn:tasks", "[]") || "[]"); } catch (e) { return []; } }
  function decide(id, yes) {
    var list = tasks(), i, row;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === id) row = list[i];
    if (!row) return;
    row.status = yes ? "accepted" : "declined";
    write("sn:tasks", list.slice(0, 80));
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    if (yes) fetch("/api/pay", { method: "POST", headers: headers(), body: JSON.stringify({ action: "settle", orderId: id, goods: 0, ride: row.ride, fee: row.fee, vendorEmail: row.email || "", driverEmail: "notisastranov@gmail.com" }) }).catch(function () {});
    line(yes ? ("Accepted · " + (row.phone || "")) : "Declined.");
    paintBoard();
  }
  function paintBoard() {
    if (!owner()) return;
    css();
    var list = tasks().filter(function (t) { return t && t.kind === "job" && t.status === "offered"; });
    var el = document.getElementById("sn-jobboard");
    if (!el) {
      el = document.createElement("div"); el.id = "sn-jobboard"; document.body.appendChild(el);
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "x") { el.classList.remove("on"); return; }
        decide(b.getAttribute("data-id"), b.getAttribute("data-act") === "yes");
      });
    }
    if (!list.length) { el.classList.remove("on"); return; }
    el.innerHTML = "<p>JOBS FOR NOTIS</p>" + list.map(function (t) {
      return "<p><b>" + nameOf(t.from) + " → " + (t.address || "") + "</b><br>AV€ " + Number(t.pay || 0).toFixed(2) + " · " + (t.phone || "") + (t.vip ? " · VIP" : "") + (t.floor ? " · floor" : "") + (t.night ? " · night" : "") + (t.heavy ? " · heavy" : "") +
        '</p><button type="button" class="yes" data-act="yes" data-id="' + t.id + '">ACCEPT</button><button type="button" class="no" data-act="no" data-id="' + t.id + '">DECLINE</button>';
    }).join("") + '<button type="button" class="no" data-act="x">HIDE</button>';
    el.classList.add("on");
  }
  function wrapOpen() {
    if (!window.SNWork || !SNWork.open || SNWork.open.__vj) return;
    var open = SNWork.open;
    SNWork.open = function (place, which) {
      var shop = place && place.kind === "shop" ? place : shopNear(place);
      if (shop && (!which || which === "shop" || which === "home")) {
        from = { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop" }; armed = "to"; line("From " + shop.name + ". Tap the client.");
      }
      return open.apply(this, arguments);
    };
    SNWork.open.__vj = true;
  }
  function wrapPlus() {
    var plus = document.getElementById("plus"); if (!plus || plus.__vj) return; plus.__vj = true;
    plus.addEventListener("click", function (e) {
      var shop = shopNear(here());
      if (shop && !from) { from = { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop" }; armed = "to"; line("From " + shop.name + ". Tap the client."); e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  function wrapMap() {
    if (window.SNPlusJob && SNPlusJob.pick && !SNPlusJob.pick.__vj) {
      var pk = SNPlusJob.pick;
      SNPlusJob.pick = function (p) { if (armed || (from && !to)) return take(p); var shop = shopNear(p); if (shop && !from) { from = { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop" }; armed = "to"; line("From " + shop.name + ". Tap the client."); return true; } return pk.apply(this, arguments); };
      SNPlusJob.pick.__vj = true;
    }
    if (window.SNWork && SNWork.takePoint && !SNWork.takePoint.__vj2) {
      var tp = SNWork.takePoint;
      SNWork.takePoint = function (p) { if (armed || (from && !to)) return take(p); return tp.apply(this, arguments); };
      SNWork.takePoint.__vj2 = true;
    }
  }
  function boot() { wrapPublish(); wrapOpen(); wrapPlus(); wrapMap(); if (owner()) paintBoard(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  window.SNVendorJob = { take: take, throwJob: throwJob, decide: decide };
})();
