/* Astranov mute · Build 20260823220000-combine-pizza
 * Kill beeps + load ALL locked guest modules in ONE chain (no wipe):
 *   (a) chrome-guest-pizza-hunt — OSM restaurant/fast_food/cafe around camera, intercept BEFORE research-stay
 *   (b) chrome-research-stay (#164) — FULL inline, Grok /api/ai allow_paid:true, camera stay
 *   (c) chrome-guest-laptop-hunt (#132 f58b8a7) — EXACT 20260823034000-laptop-flylie bytes
 *   (d) chrome-ai-listen (#169) — FULL inline, Talk → Listen · mic denied · #sn-rib-hf-hit
 *   (e) chrome-call-arc (#129) — CALL Sign-in wall, no u-room, no VIDEO CALL
 *   (f) chrome-cli-answer (#126) — twin CLI force-paint only (no chrome restyle)
 * Currency ⭐. Guest never hits Google until pay/CALL. Origin = live camera.
 * loadChain injects LOCAL /js/spacenet files only. No runtime GitHub or CDN fetch.
 * Cache-bust 20260823220000-combine-pizza. Marks prevent double-inject wipe.
 */
(function (global) {
  'use strict';
  var BUILD = '20260823220000-combine-pizza';
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

  function hasMark(mark) {
    try {
      if (document.querySelector('script[' + mark + ']')) return true;
    } catch (_) {}
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

  function loadChain() {
    loadScript('/js/spacenet/chrome-cli-answer.js', 'data-sn-cli-answer');
    loadScript('/js/spacenet/chrome-guest-pizza-hunt.js', 'data-sn-guest-pizza');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt.js', 'data-sn-guest-laptop');
    loadScript('/js/spacenet/chrome-research-stay.js', 'data-sn-research-stay');
    loadScript('/js/spacenet/chrome-call-arc.js', 'data-sn-call-arc');
    loadScript('/js/spacenet/chrome-ai-listen.js', 'data-sn-ai-listen');
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
    if (
      global.__SN_MUTE_ALERTS &&
      !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive))
    )
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
