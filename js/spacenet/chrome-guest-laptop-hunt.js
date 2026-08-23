/**
 * Guest laptop hunt — Build 20260823034000-laptop-flylie (combine full from #132)
 * Loads FULL locked module from PR #132 head.
 */
(function (G) {
  'use strict';
  if (G.__snLaptopFullBoot) return;
  G.__snLaptopFullBoot = 1;
  var BUILD = '20260823210000-combine';
  var MARK = 'data-sn-guest-laptop';
  var SRCS = [
    'https://raw.githubusercontent.com/notisastranov/astranov.eu/refs/pull/132/head/js/spacenet/chrome-guest-laptop-hunt.js?v=' + BUILD,
    '/js/spacenet/chrome-guest-laptop-hunt.full.js?v=' + BUILD
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
      console.warn('[laptop-hunt]', e);
      return false;
    }
  }
  function trySrc(i) {
    if (i >= SRCS.length) {
      console.warn('[laptop-hunt] all sources failed');
      return;
    }
    fetch(SRCS[i], { mode: 'cors', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (t) { if (!inject(t)) trySrc(i + 1); })
      .catch(function () { trySrc(i + 1); });
  }
  trySrc(0);
})(typeof window !== 'undefined' ? window : globalThis);
