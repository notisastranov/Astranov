/* Astranov mute · Build 20260817093000
 * Kill alert beeps, oscillator spam, auto speechSynthesis noise.
 * Loads live Supabase delivery wire (vendors/orders) — no demo CLI.
 */
(function (global) {
  'use strict';
  var BUILD = '20260817093000-mute-live-delivery';
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

  function loadLiveDelivery() {
    try {
      if (global.SNChromeLiveDelivery) return;
      if (document.querySelector('script[data-sn-live-delivery]')) return;
      var s = document.createElement('script');
      s.src = '/js/spacenet/chrome-live-delivery.js?v=' + BUILD;
      s.async = true;
      s.dataset.snLiveDelivery = '1';
      s.onerror = function () {
        try {
          console.warn('[chrome-mute] live-delivery script miss');
        } catch (_) {}
      };
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
    loadLiveDelivery();
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
  setTimeout(loadLiveDelivery, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadLiveDelivery: loadLiveDelivery };
})(typeof window !== 'undefined' ? window : globalThis);
