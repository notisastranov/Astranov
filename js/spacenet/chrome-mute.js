/* Astranov mute · Build 20260827123000-hold-tap
 * NEW PR against main. ONE BOX ONLY: guest HOLD star from a hunt tap.
 * Do not merge #219 or #220. Earth + pizza stay as-is.
 * Earth: chrome-place-earth-20260827114000.js (FULL JS >10KB).
 * Pizza: chrome-guest-pizza-cam-20260827121000.js (FULL JS >10KB).
 * HOLD:  chrome-hold-pay-20260827123000.js (FULL JS >10KB, locked #180 overlay).
 * No laptop, no CALL, no twin CLI. Box 1 stays #126.
 * Guest pizza hunts from live SNGlobe.viewLatLng (Nairobi). No GPS.
 */
(function (global) {
  "use strict";
  var BUILD = "20260827123000-hold-tap";
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;
  global.__SN_MUTE_NUKE = false;

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

  function hideLeaflet() {
    try {
      var el = document.getElementById("city");
      if (!el) return;
      try { el.classList.remove("on"); } catch (_) {}
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("pointer-events", "none", "important");
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("visibility", "hidden", "important");
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
      if (typeof g.viewLatLng !== "function") return false;
      if (typeof g.flyGlobeTo !== "function") return false;
      if (typeof g.pulse !== "function") return false;
      if (typeof g.getEarth !== "function") return false;
      if (typeof g.getCamera !== "function") return false;
      return true;
    } catch (_) {}
    return false;
  }

  function loadChain() {
    hideLeaflet();
    loadScript("/js/spacenet/chrome-place-earth-20260827114000.js", "data-sn-place-earth");
    try {
      if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === "function") SNPlaceEarth.ensure();
    } catch (_) {}
    if (isLiveGlobe()) {
      loadScript("/js/spacenet/chrome-guest-pizza-cam-20260827121000.js", "data-sn-pizza-cam");
    }
    loadScript("/js/spacenet/chrome-hold-pay-20260827123000.js", "data-sn-hold-pay");
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    hideLeaflet();
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
  setTimeout(loadChain, 400);
  setTimeout(loadChain, 1200);
  setInterval(function () {
    patchAudio();
    hideLeaflet();
    if (!isLiveGlobe()) loadChain();
    else {
      loadScript("/js/spacenet/chrome-guest-pizza-cam-20260827121000.js", "data-sn-pizza-cam");
      loadScript("/js/spacenet/chrome-hold-pay-20260827123000.js", "data-sn-hold-pay");
    }
    if (global.__SN_MUTE_ALERTS) silenceSpeech();
  }, 4000);

  global.SNChromeMute = {
    build: BUILD,
    silence: silenceSpeech,
    loadChain: loadChain,
    isLiveGlobe: isLiveGlobe,
  };
})(typeof window !== "undefined" ? window : globalThis);
