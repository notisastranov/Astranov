/* Astranov mute · Build 20260817102200
 * Kill alert beeps, oscillator spam, auto speechSynthesis noise.
 * Loads live Supabase delivery wire + guest order gate (Locate + Google).
 */
(function (global) {
  'use strict';
  var BUILD = '20260817102200-mute-live-guest';
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

  function inject(src, attr) {
    try {
      if (document.querySelector('script[' + attr + ']')) return;
      var s = document.createElement('script');
      s.src = src + '?v=' + BUILD;
      s.async = true;
      s.setAttribute(attr, '1');
      s.onerror = function () {
        try {
          console.warn('[chrome-mute] miss ' + src);
        } catch (_) {}
      };
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function loadLiveDelivery() {
    if (global.SNChromeLiveDelivery) return;
    inject('/js/spacenet/chrome-live-delivery.js', 'data-sn-live-delivery');
  }

  function loadGuestGate() {
    if (global.SNChromeGuestOrderGate) return;
    inject('/js/spacenet/chrome-guest-order-gate.js', 'data-sn-guest-order-gate');
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
    loadLiveDelivery();
    loadGuestGate();
  }

  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
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
  setTimeout(loadLiveDelivery, 1200);
  setTimeout(loadGuestGate, 1400);
  setTimeout(loadLiveDelivery, 4000);
  setTimeout(loadGuestGate, 4200);

  global.SNChromeMute = {
    build: BUILD,
    silence: silenceSpeech,
    loadLiveDelivery: loadLiveDelivery,
    loadGuestGate: loadGuestGate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
