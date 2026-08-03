/**
 * SNHelper — Astranov SpaceX Bot
 * =====================================================
 * GAMING CHARACTER · AI GRAPHICS ONLY
 * - Real AI-generated sprite frames (assets/sprites/spacex-bot/*)
 * - Brand hero (assets/brand/grokbot-512.png)
 * - NO mesh / THREE body · NO procedural Amiga/Atari stick suits
 * - Canvas only composites AI bitmaps + soft glow
 *
 * Honors SpaceX pioneers + AI partner 1/3 net.
 * Aliases: GrokBot · SpaceXBot · HELPER
 * Mechanical: window.SNHelper
 */
(function (global) {
  'use strict';

  var FRAME_URLS = [
    '/assets/sprites/spacex-bot/spacex-bot-1.png',
    '/assets/sprites/spacex-bot/spacex-bot-2.png',
    '/assets/sprites/spacex-bot/spacex-bot-3.png',
    '/assets/sprites/spacex-bot/spacex-bot-4.png',
  ];
  var HERO_URL = '/assets/brand/grokbot-512.png';
  var SHEET_URL = '/assets/sprites/spacex-bot/sheet-transparent.png';

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
    boost: 0,
    frame: 0,
    animT: 0,
    canvas: null,
    ctx: null,
    raf: 0,
    /** AI bitmaps only */
    frames: [],
    hero: null,
    sheet: null,
    loaded: false,
    loadFailed: false,
    trail: [],
    label: 'SPACEX BOT',
    status: 'idle',
    lastMissionAt: 0,
    _lastPaint: 0,
    _dpr: 1,
  };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (_) {}
  }

  function loadImg(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        resolve(im);
      };
      im.onerror = function () {
        resolve(null);
      };
      im.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=ai1';
    });
  }

  /**
   * Load ONLY AI-generated art. Never invent Atari/Amiga polygons.
   */
  function ensureSprites() {
    if (H.loaded || H._loading) return H._loading || Promise.resolve();
    H._loading = Promise.all([
      Promise.all(FRAME_URLS.map(loadImg)),
      loadImg(HERO_URL),
      loadImg(SHEET_URL),
    ]).then(function (pack) {
      var frames = (pack[0] || []).filter(Boolean);
      H.frames = frames;
      H.hero = pack[1] || null;
      H.sheet = pack[2] || null;
      H.loaded = frames.length > 0 || !!H.hero;
      H.loadFailed = !H.loaded;
      H._loading = null;
      if (H.loaded) {
        try {
          log('SPACEX BOT · AI frames ' + frames.length + ' · graphics online', 'ok');
        } catch (_) {}
      } else {
        try {
          log('SPACEX BOT · AI art missing · no procedural fallback', 'err');
        } catch (_) {}
      }
      return H.loaded;
    });
    return H._loading;
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
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    H.canvas.width = Math.floor(w * dpr);
    H.canvas.height = Math.floor(h * dpr);
    H.canvas.style.width = w + 'px';
    H.canvas.style.height = h + 'px';
    H._dpr = dpr;
    if (H.ctx) H.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function screenFromLatLng(lat, lng) {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
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
    return {
      x: w * (0.5 + (Number(lng) || 0) / 360),
      y: h * (0.42 - (Number(lat) || 0) / 180),
    };
  }

  function wake(opts) {
    opts = opts || {};
    ensureSprites();
    ensureCanvas();
    H.visible = true;
    H.label = opts.label || 'SPACEX BOT';
    if (H.canvas) H.canvas.style.opacity = '1';
    if (H.x === 0 && H.y === 0) {
      H.x = (window.innerWidth || 400) * 0.72;
      H.y = (window.innerHeight || 700) * 0.28;
    }
    if (!H.raf) H.raf = requestAnimationFrame(loop);
    return true;
  }

  function sleep() {
    H.visible = false;
    H.busy = false;
    H.mission = null;
    H.status = 'idle';
    try {
      parkAtMoon();
    } catch (_) {}
    if (H.ctx && H.canvas) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      H.ctx.clearRect(0, 0, w, h);
    }
  }

  function parkAtMoon() {
    H.mission = { kind: 'park', label: 'PARKED · MOON', status: 'parked' };
    H.label = 'SPACEX BOT · MOON';
    H.status = 'parked';
    H.busy = false;
    H.boost = 0.12;
    var w = window.innerWidth || 360;
    var h = window.innerHeight || 640;
    H.tx = w * 0.78;
    H.ty = h * 0.18;
    H.x = H.tx;
    H.y = H.ty;
    var tier = '';
    try {
      if (global.SNGlobe && SNGlobe.tier) tier = SNGlobe.tier();
      else if (global.SPACENET && SPACENET.tier) tier = SPACENET.tier();
    } catch (_) {}
    var show = tier === 'solar' || tier === 'SOLAR';
    H.visible = !!show;
    if (H.canvas) H.canvas.style.opacity = show ? '1' : '0';
    if (show) {
      ensureCanvas();
      if (!H.raf) H.raf = requestAnimationFrame(loop);
    }
    return { ok: true, parked: true, tier: tier, visible: show };
  }

  function syncParkVisibility() {
    if (H.busy && H.mission && H.mission.kind !== 'park') return;
    if (!H.mission || H.mission.kind === 'park' || H.status === 'idle' || H.status === 'parked') {
      parkAtMoon();
    }
  }

  function flyTo(target, opts) {
    opts = opts || {};
    wake(opts);
    H.busy = true;
    H.status = opts.status || 'en route';
    H.mission = {
      kind: opts.kind || 'fly',
      label: opts.label || 'SPACEX BOT',
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
    if (opts.log !== false) {
      log(
        'SPACEX BOT · ' +
          (opts.detail || opts.kind || 'mission') +
          (target && target.lat != null
            ? ' · ' + Number(target.lat).toFixed(3) + ',' + Number(target.lng).toFixed(3)
            : ''),
        'ok'
      );
    }
    return H.mission;
  }

  function find(what, pos, opts) {
    opts = opts || {};
    var label = String(what || 'target').slice(0, 28);
    return flyTo(pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 }, {
      kind: 'find',
      label: 'FIND · ' + label,
      detail: 'scanning for ' + label,
      status: 'scanning',
      dur: opts.dur || 3200,
      onArrive: opts.onArrive,
      log: opts.log,
    });
  }

  function assistTask(task, opts) {
    opts = opts || {};
    var t = task || {};
    var pos = {
      lat: t.lat != null ? t.lat : (global._snLastPos && global._snLastPos.lat) || 36.4341,
      lng: t.lng != null ? t.lng : (global._snLastPos && global._snLastPos.lng) || 28.2176,
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

  function patrol(opts) {
    opts = opts || {};
    wake({ label: 'SPACEX BOT' });
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
        H.label = 'SPACEX BOT';
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
    log('SPACEX BOT · patrol · AI character', 'ok');
    next();
  }

  /** Pick AI frame by motion */
  function currentFrame(now) {
    if (!H.frames.length) return H.hero;
    var n = H.frames.length;
    // hover cycle 1-2 · boost uses 3-4
    if (H.boost > 0.45 || H.busy) {
      var i = 2 + (Math.floor(now / 140) % Math.max(1, n - 2));
      return H.frames[Math.min(i, n - 1)];
    }
    var j = Math.floor(now / 220) % Math.min(2, n);
    return H.frames[j];
  }

  function loop(now) {
    if (!H.visible) {
      H.raf = 0;
      return;
    }
    H.raf = requestAnimationFrame(loop);
    if (!H.ctx) return;
    if (document.hidden) return;
    // ~36fps — game feel without sticky
    if (H._lastPaint && now - H._lastPaint < 28) return;
    H._lastPaint = now;

    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    var ctx = H.ctx;
    ctx.clearRect(0, 0, w, h);

    // Motion
    if (H.busy && H.mission) {
      var dx = H.tx - H.x;
      var dy = H.ty - H.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed = 5.2 + H.boost * 7;
      if (dist < 14) {
        H.x = H.tx;
        H.y = H.ty;
        H.boost *= 0.86;
        var elapsed = now - H.mission.t0;
        if (elapsed > (H.mission.dur || 2000) * 0.55) {
          var arrive = H.mission.onArrive;
          H.mission.onArrive = null;
          H.busy = false;
          H.status = 'arrived';
          H.label = H.label.replace(/^FIND · /, 'FOUND · ').replace(/^TASK · /, 'ON · ');
          H.boost = 0.2;
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
        H.boost = Math.min(1.5, H.boost * 0.98 + 0.03);
      }
    } else {
      H.y += Math.sin(now * 0.0028) * 0.22;
      H.x += Math.cos(now * 0.0019) * 0.1;
      H.angle *= 0.9;
      H.boost *= 0.95;
    }

    H.frame++;

    // Soft thruster trail — light particles only (not retro blocks)
    H.trail.push({ x: H.x, y: H.y + 18, a: 0.7 });
    if (H.trail.length > 14) H.trail.shift();
    var i;
    for (i = 0; i < H.trail.length; i++) {
      var tr = H.trail[i];
      tr.a *= 0.86;
      var rg = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, 6 + i * 0.4);
      rg.addColorStop(0, 'rgba(255,255,255,' + tr.a * 0.55 + ')');
      rg.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 5 + i * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw AI character bitmap only
    var img = currentFrame(now);
    if (!img && H.hero) img = H.hero;
    if (img) {
      ctx.save();
      ctx.translate(H.x, H.y);
      ctx.rotate(H.angle * 0.28);
      var scale = H.busy ? 1.08 : 1 + Math.sin(now * 0.004) * 0.03;
      var bw = 88 * scale;
      var bh = 88 * scale;
      // soft AI bloom under feet/body
      var bloom = ctx.createRadialGradient(0, 8, 4, 0, 8, bw * 0.55);
      bloom.addColorStop(0, 'rgba(255,255,255,0.22)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(0, 10, bw * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(img, -bw / 2, -bh / 2 - 6, bw, bh);
      ctx.restore();
    } else if (!H.loaded && !H.loadFailed) {
      // loading AI frames — minimal text, no fake robot
      ctx.save();
      ctx.font = '600 11px system-ui,sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('SPACEX BOT · loading AI art…', H.x - 70, H.y);
      ctx.restore();
    }

    // Label — SpaceXAI white plate (not cyan Atari)
    ctx.save();
    ctx.font = '700 11px system-ui,Segoe UI,sans-serif';
    var text = H.label || 'SPACEX BOT';
    var tw = ctx.measureText(text).width;
    var lx = H.x - tw / 2 - 10;
    var ly = H.y + 46;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(lx, ly, tw + 20, 18, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(lx, ly, tw + 20, 18);
      ctx.strokeRect(lx, ly, tw + 20, 18);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, H.x - tw / 2, ly + 13);
    if (H.status && H.status !== 'idle' && H.status !== 'parked') {
      ctx.font = '600 9px system-ui,sans-serif';
      ctx.fillStyle = 'rgba(220,220,220,0.85)';
      ctx.fillText(String(H.status), H.x - 28, ly + 30);
    }
    ctx.restore();
  }

  function init(opts) {
    opts = opts || {};
    if (H.ready) return true;
    ensureSprites();
    H.x = (window.innerWidth || 400) * 0.78;
    H.y = (window.innerHeight || 700) * 0.22;
    H.tx = H.x;
    H.ty = H.y;
    H.ready = true;
    try {
      parkAtMoon();
    } catch (_) {}
    try {
      setInterval(function () {
        try {
          syncParkVisibility();
        } catch (_) {}
      }, 2000);
    } catch (_) {}
    window.addEventListener('resize', resize, { passive: true });
    return true;
  }

  function report() {
    return {
      ready: H.ready,
      visible: H.visible,
      busy: H.busy,
      status: H.status,
      label: H.label,
      aiFrames: H.frames.length,
      aiLoaded: H.loaded,
      engine: 'AI-sprite-only · no mesh · no Atari painter',
      mission: H.mission && H.mission.kind,
      line:
        'SPACEX BOT · ' +
        (H.busy ? H.status : H.status || 'standby') +
        ' · ' +
        (H.loaded ? H.frames.length + ' AI frames' : 'loading AI art'),
    };
  }

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
    parkAtMoon: parkAtMoon,
    syncParkVisibility: syncParkVisibility,
    find: find,
    assistTask: assistTask,
    patrol: patrol,
    report: report,
    hookMarketFind: hookMarketFind,
    ensureSprites: ensureSprites,
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
