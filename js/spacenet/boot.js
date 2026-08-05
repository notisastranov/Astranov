/* Astranov boot — LIGHTNING PATH
 * Critical shell + CLI/AI first (parallel). Globe next. Arsenal preloads idle so everything is ready instantly when asked.
 * Load only what is needed for first paint; full arsenal arrives in background.
 */
(function () {
  'use strict';

  /** Unstick dead UI: game mode off · hide game dock · clear offer paint thrash · optional map close */
  function recoverShell(opts) {
    opts = opts || {};
    try {
      if (window.SNGlobe && SNGlobe.setGameMode) SNGlobe.setGameMode(false);
    } catch (_) {}
    try {
      var gd = document.getElementById('sn-game-dock');
      if (gd) gd.remove();
    } catch (_) {}
    try {
      document.body.classList.remove('sn-space-scene-on', 'sn-game-on');
    } catch (_) {}
    try {
      if (opts.closeMap && window.SNMap && SNMap.close) SNMap.close();
    } catch (_) {}
    try {
      if (window.SNOfferStack && SNOfferStack.paint) SNOfferStack.paint();
    } catch (_) {}
    return true;
  }
  try {
    window.SNRecover = recoverShell;
  } catch (_) {}

  if (window.__snBootDone) return;
  window.__snBootDone = 1;
  window.__snBooting = 1;
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
    // Prefer same-origin first (correct deploy), then optional base, then CDN fallback
    list.push(local);
    if (base && base.indexOf(location.origin) !== 0 && (path.indexOf('js/') === 0 || path.indexOf('vendor/') === 0)) {
      list.push(base + '/' + path + '?v=' + encodeURIComponent(BUILD));
    }
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

  /** Hard load — reject if every origin fails (critical modules) */
  function loadHard(src, timeoutMs) {
    return load(src, timeoutMs);
  }

  function loadParallelHard(list, timeoutMs) {
    return Promise.all(list.map(function (src) { return loadHard(src, timeoutMs || 10000); }));
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
    if (finished) return;
    if (!shellReady) {
      console.error('[Astranov] boot watchdog 8s · critical still loading');
      fail('timeout · shell not ready');
      return;
    }
    console.error('[Astranov] boot watchdog · partial');
    try { if (window.SNCli && SNCli.init) SNCli.init(); } catch (e) {}
    hideBoot('watchdog · partial');
    try { if (window.SNCli && SNCli.log) SNCli.log('Boot slow · shell ready · type help', 'err'); } catch (e2) {}
  }, 8000);

  // LEAN MONEY PATH: kill dummy/game chrome by default (games via CLI ensure only)
  var LEAN = true;
  try {
    if (localStorage.getItem('sn:full-mode') === '1') LEAN = false;
  } catch (_) {}
  window._snLean = LEAN;

  // Real device capability — lean always prefers lite budgets
  var isLite = LEAN;
  try {
    if (!LEAN) {
      isLite =
        matchMedia('(pointer:coarse)').matches ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 900) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    }
  } catch (e) {}
  window._snLite = isLite;

  window.SNPerf = {
    lite: isLite,
    lean: LEAN,
    engine: true,
    quality: isLite ? 'lite' : 'high',
    dprCap: isLite ? 1.05 : 1.5,
    globeSegs: isLite ? 20 : 40,
    starN: isLite ? 90 : 280,
    radarMs: isLite ? 360 : 200,
    idleSkip: isLite ? 5 : 3,
    hudHz: isLite ? 8 : 16,
    fxScale: isLite ? 0.3 : 0.6,
    budgetMs: isLite ? 8 : 12,
    fps: 0,
    frameMs: 0,
    helperAuto: false,
    /** dummy modules NOT preloaded when lean */
    dummyOff: LEAN,
    t0: t0,
    get loadStats() { return loadStats; },
    cdn: CDN_GH,
    mark: function (name) { try { performance.mark('sn:' + name); } catch (_) {} },
  };
  // Align with SNEngine if already loaded (game-loop is critical wave)
  try {
    if (window.SNGameLoop && SNGameLoop.setQuality) {
      SNGameLoop.setQuality(isLite ? 'lite' : 'auto', { auto: true, reason: 'boot' });
    }
  } catch (_) {}

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
    '/js/spacenet/free-ai.js',
    '/js/spacenet/ui.js',
  ];

  // GLOBE: Earth must appear right after shell is usable
  var WAVE_GLOBE = [
    '/js/spacenet/spacenet-grid.js',
    '/js/spacenet/globe.js',
    '/js/spacenet/cosmos.js',
  ];

  // ARSENAL: everything else. Preloaded in background so CLI/AI can use it instantly when asked.
  // Money path only — no youtube/invaders/game dummies
  var WAVE_ARSENAL_A = [
    '/js/spacenet/tile.js',
    '/js/spacenet/map.js',
    '/js/spacenet/commerce.js',
    '/js/spacenet/market.js',
    '/js/spacenet/tasks.js',
    '/js/spacenet/search.js',
    '/js/spacenet/field.js',
    '/js/spacenet/delivery-rules.js',
    '/js/spacenet/offer-stack.js',
    '/js/spacenet/money.js',
    '/js/spacenet/home.js',
    '/js/spacenet/helper.js',
    '/js/spacenet/vendor-crawl.js',
    '/js/spacenet/order-engine.js',
  ];

  // Optional extras — NOT preloaded when lean (CLI SNLoader.ensure only)
  // Dummy / heavy / not money-path: youtube, invaders, space-scene, game-dock,
  // ai-graphics, mesh-*, live-bridge, google-earth, topo, telemachos, dialect packs.
  var WAVE_ARSENAL_B = LEAN
    ? [
        '/js/spacenet/scrolls.js',
        '/js/spacenet/places-business.js',
        '/js/spacenet/task-board.js',
      ]
    : [
        '/js/spacenet/scrolls.js',
        '/js/spacenet/order-engine.js',
        '/js/spacenet/market-live.js',
        '/js/spacenet/task-board.js',
        '/js/spacenet/task-runner.js',
        '/js/spacenet/places-business.js',
        '/js/spacenet/vendor-crawl.js',
        '/js/spacenet/helper.js',
        '/js/spacenet/space-scene.js',
        '/js/spacenet/earth-ops.js',
        '/js/spacenet/game-dock.js',
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
        '/js/spacenet/arcangelo-dialect.js',
        '/js/spacenet/greeklish.js',
        '/js/spacenet/telemachos.js',
        '/js/spacenet/youtube.js',
        '/js/spacenet/invaders.js',
      ];

  // ========== SNLoader — arsenal on demand ==========
  var MODULE_MAP = {
    youtube: { src: '/js/spacenet/youtube.js', global: 'SNYoutube' },
    invaders: { src: '/js/spacenet/invaders.js', global: 'SNInvaders' },
    game: { src: '/js/spacenet/invaders.js', global: 'SNInvaders' },
    tile: { src: '/js/spacenet/tile.js', global: 'SNTile' },
    offers: { src: '/js/spacenet/offer-stack.js', global: 'SNOfferStack' },
    money: { src: '/js/spacenet/money.js', global: 'SNMoney' },
    market: { src: '/js/spacenet/market.js', global: 'SNMarket' },
    'offer-stack': { src: '/js/spacenet/offer-stack.js', global: 'SNOfferStack' },
    map: { src: '/js/spacenet/map.js', global: 'SNMap' },
    commerce: { src: '/js/spacenet/commerce.js', global: 'SNCommerce' },
    
    tasks: { src: '/js/spacenet/tasks.js', global: 'SNTasks' },
    search: { src: '/js/spacenet/search.js', global: 'SNSearch' },
    field: { src: '/js/spacenet/field.js', global: 'SNField' },
    home: { src: '/js/spacenet/home.js', global: 'SNHome' },
    helper: { src: '/js/spacenet/helper.js', global: 'SNHelper' },
    delivery: { src: '/js/spacenet/delivery-rules.js', global: 'SNDeliveryRules' },
    'delivery-rules': { src: '/js/spacenet/delivery-rules.js', global: 'SNDeliveryRules' },
    earthops: { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    'earth-ops': { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    ops: { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    gaming: { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    spacescene: { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    'space-scene': { src: '/js/spacenet/space-scene.js', global: 'SNSpaceScene' },
    'game-dock': { src: '/js/spacenet/game-dock.js', global: 'SNGameDock' },
    gamedock: { src: '/js/spacenet/game-dock.js', global: 'SNGameDock' },
    'ai-graphics': { src: '/js/spacenet/ai-graphics.js', global: 'SNAIGraphics' },
    'live-bridge': { src: '/js/spacenet/live-bridge.js', global: 'SNLiveBridge' },
    topo: { src: '/js/spacenet/topo.js', global: 'SNTopo' },
    'google-earth': { src: '/js/spacenet/google-earth.js', global: 'SNGoogleEarth' },
    'free-ai': { src: '/js/spacenet/free-ai.js', global: 'SNAstranovMind' },
    freemind: { src: '/js/spacenet/free-ai.js', global: 'SNAstranovMind' },
    spartan: { src: '/js/spacenet/spartan.js', global: 'SNSpartan' },
    telemachos: { src: '/js/spacenet/telemachos.js', global: 'SNTelemachos' },
  };

  window.SNLoader = {
    _p: {},
    ensure: function (names) {
      var list = Array.isArray(names) ? names : [names];
      var self = this;
      return Promise.all(list.map(function (n) {
        var key = String(n || '').toLowerCase().replace(/^sn/, '');
        if (self._p[key]) return self._p[key];
        var entry = MODULE_MAP[key];
        if (!entry) return Promise.resolve();
        var src = typeof entry === 'string' ? entry : entry.src;
        var globalName = (typeof entry === 'object' && entry.global) ||
          ('SN' + key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }));
        if (window[globalName]) return Promise.resolve(window[globalName]);
        self._p[key] = load(src, 12000).then(function () {
          var mod = window[globalName];
          if (!mod) throw new Error('no global ' + globalName);
          try {
            if (mod && typeof mod.init === 'function' && !mod._inited) {
              mod.init();
              mod._inited = true;
            }
          } catch (_) {}
          return mod;
        }).catch(function (e) {
          delete self._p[key]; // allow retry after failed load
          console.warn('[Astranov] ensure fail', key, e && e.message);
          throw e;
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
    if (!LEAN) {
      whenIdle(function () {
        try { if (window.SNAi && SNAi.bootPresence) SNAi.bootPresence(); } catch (e1) {}
      }, 800);
    }
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
  loadParallelHard(WAVE_CRITICAL, 12000)
    .then(function () {
      shellReady = true;
      var ms = Math.round(performance.now() - t0);
      window.SNPerf.shellMs = ms;
      initShell();
      try {
        if (window.SNUi && SNUi.dismissCoach) SNUi.dismissCoach();
        var coach = document.getElementById('coach');
        if (coach) { coach.hidden = true; coach.style.display = 'none'; coach.style.pointerEvents = 'none'; }
        try { localStorage.setItem('sn:coach-v1', '1'); } catch (_) {}
      } catch (_) {}
      try {
        if (window.SNGameLoop) {
          if (SNGameLoop.power) SNGameLoop.power();
          else if (SNGameLoop.start) SNGameLoop.start();
        }
      } catch (_) {}
      hideBoot('shell ' + ms + 'ms');
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log('ASTRANOV · shell ' + ms + 'ms · ' + (LEAN ? 'LEAN' : isLite ? 'lite' : 'full') + ' · ready · power ON for market', 'ok');
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
          // MONEY PATH ONLY — no youtube/invaders/game/mesh auto-init
          try {
            if (window.SNField && SNField.init && !SNField._inited) {
              SNField.init();
              SNField._inited = true;
            }
          } catch (eF) { console.warn('[Astranov] field init', eF); }
          try {
            if (window.SNOfferStack && SNOfferStack.init) SNOfferStack.init();
            if (window.SNMoney && SNMoney.init) SNMoney.init();
            if (window.SNMoney && SNMoney.clearBlockers) SNMoney.clearBlockers();
            if (window.SNHome && SNHome.init) SNHome.init();
          } catch (eM) { console.warn('[Astranov] money path init', eM); }
          // Helper ready but SILENT — no showcase flyby (wakes only for drone orders)
          try {
            if (window.SNHelper && SNHelper.init) SNHelper.init({ autoWake: false, sleep: true });
          } catch (_) {}
          // Kill any leftover game chrome / dock / gameMode
          try {
            if (window.SNGlobe && SNGlobe.setGameMode) SNGlobe.setGameMode(false);
            try { if (window.SNRecover) SNRecover({ closeMap: false }); } catch (_r) {}
            document.body.classList.remove('sn-space-scene-on', 'sn-game-dock-on');
            var gd = document.getElementById('sn-game-dock');
            if (gd) gd.remove();
            var ops = document.getElementById('sn-earth-ops-canvas');
            if (ops) ops.style.display = 'none';
            var scHud = document.getElementById('sn-space-hud');
            if (scHud) scHud.remove();
          } catch (_) {}
          whenIdle(function () {
            // Lean: tiny optional wave (scrolls/places). Full mode loads heavy arsenal.
            loadParallel(WAVE_ARSENAL_B, 12000).then(function () {
              try {
                if (window.SNMoney && SNMoney.clearBlockers) SNMoney.clearBlockers();
              } catch (_) {}
              // FULL mode only: optional extras (still no forced game showcase)
              if (!LEAN) {
                try {
                  if (window.SNLiveBridge && SNLiveBridge.start) SNLiveBridge.start();
                } catch (_) {}
                try {
                  if (window.SNMeshPeers && SNMeshPeers.init) SNMeshPeers.init();
                } catch (_) {}
              }
              var total = Math.round(performance.now() - t0);
              window.SNPerf.bootMs = total;
              try {
                if (window.SNCli && SNCli.log) {
                  SNCli.log(
                    'Earth OS · ' +
                      total +
                      'ms · ' +
                      (LEAN ? 'LEAN money path · dummies off' : 'full arsenal') +
                      ' · power ON for offers',
                    'dim'
                  );
                }
              } catch (_) {}
            });
          }, LEAN ? 800 : 400);
        });
      }, 200);

      // Auth soft — later, non-blocking
      setTimeout(function () {
        loadSoft('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', 12000)
          .then(function () { return loadSoft('/js/spacenet/auth.js', 8000); })
          .then(function () {
            try { if (window.SNAuth && SNAuth.init) SNAuth.init(); } catch (e) {}
          });
      }, LEAN ? 6000 : 2200);

      // NO auto populateMap crawl on boot when lean (power ON / market on does it)
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
