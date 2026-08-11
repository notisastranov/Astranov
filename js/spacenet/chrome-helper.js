/* Astranov — Silver winged helper · advanced graphics probe
 * Build: 20260811173000-silver-gfx
 * Goal: push canvas juice — bloom, trails, volumetric field, high-res prefer, hover top-right
 */
(function (global) {
  'use strict';
  var BUILD = '20260811173000-silver-gfx';
  var hoverRaf = 0;
  var baseX = 0;
  var baseY = 0;
  var t0 = 0;
  var woken = false;
  var fxCanvas = null;
  var fxCtx = null;
  var trails = [];
  var orbs = [];
  var lastTrail = 0;

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
        return Math.max(56, Math.round(r.bottom + 8));
      }
    } catch (_) {}
    return 72;
  }

  function hoverAnchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - Math.min(96, w * 0.16));
    var y = topChromeBottom() + 36;
    y = Math.min(y, Math.round(h * 0.24));
    y = Math.max(64, y);
    x = Math.min(x, w - 48);
    x = Math.max(56, x);
    return { x: x, y: y };
  }

  function ensureFx() {
    if (fxCanvas && document.body.contains(fxCanvas)) return fxCtx;
    fxCanvas = document.createElement('canvas');
    fxCanvas.id = 'sn-helper-fx';
    fxCanvas.style.cssText =
      'position:fixed;inset:0;z-index:97;pointer-events:none;width:100%;height:100%;';
    document.body.appendChild(fxCanvas);
    fxCtx = fxCanvas.getContext('2d', { alpha: true });
    resizeFx();
    return fxCtx;
  }

  function resizeFx() {
    if (!fxCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    fxCanvas.width = Math.floor(w * dpr);
    fxCanvas.height = Math.floor(h * dpr);
    fxCanvas.style.width = w + 'px';
    fxCanvas.style.height = h + 'px';
    if (fxCtx) {
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCtx.imageSmoothingEnabled = true;
      fxCtx.imageSmoothingQuality = 'high';
    }
  }

  function spawnOrbs(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 0.4 + Math.random() * 1.6;
      orbs.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.3,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        r: 1.5 + Math.random() * 3.5,
        hue: 190 + Math.random() * 40,
      });
    }
    if (orbs.length > 80) orbs = orbs.slice(-60);
  }

  function paintFx(now, hx, hy) {
    var ctx = ensureFx();
    if (!ctx) return;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    ctx.clearRect(0, 0, w, h);
    var t = (now - t0) / 1000;

    var field = ctx.createRadialGradient(hx, hy, 4, hx, hy, 90);
    field.addColorStop(0, 'rgba(80,180,255,0.22)');
    field.addColorStop(0.35, 'rgba(40,120,255,0.10)');
    field.addColorStop(0.7, 'rgba(20,60,180,0.04)');
    field.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = field;
    ctx.beginPath();
    ctx.arc(hx, hy, 95, 0, Math.PI * 2);
    ctx.fill();

    for (var ri = 0; ri < 2; ri++) {
      var rr = 34 + ri * 18 + Math.sin(t * 1.4 + ri) * 3;
      var ra = 0.18 + Math.sin(t * 2 + ri) * 0.06;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(t * (0.6 + ri * 0.35) * (ri % 2 ? -1 : 1));
      ctx.strokeStyle = 'rgba(120,200,255,' + ra + ')';
      ctx.lineWidth = 1.5 - ri * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,240,255,' + (ra + 0.15) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * 0.38, 0, t, t + 0.9);
      ctx.stroke();
      ctx.restore();
    }

    if (now - lastTrail > 40) {
      lastTrail = now;
      trails.push({ x: hx, y: hy, a: 0.55, r: 10 });
      if (trails.length > 18) trails.shift();
    }
    for (var i = 0; i < trails.length; i++) {
      var tr = trails[i];
      tr.a *= 0.9;
      tr.r *= 1.04;
      if (tr.a < 0.03) continue;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(70,160,255,' + tr.a * 0.35 + ')';
      ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(hx, hy);
    var flap = Math.sin(t * 4.2) * 0.35;
    for (var side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.rotate(side * (0.55 + flap));
      var wg = ctx.createLinearGradient(0, 0, side * 52, -8);
      wg.addColorStop(0, 'rgba(180,220,255,0.55)');
      wg.addColorStop(0.5, 'rgba(80,160,255,0.18)');
      wg.addColorStop(1, 'rgba(0,40,120,0)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * 28, -22 - flap * 10, side * 52, -6);
      ctx.quadraticCurveTo(side * 30, 8, 0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,255,' + (0.25 + Math.abs(flap) * 0.3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4 * side, -2);
      ctx.quadraticCurveTo(side * 28, -22 - flap * 10, side * 50, -6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    if (Math.random() < 0.35) spawnOrbs(hx, hy - 8, 1);
    for (var oi = orbs.length - 1; oi >= 0; oi--) {
      var o = orbs[oi];
      o.x += o.vx;
      o.y += o.vy;
      o.vy -= 0.02;
      o.life -= o.decay;
      if (o.life <= 0) {
        orbs.splice(oi, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = 'hsla(' + o.hue + ',90%,70%,' + o.life * 0.85 + ')';
      ctx.shadowColor = 'hsla(' + o.hue + ',100%,60%,0.8)';
      ctx.shadowBlur = 8;
      ctx.arc(o.x, o.y, o.r * o.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    var pulse = 0.5 + Math.sin(t * 2.8) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var core = ctx.createRadialGradient(hx, hy - 6, 0, hx, hy - 6, 22);
    core.addColorStop(0, 'rgba(220,245,255,' + (0.35 + pulse * 0.25) + ')');
    core.addColorStop(0.4, 'rgba(100,180,255,0.15)');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(hx, hy - 6, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,230,255,' + (0.12 + pulse * 0.12) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx - 28, hy - 6);
    ctx.lineTo(hx + 28, hy - 6);
    ctx.moveTo(hx, hy - 28);
    ctx.lineTo(hx, hy + 12);
    ctx.stroke();
    ctx.restore();
  }

  function ensureHitTarget() {
    var id = 'sn-helper-hit';
    var hit = document.getElementById(id);
    if (hit) return hit;
    hit = document.createElement('button');
    hit.id = id;
    hit.type = 'button';
    hit.setAttribute('aria-label', 'Silver helper · simulation game');
    hit.title = 'Silver wings · advanced gfx · simulate a transaction';
    hit.style.cssText =
      'position:fixed;z-index:130;width:96px;height:96px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;pointer-events:auto;border-radius:50%;' +
      'outline:none;-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', function (ev) {
      try {
        ev.preventDefault();
        ev.stopPropagation();
      } catch (_) {}
      offerSimGame();
    });
    return hit;
  }

  function placeHit(x, y) {
    var hit = ensureHitTarget();
    hit.style.left = Math.round(x - 48) + 'px';
    hit.style.top = Math.round(y - 48) + 'px';
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
    spawnOrbs(baseX, baseY, 18);
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SILVER \u00b7 GAME', force: true, showcaseMs: 14000 });
      }
    } catch (_) {}
  }

  function boostHelperGfx() {
    try {
      if (!global.SNHelper) return;
      if (SNHelper.ensureSprites) SNHelper.ensureSprites();
      var c = document.getElementById('sn-helper-canvas');
      if (c) {
        var ctx = c.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        c.style.filter = 'contrast(1.08) saturate(1.15) brightness(1.05)';
      }
    } catch (_) {}
  }

  function hoverTick(now) {
    hoverRaf = requestAnimationFrame(hoverTick);
    if (!global.SNHelper) return;
    var busy = false;
    try {
      var rep = SNHelper.report && SNHelper.report();
      if (rep && rep.busy) busy = true;
    } catch (_) {}
    var a = hoverAnchor();
    baseX = a.x;
    baseY = a.y;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    var hx = baseX + Math.sin(t * 0.85) * 7;
    var hy = baseY + Math.sin(t * 1.4) * 11 + Math.cos(t * 0.5) * 4;
    placeHit(hx, hy);
    paintFx(now || performance.now(), hx, hy);
    if (busy) return;
    try {
      if (SNHelper.flyTo) {
        if (!hoverTick._last || now - hoverTick._last > 900) {
          hoverTick._last = now;
          SNHelper.flyTo(
            { x: hx, y: hy },
            {
              kind: 'hover',
              label: 'SILVER \u00b7 GFX',
              detail: 'advanced hover \u00b7 tap for game',
              status: 'standby hover',
              dur: 900,
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
          label: 'SILVER WINGS \u00b7 GFX STANDBY',
          force: true,
          showcaseMs: 999999,
        });
      }
    } catch (_) {}
    boostHelperGfx();
    var a = hoverAnchor();
    baseX = a.x;
    baseY = a.y;
    ensureFx();
    try {
      if (SNHelper.flyTo) {
        SNHelper.flyTo(
          { x: a.x, y: a.y },
          {
            kind: 'hover',
            label: 'SILVER \u00b7 STANDBY',
            detail: 'graphics probe \u00b7 tap me',
            status: 'standby hover',
            dur: 1500,
            log: true,
            onArrive: function () {
              startHoverLoop();
              spawnOrbs(a.x, a.y, 12);
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
      log('Silver winged helper \u00b7 advanced gfx hover \u00b7 top right \u00b7 tap for sim game', 'ok');
    }
    return true;
  }

  function tryBoot(n) {
    n = n || 0;
    if (wakeAndHover()) return;
    if (n < 24) setTimeout(function () { tryBoot(n + 1); }, 450);
  }

  window.addEventListener(
    'resize',
    function () {
      resizeFx();
      var a = hoverAnchor();
      baseX = a.x;
      baseY = a.y;
      placeHit(a.x, a.y);
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
    wake: wakeAndHover,
    game: offerSimGame,
  };
})(typeof window !== 'undefined' ? window : globalThis);
