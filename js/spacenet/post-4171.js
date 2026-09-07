/* SpaceNet 4171 — delivery chain. Full street+number corrects both pins. Red door checkout starts a real job. */
(function () {
  if (window.__SN_CHAIN_4171) return;
  window.__SN_CHAIN_4171 = true;

  var FEE = 0.03, SUR = 3, CAP = 13.3, HEAVY = 13, HOUR = 33, ERRAND = 5;
  var waiting = "";
  var startAt = null;
  var endAt = null;
  var bagNote = "";
  var bagGoods = 0;
  var layers = [];
  var doors = [];

  function line(s) {
    var el = document.getElementById("line");
    if (el) el.textContent = s || "";
    try { if (window.SN && SN.talk) SN.talk(s); } catch (e) {}
  }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function readJson(k, d) { try { var v = JSON.parse(read(k, "null")); return v == null ? d : v; } catch (e) { return d; } }
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function nightNow() { var h = new Date().getHours(); return h >= 21 || h < 9; }
  function km(a, b) {
    if (!a || !b) return 0;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function nameOf(p) { return String((p && (p.name || p.label || p.address)) || "This place"); }
  function looksStreet(s) {
    var t = String(s || "").trim();
    if (t.length < 5) return false;
    if (!/\d/.test(t)) return false;
    if (/^(PIN|YOU|here|this place|customer)$/i.test(t)) return false;
    return true;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&#38;")
      .replace(/</g, "&#60;")
      .replace(/>/g, "&#62;")
      .replace(/"/g, "&#34;");
  }
  function map() {
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    return window.__snLeaflet || null;
  }
  function hereCam() {
    try { if (window.SN && SN.here) { var h = SN.here(); if (h && isFinite(h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" }; } } catch (e) {}
    try { var p = readJson("sn:place", null); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" }; } catch (e) {}
    return null;
  }
  function shops() {
    var list = [];
    function add(arr) {
      (Array.isArray(arr) ? arr : []).forEach(function (r) {
        if (!r || !isFinite(+r.lat) || !isFinite(+r.lng)) return;
        if (r.secret || r.visible === false) return;
        list.push({
          id: r.id || "",
          lat: +r.lat,
          lng: +r.lng,
          name: r.name || r.label || "Shop",
          phone: r.phone || "",
          where: r.where || r.address || r.name || "",
          dishes: r.dishes || r.items || r.rows || []
        });
      });
    }
    add(readJson("sn:vendors", []));
    add(readJson("sn:shops", []));
    try { if (window.SNWork && SNWork.all) add(SNWork.all().shops); } catch (e) {}
    try { if (window.SN && SN.shops) add(SN.shops()); } catch (e) {}
    var seen = {};
    return list.filter(function (s) {
      var k = s.lat.toFixed(5) + "|" + s.lng.toFixed(5);
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
  }
  function shopNear(p) {
    if (!p) return null;
    var list = shops(), best = null, d = 0.12, i, s, k;
    for (i = 0; i < list.length; i++) {
      s = list[i];
      k = km(p, s);
      if (k < d) { d = k; best = s; }
    }
    return best;
  }
  function tripsOf(mass) {
    var m = Number(mass) || 0;
    if (m <= CAP) return 1;
    return Math.ceil(m / CAP);
  }
  function deliveryBase(dist) { return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3); }
  function price(from, to, kind, hours, mass, floor, vip, night) {
    kind = kind === "hourly" || kind === "errand" ? kind : "delivery";
    hours = Math.max(1, Math.round(Number(hours) || 1));
    mass = Math.max(0, Number(mass) || 0);
    var one = Math.max(0.1, km(from, to));
    var trips = kind === "delivery" ? tripsOf(mass) : 1;
    var billed = kind === "delivery" ? money(trips * 2 * one) : money(one);
    var heavy = kind === "delivery" && mass > HEAVY;
    night = night == null ? nightNow() : !!night;
    var extras = 0;
    if (night) extras += 1;
    if (vip) extras += 1;
    if (floor) extras += 1;
    if (heavy) extras += 1;
    var base = 0;
    if (kind === "hourly") base = money(HOUR * hours);
    else if (kind === "errand") base = money(ERRAND + Math.max(0, Math.ceil(one - 1)));
    else base = deliveryBase(billed);
    var surcharge = extras * SUR;
    var ride = money(base + surcharge);
    var fee = money(ride * FEE);
    return { oneWay: money(one), km: billed, trips: trips, heavy: heavy, night: night, base: base, surcharge: surcharge, ride: ride, fee: fee, pay: money(ride + fee), hours: hours, mass: mass, floor: !!floor, vip: !!vip };
  }
  function css() {
    if (document.getElementById("sn-4171-css")) return;
    var s = document.createElement("style");
    s.id = "sn-4171-css";
    s.textContent =
      ".sn-door-wrap{background:transparent!important;border:0!important}" +
      ".sn-red-door{width:16px;height:24px;margin:0 auto;background:linear-gradient(180deg,#e23b4a 0%,#9a1020 100%);border:1.5px solid #ff7a86;border-radius:3px 3px 1px 1px;box-shadow:0 0 10px #c4122f99;opacity:.92;position:relative}" +
      ".sn-red-door:before{content:'';position:absolute;top:3px;left:3px;right:3px;height:7px;border-radius:1px;background:rgba(8,0,2,.35)}" +
      ".sn-red-door:after{content:'';position:absolute;top:12px;right:3px;width:3px;height:3px;border-radius:99px;background:#e8c56b}" +
      "#sn-jobq .use{width:100%;height:36px;margin:4px 0 8px;border-radius:10px;border:1px solid rgba(126,233,255,.4);background:#041018;color:#7ee9ff;font:800 11px system-ui}";
    document.head.appendChild(s);
  }
  function showPick(msg) {
    var bar = document.getElementById("sn-pick");
    if (!bar) return;
    bar.classList.add("on");
    var el = bar.querySelector(".msg");
    if (el) el.textContent = msg;
  }
  function hidePick() {
    var bar = document.getElementById("sn-pick");
    if (bar) bar.classList.remove("on");
  }
  function hideSheets() {
    ["sn-sheet", "sn-menu", "sn-cart", "sn-plus3", "sn-tasks"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("on");
    });
  }
  function clearDoors() {
    var m = map();
    doors.forEach(function (x) { try { if (m) m.removeLayer(x); } catch (e) {} });
    doors = [];
  }
  function clearMarks() {
    var m = map();
    layers.forEach(function (x) { try { if (m) m.removeLayer(x); } catch (e) {} });
    layers = [];
  }
  function paintHop() {
    var m = map();
    if (!m || !window.L) return;
    clearMarks();
    function dot(p, color, label) {
      if (!p || !isFinite(+p.lat)) return;
      var mark = L.circleMarker([p.lat, p.lng], { radius: 9, color: color, fillColor: color, fillOpacity: 1, weight: 2 });
      mark.bindTooltip(label, { permanent: true, direction: "right", offset: [10, 0], className: "sn-tip" });
      mark.addTo(m);
      layers.push(mark);
    }
    if (startAt) dot(startAt, "#19e68c", "FROM " + nameOf(startAt));
    if (endAt) dot(endAt, "#e8c56b", "TO " + nameOf(endAt));
    if (startAt && endAt) {
      var hop = L.polyline([[startAt.lat, startAt.lng], [endAt.lat, endAt.lng]], { color: "#4df0ff", weight: 3, opacity: 0.85 });
      hop.addTo(m);
      layers.push(hop);
    }
  }
  function paintDoors() {
    css();
    var m = map();
    if (!m || !window.L) return;
    clearDoors();
    shops().forEach(function (s) {
      var icon = L.divIcon({
        className: "sn-door-wrap",
        html: '<div class="sn-red-door" title="' + esc(s.name) + '"></div>',
        iconSize: [22, 28],
        iconAnchor: [11, 28]
      });
      var mk = L.marker([s.lat, s.lng], { icon: icon, zIndexOffset: 250 });
      mk.bindTooltip(s.name, { permanent: true, direction: "right", offset: [12, -10], className: "sn-tip" });
      mk.on("click", function (e) {
        try { L.DomEvent.stopPropagation(e); } catch (err) {}
        openDoor(s);
      });
      mk.addTo(m);
      doors.push(mk);
    });
  }
  function reverse(p, then) {
    if (!p) { then(p); return; }
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
        var street = [pr.street, pr.housenumber].filter(Boolean).join(" ");
        p.name = [street || pr.name, pr.city || pr.locality].filter(Boolean).join(", ") || nameOf(p);
        p.address = p.name;
        then(p);
      })
      .catch(function () { then(p); });
  }
  function forward(q, near, then) {
    var t = String(q || "").trim();
    if (t.length < 3) { then(null); return; }
    var url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(t) + "&limit=6";
    if (near && isFinite(+near.lat)) url += "&lat=" + near.lat + "&lon=" + near.lng;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var feats = (j && j.features) || [];
        var hits = [];
        for (var i = 0; i < feats.length; i++) {
          var f = feats[i];
          var coords = f.geometry && f.geometry.coordinates;
          if (!coords || coords.length < 2) continue;
          var pr = f.properties || {};
          var street = [pr.street, pr.housenumber].filter(Boolean).join(" ");
          var name = [street || pr.name, pr.city || pr.locality].filter(Boolean).join(", ") || t;
          hits.push({ lat: +coords[1], lng: +coords[0], name: name, address: name });
        }
        if (!hits.length) { then(null); return; }
        var pool = hits;
        if (near && isFinite(+near.lat)) {
          var local = hits.filter(function (h) { return km(h, near) <= 80; });
          if (local.length) pool = local;
        }
        var numbered = pool.filter(function (h) { return /\d/.test(h.name || ""); });
        then(numbered[0] || pool[0] || null);
      })
      .catch(function () { then(null); });
  }
  function waitFrom() {
    waiting = "from";
    startAt = null;
    endAt = null;
    hideSheets();
    showPick("Tap start or type street + number");
    line("Tap a red door, or type the full pickup street and number.");
    paintHop();
  }
  function waitTo() {
    waiting = "to";
    hideSheets();
    showPick("Tap dest or type street + number");
    line("From " + nameOf(startAt) + ". Full delivery address — street and number. Tap the destination or type it.");
    paintHop();
  }
  function openDoor(s) {
    if (waiting === "from" || waiting === "to") {
      take({ lat: s.lat, lng: s.lng, name: s.name, phone: s.phone });
      return;
    }
    try {
      if (window.SN && SN.selectVendor) SN.selectVendor(s);
      else if (window.SNWork && SNWork.open) SNWork.open(s, "shop");
    } catch (e) {}
    line(s.name + ". Add to cart, then ORDER — or deliver from this door.");
  }
  function startFromShop(s, note, goods) {
    startAt = { lat: +s.lat, lng: +s.lng, name: s.name, phone: s.phone || "", id: s.id || "", fromAddress: s.where || s.name };
    bagNote = note || ("Pickup at " + s.name);
    bagGoods = Number(goods) || 0;
    write("sn:last-order", { shop: s.name, note: bagNote, goods: bagGoods, t: Date.now() });
    waitTo();
  }
  function take(p) {
    if (!waiting || !p || !isFinite(+p.lat)) return false;
    var hit = shopNear(p) && waiting === "from" ? shopNear(p) : p;
    hit = { lat: +hit.lat, lng: +hit.lng, name: hit.name || p.name || "PIN", phone: hit.phone || p.phone || "" };
    reverse(hit, function (named) {
      if (waiting === "from") {
        startAt = named;
        startAt.fromAddress = named.name;
        waitTo();
        return;
      }
      if (waiting === "to") {
        waiting = "";
        endAt = named;
        hidePick();
        paintHop();
        showQuote();
        line("Destination: " + nameOf(named) + ". Confirm the full street and number.");
      }
    });
    return true;
  }
  function confirm(end, text) {
    var q = String(text || "").trim();
    if (!q) { line("Type the full street and number."); return; }
    var near = end === "from" ? startAt || hereCam() : endAt || startAt || hereCam();
    line("Finding " + q + "…");
    forward(q, near, function (hit) {
      if (!hit) { line("Street and number not found. Correct it and try again."); return; }
      if (end === "from") {
        startAt = hit;
        startAt.fromAddress = q;
        if (!endAt) waitTo();
        else { paintHop(); showQuote(); }
        return;
      }
      if (!startAt) {
        startAt = hit;
        startAt.fromAddress = q;
        waitTo();
        return;
      }
      waiting = "";
      endAt = hit;
      endAt.address = q;
      hidePick();
      paintHop();
      showQuote();
      line("Destination: " + nameOf(hit) + ". Confirm the telephone and post.");
    });
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  function chk(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }
  function showQuote() {
    css();
    if (!startAt || !endAt) return;
    var fromAddr = startAt.fromAddress || nameOf(startAt);
    var toAddr = endAt.address || nameOf(endAt);
    var mass = Number(val("sn-job-mass") || 0);
    var floor = chk("sn-job-floor");
    var vip = chk("sn-job-vip");
    var night = document.getElementById("sn-job-night") ? chk("sn-job-night") : nightNow();
    var q = price(startAt, endAt, "delivery", 1, mass, floor, vip, night);
    var el = document.getElementById("sn-jobq");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-jobq";
      document.body.appendChild(el);
      el.addEventListener("click", function (e) {
        var b = e.target && e.target.closest && e.target.closest("[data-act]");
        if (!b) return;
        var act = b.getAttribute("data-act");
        if (act === "use-from") { e.preventDefault(); confirm("from", val("sn-job-from-addr")); }
        if (act === "use-to") { e.preventDefault(); confirm("to", val("sn-job-addr")); }
        if (act === "pay") { e.preventDefault(); throwJob(); }
        if (act === "cancel") { e.preventDefault(); cancel(); }
        if (act === "tap-from") { e.preventDefault(); waitFrom(); }
        if (act === "tap-dest") { e.preventDefault(); if (startAt) waitTo(); else waitFrom(); }
      });
      el.addEventListener("change", function () { showQuote(); });
    }
    var bits = [q.trips + " run" + (q.trips > 1 ? "s" : "") + " · " + q.km + " km back-forth"];
    if (q.night) bits.push("night +3");
    if (q.vip) bits.push("VIP +3");
    if (q.floor) bits.push("floor +3");
    if (q.heavy) bits.push("over 13 +3");
    var phone = val("sn-job-phone") || (endAt && endAt.phone) || "";
    var note = val("sn-job-note") || bagNote;
    el.innerHTML =
      '<div class="pay">AV€ ' + q.pay.toFixed(2) + "</div>" +
      "<p>" + esc(fromAddr) + " → " + esc(toAddr) + "</p>" +
      "<p>" + esc(bits.join(" · ")) + " · 3% AV€ " + q.fee.toFixed(2) + "</p>" +
      '<p>Driver: Notis</p>' +
      (bagNote ? "<p>Order: " + esc(bagNote) + (bagGoods ? " · goods AV€ " + bagGoods.toFixed(2) : "") + "</p>" : "") +
      '<label>What to do<textarea id="sn-job-note" rows="3">' + esc(note) + "</textarea></label>" +
      '<label>Pickup address — street and number<input id="sn-job-from-addr" type="text" value="' + esc(fromAddr) + '"></label>' +
      '<button type="button" class="use" data-act="use-from">USE THIS START ADDRESS</button>' +
      '<label>Customer address — street and number<input id="sn-job-addr" type="text" value="' + esc(toAddr) + '"></label>' +
      '<button type="button" class="use" data-act="use-to">USE THIS DESTINATION ADDRESS</button>' +
      '<label>Customer telephone<input id="sn-job-phone" type="tel" value="' + esc(phone) + '"></label>' +
      '<label>Kg or litres<input id="sn-job-mass" type="number" min="0" step="0.1" value="' + (q.mass || 0) + '"></label>' +
      '<label><input type="checkbox" id="sn-job-vip"' + (q.vip ? " checked" : "") + "> VIP + AV€ 3</label>" +
      '<label><input type="checkbox" id="sn-job-floor"' + (q.floor ? " checked" : "") + "> Floor / room + AV€ 3</label>" +
      '<label><input type="checkbox" id="sn-job-night"' + (q.night ? " checked" : "") + "> Night 21:00–09:00 + AV€ 3</label>" +
      '<button type="button" class="go" data-act="pay">POST DELIVERY TO NOTIS</button>' +
      '<button type="button" class="use" data-act="tap-from">TAP START ON MAP</button>' +
      '<button type="button" class="use" data-act="tap-dest">TAP CUSTOMER ON MAP</button>' +
      '<button type="button" class="no" data-act="cancel">CANCEL</button>';
    el.classList.add("on");
  }
  function throwJob() {
    if (!startAt || !endAt) return;
    var fromAddr = val("sn-job-from-addr") || startAt.fromAddress || nameOf(startAt);
    var toAddr = val("sn-job-addr") || endAt.address || nameOf(endAt);
    var phone = val("sn-job-phone");
    var note = val("sn-job-note") || bagNote || "Delivery";
    var mass = Number(val("sn-job-mass") || 0);
    var q = price(startAt, endAt, "delivery", 1, mass, chk("sn-job-floor"), chk("sn-job-vip"), chk("sn-job-night"));
    if (!looksStreet(toAddr)) { line("Full delivery address — street and number. Correct the pin or type it."); return; }
    if (!phone || phone.replace(/\D/g, "").length < 8) { line("Customer telephone is required."); return; }
    var id = "j" + Date.now().toString(36);
    var row = {
      id: id,
      kind: "job",
      what: note,
      title: note,
      status: "offered",
      from: { lat: startAt.lat, lng: startAt.lng, name: nameOf(startAt), id: startAt.id || "", address: fromAddr },
      to: { lat: endAt.lat, lng: endAt.lng, name: toAddr, address: toAddr },
      phone: phone,
      address: toAddr,
      fromAddress: fromAddr,
      km: q.km,
      oneWay: q.oneWay,
      trips: q.trips,
      ride: q.ride,
      fee: q.fee,
      pay: q.pay,
      floor: q.floor,
      vip: q.vip,
      night: q.night,
      heavy: q.heavy,
      mass: q.mass,
      goods: bagGoods,
      items: bagNote,
      driverEmail: "notisastranov@gmail.com",
      driver: { name: "Notis", email: "notisastranov@gmail.com" },
      t: Date.now()
    };
    try {
      var tasks = readJson("sn:tasks", []);
      tasks.unshift(row);
      write("sn:tasks", tasks.slice(0, 80));
      var jobs = readJson("sn:jobs", []);
      jobs.unshift(row);
      write("sn:jobs", jobs.slice(0, 40));
    } catch (e) {}
    try {
      fetch("/api/space", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ row: row }) });
    } catch (e) {}
    try { if (window.SNJobsStack && SNJobsStack.paint) SNJobsStack.paint(); } catch (e) {}
    var el = document.getElementById("sn-jobq");
    if (el) el.classList.remove("on");
    cancel(true);
    line("Delivery posted to Notis. AV€ " + q.pay.toFixed(2) + ".");
  }
  function cancel(keepLine) {
    waiting = "";
    startAt = null;
    endAt = null;
    bagNote = "";
    bagGoods = 0;
    hidePick();
    clearMarks();
    var el = document.getElementById("sn-jobq");
    if (el) el.classList.remove("on");
    if (!keepLine) line("");
  }
  function scrapeBag() {
    var names = [];
    var goods = 0;
    document.querySelectorAll("#sn-sheet .dish.order, #sn-live .dish.order, #sn-menu .dish.order").forEach(function (row) {
      var qb = row.querySelector(".qty b");
      var q = Number(qb && qb.textContent ? qb.textContent : 0) || 0;
      if (q <= 0) return;
      var nEl = row.querySelector(".cols b") || row.querySelector("b");
      var n = nEl ? String(nEl.textContent || "").trim() : "";
      var pxEl = row.querySelector(".px");
      var price = Number(String(pxEl && pxEl.textContent ? pxEl.textContent : "").replace(/[^\d.]/g, "")) || 0;
      if (n) names.push(q + " × " + n);
      goods += q * price;
    });
    return { note: names.join(", "), goods: money(goods) };
  }
  function shopFromSheet() {
    var sheet = document.getElementById("sn-sheet");
    var ttl = sheet && sheet.querySelector(".ttl");
    var name = ttl && ttl.textContent;
    if (name) {
      var hit = shops().filter(function (x) { return String(x.name).toLowerCase() === String(name).toLowerCase(); })[0];
      if (hit) return hit;
    }
    return shopNear(hereCam()) || shops()[0] || null;
  }
  function injectDoorGo() {
    var card = document.querySelector("#sn-sheet.on .card");
    if (!card || card.querySelector("#sn-door-go")) return;
    var b = document.createElement("button");
    b.id = "sn-door-go";
    b.type = "button";
    b.textContent = "DELIVER FROM THIS DOOR";
    b.style.cssText = "display:block;width:100%;height:44px;margin:8px 0 0;border:0;border-radius:12px;background:#19e68c;color:#00140a;font:800 13px system-ui";
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var s = shopFromSheet();
      if (!s) { line("Open a red door first."); return; }
      var bag = scrapeBag();
      startFromShop(s, bag.note || ("Pickup at " + s.name), bag.goods);
    });
    card.appendChild(b);
  }
  document.addEventListener("click", interceptOrder, true);
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "kind-delivery") {
      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      var pin = shopNear(hereCam());
      if (pin) startFromShop(pin, "", 0);
      else waitFrom();
    }
    if (act === "cancel-pick") {
      if (waiting) { e.preventDefault(); cancel(); }
    }
  }, true);

  var form = document.getElementById("f");
  if (form && !form.__sn4171) {
    form.__sn4171 = true;
    form.addEventListener("submit", function (e) {
      var inp = document.getElementById("in");
      var t = inp ? String(inp.value || "").trim() : "";
      if (!t) return;
      if ((waiting === "from" || waiting === "to" || (startAt && endAt)) && looksStreet(t)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        confirm(waiting === "from" ? "from" : "to", t);
        inp.value = "";
      }
    }, true);
  }

  function onMap(e) {
    if (!waiting) return;
    var ll = e && e.latlng;
    if (!ll) return;
    take({ lat: ll.lat, lng: ll.lng, name: "PIN" });
  }
  function bindMap() {
    var m = map();
    if (m && m.on && !m.__sn4171) {
      m.__sn4171 = true;
      m.on("click", onMap);
    }
    paintDoors();
    injectDoorGo();
  }
  bindMap();
  setInterval(bindMap, 1800);
  function interceptOrder(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var go = t.closest("#sn-order-go, [data-act=order-go], [data-act=now]");
    if (!go) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    var s = shopFromSheet();
    if (!s || !isFinite(+s.lat)) { line("Open a red door first."); return; }
    var bag = scrapeBag();
    startFromShop(s, bag.note || ("Pickup at " + s.name), bag.goods);
  }
  window.SNChain4171 = { take: take, waitFrom: waitFrom, waitTo: waitTo, confirm: confirm, startFromShop: startFromShop, cancel: cancel };
})();
