/**
 * SNHelper — winged bluish-silvery Iron Man style robot
 * =====================================================
 * AI Graphics engine test + field agent.
 * NOT polygon AAA mesh — generative canvas sprites + thruster fields.
 * Flies when user finds shops, runs tasks, orders, or says helper.
 *
 * Mechanical: window.SNHelper
 */
(function (global) {
  'use strict';

  var H = {
    ready: false,
    visible: false,
    busy: false,
    mission: null,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    wingPhase: 0,
    boost: 0,
    frame: 0,
    canvas: null,
    ctx: null,
    raf: 0,
    sprites: { body: null, wings: null, glow: null },
    trail: [],
    label: 'HELPER',
    status: 'idle',
    lastMissionAt: 0,
  };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (_) {}
  }

  /** Generative suit art via AI Graphics or local painter */
  function paintSuit(kind, size) {
    size = size || 128;
    var prompt =
      kind === 'wings'
        ? 'winged thruster silvery cyan energy wings iron hero arc field'
        : kind === 'glow'
          ? 'arc reactor core cyan silver pulse energy sphere'
          : 'winged bluish silvery iron man robot hero suit chest reactor cyan glow';
    try {
      if (global.SNAIGraphics && SNAIGraphics.generateCanvas) {
        return SNAIGraphics.generateCanvas(prompt, size, size, {
          style: 'helper-' + kind,
          detail: 1,
        }).canvas;
      }
      if (global.AIGraphics && AIGraphics.generateCanvas) {
        return AIGraphics.generateCanvas(prompt, size, size, {
          style: 'helper-' + kind,
        }).canvas;
      }
    } catch (_) {}
    // Local fallback painter — bluish silvery Iron Man silhouette
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var ctx = c.getContext('2d');
    var cx = size / 2;
    var cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (kind === 'glow') {
      var rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.4);
      rg.addColorStop(0, 'rgba(200,240,255,0.95)');
      rg.addColorStop(0.35, 'rgba(76,201,255,0.7)');
      rg.addColorStop(1, 'rgba(11,111,212,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      return c;
    }

    if (kind === 'wings') {
      // energy wing blades
      ctx.save();
      ctx.translate(cx, cy);
      for (var side = -1; side <= 1; side += 2) {
        ctx.fillStyle = 'rgba(160,210,255,0.55)';
        ctx.strokeStyle = 'rgba(76,201,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(side * 8, -4);
        ctx.quadraticCurveTo(side * size * 0.42, -size * 0.18, side * size * 0.46, size * 0.08);
        ctx.quadraticCurveTo(side * size * 0.28, size * 0.02, side * 10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // feather lines
        ctx.strokeStyle = 'rgba(200,240,255,0.5)';
        for (var f = 0; f < 5; f++) {
          ctx.beginPath();
          ctx.moveTo(side * 12, -2 + f * 3);
          ctx.lineTo(side * (size * 0.35 - f * 4), -8 + f * 6);
          ctx.stroke();
        }
      }
      ctx.restore();
      return c;
    }

    // body suit
    // helmet
    var hg = ctx.createLinearGradient(cx - 18, cy - 40, cx + 18, cy - 10);
    hg.addColorStop(0, '#d8eefc');
    hg.addColorStop(0.5, '#7ec8ff');
    hg.addColorStop(1, '#3a7ec0');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 28, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // visor slit
    ctx.fillStyle = 'rgba(20,40,80,0.85)';
    ctx.fillRect(cx - 12, cy - 32, 24, 5);
    ctx.fillStyle = 'rgba(120,220,255,0.7)';
    ctx.fillRect(cx - 10, cy - 31, 20, 2);
    // torso
    var tg = ctx.createLinearGradient(cx - 22, cy - 12, cx + 22, cy + 28);
    tg.addColorStop(0, '#e8f4ff');
    tg.addColorStop(0.35, '#8ec8f0');
    tg.addColorStop(0.7, '#4a90c8');
    tg.addColorStop(1, '#2a5080');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 12);
    ctx.lineTo(cx + 18, cy - 12);
    ctx.lineTo(cx + 20, cy + 18);
    ctx.lineTo(cx + 10, cy + 32);
    ctx.lineTo(cx - 10, cy + 32);
    ctx.lineTo(cx - 20, cy + 18);
    ctx.closePath();
    ctx.fill();
    // chest arc reactor
    var ar = ctx.createRadialGradient(cx, cy + 2, 1, cx, cy + 2, 12);
    ar.addColorStop(0, '#ffffff');
    ar.addColorStop(0.4, '#4cc9ff');
    ar.addColorStop(1, 'rgba(11,111,212,0.2)');
    ctx.fillStyle = ar;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,240,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // shoulders / plates
    ctx.fillStyle = 'rgba(180,220,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 6, 10, 7, -0.4, 0, Math.PI * 2);
    ctx.ellipse(cx + 20, cy - 6, 10, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.fillStyle = '#6aa8d8';
    ctx.fillRect(cx - 12, cy + 30, 8, 22);
    ctx.fillRect(cx + 4, cy + 30, 8, 22);
    // boots thrusters glow
    ctx.fillStyle = 'rgba(100,200,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy + 54, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, cy + 54, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // rim light
    ctx.strokeStyle = 'rgba(160,220,255,0.55)';
    ctx.lineWidth = 1;
    try { ctx.strokeRect(cx - 22, cy - 40, 44, 96); } catch (_sr) {}
    return c;
  }

  function ensureSprites() {
    if (H.sprites.body) return;
    H.sprites.body = paintSuit('body', 128);
    H.sprites.wings = paintSuit('wings', 160);
    H.sprites.glow = paintSuit('glow', 96);
  }

  function ensureCanvas() {
    if (H.canvas && document.body.contains(H.canvas)) return H.canvas;
    var c = document.createElement('canvas');
    c.id = 'sn-helper-canvas';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText =
      'position:fixed;inset:0;z-index:84;pointer-events:none;width:100%;height:100%;';
    document.body.appendChild(c);
    H.canvas = c;
    H.ctx = c.getContext('2d');
    resize();
    return c;
  }

  function resize() {
    if (!H.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    H.canvas.width = Math.floor(w * dpr);
    H.canvas.height = Math.floor(h * dpr);
    H.canvas.style.width = w + 'px';
    H.canvas.style.height = h + 'px';
    if (H.ctx) H.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function screenFromLatLng(lat, lng) {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    // Prefer map projection if available
    try {
      if (global.SNMap && SNMap.active && SNMap.latLngToContainerPoint) {
        var p = SNMap.latLngToContainerPoint(lat, lng);
        if (p && p.x != null) return { x: p.x, y: p.y };
      }
    } catch (_) {}
    try {
      if (global.SNGlobe && SNGlobe.projectToScreen) {
        var s = SNGlobe.projectToScreen(lat, lng);
        if (s && s.x != null) return { x: s.x, y: s.y };
      }
    } catch (_) {}
    // Soft equirectangular fallback
    return {
      x: w * (0.5 + (Number(lng) || 0) / 360),
      y: h * (0.42 - (Number(lat) || 0) / 180),
    };
  }

  function setPos(x, y) {
    H.x = x;
    H.y = y;
  }

  function wake(opts) {
    opts = opts || {};
    ensureSprites();
    ensureCanvas();
    H.visible = true;
    H.label = opts.label || 'HELPER';
    if (H.x === 0 && H.y === 0) {
      H.x = (window.innerWidth || 400) * 0.72;
      H.y = (window.innerHeight || 700) * 0.28;
    }
    if (!H.raf) H.raf = requestAnimationFrame(loop);
    try {
      var G = global.SNAIGraphics || global.AIGraphics;
      if (G) {
        if (G.showNeural) G.showNeural(true);
        if (G.spawnEffect) G.spawnEffect(H.x, H.y, 0x4cc9ff, 18, 30);
      }
    } catch (_) {}
    return true;
  }

  function sleep() {
    H.visible = false;
    H.busy = false;
    H.mission = null;
    H.status = 'idle';
    if (H.ctx && H.canvas) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      H.ctx.clearRect(0, 0, w, h);
    }
  }

  /**
   * Fly to a geographic or screen target with a mission label.
   */
  function flyTo(target, opts) {
    opts = opts || {};
    wake(opts);
    H.busy = true;
    H.status = opts.status || 'en route';
    H.mission = {
      kind: opts.kind || 'fly',
      label: opts.label || 'HELPER',
      detail: opts.detail || '',
      t0: performance.now(),
      dur: opts.dur || 2800,
      onArrive: opts.onArrive || null,
    };
    H.label = H.mission.label;
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    if (target && target.lat != null) {
      var scr = screenFromLatLng(target.lat, target.lng);
      H.tx = scr.x;
      H.ty = scr.y;
    } else if (target && target.x != null) {
      H.tx = target.x;
      H.ty = target.y;
    } else {
      H.tx = w * 0.5;
      H.ty = h * 0.35;
    }
    H.boost = 1;
    H.lastMissionAt = Date.now();
    try {
      var G = global.SNAIGraphics || global.AIGraphics;
      if (G && G.spawnEffect) G.spawnEffect(H.tx, H.ty, 0x88ccff, 14, 28);
      if (G && G.flyAstranovTo && target && target.lat != null) {
        G.flyAstranovTo(target.lat, target.lng, { label: 'HELPER', color: 0x88d4ff });
      }
    } catch (_) {}
    if (opts.log !== false) {
      log(
        'HELPER · ' +
          (opts.detail || opts.kind || 'mission') +
          (target && target.lat != null
            ? ' · ' + Number(target.lat).toFixed(3) + ',' + Number(target.lng).toFixed(3)
            : ''),
        'ok'
      );
    }
    return H.mission;
  }

  /** High-level: help user find things */
  function find(what, pos, opts) {
    opts = opts || {};
    var label = String(what || 'target').slice(0, 28);
    return flyTo(pos || global._snLastPos || { lat: 37.93, lng: 23.75 }, {
      kind: 'find',
      label: 'FIND · ' + label,
      detail: 'scanning for ' + label,
      status: 'scanning',
      dur: opts.dur || 3200,
      onArrive: opts.onArrive,
      log: opts.log,
    });
  }

  /** High-level: assist a task / order */
  function assistTask(task, opts) {
    opts = opts || {};
    var t = task || {};
    var pos = {
      lat: t.lat != null ? t.lat : (global._snLastPos && global._snLastPos.lat) || 37.93,
      lng: t.lng != null ? t.lng : (global._snLastPos && global._snLastPos.lng) || 23.75,
    };
    return flyTo(pos, {
      kind: 'task',
      label: 'TASK · ' + String(t.title || t.kind || 'job').slice(0, 22),
      detail: t.title || 'task assist',
      status: 'task assist',
      dur: opts.dur || 3600,
      onArrive: opts.onArrive,
    });
  }

  /** Patrol around user when idle find requested */
  function patrol(opts) {
    opts = opts || {};
    wake({ label: 'HELPER' });
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var corners = [
      { x: w * 0.2, y: h * 0.25 },
      { x: w * 0.8, y: h * 0.3 },
      { x: w * 0.7, y: h * 0.55 },
      { x: w * 0.25, y: h * 0.5 },
    ];
    var i = 0;
    function next() {
      if (i >= corners.length) {
        H.busy = false;
        H.status = 'standby';
        H.label = 'HELPER';
        return;
      }
      var p = corners[i++];
      flyTo(p, {
        kind: 'patrol',
        label: 'PATROL',
        detail: 'sector sweep',
        status: 'patrol',
        dur: 1600,
        log: false,
        onArrive: next,
      });
    }
    log('HELPER · patrol sweep', 'ok');
    next();
  }

  function loop(now) {
    H.raf = requestAnimationFrame(loop);
    if (!H.visible || !H.ctx) return;
    if (document.hidden) return;
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    var ctx = H.ctx;
    ctx.clearRect(0, 0, w, h);

    // Steer toward target
    if (H.busy && H.mission) {
      var dx = H.tx - H.x;
      var dy = H.ty - H.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed = 4.2 + H.boost * 6;
      if (dist < 12) {
        H.x = H.tx;
        H.y = H.ty;
        H.boost *= 0.85;
        var elapsed = now - H.mission.t0;
        if (elapsed > (H.mission.dur || 2000) * 0.55) {
          var arrive = H.mission.onArrive;
          H.mission.onArrive = null;
          H.busy = false;
          H.status = 'arrived';
          H.label = H.label.replace(/^FIND · /, 'FOUND · ').replace(/^TASK · /, 'ON · ');
          H.boost = 0.2;
          try {
            var G = global.SNAIGraphics || global.AIGraphics;
            if (G && G.spawnEffect) G.spawnEffect(H.x, H.y, 0x00e8a0, 22, 36);
          } catch (_) {}
          if (typeof arrive === 'function') {
            try {
              arrive();
            } catch (_) {}
          }
        }
      } else {
        H.vx = (dx / dist) * speed;
        H.vy = (dy / dist) * speed;
        H.x += H.vx;
        H.y += H.vy;
        H.angle = Math.atan2(H.vy, H.vx);
        H.boost = Math.min(1.5, H.boost * 0.98 + 0.02);
      }
    } else {
      // idle hover bob
      H.y += Math.sin(now * 0.003) * 0.15;
      H.x += Math.cos(now * 0.0022) * 0.08;
      H.angle *= 0.92;
      H.boost *= 0.96;
    }

    H.wingPhase = now * 0.008;
    H.frame++;

    // Trail
    H.trail.push({ x: H.x, y: H.y, a: 1 });
    if (H.trail.length > 18) H.trail.shift();
    var i;
    for (i = 0; i < H.trail.length; i++) {
      var tr = H.trail[i];
      tr.a *= 0.88;
      ctx.fillStyle = 'rgba(76,201,255,' + tr.a * 0.35 + ')';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 2 + i * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thruster plume
    if (H.boost > 0.15) {
      ctx.save();
      ctx.translate(H.x, H.y);
      ctx.rotate(H.angle + Math.PI / 2);
      var plume = ctx.createLinearGradient(0, 10, 0, 40 + H.boost * 30);
      plume.addColorStop(0, 'rgba(200,240,255,0.85)');
      plume.addColorStop(0.4, 'rgba(76,201,255,0.45)');
      plume.addColorStop(1, 'rgba(11,111,212,0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(6, 12);
      ctx.lineTo(2, 36 + H.boost * 28);
      ctx.lineTo(-2, 36 + H.boost * 28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw wings + body
    ensureSprites();
    ctx.save();
    ctx.translate(H.x, H.y);
    ctx.rotate(H.angle * 0.35);
    var flap = 1 + Math.sin(H.wingPhase) * 0.08;
    ctx.globalAlpha = 0.9;
    if (H.sprites.wings) {
      ctx.save();
      ctx.scale(flap, 1);
      ctx.drawImage(H.sprites.wings, -48, -36, 96, 72);
      ctx.restore();
    }
    if (H.sprites.glow) {
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(now * 0.01);
      ctx.drawImage(H.sprites.glow, -28, -24, 56, 56);
      ctx.globalAlpha = 1;
    }
    if (H.sprites.body) {
      ctx.drawImage(H.sprites.body, -32, -40, 64, 80);
    }
    ctx.restore();

    // Label plate
    ctx.save();
    ctx.font = '700 10px Rajdhani,Orbitron,system-ui,sans-serif';
    ctx.fillStyle = 'rgba(4,16,36,0.75)';
    ctx.strokeStyle = 'rgba(76,201,255,0.55)';
    ctx.lineWidth = 1;
    var text = H.label || 'HELPER';
    var tw = ctx.measureText(text).width;
    var lx = H.x - tw / 2 - 8;
    var ly = H.y + 48;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(lx, ly, tw + 16, 16, 6)
      : ctx.rect(lx, ly, tw + 16, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a8ecff';
    ctx.fillText(text, H.x - tw / 2, ly + 12);
    if (H.status && H.status !== 'idle') {
      ctx.font = '600 9px JetBrains Mono,monospace';
      ctx.fillStyle = 'rgba(140,200,255,0.8)';
      ctx.fillText(H.status, H.x - 24, ly + 28);
    }
    ctx.restore();
  }

  function init() {
    if (H.ready) return true;
    ensureSprites();
    ensureCanvas();
    H.x = (window.innerWidth || 400) * 0.78;
    H.y = (window.innerHeight || 700) * 0.22;
    H.tx = H.x;
    H.ty = H.y;
    H.ready = true;
    window.addEventListener('resize', resize, { passive: true });
    // Soft presence after boot
    setTimeout(function () {
      if (!H.visible) {
        wake({ label: 'HELPER' });
        H.status = 'standby';
        setTimeout(function () {
          if (!H.busy) H.status = 'ready';
        }, 1200);
      }
    }, 2200);
    return true;
  }

  function report() {
    return {
      ready: H.ready,
      visible: H.visible,
      busy: H.busy,
      status: H.status,
      label: H.label,
      mission: H.mission && H.mission.kind,
      line:
        'HELPER · ' +
        (H.busy ? H.status : H.status || 'standby') +
        ' · AI graphics winged suit (not mesh AAA)',
    };
  }

  // Auto-hook common find/task moments
  function hookMarketFind(pos, label) {
    try {
      find(label || 'shops', pos, { log: true });
    } catch (_) {}
  }

  global.SNHelper = {
    init: init,
    wake: wake,
    sleep: sleep,
    flyTo: flyTo,
    find: find,
    assistTask: assistTask,
    patrol: patrol,
    report: report,
    hookMarketFind: hookMarketFind,
    get busy() {
      return H.busy;
    },
    get visible() {
      return H.visible;
    },
    get ready() {
      return H.ready;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
