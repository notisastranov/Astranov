/* Astranov — Silver helper · vector bone model
 * Build: 20260811214000-silver-vector-fix
 * Quiet silver winged robot top-right. Tap → sim game.
 * Rive community asset removed (red faces blob).
 */
(function (global) {
  'use strict';
  var BUILD = '20260811214000-silver-vector-fix';
  var MODE = 'standby';
  var canvas = null;
  var ctx = null;
  var hit = null;
  var raf = 0;
  var t0 = 0;
  var ready = false;
  var pose = { flap: 0, bob: 0, lean: 0, thrust: 0, glow: 0.3, size: 36 };

  function log(msg, kind) {
    try { if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok'); } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el = document.getElementById('sn-topchrome-panel') || document.getElementById('sn-topchrome');
      if (el) return Math.max(48, Math.round(el.getBoundingClientRect().bottom + 4));
    } catch (_) {}
    return 64;
  }

  function killBroken() {
    try {
      ['sn-silver-rive', 'sn-helper-fx', 'sn-helper-canvas', 'sn-silver-calm'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (id === 'sn-helper-canvas') {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
        } else if (el.parentNode) el.parentNode.removeChild(el);
      });
    } catch (_) {}
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return ctx;
    canvas = document.getElementById('sn-silver-vector');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'sn-silver-vector';
      document.body.appendChild(canvas);
    }
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:98;pointer-events:none;width:100%;height:100%;background:transparent;';
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
    }
  }

  function anchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - 44);
    var y = topChromeBottom() + 28;
    y = Math.min(Math.max(y, 56), Math.round(h * 0.18));
    x = Math.min(Math.max(x, 32), w - 28);
    return { x: x, y: y };
  }

  function tickPose(now) {
    var t = (now - t0) / 1000;
    if (MODE === 'standby') {
      pose.flap = Math.sin(t * 1.4) * 0.18;
      pose.bob = Math.sin(t * 0.8) * 0.9;
      pose.lean = 0;
      pose.thrust = 0;
      pose.glow = 0.28 + Math.sin(t * 1.0) * 0.03;
      pose.size = 36;
    } else if (MODE === 'active') {
      pose.flap = Math.sin(t * 2.8) * 0.35;
      pose.bob = Math.sin(t * 1.8) * 2.0;
      pose.lean = Math.sin(t * 1.2) * 0.06;
      pose.thrust = 0.12 + Math.sin(t * 5) * 0.04;
      pose.glow = 0.55;
      pose.size = 40;
    } else {
      pose.flap = Math.sin(t * 7) * 0.5;
      pose.bob = Math.sin(t * 3.5) * 2.5;
      pose.lean = 0.12;
      pose.thrust = 0.65 + Math.sin(t * 10) * 0.12;
      pose.glow = 0.72;
      pose.size = 42;
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawRobot(c, x, y) {
    var s = pose.size;
    var flap = pose.flap;
    var bob = pose.bob;
    var lean = pose.lean;
    c.save();
    c.translate(x, y + bob);
    c.rotate(lean);

    // soft ground shadow
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(0, s * 0.52, s * 0.28, 2.8, 0, 0, Math.PI * 2);
    c.fill();

    function wing(side) {
      c.save();
      c.translate(side * s * 0.1, -s * 0.06);
      c.rotate(side * (0.32 + side * flap));
      var g = c.createLinearGradient(0, 0, side * s * 0.65, -s * 0.3);
      g.addColorStop(0, 'rgba(180,215,245,' + (0.4 + pose.glow * 0.15) + ')');
      g.addColorStop(0.55, 'rgba(100,160,220,0.16)');
      g.addColorStop(1, 'rgba(40,80,140,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(side * s * 0.32, -s * 0.4, side * s * 0.68, -s * 0.1);
      c.quadraticCurveTo(side * s * 0.36, s * 0.1, 0, s * 0.06);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(200,230,255,' + (0.5 + pose.glow * 0.2) + ')';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(0, -1);
      c.quadraticCurveTo(side * s * 0.32, -s * 0.4, side * s * 0.66, -s * 0.1);
      c.stroke();
      c.restore();
    }
    wing(-1);
    wing(1);

    // body
    var bodyG = c.createLinearGradient(-s * 0.18, -s * 0.25, s * 0.18, s * 0.3);
    bodyG.addColorStop(0, '#d4e0ec');
    bodyG.addColorStop(0.5, '#a8b8c8');
    bodyG.addColorStop(1, '#788898');
    c.fillStyle = bodyG;
    roundRect(c, -s * 0.18, -s * 0.2, s * 0.36, s * 0.44, s * 0.1);
    c.fill();
    c.fillStyle = 'rgba(220,235,250,0.92)';
    roundRect(c, -s * 0.1, -s * 0.12, s * 0.2, s * 0.16, 3);
    c.fill();
    var core = c.createRadialGradient(0, -s * 0.02, 0, 0, -s * 0.02, s * 0.09);
    core.addColorStop(0, 'rgba(200,240,255,' + (0.85 * pose.glow + 0.2) + ')');
    core.addColorStop(0.55, 'rgba(70,150,255,0.65)');
    core.addColorStop(1, 'rgba(20,60,120,0)');
    c.fillStyle = core;
    c.beginPath();
    c.arc(0, -s * 0.02, s * 0.08, 0, Math.PI * 2);
    c.fill();

    // head
    var headG = c.createLinearGradient(-s * 0.14, -s * 0.5, s * 0.14, -s * 0.18);
    headG.addColorStop(0, '#e4eef8');
    headG.addColorStop(1, '#90a0b0');
    c.fillStyle = headG;
    c.beginPath();
    c.arc(0, -s * 0.34, s * 0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(15,40,80,0.95)';
    roundRect(c, -s * 0.1, -s * 0.4, s * 0.2, s * 0.09, 2.5);
    c.fill();
    c.fillStyle = 'rgba(80,180,255,' + (0.55 + pose.glow * 0.35) + ')';
    roundRect(c, -s * 0.085, -s * 0.38, s * 0.17, s * 0.05, 2);
    c.fill();
    c.strokeStyle = '#a0b0c0';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(0, -s * 0.5);
    c.lineTo(0, -s * 0.6);
    c.stroke();
    c.fillStyle = 'rgba(100,200,255,0.95)';
    c.beginPath();
    c.arc(0, -s * 0.62, 2.2, 0, Math.PI * 2);
    c.fill();

    // arms
    c.strokeStyle = '#a0b0c0';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.16, -s * 0.04);
    c.lineTo(-s * 0.3, s * 0.15);
    c.moveTo(s * 0.16, -s * 0.04);
    c.lineTo(s * 0.3, s * 0.15);
    c.stroke();
    c.fillStyle = '#8898a8';
    c.beginPath();
    c.arc(-s * 0.3, s * 0.17, 3, 0, Math.PI * 2);
    c.arc(s * 0.3, s * 0.17, 3, 0, Math.PI * 2);
    c.fill();

    // legs
    c.fillStyle = '#90a0b0';
    roundRect(c, -s * 0.12, s * 0.2, s * 0.09, s * 0.16, 2.5);
    roundRect(c, s * 0.03, s * 0.2, s * 0.09, s * 0.16, 2.5);
    c.fill();

    if (pose.thrust > 0.05) {
      for (var side = -1; side <= 1; side += 2) {
        var th = pose.thrust;
        var jet = c.createLinearGradient(0, s * 0.36, 0, s * 0.36 + 14 * th);
        jet.addColorStop(0, 'rgba(200,240,255,' + (0.65 * th) + ')');
        jet.addColorStop(0.45, 'rgba(60,160,255,' + (0.35 * th) + ')');
        jet.addColorStop(1, 'rgba(0,40,120,0)');
        c.fillStyle = jet;
        c.beginPath();
        c.moveTo(side * s * 0.075 - 2.5, s * 0.36);
        c.lineTo(side * s * 0.075 + 2.5, s * 0.36);
        c.lineTo(side * s * 0.075, s * 0.36 + 14 * th);
        c.closePath();
        c.fill();
      }
    }
    c.restore();
  }

  function ensureHit() {
    if (hit && document.body.contains(hit)) return hit;
    hit = document.createElement('button');
    hit.id = 'sn-helper-hit';
    hit.type = 'button';
    hit.title = 'Silver helper · tap to activate';
    hit.setAttribute('aria-label', 'Silver helper');
    hit.style.cssText =
      'position:fixed;z-index:130;width:44px;height:44px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;border-radius:50%;outline:none;' +
      '-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', function (e) {
      try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
      activate();
    });
    return hit;
  }

  function placeHit(x, y) {
    var h = ensureHit();
    h.style.left = Math.round(x - 22) + 'px';
    h.style.top = Math.round(y - 22) + 'px';
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    var c = ensureCanvas();
    if (!c) return;
    var minDt = MODE === 'standby' ? 36 : 24;
    if (frame._last && now - frame._last < minDt) return;
    frame._last = now;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    c.clearRect(0, 0, w, h);
    tickPose(now);
    var a = anchor();
    drawRobot(c, a.x, a.y);
    placeHit(a.x, a.y);
  }

  function setMode(m) {
    MODE = m;
    t0 = performance.now();
  }

  function activate() {
    setMode('active');
    log('──────── SILVER ────────', 'dim');
    log('Helper active · simulation game', 'ok');
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
    setTimeout(function () {
      if (MODE === 'active') {
        setMode('standby');
        log('Silver · standby', 'dim');
      }
    }, 25000);
  }

  function boot() {
    killBroken();
    t0 = performance.now();
    ensureCanvas();
    ensureHit();
    if (!raf) raf = requestAnimationFrame(frame);
    if (!ready) {
      ready = true;
      log('Silver · standby · tap to activate', 'ok');
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1200);
  setTimeout(boot, 3500);

  global.SNChromeHelper = {
    build: BUILD,
    activate: activate,
    setMode: setMode,
    mode: function () { return MODE; },
    fly: function () { setMode('fly'); },
    standby: function () { setMode('standby'); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
