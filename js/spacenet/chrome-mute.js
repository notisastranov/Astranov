/* Astranov mute · Build 20260824131000-twin-cli
 * Kill beeps + load chrome-cli-answer-20260824131000.js (guest twin CLI:
 * HUD #stc-cmd-in + bottom #cli-in both visible, both POST /api/ai
 * allow_paid:true, camera stays on research/photosynthesis).
 * Primary load is the <script> tag in index.html. loadChain is a backup if
 * that tag is missing (cached HTML). Skip only if the NEW twin-cli script is
 * already in the document.
 * Does NOT load chrome-guest-pizza-hunt, chrome-call-arc,
 * chrome-nairobi-ladder, chrome-kalithea-village,
 * chrome-guest-laptop-hunt, chrome-research-stay, chrome-ai-listen,
 * or chrome-hold-pay.
 * Does NOT overwrite SNGlobe.flyGlobeTo when a sibling already defined it.
 * Does NOT restyle other chrome. Leaves github.io untouched.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824131000-twin-cli';
  var CLI_SRC = '/js/spacenet/chrome-cli-answer-20260824131000.js';
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

  function hasCliScript() {
    try {
      if (document.querySelector('script[src*="chrome-cli-answer-20260824131000.js"]')) return true;
      if (global.SNChromeCliAnswer && SNChromeCliAnswer.build === BUILD) return true;
    } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasCliScript()) return;
      if (document.querySelector('script[' + mark + '="1"]')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, '1');
      s.setAttribute('data-sn-cli-answer', '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function loadChain() {
    if (hasCliScript()) return;
    loadScript(CLI_SRC, 'data-sn-cli-answer');
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
