/* Astranov mute · Build 20260824073000-nairobi-kenya
 * NEW PR against main. Does not edit #174 / #175 / #130 in place.
 * Does not merge. Does not restyle chrome.
 *
 * Guest nairobi currently flies to {4.73,-53.18} (French Guiana) on live.
 * This branch vendors:
 *   chrome-place-earth.js  (58890, locked #174 commit 380a563) FIRST
 *   chrome-nairobi-ladder.js (37083, locked #130) after live SNGlobe
 * so guest nairobi flies honestly to ~-1.286, 36.817 with Kenya land tiles
 * covering the camera, and CLI Nairobi · national / city / streets rungs.
 *
 * Wait until window.SNGlobe is the LIVE globe.js object
 * (pulse + getEarth + viewLatLng + flyGlobeTo) BEFORE nairobi-ladder.
 * No stub. No getter. No runtime GitHub fetch.
 * Does NOT load #175 research-stay. Does NOT load pizza / CALL / kalithea / laptop.
 */
(function (global) {
  "use strict";
  var BUILD = "20260824073000-nairobi-kenya";
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;
  var placesQueued = false;

  function silenceSpeech() {
    try { if (global.speechSynthesis) global.speechSynthesis.cancel(); } catch (_) {}
  }

  function patchAudio() {
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC && !AC.__snMuted) {
        AC.__snMuted = true;
        var orig = AC.prototype.createOscillator;
        if (orig) {
          AC.prototype.createOscillator = function () {
            var osc = orig.apply(this, arguments);
            var start = osc.start.bind(osc);
            osc.start = function () {
              if (global.__SN_MUTE_BEEPS) {
                try { osc.frequency.value = 0; } catch (_) {}
                return;
              }
              return start.apply(this, arguments);
            };
            return osc;
          };
        }
      }
    } catch (_) {}
  }

  function patchFieldAlerts() {
    try {
      if (global.SNField) {
        global.SNField.playAlertTone = function () {};
        global.SNField.showDeviceAlert = function () {};
      }
    } catch (_) {}
  }

  function softGateHandsfree() {
    try {
      if (!global.SNCli || SNCli.__snBeepGate) return;
      SNCli.__snBeepGate = true;
      if (typeof SNCli.toggleHandsfree === "function") {
        var prev = SNCli.toggleHandsfree.bind(SNCli);
        SNCli.toggleHandsfree = function () {
          global.__SN_MUTE_BEEPS = true;
          return prev();
        };
      }
    } catch (_) {}
  }

  function hasMark(mark) {
    try { if (document.querySelector("script[" + mark + "]")) return true; } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasMark(mark)) return;
      if (document.querySelector('script[src*="' + src.replace(/^\/js\/spacenet\//, "") + '"]')) return;
      var s = document.createElement("script");
      s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, "1");
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function isLiveGlobe() {
    try {
      var g = global.SNGlobe;
      if (!g || typeof g !== "object") return false;
      if (g.__snPlaceEarthThin) return false;
      if (typeof g.flyGlobeTo !== "function") return false;
      if (typeof g.viewLatLng !== "function") return false;
      if (typeof g.pulse !== "function") return false;
      if (typeof g.getEarth !== "function") return false;
      if (typeof g.getCamera !== "function") return false;
      if (g.ready === true) return true;
      if (g.getEarth()) return true;
      if (g.getCamera()) return true;
    } catch (_) {}
    return false;
  }

  function loadNairobiLadder() {
    loadScript("/js/spacenet/chrome-nairobi-ladder.js", "data-sn-nairobi-ladder");
  }

  function waitThenLoadNairobi() {
    if (hasMark("data-sn-nairobi-ladder")) return;
    try {
      if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === "function") SNPlaceEarth.ensure();
    } catch (_) {}
    if (isLiveGlobe()) {
      loadNairobiLadder();
      return;
    }
    if (placesQueued) return;
    placesQueued = true;
    var tries = 0;
    function tick() {
      tries++;
      try {
        if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === "function") SNPlaceEarth.ensure();
      } catch (_) {}
      if (isLiveGlobe()) {
        loadNairobiLadder();
        return;
      }
      if (tries > 120) {
        loadNairobiLadder();
        return;
      }
      setTimeout(tick, 100);
    }
    setTimeout(tick, 0);
  }

  function loadChain() {
    loadScript("/js/spacenet/chrome-place-earth.js", "data-sn-place-earth");
    waitThenLoadNairobi();
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
    loadChain();
  }

  boot();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      boot();
      loadChain();
    });
  } else {
    loadChain();
  }
  setTimeout(loadChain, 0);
  setTimeout(loadChain, 500);
  setTimeout(loadChain, 800);
  setTimeout(loadChain, 2500);
  setInterval(function () {
    patchAudio();
    patchFieldAlerts();
    softGateHandsfree();
    waitThenLoadNairobi();
    if (global.__SN_MUTE_ALERTS && !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive)))
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== "undefined" ? window : globalThis);
