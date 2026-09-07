/* SpaceNet 4190 — hide shop dump (pills + red doors) so the map does not flash. Hunt pins stay. No HUD restyle. */
(function () {
  if (window.__SN_ROUTE_4190) return;
  window.__SN_ROUTE_4190 = true;

  var css = document.createElement("style");
  css.id = "sn-4190-css";
  css.textContent =
    ".sn-pillpin.shop,.leaflet-marker-icon.sn-pillpin.shop,.leaflet-div-icon.sn-pillpin.shop," +
    ".sn-pillpin.tax,.leaflet-marker-icon.sn-pillpin.tax," +
    ".sn-door-wrap,.leaflet-marker-icon.sn-door-wrap,.sn-red-door{" +
    "display:none!important;visibility:hidden!important;pointer-events:none!important}" +
    ".sn-pillpin.shop.sn-keep,.leaflet-marker-icon.sn-pillpin.shop.sn-keep," +
    ".sn-door-wrap.sn-keep,.leaflet-marker-icon.sn-door-wrap.sn-keep," +
    ".sn-keep .sn-red-door,.sn-pillpin.sn-keep,.leaflet-marker-icon.sn-keep{" +
    "display:flex!important;visibility:visible!important;pointer-events:auto!important}" +
    "#city.sn-route .sn-radar-wrap.hot,#city.sn-looking .sn-radar-wrap.hot," +
    "#city.sn-route .sn-radar-ring.hot,#city.sn-looking .sn-radar-ring.hot{display:none!important}";
  (document.documentElement || document.head).appendChild(css);

  function keyOf(lat, lng) {
    return Number(lat).toFixed(4) + "|" + Number(lng).toFixed(4);
  }
  function huntList() {
    var h = window.__SN_LAST_HUNT && window.__SN_LAST_HUNT.list;
    return Array.isArray(h) ? h.slice(0, 12) : [];
  }
  function looking() {
    return huntList().length > 0;
  }
  function routing() {
    return !!(
      document.getElementById("sn-pick") ||
      document.getElementById("sn-jobq") ||
      document.querySelector("[data-act=cancel-pick]")
    );
  }
  function keepKeys() {
    var keys = {};
    huntList().forEach(function (p) {
      if (p && isFinite(+p.lat) && isFinite(+p.lng)) keys[keyOf(p.lat, p.lng)] = 1;
    });
    return keys;
  }
  function mapObj() {
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    return null;
  }
  function markKeep() {
    var city = document.getElementById("city");
    if (city) {
      city.classList.toggle("sn-route", routing());
      city.classList.toggle("sn-looking", looking());
    }
    var keys = keepKeys();
    var look = looking();
    var m = mapObj();
    if (m && m._layers) {
      Object.keys(m._layers).forEach(function (id) {
        var layer = m._layers[id];
        var icon = layer && layer._icon;
        if (!icon || !icon.classList) return;
        var ll = layer.getLatLng && layer.getLatLng();
        var k = ll ? keyOf(ll.lat, ll.lng) : "";
        var keep = look && !!keys[k];
        icon.classList.toggle("sn-keep", keep);
      });
    }
    document.querySelectorAll(".sn-door-wrap,.sn-pillpin.shop,.sn-pillpin.tax").forEach(function (el) {
      if (el.classList.contains("sn-keep")) return;
      /* leftover DOM from a removed layer — stay hidden via CSS */
    });
  }

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var q = "";
    try { q = decodeURIComponent(String(url)); } catch (e) { q = String(url); }
    if (/overpass/.test(q) && /amenity~/.test(q) && /restaurant\|cafe\|fast_food/.test(q) && !looking()) {
      return Promise.resolve(new Response('{"elements":[]}', { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return origFetch.apply(this, arguments);
  };

  function wrapAutoList() {
    if (!window.SNWork || !SNWork.autoList || SNWork.autoList.__r4190) return;
    var prev = SNWork.autoList;
    SNWork.autoList = function (v, on) {
      if (!looking() && !on) return v;
      return prev.apply(this, arguments);
    };
    SNWork.autoList.__r4190 = true;
  }

  function tick() {
    wrapAutoList();
    markKeep();
  }
  setInterval(tick, 400);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
})();
