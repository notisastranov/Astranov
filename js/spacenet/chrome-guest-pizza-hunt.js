/**
 * Guest pizza hunt — Build 20260823210000-combine
 * FULL locked from #127 — real shops, unique pins, Shop · name · km · ⭐
 * Runtime-copies FULL locked module from PR #127 head (CORS *). Does not edit that PR.
 */
(function (G) {
  'use strict';
  if (G.__snPizzaFullBoot) return;
  G.__snPizzaFullBoot = 1;
  var BUILD = '20260823210000-combine';
  var MARK = 'data-sn-guest-pizza-full';
  var SRCS = [
    'https://raw.githubusercontent.com/notisastranov/astranov.eu/refs/pull/127/head/js/spacenet/chrome-guest-pizza-hunt.js?v=' + BUILD,
    'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@refs/pull/127/head/js/spacenet/chrome-guest-pizza-hunt.js?v=' + BUILD
  ];
  function inject(txt) {
    if (!txt || txt.length < 800) return false;
    try {
      if (document.querySelector('script[' + MARK + ']')) return true;
      var s = document.createElement('script');
      s.textContent = txt;
      s.setAttribute(MARK, '1');
      s.setAttribute('data-sn-build', BUILD);
      (document.head || document.documentElement).appendChild(s);
      console.info('[chrome-guest-pizza-hunt.js] injected full len=' + txt.length);
      return true;
    } catch (e) {
      console.warn('[chrome-guest-pizza-hunt.js]', e);
      return false;
    }
  }
  function trySrc(i) {
    if (i >= SRCS.length) {
      console.warn('[chrome-guest-pizza-hunt.js] all sources failed');
      return;
    }
    fetch(SRCS[i], { mode: 'cors', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (t) { if (!inject(t)) trySrc(i + 1); })
      .catch(function (e) { console.warn('[chrome-guest-pizza-hunt.js] src', i, e); trySrc(i + 1); });
  }
  trySrc(0);
})(typeof window !== 'undefined' ? window : globalThis);
