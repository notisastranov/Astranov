/* Astranov boot — LIGHTNING PATH
 * Critical shell + CLI/AI first (parallel). Globe next. Arsenal preloads idle so everything is ready instantly when asked.
 * Load only what is needed for first paint; full arsenal arrives in background.
 */
(function () {
  'use strict';
  var BUILD = (document.querySelector('meta[name="astranov-build"]') || {}).content || '1';
  var bootEl = document.getElementById('boot');
  var t0 = performance.now();
  var finished = false;
  var shellReady = false;

  var CDN_GH = 'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main';
  var loadStats = { ok: 0, fail: 0, cdn: 0 };

  function v(src) {
    if (/^https?:\/\//i.test(src)) return src;
    return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
  }

  function barePath(src) {
    return String(src || '').split('?')[0].replace(/^\//, '');
  }

  function originsFor(src) {
    if (/^https?:\/\//i.test(src)) return [src];
    var path = barePath(src);
    var local = v(src);
    var list = [];
    var base = '';
    try {
      base = String(window.SN_ASSET_BASE || '').replace(/\/$/, '');
    } catch (_) {}
    if (base && (path.indexOf('js/') === 0 || path.indexOf('vendor/') === 0)) {
      list.push(base + '/' + path + '?v=' + encodeURIComponent(BUILD));
    }
    list.push(local);
    if (path.indexOf('js/') === 0 || path.indexOf('vendor/') === 0) {
      list.push(CDN_GH + '/' + path + '?v=' + encodeURIComponent(BUILD));
    }
    var seen = {};
    return list.filter(function (u) {
      if (seen[u]) return false;
      seen[u] = 1;
      return true;
    });
  }

  function loadUrl(url, timeoutMs, async) {
    timeoutMs = timeoutMs || 10000;
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.async = async !== false;
      s.src = url;
      s.crossOrigin = 'anonymous';
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        try { s.remove(); } catch (e) {}
        reject(new Error('timeout ' + url));
      }, timeoutMs);
      s.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        loadStats.ok++;
        if (url.indexOf('jsdelivr') >= 0) loadStats.cdn++;
        resolve(url);
      };
      s.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        try { s.remove(); } catch (e2) {}
        loadStats.fail++;
        reject(new Error('load fail ' + url));
      };
      document.head.appendChild(s);
    });
  }

  function load(src, timeoutMs) {
    var urls = originsFor(src);
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error('all origins fail ' + src));
      var u = urls[i++];
      return loadUrl(u, timeoutMs || 10000, true).catch(function () { return next(); });
    }
    return next();
  }

  function loadSoft(src, timeoutMs) {
    return load(src, timeoutMs).catch(function (e) {
      console.warn('[Astranov] soft skip', src, e && e.message);
    });
  }

  function loadParallel(list, timeoutMs) {
    return Promise.all(list.map(function (src) { return loadSoft(src, timeoutMs || 10000); }));
  }

  function whenIdle(fn, timeout) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function () { try { fn(); } catch (e) { console.warn('[Astranov] idle', e); } }, { timeout: timeout || 2000 });
    } else {
      setTimeout(function () { try { fn(); } catch (e) { console.warn('[Astranov] idle', e); } }, 80);
    }
  }

  function hideBoot(msg) {
    if (finished) return;
    finished = true;
    if (bootEl) {
      bootEl.classList.add('hide');
      bootEl.setAttribute('aria-busy', 'false');
      setTimeout(function () { try { bootEl.remove(); } catch (e) {} }, 220);
    }
    if (msg) console.info('[Astranov]', msg);
  }

  function fail(msg) {
    if (finished) return;
    finished = true;
    if (bootEl) {
      bootEl.innerHTML =
        '<div class="boot-card">' +
        '<span class="boot-title">ASTRANOV</span>' +
        '<div class="boot-loader" aria-hidden="true"><span class="boot-loader-bar"></span></div>' +
        '<button type="button" class="boot-retry" id="sn-boot-retry">Retry</button>' +
        '</div>';
      var b = document.getElementById('sn-boot-retry');
      if (b) b.onclick = function () { location.reload(); };
    }
    console.error('[Astranov] boot fail', msg);
  }

  // Watchdog — never leave user staring at spinner
  setTimeout(function () {
    if (!finished) {
      console.error('[Astranov] boot watchdog 6s');
      try { if (window.SNCli && SNCli.init) SNCli.init(); } catch (e) {}
      hideBoot('watchdog · partial');
      try { if (window.SNCli && SNCli.log) SNCli.log('Boot slow · shell ready · type help', 'err'); } catch (e2) {}
    }
  }, 6000);

  // Real device capability (do NOT force lite)
  var isLite = false;
  try {
    isLite =
      matchMedia('(pointer:coarse)').matches ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 900) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  } catch (e) {}
  window._snLite = isLite;

  window.SNPerf = {
    lite: isLite,
    dprCap: isLite ? 1.25 : 2,
    globeSegs: isLite ? 24 : 48,
    starN: isLite ? 180 : 420,
    radarMs: isLite ? 280 : 180,
    idleSkip: isLite ? 4 : 3,
    hudHz: isLite ? 10 : 15,
    helperAuto: false,
    t0: t0,
    get loadStats() { return loadStats; },
    cdn: CDN_GH,
    mark: function (name) { try { performance.mark('sn:' + name); } catch (_) {} },
  };

  // ========== WAVE DEFINITIONS ==========
  // CRITICAL: only what is required for interactive CLI + AI + basic chrome. Parallel load.
  var WAVE_CRITICAL = [
    '/js/spacenet/skin.js',
    '/js/spacenet/config.js',
    '/js/spacenet/currency.js',
    '/js/spacenet/game-loop.js',
    '/js/spacenet/profiles.js',
    '/js/spacenet/usage.js',
    '/js/spacenet/routing.js',
    '/js/spacenet/cli.js',
    '/js/spacenet/brain.js',
    '/js/spacenet/ai.js',
    '/js/spacenet/ui.js',
  ];

  // GLOBE: Earth must appear right after shell is usable
  var WAVE_GLOBE = [
    '/js/spacenet/spacenet-grid.js',
    '/js/spacenet/globe.js',
    '/js/spacenet/cosmos.js',
  ];

  // ARSENAL: everything else. Preloaded in background so CLI/AI can use it instantly when asked.
  var WAVE_ARSENAL_A = [
    '/js/spacenet/youtube.js',
    '/js/spacenet/tile.js',
    '/js/spacenet/map.js',
    '/js/spacenet/commerce.js',
    '/js/spacenet/market.js',
    '/js/spacenet/tasks.js',
    '/js/spacenet/search.js',
    '/js/spacenet/field.js',
  ];

  var WAVE_ARSENAL_B = [
    '/js/spacenet/home.js',
    '/js/spacenet/scrolls.js',
    '/js/spacenet/order-engine.js',
    '/js/spacenet/market-live.js',
    '/js/spacenet/offer-stack.js',
    '/js/spacenet/task-board.js',
    '/js/spacenet/task-runner.js',
    '/js/spacenet/places-business.js',
    '/js/spacenet/vendor-crawl.js',
    '/js/spacenet/helper.js',
    '/js/spacenet/ai-graphics.js',
    '/js/spacenet/live-bridge.js',
    '/js/spacenet/channel-manager.js',
    '/js/spacenet/mesh-orders.js',
    '/js/spacenet/mesh-peers.js',
    '/js/spacenet/spatial.js',
    '/js/spacenet/topo.js',
    '/js/spacenet/google-earth.js',
    '/js/spacenet/super.js',
    '/js/spacenet/spartan.js',
    '/js/spacenet/free-ai.js',
    '/js/spacenet/arcangelo-dialect.js',
    '/js/spacenet/greeklish.js',
    '/js/spacenet/telemachos.js',
  ];

  // ========== SNLoader — arsenal on demand ==========
  var MODULE_MAP = {
    youtube: '/js/spacenet/youtube.js',
    tile: '/js/spacenet/tile.js',
    map: '/js/spacenet/map.js',
    commerce: '/js/spacenet/commerce.js',
    market: '/js/spacenet/market.js',
    tasks: '/js/spacenet/tasks.js',
    search: '/js/spacenet/search.js',
    field: '/js/spacenet/field.js',
    home: '/js/spacenet/home.js',
    helper: '/js/spacenet/helper.js',
    'ai-graphics': '/js/spacenet/ai-graphics.js',
    'live-bridge': '/js/spacenet/live-bridge.js',
    topo: '/js/spacenet/topo.js',
    'google-earth': '/js/spacenet/google-earth.js',
  };

  window.SNLoader = {
    _p: {},
    ensure: function (names) {
      var list = Array.isArray(names) ? names : [names];
      var self = this;
      return Promise.all(list.map(function (n) {
        var key = String(n || '').toLowerCase().replace(/^sn/, '');
        if (self._p[key]) return self._p[key];
        var src = MODULE_MAP[key];
        if (!src) return Promise.resolve();
        var globalName = 'SN' + key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
        if (window[globalName]) return Promise.resolve();
        self._p[key] = loadSoft(src, 12000).then(function () {
          try {
            var mod = window[globalName];
            if (mod && typeof mod.init === 'function' && !mod._inited) {
              mod.init();
              mod._inited = true;
            }
          } catch (_) {}
        });
        return self._p[key];
      }));
    },
  };

  function initShell() {
    [
      function () { if (window.SNProfiles && SNProfiles.me) SNProfiles.me(); },
      function () { if (window.SNCli && SNCli.init) SNCli.init(); },
      function () { if (window.SNUi && SNUi.init) SNUi.init(); },
    ].forEach(function (fn) {
      try { fn(); } catch (e) { console.warn('[Astranov] shell init', e); }
    });
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e0) {}
    whenIdle(function () {
      try { if (window.SNAi && SNAi.bootPresence) SNAi.bootPresence(); } catch (e1) {}
    }, 800);
  }

  function initGlobe() {
    var globeOk = false;
    try {
      if (window.SNGlobe && typeof THREE !== 'undefined') {
        globeOk = !!SNGlobe.init();
      }
    } catch (e) { console.warn('[Astranov] globe', e); }
    return globeOk;
  }

  function loadThree() {
    return load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 12000).catch(function () {
      return load('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', 12000);
    });
  }

  var threePromise = loadThree().catch(function (e) { console.warn('[Astranov] THREE early', e); });
  window.SNPerf.mark('three_start');

  // ========== MAIN SEQUENCE ==========
  loadParallel(WAVE_CRITICAL, 9000)
    .then(function () {
      shellReady = true;
      var ms = Math.round(performance.now() - t0);
      window.SNPerf.shellMs = ms;
      initShell();
      hideBoot('shell ' + ms + 'ms');
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log('ASTRANOV · shell ' + ms + 'ms · ' + (isLite ? 'lite' : 'full') + ' · ready · type help or speak', 'ok');
        }
      } catch (_) {}

      return threePromise.then(function () {
        return loadParallel(WAVE_GLOBE, 10000);
      });
    })
    .then(function () {
      var globeOk = initGlobe();
      var ms = Math.round(performance.now() - t0);
      window.SNPerf.globeMs = ms;
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log(globeOk ? 'Earth online · ' + ms + 'ms' : 'Globe soft · ' + ms + 'ms', globeOk ? 'ok' : 'dim');
        }
      } catch (_) {}

      whenIdle(function () {
        loadParallel(WAVE_ARSENAL_A, 14000).then(function () {
          try {
            if (window.SNYoutube && SNYoutube.init) SNYoutube.init();
            if (window.SNMap && SNMap.active && SNMap.close) SNMap.close();
          } catch (_) {}
          whenIdle(function () {
            loadParallel(WAVE_ARSENAL_B, 16000).then(function () {
              [
                function () { if (window.SNHelper && SNHelper.init) SNHelper.init({ autoWake: false }); },
                function () { if (window.SNLiveBridge && SNLiveBridge.start) SNLiveBridge.start(); },
                function () { if (window.SNMeshPeers && SNMeshPeers.init) SNMeshPeers.init(); },
                function () {
                  try {
                    if (window.SNAIGraphics) {
                      if (isLite && SNAIGraphics.setMode) SNAIGraphics.setMode('lite');
                      else if (SNAIGraphics.setMode) SNAIGraphics.setMode('imagine');
                      SNAIGraphics.init && SNAIGraphics.init();
                    }
                  } catch (_) {}
                },
              ].forEach(function (fn) { try { fn(); } catch (e) {} });

              var total = Math.round(performance.now() - t0);
              window.SNPerf.bootMs = total;
              try {
                if (window.SNCli && SNCli.log) {
                  SNCli.log('Arsenal ready · ' + total + 'ms · speak any language · youtube · map · market live', 'dim');
                }
              } catch (_) {}
            });
          }, 400);
        });
      }, 200);

      setTimeout(function () {
        loadSoft('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', 12000)
          .then(function () { return loadSoft('/js/spacenet/auth.js', 8000); })
          .then(function () {
            try { if (window.SNAuth && SNAuth.init) SNAuth.init(); } catch (e) {}
          });
      }, isLite ? 3200 : 1800);

      setTimeout(function () {
        try {
          if (document.hidden) return;
          var p = window._snLastPos || window._snPhysPos;
          if (!p || p.lat == null) return;
          if (window.SNCommerce && SNCommerce.populateMap) {
            SNCommerce.populateMap(p.lat, p.lng, { openMap: false }).catch(function () {});
          }
        } catch (e) {}
      }, isLite ? 9000 : 6000);
    })
    .catch(function (e) {
      console.error('[Astranov] boot', e);
      if (!shellReady) {
        loadSoft('/js/spacenet/cli.js', 8000).then(function () {
          try { if (window.SNCli && SNCli.init) SNCli.init(); } catch (e2) {}
          hideBoot('degraded');
          try { if (window.SNCli && SNCli.log) SNCli.log('Degraded · ' + (e && e.message), 'err'); } catch (e3) {}
        });
      } else {
        hideBoot('partial');
      }
      setTimeout(function () {
        if (!finished) fail(e && e.message ? e.message : e);
      }, 1200);
    });
})();
