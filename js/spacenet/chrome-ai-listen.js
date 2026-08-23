/**
 * Guest AI listen — Build 20260823210000-combine
 * FULL locked from #169 including #sn-rib-hf-hit — Talk → Listen · mic denied
 * Runtime-copies FULL locked module from PR #169 head (CORS *). Does not edit that PR.
 */
(function (G) {
  'use strict';
  if (G.__snAiListenFullBoot) return;
  G.__snAiListenFullBoot = 1;
  var BUILD = '20260823210000-combine';
  var MARK = 'data-sn-ai-listen-full';
  var SRCS = [
    'https://raw.githubusercontent.com/notisastranov/astranov.eu/refs/pull/169/head/js/spacenet/chrome-ai-listen.js?v=' + BUILD,
    'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@refs/pull/169/head/js/spacenet/chrome-ai-listen.js?v=' + BUILD
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
      console.info('[chrome-ai-listen.js] injected full len=' + txt.length);
      return true;
    } catch (e) {
      console.warn('[chrome-ai-listen.js]', e);
      return false;
    }
  }
  function trySrc(i) {
    if (i >= SRCS.length) {
      console.warn('[chrome-ai-listen.js] all sources failed');
      return;
    }
    fetch(SRCS[i], { mode: 'cors', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (t) { if (!inject(t)) trySrc(i + 1); })
      .catch(function (e) { console.warn('[chrome-ai-listen.js] src', i, e); trySrc(i + 1); });
  }
  trySrc(0);
})(typeof window !== 'undefined' ? window : globalThis);
