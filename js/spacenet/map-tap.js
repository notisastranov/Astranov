/* SpaceNet 4146 — map tap = Post a job / Post something / Call somebody */
(function () {
  if (window.__snMapTap) return;
  window.__snMapTap = true;
  function getMap() {
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    return window.__snLeaflet || null;
  }
  function point(e, map) {
    if (e && e.latlng) return { lat: +e.latlng.lat, lng: +e.latlng.lng, name: "This place" };
    var g = document.getElementById("g");
    if (g && e && e.clientX != null && map && map.containerPointToLatLng) {
      var r = g.getBoundingClientRect();
      var ll = map.containerPointToLatLng([e.clientX - r.left, e.clientY - r.top]);
      if (ll) return { lat: +ll.lat, lng: +ll.lng, name: "This place" };
    }
    return null;
  }
  function tapping() {
    var bar = document.getElementById("sn-pick");
    return !!(bar && bar.classList.contains("on"));
  }
  function onTap(p) {
    if (!p || !isFinite(p.lat) || !window.SNPlusJob) return;
    if (tapping() && SNPlusJob.pick) { SNPlusJob.pick(p); return; }
    if (SNPlusJob.showMenu) SNPlusJob.showMenu(p);
  }
  function bind() {
    var m = getMap();
    if (m && m.on && !m.__snMapTap) {
      m.__snMapTap = true;
      m.on("click", function (e) { onTap(point(e, m)); });
      m.on("contextmenu", function (e) {
        if (e.originalEvent) e.originalEvent.preventDefault();
        onTap(point(e, m));
      });
    }
    var g = document.getElementById("g");
    if (g && !g.__snMapTap) {
      g.__snMapTap = true;
      g.addEventListener("click", function (e) {
        if (e.target && e.target.closest && e.target.closest("#plus,#go,#in,#panel,#sn-plus3,#sn-jobq,#sn-vis")) return;
        onTap(point(e, getMap()));
      }, true);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setInterval(bind, 1500);
})();
