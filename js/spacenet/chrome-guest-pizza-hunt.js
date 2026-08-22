/**
 * Guest pizza hunt — Build 20260822140000-pulse-ready REAL (chunked restore)
 * PATCH #127 only. Branch had empty file; this loader reassembles full module.
 * Soft-ready, no kmCam filter, face Rhodes, exact log, wait+retry pulse.
 */
(function (G) {
  'use strict';
  var BUILD = '20260822140000-pulse-ready';
  var N = 18;
  function tryAssemble() {
    var arr = G.__snPizzaB64;
    if (!arr || arr.length < N) return false;
    for (var i = 0; i < N; i++) if (typeof arr[i] !== 'string') return false;
    try {
      var s = arr.join('');
      var code = atob(s);
      var el = document.createElement('script');
      el.setAttribute('data-sn-guest-pizza-full', '1');
      el.text = code;
      (document.head || document.documentElement).appendChild(el);
      return true;
    } catch (e) {
      try { console.error('pizza-hunt assemble', e); } catch (_) {}
      return false;
    }
  }
  function loadChunk(i) {
    if (document.querySelector('script[data-sn-pizza-chunk="' + i + '"]')) return;
    var s = document.createElement('script');
    var idx = (i < 10 ? '0' + i : '' + i);
    s.src = '/js/spacenet/pizza-hunt-chunk-' + idx + '.js?v=' + BUILD;
    s.async = false;
    s.setAttribute('data-sn-pizza-chunk', String(i));
    (document.head || document.documentElement).appendChild(s);
  }
  function boot() {
    for (var i = 0; i < N; i++) loadChunk(i);
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (tryAssemble() || tries > 80) clearInterval(t);
    }, 50);
  }
  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 0);
  setTimeout(boot, 400);
  G.SNChromeGuestPizzaHuntLoader = { build: BUILD, n: N };
})(typeof window !== 'undefined' ? window : globalThis);
