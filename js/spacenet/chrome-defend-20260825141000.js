/* Astranov defend · Build 20260825141000-relic-defend
 * Fast · updated · self-defensible.
 * Bury leftover UNIT / hunt tiles unless the user asked this session.
 * HUD law stays. Twin CLIs stay. Globe inertia stays.
 */
(function (G) {
  'use strict';
  var BUILD = '20260825141000-relic-defend';
  if (G.__snRelicDefend === BUILD) return;
  G.__snRelicDefend = BUILD;
  var HUD = 'Command the HUD · show, hide, or reshape';
  var unitWanted = false;
  var huntWanted = false;
  try {
    unitWanted = sessionStorage.getItem('sn:unit-wanted') === '1';
    huntWanted = sessionStorage.getItem('sn:hunt-wanted') === '1';
  } catch (_) {}

  function log(m, k) {
    try {
      if (G.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 180), k || 'dim');
    } catch (_) {}
  }

  function hideEl(id) {
    var el = document.getElementById(id);
    if (!el) return;
    try {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.setAttribute('aria-hidden', 'true');
    } catch (_) {}
  }

  function killEl(sel) {
    try {
      document.querySelectorAll(sel).forEach(function (n) {
        try { n.remove(); } catch (_) {}
      });
    } catch (_) {}
  }

  function enforceHud() {
    try {
      ['stc-cmd-in', 'cli-in'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.placeholder = HUD;
        el.setAttribute('aria-label', HUD);
      });
      var coach = document.getElementById('cli-coach');
      if (coach && coach.parentNode) coach.parentNode.removeChild(coach);
    } catch (_) {}
  }

  function buryUnit() {
    if (unitWanted) return;
    try {
      if (G.SNHelper) {
        if (typeof SNHelper.sleep === 'function') SNHelper.sleep();
        else if (typeof SNHelper.init === 'function') SNHelper.init({ autoWake: false, sleep: true });
      }
    } catch (_) {}
    hideEl('sn-helper-canvas');
    hideEl('sn-helper-hit');
    hideEl('sn-silver-hud');
    killEl('#sn-silver-hud, canvas#sn-helper-canvas');
  }

  function wrapHelper() {
    var H = G.SNHelper;
    if (!H || H.__snDefendWrapped) return;
    H.__snDefendWrapped = 1;
    var _init = H.init;
    if (typeof _init === 'function') {
      H.init = function (opts) {
        opts = opts || {};
        if (!unitWanted) {
          opts.autoWake = false;
          opts.sleep = true;
        }
        return _init.call(H, opts);
      };
    }
    var _wake = H.wake;
    if (typeof _wake === 'function') {
      H.wake = function (opts) {
        if (!unitWanted) return false;
        return _wake.call(H, opts);
      };
    }
    var _park = H.parkAtMoon;
    if (typeof _park === 'function') {
      H.parkAtMoon = function () {
        if (!unitWanted) {
          try { if (H.sleep) H.sleep(); } catch (_) {}
          return { ok: true, parked: false, visible: false, buried: true };
        }
        return _park.call(H);
      };
    }
  }

  function stripGenesis() {
    try {
      var logEl = document.getElementById('cli-log');
      if (!logEl) return;
      var txt = logEl.textContent || '';
      if (!/AVC genesis|treasury 2,000,000|SPACEX BOT|AI art missing|UNIT ·/i.test(txt)) return;
      var nodes = logEl.querySelectorAll('.sn-log-line, .cli-feed-item, div, span, p');
      for (var i = 0; i < nodes.length; i++) {
        if (/AVC genesis|treasury 2,000,000|SPACEX BOT|AI art missing|UNIT · SILVER|armor frames/i.test(nodes[i].textContent || '')) {
          try { nodes[i].remove(); } catch (_) {}
        }
      }
    } catch (_) {}
  }

  function buryHunt() {
    if (huntWanted) return;
    hideEl('sn-pizza-pins');
    killEl('#sn-pizza-pins, #sn-laptop-hunt, .sn-hunt-pin, .sn-vendor-pin, #sn-info-tiles');
    try {
      if (G.GlobeEntity && typeof GlobeEntity.unregisterType === 'function') {
        GlobeEntity.unregisterType('vendor');
      }
    } catch (_) {}
    try {
      document.querySelectorAll('[data-sn-hunt],[data-pizza-pin],[data-laptop-pin]').forEach(function (n) {
        try { n.remove(); } catch (_) {}
      });
    } catch (_) {}
  }

  function loadScript(src, attr) {
    try {
      var name = src.split('/').pop().split('?')[0];
      if (document.querySelector('script[src*="' + name + '"]')) return;
      if (attr && document.querySelector('script[' + attr + ']')) return;
      var e = document.createElement('script');
      e.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + BUILD;
      e.async = false;
      if (attr) e.setAttribute(attr, '1');
      (document.head || document.documentElement).appendChild(e);
    } catch (_) {}
  }

  function wantUnit() {
    unitWanted = true;
    try { sessionStorage.setItem('sn:unit-wanted', '1'); } catch (_) {}
    try {
      if (G.SNHelper && SNHelper.init) SNHelper.init({ autoWake: true });
      if (G.SNHelper && SNHelper.wake) SNHelper.wake({ force: true, label: 'UNIT · SILVER WINGS' });
    } catch (_) {}
    log('Unit online · tap it or type helper off', 'ok');
  }

  function wantHunt(kind) {
    huntWanted = true;
    try { sessionStorage.setItem('sn:hunt-wanted', '1'); } catch (_) {}
    if (kind === 'pizza') {
      loadScript('/js/spacenet/chrome-guest-pizza-land-20260824140000.js', 'data-sn-guest-pizza-land');
      log('Pizza hunt · live vendors on the globe', 'ok');
    } else if (kind === 'laptop') {
      loadScript('/js/spacenet/chrome-guest-laptop-hunt-20260824144000.js', 'data-sn-guest-laptop-hunt');
      log('Laptop hunt · live listings on the globe', 'ok');
    } else if (kind === 'nairobi') {
      loadScript('/js/spacenet/chrome-nairobi-ladder-20260824133000.js', 'data-sn-nairobi');
      log('Nairobi ladder', 'ok');
    }
  }

  function buryAll() {
    wrapHelper();
    buryUnit();
    buryHunt();
    stripGenesis();
    enforceHud();
  }

  function onCli(raw) {
    var t = String(raw || '').trim().toLowerCase();
    if (!t) return false;
    if (/^(helper off|unit off|silver off|relic off|bury)$/.test(t)) {
      unitWanted = false;
      huntWanted = false;
      try {
        sessionStorage.removeItem('sn:unit-wanted');
        sessionStorage.removeItem('sn:hunt-wanted');
      } catch (_) {}
      buryAll();
      log('Relics buried · globe is clean', 'ok');
      return true;
    }
    if (/^(helper|silver|unit|spacexbot|spacex bot)$/.test(t)) {
      wantUnit();
      return true;
    }
    if (/\bpizza\b/.test(t) && !/pay|hold|order /.test(t)) {
      wantHunt('pizza');
      return false;
    }
    if (/\blaptop\b/.test(t)) {
      wantHunt('laptop');
      return false;
    }
    if (/\bnairobi\b/.test(t)) {
      wantHunt('nairobi');
      return false;
    }
    if (/^defend( status)?$/.test(t)) {
      buryAll();
      log('Defend ' + BUILD + ' · unit ' + (unitWanted ? 'wanted' : 'buried') + ' · hunt ' + (huntWanted ? 'wanted' : 'buried'), 'ok');
      return true;
    }
    return false;
  }

  function hookCli() {
    if (G.__snDefendCliHook) return;
    G.__snDefendCliHook = 1;
    function wrap(fnName, obj) {
      try {
        if (!obj || typeof obj[fnName] !== 'function' || obj[fnName].__snDefend) return;
        var orig = obj[fnName];
        var wrapped = function (a, b, c) {
          try {
            if (onCli(a)) return true;
          } catch (_) {}
          return orig.apply(obj, arguments);
        };
        wrapped.__snDefend = 1;
        obj[fnName] = wrapped;
      } catch (_) {}
    }
    wrap('run', G.SNCli);
    wrap('exec', G.SNCli);
    wrap('handle', G.SNCli);
    wrap('submit', G.SNCli);
    ['cli-form', 'stc-cmd'].forEach(function (id) {
      var f = document.getElementById(id);
      if (!f || f.__snDefend) return;
      f.__snDefend = 1;
      f.addEventListener(
        'submit',
        function (ev) {
          try {
            var inp = f.querySelector('input');
            if (inp && onCli(inp.value)) {
              ev.preventDefault();
              ev.stopPropagation();
              inp.value = '';
            }
          } catch (_) {}
        },
        true
      );
    });
  }

  function tick() {
    wrapHelper();
    if (!unitWanted) buryUnit();
    if (!huntWanted) buryHunt();
    stripGenesis();
    enforceHud();
    hookCli();
  }

  function boot() {
    tick();
    setTimeout(tick, 400);
    setTimeout(tick, 1200);
    setTimeout(tick, 2800);
    setInterval(tick, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  G.SNDefend = {
    build: BUILD,
    bury: buryAll,
    wantUnit: wantUnit,
    wantHunt: wantHunt,
    onCli: onCli,
    tick: tick,
  };
  G.SN = G.SN || {};
  G.SN.defend = buryAll;
  G.SN.patch = G.SN.patch || function () { tick(); return BUILD; };
})(typeof window !== 'undefined' ? window : globalThis);
