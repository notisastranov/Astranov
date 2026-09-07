/* SpaceNet 4200 — empty tap scouts red shirts; next tap wipes and hunts the new place.
   Click a pin to lock a waypoint. System chooses the driver. Client never picks. No zoom steal. */
(function () {
  if (window.__SN_SCOUT_4200) return;
  window.__SN_SCOUT_4200 = true;

  var SCOUT_M = 180;
  var SCOUT_MAX = 8;
  var gen = 0;
  var shirts = [];
  var shirtLayer = null;
  var hopLayer = null;
  var driverMark = null;
  var fromPin = null;
  var toPin = null;

  var css = document.createElement("style");
  css.id = "sn-4200-css";
  css.textContent =
    ".sn-shirt-wrap,.leaflet-marker-icon.sn-shirt-wrap,.sn-shirt-wrap.sn-keep{" +
    "display:flex!important;visibility:visible!important;pointer-events:auto!important;" +
    "background:transparent!important;border:0!important}" +
    ".sn-red-shirt{width:14px;height:18px;margin:0 auto;position:relative;background:#d41c32;" +
    "border:1.5px solid #ff6b7a;border-radius:3px 3px 5px 5px;box-shadow:0 0 8px #ff3b4e99}" +
    ".sn-red-shirt:before{content:'';position:absolute;top:-4px;left:3px;right:3px;height:6px;" +
    "background:#d41c32;border:1.5px solid #ff6b7a;border-bottom:0;border-radius:6px 6px 0 0}" +
    ".sn-red-shirt:after{content:'';position:absolute;top:2px;left:-5px;right:-5px;height:5px;" +
    "background:#d41c32;border:1.5px solid #ff6b7a;border-radius:2px;z-index:-1}" +
    ".sn-hop-keep,.leaflet-marker-icon.sn-hop-keep{display:flex!important;visibility:visible!important;pointer-events:auto!important}";
  (document.head || document.documentElement).appendChild(css);

  function map() {
    try { if (window.SN && SN.getMap) { var m = SN.getMap(); if (m) return m; } } catch (e) {}
    try { if (window.SN && SN.map) return SN.map; } catch (e2) {}
    return window.__snLeaflet || null;
  }
  function talk(s) {
    try { if (window.SN && SN.talk) SN.talk(s); } catch (e) {}
    var el = document.getElementById("line");
    if (el && s) el.textContent = s;
  }
  function km(a, b) {
    if (!a || !b || !isFinite(a.lat) || !isFinite(b.lat)) return 1e9;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2), y = Math.sin(dLng / 2);
    var h = x * x + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * y * y;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function keyOf(lat, lng) { return Number(lat).toFixed(5) + "|" + Number(lng).toFixed(5); }
  function drivers() {
    try {
      var all = window.SNWork && SNWork.all && SNWork.all();
      return (all && all.drivers) || [];
    } catch (e) { return []; }
  }
  function chooseDriver(from) {
    if (!from || !isFinite(+from.lat)) return null;
    var live = drivers().filter(function (d) {
      return d && isFinite(+d.lat) && d.available !== false && !d.secret;
    });
    if (!live.length) return null;
    return live.slice().sort(function (a, b) { return km(from, a) - km(from, b); })[0] || null;
  }
  function meDriver() {
    var mail = "";
    try {
      var u = JSON.parse(localStorage.getItem("sn:user") || "null");
      mail = String((u && (u.email || u.user_email)) || "").toLowerCase();
    } catch (e) {}
    var list = drivers();
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      if (d && mail && String(d.email || "").toLowerCase() === mail) return d;
    }
    return null;
  }
  function wipeShirts() {
    var m = map();
    if (shirtLayer && m) {
      try { m.removeLayer(shirtLayer); } catch (e) {}
    }
    shirtLayer = null;
  }
  function setHunt(list) {
    shirts = (list || []).slice(0, SCOUT_MAX);
    window.__SN_LAST_HUNT = { q: "scout", from: shirts[0] || null, list: shirts };
  }
  function paintShirts() {
    var m = map();
    if (!m || !window.L) return;
    wipeShirts();
    shirtLayer = window.L.layerGroup();
    shirts.forEach(function (p) {
      if (!p || !isFinite(+p.lat)) return;
      var icon = window.L.divIcon({
        className: "sn-shirt-wrap sn-keep",
        html: '<div class="sn-red-shirt" title="' + String(p.name || "Here").replace(/"/g, "") + '"></div>',
        iconSize: [16, 22],
        iconAnchor: [8, 20],
      });
      var mk = window.L.marker([p.lat, p.lng], { zIndexOffset: 240, icon: icon, keyboard: false });
      mk.bindTooltip(p.name || p.raw || "Here", { permanent: false, sticky: true, direction: "right", offset: [10, -8], className: "sn-tip" });
      mk.on("click", function (ev) {
        try { window.L.DomEvent.stopPropagation(ev); } catch (err) {}
        waypoint({ lat: +p.lat, lng: +p.lng, name: p.name || p.raw || "Here", id: p.id, kind: p.kind || "shirt", phone: p.phone || "" });
      });
      shirtLayer.addLayer(mk);
    });
    shirtLayer.addTo(m);
    setHunt(shirts);
  }
  function paintHop() {
    var m = map();
    if (!m || !window.L) return;
    if (hopLayer) { try { m.removeLayer(hopLayer); } catch (e) {} hopLayer = null; }
    if (driverMark) { try { m.removeLayer(driverMark); } catch (e2) {} driverMark = null; }
    hopLayer = window.L.layerGroup();
    function hop(p, label, color) {
      if (!p || !isFinite(+p.lat)) return;
      var mk = window.L.circleMarker([p.lat, p.lng], { radius: 9, color: color, fillColor: color, fillOpacity: 1, weight: 2 });
      mk.bindTooltip(label, { permanent: true, direction: "right", offset: [10, 0], className: "sn-tip" });
      hopLayer.addLayer(mk);
    }
    if (fromPin) hop(fromPin, "FROM " + (fromPin.name || ""), "#19e68c");
    if (toPin) hop(toPin, "TO " + (toPin.name || ""), "#e8c56b");
    if (fromPin && toPin) {
      hopLayer.addLayer(window.L.polyline([[fromPin.lat, fromPin.lng], [toPin.lat, toPin.lng]], { color: "#4df0ff", weight: 3, opacity: 0.85 }));
    }
    hopLayer.addTo(m);
    var chosen = fromPin ? chooseDriver(fromPin) : null;
    if (chosen && isFinite(+chosen.lat)) {
      driverMark = window.L.circleMarker([chosen.lat, chosen.lng], { radius: 9, color: "#19e68c", fillColor: "#19e68c", fillOpacity: 1, weight: 2 });
      driverMark.bindTooltip("DRIVER " + (chosen.name || ""), { permanent: true, direction: "right", offset: [10, 0], className: "sn-tip" });
      driverMark.addTo(m);
    }
  }
  function reverse(p, cb) {
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
        var name = [pr.street, pr.housenumber, pr.name, pr.city || pr.locality].filter(Boolean).join(" ");
        cb(name || p.name || "Here");
      })
      .catch(function () { cb(p.name || "Here"); });
  }
  function overpass(lat, lng) {
    var q = "[out:json][timeout:12];(node[\"shop\"](around:" + SCOUT_M + "," + lat + "," + lng + ");node[\"amenity\"~\"restaurant|cafe|fast_food|bar|pharmacy|marketplace\"](around:" + SCOUT_M + "," + lat + "," + lng + "););out body 16;";
    var urls = [
      "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q),
      "https://overpass.kumi.systems/api/interpreter?data=" + encodeURIComponent(q)
    ];
    function one(i) {
      if (i >= urls.length) return Promise.resolve([]);
      return fetch(urls[i], { headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
        var out = [], seen = {};
        (j.elements || []).forEach(function (el) {
          var t = el.tags || {};
          var la = el.lat != null ? +el.lat : (el.center && +el.center.lat);
          var ln = el.lon != null ? +el.lon : (el.center && +el.center.lon);
          var name = String(t.name || t.brand || "").trim();
          if (!name || !isFinite(la)) return;
          var k = keyOf(la, ln);
          if (seen[k]) return;
          seen[k] = 1;
          out.push({ id: "osm-" + k, name: name, lat: la, lng: ln, raw: [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ") || name, kind: "shirt", phone: t.phone || t["contact:phone"] || "" });
        });
        return out;
      }).catch(function () { return one(i + 1); });
    }
    return one(0);
  }
  function wrapZoom() {
    var m = map();
    if (m && m.setView && !m.setView.__s4200) {
      var sv = m.setView.bind(m);
      m.setView = function () {
        if (window.__SN_NO_ZOOM) return m;
        return sv.apply(m, arguments);
      };
      m.setView.__s4200 = true;
    }
    if (window.SN && SN.showMap && !SN.showMap.__s4200) {
      var sm = SN.showMap;
      SN.showMap = function () {
        if (window.__SN_NO_ZOOM) return;
        return sm.apply(this, arguments);
      };
      SN.showMap.__s4200 = true;
    }
    if (window.SN && SN.showCity && !SN.showCity.__s4200) {
      var sc = SN.showCity;
      SN.showCity = function () {
        if (window.__SN_NO_ZOOM) return;
        return sc.apply(this, arguments);
      };
      SN.showCity.__s4200 = true;
    }
  }
  function scout(p) {
    if (!p || !isFinite(+p.lat)) return;
    var my = ++gen;
    wipeShirts();
    shirts = [{ lat: +p.lat, lng: +p.lng, name: p.name || "Here", kind: "shirt" }];
    setHunt(shirts);
    paintShirts();
    talk("Looking at this place…");
    reverse(p, function (name) {
      if (my !== gen) return;
      shirts[0].name = name;
      paintShirts();
    });
    overpass(p.lat, p.lng).then(function (found) {
      if (my !== gen) return;
      var tap = shirts[0] || { lat: +p.lat, lng: +p.lng, name: p.name || "Here", kind: "shirt" };
      var seen = {};
      seen[keyOf(tap.lat, tap.lng)] = 1;
      var list = [tap];
      (found || []).forEach(function (s) {
        var k = keyOf(s.lat, s.lng);
        if (seen[k]) return;
        seen[k] = 1;
        list.push(s);
      });
      shirts = list.slice(0, SCOUT_MAX);
      setHunt(shirts);
      paintShirts();
      var n = shirts.length;
      var msg;
      if (fromPin && toPin) msg = n + " here. Two waypoints locked. System chooses the driver — they accept in JOBS.";
      else if (fromPin) msg = n + " here. Click a pin for the drop — your location, or another shirt.";
      else if (!n) msg = "Nothing named here. Zoom in, tap again, or drop a pin and click it.";
      else msg = n + " here. Click a pin to lock the vendor waypoint.";
      talk(msg);
    });
  }
  function waypoint(p) {
    if (!p || !isFinite(+p.lat)) return;
    window.__SN_ARMED_PIN = true;
    window.__SN_NO_ZOOM = true;
    if (!fromPin) {
      fromPin = p;
      if (window.SNPlusJob && SNPlusJob.start) SNPlusJob.start("job", p);
      else if (window.SNPlusJob && SNPlusJob.pick) SNPlusJob.pick(p);
      talk("Start: " + (p.name || "pin") + ". Click a pin for the drop — your location, or another shirt.");
    } else if (!toPin) {
      toPin = p;
      if (window.SNPlusJob && SNPlusJob.pick) SNPlusJob.pick(p);
      var chosen = chooseDriver(fromPin);
      paintHop();
      talk(chosen
        ? ("Drop: " + (p.name || "pin") + ". System chose " + (chosen.name || "a driver") + ". They accept in JOBS.")
        : ("Drop: " + (p.name || "pin") + ". No driver listed yet — job stays offered until a driver accepts."));
    } else if (window.SNPlusJob && SNPlusJob.pick) {
      SNPlusJob.pick(p);
    }
    window.__SN_ARMED_PIN = false;
    window.__SN_NO_ZOOM = false;
    paintHop();
  }
  function wrapPlus() {
    if (!window.SNPlusJob) return;
    if (SNPlusJob.start && !SNPlusJob.start.__s4200) {
      var st = SNPlusJob.start;
      SNPlusJob.start = function (kind, p) {
        window.__SN_NO_ZOOM = true;
        if (p && isFinite(+p.lat)) window.__SN_ARMED_PIN = true;
        if (kind === "job" && p && isFinite(+p.lat) && !fromPin) fromPin = p;
        var r = st.apply(this, arguments);
        window.__SN_ARMED_PIN = false;
        window.__SN_NO_ZOOM = false;
        paintHop();
        return r;
      };
      SNPlusJob.start.__s4200 = true;
    }
    if (SNPlusJob.pick && !SNPlusJob.pick.__s4200) {
      var pk = SNPlusJob.pick;
      SNPlusJob.pick = function (p) {
        if (window.__SN_ARMED_PIN || (p && (p.kind === "shop" || p.kind === "shirt" || p.id))) {
          var r = pk.apply(this, arguments);
          if (p && isFinite(+p.lat)) {
            if (!fromPin) fromPin = p;
            else if (!toPin && (Math.abs(p.lat - fromPin.lat) > 1e-6 || Math.abs(p.lng - fromPin.lng) > 1e-6)) toPin = p;
          }
          paintHop();
          return r;
        }
        scout(p);
        return true;
      };
      SNPlusJob.pick.__s4200 = true;
    }
  }
  function wrapStore() {
    var raw = localStorage.setItem.bind(localStorage);
    if (localStorage.setItem.__s4200) return;
    localStorage.setItem = function (k, v) {
      if (k === "sn:tasks") {
        try {
          var list = JSON.parse(v);
          if (list && list[0] && list[0].kind === "job" && list[0].status === "paid") {
            var row = list[0];
            var chosen = chooseDriver(row.from);
            row.status = "offered";
            if (chosen) {
              row.driver = { id: chosen.id, name: chosen.name, email: chosen.email || "", lat: chosen.lat, lng: chosen.lng, phone: chosen.phone || "" };
              row.driverEmail = chosen.email || "";
              row.driverId = chosen.id || "";
            } else {
              row.driver = null;
              row.driverEmail = "";
              row.driverId = "";
            }
            v = JSON.stringify(list);
          }
        } catch (e) {}
      }
      return raw(k, v);
    };
    localStorage.setItem.__s4200 = true;
  }
  function wrapAccept() {
    var el = document.getElementById("sn-jobs-stack");
    if (!el || el.__s4200) return;
    el.__s4200 = true;
    el.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest("[data-act=yes]");
      if (!b) return;
      var me = meDriver();
      setTimeout(function () {
        try {
          var list = JSON.parse(localStorage.getItem("sn:tasks") || "[]") || [];
          var id = b.getAttribute("data-id");
          for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === id && list[i].status === "accepted") {
              if (list[i].driverId && me && list[i].driverId !== me.id) {
                list[i].status = "offered";
                talk("That job is already taken.");
              } else if (me) {
                list[i].driver = { id: me.id, name: me.name, email: me.email || "", phone: me.phone || "" };
                list[i].driverEmail = me.email || "";
                list[i].driverId = me.id;
              }
              localStorage.setItem("sn:tasks", JSON.stringify(list.slice(0, 80)));
              break;
            }
          }
        } catch (err) {}
      }, 0);
    }, true);
  }
  function injectAccept() {
    var el = document.getElementById("sn-jobs-stack");
    if (!el || !el.classList.contains("on")) return;
    if (el.querySelector("[data-act=yes]")) return;
    if (!/Status: offered/i.test(el.textContent || "")) return;
    var me = meDriver();
    var owner = false;
    try {
      var u = JSON.parse(localStorage.getItem("sn:user") || "null");
      var mail = String((u && (u.email || u.user_email)) || "").toLowerCase();
      owner = mail === "notisastranov@gmail.com" || localStorage.getItem("sn:admin") === "1";
    } catch (e) {}
    if (!me && !owner) return;
    var back = el.querySelector("[data-act=back]");
    var id = "";
    var open = el.querySelector("[data-id]");
    if (open) id = open.getAttribute("data-id") || "";
    var yes = document.createElement("button");
    yes.type = "button";
    yes.className = "yes";
    yes.setAttribute("data-act", "yes");
    if (id) yes.setAttribute("data-id", id);
    yes.textContent = "ACCEPT";
    var no = document.createElement("button");
    no.type = "button";
    no.className = "no";
    no.setAttribute("data-act", "no");
    if (id) no.setAttribute("data-id", id);
    no.textContent = "DECLINE";
    if (back && back.parentNode) {
      back.parentNode.insertBefore(yes, back);
      back.parentNode.insertBefore(no, back);
    } else {
      el.appendChild(yes);
      el.appendChild(no);
    }
  }
  function bindCity() {
    var el = document.getElementById("city");
    if (!el || el.__s4200) return;
    el.__s4200 = true;
    el.addEventListener("click", function (e) {
      if (!el.classList.contains("on")) return;
      if (e.target && e.target.closest && e.target.closest("#sn-place,#sn-plus3,#sn-jobq,#plus,#go,#in,#panel,#sn-jobs-stack,#sn-verify")) return;
      var m = map();
      if (!m || !m.mouseEventToLatLng) return;
      var pin = e.target && e.target.closest && e.target.closest(".leaflet-marker-icon,.sn-shirt-wrap,.sn-hold-pin,.sn-red-shirt,.sn-keep,.sn-hop-keep");
      var ll = m.mouseEventToLatLng(e);
      if (!ll) return;
      if (pin) {
        var hit = null, d = 99, i;
        for (i = 0; i < shirts.length; i++) {
          var k = km(ll, shirts[i]);
          if (k < d) { d = k; hit = shirts[i]; }
        }
        if (hit && d < 0.08) {
          e.stopImmediatePropagation();
          e.preventDefault();
          waypoint(hit);
          return;
        }
        if (pin.classList.contains("sn-hold-pin") || (pin.querySelector && pin.querySelector(".sn-hold-dot"))) {
          e.stopImmediatePropagation();
          e.preventDefault();
          waypoint({ lat: +ll.lat, lng: +ll.lng, name: "PIN" });
          return;
        }
        return;
      }
      e.stopImmediatePropagation();
      e.preventDefault();
      scout({ lat: +ll.lat, lng: +ll.lng, name: "PIN" });
    }, true);
  }
  function bindHoldClick() {
    var m = map();
    if (!m || !m.eachLayer) return;
    m.eachLayer(function (layer) {
      var ic = layer && layer._icon;
      if (!ic || !ic.classList || layer.__s4200) return;
      if (ic.classList.contains("sn-hold-pin") || ic.classList.contains("sn-shirt-wrap") || ic.classList.contains("sn-keep")) {
        layer.__s4200 = true;
        layer.on("click", function (ev) {
          try { window.L.DomEvent.stopPropagation(ev); } catch (err) {}
          var ll = layer.getLatLng && layer.getLatLng();
          if (!ll) return;
          waypoint({ lat: ll.lat, lng: ll.lng, name: "PIN" });
        });
      }
    });
  }
  function tick() {
    wrapPlus();
    wrapStore();
    wrapAccept();
    wrapZoom();
    bindCity();
    bindHoldClick();
    injectAccept();
  }
  tick();
  setInterval(tick, 700);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
