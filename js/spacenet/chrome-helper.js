/* Astranov — Silver helper · controlled standby
 * Build: 20260811174500-silver-control
 * Standby: small quiet sprite, no thrust, no FX storm
 * Active: only after user tap — then SNHelper can move
 */
(function (global) {
  'use strict';
  var BUILD = '20260811174500-silver-control';
  var MODE = 'standby';
  var img = null;
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var ax = 0;
  var ay = 0;
  var t0 = 0;
  var ready = false;

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
      if (el) return Math.max(52, Math.round(el.getBoundingClientRect().bottom + 6));
    } catch (_) {}
    return 68;
  }

  function anchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - 52);
    var y = topChromeBottom() + 36;
    y = Math.min(Math.max(y, 58), Math.round(h * 0.2));
    x = Math.min(Math.max(x, 36), w - 32);
    return { x: x, y: y };
  }

  function killOldFx() {
    try {
      var fx = document.getElementById('sn-helper-fx');
      if (fx && fx.parentNode) fx.parentNode.removeChild(fx);
    } catch (_) {}
    try {
      var hc = document.getElementById('sn-helper-canvas');
      if (hc && MODE === 'standby') {
        hc.style.opacity = '0';
        hc.style.pointerEvents = 'none';
      }
    } catch (_) {}
  }

  function loadSprite() {
    if (img && img.complete && img.naturalWidth) return Promise.resolve(img);
    return new Promise(function (resolve) {
      var urls = [
        '/assets/brand/grokbot-512.png',
        '/assets/sprites/spacex-bot/spacex-bot-1.png',
        '/assets/sprites/spacex-bot/spacex-bot-2.png',
      ];
      var i = 0;
      function next() {
        if (i >= urls.length) {
          img = null;
          resolve(null);
          return;
        }
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () {
          img = im;
          resolve(im);
        };
        im.onerror = function () {
          i++;
          next();
        };
        im.src = urls[i++];
      }
      next();
    });
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return ctx;
    canvas = document.createElement('canvas');
    canvas.id = 'sn-silver-calm';
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:98;pointer-events:none;width:100%;height:100%;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    return ctx;
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }

  function drawStandby(now) {
    if (MODE !== 'standby') return;
    var c = ensureCanvas();
    if (!c) return;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    c.clearRect(0, 0, w, h);
    var a = anchor();
    ax = a.x;
    ay = a.y;
    if (!t0) t0 = now;
    var breath = Math.sin((now - t0) * 0.0012) * 1.5;
    var size = 44;
    c.save();
    c.translate(ax, ay + breath);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(0, size * 0.42, size * 0.28, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(100,170,255,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, -2, size * 0.48, 0, Math.PI * 2);
    c.stroke();
    if (img) {
      c.drawImage(img, -size / 2, -size / 2 - 4, size, size);
    } else {
      c.fillStyle = 'rgba(180,210,230,0.85)';
      c.beginPath();
      c.arc(0, -4, 12, 0, Math.PI * 2);
      c.fill();
      c.fillRect(-8, 4, 16, 14);
    }
    c.restore();
    placeHit(ax, ay);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (MODE !== 'standby') {
      if (canvas && ctx) {
        try {
          ctx.clearRect(0, 0, window.innerWidth || 1, window.innerHeight || 1);
        } catch (_) {}
      }
      return;
    }
    if (document.hidden) return;
    if (loop._last && now - loop._last < 48) return;
    loop._last = now;
    drawStandby(now);
  }

  function ensureHit() {
    var id = 'sn-helper-hit';
    var hit = document.getElementById(id);
    if (hit) return hit;
    hit = document.createElement('button');
    hit.id = id;
    hit.type = 'button';
    hit.title = 'Silver helper · tap to activate';
    hit.setAttribute('aria-label', 'Silver helper');
    hit.style.cssText =
      'position:fixed;z-index:130;width:48px;height:48px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;border-radius:50%;outline:none;' +
      '-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', function (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (_) {}
      activate();
    });
    return hit;
  }

  function placeHit(x, y) {
    var hit = ensureHit();
    hit.style.left = Math.round(x - 24) + 'px';
    hit.style.top = Math.round(y - 24) + 'px';
  }

  function activate() {
    MODE = 'active';
    killOldFx();
    try {
      var hc = document.getElementById('sn-helper-canvas');
      if (hc) {
        hc.style.opacity = '1';
        hc.style.pointerEvents = 'none';
      }
    } catch (_) {}
    log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SILVER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'dim');
    log('Helper active \u00b7 tell me what to simulate', 'ok');
    log('  simulate pizza order', 'ok');
    log('  simulate delivery', 'ok');
    log('  simulate payment', 'ok');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('Silver active');
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
    } catch (_) {}
    try {
      if (global.SNHelper) {
        if (SNHelper.init) SNHelper.init({ autoWake: false, sleep: false });
        if (SNHelper.wake) SNHelper.wake({ label: 'SILVER', force: true, showcaseMs: 12000 });
        var a = anchor();
        if (SNHelper.flyTo) {
          SNHelper.flyTo(
            { x: a.x, y: a.y },
            { kind: 'wake', label: 'SILVER', status: 'active', dur: 800, log: false }
          );
        }
      }
    } catch (_) {}
    setTimeout(function () {
      if (MODE === 'active') {
        MODE = 'standby';
        killOldFx();
        log('Silver \u00b7 standby', 'dim');
      }
    }, 25000);
  }

  function boot() {
    killOldFx();
    loadSprite().then(function () {
      ensureCanvas();
      ensureHit();
      if (!raf) raf = requestAnimationFrame(loop);
      if (!ready) {
        ready = true;
        log('Silver helper \u00b7 calm standby \u00b7 tap to activate', 'ok');
      }
    });
  }

  window.addEventListener('resize', function () { resize(); }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 2000);
  setTimeout(boot, 5000);

  global.SNChromeHelper = {
    build: BUILD,
    activate: activate,
    mode: function () { return MODE; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
