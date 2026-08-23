/* Astranov mute · Build 20260824011000-place-earth
 * PR #174 only. Do not merge. Does not edit #130/#131.
 * Guest / must serve the ASTRANOV globe (public/index.html is Vercel output).
 *
 * Load order: chrome-place-earth (SNGlobe / flyGlobeTo adapter) BEFORE
 * chrome-nairobi-ladder.js (37083) and chrome-kalithea-village.js (43964).
 * Those two scripts do not load until SNGlobe.flyGlobeTo exists.
 * No runtime GitHub fetch. Cache-bust 20260824011000-place-earth.
 * pizza/laptop/HOLD/twin/listen/research unchanged.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824011000-place-earth';
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
      if (typeof SNCli.toggleHandsfree === 'function') {
        var prev = SNCli.toggleHandsfree.bind(SNCli);
        SNCli.toggleHandsfree = function () {
          global.__SN_MUTE_BEEPS = true;
          return prev();
        };
      }
    } catch (_) {}
  }

  function hasMark(mark) {
    try { if (document.querySelector('script[' + mark + ']')) return true; } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasMark(mark)) return;
      if (document.querySelector('script[src*="' + src.replace(/^\/js\/spacenet\//, '') + '"]')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function snGlobeFlyReady() {
    try {
      if (!global.SNGlobe) return false;
      if (typeof SNGlobe.flyGlobeTo !== 'function') return false;
      if (typeof SNGlobe.viewLatLng !== 'function') return false;
      if (SNGlobe.ready === true) return true;
      if (typeof SNGlobe.getEarth === 'function' && SNGlobe.getEarth()) return true;
    } catch (_) {}
    return false;
  }

  function loadPlaceScripts() {
    loadScript('/js/spacenet/chrome-nairobi-ladder.js', 'data-sn-nairobi-ladder');
    loadScript('/js/spacenet/chrome-kalithea-village.js', 'data-sn-kalithea-village');
  }

  function waitThenLoadPlaces() {
    if (hasMark('data-sn-nairobi-ladder') && hasMark('data-sn-kalithea-village')) return;
    try {
      if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === 'function') SNPlaceEarth.ensure();
    } catch (_) {}
    if (snGlobeFlyReady()) {
      loadPlaceScripts();
      return;
    }
    if (placesQueued) return;
    placesQueued = true;
    var tries = 0;
    function tick() {
      tries++;
      try {
        if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === 'function') SNPlaceEarth.ensure();
      } catch (_) {}
      if (snGlobeFlyReady() || tries > 80) {
        loadPlaceScripts();
        return;
      }
      setTimeout(tick, 100);
    }
    setTimeout(tick, 0);
  }

  function loadChain() {
    loadScript('/js/spacenet/chrome-place-earth.js', 'data-sn-place-earth');
    loadScript('/js/spacenet/chrome-cli-answer.js', 'data-sn-cli-answer');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt.js', 'data-sn-guest-laptop');
    loadScript('/js/spacenet/chrome-research-stay.js', 'data-sn-research-stay');
    loadScript('/js/spacenet/chrome-call-arc.js', 'data-sn-call-arc');
    loadScript('/js/spacenet/chrome-ai-listen.js', 'data-sn-ai-listen');
    waitThenLoadPlaces();
    loadScript('/js/spacenet/chrome-guest-pizza-hunt.js', 'data-sn-guest-pizza');
    loadScript('/js/spacenet/chrome-hold-pay.js', 'data-sn-hold-pay');
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
    loadChain();
  }

  boot();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
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
    waitThenLoadPlaces();
    if (global.__SN_MUTE_ALERTS && !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive)))
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
