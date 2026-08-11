/* Astranov — Silver helper · calm standby · activate on demand
 * Build: 20260811174000-silver-calm
 * Owner: quiet small presence when idle · no thrust · no fake FX storm · click to wake
 */
(function (global) {
  'use strict';
  var BUILD = '20260811174000-silver-calm';
  var woken = false;
  var active = false;

  function log(msg, kind) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok');
    } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el =
        document.getElementById('sn-topchrome') ||
        document.getElementById('sn-topchrome-panel');
      if (el) {
        var r = el.getBoundingClientRect();
        return Math.max(52, Math.round(r.bottom + 6));
      }
    } catch (_) {}
    return 68;
  }

  function hoverAnchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - 56);
    var y = topChromeBottom() + 40;
    y = Math.min(y, Math.round(h * 0.2));
    y = Math.max(60, y);
    x = Math.min(x, w - 36);
    x = Math.max(40, x);
    return { x: x, y: y };
  }

  function killFxOverlay() {
    try {
      var fx = document.getElementById('sn-helper-fx');
      if (fx && fx.parentNode) fx.parentNode.removeChild(fx);
    } catch (_) {}
  }

  function forceCalmState() {
    try {
      var c = document.getElementById('sn-helper-canvas');
      if (c) {
        c.style.filter = active ? 'none' : 'saturate(0.85) brightness(0.95)';
        c.style.opacity = active ? '1' : '0.92';
      }
    } catch (_) {}
    killFxOverlay();
  }

  function calmHelper() {
    if (!global.SNHelper) return;
    try {
      if (SNHelper.wake) SNHelper.wake({ label: 'SILVER', force: true, showcaseMs: 0 });
    } catch (_) {}
    try {
      var a = hoverAnchor();
      if (SNHelper.flyTo) {
        SNHelper.flyTo(
          { x: a.x, y: a.y },
          {
            kind: 'park',
            label: 'SILVER',
            detail: '',
            status: 'standby',
            dur: 600,
            log: false,
            onArrive: function () { forceCalmState(); },
          }
        );
      }
    } catch (_) {}
    forceCalmState();
    setTimeout(forceCalmState, 700);
    setTimeout(forceCalmState, 1400);
  }

  function ensureHitTarget() {
    var id = 'sn-helper-hit';
    var hit = document.getElementById(id);
    if (hit) return hit;
    hit = document.createElement('button');
    hit.id = id;
    hit.type = 'button';
    hit.setAttribute('aria-label', 'Silver helper');
    hit.title = 'Silver helper · tap to activate';
    hit.style.cssText =
      'position:fixed;z-index:130;width:56px;height:56px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;pointer-events:auto;border-radius:50%;' +
      'outline:none;-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', onTap);
    return hit;
  }

  function placeHit() {
    var a = hoverAnchor();
    var hit = ensureHitTarget();
    hit.style.left = Math.round(a.x - 28) + 'px';
    hit.style.top = Math.round(a.y - 28) + 'px';
  }

  function onTap(ev) {
    try {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    } catch (_) {}
    activateHelper();
  }

  function activateHelper() {
    active = true;
    log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SILVER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'dim');
    log('Helper active \u00b7 simulation game', 'ok');
    log('  simulate pizza order', 'ok');
    log('  simulate delivery', 'ok');
    log('  simulate payment', 'ok');
    log('Type one \u00b7 or say what you need', 'dim');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('Silver active \u00b7 simulate pizza');
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
    } catch (_) {}
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SILVER \u00b7 ACTIVE', force: true, showcaseMs: 8000 });
      }
      var a = hoverAnchor();
      if (SNHelper.flyTo) {
        SNHelper.flyTo(
          { x: a.x - 16, y: a.y + 8 },
          {
            kind: 'wake',
            label: 'SILVER',
            status: 'active',
            dur: 700,
            log: false,
            onArrive: function () {
              setTimeout(function () {
                SNHelper.flyTo(
                  { x: a.x, y: a.y },
                  { kind: 'park', label: 'SILVER', status: 'ready', dur: 800, log: false }
                );
              }, 400);
            },
          }
        );
      }
    } catch (_) {}
    setTimeout(function () {
      active = false;
      calmHelper();
    }, 20000);
  }

  function placeStandby() {
    if (!global.SNHelper) return false;
    try {
      if (SNHelper.init) SNHelper.init({ autoWake: false, sleep: false });
    } catch (_) {}
    killFxOverlay();
    try {
      if (SNHelper.wake) SNHelper.wake({ label: 'SILVER', force: true, showcaseMs: 0 });
    } catch (_) {}
    calmHelper();
    placeHit();
    if (!woken) {
      woken = true;
      log('Silver helper \u00b7 standby (calm) \u00b7 tap to activate', 'ok');
    }
    return true;
  }

  function tryBoot(n) {
    n = n || 0;
    if (placeStandby()) return;
    if (n < 24) setTimeout(function () { tryBoot(n + 1); }, 500);
  }

  setInterval(function () {
    if (active) return;
    killFxOverlay();
    placeHit();
  }, 5000);

  window.addEventListener(
    'resize',
    function () {
      placeHit();
      if (!active) calmHelper();
    },
    { passive: true }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryBoot(0); });
  } else {
    tryBoot(0);
  }
  setTimeout(function () { tryBoot(0); }, 2000);
  setTimeout(function () { tryBoot(0); }, 5500);

  global.SNChromeHelper = {
    build: BUILD,
    wake: placeStandby,
    activate: activateHelper,
    game: activateHelper,
  };
})(typeof window !== 'undefined' ? window : globalThis);
