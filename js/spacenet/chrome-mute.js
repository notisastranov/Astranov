/* Astranov mute · Build 20260824125000-hold-gsi
 * Kill beeps + load chrome-hold-pay-20260824125000.js (guest HOLD ⭐ / pay
 * → CALL-style native Google Sign-in card: Sign in with Google · Privacy · Terms · Cancel).
 * Primary load is the <script> tag in index.html. loadChain is a backup if
 * that tag is missing (cached HTML). Skip only if the NEW hold-gsi script is
 * already in the document. Native OAuth button — never a GIS iframe.
 * No DRIVER EN ROUTE. Wallet stays ⭐ 0.00.
 * Does NOT load chrome-guest-pizza-hunt, chrome-call-arc,
 * chrome-nairobi-ladder, chrome-kalithea-village,
 * chrome-guest-laptop-hunt, chrome-research-stay, or chrome-ai-listen.
 * Does NOT overwrite SNGlobe.flyGlobeTo when a sibling already defined it.
 * Does NOT restyle twin CLI chrome. Leaves github.io untouched.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824125000-hold-gsi';
  var HOLD_SRC = '/js/spacenet/chrome-hold-pay-20260824125000.js';
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;

  function silenceSpeech() {
    try {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
    } catch (_) {}
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
                try {
                  osc.frequency.value = 0;
                } catch (_) {}
                return;
              }
              return start.apply(osc, arguments);
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

  function hasHoldScript() {
    try {
      if (document.querySelector('script[src*="chrome-hold-pay-20260824125000.js"]')) return true;
      if (global.SNHoldPay && SNHoldPay.build === BUILD) return true;
    } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasHoldScript()) return;
      if (document.querySelector('script[' + mark + '="gsi"]')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, 'gsi');
      s.setAttribute('data-sn-hold-gsi', '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function loadChain() {
    if (hasHoldScript()) return;
    loadScript(HOLD_SRC, 'data-sn-hold-pay');
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
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
  setTimeout(loadChain, 800);
  setTimeout(loadChain, 2500);
  setInterval(function () {
    patchAudio();
    patchFieldAlerts();
    softGateHandsfree();
    if (
      global.__SN_MUTE_ALERTS &&
      !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive))
    )
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
