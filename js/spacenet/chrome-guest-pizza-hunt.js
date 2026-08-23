/**
 * Guest pizza hunt — Build 20260822230000-pin-spread (combine full from #127)
 * Loads FULL locked module from PR #127 head.
 */
(function (G) {
  'use strict';
  if (G.__snPizzaFullBoot) return;
  G.__snPizzaFullBoot = 1;
  var BUILD = '20260823210000-combine';
  var MARK = 'data-sn-guest-pizza';
  var SRCS = [
    'https://raw.githubusercontent.com/notisastranov/astranov.eu/refs/pull/127/head/js/spacenet/chrome-guest-pizza-hunt.js?v=' + BUILD,
    '/js/spacenet/chrome-guest-pizza-hunt.full.js?v=' + BUILD
  ];
  function inject(txt) {
    if (!txt || txt.length < 500) return false;
    try {
      if (document.querySelector('script[' + MARK + ']')) return true;
      var s = document.createElement('script');
      s.textContent = txt;
      s.setAttribute(MARK, '1');
      (document.head || document.documentElement).appendChild(s);
      return true;
    } catch (e) {
      console.warn('[pizza-hunt]', e);
      return false;
    }
  }
  function trySrc(i) {
    if (i >= SRCS.length) {
      console.warn('[pizza-hunt] all sources failed');
      return;
    }
    fetch(SRCS[i], { mode: 'cors', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (t) { if (!inject(t)) trySrc(i + 1); })
      .catch(function () { trySrc(i + 1); });
  }
  trySrc(0);
})(typeof window !== 'undefined' ? window : globalThis);
