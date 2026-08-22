/* Astranov mobile-life · 20260822154500
 * Phones were getting a black globe: canvas CSS 1.25x viewport + ACES/shader +
 * low-power GPU + a megabyte of drivers before first paint.
 * This file is first. It marks lite, paints a 2D Earth, and must never throw.
 */
(function (g) {
  'use strict';
  var touch = false;
  try {
    touch = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0;
  } catch (_) {}
  var ua = '';
  try { ua = String(navigator.userAgent || ''); } catch (_) {}
  var phone = touch || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
  g._snLite = !!phone;
  g.SNPerf = g.SNPerf || {};
  if (phone) {
    g.SNPerf.lite = true;
    g.SNPerf.dprCap = 1.15;
    g.SNPerf.globeSegs = 40;
    g.SNPerf.starN = 360;
    g.SNPerf.idleSkip = 2;
  }
  function inject() {
    if (document.getElementById('sn-mobile-life-css')) return;
    var s = document.createElement('style');
    s.id = 'sn-mobile-life-css';
    s.textContent =
      '#globe{position:fixed;inset:0;width:100%;height:100%;overflow:hidden;z-index:1;background:#000}' +
      '#globe canvas{position:absolute!important;left:0!important;top:0!important;' +
      'width:100%!important;height:100%!important;display:block!important;touch-action:none}' +
      '#sn-earth-fallback{z-index:0!important;pointer-events:none!important}' +
      'html,body{overflow:hidden;overscroll-behavior:none;width:100%;height:100%;height:100dvh}';
    (document.head || document.documentElement).appendChild(s);
  }
  function paintFallback() {
    try {
      var host = document.getElementById('globe');
      if (!host) return;
      var d = document.getElementById('sn-earth-fallback');
      if (!d) {
        d = document.createElement('canvas');
        d.id = 'sn-earth-fallback';
        d.setAttribute('aria-hidden', 'true');
        host.insertBefore(d, host.firstChild);
      }
      var w = host.clientWidth || g.innerWidth || 390;
      var h = host.clientHeight || g.innerHeight || 844;
      if (d.width !== w) d.width = w;
      if (d.height !== h) d.height = h;
      var ctx = d.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.34;
      var grd = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.32, r * 0.12, cx, cy, r);
      grd.addColorStop(0, '#5cbcf0');
      grd.addColorStop(0.5, '#0d4fa0');
      grd.addColorStop(1, '#03101f');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.fillStyle = '#34a24e';
      function land(dx, dy, rx, ry) {
        ctx.beginPath();
        ctx.ellipse(cx + dx * r, cy + dy * r, rx * r, ry * r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      land(-0.34, -0.04, 0.18, 0.32);
      land(-0.26, 0.3, 0.1, 0.22);
      land(0.08, -0.2, 0.16, 0.1);
      land(0.14, 0.1, 0.22, 0.3);
      land(0.44, -0.1, 0.3, 0.14);
      land(0.52, 0.24, 0.14, 0.08);
      ctx.fillStyle = '#eef6fb';
      land(0, -0.82, 0.28, 0.08);
      land(0, 0.88, 0.5, 0.07);
      ctx.strokeStyle = 'rgba(20,195,243,0.7)';
      ctx.lineWidth = Math.max(2, r * 0.02);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.stroke();
    } catch (_) {}
  }
  function fitCanvas() {
    try {
      paintFallback();
      var el = document.getElementById('globe');
      var c = el && el.querySelector('canvas:not(#sn-earth-fallback)');
      if (c) {
        var live = !!(g.SNGlobe && SNGlobe.webglLive);
        c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none;z-index:2;opacity:' + (phone && !live ? '0' : '1');
      }
      if (g.SNGlobe && typeof g.SNGlobe.fit === 'function') g.SNGlobe.fit();
    } catch (_) {}
  }
  inject();
  paintFallback();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { inject(); paintFallback(); });
  }
  g.addEventListener('resize', fitCanvas, { passive: true });
  g.addEventListener('orientationchange', function () { setTimeout(fitCanvas, 60); }, { passive: true });
  if (g.visualViewport) {
    g.visualViewport.addEventListener('resize', fitCanvas, { passive: true });
  }
  setInterval(fitCanvas, 4000);
  g.SNMobileLife = { build: '20260822154500-city-life', phone: phone, fit: fitCanvas, paint: paintFallback };
})(typeof window !== 'undefined' ? window : globalThis);
