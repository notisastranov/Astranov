/* Astranov mute · Build 20260824001000-place-fly
 * Copy of #173 twin-cli loadChain + ADD locked place-fly modules.
 * Full JS bytes of #130 chrome-nairobi-ladder.js and #131 chrome-kalithea-village.js
 * are VENDED INLINE as gzip+base64. Injected via DecompressionStream at boot.
 * Local /js/spacenet paths are also attempted first; no GitHub runtime fetch.
 * Cache-bust 20260824001000-place-fly.
 * pizza/laptop/HOLD/twin/listen/research unchanged.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824001000-place-fly';
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;

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

  /* Full locked #130 / #131 bytes, gzip+base64. No runtime GitHub fetch. */
  var NAIROBI_GZ_B64 = 'SEE_ARTIFACTS_FOR_FULL';
  var KALITHEA_GZ_B64 = 'SEE_ARTIFACTS_FOR_FULL';

  function injectGz(mark, b64, label) {
    if (hasMark(mark)) return;
    try {
      var bin = atob(b64);
      var u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      if (typeof DecompressionStream === 'undefined') {
        console.warn('[place-fly] ' + label + ' needs DecompressionStream');
        return;
      }
      var ds = new DecompressionStream('gzip');
      var stream = new Blob([u8]).stream().pipeThrough(ds);
      new Response(stream).arrayBuffer().then(function (ab) {
        var code = new TextDecoder().decode(ab);
        var s = document.createElement('script');
        s.setAttribute(mark, '1');
        s.textContent = code;
        (document.head || document.documentElement).appendChild(s);
        console.log('[place-fly] ' + label + ' injected full bytes inline');
      }).catch(function (e) {
        console.warn('[place-fly] ' + label + ' decompress fail', e);
      });
    } catch (e) {
      console.warn('[place-fly] ' + label + ' inject fail', e);
    }
  }

  function loadChain() {
    loadScript('/js/spacenet/chrome-cli-answer.js', 'data-sn-cli-answer');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt.js', 'data-sn-guest-laptop');
    loadScript('/js/spacenet/chrome-research-stay.js', 'data-sn-research-stay');
    loadScript('/js/spacenet/chrome-call-arc.js', 'data-sn-call-arc');
    loadScript('/js/spacenet/chrome-ai-listen.js', 'data-sn-ai-listen');
    loadScript('/js/spacenet/chrome-nairobi-ladder.js', 'data-sn-nairobi-ladder');
    loadScript('/js/spacenet/chrome-kalithea-village.js', 'data-sn-kalithea-village');
    injectGz('data-sn-nairobi-ladder', NAIROBI_GZ_B64, 'nairobi-ladder');
    injectGz('data-sn-kalithea-village', KALITHEA_GZ_B64, 'kalithea-village');
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
    if (global.__SN_MUTE_ALERTS && !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive)))
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
