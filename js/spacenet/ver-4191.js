/* SpaceNet 4191 — existing #ver slot shows the running build. No HUD restyle. */
(function () {
  if (window.__SN_VER_4191) return;
  window.__SN_VER_4191 = true;

  var css = document.createElement("style");
  css.id = "sn-4191-ver-css";
  css.textContent = "#ver{display:inline!important;visibility:visible!important;opacity:1!important}";
  (document.head || document.documentElement).appendChild(css);

  function digits(s) {
    var m = String(s || "").match(/(\d{4,})/);
    return m ? m[1] : "";
  }
  function running() {
    var m = document.querySelector('meta[name="astranov-build"]');
    var fromMeta = digits(m && m.getAttribute("content"));
    var last = fromMeta;
    document.querySelectorAll("script[src]").forEach(function (el) {
      var v = digits(el.getAttribute("src") || el.src || "");
      if (v && (!last || +v > +last)) last = v;
    });
    return last || "";
  }
  function paint(n) {
    n = digits(n);
    if (!n) return;
    var el = document.getElementById("ver");
    if (!el) return;
    if (el.textContent !== n) el.textContent = n;
    el.setAttribute("title", "build " + n);
    window.__SN_BUILD = n;
  }
  function tick() {
    paint(running());
  }
  tick();
  fetch("/VERSION?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.text(); })
    .then(function (t) {
      var live = digits(t);
      var now = running();
      paint(now || live);
    })
    .catch(function () { tick(); });
  setInterval(tick, 2000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
