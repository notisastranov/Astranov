/**
 * Astranov Orbit Boot — forces multi-agent planet + soft modules
 * Build: 20260812183300-orbit-boot-force
 * Loads even when Vercel caches old continuity / perf-lazy.
 */
(function () {
  'use strict';
  if (window.__SN_ORBIT_BOOT) return;
  window.__SN_ORBIT_BOOT = 1;
  var BUILD = '20260812183300';
  var MODS = ['agent-orbit', 'chrome-marina-discipline', 'chrome-mind-bridge'];

  function load(name) {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = '/js/spacenet/' + name + '.js?v=' + BUILD;
    s.onerror = function () {
      try {
        s.src = 'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main/js/spacenet/' + name + '.js?v=' + BUILD;
      } catch (_) {}
    };
    (document.head || document.documentElement).appendChild(s);
  }

  function run() {
    MODS.forEach(load);
  }

  if (document.readyState === 'complete') setTimeout(run, 200);
  else window.addEventListener('load', function () { setTimeout(run, 200); });
  setTimeout(run, 800);
  setTimeout(run, 2200);
  setTimeout(run, 5000);
})();
