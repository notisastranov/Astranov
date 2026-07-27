/**
 * Resources · performance · mining mesh (SPECS)
 * Spare capacity, FPS monitor, SETI-style mesh earn in S (not AVC).
 */
(function (global) {
  'use strict';

  var PREFS_KEY = 'astranov:miner-rig-prefs';
  var TERMS_KEY = 'astranov:spacenet-miner-v2';
  var DONATE_KEY = 'astranov_donate_compute';
  var SESSION_KEY = 'astranov:spacenet-miner-session';

  var state = {
    fps: 0,
    spareScore: 0,
    donating: false,
    mining: false,
    termsOk: false,
    rateSPerH: 0,
    sessionMined: 0,
    peers: 0,
    contrib: { cpu: 0, ram: 0, storage: 0, bandwidth: 0 },
    rates: { cpu: 0, ram: 0, storage: 0, bandwidth: 0 },
    lastFrame: 0,
    frames: 0,
    fpsSamples: [],
    caps: null,
    timer: null,
  };

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {
      /* ignore */
    }
  }

  function detectCaps() {
    var cores = navigator.hardwareConcurrency || 4;
    var ramGb = navigator.deviceMemory || 4;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var down = (conn && conn.downlink) || 10;
    state.caps = {
      cores: cores,
      ramMb: Math.round(ramGb * 1024 * 0.12),
      storageMb: 256,
      bandwidthKbps: Math.round(down * 1024 * 0.06),
    };
    return state.caps;
  }

  function deviceLoad() {
    // 0–1 heuristic from recent FPS + visibility
    if (document.hidden) return 0.15;
    var fps = state.fps || 30;
    if (fps >= 50) return 0.2;
    if (fps >= 30) return 0.4;
    if (fps >= 20) return 0.55;
    return 0.75;
  }

  function recomputeSpare() {
    var load = deviceLoad();
    var idle = !document.hidden && load < 0.45;
    var base = Math.round((1 - load) * 70);
    var idleB = idle ? 18 : 0;
    var donateP = state.donating ? 20 : 0;
    state.spareScore = Math.max(0, Math.min(100, base + idleB - donateP));
  }

  function noteFrame() {
    var now = performance.now();
    state.frames++;
    if (state.lastFrame) {
      var dt = now - state.lastFrame;
      if (dt > 0 && dt < 500) {
        var f = 1000 / dt;
        state.fpsSamples.push(f);
        if (state.fpsSamples.length > 40) state.fpsSamples.shift();
        var sum = 0;
        for (var i = 0; i < state.fpsSamples.length; i++) sum += state.fpsSamples[i];
        state.fps = Math.round(sum / state.fpsSamples.length);
      }
    }
    state.lastFrame = now;
    if (state.frames % 45 === 0) {
      recomputeSpare();
      global.SNField?.refreshPerf?.();
      global.SNRibbon?.render?.();
    }
  }

  function computeMineRate() {
    if (!state.termsOk || !state.mining) return 0;
    var prefs = loadPrefs();
    var any =
      prefs.cpu !== false || prefs.ram !== false || prefs.storage !== false || prefs.bandwidth !== false;
    if (!any) return 0;
    var load = deviceLoad();
    if (load > 0.7) return 0;
    var base = 0.012 * (1 - load);
    base += state.peers * 0.002;
    if (document.hidden) base *= 2.2;
    return Math.max(0, base);
  }

  function tickMine(dtMs) {
    if (!state.termsOk || !state.mining) {
      state.rateSPerH = 0;
      return;
    }
    var caps = state.caps || detectCaps();
    var load = deviceLoad();
    var budget = Math.max(0, 1 - load);
    if (budget < 0.12) {
      state.rateSPerH = 0;
      return;
    }
    // lightweight work signal (does not thrash UI thread)
    var ops = Math.floor(4000 * budget * ((caps.cores || 4) / 8) * Math.min(dtMs / 500, 1));
    var h = 0;
    for (var i = 0; i < ops; i++) h = ((h << 5) - h + i) | 0;
    state.rates.cpu = Math.min(100, Math.round(budget * (caps.cores || 4) * 8));
    state.rates.ram = Math.round((caps.ramMb || 512) * budget * 0.12);
    state.rates.storage = Math.round((caps.storageMb || 128) * budget * 0.02);
    state.rates.bandwidth = Math.round((caps.bandwidthKbps || 512) * budget * 0.04);
    state.rateSPerH = computeMineRate();
    if (state.rateSPerH > 0) {
      var earn = state.rateSPerH * (dtMs / 3600000);
      state.sessionMined += earn;
      global.SNWallet?.creditMined?.(earn);
      try {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ earned: state.sessionMined, at: Date.now() })
        );
      } catch (e) {
        /* ignore */
      }
    }
    global.SNField?.refreshMine?.();
  }

  function acceptTerms() {
    try {
      localStorage.setItem(TERMS_KEY, String(Date.now()));
    } catch (e) {
      /* ignore */
    }
    state.termsOk = true;
    state.mining = true;
    var m = document.getElementById('sn-miner-terms');
    if (m) m.hidden = true;
    global.SNCli?.log?.('Mesh terms accepted · mining in S', 'ok');
    global.SNRibbon?.setTask?.('mine');
  }

  function checkTerms() {
    try {
      state.termsOk = !!localStorage.getItem(TERMS_KEY);
    } catch (e) {
      state.termsOk = false;
    }
    return state.termsOk;
  }

  function setDonate(on) {
    state.donating = !!on;
    try {
      if (on) localStorage.setItem(DONATE_KEY, '1');
      else localStorage.removeItem(DONATE_KEY);
    } catch (e) {
      /* ignore */
    }
    recomputeSpare();
    global.SNField?.refreshPerf?.();
    global.SNCli?.log?.(on ? 'Donate on · spare compute to SpaceNet' : 'Donate off', 'ok');
  }

  function report() {
    recomputeSpare();
    return {
      fps: state.fps,
      spareScore: state.spareScore,
      donating: state.donating,
      mining: state.mining && state.termsOk,
      rateSPerH: state.rateSPerH,
      sessionMined: state.sessionMined,
      peers: state.peers,
      rates: Object.assign({}, state.rates),
      line:
        'FPS ~' +
        state.fps +
        ' · spare ' +
        state.spareScore +
        '%' +
        (state.donating ? ' · donating' : '') +
        (state.mining && state.termsOk
          ? ' · mine ' + state.rateSPerH.toFixed(3) + ' S/h'
          : ' · mine off'),
    };
  }

  function statusLines() {
    var r = report();
    return [
      r.line,
      'CPU ' + (r.rates.cpu || 0) + '% · RAM ' + (r.rates.ram || 0) + 'MB · NET ' + (r.rates.bandwidth || 0) + 'kb/s',
      'Session mined ' +
        (global.SNCurrency ? SNCurrency.format(r.sessionMined) : r.sessionMined.toFixed(4) + ' S'),
      'Commands: resources · mine on|off · donate on|off · boost',
    ];
  }

  function init() {
    if (init._done) return;
    init._done = true;
    checkTerms();
    detectCaps();
    try {
      state.donating = localStorage.getItem(DONATE_KEY) === '1';
    } catch (e) {
      /* ignore */
    }
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        var j = JSON.parse(raw);
        state.sessionMined = Number(j.earned) || 0;
      }
    } catch (e) {
      /* ignore */
    }
    if (state.termsOk) state.mining = true;
    var last = performance.now();
    state.timer = setInterval(function () {
      var now = performance.now();
      var dt = now - last;
      last = now;
      tickMine(dt);
      recomputeSpare();
      global.SNField?.refreshPerf?.();
    }, 1000);
    // Hook rAF via globe if present
    try {
      var wrap = global.SNGlobe;
      if (wrap && !wrap._resHooked) {
        wrap._resHooked = true;
      }
    } catch (e) {
      /* ignore */
    }
    setInterval(function () {
      noteFrame();
    }, 100);
  }

  global.SNResources = {
    init: init,
    noteFrame: noteFrame,
    report: report,
    status: statusLines,
    acceptTerms: acceptTerms,
    checkTerms: checkTerms,
    setDonate: setDonate,
    setMining: function (on) {
      if (on && !checkTerms()) {
        global.SNField?.showTerms?.();
        return false;
      }
      state.mining = !!on;
      global.SNField?.refreshMine?.();
      return true;
    },
    deviceLoad: deviceLoad,
    get fps() {
      return state.fps;
    },
    get spareScore() {
      return state.spareScore;
    },
    get donating() {
      return state.donating;
    },
    get mining() {
      return state.mining && state.termsOk;
    },
    get rateSPerH() {
      return state.rateSPerH;
    },
    get sessionMined() {
      return state.sessionMined;
    },
    get rates() {
      return state.rates;
    },
    prefs: loadPrefs,
    savePrefs: savePrefs,
  };
})(typeof window !== 'undefined' ? window : globalThis);
