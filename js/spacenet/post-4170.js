/* SpaceNet 4170 — delivery is two map taps. No dummy dest=from. */
(function () {
  if (window.__SN_CHAIN_4170) return;
  window.__SN_CHAIN_4170 = true;

  var waiting = "";
  var startAt = null;
  var endAt = null;
  var fromMap = false;
  var layers = [];
  var FEE = 0.03, SUR = 3, CAP = 13.3, HEAVY = 13, HOUR = 33, ERRAND = 5;

  function line(s) {
    var el = document.getElementById("line");
    if (el) el.textContent = s || "";
    try { if (window.SN && SN.talk) SN.talk(s); } catch (e) {}
  }
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
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
  function ownPhone() {
    try {
      var u = JSON.parse(read("sn:user", "null") || "null") || {};
      var raw = String(u.phone || u.tel || "");
      return raw.replace(/\D/g, "").length >= 8 ? raw : "";
    } catch (e) { return ""; }
  }
  function map() {
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    return window.__snLeaflet || null;
  }
  function hereCam() {
    try { if (window.SN && SN.here) { var h = SN.here(); if (h && isFinite(h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU", phone: ownPhone() }; } } catch (e) {}
    try { var p = readJson("sn:place", null); if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU", phone: ownPhone() }; } catch (e) {}
    return null;
  }
  function pins() {
    var list = [];
    function add(arr, kind) {
      (Array.isArray(arr) ? arr : []).forEach(function (r) {
        if (!r || !isFinite(+r.lat) || !isFinite(+r.lng)) return;
        if (r.secret || r.visible === false) return;
        list.push({
          lat: +r.lat,
          lng: +r.lng,
          name: r.name || r.label || r.email || "Pin",
          phone: r.phone || "",
          kind: kind || r.kind || ""
        });
      });
    }
    var you = hereCam();
    if (you) list.push(you);
    add(readJson("sn:vendors", []), "shop");
    add(readJson("sn:shops", []), "shop");
    add(readJson("sn:visible-people", []), "user");
    add(readJson("sn:hunts", []), "hunt");
    add(readJson("sn:posts", []), "user");
    try { if (window.SN && SN.shops) add(SN.shops(), "shop"); } catch (e) {}
    return list;
  }
  function snap(p) {
    var best = { lat: +p.lat, lng: +p.lng, name: p.name || "PIN", phone: p.phone || "" };
    var d = 0.05;
    pins().forEach(function (n) {
      var k = km(best, n);
      if (k <= d) { d = k; best = { lat: n.lat, lng: n.lng, name: n.name, phone: n.phone || best.phone }; }
    });
    return best;
  }
  function needsRev(p) {
    var n = nameOf(p);
    return !n || /^(PIN|This place|Customer|here)$/i.test(n);
  }
  function reverse(p, then) {
    if (!needsRev(p)) { then(p); return; }
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
  function tripsOf(mass) {
    var m = Number(mass) || 0;
    if (m <= CAP) return 1;
    return Math.ceil(m / CAP);
  }
  function deliveryBase(dist) {
    return dist <= 3 ? 3 : 3 + Math.ceil(dist - 3);
  }
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
    return { oneWay: money(one), km: billed, trips: trips, heavy: heavy, night: night, base: base, surcharge: surcharge, ride: ride, fee: fee, pay: money(ride + fee), hours: hours };
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
  function hidePlus() {
    var el = document.getElementById("sn-plus3");
    if (el) el.classList.remove("on");
  }
  function clearMarks() {
    var m = map();
    layers.forEach(function (x) {
      try { if (m) m.removeLayer(x); } catch (e) {}
    });
    layers = [];
  }
  function paint() {
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
  function stashStart(p) {
    startAt = p;
    try {
      if (window.SNPost4169 && SNPost4169.showMenu) SNPost4169.showMenu(p);
    } catch (e) {}
    hidePlus();
  }
  function waitFrom() {
    waiting = "from";
    startAt = null;
    endAt = null;
    hidePlus();
    showPick("Tap the start");
    line("Tap the start on the map — shop, user, your pin, or drop a new pin.");
    paint();
  }
  function waitTo() {
    waiting = "to";
    hidePlus();
    showPick("Tap the destination");
    line("Start: " + nameOf(startAt) + ". Tap the destination — user, your pin, or drop a pin.");
    paint();
  }
  function take(p) {
    if (!waiting || !p || !isFinite(+p.lat)) return false;
    var hit = snap(p);
    reverse(hit, function (named) {
      if (waiting === "from") {
        stashStart(named);
        waitTo();
        return;
      }
      if (waiting === "to") {
        waiting = "";
        endAt = named;
        hidePick();
        paint();
        if (named.phone && window.SNPost4169) {
          /* takeDest fills the form; phone is typed if the pin has one */
        }
        try {
          if (window.SNPost4169 && SNPost4169.takeDest) SNPost4169.takeDest(named);
        } catch (e) {}
        line("Destination: " + nameOf(named) + ".");
        setTimeout(function () {
          var phone = document.getElementById("sn-job-phone");
          if (phone && named.phone && !phone.value) phone.value = named.phone;
          var addr = document.getElementById("sn-job-addr");
          if (addr && named.name) addr.value = named.name;
          var pay = document.getElementById("sn-job-pay");
          if (pay && startAt && endAt) {
            var q = price(startAt, endAt, "delivery", 1, 0, false, false, nightNow());
            pay.textContent = "AV€ " + q.pay.toFixed(2) + " · " + q.km + " km back-forth · 3% in";
          }
        }, 80);
      }
    });
    return true;
  }
  function startDelivery() {
    if (fromMap && startAt && isFinite(+startAt.lat)) {
      stashStart(startAt);
      waitTo();
      return;
    }
    waitFrom();
  }
  function cancel() {
    waiting = "";
    startAt = null;
    endAt = null;
    hidePick();
    clearMarks();
    line("");
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "kind-delivery") {
      e.preventDefault();
      e.stopImmediatePropagation();
      startDelivery();
      return;
    }
    if (act === "tap-dest") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (startAt) waitTo();
      else waitFrom();
      return;
    }
    if (act === "cancel-pick" || act === "x") {
      if (waiting) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancel();
      }
    }
  }, true);

  function onMap(e) {
    if (!waiting) return;
    var ll = e && e.latlng;
    if (!ll) return;
    take({ lat: ll.lat, lng: ll.lng, name: "PIN" });
  }
  function bindMap() {
    var m = map();
    if (m && m.on && !m.__sn4170) {
      m.__sn4170 = true;
      m.on("click", onMap);
    }
    if (window.SNPlusJob && SNPlusJob.showMenu && !SNPlusJob.showMenu.__c4170) {
      var smj = SNPlusJob.showMenu;
      SNPlusJob.showMenu = function (p) {
        fromMap = true;
        if (p && isFinite(+p.lat)) startAt = snap(p);
        return smj(p);
      };
      SNPlusJob.showMenu.__c4170 = true;
    }
    if (window.SNPlusJob && SNPlusJob.pick && !SNPlusJob.pick.__c4170) {
      var prev = SNPlusJob.pick;
      SNPlusJob.pick = function (p) {
        if (waiting) return take(p);
        return prev ? prev(p) : false;
      };
      SNPlusJob.pick.__c4170 = true;
      SNPlusJob.pick.__pf = true;
      SNPlusJob.pick.__pj2 = true;
    }
    var plus = document.getElementById("plus");
    if (plus && !plus.__c4170dock) {
      plus.__c4170dock = true;
      function dock() { fromMap = false; startAt = null; endAt = null; }
      plus.addEventListener("click", dock, true);
      plus.addEventListener("pointerup", dock, true);
    }
  }
  bindMap();
  setInterval(bindMap, 1200);
  window.SNChain4170 = { take: take, waitFrom: waitFrom, price: price, cancel: cancel };
})();
