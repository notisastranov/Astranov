/* Astranov — Silver winged robot helper on standby
 * Build: 20260811172000-silver-helper
 * Owner: fly + hover top-right below top scroll · game for transaction simulations
 */
(function (global) {
  'use strict';
  var BUILD = '20260811172000-silver-helper';
  var hoverRaf = 0;
  var baseX = 0;
  var baseY = 0;
  var t0 = 0;
  var woken = false;

  function log(msg, kind) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok');
    } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el =
        document.getElementById('sn-topchrome') ||
        document.getElementById('sn-topchrome-panel') ||
        document.querySelector('#sn-topchrome, .sn-topchrome');
      if (el) {
        var r = el.getBoundingClientRect();
        return Math.max(56, Math.round(r.bottom + 10));
      }
    } catch (_) {}
    return 72;
  }

  function hoverAnchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - Math.min(88, w * 0.14));
    var y = topChromeBottom() + 28;
    y = Math.min(y, Math.round(h * 0.22));
    y = Math.max(56, y);
    x = Math.min(x, w - 40);
    x = Math.max(48, x);
    return { x: x, y: y };
  }

  function ensureHitTarget() {
    var id = 'sn-helper-hit';
    var hit = document.getElementById(id);
    if (hit) return hit;
    hit = document.createElement('button');
    hit.id = id;
    hit.type = 'button';
    hit.setAttribute('aria-label', 'Silver helper · simulation game');
    hit.title = 'Silver wings · simulate a transaction';
    hit.style.cssText =
      'position:fixed;z-index:130;width:72px;height:72px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;pointer-events:auto;border-radius:50%;' +
      'outline:none;-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', onHelperTap);
    return hit;
  }

  function placeHit(x, y) {
    var hit = ensureHitTarget();
    hit.style.left = Math.round(x - 36) + 'px';
    hit.style.top = Math.round(y - 36) + 'px';
  }

  function onHelperTap(ev) {
    try {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    } catch (_) {}
    offerSimGame();
  }

  function offerSimGame() {
    log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SILVER HELPER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'dim');
    log('\u25c8  Transaction simulation game', 'ok');
    log('I fly the polygon so you learn the market \u2014 no real money.', 'ok');
    log('Pick one:', 'ok');
    log('  1 \u00b7 simulate pizza order', 'ok');
    log('  2 \u00b7 simulate delivery', 'ok');
    log('  3 \u00b7 simulate payment', 'ok');
    log('Type: simulate pizza  \u00b7  simulate delivery  \u00b7  simulate payment', 'dim');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('\u25c8 simulate pizza \u00b7 delivery \u00b7 payment');
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
    } catch (_) {}
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SILVER \u00b7 GAME', force: true, showcaseMs: 12000 });
      }
    } catch (_) {}
  }

  function hoverTick(now) {
    hoverRaf = requestAnimationFrame(hoverTick);
    if (!global.SNHelper) return;
    try {
      var rep = SNHelper.report && SNHelper.report();
      if (rep && rep.busy) return;
    } catch (_) {}
    var a = hoverAnchor();
    baseX = a.x;
    baseY = a.y;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    var hx = baseX + Math.sin(t * 0.9) * 6;
    var hy = baseY + Math.sin(t * 1.35) * 9 + Math.cos(t * 0.55) * 3;
    placeHit(hx, hy);
    try {
      if (SNHelper.flyTo && (!rep || !rep.busy)) {
        if (!hoverTick._last || now - hoverTick._last > 1100) {
          hoverTick._last = now;
          SNHelper.flyTo(
            { x: hx, y: hy },
            {
              kind: 'hover',
              label: 'SILVER \u00b7 STANDBY',
              detail: 'hover \u00b7 tap for game',
              status: 'standby hover',
              dur: 1000,
              log: false,
            }
          );
        }
      }
    } catch (_) {}
  }

  function startHoverLoop() {
    if (hoverRaf) return;
    t0 = performance.now();
    hoverRaf = requestAnimationFrame(hoverTick);
  }

  function wakeAndHover() {
    if (!global.SNHelper) return false;
    try {
      if (SNHelper.init) SNHelper.init({ autoWake: false, sleep: false });
    } catch (_) {}
    try {
      if (SNHelper.wake) {
        SNHelper.wake({
          label: 'SILVER WINGS \u00b7 STANDBY',
          force: true,
          showcaseMs: 999999,
        });
      }
    } catch (_) {}
    var a = hoverAnchor();
    baseX = a.x;
    baseY = a.y;
    try {
      if (SNHelper.flyTo) {
        SNHelper.flyTo(
          { x: a.x, y: a.y },
          {
            kind: 'hover',
            label: 'SILVER \u00b7 STANDBY',
            detail: 'tap me \u00b7 simulation game',
            status: 'standby hover',
            dur: 1600,
            log: true,
            onArrive: function () {
              startHoverLoop();
            },
          }
        );
      }
    } catch (_) {}
    ensureHitTarget();
    placeHit(a.x, a.y);
    startHoverLoop();
    if (!woken) {
      woken = true;
      log('Silver winged helper \u00b7 standby hover \u00b7 top right \u00b7 tap for sim game', 'ok');
    }
    return true;
  }

  function tryBoot(n) {
    n = n || 0;
    if (wakeAndHover()) return;
    if (n < 20) setTimeout(function () { tryBoot(n + 1); }, 500);
  }

  function onResize() {
    var a = hoverAnchor();
    baseX = a.x;
    baseY = a.y;
    placeHit(a.x, a.y);
  }

  window.addEventListener('resize', onResize, { passive: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryBoot(0); });
  } else {
    tryBoot(0);
  }
  setTimeout(function () { tryBoot(0); }, 2500);
  setTimeout(function () { tryBoot(0); }, 6000);

  global.SNChromeHelper = {
    build: BUILD,
    wake: wakeAndHover,
    game: offerSimGame,
  };
})(typeof window !== 'undefined' ? window : globalThis);
