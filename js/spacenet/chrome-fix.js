/* Astranov chrome-fix RESTORE loader · 20260820184000
 * Loads last known-good chrome-fix body, then rib-face P0.
 */
(function (global) {
  'use strict';
  var GOOD =
    'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@d65905e7ca94cc015e28cfcbee7ce7fe014ee707/js/spacenet/chrome-fix.js';
  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () {
      if (cb) cb();
    };
    s.onerror = function () {
      // fallback: raw github
      if (src.indexOf('jsdelivr') !== -1) {
        load(
          'https://raw.githubusercontent.com/notisastranov/astranov.eu/d65905e7ca94cc015e28cfcbee7ce7fe014ee707/js/spacenet/chrome-fix.js',
          cb
        );
      }
    };
    document.head.appendChild(s);
  }
  function loadFace() {
    if (document.querySelector('script[data-sn-rib-face]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-rib-face.js?v=20260820183500';
    s.setAttribute('data-sn-rib-face', '1');
    document.head.appendChild(s);
  }
  load(GOOD, loadFace);
  setTimeout(loadFace, 1500);
})(typeof window !== 'undefined' ? window : globalThis);
