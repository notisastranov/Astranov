/* SpaceNet boot — spartan chain (SPECS P0) */
(function () {
  'use strict';
  var BUILD = (document.querySelector('meta[name="astranov-build"]') || {}).content || '1';
  var bootEl = document.getElementById('boot');

  function load(src) {
    return new Promise(function (resolve, reject) {
      var url = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      if (/^https?:\/\//i.test(src)) {
        var s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = function () {
          resolve();
        };
        s.onerror = function () {
          reject(new Error(src));
        };
        document.head.appendChild(s);
        return;
      }
      fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error(src + ' ' + r.status);
          return r.text().then(function (t) {
            var head = t.trimStart().slice(0, 32);
            var ct = (r.headers.get('content-type') || '').toLowerCase();
            if (ct.indexOf('text/html') >= 0 || head.indexOf('<!') === 0 || t.indexOf('data-dpl-id') >= 0)
              throw new Error('HTML fallback: ' + src);
            var el = document.createElement('script');
            el.text = t;
            document.head.appendChild(el);
            resolve();
          });
        })
        .catch(reject);
    });
  }

  function done(msg) {
    if (bootEl) {
      bootEl.classList.add('hide');
      setTimeout(function () {
        try {
          bootEl.remove();
        } catch (e) {}
      }, 300);
    }
    if (msg) console.info('[SpaceNet]', msg);
  }

  function fail(msg) {
    if (bootEl)
      bootEl.innerHTML =
        '<div class="boot-card"><b>SPACENET</b><p>' + msg + '</p><p class="dim">Hard refresh</p></div>';
  }

  try {
    if (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0) window._snLite = true;
  } catch (e) {}

  var t0 = performance.now();
  // Critical path only — field is one file (radar+S+mine+ribbon)
  load('/js/spacenet/config.js')
    .then(function () {
      return load('/js/spacenet/brain.js');
    })
    .then(function () {
      return load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js').catch(function () {
        return load('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
      });
    })
    .then(function () {
      return load('/js/spacenet/globe.js');
    })
    .then(function () {
      return load('/js/spacenet/tasks.js');
    })
    .then(function () {
      return load('/js/spacenet/profiles.js');
    })
    .then(function () {
      return load('/js/spacenet/currency.js');
    })
    .then(function () {
      return load('/js/spacenet/field.js');
    })
    .then(function () {
      return load('/js/spacenet/commerce.js');
    })
    .then(function () {
      return load('/js/spacenet/spatial.js');
    })
    .then(function () {
      return load('/js/spacenet/cli.js');
    })
    .then(function () {
      return load('/js/spacenet/ui.js');
    })
    .then(function () {
      return load('/js/spacenet/tile.js');
    })
    .then(function () {
      return load('/js/spacenet/map.js');
    })
    .then(function () {
      return load('/js/spacenet/search.js');
    })
    .then(function () {
      if (!window.SNGlobe || !SNGlobe.init()) throw new Error('globe init failed');
      try {
        SNGlobe.goToTier('global');
        SNMap && SNMap.close && SNMap.close();
      } catch (e) {}
      SNProfiles && SNProfiles.me && SNProfiles.me();
      SNSpatial && SNSpatial.init && SNSpatial.init();
      SNField && SNField.init && SNField.init();
      SNCli && SNCli.init && SNCli.init();
      SNUi && SNUi.init && SNUi.init();
      SNTile && SNTile.init && SNTile.init();
      SNMap && SNMap.init && SNMap.init();
      var ms = Math.round(performance.now() - t0);
      done('ready ' + ms + 'ms');
      SNCli && SNCli.log && SNCli.log('SpaceNet · ' + ms + 'ms · GLOBAL · spartan', 'ok');
      SNCli && SNCli.preview && SNCli.preview('locate · shops · rate · resources · help');
      SNField && SNField.setNotice && SNField.setNotice(ms + 'ms');
      // Soft shops — pulses only
      setTimeout(function () {
        var p = window._snLastPos || { lat: 36.4341, lng: 28.2176 };
        SNCommerce &&
          SNCommerce.populateMap &&
          SNCommerce.populateMap(p.lat, p.lng, { openMap: false }).then(function (r) {
            if (r && r.count) {
              SNCli && SNCli.log && SNCli.log(r.count + ' shops ready · type shops', 'dim');
              SNField && SNField.refreshBlips && SNField.refreshBlips();
            }
          });
      }, 800);
      setTimeout(function () {
        load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js')
          .then(function () {
            return load('/js/spacenet/auth.js');
          })
          .then(function () {
            SNAuth && SNAuth.init && SNAuth.init();
          })
          .catch(function () {});
      }, window._snLite ? 1400 : 700);
      setTimeout(function () {
        load('/js/spacenet/ai.js').catch(function () {});
      }, 2800);
    })
    .catch(function (e) {
      console.error(e);
      fail(String(e.message || e));
    });
})();
