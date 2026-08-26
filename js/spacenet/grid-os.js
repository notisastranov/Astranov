(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826161200-finish";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js"
  ];

  function ownerYes() {
    try {
      var u = window.SNAuth && SNAuth.user;
      var em = (u && (u.email || (u.user_metadata && u.user_metadata.email))) || "";
      return /notisastranov@gmail\.com/i.test(em) || !!(window.SNAuth && SNAuth.owner);
    } catch (e) { return false; }
  }

  function hide(el) {
    if (!el) return;
    el.classList.add("gone");
    el.style.display = "none";
  }

  function signInPill(mount) {
    mount.innerHTML = "";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pill live";
    b.textContent = "Sign in";
    b.onclick = function (ev) {
      ev.preventDefault();
      if (window.SNAuth && SNAuth.signInGoogle) SNAuth.signInGoogle();
    };
    mount.appendChild(b);
    mount.classList.remove("gone");
    mount.style.display = "flex";
  }

  function stripJunk() {
    var inEl = document.getElementById("in");
    if (inEl) inEl.placeholder = "Talk to Astranov SpaceNet Grok";
    hide(document.getElementById("me"));
    hide(document.getElementById("mapbtn"));
    ["bal", "pool"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (id === "pool") el.textContent = "ABC Supply";
      if (ownerYes()) {
        el.classList.add("on");
        el.classList.remove("gone");
        el.style.display = "flex";
      } else hide(el);
    });
    var g = document.getElementById("btn-google");
    if (g) {
      if (window.SNAuth && SNAuth.user) hide(g);
      else {
        var txt = (g.textContent || "").replace(/\s+/g, " ").trim();
        var bad = /unavailable|google unavailable/i.test(txt) || txt === "Google" || !g.querySelector("button.pill");
        if (bad) signInPill(g);
      }
    }
    document.querySelectorAll("#cli-in,#stc-cmd-in,#sn-topchrome,#cli-coach,#fbh-s").forEach(function (n) {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    stripJunk();
    setInterval(stripJunk, 800);
  }

  function load(i) {
    if (i >= SRC.length) { afterKernel(); return; }
    var s = document.createElement("script");
    s.src = SRC[i];
    s.onload = afterKernel;
    s.onerror = function () { load(i + 1); };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      stripJunk();
      load(0);
    });
  } else {
    stripJunk();
    load(0);
  }
})();
