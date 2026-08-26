(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826161000-finish";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js",
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@89c27dcb598c6989e863c653be894fb6dd28bf82/js/spacenet/grid-os.js"
  ];

  function ownerYes() {
    try {
      var u = window.SNAuth && SNAuth.user;
      var em = (u && (u.email || (u.user_metadata && u.user_metadata.email))) || "";
      return /notisastranov@gmail\.com/i.test(em) || !!(window.SNAuth && SNAuth.owner);
    } catch (e) { return false; }
  }

  function stripJunk() {
    var inEl = document.getElementById("in");
    if (inEl) inEl.placeholder = "Talk to Astranov SpaceNet Grok";
    ["bal", "pool"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (id === "pool") el.textContent = "ABC Supply";
      if (ownerYes()) { el.classList.add("on"); el.classList.remove("gone"); }
      else { el.classList.remove("on"); el.classList.add("gone"); }
    });
    var g = document.getElementById("btn-google");
    if (!g) return;
    if (/unavailable/i.test(g.textContent || "")) g.textContent = "";
    if (window.SNAuth && SNAuth.user) {
      g.classList.add("gone");
      return;
    }
    g.classList.remove("gone");
    if (!g.querySelector("button,iframe,div")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pill live";
      b.textContent = "Sign in";
      b.onclick = function () {
        if (window.SNAuth && SNAuth.signInGoogle) SNAuth.signInGoogle();
      };
      g.appendChild(b);
    }
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    stripJunk();
    setInterval(stripJunk, 2000);
    try {
      if (window.SN && SN.set) { SN.set("pitch", 0.12); SN.set("dist", 2.15); }
    } catch (e) {}
  }

  function load(i) {
    if (i >= SRC.length) { afterKernel(); return; }
    var s = document.createElement("script");
    s.src = SRC[i];
    s.onload = afterKernel;
    s.onerror = function () { load(i + 1); };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { load(0); });
  else load(0);
})();
