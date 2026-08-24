/* Astranov mute · Build 20260824140000-combine-tap
 * PATCH PR #182 only. Same branch, same Vercel alias. Does NOT merge, land,
 * restyle chrome, or edit locked PRs #175–#181 in place.
 *
 * FAIL 1: laptop overlay taps returned leftover pizza lastPins (Cedars / YWCA).
 * FAIL 2: CLI hold/listen printed "I'm online" (research-stay / twin-cli Grok).
 *
 * FIX: intercept hold / listen / pizza / laptop BEFORE research-stay and
 * twin-cli. Pizza + laptop each own lastPins / overlay / consumeClick.
 *
 * ONE mute loadChain vendors ALL of:
 *   (earth)  chrome-place-earth-20260824133000.js     #176 / #174
 *   (nairobi) chrome-nairobi-ladder-20260824133000.js  #176 / #130  after live SNGlobe
 *   (research) chrome-research-stay-20260824133000.js  #175 ace568e
 *   (pizza)  chrome-guest-pizza-land-20260824140000.js  own ns, clears laptop
 *   (laptop) chrome-guest-laptop-hunt-20260824140000.js own ns, clears pizza
 *   (listen) chrome-ai-listen-20260824140000.js        CLI listen · mic denied
 *   (hold)   chrome-hold-pay-20260824140000.js         CLI hold → #sn-hold-signin
 *   (twin)   chrome-cli-answer-20260824133000.js       #181 e56cc85
 *
 * Load order: adapter/earth FIRST, wait live SNGlobe, THEN nairobi,
 * research-stay, pizza, laptop, listen, hold, twin-cli LAST.
 * Cache-bust 20260824140000-combine-tap.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824140000-combine-tap';
  if (global.__snMuteCombineTap20260824140000) return;
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
    if (/^(hold\s+camera|camera\s+hold)\b/i.test(s)) return false;
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (low === 'hold') return true;
    if (s === '⭐' || s === '⭐ 0.00' || low === 'star') return true;
    if (/^hold\s*⭐/.test(s)) return true;
    if (/^hold\s*(\/)?\s*(pay|star|stars?)\b/.test(low)) return true;
    if (/^(pay|checkout|wallet)\b/.test(low)) return true;
    if (/^confirm\s+order\b/.test(low) || /^buy\s+now\b/.test(low) || /^order\s+now\b/.test(low)) return true;
    return HOLD_RE.test(s);
  }

  function isListenLine(line) {
    var s = String(line || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!s) return false;
    return LISTEN_RE.test(s);
  }

  function markQuiet() {
    var until = Date.now() + 25000;
    global.__snPizzaOrdersQuiet = until;
    global.__snPizzaHuntQuiet = 0;
    global.__SN_PIZZA_HUNT_QUIET = 0;
  }

  function isQuiet() {
    var t = Number(global.__snPizzaOrdersQuiet || 0);
    return t > Date.now();
  }

  function neutralizeMuteTraps() {
    try { global.__snPizzaHuntQuiet = 0; } catch (_) {}
    try { global.__SN_PIZZA_HUNT_QUIET = 0; } catch (_) {}
    try { delete global.__snMutePizzaCliTrap; } catch (_) {
      try { global.__snMutePizzaCliTrap = 0; } catch (__) {}
    }
    try { delete global.__snPizzaOsmCliTrap; } catch (_) {}
  }

  function ordersUrl(url) {
    return /\/rest\/v1\/orders/i.test(String(url || ''));
  }

  function emptyOrdersResponse() {
    try {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (_) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () { return Promise.resolve([]); },
        text: function () { return Promise.resolve('[]'); },
      });
    }
  }

  function installFetchGuard() {
    try {
      if (!global.fetch || global.fetch.__snMuteCombine === BUILD) return;
      var orig = global.fetch.bind(global);
      function wrappedFetch(input, init) {
        var url = '';
        try {
          if (typeof input === 'string') url = input;
          else if (input && input.url) url = String(input.url);
        } catch (_) {}
        if (ordersUrl(url) && isQuiet()) {
          return Promise.resolve(emptyOrdersResponse());
        }
        return orig(input, init);
      }
      wrappedFetch.__snMuteCombine = BUILD;
      global.fetch = wrappedFetch;
      try { if (typeof window !== 'undefined') window.fetch = wrappedFetch; } catch (_) {}
    } catch (_) {}
  }

  function installXhrGuard() {
    try {
      var XHR = global.XMLHttpRequest;
      if (!XHR || XHR.__snMuteCombine === BUILD) return;
      var open = XHR.prototype.open;
      var send = XHR.prototype.send;
      XHR.prototype.open = function (method, url) {
        try { this.__snPizzaOrders = ordersUrl(url); } catch (_) { this.__snPizzaOrders = false; }
        return open.apply(this, arguments);
      };
      XHR.prototype.send = function () {
        try {
          if (this.__snPizzaOrders && isQuiet()) {
            var self = this;
            setTimeout(function () {
              try {
                Object.defineProperty(self, 'status', { configurable: true, get: function () { return 200; } });
                Object.defineProperty(self, 'responseText', { configurable: true, get: function () { return '[]'; } });
                Object.defineProperty(self, 'response', { configurable: true, get: function () { return '[]'; } });
                self.readyState = 4;
                if (typeof self.onreadystatechange === 'function') self.onreadystatechange();
                if (typeof self.onload === 'function') self.onload();
              } catch (_) {}
            }, 0);
            return;
          }
        } catch (_) {}
        return send.apply(this, arguments);
      };
      XHR.__snMuteCombine = BUILD;
    } catch (_) {}
  }

  function dispatchPizzaHunt(line) {
    markQuiet();
    installFetchGuard();
    var tries = 0;
    function go() {
      tries++;
      try {
        if (global.SNChromeGuestPizzaHunt && typeof SNChromeGuestPizzaHunt.hunt === 'function') {
          void SNChromeGuestPizzaHunt.hunt(line || 'pizza');
          return;
        }
      } catch (_) {}
      if (tries < 60) setTimeout(go, 80);
    }
    go();
  }

  function dispatchLaptopHunt(line) {
    var tries = 0;
    function go() {
      tries++;
      try {
        if (global.SNChromeGuestLaptopHunt && typeof SNChromeGuestLaptopHunt.hunt === 'function') {
          void SNChromeGuestLaptopHunt.hunt(line || 'laptop');
          return;
        }
      } catch (_) {}
      if (tries < 60) setTimeout(go, 80);
    }
    go();
  }

  function dispatchHold(line) {
    var tries = 0;
    function go() {
      tries++;
      try {
        if (global.SNHoldPay && typeof SNHoldPay.hold === 'function') {
          SNHoldPay.hold(line || 'hold');
          return;
        }
      } catch (_) {}
      if (tries < 60) setTimeout(go, 80);
    }
    go();
  }

  function dispatchListen(line) {
    var tries = 0;
    function go() {
      tries++;
      try {
        var L = global.SNAiListen;
        if (L && typeof L.toggle === 'function') {
          L.toggle();
          return;
        }
        if (L && typeof L.listen === 'function') {
          L.listen();
          return;
        }
        if (L && typeof L.start === 'function') {
          L.start();
          return;
        }
      } catch (_) {}
      if (tries < 60) setTimeout(go, 80);
    }
    go();
  }

  function lineFromEvent(ev) {
    var t = ev && ev.target;
    if (!t) return '';
    var el = null;
    try {
      if (t.id === 'cli-in' || t.id === 'stc-cmd-in') el = t;
      else if (t.closest) {
        var host = t.closest('#cli-form, #cli-in, #stc-cmd, #stc-cmd-in, #panel, #sn-topchrome');
        if (host) {
          el =
            (host.id === 'cli-in' || host.id === 'stc-cmd-in' ? host : null) ||
            host.querySelector('#cli-in, #stc-cmd-in, input, textarea');
        }
      }
    } catch (_) {}
    if (!el) return '';
    return String(el.value || '').trim();
  }

  function consumeHunt(ev, kind, line) {
    if (kind === 'pizza') {
      markQuiet();
      installFetchGuard();
    }
    try {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    } catch (_) {}
    try {
      var a = document.getElementById('cli-in');
      if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in');
      if (b) b.value = '';
    } catch (_) {}
    if (kind === 'hold') dispatchHold(line || 'hold');
    else if (kind === 'listen') dispatchListen(line || 'listen');
    else if (kind === 'pizza') dispatchPizzaHunt(line || 'pizza');
    else dispatchLaptopHunt(line || 'laptop');
  }

  function kindOfLine(v) {
    if (isHoldLine(v)) return 'hold';
    if (isListenLine(v)) return 'listen';
    if (isPizzaLine(v)) return 'pizza';
    if (isLaptopLine(v)) return 'laptop';
    return '';
  }

  function bindDocumentCapture() {
    try {
      if (document.documentElement && document.documentElement._snMuteCombineHuntTap) return;
      if (document.documentElement) document.documentElement._snMuteCombineHuntTap = 1;
    } catch (_) {}
    function onSubmit(ev) {
      var v = lineFromEvent(ev);
      if (!v) return;
      var kind = kindOfLine(v);
      if (kind) return consumeHunt(ev, kind, v);
    }
    function onKey(ev) {
      if (!ev || ev.key !== 'Enter') return;
      var t = ev.target;
      if (!t) return;
      var id = t.id || '';
      if (id !== 'cli-in' && id !== 'stc-cmd-in') return;
      var v = String(t.value || '').trim();
      if (!v) return;
      var kind = kindOfLine(v);
      if (kind) return consumeHunt(ev, kind, v);
    }
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('keydown', onKey, true);
    try { window.addEventListener('keydown', onKey, true); } catch (_) {}
    try { window.addEventListener('submit', onSubmit, true); } catch (_) {}
    function bindForm(id, inputId) {
      try {
        var form = document.getElementById(id);
        var input = document.getElementById(inputId);
        if (!form || form._snMuteCombineHuntTap) return;
        form._snMuteCombineHuntTap = 1;
        form.addEventListener(
          'submit',
          function (ev) {
            var v = String((input && input.value) || lineFromEvent(ev) || '').trim();
            if (!v) return;
            var kind = kindOfLine(v);
            if (kind) return consumeHunt(ev, kind, v);
          },
          true
        );
        if (input && !input._snMuteCombineHuntTap) {
          input._snMuteCombineHuntTap = 1;
          input.addEventListener(
            'keydown',
            function (ev) {
              if (!ev || ev.key !== 'Enter') return;
              var v = String(input.value || '').trim();
              if (!v) return;
              var kind = kindOfLine(v);
              if (kind) return consumeHunt(ev, kind, v);
            },
            true
          );
        }
      } catch (_) {}
    }
    bindForm('cli-form', 'cli-in');
    bindForm('stc-cmd', 'stc-cmd-in');
    try {
      if (!document.documentElement._snMuteCombineHuntTapRetry) {
        document.documentElement._snMuteCombineHuntTapRetry = 1;
        var n = 0;
        var t = setInterval(function () {
          n++;
          bindForm('cli-form', 'cli-in');
          bindForm('stc-cmd', 'stc-cmd-in');
          wrapCliRun();
          if (n > 40) clearInterval(t);
        }, 250);
      }
    } catch (_) {}
  }

  function applyRunWrap(fn) {
    if (!fn || typeof fn !== 'function') return fn;
    if (fn.__snMuteCombine === BUILD) return fn;
    function wrapped(raw) {
      try {
        var s = String(raw || '').trim();
        if (isHoldLine(s)) {
          dispatchHold(s);
          return Promise.resolve(true);
        }
        if (isListenLine(s)) {
          dispatchListen(s);
          return Promise.resolve(true);
        }
        if (isPizzaLine(s)) {
          markQuiet();
          dispatchPizzaHunt(s);
          return Promise.resolve(true);
        }
        if (isLaptopLine(s)) {
          dispatchLaptopHunt(s);
          return Promise.resolve(true);
        }
      } catch (_) {}
      return fn.apply(this, arguments);
    }
    wrapped.__snMuteCombine = BUILD;
    return wrapped;
  }

  function wrapCliRun() {
    try {
      if (!global.SNCli) return;
      var obj = global.SNCli;
      var desc = Object.getOwnPropertyDescriptor(obj, 'run');
      if (desc && desc.get && desc.get.__snMuteCombine === BUILD) return;
      var inner = typeof obj.run === 'function' ? obj.run : null;
      var held = applyRunWrap(inner);
      try {
        var getter = function () { return held; };
        getter.__snMuteCombine = BUILD;
        Object.defineProperty(obj, 'run', {
          configurable: true,
          enumerable: true,
          get: getter,
          set: function (v) { held = applyRunWrap(v); },
        });
      } catch (_) {
        try { obj.run = held; } catch (__) {}
      }
    } catch (_) {}
  }

  function wrapMarket() {
    try {
      if (!global.SNMarket) return;
      var M = global.SNMarket;
      if (typeof M.parseFoodIntent === 'function' && M.parseFoodIntent.__snMuteCombine !== BUILD) {
        var prevParse = M.parseFoodIntent.bind(M);
        M.parseFoodIntent = function (line) {
          var s = String(line || '').trim();
          if (isPizzaLine(s)) {
            markQuiet();
            dispatchPizzaHunt(s);
            return null;
          }
          return prevParse(line);
        };
        M.parseFoodIntent.__snMuteCombine = BUILD;
      }
      if (typeof M.fulfillFoodIntent === 'function' && M.fulfillFoodIntent.__snMuteCombine !== BUILD) {
        var ful = M.fulfillFoodIntent.bind(M);
        M.fulfillFoodIntent = function (q, opts) {
          var line = '';
          var food = '';
          try {
            if (typeof q === 'string') line = q;
            else if (q && typeof q === 'object') {
              line = String(q.raw || q.text || q.food || '');
              food = String(q.food || '');
            }
          } catch (_) {}
          if (food === 'pizza' || isPizzaLine(line) || /\bpizza\b/i.test(line)) {
            markQuiet();
            dispatchPizzaHunt(line || 'pizza');
            return Promise.resolve({
              ok: true,
              guest_browse: true,
              reply: 'Shops on globe · Google only at pay / HOLD ⭐',
            });
          }
          return ful(q, opts);
        };
        M.fulfillFoodIntent.__snMuteCombine = BUILD;
      }
    } catch (_) {}
  }

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

  function isLiveGlobe() {
    try {
      var g = global.SNGlobe;
      if (!g || typeof g !== 'object') return false;
      if (g.__snPlaceEarthThin) return false;
      if (typeof g.flyGlobeTo !== 'function') return false;
      if (typeof g.viewLatLng !== 'function') return false;
      if (typeof g.pulse !== 'function') return false;
      if (typeof g.getEarth !== 'function') return false;
      if (typeof g.getCamera !== 'function') return false;
      if (g.ready === true) return true;
      if (g.getEarth()) return true;
      if (g.getCamera()) return true;
    } catch (_) {}
    return false;
  }

  function loadNairobiLadder() {
    loadScript('/js/spacenet/chrome-nairobi-ladder-20260824133000.js', 'data-sn-nairobi-ladder');
  }

  function waitThenLoadNairobi() {
    if (hasMark('data-sn-nairobi-ladder')) return;
    try {
      if (global.SNPlaceEarth && typeof SNPlaceEarth.ensure === 'function') SNPlaceEarth.ensure();
    } catch (_) {}
    if (isLiveGlobe()) {
      loadNairobiLadder();
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
      if (isLiveGlobe()) {
        loadNairobiLadder();
        return;
      }
      if (tries > 120) {
        loadNairobiLadder();
        return;
      }
      setTimeout(tick, 100);
    }
    setTimeout(tick, 0);
  }

  function loadChain() {
    /* earth FIRST so nairobi lands on Kenya tiles, not French Guiana */
    loadScript('/js/spacenet/chrome-place-earth-20260824133000.js', 'data-sn-place-earth');
    waitThenLoadNairobi();
    loadScript('/js/spacenet/chrome-research-stay-20260824133000.js', 'data-sn-research-stay');
    /* pizza then laptop AFTER research-stay so hunt wraps outer; mute capture
       already intercepts pizza/laptop before research-stay / /api/ai */
    loadScript('/js/spacenet/chrome-guest-pizza-land-20260824140000.js', 'data-sn-guest-pizza-land');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt-20260824140000.js', 'data-sn-guest-laptop-hunt');
    loadScript('/js/spacenet/chrome-ai-listen-20260824140000.js', 'data-sn-ai-listen');
    loadScript('/js/spacenet/chrome-hold-pay-20260824140000.js', 'data-sn-hold-pay');
    /* twin-cli LAST — force-paint HUD + bottom placeholders, isSiblingOwned passes hunts */
    loadScript('/js/spacenet/chrome-cli-answer-20260824133000.js', 'data-sn-cli-answer');
  }

  function stampMeta() {
    try {
      var m = document.querySelector('meta[name="astranov-build"]');
      if (m) m.setAttribute('content', BUILD);
      var c = document.querySelector('meta[name="astranov-continuity"]');
      if (c) c.setAttribute('content', BUILD);
    } catch (_) {}
  }

  function boot() {
    neutralizeMuteTraps();
    stampMeta();
    installFetchGuard();
    installXhrGuard();
    bindDocumentCapture();
    wrapCliRun();
    wrapMarket();
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
    wrapCliRun();
  }, 400);
  setInterval(function () {
    patchAudio();
    patchFieldAlerts();
    softGateHandsfree();
    wrapCliRun();
    wrapMarket();
    waitThenLoadNairobi();
    if (global.__SN_MUTE_ALERTS && !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive)))
      silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
