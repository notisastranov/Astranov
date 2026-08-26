(function () {
  "use strict";
  if (window.__SN_GRID_FINISH) return;
  window.__SN_GRID_FINISH = true;
  var BUILD = "20260826165500-voice";
  var SRC = [
    "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@1c4e3ea85800d7c74c5bf9a0d2a2d5a9b8e7a6e8/js/spacenet/grid-os.js"
  ];
  var RHODES = { lat: 36.4341, lng: 28.2176, name: "Rhodes" };
  var voiceOn = false;
  var rec = null;
  var wantVoice = true;

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
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(t));
      u.rate = 1.02;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
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

  function startContinuousVoice() {
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
    rec.continuous = true;
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
        runText(t);
      }
    };
    rec.onerror = function (ev) {
      if (ev && (ev.error === "not-allowed" || ev.error === "service-not-allowed")) {
        wantVoice = false;
        voiceOn = false;
        paintMic(false);
        say("mic blocked — type below");
        return;
      }
      /* restart unless user stopped */
      if (wantVoice) {
        setTimeout(function () {
          if (wantVoice) startContinuousVoice();
        }, 400);
      }
    };
    rec.onend = function () {
      voiceOn = false;
      paintMic(false);
      if (wantVoice) {
        setTimeout(function () {
          if (wantVoice) startContinuousVoice();
        }, 250);
      }
    };
    try {
      rec.start();
      voiceOn = true;
      paintMic(true);
    } catch (e3) {
      voiceOn = false;
      paintMic(false);
      setTimeout(function () {
        if (wantVoice) startContinuousVoice();
      }, 800);
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
        if (inEl && inEl.value.trim()) return; /* send path */
        ev.preventDefault();
        ev.stopPropagation();
        if (wantVoice && voiceOn) {
          stopVoice();
          say("voice off");
        } else {
          wantVoice = true;
          startContinuousVoice();
          say("listening");
        }
      },
      true
    );
  }

  function bootTalk() {
    if (window.__SN_BOOTED_TALK) return;
    window.__SN_BOOTED_TALK = true;
    var msg =
      "Astranov SpaceNet Grok online. Sign in when you want. Spin the globe. Say what you need.";
    say(msg);
    speak(msg);
    /* permissions without blocking the UI */
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(function (stream) {
            try {
              stream.getTracks().forEach(function (t) {
                t.stop();
              });
            } catch (e) {}
            wantVoice = true;
            startContinuousVoice();
          })
          .catch(function () {
            wantVoice = true;
            startContinuousVoice();
          });
      } else {
        wantVoice = true;
        startContinuousVoice();
      }
    } catch (e2) {
      wantVoice = true;
      setTimeout(startContinuousVoice, 500);
    }
    setTimeout(doLocate, 700);
  }

  function arm() {
    materialize("sn-btn-locate", "LOCATE", doLocate);
    materialize("sn-btn-pizza", "PIZZA", function () {
      doHunt("pizza");
    });
    armGo();
    centerGlobe();

    if (!window.SN) window.SN = {};
    window.SN.materialize = materialize;
    window.SN.dematerialize = dematerialize;
    window.SN.doLocate = doLocate;
    window.SN.doHunt = doHunt;
    window.SN.startVoice = function () {
      wantVoice = true;
      startContinuousVoice();
    };
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
    }, 2000);
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
