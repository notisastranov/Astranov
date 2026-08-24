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
 *
 * THIS FILE RUNS BEFORE os-bootloader / cli.js / market.js.
 * It must swallow `pizza` and wrap fetch so /rest/v1/orders never 400s a hunt.
 */
(function (global) {
  'use strict';
  var BUILD = '20260824085000-pizza-osm';
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;

  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;

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

  function markQuiet() {
    var until = Date.now() + 25000;
    global.__snPizzaHuntQuiet = until;
    global.__SN_PIZZA_HUNT_QUIET = until;
  }

  function isQuiet() {
    var t = Number(global.__snPizzaHuntQuiet || global.__SN_PIZZA_HUNT_QUIET || 0);
    return t > Date.now();
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
        json: function () {
          return Promise.resolve([]);
        },
        text: function () {
          return Promise.resolve('[]');
        },
      });
    }
  }

  function installFetchGuard() {
    try {
      if (!global.fetch || global.fetch.__snMutePizzaOsm === BUILD) return;
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
      wrappedFetch.__snMutePizzaOsm = BUILD;
      global.fetch = wrappedFetch;
      try {
        if (typeof window !== 'undefined') window.fetch = wrappedFetch;
      } catch (_) {}
    } catch (_) {}
  }

  function installXhrGuard() {
    try {
      var XHR = global.XMLHttpRequest;
      if (!XHR || XHR.__snMutePizzaOsm === BUILD) return;
      var open = XHR.prototype.open;
      var send = XHR.prototype.send;
      XHR.prototype.open = function (method, url) {
        try {
          this.__snPizzaOrders = ordersUrl(url);
        } catch (_) {
          this.__snPizzaOrders = false;
        }
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
      XHR.__snMutePizzaOsm = BUILD;
    } catch (_) {}
  }

  function dispatchHunt(line) {
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

  function pizzaFromEvent(ev) {
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

  function consumePizza(ev, line) {
    markQuiet();
    installFetchGuard();
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
    dispatchHunt(line || 'pizza');
  }

  function bindDocumentCapture() {
    try {
      if (document.documentElement && document.documentElement._snMutePizzaOsm) return;
      if (document.documentElement) document.documentElement._snMutePizzaOsm = 1;
    } catch (_) {}
    document.addEventListener(
      'submit',
      function (ev) {
        var v = pizzaFromEvent(ev);
        if (!v || !isPizzaLine(v)) return;
        consumePizza(ev, v);
      },
      true
    );
    document.addEventListener(
      'keydown',
      function (ev) {
        if (!ev || ev.key !== 'Enter') return;
        var t = ev.target;
        if (!t) return;
        var id = t.id || '';
        if (id !== 'cli-in' && id !== 'stc-cmd-in') return;
        var v = String(t.value || '').trim();
        if (!v || !isPizzaLine(v)) return;
        consumePizza(ev, v);
      },
      true
    );
    try {
      window.addEventListener(
        'keydown',
        function (ev) {
          if (!ev || ev.key !== 'Enter') return;
          var t = ev.target;
          if (!t) return;
          var id = t.id || '';
          if (id !== 'cli-in' && id !== 'stc-cmd-in') return;
          var v = String(t.value || '').trim();
          if (!v || !isPizzaLine(v)) return;
          consumePizza(ev, v);
        },
        true
      );
    } catch (_) {}
  }

  function applyRunWrap(fn) {
    if (!fn || typeof fn !== 'function') return fn;
    if (fn.__snMutePizzaOsm === BUILD) return fn;
    function wrapped(raw) {
      try {
        var s = String(raw || '').trim();
        if (isPizzaLine(s)) {
          markQuiet();
          dispatchHunt(s);
          return Promise.resolve(true);
        }
      } catch (_) {}
      return fn.apply(this, arguments);
    }
    wrapped.__snMutePizzaOsm = BUILD;
    return wrapped;
  }

  function wrapCliRun() {
    try {
      if (!global.SNCli) return;
      var obj = global.SNCli;
      var desc = Object.getOwnPropertyDescriptor(obj, 'run');
      if (desc && desc.get && desc.get.__snMutePizzaOsm === BUILD) return;
      var inner = typeof obj.run === 'function' ? obj.run : null;
      var held = applyRunWrap(inner);
      try {
        var getter = function () {
          return held;
        };
        getter.__snMutePizzaOsm = BUILD;
        Object.defineProperty(obj, 'run', {
          configurable: true,
          enumerable: true,
          get: getter,
          set: function (v) {
            held = applyRunWrap(v);
          },
        });
      } catch (_) {
        try {
          obj.run = held;
        } catch (__) {}
      }
      obj.__snMutePizzaTrap = BUILD;
    } catch (_) {}
  }

  function trapSNCli() {
    wrapCliRun();
    try {
      if (global.__snMutePizzaCliTrap === BUILD) return;
      var current = global.SNCli;
      Object.defineProperty(global, 'SNCli', {
        configurable: true,
        enumerable: true,
        get: function () {
          return current;
        },
        set: function (v) {
          current = v;
          try {
            wrapCliRun();
          } catch (_) {}
        },
      });
      global.__snMutePizzaCliTrap = BUILD;
    } catch (_) {}
  }

  function wrapMarket() {
    try {
      if (!global.SNMarket) return;
      var M = global.SNMarket;
      if (typeof M.parseFoodIntent === 'function' && M.parseFoodIntent.__snMutePizzaOsm !== BUILD) {
        var prevParse = M.parseFoodIntent.bind(M);
        M.parseFoodIntent = function (line) {
          var s = String(line || '').trim();
          if (isPizzaLine(s)) {
            markQuiet();
            dispatchHunt(s);
            return null;
          }
          return prevParse(line);
        };
        M.parseFoodIntent.__snMutePizzaOsm = BUILD;
      }
      if (typeof M.fulfillFoodIntent === 'function' && M.fulfillFoodIntent.__snMutePizzaOsm !== BUILD) {
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
            dispatchHunt(line || 'pizza');
            return Promise.resolve({
              ok: true,
              guest_browse: true,
              reply: 'Shops on globe · Google only at pay / HOLD ⭐',
            });
          }
          return ful(q, opts);
        };
        M.fulfillFoodIntent.__snMutePizzaOsm = BUILD;
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
    installFetchGuard();
    installXhrGuard();
    bindDocumentCapture();
    trapSNCli();
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
  setTimeout(boot, 0);
  setTimeout(boot, 200);
  setTimeout(boot, 500);
  setTimeout(boot, 800);
  setTimeout(boot, 2500);
  setInterval(function () {
    installFetchGuard();
    trapSNCli();
    wrapCliRun();
    wrapMarket();
    patchAudio();
    patchFieldAlerts();
    softGateHandsfree();
    loadChain();
    if (
      global.__SN_MUTE_ALERTS &&
      !(global.SNCli && (SNCli.handsfreeOn || SNCli.hfTtsActive))
    )
      silenceSpeech();
  }, 400);

  global.SNChromeMute = {
    build: BUILD,
    silence: silenceSpeech,
    loadChain: loadChain,
    isPizzaLine: isPizzaLine,
    markQuiet: markQuiet,
  };
})(typeof window !== 'undefined' ? window : globalThis);
