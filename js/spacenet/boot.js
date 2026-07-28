/* SpaceNet boot — fail-soft, never hang (SPECS P0) */
(function () {
  'use strict';
  var BUILD = (document.querySelector('meta[name="astranov-build"]') || {}).content || '1';
  var bootEl = document.getElementById('boot');
  var t0 = performance.now();
  var finished = false;

  function v(src) {
    if (/^https?:\/\//i.test(src)) return src;
    return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
  }

  /** Native script tag — reliable with CF proxy; no HTML-as-JS trap from fetch inject */
  function load(src, timeoutMs) {
    timeoutMs = timeoutMs || 12000;
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
      console.warn('[SpaceNet] soft skip', src, e && e.message);
    });
  }

  function done(msg) {
    if (finished) return;
    finished = true;
    if (bootEl) {
      bootEl.classList.add('hide');
      setTimeout(function () {
        try {
          bootEl.remove();
        } catch (e) {}
      }, 350);
    }
    if (msg) console.info('[SpaceNet]', msg);
  }

  function fail(msg) {
    if (finished) return;
    finished = true;
    if (bootEl) {
      bootEl.innerHTML =
        '<div class="boot-card"><b>SPACENET</b><p>' +
        String(msg || 'boot failed').slice(0, 200) +
        '</p><p class="dim">Hard refresh · check console</p>' +
        '<p><button type="button" id="sn-boot-retry" style="margin-top:10px;padding:8px 14px;border-radius:8px;border:1px solid #1a6fd4;background:#061428;color:#3d9eff;font-weight:700;cursor:pointer">Retry</button></p></div>';
      var b = document.getElementById('sn-boot-retry');
      if (b)
        b.onclick = function () {
          location.reload();
        };
    }
    console.error('[SpaceNet] boot fail', msg);
  }

  // Absolute ceiling — never stuck on Loading…
  setTimeout(function () {
    if (!finished) {
      console.error('[SpaceNet] boot watchdog 18s');
      try {
        if (window.SNCli && SNCli.init) SNCli.init();
      } catch (e) {}
      done('watchdog · partial boot');
      try {
        if (window.SNCli && SNCli.log) SNCli.log('Boot slow · partial UI · type help', 'err');
      } catch (e2) {}
    }
  }, 18000);

  try {
    if (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0) window._snLite = true;
  } catch (e) {}

  // Critical path (minimal). search/ai/auth lazy.
  var chain = [
    '/js/spacenet/config.js',
    '/js/spacenet/brain.js',
    '/js/spacenet/globe.js',
    '/js/spacenet/cosmos.js', // multi-body go + crawl
    '/js/spacenet/tasks.js',
    '/js/spacenet/profiles.js',
    '/js/spacenet/currency.js',
    '/js/spacenet/field.js',
    '/js/spacenet/home.js', // Astranov SpaceNet menu · roles · account
    '/js/spacenet/commerce.js',
    '/js/spacenet/spatial.js',
    '/js/spacenet/usage.js', // usage + handoff → midnight Greek ship
    '/js/spacenet/market.js', // first vendor → delivery coach
    '/js/spacenet/cli.js',
    '/js/spacenet/ai.js', // Astranov AI on critical path — must greet
    '/js/spacenet/ui.js',
    '/js/spacenet/tile.js',
    '/js/spacenet/map.js',
  ];

  function loadThree() {
    return load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 15000).catch(function () {
      return load('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', 15000);
    });
  }

  function runChain(i) {
    if (i >= chain.length) return Promise.resolve();
    return load(chain[i], 10000).then(function () {
      return runChain(i + 1);
    });
  }

  load('/js/spacenet/config.js', 8000)
    .then(function () {
      return load('/js/spacenet/brain.js', 8000);
    })
    .then(function () {
      return loadThree();
    })
    .then(function () {
      // after THREE: rest of chain without config/brain again
      var rest = chain.slice(2);
      function next(j) {
        if (j >= rest.length) return Promise.resolve();
        return load(rest[j], 10000).then(function () {
          return next(j + 1);
        });
      }
      return next(0);
    })
    .then(function () {
      var globeOk = false;
      try {
        if (window.SNGlobe && typeof THREE !== 'undefined') {
          globeOk = !!SNGlobe.init();
          if (globeOk) {
            try {
              SNGlobe.goToTier && SNGlobe.goToTier('global');
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('[SpaceNet] globe init', e);
        globeOk = false;
      }

      try {
        if (window.SNMap && SNMap.close) SNMap.close();
      } catch (e) {}

      // Never throw from optional inits
      [
        function () {
          SNProfiles && SNProfiles.me && SNProfiles.me();
        },
        function () {
          SNSpatial && SNSpatial.init && SNSpatial.init();
        },
        function () {
          SNField && SNField.init && SNField.init();
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
        function () {
          SNMap && SNMap.init && SNMap.init();
        },
      ].forEach(function (fn) {
        try {
          fn();
        } catch (e) {
          console.warn('[SpaceNet] init step', e);
        }
      });

      var ms = Math.round(performance.now() - t0);
      done('ready ' + ms + 'ms' + (globeOk ? '' : ' · no-globe'));
      try {
        if (window.SNCli && SNCli.log) {
          SNCli.log('SpaceNet · ' + ms + 'ms · ' + (globeOk ? 'GLOBAL' : 'CLI-only'), 'ok');
          SNCli.preview('Astranov AI · locate · shops · talk');
        }
        if (window.SNField && SNField.setNotice) SNField.setNotice(ms + 'ms');
      } catch (e) {}

      // Kill any stuck browser TTS from prior session / bad hands-free
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e0) {}
      // Astranov AI text presence (NOT TTS babble)
      try {
        if (window.SNAi && SNAi.bootPresence) SNAi.bootPresence();
        else if (window.SNAi && SNAi.greet) void SNAi.greet();
        else if (window.SNCli && SNCli.log)
          SNCli.log('Astranov AI missing from boot chain', 'err');
      } catch (e) {
        console.warn('[SpaceNet] AI presence', e);
      }

      // Soft shops
      setTimeout(function () {
        try {
          var p = window._snLastPos || { lat: 36.4341, lng: 28.2176 };
          if (window.SNCommerce && SNCommerce.populateMap) {
            SNCommerce.populateMap(p.lat, p.lng, { openMap: false })
              .then(function (r) {
                if (r && r.count && window.SNCli && SNCli.log) {
                  SNCli.log(r.count + ' shops ready · type shops', 'dim');
                }
                if (window.SNField && SNField.refreshBlips) SNField.refreshBlips();
              })
              .catch(function () {});
          }
        } catch (e) {}
      }, 900);
      // Search early — ensureSector needs Overpass/crawl (zero dummy)
      setTimeout(function () {
        loadSoft('/js/spacenet/search.js', 12000);
      }, 300);
      setTimeout(function () {
        loadSoft('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', 12000)
          .then(function () {
            return loadSoft('/js/spacenet/auth.js', 8000);
          })
          .then(function () {
            try {
              if (window.SNAuth && SNAuth.init) SNAuth.init();
            } catch (e) {}
          });
      }, window._snLite ? 1600 : 800);
    })
    .catch(function (e) {
      // Last resort: still try CLI-only surface
      console.error(e);
      try {
        loadSoft('/js/spacenet/cli.js', 8000).then(function () {
          try {
            if (window.SNCli && SNCli.init) SNCli.init();
          } catch (e2) {}
          done('degraded');
          try {
            if (window.SNCli && SNCli.log) SNCli.log('Degraded boot · ' + (e && e.message), 'err');
          } catch (e3) {}
        });
      } catch (e4) {
        fail(e && e.message ? e.message : e);
      }
      setTimeout(function () {
        if (!finished) fail(e && e.message ? e.message : e);
      }, 2000);
    });
})();
