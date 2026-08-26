(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826173500-gold";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js"
  ];

  /* LAW: this file is a finish layer only.
     Never overwrite SN.materialize / dematerialize / fly / run / gold / patch.
     Kernel IS the developed Grok. No terminology training. */

  function ownerYes() {
    try {
      var u = window.SNAuth && SNAuth.user;
      var em = (u && (u.email || (u.user_metadata && u.user_metadata.email))) || "";
      return /notisastranov@gmail\.com/i.test(em) || !!(window.SNAuth && SNAuth.owner);
    } catch (e) {
      return false;
    }
  }

  function hide(el) {
    if (!el) return;
    el.classList.add("gone");
    el.style.display = "none";
  }

  function signInPill(mount) {
    if (!mount) return;
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

  function stripGhosts() {
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
        if (/unavailable|google unavailable/i.test(txt) || txt === "Google" || !g.querySelector("button.pill"))
          signInPill(g);
      }
    }
    var line = document.getElementById("line");
    if (line) {
      var t = line.textContent || "";
      if (/don.?t have access to your accounts|grant location permission|private logins|I can only display/i.test(t)) {
        line.textContent = "";
        line.classList.add("gone");
      }
    }
    document
      .querySelectorAll("#cli-in,#stc-cmd-in,#sn-topchrome,#cli-coach,#fbh-s")
      .forEach(function (n) {
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
  }

  function centerGlobe() {
    try {
      if (!window.SN || !SN.set) return;
      SN.set("yaw", 0.55);
      SN.set("pitch", 0.12);
      SN.set("dist", 2.15);
    } catch (e) {}
  }

  function muteNoise() {
    try {
      if (navigator.vibrate)
        navigator.vibrate = function () {
          return false;
        };
    } catch (e) {}
  }

  /* one-shot mic only — never continuous restart (Android beeps) */
  var rec = null;
  var voiceOn = false;
  function paintMic(on) {
    var go = document.getElementById("go");
    if (!go) return;
    if (on) go.classList.add("listen");
    else go.classList.remove("listen");
  }
  function listenOnce() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (rec) {
      try {
        rec.onend = null;
        rec.stop();
      } catch (e) {}
      rec = null;
    }
    rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    voiceOn = true;
    paintMic(true);
    rec.onresult = function (ev) {
      var i,
        t = "",
        fin = false;
      for (i = ev.resultIndex; i < ev.results.length; i++) {
        t += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fin = true;
      }
      var inEl = document.getElementById("in");
      if (inEl) inEl.value = t;
      if (fin && t.trim()) {
        voiceOn = false;
        paintMic(false);
        if (window.SN && typeof SN.run === "function") SN.run(t.trim());
        else if (inEl) {
          inEl.value = t.trim();
          var f = document.getElementById("f");
          if (f) f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      }
    };
    rec.onerror = function () {
      voiceOn = false;
      paintMic(false);
    };
    rec.onend = function () {
      voiceOn = false;
      paintMic(false);
    };
    try {
      rec.start();
    } catch (e2) {
      voiceOn = false;
      paintMic(false);
    }
  }
  function armMic() {
    var go = document.getElementById("go");
    if (!go || go.__snGoldMic) return;
    go.__snGoldMic = true;
    go.addEventListener(
      "click",
      function (ev) {
        var inEl = document.getElementById("in");
        if (inEl && inEl.value.trim()) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (voiceOn) {
          try {
            if (rec) rec.stop();
          } catch (e) {}
          voiceOn = false;
          paintMic(false);
        } else listenOnce();
      },
      true
    );
  }

  function armKernelControls() {
    /* use KERNEL materialize only — never replace SN.materialize */
    if (!window.SN || typeof SN.materialize !== "function") return;
    if (window.__SN_GOLD_ARMED) return;
    window.__SN_GOLD_ARMED = true;
    try {
      SN.materialize({
        id: "locate",
        kind: "button",
        label: "LOCATE",
        run: "locate"
      });
      SN.materialize({
        id: "fly-rhodes",
        kind: "button",
        label: "RHODES",
        run: "go Rhodes Greece"
      });
    } catch (e) {}
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    muteNoise();
    stripGhosts();
    centerGlobe();
    armMic();
    armKernelControls();
    setTimeout(centerGlobe, 500);
    setTimeout(centerGlobe, 1500);
    setTimeout(armKernelControls, 800);
    setInterval(function () {
      stripGhosts();
      centerGlobe();
      armMic();
    }, 3000);
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
      stripGhosts();
      load(0);
    });
  } else {
    stripGhosts();
    load(0);
  }
})();
