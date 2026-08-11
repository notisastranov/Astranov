/* Astranov — Silver helper · real animation model (vector rig + states)
 * Build: 20260811200000-silver-anim-model
 * States: standby (quiet wing cycle) · active · fly
 * Not a static image + glow. Drawn each frame from a simple bone model.
 */
(function (global) {
  'use strict';
  var BUILD = '20260811200000-silver-anim-model';
  var MODE = 'standby';
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var t0 = 0;
  var ready = false;
  var ax = 0;
  var ay = 0;
  var pose = { flap: 0, bob: 0, lean: 0, thrust: 0, glow: 0.35, size: 42 };

  function log(msg, kind) {
    try { if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok'); } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el = document.getElementById('sn-topchrome') || document.getElementById('sn-topchrome-panel');
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

  function killLegacy() {
    try {
      var fx = document.getElementById('sn-helper-fx');
      if (fx && fx.parentNode) fx.parentNode.removeChild(fx);
    } catch (_) {}
    try {
      var hc = document.getElementById('sn-helper-canvas');
      if (hc) { hc.style.opacity = '0'; hc.style.pointerEvents = 'none'; }
    } catch (_) {}
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return ctx;
    canvas = document.getElementById('sn-silver-calm');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'sn-silver-calm';
      document.body.appendChild(canvas);
    }
    canvas.style.cssText = 'position:fixed;inset:0;z-index:98;pointer-events:none;width:100%;height:100%;';
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

  function tickPose(now) {
    var t = (now - t0) / 1000;
    if (MODE === 'standby') {
      pose.flap = Math.sin(t * 1.6) * 0.22;
      pose.bob = Math.sin(t * 0.9) * 1.2;
      pose.lean = 0;
      pose.thrust = 0;
      pose.glow = 0.28 + Math.sin(t * 1.1) * 0.04;
      pose.size = 40;
    } else if (MODE === 'active') {
      pose.flap = Math.sin(t * 3.2) * 0.4;
      pose.bob = Math.sin(t * 2.0) * 2.5;
      pose.lean = Math.sin(t * 1.4) * 0.08;
      pose.thrust = 0.15 + Math.sin(t * 6) * 0.05;
      pose.glow = 0.55;
      pose.size = 46;
    } else if (MODE === 'fly') {
      pose.flap = Math.sin(t * 8) * 0.55;
      pose.bob = Math.sin(t * 4) * 3;
      pose.lean = 0.15;
      pose.thrust = 0.7 + Math.sin(t * 12) * 0.15;
      pose.glow = 0.75;
      pose.size = 48;
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

    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath();
    c.ellipse(0, s * 0.55, s * 0.32, 3.5, 0, 0, Math.PI * 2);
    c.fill();

    function wing(side) {
      var f = side * flap;
      c.save();
      c.translate(side * s * 0.12, -s * 0.08);
      c.rotate(side * (0.35 + f));
      var g = c.createLinearGradient(0, 0, side * s * 0.7, -s * 0.35);
      g.addColorStop(0, 'rgba(170,210,240,' + (0.35 + pose.glow * 0.2) + ')');
      g.addColorStop(0.6, 'rgba(100,160,220,0.18)');
      g.addColorStop(1, 'rgba(40,80,140,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(side * s * 0.35, -s * 0.45, side * s * 0.72, -s * 0.12);
      c.quadraticCurveTo(side * s * 0.4, s * 0.12, 0, s * 0.08);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(200,230,255,' + (0.45 + pose.glow * 0.25) + ')';
      c.lineWidth = 1.25;
      c.beginPath();
      c.moveTo(0, -1);
      c.quadraticCurveTo(side * s * 0.35, -s * 0.45, side * s * 0.7, -s * 0.12);
      c.stroke();
      c.strokeStyle = 'rgba(160,200,240,0.25)';
      c.lineWidth = 0.8;
      for (var i = 1; i <= 3; i++) {
        var t = i / 4;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(side * s * 0.7 * t, -s * 0.4 * t * (1 - t * 0.3));
        c.stroke();
      }
      c.restore();
    }
    wing(-1);
    wing(1);

    var bodyG = c.createLinearGradient(-s * 0.2, -s * 0.3, s * 0.2, s * 0.35);
    bodyG.addColorStop(0, '#d0dce8');
    bodyG.addColorStop(0.5, '#a8b8c8');
    bodyG.addColorStop(1, '#8090a0');
    c.fillStyle = bodyG;
    roundRect(c, -s * 0.2, -s * 0.22, s * 0.4, s * 0.5, s * 0.12);
    c.fill();
    c.fillStyle = 'rgba(220,235,250,0.9)';
    roundRect(c, -s * 0.12, -s * 0.14, s * 0.24, s * 0.2, 4);
    c.fill();
    var core = c.createRadialGradient(0, -s * 0.02, 0, 0, -s * 0.02, s * 0.1);
    core.addColorStop(0, 'rgba(200,240,255,' + (0.9 * pose.glow + 0.2) + ')');
    core.addColorStop(0.5, 'rgba(80,160,255,0.7)');
    core.addColorStop(1, 'rgba(20,60,120,0)');
    c.fillStyle = core;
    c.beginPath();
    c.arc(0, -s * 0.02, s * 0.09, 0, Math.PI * 2);
    c.fill();

    var headG = c.createLinearGradient(-s * 0.16, -s * 0.55, s * 0.16, -s * 0.2);
    headG.addColorStop(0, '#e0eaf4');
    headG.addColorStop(1, '#90a0b0');
    c.fillStyle = headG;
    c.beginPath();
    c.arc(0, -s * 0.38, s * 0.18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(20,50,90,0.95)';
    roundRect(c, -s * 0.12, -s * 0.44, s * 0.24, s * 0.1, 3);
    c.fill();
    c.fillStyle = 'rgba(80,180,255,' + (0.5 + pose.glow * 0.4) + ')';
    roundRect(c, -s * 0.1, -s * 0.42, s * 0.2, s * 0.06, 2);
    c.fill();
    c.strokeStyle = '#a0b0c0';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -s * 0.55);
    c.lineTo(0, -s * 0.68);
    c.stroke();
    c.fillStyle = 'rgba(100,200,255,0.9)';
    c.beginPath();
    c.arc(0, -s * 0.7, 2.5, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#a8b8c8';
    c.lineWidth = 3.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-s * 0.18, -s * 0.05);
    c.lineTo(-s * 0.34, s * 0.18);
    c.moveTo(s * 0.18, -s * 0.05);
    c.lineTo(s * 0.34, s * 0.18);
    c.stroke();
    c.fillStyle = '#90a0b0';
    c.beginPath();
    c.arc(-s * 0.34, s * 0.2, 3.5, 0, Math.PI * 2);
    c.arc(s * 0.34, s * 0.2, 3.5, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#98a8b8';
    roundRect(c, -s * 0.14, s * 0.22, s * 0.1, s * 0.2, 3);
    roundRect(c, s * 0.04, s * 0.22, s * 0.1, s * 0.2, 3);
    c.fill();

    if (pose.thrust > 0.05) {
      for (var side = -1; side <= 1; side += 2) {
        var th = pose.thrust;
        var jet = c.createLinearGradient(0, s * 0.4, 0, s * 0.4 + 18 * th);
        jet.addColorStop(0, 'rgba(200,240,255,' + (0.7 * th) + ')');
        jet.addColorStop(0.4, 'rgba(60,160,255,' + (0.4 * th) + ')');
        jet.addColorStop(1, 'rgba(0,40,120,0)');
        c.fillStyle = jet;
        c.beginPath();
        c.moveTo(side * s * 0.09 - 3, s * 0.42);
        c.lineTo(side * s * 0.09 + 3, s * 0.42);
        c.lineTo(side * s * 0.09, s * 0.42 + 16 * th);
        c.closePath();
        c.fill();
      }
    }
    c.restore();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    var c = ensureCanvas();
    if (!c) return;
    var minDt = MODE === 'standby' ? 33 : 22;
    if (frame._last && now - frame._last < minDt) return;
    frame._last = now;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    c.clearRect(0, 0, w, h);
    tickPose(now);
    var a = anchor();
    ax = a.x; ay = a.y;
    drawRobot(c, ax, ay);
    placeHit(ax, ay);
  }

  function ensureHit() {
    var id = 'sn-helper-hit';
    var hit = document.getElementById(id);
    if (hit) return hit;
    hit = document.createElement('button');
    hit.id = id; hit.type = 'button';
    hit.title = 'Silver helper · tap to activate';
    hit.setAttribute('aria-label', 'Silver helper');
    hit.style.cssText = 'position:fixed;z-index:130;width:48px;height:48px;border:none;padding:0;background:transparent;cursor:pointer;border-radius:50%;outline:none;-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', function (e) {
      try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
      activate();
    });
    return hit;
  }

  function placeHit(x, y) {
    var hit = ensureHit();
    hit.style.left = Math.round(x - 24) + 'px';
    hit.style.top = Math.round(y - 24) + 'px';
  }

  function setMode(m) { MODE = m; t0 = performance.now(); }

  function activate() {
    setMode('active');
    log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SILVER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'dim');
    log('Helper active \u00b7 animation model online', 'ok');
    log('  simulate pizza order', 'ok');
    log('  simulate delivery', 'ok');
    log('  simulate payment', 'ok');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('Silver active');
      var panel = document.getElementById('panel');
      if (panel) { panel.classList.remove('collapsed'); panel.classList.add('mid'); }
    } catch (_) {}
    setTimeout(function () {
      if (MODE === 'active') { setMode('standby'); log('Silver \u00b7 standby', 'dim'); }
    }, 25000);
  }

  function boot() {
    killLegacy();
    t0 = performance.now();
    ensureCanvas();
    ensureHit();
    if (!raf) raf = requestAnimationFrame(frame);
    if (!ready) { ready = true; log('Silver \u00b7 vector anim model \u00b7 standby \u00b7 tap to activate', 'ok'); }
  }

  window.addEventListener('resize', resize, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1500);
  setTimeout(boot, 4000);

  global.SNChromeHelper = {
    build: BUILD,
    activate: activate,
    setMode: setMode,
    mode: function () { return MODE; },
    fly: function () { setMode('fly'); },
    standby: function () { setMode('standby'); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
