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
      document.querySelectorAll('#sn-game-dock,.sn-game-dock,#sn-space-hud,#sn-earth-ops-canvas,.sn-game-overlay').forEach(function (n) {
        try { n.remove(); } catch (_) {}
      });
    } catch (_) {}
    try {
      document.body.classList.remove('sn-space-scene-on', 'sn-game-on', 'sn-game-dock-on');
    } catch (_) {}
    try {
      if (window.speechSynthesis) {
        speechSynthesis.cancel();
      }
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

  var LEAN = true;
  try {
    if (localStorage.getItem('sn:full-mode') === '1') LEAN = false;
  } catch (_) {}
  window._snLean = LEAN;

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
    dummyOff: LEAN,
    t0: t0,
    get loadStats() { return loadStats; },
    cdn: CDN_GH,
    mark: function (name) { try { performance.mark('sn:' + name); } catch (_) {} },
  };
  try {
    if (window.SNGameLoop && SNGameLoop.setQuality) {
      SNGameLoop.setQuality(isLite ? 'lite' : 'auto', { auto: true, reason: 'boot' });
    }
  } catch (_) {}

  var WAVE_CRITICAL = [
    '/js/spacenet/skin.js',
    '/js/spacenet/config.js',
    '/js/spacenet/currency.js',
    '/js/spacenet/game-loop.js',
    '/js/spacenet/profiles.js',
    '/js/spacenet/cli.js',
    '/js/spacenet/free-ai.js',
    '/js/spacenet/simple-ux.js',
    '/js/spacenet/ui.js',
  ];

  var WAVE_GLOBE = [
    '/js/spacenet/spacenet-grid.js',
    '/js/spacenet/globe.js',
  ];

  var WAVE_ARSENAL_A = [
    '/js/spacenet/map.js',
    '/js/spacenet/tasks.js',
    '/js/spacenet/field.js',
    '/js/spacenet/poly-scheduler.js',
    '/js/spacenet/marina-berths.js',
    '/js/spacenet/home.js',
    '/js/spacenet/helper.js',
  ];

  var WAVE_ARSENAL_B = LEAN
    ? []
    : [
        '/js/spacenet/scrolls.js',
        '/js/spacenet/vendor-crawl.js',
        '/js/spacenet/task-board.js',
      ];

  var MODULE_MAP = {
    poly: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
    scheduler: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
    money: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
    offers: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
    'offer-stack': { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
    marina: { src: '/js/spacenet/marina-berths.js', global: 'SNMarina' },
    berths: { src: '/js/spacenet/marina-berths.js', global: 'SNMarina' },
    map: { src: '/js/spacenet/map.js', global: 'SNMap' },
    tasks: { src: '/js/spacenet/tasks.js', global: 'SNTasks' },
    field: { src: '/js/spacenet/field.js', global: 'SNField' },
    home: { src: '/js/spacenet/home.js', global: 'SNHome' },
    helper: { src: '/js/spacenet/helper.js', global: 'SNHelper' },
    delivery: { src: '/js/spacenet/poly-scheduler.js', global: 'SNDeliveryRules' },
    'free-ai': { src: '/js/spacenet/free-ai.js', global: 'SNAstranovMind' },
    freemind: { src: '/js/spacenet/free-ai.js', global: 'SNAstranovMind' },
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
          delete self._p[key];
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
      function () { if (window.SNSimpleUX && SNSimpleUX.init) SNSimpleUX.init(); },
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
          try {
            if (window.SNField && SNField.init && !SNField._inited) {
              SNField.init();
              SNField._inited = true;
            }
          } catch (eF) { console.warn('[Astranov] field init', eF); }
          try {
            if (window.SNPolyScheduler && SNPolyScheduler.init) SNPolyScheduler.init();
            if (window.SNMarina && SNMarina.init) SNMarina.init();
            if (window.SNHome && SNHome.init) SNHome.init();
          } catch (eM) { console.warn('[Astranov] poly scheduler init', eM); }
          /* HARD power wire — always throw tiles on green, independent of field race */
          try {
            function hardWirePower() {
              var btn = document.getElementById('sn-task-launch');
              if (!btn || btn._snHardPower) return;
              btn._snHardPower = true;
              btn.addEventListener('click', function (e) {
                try {
                  setTimeout(function () {
                    try {
                      var m = window.SNField && SNField.launchMode ? SNField.launchMode() : null;
                      if (!m) {
                        if (btn.classList.contains('mode-on')) m = 'on';
                        else if (btn.classList.contains('mode-off')) m = 'off';
                        else m = 'standby';
                      }
                      if (m === 'on' && window.SNPolyScheduler && SNPolyScheduler.activate) {
                        SNPolyScheduler.activate({ offers: 1 });
                      } else if (m === 'off' && window.SNPolyScheduler && SNPolyScheduler.deactivate) {
                        SNPolyScheduler.deactivate();
                      }
                    } catch (_) {}
                  }, 40);
                } catch (_) {}
              }, true);
            }
            hardWirePower();
            setTimeout(hardWirePower, 500);
            setTimeout(hardWirePower, 1500);
          } catch (eP) { console.warn('[Astranov] hard power', eP); }
          try {
            if (window.SNHelper && SNHelper.init) SNHelper.init({ autoWake: false, sleep: true });
          } catch (_) {}
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
            var oldStack = document.getElementById('sn-offer-stack');
            if (oldStack) {
              oldStack.innerHTML = '';
              oldStack.style.display = 'none';
            }
          } catch (_) {}
          whenIdle(function () {
            loadParallel(WAVE_ARSENAL_B, 12000).then(function () {
              var total = Math.round(performance.now() - t0);
              window.SNPerf.bootMs = total;
              try {
                if (window.SNCli && SNCli.log) {
                  SNCli.log('Ready · power on · locate · marina · help', 'dim');
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
      }, LEAN ? 6000 : 2200);
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
