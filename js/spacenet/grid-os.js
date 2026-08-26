(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826171500-quiet";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js"
  ];
  var RHODES = { lat: 36.4341, lng: 28.2176, name: "Rhodes" };
  var voiceOn = false;
  var rec = null;
  var wantVoice = false; /* never auto-loop — Android beeps on restart */
  var lastSpoken = "";

  function say(t) {
    var el = document.getElementById("line");
    if (el && t != null) {
      el.textContent = String(t);
      el.classList.remove("gone");
    }
    try {
      if (window.SN && SN.say) SN.say(t);
    } catch (e) {}
  }

  function speak(t) {
    t = String(t || "").trim();
    if (!t || t === lastSpoken) return;
    if (t.length < 2) return;
    lastSpoken = t;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.rate = 1.02;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function muteBeeps() {
    try {
      if (navigator.vibrate) {
        navigator.vibrate = function () {
          return false;
        };
      }
    } catch (e) {}
  }

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
        var bad =
          /unavailable|google unavailable/i.test(txt) ||
          txt === "Google" ||
          !g.querySelector("button.pill");
        if (bad) signInPill(g);
      }
    }
    var line = document.getElementById("line");
    if (line) {
      var t = line.textContent || "";
      if (
        /don.?t have access to your accounts|grant location permission|private logins|I can only display/i.test(
          t
        )
      ) {
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
      if (window.SN && SN.set) {
        SN.set("yaw", 0.55);
        SN.set("pitch", 0.12);
        SN.set("dist", 2.15);
      }
    } catch (e) {}
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

  function materialize(id, label, fn) {
    var slot = liveSlot();
    if (!slot) return null;
    var b = document.getElementById(id);
    if (!b) {
      b = document.createElement("button");
      b.id = id;
      b.type = "button";
      slot.appendChild(b);
    }
    b.textContent = label;
    b.onclick = function (e) {
      e.preventDefault();
      fn();
    };
    return b;
  }

  function dematerialize(id) {
    var b = document.getElementById(id);
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function paintMic(on) {
    var go = document.getElementById("go");
    if (!go) return;
    if (on) go.classList.add("listen");
    else go.classList.remove("listen");
  }

  function runText(t) {
    t = (t || "").trim();
    if (!t) return;
    var inEl = document.getElementById("in");
    if (inEl) inEl.value = "";
    try {
      if (window.SN && typeof SN.run === "function") {
        SN.run(t);
        return;
      }
    } catch (e) {}
    var form = document.getElementById("f");
    if (form && inEl) {
      inEl.value = t;
      try {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      } catch (e2) {}
    }
  }

  /* one-shot listen — NO continuous restart (that beeps on Android) */
  function startListenOnce() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      say("voice unavailable — type below");
      return;
    }
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
    rec.maxAlternatives = 1;
    voiceOn = true;
    paintMic(true);
    rec.onresult = function (ev) {
      var i,
        t = "",
        final = false;
      for (i = ev.resultIndex; i < ev.results.length; i++) {
        t += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final = true;
      }
      var inEl = document.getElementById("in");
      if (inEl) inEl.value = t;
      if (final && t.trim()) {
        voiceOn = false;
        paintMic(false);
        runText(t);
      }
    };
    rec.onerror = function () {
      voiceOn = false;
      paintMic(false);
    };
    rec.onend = function () {
      voiceOn = false;
      paintMic(false);
      /* deliberate: no auto-restart */
    };
    try {
      rec.start();
    } catch (e3) {
      voiceOn = false;
      paintMic(false);
    }
  }

  function stopVoice() {
    wantVoice = false;
    voiceOn = false;
    paintMic(false);
    if (rec) {
      try {
        rec.onend = null;
        rec.stop();
      } catch (e) {}
      rec = null;
    }
  }

  function doLocate() {
    if (!navigator.geolocation) {
      try {
        if (window.SN) {
          if (SN.set) SN.set("here", RHODES);
          if (SN.flyTo) SN.flyTo(RHODES.lat, RHODES.lng);
        }
      } catch (e) {}
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "You"
        };
        try {
          if (window.SN) {
            if (SN.set) SN.set("here", p);
            if (SN.flyTo) SN.flyTo(p.lat, p.lng);
            if (SN.locate) SN.locate();
          }
        } catch (e) {}
      },
      function () {
        try {
          if (window.SN) {
            if (SN.set) SN.set("here", RHODES);
            if (SN.flyTo) SN.flyTo(RHODES.lat, RHODES.lng);
          }
        } catch (e2) {}
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  function doHunt(what) {
    what = what || "pizza";
    try {
      if (window.SN && SN.hunt) {
        SN.hunt(what);
        return;
      }
      if (window.SN && SN.eval) {
        SN.eval(
          "huntAround('" +
            String(what).replace(/'/g, "") +
            "', here || {lat:36.4341,lng:28.2176})"
        );
      }
    } catch (e) {}
  }

  function armGo() {
    var go = document.getElementById("go");
    if (!go || go.__snVoice) return;
    go.__snVoice = true;
    go.addEventListener(
      "click",
      function (ev) {
        var inEl = document.getElementById("in");
        if (inEl && inEl.value.trim()) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (voiceOn) {
          stopVoice();
        } else {
          startListenOnce();
        }
      },
      true
    );
  }

  function watchLineSpeak() {
    var line = document.getElementById("line");
    if (!line || line.__snSpeakWatch) return;
    line.__snSpeakWatch = true;
    var last = line.textContent || "";
    setInterval(function () {
      var t = (line.textContent || "").trim();
      if (!t || t === last || t === "…" || t === "...") return;
      if (/^listening$|^voice off$|^Rhodes$/i.test(t)) {
        last = t;
        return;
      }
      last = t;
      speak(t);
    }, 700);
  }

  function bootTalk() {
    if (window.__SN_BOOTED_TALK) return;
    window.__SN_BOOTED_TALK = true;
    muteBeeps();
    var msg =
      "Astranov SpaceNet Grok online. Sign in when you want. Spin the globe. Tell me what to do.";
    say(msg);
    speak(msg);
    /* NO auto continuous mic — that beeps on Android Chrome */
    setTimeout(doLocate, 900);
  }

  function arm() {
    materialize("sn-btn-locate", "LOCATE", doLocate);
    materialize("sn-btn-pizza", "PIZZA", function () {
      doHunt("pizza");
    });
    armGo();
    centerGlobe();
    watchLineSpeak();

    if (!window.SN) window.SN = {};
    window.SN.materialize = materialize;
    window.SN.dematerialize = dematerialize;
    window.SN.doLocate = doLocate;
    window.SN.doHunt = doHunt;
    window.SN.startVoice = startListenOnce;
    window.SN.stopVoice = stopVoice;

    var form = document.getElementById("f");
    if (form && !form.__snAct) {
      form.__snAct = true;
      form.addEventListener(
        "submit",
        function (ev) {
          var inEl = document.getElementById("in");
          var raw = ((inEl && inEl.value) || "").trim();
          var q = raw.toLowerCase();
          if (!q) return;
          if (/^(locate|me|here|gps)$/.test(q)) {
            ev.preventDefault();
            ev.stopPropagation();
            if (inEl) inEl.value = "";
            doLocate();
            return false;
          }
          if (/^pizza$/.test(q) || /^order pizza$/.test(q)) {
            ev.preventDefault();
            ev.stopPropagation();
            if (inEl) inEl.value = "";
            doHunt("pizza");
            return false;
          }
          setTimeout(stripJunk, 600);
          setTimeout(stripJunk, 1600);
        },
        true
      );
    }
  }

  function afterKernel() {
    window.__SN_ALIVE = true;
    window.__SN_FULL = true;
    muteBeeps();
    stripJunk();
    arm();
    centerGlobe();
    setTimeout(centerGlobe, 400);
    setTimeout(centerGlobe, 1200);
    setTimeout(bootTalk, 900);
    setInterval(function () {
      stripJunk();
      arm();
      centerGlobe();
    }, 2500);
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
