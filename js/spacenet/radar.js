/**
 * Field radar — left zone, ~8fps (SPECS field HUD)
 * Earth rotation speed 1671 km/h on global view.
 */
(function (global) {
  'use strict';

  var EARTH_KMH = 1671;
  var sweep = 0;
  var timer = null;
  var targets = [];

  function canvas() {
    return document.getElementById('field-radar-canvas');
  }

  function setSpeed(val, mode) {
    var el = document.getElementById('fsh-value');
    var unit = document.getElementById('fsh-unit');
    var wrap = document.getElementById('field-radar-speed');
    if (el) el.textContent = String(Math.round(val));
    if (unit) unit.textContent = 'km/h';
    if (wrap) {
      wrap.classList.remove('earth', 'driving', 'idle');
      wrap.classList.add(mode || 'earth');
    }
  }

  function refreshTargets() {
    targets = [];
    try {
      var vendors = global.SNCommerce?.vendors || [];
      for (var i = 0; i < Math.min(12, vendors.length); i++) {
        var v = vendors[i];
        if (v && v.lat != null) {
          targets.push({
            a: ((v.lng || 0) * Math.PI) / 180,
            r: 0.25 + (i % 5) * 0.12,
            kind: 'shop',
          });
        }
      }
    } catch (e) {
      /* ignore */
    }
    try {
      var places = global.SNSpatial?.list?.() || [];
      for (var j = 0; j < Math.min(6, places.length); j++) {
        var p = places[j];
        targets.push({
          a: ((p.lng || 0) * Math.PI) / 180,
          r: 0.35 + (j % 4) * 0.1,
          kind: 'place',
        });
      }
    } catch (e2) {
      /* ignore */
    }
  }

  function draw() {
    var c = canvas();
    if (!c) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var w = c.width;
    var h = c.height;
    var cx = w / 2;
    var cy = h / 2;
    var R = Math.min(w, h) / 2 - 4;
    ctx.clearRect(0, 0, w, h);

    // rings
    ctx.strokeStyle = 'rgba(0,180,255,0.25)';
    ctx.lineWidth = 1;
    for (var ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * ring) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.stroke();

    // sweep
    sweep = (sweep + 0.07) % (Math.PI * 2);
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, 'rgba(0,200,255,0.0)');
    grad.addColorStop(1, 'rgba(0,180,255,0.18)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweep - 0.45, sweep);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,200,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
    ctx.stroke();

    // blips
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      var rr = t.r * R;
      var x = cx + Math.cos(t.a + sweep * 0.15) * rr;
      var y = cy + Math.sin(t.a + sweep * 0.15) * rr;
      ctx.fillStyle = t.kind === 'shop' ? 'rgba(0,255,150,0.9)' : 'rgba(100,180,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // earth speed on global tier
    var tier = global.SNGlobe?.tier || 'global';
    if (tier === 'global' || tier === 'solar') {
      setSpeed(EARTH_KMH, 'earth');
    } else if (tier === 'city') {
      setSpeed(0, 'idle');
    } else {
      setSpeed(Math.round(EARTH_KMH * 0.35), 'earth');
    }

    global.SNResources?.noteFrame?.();
  }

  function init() {
    if (init._done) return;
    init._done = true;
    refreshTargets();
    draw();
    timer = setInterval(draw, 125); // ~8fps
    setInterval(refreshTargets, 8000);
  }

  function destroy() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  global.SNRadar = {
    init: init,
    destroy: destroy,
    refresh: refreshTargets,
    EARTH_KMH: EARTH_KMH,
  };
})(typeof window !== 'undefined' ? window : globalThis);
