/* SpaceNet 4197 — long-press drops a draggable pin. 3-option rectangle follows the pin. Clicks do not open menus or the job sheet. */
(function () {
  if (window.__SN_PIN_4197) return;
  window.__SN_PIN_4197 = true;

  var HOLD_MS = 650;
  var armed = false;
  var pin = null;
  var at = null;
  var lp = null;

  var css = document.createElement("style");
  css.id = "sn-4197-css";
  css.textContent =
    "#sn-place{position:fixed!important;z-index:150!important;min-width:168px;max-width:min(220px,78vw);padding:8px;border-radius:14px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.96);box-sizing:border-box;pointer-events:auto}" +
    "#sn-place .ttl{font:800 11px/1.2 system-ui;letter-spacing:.08em;color:#4df0ff;margin:0 0 6px}" +
    "#sn-place button{display:block;width:100%;margin:0 0 6px;padding:10px;border-radius:10px;border:1px solid rgba(80,220,255,.28);background:rgba(2,8,18,.9);color:#e8fbff;text-align:left;font:800 13px/1.2 system-ui}" +
    "#sn-plus3.on{position:fixed!important;left:var(--sn-plus-x,16px)!important;top:var(--sn-plus-y,72px)!important;right:auto!important;bottom:auto!important;transform:none!important}" +
    ".sn-hold-pin{background:transparent!important;border:0!important}" +
    ".sn-hold-dot{width:22px;height:22px;margin:0 auto;border-radius:999px 999px 999px 4px;transform:rotate(-45deg);background:#ff3b4e;border:2px solid #4df0ff;box-shadow:0 0 10px rgba(77,240,255,.8)}";
  (document.head || document.documentElement).appendChild(css);

  function map() {
    try { if (window.SN && SN.getMap) { var m = SN.getMap(); if (m) return m; } } catch (e) {}
    try { if (window.SN && SN.map) return SN.map; } catch (e2) {}
    return window.__snLeaflet || null;
  }
  function city() { return document.getElementById("city"); }
  function picking() {
    var bar = document.getElementById("sn-pick");
    return !!(bar && bar.classList.contains("on"));
  }
  function hideFlood() {
    ["sn-jobq", "sn-plus3"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("on");
    });
  }
  function hidePlace() {
    var el = document.getElementById("sn-place");
    if (el) { el.classList.remove("on"); el.innerHTML = ""; }
  }
  function llToScreen(ll) {
    var m = map();
    if (!m || !m.latLngToContainerPoint) return { x: 16, y: 72 };
    var box = city() && city().getBoundingClientRect();
    var pt = m.latLngToContainerPoint(ll);
    return { x: (box ? box.left : 0) + pt.x, y: (box ? box.top : 0) + pt.y };
  }
  function parkMenu(screen) {
    var x = Math.max(8, Math.min(innerWidth - 228, (screen && screen.x) || 16));
    var y = Math.max(8, Math.min(innerHeight - 220, (screen && screen.y) || 72));
    document.documentElement.style.setProperty("--sn-plus-x", x + "px");
    document.documentElement.style.setProperty("--sn-plus-y", y + "px");
    var el = document.getElementById("sn-place");
    if (el) {
      el.style.setProperty("left", x + "px", "important");
      el.style.setProperty("top", y + 12 + "px", "important");
      el.style.setProperty("right", "auto", "important");
      el.style.setProperty("bottom", "auto", "important");
    }
    var plus = document.getElementById("sn-plus3");
    if (plus && plus.classList.contains("on")) {
      plus.style.setProperty("left", x + "px", "important");
      plus.style.setProperty("top", y + 12 + "px", "important");
      plus.style.setProperty("right", "auto", "important");
      plus.style.setProperty("bottom", "auto", "important");
      plus.style.setProperty("transform", "none", "important");
    }
  }
  function reverse(p) {
    if (!p || !isFinite(p.lat)) return;
    fetch("https://photon.komoot.io/reverse?lat=" + p.lat + "&lon=" + p.lng)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pr = (j && j.features && j.features[0] && j.features[0].properties) || {};
        var name = [pr.street, pr.housenumber, pr.name, pr.city || pr.locality].filter(Boolean).join(" ");
        if (name) p.name = name;
        var ttl = document.querySelector("#sn-place .ttl");
        if (ttl && name) ttl.textContent = name;
      })
      .catch(function () {});
  }
  function dropPin(p) {
    var m = map();
    if (!m || !window.L || !p || !isFinite(p.lat)) return;
    if (pin) {
      try { m.removeLayer(pin); } catch (e) {}
      pin = null;
    }
    var icon = window.L.divIcon({
      className: "sn-hold-pin",
      html: '<div class="sn-hold-dot"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 20],
    });
    pin = window.L.marker([p.lat, p.lng], { draggable: true, autoPan: true, zIndexOffset: 900, icon: icon }).addTo(m);
    pin.on("drag", function () {
      var ll = pin.getLatLng();
      at = { lat: ll.lat, lng: ll.lng, name: (at && at.name) || "PIN" };
      parkMenu(llToScreen(ll));
    });
    pin.on("dragend", function () {
      var ll = pin.getLatLng();
      at = { lat: ll.lat, lng: ll.lng, name: (at && at.name) || "PIN" };
      parkMenu(llToScreen(ll));
      reverse(at);
      try { if (window.SN && SN.talk) SN.talk("Pin at " + (at.name || "this place") + ". Drag to correct, then pick."); } catch (e) {}
    });
  }
  function act(kind) {
    hidePlace();
    var plus = document.getElementById("sn-plus3");
    if (plus) plus.classList.remove("on");
    var p = at;
    if (!p || !isFinite(p.lat)) return;
    if (window.SNPlusJob && SNPlusJob.start) SNPlusJob.start(kind, p);
  }
  function showRect(p, screen) {
    at = p;
    hideFlood();
    var el = document.getElementById("sn-place");
    if (!el) {
      el = document.createElement("div");
      el.id = "sn-place";
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="ttl">' + (p && p.name ? p.name : "PIN") + "</div>" +
      '<button type="button" data-act="job">Post a job</button>' +
      '<button type="button" data-act="post">Post something</button>' +
      '<button type="button" data-act="call">Call somebody</button>';
    el.classList.add("on");
    if (!el.__sn4197) {
      el.__sn4197 = true;
      el.addEventListener("click", function (e) {
        var b = e.target && e.target.closest && e.target.closest("[data-act]");
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        act(b.getAttribute("data-act"));
      });
    }
    parkMenu(screen || llToScreen(p));
    reverse(p);
  }
  function holdAt(p, screen) {
    if (!p || !isFinite(p.lat)) return;
    if (picking() && window.SNPlusJob && SNPlusJob.pick) {
      SNPlusJob.pick(p);
      return;
    }
    dropPin(p);
    showRect(p, screen);
    try { if (window.SN && SN.talk) SN.talk("Hold pin. Drag it. Then pick."); } catch (e) {}
  }
  function wrapShow() {
    if (!window.SNPlusJob) return;
    SNPlusJob.showMenu = function (p) {
      if (!armed) return;
      var screen = p && isFinite(p.x) ? { x: p.x, y: p.y } : p ? llToScreen(p) : { x: 16, y: 72 };
      holdAt(p, screen);
    };
  }
  function mutePlusFirst() {
    var m = map();
    if (!m || !m._events || !m._events.click) return;
    var list = m._events.click;
    if (!Array.isArray(list)) list = [list];
    var keep = [];
    for (var i = 0; i < list.length; i++) {
      var h = list[i];
      var ok = true;
      try {
        var src = Function.prototype.toString.call(h.fn || h);
        if (src.indexOf("onMap") !== -1 || (src.indexOf("Drop") !== -1 && src.indexOf("latlng") !== -1)) ok = false;
        if (src.indexOf("SNPlusJob.showMenu") !== -1 || src.indexOf("showMenu") !== -1 && src.indexOf("onTap") !== -1) ok = false;
      } catch (e) {}
      if (ok) keep.push(h);
    }
    if (keep.length !== list.length) m._events.click = keep.length ? keep : [];
  }
  function bindHold() {
    var el = city();
    if (!el || el.__sn4197hold) return;
    el.__sn4197hold = true;
    el.addEventListener("pointerdown", function (e) {
      if (!el.classList.contains("on")) return;
      if (e.target && e.target.closest && e.target.closest(".leaflet-control,#sn-place,#sn-plus3,#sn-jobq,#plus,#go,#in,#panel")) return;
      if (e.isPrimary === false) return;
      lp = { x: e.clientX, y: e.clientY };
      lp.t = setTimeout(function () {
        if (!lp) return;
        var m = map();
        if (!m || !m.mouseEventToLatLng) return;
        var ll = m.mouseEventToLatLng({ clientX: lp.x, clientY: lp.y });
        armed = true;
        holdAt({ lat: ll.lat, lng: ll.lng, name: "PIN" }, { x: lp.x, y: lp.y });
        armed = false;
        lp = null;
      }, HOLD_MS);
    }, true);
    el.addEventListener("pointermove", function (e) {
      if (!lp) return;
      if (Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 14) {
        clearTimeout(lp.t);
        lp = null;
      }
    }, true);
    function end() {
      if (!lp) return;
      clearTimeout(lp.t);
      lp = null;
    }
    el.addEventListener("pointerup", end, true);
    el.addEventListener("pointercancel", end, true);
    var m = map();
    if (m && m.on && !m.__sn4197ctx) {
      m.__sn4197ctx = true;
      m.on("contextmenu", function (e) {
        try { if (e.originalEvent) e.originalEvent.preventDefault(); } catch (err) {}
        var p = e.latlng ? { lat: e.latlng.lat, lng: e.latlng.lng, name: "PIN" } : null;
        var oe = e.originalEvent;
        armed = true;
        holdAt(p, oe ? { x: oe.clientX, y: oe.clientY } : llToScreen(p));
        armed = false;
      });
    }
  }
  function tick() {
    wrapShow();
    mutePlusFirst();
    bindHold();
    if (picking()) {
      var q = document.getElementById("sn-jobq");
      if (q) q.classList.remove("on");
    }
  }
  tick();
  setInterval(tick, 500);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
