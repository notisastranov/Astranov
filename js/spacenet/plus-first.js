/* SpaceNet 4151 — + or map = post a job. Next tap = destination. Phone + extras. Driver = Notis. */
(function () {
  window.__snPlusFirst = true;
  var FEE = 0.03, SUR = 3, CAP = 13.3, HEAVY = 13;
  var from = null, to = null, quote = null, wait = "";
  function line(s) { var el = document.getElementById("line"); if (el) el.textContent = s || ""; }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function user() { try { return JSON.parse(read("sn:user", "null") || "null"); } catch (e) { return null; } }
  function email() { var u = user(); return String((u && (u.email || u.user_email)) || "").toLowerCase(); }
  function token() { return String(read("sn:access", "") || ""); }
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
    try { if (window.SN && SN.here) { var h = SN.here(); if (h && isFinite(h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" }; } } catch (e) {}
    try { var p = JSON.parse(read("sn:place", "null") || "null"); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
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
      k = km(p, s); if (k < 0.18 && k < d) { d = k; best = s; }
    }
    return best;
  }
  function tripsOf(mass) { mass = Number(mass) || 0; if (mass <= CAP) return 1; return Math.ceil(mass / CAP); }
  function deliveryBase(dist) { return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3); }
  function extras(q) { var n = 0; if (q.night) n++; if (q.vip) n++; if (q.floor) n++; if (q.heavy) n++; return n; }
  function price(q) {
    q.trips = tripsOf(q.mass);
    q.oneWay = Number(q.oneWay) || 0;
    q.km = money(q.trips * 2 * q.oneWay);
    q.heavy = (q.mass || 0) > HEAVY;
    q.base = deliveryBase(q.km);
    q.surcharge = extras(q) * SUR;
    q.ride = money(q.base + q.surcharge);
    q.fee = money(q.ride * FEE);
    q.pay = money(q.ride + q.fee);
    return q;
  }
  function hideMenus() {
    ["sn-plus-menu", "sn-pick"].forEach(function (id) {
      var n = document.getElementById(id); if (n) n.classList.remove("on");
    });
  }
  function startJob(p) {
    hideMenus();
    p = p || here();
    var shop = shopNear(p);
    from = shop ? { lat: +shop.lat, lng: +shop.lng, name: shop.name, id: shop.id, kind: "shop" } : { lat: +p.lat, lng: +p.lng, name: nameOf(p) };
    to = null; quote = null; wait = "to";
    line("Job from " + nameOf(from) + ". Zoom and tap the customer.");
  }
  function dest(p) {
    if (!p || !isFinite(p.lat)) return;
    to = { lat: +p.lat, lng: +p.lng, name: nameOf(p) }; wait = "";
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng).then(function (r) { return r.json(); }).then(function (j) {
      var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
      to.address = [pr.street, pr.housenumber, pr.name, pr.city || pr.locality].filter(Boolean).join(" ") || nameOf(to);
      to.name = to.address;
      quote = { from: from, to: to, oneWay: +Math.max(0.1, km(from, to)).toFixed(2), phone: "", address: to.address, floor: false, vip: false, mass: 0, night: nightNow() };
      price(quote); card();
    }).catch(function () {
      to.address = nameOf(to);
      quote = { from: from, to: to, oneWay: +Math.max(0.1, km(from, to)).toFixed(2), phone: "", address: to.address, floor: false, vip: false, mass: 0, night: nightNow() };
      price(quote); card();
    });
  }
  function css() {
    if (document.getElementById("sn-pf-css")) return;
    var s = document.createElement("style"); s.id = "sn-pf-css";
    s.textContent = "#sn-jobq{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom)+78px);transform:translateX(-50%);z-index:160;width:min(340px,94vw);max-height:64vh;overflow:auto;display:none;padding:12px;border-radius:16px;background:rgba(4,12,22,.96);border:1px solid rgba(126,233,255,.45);color:#c6f6ff}#sn-jobq.on{display:block}#sn-jobq .pay{font:900 26px/1 ui-monospace;color:#4df0ff}#sn-jobq p{margin:8px 0;font:600 12px system-ui}#sn-jobq label{display:block;margin:6px 0;font:700 12px system-ui}#sn-jobq input[type=text],#sn-jobq input[type=tel],#sn-jobq input[type=number]{width:100%;height:36px;border-radius:8px;border:1px solid rgba(126,233,255,.35);background:#041018;color:#e8fbff}#sn-jobq .go{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 12px system-ui}#sn-jobq .no{width:100%;height:36px;margin-top:6px;border-radius:12px;border:1px solid #ff3b4e;background:#000;color:#ff3b4e}";
    document.head.appendChild(s);
  }
  function card() {
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
        if (e.target.id === "sn-job-mass") quote.mass = Number(e.target.value) || 0;
        price(quote); card();
      });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "pay") throwJob();
        if (b.getAttribute("data-act") === "cancel") { el.classList.remove("on"); from = to = quote = null; wait = ""; line(""); }
      });
    }
    var bits = [q.trips + " run" + (q.trips > 1 ? "s" : "") + " · " + q.km + " km back-forth"];
    if (q.night) bits.push("night +3"); if (q.vip) bits.push("VIP +3"); if (q.floor) bits.push("floor +3"); if (q.heavy) bits.push("over 13 +3");
    el.innerHTML = '<div class="pay">AV€ ' + q.pay.toFixed(2) + "</div><p>" + nameOf(q.from) + " → " + (q.address || nameOf(q.to)) + "</p><p>" + bits.join(" · ") + " · 3% AV€ " + q.fee.toFixed(2) + "</p><p>Driver: Notis</p>" +
      '<label>Customer address<input id="sn-job-addr" type="text" value="' + String(q.address || "").replace(/"/g, "") + '"></label>' +
      '<label>Customer telephone<input id="sn-job-phone" type="tel" placeholder="+30" value="' + String(q.phone || "") + '"></label>' +
      '<label>Kg or litres<input id="sn-job-mass" type="number" min="0" step="0.1" value="' + (q.mass || 0) + '"></label>' +
      '<label><input type="checkbox" id="sn-job-vip"' + (q.vip ? " checked" : "") + '> VIP straight + AV€ 3</label>' +
      '<label><input type="checkbox" id="sn-job-floor"' + (q.floor ? " checked" : "") + '> Floor / room + AV€ 3</label>' +
      '<label><input type="checkbox" id="sn-job-night"' + (q.night ? " checked" : "") + '> Night 21:00–09:00 + AV€ 3</label>' +
      '<button type="button" class="go" data-act="pay">POST JOB TO NOTIS</button>' +
      '<button type="button" class="no" data-act="cancel">CANCEL</button>';
    el.classList.add("on");
  }
  function throwJob() {
    if (!quote) return;
    quote.phone = String((document.getElementById("sn-job-phone") || {}).value || quote.phone || "").trim();
    quote.address = String((document.getElementById("sn-job-addr") || {}).value || quote.address || "").trim();
    quote.mass = Number((document.getElementById("sn-job-mass") || {}).value || quote.mass || 0);
    price(quote);
    if (!quote.address) { line("Confirm the customer address."); return; }
    if (!quote.phone || quote.phone.replace(/\D/g, "").length < 8) { line("Customer telephone is required."); return; }
    var q = quote, id = "j" + Date.now().toString(36);
    var row = { id: id, kind: "job", what: "Delivery", status: "offered", from: { lat: q.from.lat, lng: q.from.lng, name: nameOf(q.from), id: q.from.id || "" }, to: { lat: q.to.lat, lng: q.to.lng, name: q.address, address: q.address }, phone: q.phone, address: q.address, km: q.km, oneWay: q.oneWay, trips: q.trips, ride: q.ride, fee: q.fee, pay: q.pay, floor: !!q.floor, vip: !!q.vip, night: !!q.night, heavy: !!q.heavy, mass: q.mass, driverEmail: "notisastranov@gmail.com", driver: { name: "Notis", email: "notisastranov@gmail.com" }, payer: email(), email: email(), toOwner: "notisastranov@gmail.com", t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", tasks.slice(0, 80)); } catch (e) {}
    fetch("/api/space", { method: "POST", headers: headers(), body: JSON.stringify({ row: row }) }).catch(function () {});
    var el = document.getElementById("sn-jobq"); if (el) el.classList.remove("on");
    from = to = quote = null; wait = "";
    line("Job posted to Notis. AV€ " + q.pay.toFixed(2) + ".");
  }
  function onPlus(e) { e.preventDefault(); e.stopPropagation(); startJob(here()); }
  function onMap(p) {
    if (!p || !isFinite(p.lat)) return false;
    if (!from || wait === "from") { startJob(p); return true; }
    if (wait === "to") { dest(p); return true; }
    startJob(p); return true;
  }
  function hookPlus() {
    var plus = document.getElementById("plus"); if (!plus || plus.__pf) return; plus.__pf = true;
    plus.addEventListener("click", onPlus, true);
    plus.addEventListener("pointerup", onPlus, true);
  }
  function hookPlusJob() {
    if (!window.SNPlusJob) return;
    SNPlusJob.showMenu = function (p) { startJob(p || here()); };
    if (SNPlusJob.pick && !SNPlusJob.pick.__pf) {
      var pk = SNPlusJob.pick;
      SNPlusJob.pick = function (p) { if (onMap(p)) return true; return pk.apply(this, arguments); };
      SNPlusJob.pick.__pf = true;
    }
  }
  function hookLeaflet() {
    if (!window.SN || !SN.map || SN.map.__pf) return;
    try { SN.map.on("click", function (e) { if (e && e.latlng) onMap({ lat: e.latlng.lat, lng: e.latlng.lng, name: "Drop" }); }); SN.map.__pf = true; } catch (e) {}
  }
  function boot() { hookPlus(); hookPlusJob(); hookLeaflet(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1200);
  window.SNPlusFirst = { startJob: startJob, dest: dest };
})();
