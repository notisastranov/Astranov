/* SpaceNet 4182 — island tap really wipes SW + caches and loads latest. */
(function () {
  if (window.__snWipe4182) return;
  window.__snWipe4182 = true;
  var VER = "4182";
  function line(t) { var el = document.getElementById("line"); if (el) el.textContent = t; }
  function css() {
    if (document.getElementById("sn-wipe-css")) return;
    var s = document.createElement("style"); s.id = "sn-wipe-css";
    s.textContent = "#top{z-index:200;pointer-events:none}#island{position:relative;z-index:210;pointer-events:auto}";
    document.head.appendChild(s);
  }
  function go(v) {
    var n = String(v || VER).replace(/[^\w.\-]/g, "") || VER;
    location.replace("/?v=" + n + "&t=" + Date.now() + "&wipe=1");
  }
  function wipe(e) {
    if (e) {
      if (e.target && e.target.closest && e.target.closest("#sn-money")) return;
      if (!e.target || !e.target.closest || !e.target.closest("#island")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    line("Wiping caches · loading latest…");
    var tasks = [];
    try { if (window.caches) tasks.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (err) {}
    try { if (navigator.serviceWorker) tasks.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })); } catch (err) {}
    Promise.all(tasks).then(function () {
      return fetch("/VERSION?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (t) {
        var m = String(t || "").match(/(\d{4,})/); go(m ? m[1] : VER);
      }).catch(function () { go(VER); });
    }).catch(function () { go(VER); });
    setTimeout(function () { go(VER); }, 1600);
  }
  window.SNReboot = wipe;
  css();
  document.addEventListener("click", wipe, true);
  document.addEventListener("pointerup", wipe, true);
})();
