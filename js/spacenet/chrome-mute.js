/* Astranov mute · Build 20260824085000-pizza-osm
 * Kill beeps + load chrome-guest-pizza-hunt only:
 *   OSM Overpass around LIVE camera (amenity=fast_food|restaurant pizza)
 *   unique overlay pins · tap Shop · name · km · ⭐
 *   locked #127 flyGlobeTo / probe-signs · no Locate wall · Google only at HOLD/pay
 *   NEVER hunt via supabase /rest/v1/orders
 * Does NOT load chrome-guest-laptop-hunt, chrome-research-stay, chrome-research-stay2,
 * chrome-ai-listen, chrome-call-arc, chrome-nairobi-ladder, chrome-place-earth,
 * or chrome-cli-answer. Does NOT restyle #stc-cmd-in or placeholders.
 * loadChain injects LOCAL /js/spacenet files only. No runtime GitHub or CDN fetch.
 * Cache-bust 20260824085000-pizza-osm. Marks prevent double-inject wipe.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824085000-pizza-osm';
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

  function hasMark(mark) {
    try {
      if (document.querySelector('script[' + mark + ']')) return true;
    } catch (_) {}
    return false;
  }

  function loadScript(src, mark) {
    try {
      if (hasMark(mark)) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      s.setAttribute(mark, '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function loadChain() {
    try {
      var nodes = document.querySelectorAll(
        'script[src*="chrome-guest-pizza-hunt.js"], script[data-sn-guest-pizza]'
      );
      var i;
      for (i = 0; i < nodes.length; i++) {
        var src = String(nodes[i].getAttribute('src') || nodes[i].src || '');
        if (src.indexOf(BUILD) >= 0 || nodes[i].getAttribute('data-sn-guest-pizza-osm') === '1') {
          return;
        }
        try {
          if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
        } catch (_) {}
      }
    } catch (_) {}
    loadScript('/js/spacenet/chrome-guest-pizza-hunt.js', 'data-sn-guest-pizza-osm');
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
    loadChain();
    if (
      global.__SN_MUTE_ALERTS &&
      !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive))
    )
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
