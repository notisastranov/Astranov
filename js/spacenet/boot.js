/* Astranov boot — FAST shell first, globe + extras after paint (never hang) */
(function () {
  'use strict';
  var BUILD = (document.querySelector('meta[name="astranov-build"]') || {}).content || '1';
  var bootEl = document.getElementById('boot');
  var t0 = performance.now();
  var finished = false;
  var shellReady = false;

  function v(src) {
    if (/^https?:\/\//i.test(src)) return src;
    return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
  }

  function load(src, timeoutMs) {
    timeoutMs = timeoutMs || 10000;
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.async = false;
      s.src = v(src);
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        try {
          s.remove();
        } catch (e) {}
        reject(new Error('timeout ' + src));
      }, timeoutMs);
      s.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        resolve();
      };
      s.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        reject(new Error('load fail ' + src));
      };
      document.head.appendChild(s);
    });
  }

  function loadSoft(src, timeoutMs) {
    return load(src, timeoutMs).catch(function (e) {
      console.warn('[Astranov] soft skip', src, e && e.message);
    });
  }

  function loadParallel(list, timeoutMs) {
    return Promise.all(
      list.map(function (src) {
        return loadSoft(src, timeoutMs || 10000);
      })
    );
  }

  function seq(list, timeoutMs) {
    var i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve();
      var src = list[i++];
      return load(src, timeoutMs || 9000).then(next);
    }
    return next();
  }

  function hideBoot(msg) {
    if (finished) return;
    finished = true;
    if (bootEl) {
      bootEl.classList.add('hide');
      bootEl.setAttribute('aria-busy', 'false');
      setTimeout(function () {
        try {
          bootEl.remove();
        } catch (e) {}
      }, 280);
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
      if (b)
        b.onclick = function () {
          location.reload();
        };
    }
    console.error('[Astranov] boot fail', msg);
  }

  // Hard ceiling — interactive shell must appear
  setTimeout(function () {
    if (!finished) {
      console.error('[Astranov] boot watchdog 10s');
      try {
        if (window.SNCli && SNCli.init) SNCli.init();
      } catch (e) {}
      hideBoot('watchdog · partial');
      try {
        if (window.SNCli && SNCli.log) SNCli.log('Boot slow · shell ready · type help', 'err');
      } catch (e2) {}
    }
  }, 10000);

  try {
    if (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0) window._snLite = true;
  } catch (e) {}

  /**
   * WAVE 1 — shell: CLI + chrome + AI free mind (no THREE, no map, no market bulk)
   * Goal: feed usable in ~1–2s on good network.
   */
  // Shell: Astranov Mind + dialect + market (owner memory lane loads first)
  var WAVE_SHELL = [
    '/js/spacenet/config.js',
    '/js/spacenet/currency.js',
    '/js/spacenet/profiles.js',
    '/js/spacenet/tasks.js',
    '/js/spacenet/usage.js',
    '/js/spacenet/field.js',
    '/js/spacenet/home.js',
    // Owner memory: Archangelos dialect → Astranov Mind → Telemachos
    '/js/spacenet/arcangelo-dialect.js',
    '/js/spacenet/search.js',
    '/js/spacenet/market.js',
    '/js/spacenet/free-ai.js',
    '/js/spacenet/telemachos.js',
    '/js/spacenet/cli.js',
    '/js/spacenet/ai.js',
    '/js/spacenet/ui.js',
    '/js/spacenet/tile.js',
  ];

  /**
   * WAVE 2 — globe imaging (THREE is the heavy cost)
   */
  var WAVE_GLOBE = [
    '/js/spacenet/spacenet-grid.js',
    '/js/spacenet/globe.js',
    '/js/spacenet/cosmos.js',
  ];

  /**
   * WAVE 3 — map + soft (parallel soft)
   */
  var WAVE_APP = [
    '/js/spacenet/brain.js',
    '/js/spacenet/commerce.js',
    '/js/spacenet/spatial.js',
    '/js/spacenet/market-live.js',
    '/js/spacenet/mesh-orders.js',
    '/js/spacenet/task-board.js',

    '/js/spacenet/super.js',
    '/js/spacenet/live-bridge.js',
    '/js/spacenet/map.js',
    '/js/spacenet/google-earth.js',
    '/js/spacenet/places-business.js',
    '/js/spacenet/topo.js',
  ];

  function initShell() {
    [
      function () {
        SNProfiles && SNProfiles.me && SNProfiles.me();
      },
      function () {
        SNField && SNField.init && SNField.init();
      },
      function () {
        SNHome && SNHome.init && SNHome.init();
      },
      function () {
        SNCli && SNCli.init && SNCli.init();
      },
      function () {
        SNUi && SNUi.init && SNUi.init();
      },
      function () {
        SNTile && SNTile.init && SNTile.init();
      },
    ].forEach(function (fn) {
      try {
        fn();
      } catch (e) {
        console.warn('[Astranov] shell init', e);
      }
    });
    // Kill stuck TTS
    try {
      if (window.speechSynthesis) speechSynthesis.cancel();
    } catch (e0) {}
    try {
      if (window.SNAi && SNAi.bootPresence) SNAi.bootPresence();
    } catch (e1) {}
  }

  function initGlobe() {
    var globeOk = false;
    try {
      if (window.SNGlobe && typeof THREE !== 'undefined') {
        globeOk = !!SNGlobe.init();
        if (globeOk) {
          try {
            if (SNGlobe.setBody) SNGlobe.setBody('earth');
            if (SNGlobe.goToTier) SNGlobe.goToTier('global');
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('[Astranov] globe', e);
    }
    return globeOk;
  }

  function loadThree() {
    return load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 12000).catch(function () {
      return load('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', 12000);
    });
  }

  // —— START: shell first ——
  seq(WAVE_SHELL, 8000)
    .then(function () {
      initShell();
      shellReady = true;
      var ms = Math.round(performance.now() - t0);
      hideBoot('shell ' + ms + 'ms');
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log('ASTRANOV · shell ' + ms + 'ms · feed ready · globe loading…', 'ok');
          SNCli.preview('Shell ready · talk · first delivery · donate on');
        }
        if (window.SNField && SNField.setNotice) SNField.setNotice(ms + 'ms');
      } catch (e) {}

      // WAVE 2: THREE + globe after first paint
      return loadThree()
        .then(function () {
          return seq(WAVE_GLOBE, 9000);
        })
        .then(function () {
          var ok = initGlobe();
          try {
            if (window.SNCli && SNCli.log) {
              SNCli.log(
                ok ? 'GLOBAL Earth · full sphere in space' : 'Globe soft-fail · CLI still live',
                ok ? 'ok' : 'dim'
              );
              if (ok) SNCli.preview('GLOBAL Earth');
            }
          } catch (e2) {}
        })
        .catch(function (e) {
          console.warn('[Astranov] globe wave', e);
          try {
            if (window.SNCli && SNCli.log) SNCli.log('Globe delayed · keep using feed', 'dim');
          } catch (e3) {}
        });
    })
    .then(function () {
      // WAVE 3: app modules in parallel (soft)
      return loadParallel(WAVE_APP, 12000);
    })
    .then(function () {
      [
        function () {
          SNSpatial && SNSpatial.init && SNSpatial.init();
        },
        function () {
          SNMap && SNMap.init && SNMap.init();
        },
        function () {
          SNLiveBridge && SNLiveBridge.start && SNLiveBridge.start();
        },
      ].forEach(function (fn) {
        try {
          fn();
        } catch (e) {
          console.warn('[Astranov] app init', e);
        }
      });
      try {
        if (window.SNMap && SNMap.active && SNMap.close) SNMap.close();
      } catch (e3) {}
      var total = Math.round(performance.now() - t0);
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log(
            'App modules · ' +
              total +
              'ms · type: first delivery · donate on · shops',
            'dim'
          );
        }
      } catch (e4) {}

      // Auth soft (not on critical path)
      setTimeout(function () {
        loadSoft(
          'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
          12000
        )
          .then(function () {
            return loadSoft('/js/spacenet/auth.js', 8000);
          })
          .then(function () {
            try {
              if (window.SNAuth && SNAuth.init) SNAuth.init();
            } catch (e) {}
          });
      }, window._snLite ? 2000 : 1200);

      // Search / shops only when idle — never freeze shell
      setTimeout(function () {
        // search.js already on WAVE_SHELL for first-task pizza
      }, 2500);
      setTimeout(function () {
        try {
          if (document.hidden) return;
          var p = window._snLastPos || { lat: 37.98, lng: 23.73 };
          if (window.SNCommerce && SNCommerce.populateMap) {
            SNCommerce.populateMap(p.lat, p.lng, { openMap: false }).catch(function () {});
          }
        } catch (e) {}
      }, 4000);
    })
    .catch(function (e) {
      console.error(e);
      if (!shellReady) {
        loadSoft('/js/spacenet/cli.js', 8000).then(function () {
          try {
            if (window.SNCli && SNCli.init) SNCli.init();
          } catch (e2) {}
          hideBoot('degraded');
          try {
            if (window.SNCli && SNCli.log)
              SNCli.log('Degraded · ' + (e && e.message), 'err');
          } catch (e3) {}
        });
      } else {
        hideBoot('partial');
      }
      setTimeout(function () {
        if (!finished) fail(e && e.message ? e.message : e);
      }, 1500);
    });
})();
