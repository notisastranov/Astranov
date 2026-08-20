/* Astranov chrome-fix RESTORE loader · 20260820220000-hud-law
 * Loads local chrome-fix body (handles 10px + HUD placeholder law).
 * Never let CDN or late code set place-list or thick handles.
 */
(function (global) {
  'use strict';
  var BUILD = '20260820220000-hud-law';
  var HUD = 'Command the HUD · show, hide, or reshape';
  function enforceHud() {
    try {
      var top = document.getElementById('stc-cmd-in');
      var bot = document.getElementById('cli-in');
      if (top) {
        top.placeholder = HUD;
        top.setAttribute('aria-label', HUD);
      }
      if (bot) {
        bot.placeholder = HUD;
        bot.setAttribute('aria-label', HUD);
      }
      // kill guest spam in log if present
      var log = document.getElementById('cli-log');
      if (log && /SPACEX BOT|owner note|AI art missing/i.test(log.textContent || '')) {
        var bad = log.querySelectorAll('.sn-log-line, div, span');
        for (var i = 0; i < bad.length; i++) {
          if (/SPACEX BOT|AI art missing|owner note/i.test(bad[i].textContent || '')) {
            try { bad[i].remove(); } catch (_) {}
          }
        }
      }
    } catch (_) {}
  }
  function load(src, cb) {
    if (document.querySelector('script[data-sn-chrome-fix-body]')) {
      if (cb) cb();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.setAttribute('data-sn-chrome-fix-body', '1');
    s.onload = function () { if (cb) cb(); };
    s.onerror = function () {
      enforceHud();
      if (cb) cb();
    };
    document.head.appendChild(s);
  }
  function loadFace() {
    if (document.querySelector('script[data-sn-rib-face]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-rib-face.js?v=' + BUILD;
    s.setAttribute('data-sn-rib-face', '1');
    document.head.appendChild(s);
  }
  function loadOps() {
    if (document.querySelector('script[data-sn-p0-ops]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-p0-ops.js?v=' + BUILD;
    s.setAttribute('data-sn-p0-ops', '1');
    document.head.appendChild(s);
  }
  function afterGood() {
    loadFace();
    loadOps();
    enforceHud();
  }
  load('/js/spacenet/chrome-fix-body.js?v=' + BUILD, afterGood);
  setTimeout(afterGood, 1200);
  setTimeout(loadOps, 2500);
  setInterval(enforceHud, 3500);
  // also early
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceHud);
  } else {
    enforceHud();
  }
  global.SNChromeFixLoader = { build: BUILD, enforceHud: enforceHud };
})(typeof window !== 'undefined' ? window : globalThis);
