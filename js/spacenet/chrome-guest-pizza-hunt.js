/**
 * Guest pizza hunt — Build 20260822140000-pulse-ready
 * PATCH #127 only. Branch file was empty; load base then soft-ready + face Rhodes patches.
 * PASS: SA Origin·camera · Locate once · no Leaflet · no fake YOU · no plaza · Google only at pay.
 */
(function (G) {
  'use strict';
  var BUILD = '20260822140000-pulse-ready';
  function loadBase(cb) {
    if (G.__snGuestPizzaHunt0822) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://raw.githubusercontent.com/notisastranov/astranov.eu/c8ac1c4616011ef8835cb33f9124564719e2cfe7/js/spacenet/chrome-guest-pizza-hunt.js?v=' + BUILD;
    s.async = false;
    s.onload = function () { setTimeout(cb, 30); };
    s.onerror = function () { setTimeout(cb, 30); };
    (document.head || document.documentElement).appendChild(s);
  }
  function softReadyPatch() {
    try {
      if (!G.SNGlobe) return;
      // Soft: pulse exists ⇒ ready. Never happy-path list-only when SNGlobe is on page.
      var prevReady = G.SNGlobe.ready;
      Object.defineProperty(G.SNGlobe, 'ready', {
        get: function () {
          if (typeof G.SNGlobe.pulse === 'function') return true;
          return prevReady === true;
        },
        set: function (v) { prevReady = v; },
        configurable: true
      });
    } catch (_) {}
  }
  function faceRhodesPatch() {
    // Ensure show rhodes and pizza after fly face the cluster and pulse
    try {
      if (G.SNChromeGuestPizzaHunt && G.SNChromeGuestPizzaHunt.showRhodes) {
        var prev = G.SNChromeGuestPizzaHunt.showRhodes;
        G.SNChromeGuestPizzaHunt.showRhodes = async function (raw) {
          try {
            if (G.SNGlobe && typeof SNGlobe.init === 'function') SNGlobe.init();
          } catch (_) {}
          var t0 = Date.now();
          while (Date.now() - t0 < 2200) {
            if (G.SNGlobe && typeof SNGlobe.pulse === 'function') break;
            await new Promise(function (r) { setTimeout(r, 90); });
          }
          try {
            if (G.SNGlobe && typeof SNGlobe.goToPlace === 'function') {
              SNGlobe.goToPlace(36.44, 28.22, { tier: 'city', openMap: false, skipScan: true, pulse: false, label: 'Rhodes' });
            }
          } catch (_) {}
          try {
            if (G.SNCli && SNCli.log) SNCli.log('Rhodes. globe camera. 36.44, 28.22', 'ok', true);
          } catch (_) {}
          await new Promise(function (r) { setTimeout(r, 320); });
          try {
            if (G.SNGlobe && typeof SNGlobe.goToPlace === 'function') {
              SNGlobe.goToPlace(36.44, 28.22, { tier: 'city', openMap: false, skipScan: true, pulse: false, label: 'Rhodes' });
            }
          } catch (_) {}
          return prev.apply(this, arguments);
        };
      }
    } catch (_) {}
  }
  function boot() {
    loadBase(function () {
      softReadyPatch();
      faceRhodesPatch();
      try {
        if (G.SNCli) G.SNCli.__snGuestPizzaHuntBuild = BUILD;
      } catch (_) {}
    });
  }
  boot();
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
  G.SNChromeGuestPizzaHuntLoader = { build: BUILD };
})(typeof window !== 'undefined' ? window : globalThis);
