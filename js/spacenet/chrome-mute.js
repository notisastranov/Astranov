/* Astranov mute · Build 20260823203000-ai-listen-hit2
 * Kill beeps + load chrome-ai-listen (guest SpeechRecognition → CLI → paid mind).
 * Primary load is the <script> tag in index.html. loadChain is a backup if
 * that tag is missing (cached HTML). Skip if chrome-ai-listen.js is already
 * in the document so inject-order cannot drop the hit layer.
 * Does NOT load chrome-guest-pizza-hunt (#127), chrome-call-arc (#129),
 * chrome-nairobi-ladder (#130), chrome-kalithea-village (#131),
 * chrome-guest-laptop-hunt (#132), or chrome-research-stay (#164).
 * Does NOT overwrite SNGlobe.flyGlobeTo when a sibling already defined it.
 */
(function (global) {
  'use strict';
  var BUILD = '20260823203000-ai-listen-hit2';
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

  function hasListenScript() {
    try {
      if (document.querySelector('script[data-sn-ai-listen]')) return true;
      if (document.querySelector('script[src*="chrome-ai-listen.js"]')) return true;
    } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasListenScript()) return;
      if (document.querySelector('script[' + mark + ']')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function loadChain() {
    if (hasListenScript()) return;
    loadScript('/js/spacenet/chrome-ai-listen.js', 'data-sn-ai-listen');
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
