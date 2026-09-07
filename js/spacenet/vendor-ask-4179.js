/* SpaceNet 4179 — found vendor = SpaceNet shop + approved drivers. Never post menu. */
(function () {
  if (window.__snAsk4179) return;
  window.__snAsk4179 = true;
  var OWNER = "notisastranov@gmail.com";
  var shop = null, driver = null;
  function line(t) { var el = document.getElementById("line"); if (el) el.textContent = t || ""; }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function email() { try { var u = JSON.parse(read("sn:user", "null") || "null"); return (u && (u.email || u.mail)) || ""; } catch (e) { return ""; } }
  function hidePostMenu() {
    var sheet = document.getElementById("sn-sheet");
    if (!sheet) return;
    var html = (sheet.innerHTML || "").toUpperCase();
    if (html.indexOf("POST SOMETHING") >= 0 || html.indexOf("CALL SOMEBODY") >= 0) sheet.classList.remove("on");
  }
  function css() {
    if (document.getElementById("sn-ask-css")) return;
    var s = document.createElement("style"); s.id = "sn-ask-css";
    s.textContent = "#sn-ask{display:none;position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom)+78px);z-index:120;max-width:min(460px,94vw);margin:0 auto;max-height:62vh;overflow:auto;background:rgba(4,14,28,.98);border:1px solid rgba(126,233,255,.6);border-radius:16px;color:#e8fbff}#sn-ask.on{display:block}#sn-ask .cover{width:100%;height:120px;object-fit:cover;background:#071018;display:block;border-radius:16px 16px 0 0}#sn-ask .pad{padding:10px 14px 14px}#sn-ask h3{margin:0 0 4px;font:800 16px system-ui;color:#4df0ff}#sn-ask p{margin:0 0 6px;font:500 13px/1.4 system-ui;color:#c6ecf6}#sn-ask .x{position:absolute;top:8px;right:10px;border:0;border-radius:99px;width:32px;height:32px;background:rgba(0,0,0,.45);color:#fff}#sn-ask .row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}#sn-ask .row a,#sn-ask .row button,#sn-ask .drv{flex:1;min-width:88px;height:36px;border-radius:10px;border:1px solid rgba(77,240,255,.55);background:rgba(4,16,28,.92);color:#4df0ff;font:800 11px system-ui;text-align:center;text-decoration:none}#sn-ask .drv{display:block;padding:8px;height:auto;text-align:left;margin:6px 0}#sn-ask .drv.on{border-color:#19e68c;color:#19e68c}#sn-ask .go{width:100%;height:42px;margin-top:8px;border:0;border-radius:12px;background:#19e68c;color:#02100a;font:800 13px system-ui}";
    document.head.appendChild(s);
  }
  function drivers() {
    var list = [];
    try { var a = JSON.parse(read("sn:drivers", "[]") || "[]"); if (Array.isArray(a)) list = list.concat(a); } catch (e) {}
    try { if (window.SNWork && SNWork.all) list = list.concat(SNWork.all().drivers || []); } catch (e) {}
    list.push({ id: "drv-notis", name: "Notis", email: OWNER, approved: true, kind: "driver" });
    var seen = {}, out = [];
    list.forEach(function (d) {
      if (!d) return;
      var ok = d.approved || d.ok || String(d.email || "").toLowerCase() === OWNER;
      if (!ok) return;
      var k = String(d.email || d.id || d.name || "").toLowerCase();
      if (!k || seen[k]) return; seen[k] = 1; out.push(d);
    });
    return out;
  }
  function phoneOf(v) { var t = (v && (v.tags || v)) || {}; return String(t.phone || t["contact:phone"] || t.mobile || t.tel || (v && v.phone) || "").trim(); }
  function webOf(v) { var t = (v && (v.tags || v)) || {}; return String(t.website || t["contact:website"] || t.url || (v && v.web) || "").trim(); }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function box() {
    css();
    var el = document.getElementById("sn-ask");
    if (el) return el;
    el = document.createElement("div"); el.id = "sn-ask"; document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "close") el.classList.remove("on");
      if (act === "drv") { var id = b.getAttribute("data-id"); driver = drivers().filter(function (d) { return String(d.id || d.email) === id; })[0] || drivers()[0]; paint(); }
      if (act === "assign") assignPay("assign");
      if (act === "verify") assignPay("verify");
    });
    return el;
  }
  function paint() {
    if (!shop) return;
    hidePostMenu();
    var el = box();
    var phone = phoneOf(shop), web = webOf(shop), tel = phone.replace(/[^\d+]/g, "");
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((shop.name || "") + " " + shop.lat + "," + shop.lng);
    var cover = shop.cover || shop.photo || "";
    var dishes = shop.dishes || shop.items || [];
    var drvs = drivers(); if (!driver) driver = drvs[0] || null;
    el.innerHTML = (cover ? '<img class="cover" alt="" src="' + esc(cover) + '">' : '<div class="cover"></div>') +
      '<button type="button" class="x" data-act="close">✕</button><div class="pad">' +
      "<h3>" + esc(shop.name || "Vendor") + "</h3><p>SpaceNet vendor" + (shop.raw ? " · " + esc(shop.raw) : "") + "</p>" +
      (shop.hours ? "<p>" + esc(shop.hours) + "</p>" : "") + (shop.note ? "<p>" + esc(shop.note) + "</p>" : "") +
      '<div class="row">' + (tel ? '<a href="tel:' + esc(tel) + '">CALL VENDOR</a>' : "") +
      (web ? '<a href="' + esc(web) + '" target="_blank" rel="noopener">WEB</a>' : "") +
      '<a href="' + maps + '" target="_blank" rel="noopener">MAP</a></div>' +
      (dishes.length ? dishes.slice(0, 10).map(function (d) { return "<p>" + esc(d.name || d.desc) + (Number(d.price) ? " · AV€ " + Number(d.price).toFixed(2) : "") + "</p>"; }).join("") : "<p>Public menu loading…</p>") +
      "<p>Approved SpaceNet drivers</p>" +
      drvs.map(function (d) { var id = String(d.id || d.email || ""); var on = driver && String(driver.id || driver.email) === id ? " on" : ""; return '<button type="button" class="drv' + on + '" data-act="drv" data-id="' + esc(id) + '"><b>' + esc(d.name || "Driver") + "</b> · approved</button>"; }).join("") +
      '<button type="button" class="go" data-act="assign">ASSIGN DRIVER · CREATE JOB</button>' +
      '<button type="button" class="go" data-act="verify" style="background:#4df0ff;margin-top:6px">PAY ON VERIFIED DELIVERY</button></div>';
    el.classList.add("on");
  }
  function enrich(v) {
    if (!v || !isFinite(+v.lat)) return;
    fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&zoom=18&lat=" + v.lat + "&lon=" + v.lng, { headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
      var t = (j && j.extratags) || {}; v.tags = Object.assign({}, v.tags || {}, t);
      if (t.phone || t["contact:phone"]) v.phone = t.phone || t["contact:phone"];
      if (t.website) v.web = t.website; if (t.opening_hours) v.hours = t.opening_hours;
      if (j.display_name) v.raw = j.display_name; paint();
    }).catch(function () {});
    fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "LISTING FILL act=listing for " + (v.name || "shop") + ". Official phone, hours, dishes. Never invent a phone.", message: "listing " + (v.name || ""), spacenet: true, allow_paid: true, here: { lat: v.lat, lng: v.lng, name: v.name } }) }).then(function (r) { return r.json(); }).then(function (j) {
      var text = String((j && (j.text || j.say)) || ""); var o = j || {}; var m = text.match(/\{[\s\S]*\}/);
      if (m) { try { o = Object.assign({}, o, JSON.parse(m[0])); } catch (e) {} }
      if (o.phone && !v.phone) v.phone = o.phone; if (o.hours) v.hours = o.hours; if (o.note || o.say) v.note = o.note || o.say;
      if (o.cover) v.cover = o.cover; if (o.dishes || o.items) v.dishes = o.dishes || o.items; paint();
    }).catch(function () {});
  }
  function openShop(v) {
    if (!v) return;
    shop = { name: v.name || v.label || "Vendor", lat: +v.lat, lng: +v.lng, raw: v.raw || "", tags: v.tags || {}, phone: v.phone || "", hours: v.hours || "", cover: v.cover || "", dishes: v.dishes || [], id: v.id || "", kind: "shop" };
    driver = drivers()[0] || null; hidePostMenu(); paint(); enrich(shop);
    line((shop.name || "Vendor") + " · SpaceNet shop. Pick an approved driver.");
  }
  function assignPay(mode) {
    if (!shop) return;
    if (!driver) driver = drivers()[0];
    var id = "j" + Date.now().toString(36), fee = 6;
    var row = { id: id, kind: "job", what: "Delivery", status: mode === "verify" ? "verified" : "assigned", from: { lat: shop.lat, lng: shop.lng, name: shop.name }, shop: shop.name, phone: phoneOf(shop), driverEmail: (driver && driver.email) || OWNER, driver: { name: (driver && driver.name) || "Notis", email: (driver && driver.email) || OWNER }, pay: fee, vendorPay: +(fee * 0.5).toFixed(2), driverPay: +(fee * 0.47).toFixed(2), fee3: +(fee * 0.03).toFixed(2), payer: email(), toOwner: OWNER, t: Date.now() };
    try { var tasks = JSON.parse(read("sn:tasks", "[]") || "[]"); tasks.unshift(row); write("sn:tasks", JSON.stringify(tasks.slice(0, 80))); } catch (e) {}
    try { fetch("/api/space", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row: row }) }).catch(function () {}); } catch (e) {}
    if (mode === "verify") line("Verified. Vendor AV€ " + row.vendorPay + " · driver AV€ " + row.driverPay + " · SpaceNet 3% AV€ " + row.fee3 + ".");
    else line("Job assigned to " + ((driver && driver.name) || "Notis") + ". Pay vendor + driver when delivery is verified.");
  }
  function wrap() {
    if (window.SNWork && SNWork.open && !SNWork.open.__ask4179) {
      var o = SNWork.open;
      SNWork.open = function (place, which) {
        if (place && isFinite(+place.lat) && which !== "post" && which !== "call" && which !== "upload") { openShop(place); hidePostMenu(); return; }
        return o.apply(this, arguments);
      };
      SNWork.open.__ask4179 = true;
    }
  }
  wrap(); setInterval(function () { wrap(); if (shop) hidePostMenu(); }, 700);
})();
