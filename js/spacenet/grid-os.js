(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826162500-tasks";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js"
  ];
  var RHODES = { lat: 36.4341, lng: 28.2176, name: "Rhodes" };

  function say(t) {
    var el = document.getElementById("line");
    if (el && t) { el.textContent = t; el.classList.remove("gone"); }
    try { if (window.SN && SN.say) SN.say(t); } catch (e) {}
  }

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
    var line = document.getElementById("line");
    if (line) {
      var t = line.textContent || "";
      if (/don.?t have access to your accounts|grant location permission|private logins/i.test(t)) {
        line.textContent = "Tap LOCATE to pin you, or PIZZA to hunt kitchens on the globe (Rhodes fallback if GPS is off).";
      }
    }
    document.querySelectorAll("#cli-in,#stc-cmd-in,#sn-topchrome,#cli-coach,#fbh-s").forEach(function (n) {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
  }

  function liveSlot() {
    var slot = document.getElementById("sn-live");
    if (!slot) {
      slot = document.createElement("div");
      slot.id = "sn-live";
      slot.setAttribute("data-slot", "controls");
      var panel = document.getElementById("panel");
      var form = document.getElementById("f");
      if (panel && form) panel.insertBefore(slot, form);
      else if (panel) panel.appendChild(slot);
    }
    return slot;
  }

  function btn(id, label, fn) {
    var slot = liveSlot();
    if (!slot) return;
    var old = document.getElementById(id);
    if (old) old.onclick = fn;
    else {
      var b = document.createElement("button");
      b.id = id;
      b.type = "button";
      b.textContent = label;
      b.onclick = fn;
      slot.appendChild(b);
    }
  }

  function doLocate() {
    say("requesting GPS · allow location in the browser prompt");
    if (!navigator.geolocation) {
      say("no GPS on this device · using Rhodes · hunt continues");
      if (window.SN) {
        try { SN.set && SN.set("here", RHODES); } catch (e0) {}
        try { SN.flyTo && SN.flyTo(RHODES.lat, RHODES.lng); } catch (e1) {}
        try { SN.hunt && SN.hunt("pizza"); } catch (e2) {}
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var p = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "You" };
        say("you · " + p.lat.toFixed(4) + ", " + p.lng.toFixed(4) + " · pinning");
        try {
          if (window.SN) {
            if (SN.set) SN.set("here", p);
            if (SN.flyTo) SN.flyTo(p.lat, p.lng);
            if (SN.locate) SN.locate();
            if (SN.hunt) SN.hunt("pizza");
          }
        } catch (e) {}
      },
      function (err) {
        say("GPS denied or timed out · Rhodes fallback · kitchens on globe");
        try {
          if (window.SN) {
            if (SN.set) SN.set("here", RHODES);
            if (SN.flyTo) SN.flyTo(RHODES.lat, RHODES.lng);
            if (SN.hunt) SN.hunt("pizza");
          }
        } catch (e3) {}
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  function doPizza() {
    say("hunting pizza · painting vendors on the globe");
    try {
      if (window.SN && SN.hunt) {
        SN.hunt("pizza");
        return;
      }
      if (window.SN && SN.eval) {
        SN.eval("huntAround('pizza', here || {lat:36.4341,lng:28.2176})");
        return;
      }
    } catch (e) {}
    say("kernel hunt armed · type pizza again if pins miss");
  }

  function armTasks() {
    btn("sn-btn-locate", "LOCATE", function (e) { e.preventDefault(); doLocate(); });
    btn("sn-btn-pizza", "PIZZA", function (e) { e.preventDefault(); doPizza(); });

    var form = document.getElementById("f");
    if (form && !form.__snTaskHook) {
      form.__snTaskHook = true;
      form.addEventListener(
        "submit",
        function (ev) {
          var inEl = document.getElementById("in");
          var q = ((inEl && inEl.value) || "").trim().toLowerCase();
          if (!q) return;
          if (/^(locate|me|here|gps|where am i)/.test(q)) {
            ev.preventDefault();
            ev.stopPropagation();
            if (inEl) inEl.value = "";
            doLocate();
            return false;
          }
          if (/\bpizza\b|\border\b|\bdeliver|\bfood\b|\bkitchens?\b/.test(q)) {
            /* let kernel handle, but if AI lectures, stripJunk fixes line */
            setTimeout(function () {
              doPizza();
              stripJunk();
            }, 400);
          }
        },
        true
      );
    }
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    stripJunk();
    armTasks();
    setInterval(function () {
      stripJunk();
      armTasks();
    }, 900);
    say("LOCATE pins you · PIZZA paints kitchens · talk for the rest");
  }

  function load(i) {
    if (i >= SRC.length) {
      afterKernel();
      return;
    }
    var s = document.createElement("script");
    s.src = SRC[i];
    s.onload = afterKernel;
    s.onerror = function () {
      load(i + 1);
    };
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
