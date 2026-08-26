(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826161000-finish";
  var SRC = [
    "/js/spacenet/grid-os-20260825063200.js?v=" + BUILD,
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
    if (g && /unavailable|pool/i.test(g.textContent || "")) g.textContent = "";
    if (g && window.SNAuth && SNAuth.user) g.classList.add("gone");
    else if (g && !g.children.length && !/unavailable/i.test(g.textContent || "")) {
      if (!g.querySelector("button")) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pill live";
        b.textContent = "Sign in";
        b.onclick = function () {
          if (window.SNAuth && SNAuth.signInGoogle) SNAuth.signInGoogle();
          else if (window.SN && SN.say) SN.say("Sign in loading · tap again");
        };
        g.appendChild(b);
        g.classList.remove("gone");
      }
    }
    document.querySelectorAll("#cli-in,#stc-cmd-in,#sn-topchrome,#cli-coach,#fbh-s").forEach(function (n) {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
  }

  function centerGlobe() {
    try {
      if (window.SN && SN.set) { SN.set("pitch", 0.12); SN.set("dist", 2.15); }
    } catch (e) {}
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    stripJunk();
    centerGlobe();
    setInterval(stripJunk, 2500);
    try {
      if (window.SN && SN.hook) {
        SN.hook("onInput", function () { stripJunk(); });
      }
    } catch (eH) {}
  }

  function load(i) {
    if (i >= SRC.length) { afterKernel(); return; }
    var s = document.createElement("script");
    s.src = SRC[i];
    s.onload = function () { afterKernel(); };
    s.onerror = function () { load(i + 1); };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { load(0); });
  else load(0);
})();
