/**
 * SNEarthOps — high-end gaming layer on Real Earth
 * =================================================
 * Turns the OS from "static globe + imagery" into orbital mission theater.
 * HELPER (silver-wing SpaceX Bot / Astranov AI body) is wingman.
 * CLI: earth ops · ops · play levels · gaming · levels
 */
(function (global) {
  'use strict';

  var open = false;
  var phase = 'idle'; // idle | play | clear | dead
  var level = 0;
  var score = 0;
  var lives = 3;
  var combo = 0;
  var comboT = 0;
  var targets = [];
  var hostiles = [];
  var particles = [];
  var bullets = [];
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
  var shake = 0;
  var player = { x: 0.5, y: 0.72, vx: 0, vy: 0 };
  var keys = Object.create(null);
  var pointerDown = false;

  var LEVELS = [
    { name: 'Athens Orbit', targets: 5, hostiles: 3, story: 'HELPER lights first rifts over Hellas.' },
    { name: 'Med Corridor', targets: 7, hostiles: 5, story: 'Silver wings cut the Mediterranean dark.' },
    { name: 'Atlantic Gate', targets: 9, hostiles: 8, story: 'Storm bands · AI escort hold.' },
    { name: 'Polar Vault', targets: 11, hostiles: 11, story: 'Night side · full combat loadout.' },
    { name: 'Lunar Relay', targets: 13, hostiles: 14, story: 'HELPER parks the moon · final clear.' },
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
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', function (e) {
      keys[e.code] = false;
    });
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

  function onDown(e) {
    if (!open) return;
    e.preventDefault();
    pointerDown = true;
    if (phase === 'play') fire();
  }
  function onUp() {
    pointerDown = false;
  }
  function onKey(e) {
    if (!open) return;
    keys[e.code] = true;
    if (e.code === 'Escape') close();
    if (e.code === 'Space') {
      e.preventDefault();
      fire();
    }
  }

  function fire() {
    if (phase !== 'play' || fireCd > 0) return;
    fireCd = 0.12;
    bullets.push({
      x: player.x,
      y: player.y - 0.04,
      vy: -1.6,
      friendly: true,
      life: 1.4,
    });
    // HELPER assist
    try {
      if (global.SNHelper && SNHelper.wake) {
        SNHelper.wake({ label: 'SPACEX BOT · GUNS' });
        helperStatus = 'guns free';
      }
    } catch (_) {}
    bullets.push({
      x: player.x + 0.08,
      y: player.y - 0.02,
      vy: -1.4,
      friendly: true,
      life: 1.2,
    });
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
        y: 0.12 + Math.random() * 0.38,
        hp: 2 + Math.floor(level / 2),
        t: Math.random() * 6,
      });
    }
    for (i = 0; i < def.hostiles; i++) {
      hostiles.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.08 + Math.random() * 0.35,
        vx: (Math.random() - 0.5) * 0.25,
        hp: 1 + Math.floor(level / 2),
        fireCd: 1 + Math.random() * 2,
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
    open = true;
    canvas.style.display = 'block';
    phase = 'play';
    level = 0;
    score = 0;
    lives = 3;
    combo = 0;
    player.x = 0.5;
    player.y = 0.72;
    player.vx = 0;
    player.vy = 0;
    spawnLevel();
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
    log('Earth Ops online · WASD / tilt · Space fire · Esc exit · HELPER AI wingman', 'ok');
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
    try {
      if (global.SNHelper && SNHelper.parkAtMoon) SNHelper.parkAtMoon();
    } catch (_) {}
    log('Earth Ops closed · Earth OS restored', 'dim');
    preview('Earth');
  }

  function hurt() {
    if (invuln > 0) return;
    lives -= 1;
    invuln = 1.2;
    shake = 0.5;
    combo = 0;
    message = lives > 0 ? 'HULL HIT · ' + lives + ' left' : 'CRAFT LOST';
    helperStatus = 'cover fire';
    if (lives <= 0) {
      phase = 'dead';
      message = 'DESTROYED · HELPER extracting · type ops to relaunch';
      try {
        if (global.SNHelper && SNHelper.flyTo)
          SNHelper.flyTo({ x: W * 0.5, y: H * 0.3 }, { label: 'EXTRACT', kind: 'task' });
      } catch (_) {}
    }
  }

  function tick(now, dtMs) {
    if (!open || !ctx) return;
    var dt = (dtMs || 16) / 1000;
    if (dt > 0.1) dt = 0.1;
    if (phase === 'play') sim(dt);
    draw(now);
  }

  function sim(dt) {
    fireCd = Math.max(0, fireCd - dt);
    invuln = Math.max(0, invuln - dt);
    comboT = Math.max(0, comboT - dt);
    if (comboT <= 0) combo = 0;
    shake = Math.max(0, shake - dt * 2);

    var ax = 0;
    var ay = 0;
    // A = left, D = right (player-visible)
    if (keys.KeyA || keys.ArrowLeft) ax -= 1;
    if (keys.KeyD || keys.ArrowRight) ax += 1;
    if (keys.KeyW || keys.ArrowUp) ay -= 1;
    if (keys.KeyS || keys.ArrowDown) ay += 1;
    player.vx = player.vx * 0.82 + ax * 0.9 * 0.18;
    player.vy = player.vy * 0.82 + ay * 0.7 * 0.18;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (player.x < 0.06) player.x = 0.06;
    if (player.x > 0.94) player.x = 0.94;
    if (player.y < 0.45) player.y = 0.45;
    if (player.y > 0.9) player.y = 0.9;
    if (pointerDown || keys.Space) fire();

    var i, t, h, b, j;
    for (i = 0; i < targets.length; i++) {
      t = targets[i];
      t.t += dt * 2;
      t.x += Math.sin(t.t) * 0.02 * dt;
    }
    for (i = hostiles.length - 1; i >= 0; i--) {
      h = hostiles[i];
      h.x += h.vx * dt;
      if (h.x < 0.05 || h.x > 0.95) h.vx *= -1;
      h.y += Math.sin(performance.now() * 0.001 + i) * 0.02 * dt;
      h.fireCd -= dt;
      if (h.fireCd <= 0) {
        h.fireCd = 1.5 + Math.random();
        bullets.push({ x: h.x, y: h.y + 0.03, vy: 0.55, friendly: false, life: 2 });
      }
      if (Math.abs(h.x - player.x) < 0.05 && Math.abs(h.y - player.y) < 0.05) {
        hurt();
        h.hp = 0;
      }
      if (h.hp <= 0) hostiles.splice(i, 1);
    }

    for (i = bullets.length - 1; i >= 0; i--) {
      b = bullets[i];
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -0.05 || b.y > 1.05) {
        bullets.splice(i, 1);
        continue;
      }
      if (b.friendly) {
        for (j = targets.length - 1; j >= 0; j--) {
          t = targets[j];
          if (Math.abs(b.x - t.x) < 0.04 && Math.abs(b.y - t.y) < 0.04) {
            t.hp -= 1;
            particles.push({ x: t.x, y: t.y, life: 0.4, c: '#5eead4' });
            bullets.splice(i, 1);
            if (t.hp <= 0) {
              targets.splice(j, 1);
              combo++;
              comboT = 2.5;
              score += 100 * Math.min(8, combo);
              message = combo > 2 ? 'COMBO ×' + combo : 'RIFT CLEARED';
              helperStatus = 'target down';
              try {
                if (global.SNHelper && SNHelper.flyTo)
                  SNHelper.flyTo({ x: t.x * W, y: t.y * H }, { label: 'RIFT DOWN', log: false, dur: 900 });
              } catch (_) {}
            }
            break;
          }
        }
        for (j = hostiles.length - 1; j >= 0; j--) {
          h = hostiles[j];
          if (Math.abs(b.x - h.x) < 0.04 && Math.abs(b.y - h.y) < 0.04) {
            h.hp -= 1;
            particles.push({ x: h.x, y: h.y, life: 0.35, c: '#ff8844' });
            bullets.splice(i, 1);
            if (h.hp <= 0) {
              hostiles.splice(j, 1);
              score += 60;
              combo++;
              comboT = 2.5;
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
      particles[i].life -= dt;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (targets.length === 0 && phase === 'play') {
      score += 500 + level * 100;
      level++;
      if (level >= LEVELS.length) {
        phase = 'clear';
        message = 'SECTOR CLEAR · HELPER parks the moon';
        helperStatus = 'parked · moon';
        try {
          if (global.SNHelper && SNHelper.parkAtMoon) SNHelper.parkAtMoon();
        } catch (_) {}
        log('Earth Ops · all levels clear · score ' + score, 'ok');
      } else {
        message = 'LEVEL ' + level + ' CLEAR';
        spawnLevel();
      }
    }
  }

  function draw(now) {
    if (!ctx) return;
    var ox = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
    var oy = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);

    // soft space vignette only — Earth remains visible underneath
    var g = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.1, W * 0.5, H * 0.5, H * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var i, t, h, b, p;
    // targets (rifts)
    for (i = 0; i < targets.length; i++) {
      t = targets[i];
      var px = t.x * W;
      var py = t.y * H + Math.sin(t.t) * 4;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t.t);
      ctx.strokeStyle = 'rgba(94,234,212,0.95)';
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // hostiles
    for (i = 0; i < hostiles.length; i++) {
      h = hostiles[i];
      ctx.fillStyle = '#f07178';
      ctx.shadowColor = '#f07178';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(h.x * W, h.y * H - 10);
      ctx.lineTo(h.x * W + 9, h.y * H + 8);
      ctx.lineTo(h.x * W - 9, h.y * H + 8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // bullets
    for (i = 0; i < bullets.length; i++) {
      b = bullets[i];
      ctx.fillStyle = b.friendly ? '#aaccff' : '#ff4455';
      ctx.fillRect(b.x * W - 2, b.y * H, 4, b.friendly ? 14 : 10);
    }
    // particles
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x * W, p.y * H, 3, 3);
    }
    ctx.globalAlpha = 1;

    // craft
    var sx = player.x * W;
    var sy = player.y * H;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(player.vx * 0.35);
    ctx.fillStyle = '#e8e8ec';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3d9eff';
    ctx.shadowColor = '#3d9eff';
    ctx.shadowBlur = 12;
    ctx.fillRect(-5, 10, 4, 8);
    ctx.fillRect(1, 10, 4, 8);
    ctx.shadowBlur = 0;
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 12, 210, 64);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(12, 12, 210, 64);
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px system-ui,sans-serif';
    ctx.fillText('EARTH OPS · L' + (level + 1), 22, 34);
    ctx.font = '600 11px system-ui,sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('SCORE ' + score + ' · ♥' + lives + (combo > 1 ? ' · ×' + combo : ''), 22, 52);
    ctx.fillText(helperStatus, 22, 68);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    var tw = Math.min(W - 24, 420);
    ctx.fillRect((W - tw) / 2, H - 48, tw, 32);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '600 12px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message || 'Clear rifts · HELPER wingman', W / 2, H - 28);
    ctx.textAlign = 'left';

    if (phase === 'dead' || phase === 'clear') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '700 22px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phase === 'clear' ? 'SECTOR CLEAR' : 'CRAFT LOST', W / 2, H * 0.42);
      ctx.font = '500 14px system-ui,sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText('Score ' + score + ' · type ops to relaunch · Esc exit', W / 2, H * 0.48);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  function wants(text) {
    var low = String(text || '').toLowerCase();
    return (
      /^(earth\s*ops|ops|play\s*levels?|gaming|levels?|game\s*mode|orbital|high\s*end)\b/.test(low) ||
      /\bearth\s*ops\b|\bplay\s*levels\b|\bgaming\s*mode\b/.test(low)
    );
  }

  global.SNEarthOps = {
    start: start,
    open: start,
    close: close,
    wants: wants,
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
