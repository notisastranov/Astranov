/* Astranov chrome-fix RESTORE loader · 20260820185000
 * Loads last known-good chrome-fix body, then rib-face + p0-ops.
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
      if (src.indexOf('jsdelivr') !== -1) {
        load(
          'https://raw.githubusercontent.com/notisastranov/astranov.eu/d65905e7ca94cc015e28cfcbee7ce7fe014ee707/js/spacenet/chrome-fix.js',
          cb
        );
      }
    };
    document.head.appendChild(s);
  }
  function loadPatch(src, flag) {
    if (document.querySelector('script[' + flag + ']')) return;
    var s = document.createElement('script');
    s.src = src;
    s.setAttribute(flag.replace(/[[\]]/g, '').replace('data-', 'data-'), '1');
    // flag is like data-sn-rib-face — setAttribute needs the name
    document.head.appendChild(s);
  }
  function loadFace() {
    if (document.querySelector('script[data-sn-rib-face]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-rib-face.js?v=20260820184500';
    s.setAttribute('data-sn-rib-face', '1');
    document.head.appendChild(s);
  }
  function loadOps() {
    if (document.querySelector('script[data-sn-p0-ops]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-p0-ops.js?v=20260820185000';
    s.setAttribute('data-sn-p0-ops', '1');
    document.head.appendChild(s);
  }
  function afterGood() {
    loadFace();
    loadOps();
  }
  load(GOOD, afterGood);
  setTimeout(afterGood, 1500);
  setTimeout(loadOps, 3000);
})(typeof window !== 'undefined' ? window : globalThis);
