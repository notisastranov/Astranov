/**
 * SNEarthOps — high-end gaming layer on Real Earth
 * =================================================
 * Real-Earth OS stays underneath. This is the mission theater on top.
 * HELPER = silver-wing SpaceX Bot · Astranov AI body (AI sprites ONLY).
 * No procedural robot mesh. Frames: /assets/sprites/spacex-bot/*
 *
 * CLI: earth ops · ops · play levels · gaming · levels
 * UI: floating EARTH OPS chip · HELPER escort auto-wake
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

  var open = false;
  var phase = 'idle'; // idle | brief | play | clear | dead
  var level = 0;
  var score = 0;
  var lives = 3;
  var combo = 0;
  var comboT = 0;
  var targets = [];
  var hostiles = [];
  var particles = [];
  var bullets = [];
  var floats = [];
  var stars = [];
  var canvas = null;
  var ctx = null;
  var dpr = 1;
  var W = 0;
  var H = 0;
  var unsub = null;
  var last = 0;
  var message = '';
  var helperStatus = 'standby';
  var fireCd = 0;
  var invuln = 0;
  var trauma = 0;
  var hitStop = 0;
  var flash = 0;
  var briefT = 0;
  var player = { x: 0.5, y: 0.74, vx: 0, vy: 0, roll: 0 };
  var helper = { x: 0.62, y: 0.68, vx: 0, vy: 0, frame: 0, anim: 0, bob: 0 };
  var keys = Object.create(null);
  var pointerDown = false;
  var joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  var fireTouch = false;
  var chip = null;
  var frames = [];
  var hero = null;
  var spritesReady = false;
  var spritesLoading = null;
  var mounted = false;
  var reduceMotion = false;

  var LEVELS = [
    {
      name: 'Athens Orbit',
      targets: 5,
      hostiles: 3,
      story: 'HELPER lights the first rifts over Hellas.',
      speed: 1,
    },
    {
      name: 'Med Corridor',
      targets: 7,
      hostiles: 5,
      story: 'Silver wings cut the Mediterranean dark.',
      speed: 1.1,
    },
    {
      name: 'Atlantic Gate',
      targets: 9,
      hostiles: 8,
      story: 'Storm bands · AI escort hold.',
      speed: 1.2,
    },
    {
      name: 'Polar Vault',
      targets: 11,
      hostiles: 11,
      story: 'Night side · full combat loadout.',
      speed: 1.3,
    },
    {
      name: 'Lunar Relay',
      targets: 13,
      hostiles: 14,
      story: 'HELPER parks the moon · final clear.',
      speed: 1.45,
    },
  ];

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (_) {}
  }
  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(m);
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
      im.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=ops2';
    });
  }

  function ensureSprites() {
    if (spritesReady) return Promise.resolve(true);
    if (spritesLoading) return spritesLoading;
    spritesLoading = Promise.all([
      Promise.all(FRAME_URLS.map(loadImg)),
      loadImg(HERO_URL),
    ]).then(function (pack) {
      frames = (pack[0] || []).filter(Boolean);
      hero = pack[1] || null;
      spritesReady = frames.length > 0 || !!hero;
      spritesLoading = null;
      return spritesReady;
    });
    return spritesLoading;
  }

  function ensureChip() {
    if (chip && document.body.contains(chip)) return chip;
    chip = document.createElement('button');
    chip.id = 'sn-earth-ops-chip';
    chip.type = 'button';
    chip.setAttribute('aria-label', 'Launch Earth Ops gaming');
    chip.innerHTML =
      '<span class="eoc-dot"></span><span class="eoc-txt">EARTH OPS · PLAY</span><span class="eoc-sub">HELPER wingman</span>';
    chip.style.cssText =
      'position:fixed;right:12px;bottom:88px;z-index:130;display:flex;flex-direction:column;align-items:flex-start;gap:2px;' +
      'padding:10px 14px 10px 12px;border-radius:14px;border:1px solid rgba(148,200,255,0.35);' +
      'background:linear-gradient(135deg,rgba(8,14,28,0.92),rgba(18,28,48,0.88));' +
      'color:#e8eef8;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:0.04em;' +
      'box-shadow:0 8px 28px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.08);' +
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;touch-action:manipulation;' +
      'min-width:148px;text-align:left;';
    var style = document.createElement('style');
    style.id = 'sn-earth-ops-chip-css';
    style.textContent =
      '#sn-earth-ops-chip .eoc-dot{position:absolute;left:10px;top:12px;width:7px;height:7px;border-radius:50%;' +
      'background:#5eead4;box-shadow:0 0 10px #5eead4;animation:eoc-pulse 1.6s ease-in-out infinite}' +
      '#sn-earth-ops-chip .eoc-txt{padding-left:14px;font-weight:700;font-size:12px}' +
      '#sn-earth-ops-chip .eoc-sub{padding-left:14px;font-size:10px;opacity:0.65;font-weight:500;letter-spacing:0.02em}' +
      '#sn-earth-ops-chip:hover,#sn-earth-ops-chip:focus-visible{border-color:rgba(94,234,212,0.7);outline:none;' +
      'box-shadow:0 10px 32px rgba(40,120,200,0.35),inset 0 1px 0 rgba(255,255,255,0.12)}' +
      '#sn-earth-ops-chip:active{transform:scale(0.97)}' +
      '@keyframes eoc-pulse{0%,100%{opacity:1}50%{opacity:0.35}}' +
      '@media (max-width:480px){#sn-earth-ops-chip{bottom:100px;right:10px;min-width:132px;padding:9px 12px}}';
    if (!document.getElementById('sn-earth-ops-chip-css')) document.head.appendChild(style);
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      start();
    });
    document.body.appendChild(chip);
    return chip;
  }

  function setChipVisible(v) {
    ensureChip();
    if (chip) chip.style.display = v ? 'flex' : 'none';
  }

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'sn-earth-ops';
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:120;pointer-events:auto;display:none;touch-action:none;background:transparent';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', function (e) {
      keys[e.code] = false;
    });
    try {
      reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) {}
    // ambient star field (presentation only)
    var i;
    for (i = 0; i < 48; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.55,
        s: 0.5 + Math.random() * 1.6,
        a: 0.25 + Math.random() * 0.55,
        p: Math.random() * 6,
      });
    }
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth || 360;
    H = window.innerHeight || 640;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function joyZone() {
    return { x: 72, y: H - 96, r: 56 };
  }
  function fireZone() {
    return { x: W - 72, y: H - 96, r: 48 };
  }

  function onDown(e) {
    if (!open) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (phase === 'brief') {
      phase = 'play';
      spawnLevel();
      return;
    }
    if (phase === 'dead' || phase === 'clear') {
      if (phase === 'dead') start();
      else close();
      return;
    }
    var jz = joyZone();
    var fz = fireZone();
    var dj = Math.hypot(x - jz.x, y - jz.y);
    var df = Math.hypot(x - fz.x, y - fz.y);
    if (dj < jz.r + 24) {
      joy.active = true;
      joy.id = e.pointerId;
      joy.ox = jz.x;
      joy.oy = jz.y;
      joy.x = 0;
      joy.y = 0;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    } else if (df < fz.r + 28) {
      fireTouch = true;
      if (phase === 'play') fire();
    } else {
      pointerDown = true;
      if (phase === 'play') fire();
    }
  }

  function onMove(e) {
    if (!open || !joy.active || e.pointerId !== joy.id) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var dx = (x - joy.ox) / 48;
    var dy = (y - joy.oy) / 48;
    var len = Math.hypot(dx, dy) || 1;
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    joy.x = dx;
    joy.y = dy;
  }

  function onUp(e) {
    if (joy.active && (e.pointerId === joy.id || e.type === 'pointercancel')) {
      joy.active = false;
      joy.id = null;
      joy.x = 0;
      joy.y = 0;
    }
    pointerDown = false;
    fireTouch = false;
  }

  function onKey(e) {
    if (!open) return;
    keys[e.code] = true;
    if (e.code === 'Escape') {
      close();
      return;
    }
    if (e.code === 'Enter' && phase === 'brief') {
      phase = 'play';
      spawnLevel();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (phase === 'play') fire();
      else if (phase === 'brief') {
        phase = 'play';
        spawnLevel();
      } else if (phase === 'dead') start();
    }
  }

  function fire() {
    if (phase !== 'play' || fireCd > 0) return;
    fireCd = 0.1;
    // dual guns + HELPER wing beam
    bullets.push({ x: player.x - 0.018, y: player.y - 0.05, vy: -1.75, vx: 0, friendly: true, life: 1.3, w: 3 });
    bullets.push({ x: player.x + 0.018, y: player.y - 0.05, vy: -1.75, vx: 0, friendly: true, life: 1.3, w: 3 });
    bullets.push({
      x: helper.x,
      y: helper.y - 0.03,
      vy: -1.55,
      vx: (Math.random() - 0.5) * 0.08,
      friendly: true,
      life: 1.15,
      w: 4,
      helper: true,
    });
    flash = 0.08;
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SPACEX BOT · GUNS' });
        helperStatus = 'guns free';
      }
    } catch (_) {}
  }

  function spawnLevel() {
    var def = LEVELS[Math.min(level, LEVELS.length - 1)];
    targets = [];
    hostiles = [];
    bullets = [];
    var i;
    for (i = 0; i < def.targets; i++) {
      targets.push({
        x: 0.12 + Math.random() * 0.76,
        y: 0.1 + Math.random() * 0.36,
        hp: 2 + Math.floor(level / 2),
        maxHp: 2 + Math.floor(level / 2),
        t: Math.random() * 6,
        spin: 0.8 + Math.random() * 1.4,
      });
    }
    for (i = 0; i < def.hostiles; i++) {
      hostiles.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.08 + Math.random() * 0.32,
        vx: (Math.random() - 0.5) * 0.28 * def.speed,
        hp: 1 + Math.floor(level / 2),
        fireCd: 0.8 + Math.random() * 1.6,
        kind: Math.random() > 0.7 ? 'heavy' : 'drone',
      });
    }
    message = def.story;
    helperStatus = 'escort · ' + def.name;
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SPACEX BOT · OPS' });
        if (SNHelper.patrol) SNHelper.patrol();
      }
    } catch (_) {}
    log('Earth Ops · ' + def.name + ' · HELPER wingman online', 'ok');
    preview(def.name);
  }

  function start() {
    ensure();
    ensureSprites();
    setChipVisible(false);
    open = true;
    canvas.style.display = 'block';
    phase = 'brief';
    briefT = 1.8;
    level = 0;
    score = 0;
    lives = 3;
    combo = 0;
    trauma = 0;
    hitStop = 0;
    player.x = 0.5;
    player.y = 0.74;
    player.vx = 0;
    player.vy = 0;
    helper.x = 0.62;
    helper.y = 0.68;
    floats = [];
    particles = [];
    bullets = [];
    targets = [];
    hostiles = [];
    message = 'MISSION BRIEF · HELPER AI body online';
    helperStatus = 'launch sequence';
    last = 0;
    if (!unsub && global.SNGameLoop && SNGameLoop.subscribe) {
      unsub = SNGameLoop.subscribe(
        function (dtMs, now) {
          tick(now, dtMs);
        },
        { lane: 'critical', name: 'earth-ops' }
      );
    } else if (!unsub) {
      var loop = function (now) {
        if (!open) return;
        requestAnimationFrame(loop);
        tick(now, last ? now - last : 16);
        last = now;
      };
      requestAnimationFrame(loop);
      unsub = function () {};
    }
    try {
      if (global.SNGameLoop && SNGameLoop.power) SNGameLoop.power();
    } catch (_) {}
    try {
      if (global.SNLoader && SNLoader.ensure) SNLoader.ensure('helper');
    } catch (_) {}
    try {
      if (global.SNHelper) {
        if (SNHelper.init) SNHelper.init({ autoWake: false });
        if (SNHelper.wake) SNHelper.wake({ label: 'SPACEX BOT · EARTH OPS' });
        // park OS helper off-canvas during ops so in-game sprite is the hero
        if (SNHelper.sleep) SNHelper.sleep();
      }
    } catch (_) {}
    log('Earth Ops online · WASD move · Space fire · Esc exit · HELPER silver-wing escort', 'ok');
    preview('Earth Ops');
  }

  function close() {
    open = false;
    phase = 'idle';
    if (canvas) canvas.style.display = 'none';
    if (unsub) {
      try {
        unsub();
      } catch (_) {}
      unsub = null;
    }
    joy.active = false;
    joy.x = 0;
    joy.y = 0;
    setChipVisible(true);
    try {
      if (global.SNHelper && SNHelper.parkAtMoon) SNHelper.parkAtMoon();
    } catch (_) {}
    log('Earth Ops closed · Earth OS restored', 'dim');
    preview('Earth');
  }

  function hurt() {
    if (invuln > 0) return;
    lives -= 1;
    invuln = 1.25;
    trauma = Math.min(1, trauma + 0.55);
    combo = 0;
    message = lives > 0 ? 'HULL HIT · ' + lives + ' left' : 'CRAFT LOST';
    helperStatus = 'cover fire';
    for (var i = 0; i < 14; i++) {
      particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: 0.35 + Math.random() * 0.35,
        c: Math.random() > 0.5 ? '#ff8844' : '#fff',
        s: 2 + Math.random() * 3,
      });
    }
    if (lives <= 0) {
      phase = 'dead';
      message = 'DESTROYED · HELPER extracting · tap to relaunch';
      trauma = 1;
      try {
        if (global.SNHelper && SNHelper.wake) SNHelper.wake({ label: 'EXTRACT' });
      } catch (_) {}
    }
  }

  function popFloat(x, y, text, color) {
    floats.push({ x: x, y: y, text: text, life: 0.9, c: color || '#5eead4' });
  }

  function killJuice(x, y, big) {
    hitStop = big ? 0.055 : 0.028;
    trauma = Math.min(1, trauma + (big ? 0.4 : 0.22));
    var n = big ? 18 : 10;
    for (var i = 0; i < n; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        life: 0.25 + Math.random() * 0.4,
        c: big ? '#5eead4' : '#ffaa66',
        s: 1.5 + Math.random() * 3,
      });
    }
  }

  function tick(now, dtMs) {
    if (!open || !ctx) return;
    var dt = (dtMs || 16) / 1000;
    if (dt > 0.1) dt = 0.1;
    if (hitStop > 0) {
      hitStop -= dt;
      draw(now);
      return;
    }
    if (phase === 'brief') {
      briefT -= dt;
      if (briefT <= 0) {
        phase = 'play';
        spawnLevel();
      }
    } else if (phase === 'play') sim(dt);
    draw(now);
  }

  function sim(dt) {
    fireCd = Math.max(0, fireCd - dt);
    invuln = Math.max(0, invuln - dt);
    comboT = Math.max(0, comboT - dt);
    flash = Math.max(0, flash - dt);
    if (comboT <= 0) combo = 0;
    trauma = Math.max(0, trauma - dt * 1.35);

    var ax = joy.x;
    var ay = joy.y;
    // A = left, D = right (player-visible — never invert)
    if (keys.KeyA || keys.ArrowLeft) ax -= 1;
    if (keys.KeyD || keys.ArrowRight) ax += 1;
    if (keys.KeyW || keys.ArrowUp) ay -= 1;
    if (keys.KeyS || keys.ArrowDown) ay += 1;
    if (ax < -1) ax = -1;
    if (ax > 1) ax = 1;
    if (ay < -1) ay = -1;
    if (ay > 1) ay = 1;

    player.vx = player.vx * 0.84 + ax * 1.05 * 0.2;
    player.vy = player.vy * 0.84 + ay * 0.85 * 0.2;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (player.x < 0.06) player.x = 0.06;
    if (player.x > 0.94) player.x = 0.94;
    if (player.y < 0.42) player.y = 0.42;
    if (player.y > 0.9) player.y = 0.9;
    player.roll = player.roll * 0.85 + player.vx * 0.45;

    // HELPER escort — spring-follow with bob
    helper.bob += dt * 3.2;
    var hx = player.x + 0.11 + Math.sin(helper.bob * 0.7) * 0.02;
    var hy = player.y - 0.06 + Math.cos(helper.bob) * 0.018;
    helper.vx = helper.vx * 0.88 + (hx - helper.x) * 6 * dt;
    helper.vy = helper.vy * 0.88 + (hy - helper.y) * 6 * dt;
    helper.x += helper.vx;
    helper.y += helper.vy;
    helper.anim += dt * 8;
    helper.frame = Math.floor(helper.anim) % Math.max(1, frames.length || 1);

    if (pointerDown || fireTouch || keys.Space) fire();

    var def = LEVELS[Math.min(level, LEVELS.length - 1)];
    var i, t, h, b, j;

    for (i = 0; i < targets.length; i++) {
      t = targets[i];
      t.t += dt * t.spin;
      t.x += Math.sin(t.t) * 0.035 * dt * def.speed;
    }

    for (i = hostiles.length - 1; i >= 0; i--) {
      h = hostiles[i];
      h.x += h.vx * dt;
      if (h.x < 0.05 || h.x > 0.95) h.vx *= -1;
      h.y += Math.sin(performance.now() * 0.001 + i) * 0.025 * dt;
      // gentle chase on heavy
      if (h.kind === 'heavy') {
        h.x += (player.x - h.x) * 0.08 * dt;
        h.y += Math.min(0.02, (player.y - 0.35 - h.y) * 0.05 * dt);
      }
      h.fireCd -= dt;
      if (h.fireCd <= 0) {
        h.fireCd = (h.kind === 'heavy' ? 1.1 : 1.55) + Math.random();
        bullets.push({
          x: h.x,
          y: h.y + 0.03,
          vy: 0.48 + level * 0.04,
          vx: (player.x - h.x) * 0.15,
          friendly: false,
          life: 2.2,
          w: h.kind === 'heavy' ? 5 : 3,
        });
      }
      if (Math.abs(h.x - player.x) < 0.048 && Math.abs(h.y - player.y) < 0.048) {
        hurt();
        h.hp = 0;
      }
      if (h.hp <= 0) {
        killJuice(h.x, h.y, false);
        hostiles.splice(i, 1);
      }
    }

    for (i = bullets.length - 1; i >= 0; i--) {
      b = bullets[i];
      b.y += b.vy * dt;
      b.x += (b.vx || 0) * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -0.06 || b.y > 1.06 || b.x < -0.05 || b.x > 1.05) {
        bullets.splice(i, 1);
        continue;
      }
      if (b.friendly) {
        var hit = false;
        for (j = targets.length - 1; j >= 0; j--) {
          t = targets[j];
          if (Math.abs(b.x - t.x) < 0.045 && Math.abs(b.y - t.y) < 0.045) {
            t.hp -= 1;
            killJuice(t.x, t.y, false);
            bullets.splice(i, 1);
            hit = true;
            if (t.hp <= 0) {
              targets.splice(j, 1);
              combo++;
              comboT = 2.6;
              var pts = 100 * Math.min(10, combo);
              score += pts;
              popFloat(t.x, t.y, '+' + pts, '#5eead4');
              message = combo > 2 ? 'COMBO ×' + combo : 'RIFT CLEARED';
              helperStatus = 'target down';
              killJuice(t.x, t.y, true);
            }
            break;
          }
        }
        if (hit) continue;
        for (j = hostiles.length - 1; j >= 0; j--) {
          h = hostiles[j];
          if (Math.abs(b.x - h.x) < 0.042 && Math.abs(b.y - h.y) < 0.042) {
            h.hp -= 1;
            killJuice(h.x, h.y, false);
            bullets.splice(i, 1);
            if (h.hp <= 0) {
              hostiles.splice(j, 1);
              combo++;
              comboT = 2.6;
              score += 60 * Math.min(6, combo);
              popFloat(h.x, h.y, '+60', '#ffaa66');
            }
            break;
          }
        }
      } else if (Math.abs(b.x - player.x) < 0.04 && Math.abs(b.y - player.y) < 0.04 && invuln <= 0) {
        bullets.splice(i, 1);
        hurt();
      }
    }

    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      floats[i].y -= 0.12 * dt;
      floats[i].life -= dt;
      if (floats[i].life <= 0) floats.splice(i, 1);
    }

    // soft spin Earth underneath for living feel
    try {
      if (global.SNGlobe && SNGlobe.nudge) SNGlobe.nudge(0.12 * dt, 0);
    } catch (_) {}

    if (targets.length === 0 && phase === 'play') {
      score += 500 + level * 120;
      level++;
      if (level >= LEVELS.length) {
        phase = 'clear';
        message = 'SECTOR CLEAR · HELPER parks the moon';
        helperStatus = 'parked · moon';
        trauma = Math.min(1, trauma + 0.5);
        try {
          if (global.SNHelper && SNHelper.parkAtMoon) SNHelper.parkAtMoon();
        } catch (_) {}
        log('Earth Ops · all levels clear · score ' + score, 'ok');
      } else {
        message = 'LEVEL ' + level + ' CLEAR · HELPER rearming';
        popFloat(player.x, player.y - 0.08, 'LEVEL UP', '#fff');
        spawnLevel();
      }
    }
  }

  function drawHelperSprite(sx, sy, scale) {
    var img = null;
    if (frames.length) img = frames[helper.frame % frames.length];
    else if (hero) img = hero;
    if (!img) {
      // SPECS: no procedural robot body — only soft wing glow marker if art missing
      ctx.save();
      ctx.translate(sx, sy);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(180,210,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c8d8ff';
      ctx.font = '700 10px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HELPER', 0, 4);
      ctx.restore();
      return;
    }
    var bw = 72 * scale;
    var bh = 72 * scale;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(helper.vx * 0.8);
    // silver wing glow
    ctx.shadowColor = 'rgba(180,210,255,0.85)';
    ctx.shadowBlur = 22;
    ctx.globalAlpha = 0.98;
    ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
    ctx.shadowBlur = 0;
    // thruster streak
    ctx.globalAlpha = 0.55 + Math.sin(helper.bob * 4) * 0.2;
    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    ctx.moveTo(-6, bh * 0.28);
    ctx.lineTo(6, bh * 0.28);
    ctx.lineTo(0, bh * 0.28 + 10 + Math.random() * 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw(now) {
    if (!ctx) return;
    var shakeAmt = reduceMotion ? 0 : trauma * trauma;
    var ox = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 14 : 0;
    var oy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 14 : 0;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);

    // living space vignette — Earth stays visible
    var g = ctx.createRadialGradient(W * 0.5, H * 0.42, H * 0.08, W * 0.5, H * 0.5, H * 0.75);
    g.addColorStop(0, 'rgba(0,8,24,0)');
    g.addColorStop(0.55, 'rgba(0,6,18,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // parallax stars (upper hemisphere only)
    var i, st;
    for (i = 0; i < stars.length; i++) {
      st = stars[i];
      ctx.globalAlpha = st.a * (0.7 + 0.3 * Math.sin(now * 0.002 + st.p));
      ctx.fillStyle = '#cfe6ff';
      ctx.fillRect(st.x * W, st.y * H, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // orbital ring accent
    ctx.strokeStyle = 'rgba(94,234,212,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.48, W * 0.38, H * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();

    var t, h, b, p, f;
    // rifts
    for (i = 0; i < targets.length; i++) {
      t = targets[i];
      var px = t.x * W;
      var py = t.y * H + Math.sin(t.t) * 5;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t.t);
      var pulse = 0.7 + 0.3 * Math.sin(t.t * 2);
      ctx.strokeStyle = 'rgba(94,234,212,' + pulse + ')';
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.stroke();
      // hp ring
      if (t.hp < t.maxHp) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + (t.hp / t.maxHp) * Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // hostiles
    for (i = 0; i < hostiles.length; i++) {
      h = hostiles[i];
      var hx = h.x * W;
      var hy = h.y * H;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = h.kind === 'heavy' ? '#ff6b6b' : '#f07178';
      ctx.shadowColor = '#f07178';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      if (h.kind === 'heavy') {
        ctx.moveTo(0, -14);
        ctx.lineTo(12, 4);
        ctx.lineTo(6, 12);
        ctx.lineTo(-6, 12);
        ctx.lineTo(-12, 4);
      } else {
        ctx.moveTo(0, -11);
        ctx.lineTo(10, 9);
        ctx.lineTo(-10, 9);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // bullets
    for (i = 0; i < bullets.length; i++) {
      b = bullets[i];
      if (b.helper) {
        ctx.strokeStyle = 'rgba(94,234,212,0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#5eead4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(b.x * W, b.y * H);
        ctx.lineTo(b.x * W, b.y * H + 16);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = b.friendly ? '#b8d4ff' : '#ff4455';
        ctx.shadowColor = b.friendly ? '#6af' : '#f45';
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x * W - (b.w || 3) / 2, b.y * H, b.w || 3, b.friendly ? 16 : 11);
        ctx.shadowBlur = 0;
      }
    }

    // particles
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life * 2.2);
      ctx.fillStyle = p.c;
      var ps = p.s || 3;
      ctx.fillRect(p.x * W - ps / 2, p.y * H - ps / 2, ps, ps);
    }
    ctx.globalAlpha = 1;

    // player craft
    var sx = player.x * W;
    var sy = player.y * H;
    if (invuln <= 0 || Math.floor(now / 60) % 2 === 0) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(player.roll);
      // body
      var grad = ctx.createLinearGradient(0, -20, 0, 16);
      grad.addColorStop(0, '#f4f6fa');
      grad.addColorStop(1, '#8aa0c0');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(100,160,255,0.5)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(15, 13);
      ctx.lineTo(0, 8);
      ctx.lineTo(-15, 13);
      ctx.closePath();
      ctx.fill();
      // cockpit
      ctx.fillStyle = '#3d9eff';
      ctx.shadowColor = '#3d9eff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, -4, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // thrusters
      ctx.fillStyle = flash > 0 ? '#fff' : '#5eead4';
      ctx.shadowBlur = 14;
      ctx.fillRect(-6, 11, 4, 9 + Math.random() * 4);
      ctx.fillRect(2, 11, 4, 9 + Math.random() * 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // HELPER AI wingman — real sprites
    drawHelperSprite(helper.x * W, helper.y * H, W < 420 ? 0.78 : 0.95);
    // HELPER label
    ctx.font = '700 9px system-ui,sans-serif';
    ctx.fillStyle = 'rgba(200,220,255,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('HELPER', helper.x * W, helper.y * H + 42);
    ctx.textAlign = 'left';

    // float scores
    for (i = 0; i < floats.length; i++) {
      f = floats[i];
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.c;
      ctx.font = '700 13px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x * W, f.y * H);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    // HUD panel
    ctx.fillStyle = 'rgba(4,8,16,0.62)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, 10, 10, 228, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px system-ui,sans-serif';
    ctx.fillText('EARTH OPS · L' + Math.min(level + 1, LEVELS.length), 22, 32);
    ctx.font = '600 11px system-ui,sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('SCORE ' + score + '  ·  ♥ ' + lives + (combo > 1 ? '  ·  ×' + combo : ''), 22, 50);
    ctx.fillStyle = '#5eead4';
    ctx.fillText(helperStatus, 22, 68);

    // story strip
    ctx.fillStyle = 'rgba(4,8,16,0.55)';
    var tw = Math.min(W - 24, 460);
    roundRect(ctx, (W - tw) / 2, H - 52, tw, 36, 10);
    ctx.fill();
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '600 12px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message || 'Clear rifts · HELPER wingman', W / 2, H - 30);
    ctx.textAlign = 'left';

    // touch controls (always drawn on mobile-ish widths or when touch used)
    drawTouchChrome();

    if (phase === 'brief') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '700 26px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EARTH OPS', W / 2, H * 0.36);
      ctx.font = '600 14px system-ui,sans-serif';
      ctx.fillStyle = '#5eead4';
      ctx.fillText('HELPER · silver-wing AI body', W / 2, H * 0.42);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 13px system-ui,sans-serif';
      ctx.fillText(LEVELS[0].story, W / 2, H * 0.48);
      ctx.fillText('WASD / stick · Space / fire pad · Esc exit', W / 2, H * 0.54);
      ctx.fillStyle = '#e4e4e7';
      ctx.fillText('Tap · Enter · Space to launch', W / 2, H * 0.62);
      ctx.textAlign = 'left';
    }

    if (phase === 'dead' || phase === 'clear') {
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '700 24px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phase === 'clear' ? 'SECTOR CLEAR' : 'CRAFT LOST', W / 2, H * 0.4);
      ctx.font = '500 14px system-ui,sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText('Score ' + score, W / 2, H * 0.46);
      ctx.fillText(phase === 'clear' ? 'HELPER parks the moon · tap to exit' : 'Tap to relaunch · Esc exit', W / 2, H * 0.52);
      ctx.textAlign = 'left';
    }

    // muzzle white flash
    if (flash > 0) {
      ctx.fillStyle = 'rgba(200,230,255,' + flash * 0.25 + ')';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function drawTouchChrome() {
    var jz = joyZone();
    var fz = fireZone();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = 'rgba(200,220,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(jz.x, jz.y, jz.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(jz.x + joy.x * 28, jz.y + joy.y * 28, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,210,255,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fz.x, fz.y, fz.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fireTouch ? 'rgba(94,234,212,0.45)' : 'rgba(94,234,212,0.18)';
    ctx.beginPath();
    ctx.arc(fz.x, fz.y, fz.r - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#cfe6ff';
    ctx.font = '700 11px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MOVE', jz.x, jz.y + 4);
    ctx.fillText('FIRE', fz.x, fz.y + 4);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
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

  function wants(text) {
    var low = String(text || '').toLowerCase().trim();
    return (
      /^(earth\s*ops|ops|play\s*levels?|gaming|levels?|game\s*mode|orbital|high\s*end)\b/.test(low) ||
      /\bearth\s*ops\b|\bplay\s*levels\b|\bgaming\s*mode\b/.test(low)
    );
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    ensure();
    ensureSprites();
    ensureChip();
    setChipVisible(true);
    // after shell settles, wake HELPER branding once
    setTimeout(function () {
      try {
        if (global.SNHelper && SNHelper.init) SNHelper.init({ autoWake: false });
      } catch (_) {}
    }, 1800);
  }

  // auto-mount chip when arsenal loads this module
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      setTimeout(mount, 0);
    }
  }

  global.SNEarthOps = {
    start: start,
    open: start,
    close: close,
    wants: wants,
    mount: mount,
    get openFlag() {
      return open;
    },
    get score() {
      return score;
    },
    get level() {
      return level + 1;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
