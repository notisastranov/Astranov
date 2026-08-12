/**
 * Astranov Orbit Boot — force-loads multi-agent planet
 * Build: 20260812185000-orbit-boot
 */
(function () {
  if (window.__SN_ORBIT_BOOT) return;
  window.__SN_ORBIT_BOOT = '20260812185000';
  var B = '20260812185000';
  function load(path, cdnName) {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = path + '?v=' + B;
    s.onerror = function () {
      if (cdnName) {
        s.src = 'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main/' + cdnName + '?v=' + B;
      }
    };
    (document.head || document.documentElement).appendChild(s);
  }
  function run() {
    load('/js/spacenet/chrome-marina-discipline.js', 'js/spacenet/chrome-marina-discipline.js');
    load('/js/spacenet/chrome-mind-bridge.js', 'js/spacenet/chrome-mind-bridge.js');
    load('/js/spacenet/agent-orbit.js', 'js/spacenet/agent-orbit.js');
    load('/js/spacenet/chrome-fix.js', 'js/spacenet/chrome-fix.js');
  }
  if (document.readyState === 'complete') setTimeout(run, 200);
  else window.addEventListener('load', function () { setTimeout(run, 200); });
  setTimeout(run, 900);
  setTimeout(run, 2500);
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (window.SNAgentOrbit && typeof window.SNAgentOrbit.goOrbit === 'function') {
      clearInterval(iv);
      try {
        if (window.SNCli && SNCli.log) SNCli.log('\u25ce Astranov Orbit ready · type: orbit', 'ok');
        else if (window.AciCli && AciCli.print) AciCli.print('\u25ce Astranov Orbit ready · type: orbit', 'ok');
      } catch (_) {}
    }
    if (tries > 40) clearInterval(iv);
  }, 500);
})();
