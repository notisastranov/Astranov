/* SpaceNet 4202 — long-press drops a draggable pin. 3-option rectangle follows it. Clicks do not start a job. Quote stays off the map until from and to are both set. */
(function () {
  if (window.__SN_PIN_4202) return;
  window.__SN_PIN_4202 = true;

  var HOLD_MS = 420;
  var pin = null;
  var at = null;
  var lp = null;
  var ignoreUntil = 0;
  var dragging = false;

  var css = document.createElement("style");
  css.id = "sn-4202-css";
  css.textContent =
    "#sn-place.on{display:block!important;position:fixed!important;z-index:190!important;min-width:168px;max-width:min(220px,78vw);padding:8px;border-radius:14px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.96);box-sizing:border-box;pointer-events:auto;right:auto!important;bottom:auto!important;transform:none!important}" +
    "#sn-place .ttl{font:800 11px/1.2 system-ui;letter-spacing:.08em;color:#4df0ff;margin:0 0 6px}" +
    "#sn-place button{display:block;width:100%;margin:0 0 6px;padding:10px;border-radius:10px;border:1px solid rgba(80,220,255,.28);background:rgba(2,8,18,.9);color:#e8fbff;text-align:left;font:800 13px/1.2 system-ui}" +
    "#sn-plus3.on.sn-follow{position:fixed!important;right:auto!important;bottom:auto!important;transform:none!important;left:var(--sn-plus-x,16px)!important;top:var(--sn-plus-y,72px)!important}" +
    ".sn-hold-pin{background:transparent!important;border:0!important}" +
    ".sn-hold-dot{width:22px;height:22px;margin:0 auto;border-radius:999px 999px 999px 4px;transform:rotate(-45deg);background:#ff3b4e;border:2px solid #4df0ff;box-shadow:0 0 10px rgba(77,240,255,.8)}" +
    "body.sn-placing #sn-jobq,body.sn-placing #sn-jobs-stack{display:none!important}";
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
    ["sn-jobq", "sn-jobs-stack", "sn-plus3"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("on");
    });
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
    document.documentElement.style.setProperty("--sn-plus-y", (y + 12) + "px");
    var el = document.getElementById("sn-place");
    if (el) {
      el.style.setProperty("left", x + "px", "important");
      el.style.setProperty("top", (y + 12) + "px", "important");
      el.style.setProperty("right", "auto", "important");
      el.style.setProperty("bottom", "auto", "important");
      el.style.setProperty("transform", "none", "important");
      el.classList.add("loose");
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
    pin = window.L.marker([p.lat, p.lng], { draggable: true, autoPan: true, keyboard: false, zIndexOffset: 1200, icon: icon }).addTo(m);
    pin.on("dragstart", function () { dragging = true; document.body.classList.add("sn-placing"); });
    pin.on("drag", function () {
      var ll = pin.getLatLng();
      at = { lat: ll.lat, lng: ll.lng, name: (at && at.name) || "PIN" };
      parkMenu(llToScreen(ll));
    });
    pin.on("dragend", function () {
      dragging = false;
      var ll = pin.getLatLng();
      at = { lat: ll.lat, lng: ll.lng, name: (at && at.name) || "PIN" };
      parkMenu(llToScreen(ll));
      reverse(at);
      try { if (window.SN && SN.talk) SN.talk("Pin at " + (at.name || "this place") + ". Drag to correct, then pick."); } catch (e) {}
    });
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
    el.classList.add("on", "loose");
    if (!el.__sn4202) {
      el.__sn4202 = true;
      el.addEventListener("click", function (e) {
        var b = e.target && e.target.closest && e.target.closest("[data-act]");
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        var kind = b.getAttribute("data-act");
        el.classList.remove("on");
        document.body.classList.remove("sn-placing");
        if (window.SNPlusJob && SNPlusJob.start) SNPlusJob.start(kind, at);
      }, true);
    }
    parkMenu(screen || llToScreen(p));
    reverse(p);
  }
  function holdAt(p, screen) {
    if (!p || !isFinite(p.lat)) return;
    ignoreUntil = Date.now() + 1200;
    document.body.classList.add("sn-placing");
    hideFlood();
    if (picking() && window.SNPlusJob && SNPlusJob.pick) {
      SNPlusJob.pick(p);
      document.body.classList.remove("sn-placing");
      return;
    }
    dropPin(p);
    showRect(p, screen);
    try { if (window.SN && SN.talk) SN.talk("Hold pin. Drag it. Then pick."); } catch (e) {}
  }
  function stripClicks(m) {
    if (!m) return;
    m.__pf = true;
    m.__snMapTap = true;
    if (!m._events) return;
    ["click"].forEach(function (type) {
      var list = m._events[type];
      if (!list) return;
      if (!Array.isArray(list)) list = [list];
      var keep = [];
      for (var i = 0; i < list.length; i++) {
        var h = list[i];
        var s = "";
        try { s = Function.prototype.toString.call(h.fn || h); } catch (e) {}
        if (/onMap|startJob|name:\s*[\"']Drop[\"']|onTap\(/.test(s)) continue;
        keep.push(h);
      }
      m._events[type] = keep;
    });
    if (m.on && !m.__sn4202click) {
      m.__sn4202click = true;
      m.on("click", function (e) {
        if (Date.now() < ignoreUntil || dragging) {
          try { if (window.L && L.DomEvent) L.DomEvent.stop(e); } catch (err) {}
          return;
        }
      });
      m.on("move zoom", function () {
        if (at && pin) parkMenu(llToScreen(at));
      });
    }
  }
  function freezeShow() {
    if (!window.SNPlusJob) return;
    function show(p) {
      if (Date.now() < ignoreUntil) return;
      if (p && isFinite(p.lat)) holdAt(p, llToScreen(p));
    }
    try {
      Object.defineProperty(window.SNPlusJob, "showMenu", { configurable: true, enumerable: true, writable: true, value: show });
    } catch (e) {
      window.SNPlusJob.showMenu = show;
    }
    if (window.SNPlusJob.start && !window.SNPlusJob.start.__sn4202) {
      var st = window.SNPlusJob.start;
      window.SNPlusJob.start = function (kind, p) {
        hideFlood();
        document.body.classList.add("sn-placing");
        st(kind, p);
        var q = document.getElementById("sn-jobq");
        if (q) q.classList.remove("on");
        setTimeout(function () { document.body.classList.remove("sn-placing"); }, 400);
      };
      window.SNPlusJob.start.__sn4202 = true;
    }
    if (window.SNPlusFirst) {
      window.SNPlusFirst.startJob = function (p) { holdAt(p || at); };
      var dest = window.SNPlusFirst.dest;
      if (dest && !dest.__sn4202) {
        window.SNPlusFirst.dest = function (p) {
          if (Date.now() < ignoreUntil || dragging) return;
          dest(p);
        };
        window.SNPlusFirst.dest.__sn4202 = true;
      }
    }
  }
  function bindHold() {
    var el = city();
    if (!el) return;
    if (!el.__sn4202hold) {
      el.__sn4202hold = true;
      el.addEventListener("pointerdown", function (e) {
        if (!el.classList.contains("on")) return;
        if (e.target && e.target.closest && e.target.closest(".leaflet-control,#sn-place,#sn-plus3,#sn-jobq,#plus,#go,#in,#panel,.sn-hold-pin")) return;
        if (e.isPrimary === false) return;
        var m = map();
        lp = { x: e.clientX, y: e.clientY, at: Date.now() };
        if (m && m.dragging && m.dragging.disable) {
          lp.drag = true;
          setTimeout(function () {
            if (lp && m.dragging && m.dragging.disable) m.dragging.disable();
          }, 160);
        }
        lp.t = setTimeout(function () { fire(); }, HOLD_MS);
      }, true);
      el.addEventListener("pointermove", function (e) {
        if (!lp) return;
        if (Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 16) cancel(true);
      }, true);
      el.addEventListener("pointerup", function () { cancel(false); }, true);
      el.addEventListener("pointercancel", function () {
        if (lp && Date.now() - lp.at > 280) fire();
        else cancel(true);
      }, true);
    }
    var m = map();
    if (m && m.on && !m.__sn4202ctx) {
      m.__sn4202ctx = true;
      m.on("contextmenu", function (e) {
        try { if (e.originalEvent) e.originalEvent.preventDefault(); } catch (err) {}
        var p = e.latlng ? { lat: e.latlng.lat, lng: e.latlng.lng, name: "PIN" } : null;
        var oe = e.originalEvent;
        holdAt(p, oe ? { x: oe.clientX, y: oe.clientY } : null);
      });
    }
  }
  function fire() {
    if (!lp) return;
    var x = lp.x, y = lp.y;
    cancel(true);
    var m = map();
    if (!m || !m.mouseEventToLatLng) return;
    var ll = m.mouseEventToLatLng({ clientX: x, clientY: y });
    holdAt({ lat: ll.lat, lng: ll.lng, name: "PIN" }, { x: x, y: y });
  }
  function cancel(enableDrag) {
    if (!lp) return;
    clearTimeout(lp.t);
    var m = map();
    if (enableDrag && m && m.dragging && m.dragging.enable) m.dragging.enable();
    lp = null;
  }
  function tick() {
    freezeShow();
    stripClicks(map());
    bindHold();
    if (picking()) hideFlood();
    if (at && pin) parkMenu(llToScreen(at));
  }
  tick();
  setInterval(tick, 350);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
