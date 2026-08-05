/**
 * SNGameLoop / SNEngine — gaming engine power core for the whole OS
 * ==================================================================
 * One RAF. Fixed-feel sim. Frame budget. Quality tiers that auto-adapt.
 * Every visual system (globe, radar, helper, AI graphics, invaders) should
 * subscribe here instead of spawning its own requestAnimationFrame / setInterval.
 *
 * API (compat):
 *   SNGameLoop.subscribe(fn)           // fn(dtMs, now) — every frame (visual)
 *   SNGameLoop.subscribe(fn, { lane })  // lane: critical|visual|ambient|bg
 *   SNGameLoop.start / stop / stats
 *   SNEngine.quality / setQuality / pool / mark / budget
 */
(function (g) {
  'use strict';

  var TARGET_FPS = 60;
  var TARGET = 1000 / TARGET_FPS;
  var MAX_DT = 50; // ms clamp — no spiral of death
  var FIXED = 1000 / 60; // fixed sim step ms

  var last = 0;
  var acc = 0;
  var raf = 0;
  var running = false;
  var frames = 0;
  var dropped = 0;
  var simSteps = 0;
  var frameCost = 0;
  var avgCost = 0;
  var fps = 0;
  var fpsFrames = 0;
  var fpsAt = 0;
  var budgetMs = 14; // soft budget per frame
  var hidden = false;

  /** Lanes: critical always · visual every frame · ambient throttled · bg rare */
  var lanes = {
    critical: [],
    visual: [],
    ambient: [],
    bg: [],
  };
  var ambientEvery = 2;
  var bgEvery = 8;
  var frameN = 0;

  var QUALITIES = {
    ultra: {
      id: 'ultra',
      label: 'Ultra',
      dprCap: 2,
      globeSegs: 64,
      starN: 700,
      idleSkip: 1,
      radarMs: 100,
      hudHz: 30,
      budgetMs: 16,
      ambientEvery: 1,
      bgEvery: 4,
      fx: 1,
    },
    high: {
      id: 'high',
      label: 'High',
      dprCap: 1.75,
      globeSegs: 48,
      starN: 480,
      idleSkip: 2,
      radarMs: 140,
      hudHz: 24,
      budgetMs: 14,
      ambientEvery: 2,
      bgEvery: 6,
      fx: 0.85,
    },
    balanced: {
      id: 'balanced',
      label: 'Balanced',
      dprCap: 1.35,
      globeSegs: 36,
      starN: 320,
      idleSkip: 3,
      radarMs: 180,
      hudHz: 18,
      budgetMs: 12,
      ambientEvery: 2,
      bgEvery: 8,
      fx: 0.7,
    },
    lite: {
      id: 'lite',
      label: 'Lite',
      dprCap: 1.1,
      globeSegs: 24,
      starN: 180,
      idleSkip: 4,
      radarMs: 280,
      hudHz: 12,
      budgetMs: 9,
      ambientEvery: 3,
      bgEvery: 12,
      fx: 0.45,
    },
  };

  var qualityId = 'high';
  var autoQuality = true;
  var autoCool = 0; // frames before next auto adjust

  function nowPerf() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  function detectDefaultQuality() {
    try {
      if (g._snLite || (g.SNPerf && SNPerf.lite)) return 'lite';
      var mem = navigator.deviceMemory || 8;
      var cores = navigator.hardwareConcurrency || 4;
      var coarse = matchMedia('(pointer:coarse)').matches;
      if (mem <= 2 || cores <= 2) return 'lite';
      if (mem <= 4 || cores <= 4 || (coarse && mem <= 6)) return 'balanced';
      if (mem >= 8 && cores >= 8 && !coarse) return 'ultra';
      return 'high';
    } catch (_) {
      return 'balanced';
    }
  }

  function applyQuality(id, reason) {
    var q = QUALITIES[id] || QUALITIES.balanced;
    qualityId = q.id;
    budgetMs = q.budgetMs;
    ambientEvery = q.ambientEvery;
    bgEvery = q.bgEvery;
    // Push into SNPerf so globe/radar/graphics pick up without rewrites everywhere
    try {
      if (!g.SNPerf) g.SNPerf = {};
      var P = g.SNPerf;
      P.quality = q.id;
      P.qualityLabel = q.label;
      P.dprCap = q.dprCap;
      P.globeSegs = q.globeSegs;
      P.starN = q.starN;
      P.idleSkip = q.idleSkip;
      P.radarMs = q.radarMs;
      P.hudHz = q.hudHz;
      P.fxScale = q.fx;
      P.budgetMs = q.budgetMs;
      P.engine = true;
      P.engineReason = reason || '';
    } catch (_) {}
    try {
      if (g.SNUsage && SNUsage.track) SNUsage.track('engine_quality', { q: q.id, reason: reason || '' });
    } catch (_) {}
    return q;
  }

  function setQuality(id, opts) {
    opts = opts || {};
    if (opts.auto === false) autoQuality = false;
    if (opts.auto === true) autoQuality = true;
    if (id === 'auto') {
      autoQuality = true;
      return applyQuality(detectDefaultQuality(), 'auto');
    }
    if (!QUALITIES[id]) id = 'balanced';
    return applyQuality(id, opts.reason || 'user');
  }

  function quality() {
    return QUALITIES[qualityId] || QUALITIES.balanced;
  }

  function runLane(list, dt, now, t0) {
    for (var i = 0; i < list.length; i++) {
      if (nowPerf() - t0 > budgetMs * 1.35) {
        dropped++;
        break; // soft budget: drop lower-priority work this frame
      }
      try {
        list[i].fn(dt, now);
      } catch (e) {
        console.warn('[SNEngine]', list[i].name || 'sub', e);
      }
    }
  }

  function autoTune(now) {
    if (!autoQuality || autoCool > 0) {
      autoCool--;
      return;
    }
    if (fps <= 0 || frames < 90) return;
    autoCool = 180; // ~3s at 60
    var cur = qualityId;
    if (fps < 28 && cur !== 'lite') {
      var down = cur === 'ultra' ? 'high' : cur === 'high' ? 'balanced' : 'lite';
      applyQuality(down, 'fps=' + fps);
    } else if (fps > 55 && avgCost < budgetMs * 0.55) {
      var up = cur === 'lite' ? 'balanced' : cur === 'balanced' ? 'high' : cur === 'high' ? 'ultra' : cur;
      if (up !== cur) applyQuality(up, 'fps=' + fps);
    }
  }

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (hidden || (typeof document !== 'undefined' && document.hidden)) {
      last = 0;
      acc = 0;
      return;
    }
    if (!last) last = now;
    var dt = now - last;
    last = now;
    if (dt > 250) {
      dt = TARGET;
      acc = 0;
      dropped++;
    }
    if (dt > MAX_DT) {
      dropped++;
      dt = MAX_DT;
    }

    var t0 = nowPerf();
    frameN++;
    frames++;
    fpsFrames++;
    if (!fpsAt) fpsAt = now;
    if (now - fpsAt >= 1000) {
      fps = fpsFrames;
      fpsFrames = 0;
      fpsAt = now;
      try {
        if (g.SNPerf) g.SNPerf.fps = fps;
      } catch (_) {}
      autoTune(now);
    }

    // Fixed timestep accumulator for sim-critical subscribers
    acc += dt;
    var steps = 0;
    while (acc >= FIXED && steps < 3) {
      runLane(lanes.critical, FIXED, now, t0);
      acc -= FIXED;
      steps++;
      simSteps++;
    }
    if (acc > FIXED * 2) acc = 0; // dump spiral

    // Visual every frame with variable dt
    runLane(lanes.visual, dt, now, t0);

    if (frameN % ambientEvery === 0) runLane(lanes.ambient, dt * ambientEvery, now, t0);
    if (frameN % bgEvery === 0) runLane(lanes.bg, dt * bgEvery, now, t0);

    frameCost = nowPerf() - t0;
    avgCost = avgCost ? avgCost * 0.9 + frameCost * 0.1 : frameCost;
    try {
      if (g.SNPerf) {
        SNPerf.frameMs = Math.round(frameCost * 10) / 10;
        SNPerf.avgFrameMs = Math.round(avgCost * 10) / 10;
      }
    } catch (_) {}
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    acc = 0;
    if (typeof document !== 'undefined') {
      hidden = !!document.hidden;
      document.addEventListener(
        'visibilitychange',
        function () {
          hidden = !!document.hidden;
          if (!hidden) {
            last = 0;
            acc = 0;
          }
        },
        false
      );
    }
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /**
   * Subscribe a system.
   * @param {function} fn (dtMs, now)
   * @param {object} [opts] { lane, name }
   * @returns {function} unsubscribe
   */
  function subscribe(fn, opts) {
    opts = opts || {};
    if (typeof fn !== 'function') return function () {};
    var lane = opts.lane || 'visual';
    if (!lanes[lane]) lane = 'visual';
    var entry = { fn: fn, name: opts.name || 'sys' };
    // de-dupe by function ref
    lanes[lane] = lanes[lane].filter(function (x) {
      return x.fn !== fn;
    });
    lanes[lane].push(entry);
    start();
    return function () {
      lanes[lane] = lanes[lane].filter(function (x) {
        return x.fn !== fn;
      });
    };
  }

  function unsubscribeAll(name) {
    Object.keys(lanes).forEach(function (k) {
      lanes[k] = lanes[k].filter(function (x) {
        return x.name !== name;
      });
    });
  }

  /** Simple object pool */
  function pool(factory, reset, cap) {
    var free = [];
    cap = cap || 128;
    return {
      alloc: function () {
        var o = free.length ? free.pop() : factory();
        return o;
      },
      free: function (o) {
        if (!o) return;
        if (reset) reset(o);
        if (free.length < cap) free.push(o);
      },
      size: function () {
        return free.length;
      },
    };
  }

  function stats() {
    var counts = {};
    Object.keys(lanes).forEach(function (k) {
      counts[k] = lanes[k].length;
    });
    return {
      frames: frames,
      dropped: dropped,
      simSteps: simSteps,
      fps: fps,
      frameMs: Math.round(frameCost * 10) / 10,
      avgFrameMs: Math.round(avgCost * 10) / 10,
      budgetMs: budgetMs,
      quality: qualityId,
      auto: autoQuality,
      running: running,
      subs: counts,
      lanes: counts,
    };
  }

  function reportLines() {
    var s = stats();
    var q = quality();
    return [
      '── SNEngine · gaming power core ──',
      'Quality · ' + q.label + (autoQuality ? ' (auto)' : ' (locked)'),
      'FPS ' + s.fps + ' · frame ' + s.avgFrameMs + 'ms / budget ' + s.budgetMs + 'ms',
      'Lanes · crit ' + s.subs.critical + ' · vis ' + s.subs.visual + ' · amb ' + s.subs.ambient + ' · bg ' + s.subs.bg,
      'Dropped ' + s.dropped + ' · sim steps ' + s.simSteps,
      'Cmd · engine · engine high|balanced|lite|ultra|auto · fps',
    ];
  }

  function mark(name) {
    try {
      performance.mark('sn:engine:' + name);
    } catch (_) {}
  }

  // Boot default quality once
  try {
    var saved = null;
    try {
      saved = localStorage.getItem('sn:engine-quality-v1');
    } catch (_) {}
    if (saved && QUALITIES[saved]) {
      autoQuality = false;
      applyQuality(saved, 'saved');
    } else {
      applyQuality(detectDefaultQuality(), 'boot');
    }
  } catch (_) {
    applyQuality('balanced', 'fallback');
  }

  var API = {
    start: start,
    stop: stop,
    subscribe: subscribe,
    unsubscribeAll: unsubscribeAll,
    stats: stats,
    reportLines: reportLines,
    setQuality: setQuality,
    quality: quality,
    get qualityId() {
      return qualityId;
    },
    get autoQuality() {
      return autoQuality;
    },
    pool: pool,
    mark: mark,
    MAX_DT: MAX_DT,
    FIXED: FIXED,
    QUALITIES: QUALITIES,
    // power alias
    power: function () {
      start();
      return stats();
    },
  };

  g.SNGameLoop = API;
  g.SNEngine = API;

  // Console breadcrumb
  if (typeof console !== 'undefined' && console.info) {
    console.info('[SNEngine] gaming power core ready · quality=' + qualityId);
  }
})(typeof window !== 'undefined' ? window : globalThis);
