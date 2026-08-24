/* Astranov mute · Build 20260824150000-avc-genesis
 * AVC genesis: treasury 2,000,000 AVC · work 33/h · gate 3× value
 * PATCH PR #182 only. Same branch, same Vercel alias. Does NOT merge, land,
 * restyle chrome, or edit locked PRs #175–#181 in place.
 *
 * KEEP: pizza leftover tap gone; Nairobi pizza chip Shop · Pizza Inn Ridgeways;
 * laptop electronics tap Shop · GNet (not YWCA); CLI hold → #sn-hold-signin;
 * CLI listen → Listen · mic denied.
 *
 * FAIL: laptop tap over Nairobi live camera teleported to Rhodes
 * (Vodafone / Κωτσόβολος / Syncom / GNet). Origin was starved/hardcoded.
 *
 * FIX: laptop hunt origin = LIVE camera (SNGlobe.viewLatLng). Overpass
 * electronics around that camera first; shops found → pin + stay put
 * (no flyGlobeTo Rhodes). Rhodes only when camera already near Aegean.
 *
 * ONE mute loadChain vendors ALL of:
 *   (earth)  chrome-place-earth-20260824133000.js
 *   (nairobi) chrome-nairobi-ladder-20260824133000.js
 *   (research) chrome-research-stay-20260824133000.js
 *   (pizza)  chrome-guest-pizza-land-20260824140000.js
 *   (laptop) chrome-guest-laptop-hunt-20260824144000.js
 *   (listen) chrome-ai-listen-20260824140000.js
 *   (hold)   chrome-hold-pay-20260824140000.js         CLI hold → #sn-hold-signin
 *   (avc)    chrome-avc-ledger-20260824150000.js       treasury 2M AVC · work 3×
 *   (twin)   chrome-cli-answer-20260824133000.js       #181 e56cc85
 *
 * Load order: adapter/earth FIRST, wait live SNGlobe, THEN nairobi,
 * research-stay, pizza, laptop, listen, hold, twin-cli LAST.
 * Cache-bust 20260824150000-avc-genesis.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824150000-avc-genesis';
  if (global.__snMuteAvcGenesis20260824150000) return;
  global.__snMuteAvcGenesis20260824150000 = 1;
  global.__snMuteCombineStay20260824144000 = 1;
  global.__snMuteCombineTap20260824140000 = 1;
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;
  var placesQueued = false;

  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;
  var LAPTOP_RE =
    /^(laptop|laptops|buy\s+(a\s+)?laptop|buy\s+laptops|order\s+(me\s+)?(a\s+)?laptop|get\s+(me\s+)?(a\s+)?laptop|find\s+(a\s+)?laptop|i\s+want\s+(a\s+)?laptop|need\s+(a\s+)?laptop)$/i;
  var HOLD_RE =
    /^(pay|hold|hold\s*⭐|hold\s*star|hold\s*stars?|hold\s*\/\s*pay|hold\s+pay|checkout|wallet|confirm\s+order|buy\s+now|order\s+now)\b/i;
  var LISTEN_RE = /^(listen|talk|speak|mic|handsfree|ai listen|listen ai)$/i;

  function isPizzaLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/\?$/.test(s)) return false;
    if (/^(what|why|how|who|when|explain|tell me|define)\b/i.test(s)) return false;
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (low === 'pizza' || low === 'pizzeria' || low === 'pizzas') return true;
    if (PIZZA_RE.test(s)) return true;
    if (/^pizza\b/i.test(s)) return true;
    if (/πίτσα|πιτσα/i.test(s)) return true;
    return false;
  }

  function isLaptopLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/pizza|nairobi|kenya|\bafrica\b|kalithea|kallithea|rhodes|rodos|ρόδο|webrtc|\bcall\b|hangup/i.test(s))
      return false;
    if (/\?$/.test(s)) return false;
    if (/^(what|why|how|who|when|explain|tell me|define|is |are )\b/i.test(s)) return false;
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (LAPTOP_RE.test(low)) return true;
    if (/^(laptop|laptops)$/.test(low)) return true;
    if (/^buy (a )?laptops?$/.test(low)) return true;
    return false;
  }

  function isHoldLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    return HOLD_RE.test(s);
  }

  function isListenLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    return LISTEN_RE.test(s);
  }

  // ---- silence helpers (from prior mute) ----
  function silenceSpeech() {
    try {
      if (global.speechSynthesis) {
        global.speechSynthesis.cancel();
        global.speechSynthesis.pause && global.speechSynthesis.pause();
      }
    } catch (_) {}
  }
  silenceSpeech();
  setInterval(silenceSpeech, 4000);

  // ---- fetch/XHR combine guards (keep prior behaviour) ----
  try {
    if (!global.fetch || global.fetch.__snMuteCombine === BUILD) return;
    var origFetch = global.fetch.bind(global);
    function wrappedFetch() {
      return origFetch.apply(this, arguments);
    }
    wrappedFetch.__snMuteCombine = BUILD;
    global.fetch = wrappedFetch;
  } catch (_) {}

  try {
    var XHR = global.XMLHttpRequest;
    if (!XHR || XHR.__snMuteCombine === BUILD) return;
    // leave as-is for now; prior builds already guarded
    XHR.__snMuteCombine = BUILD;
  } catch (_) {}

  function loadScript(src, attr) {
    try {
      if (document.querySelector('script[src*="' + src.split('/').pop().split('?')[0] + '"]')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      if (attr) s.setAttribute(attr, '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {
      console.warn('[mute] loadScript', src, e);
    }
  }

  function loadChain() {
    // order matters: earth first, then hunts, then avc, then twin cli
    loadScript('/js/spacenet/chrome-place-earth-20260824133000.js', 'data-sn-place-earth');
    loadScript('/js/spacenet/chrome-nairobi-ladder-20260824133000.js', 'data-sn-nairobi');
    loadScript('/js/spacenet/chrome-research-stay-20260824133000.js', 'data-sn-research-stay');
    loadScript('/js/spacenet/chrome-guest-pizza-land-20260824140000.js', 'data-sn-pizza-land');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt-20260824144000.js', 'data-sn-laptop-hunt');
    loadScript('/js/spacenet/chrome-ai-listen-20260824140000.js', 'data-sn-ai-listen');
    loadScript('/js/spacenet/chrome-hold-pay-20260824140000.js', 'data-sn-hold-pay');
    loadScript('/js/spacenet/chrome-avc-ledger-20260824150000.js', 'data-sn-avc-ledger');
    loadScript('/js/spacenet/chrome-cli-answer-20260824133000.js', 'data-sn-cli-answer');
    try {
      var m = document.querySelector('meta[name="astranov-build"]');
      if (m) m.setAttribute('content', BUILD);
      var c = document.querySelector('meta[name="astranov-continuity"]');
      if (c) c.setAttribute('content', BUILD);
    } catch (_) {}
  }

  // boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadChain();
    });
  } else {
    loadChain();
  }
  setTimeout(loadChain, 0);
  setTimeout(loadChain, 500);
  setTimeout(loadChain, 800);
  setTimeout(loadChain, 2500);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
