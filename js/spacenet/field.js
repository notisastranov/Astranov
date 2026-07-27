/**
 * Field chrome (spartan one-file): radar, S HUD, mine/perf, task ribbon, finance
 * SPECS P0+P2. No companion. No overlapping owners.
 */
(function (g) {
  'use strict';
  var EARTH = 1671;
  var task = 'idle';
  var notice = '';
  var mine = {
    on: false,
    terms: false,
    rate: 0,
    session: 0,
    donate: false,
    spare: 0,
    fps: 0,
    rates: { cpu: 0, ram: 0, storage: 0, bandwidth: 0 },
  };
  var sweep = 0;
  var blips = [];
  var fpsBuf = [];
  var lastF = 0;
  var TASKS = {
    idle: ['help', 'locate', 'shops', 'rate'],
    map: ['shops', 'global', 'cart', 'order'],
    shops: ['cart', 'order', 'menu', 'global'],
    mine: ['resources', 'donate on', 'mine off', 'rate'],
    money: ['rate', 'wallet', 'mine on', 'finance'],
    space: ['thesis', 'go to mars', 'vault', 'global'],
  };

  function $(id) {
    return document.getElementById(id);
  }

  function paintRibbon() {
    var bar = $('sn-task-ribbon');
    if (!bar) return;
    var acts = TASKS[task] || TASKS.idle;
    var h = '<span class="sn-rib-task">' + task.toUpperCase() + '</span>';
    for (var i = 0; i < acts.length; i++) {
      h +=
        '<button type="button" class="sn-rib-btn" data-run="' +
        acts[i] +
        '">' +
        acts[i] +
        '</button>';
    }
    h +=
      '<span class="sn-rib-bal">' +
      (g.SNCurrency ? SNCurrency.format(SNCurrency.balance()) : '0 S') +
      '</span>';
    if (notice) h += '<span class="sn-rib-notice">' + notice + '</span>';
    bar.innerHTML = h;
    bar.querySelectorAll('[data-run]').forEach(function (b) {
      b.onclick = function () {
        g.SNCli && SNCli.run(b.getAttribute('data-run'));
      };
    });
  }

  function paint() {
    var C = g.SNCurrency;
    var bal = C ? C.balance() : 0;
    var s = $('fbh-s');
    if (s) s.textContent = C ? C.format(bal) : bal.toFixed(2) + ' S';
    var e = $('fbh-eur');
    var u = $('fbh-usd');
    if (e && C) e.textContent = '~' + C.toFiat(bal, 'EUR').toFixed(2) + ' EUR';
    if (u && C) u.textContent = '~' + C.toFiat(bal, 'USD').toFixed(2) + ' USD';
    var r = mine.rates;
    var map = { 'fbh-cpu': r.cpu ? r.cpu + '%' : '—', 'fbh-ram': r.ram ? r.ram + 'MB' : '—', 'fbh-storage': r.storage ? r.storage + 'MB' : '—', 'fbh-bw': r.bandwidth ? r.bandwidth + 'kb/s' : '—' };
    Object.keys(map).forEach(function (id) {
      var el = $(id);
      if (el) el.textContent = map[id];
    });
    var mr = $('fbh-mine-rate');
    var me = $('fbh-mine-earned');
    var st = $('fbh-mine-status');
    if (mr) mr.textContent = mine.rate.toFixed(3) + ' S/h';
    if (me) me.textContent = '+' + mine.session.toFixed(3) + ' S';
    if (st) {
      st.textContent = !mine.terms ? 'terms required' : mine.on ? 'mesh mining S' : 'mine standby';
      st.className = 'fbh-status' + (mine.on ? ' active' : '');
    }
    var pf = $('fbh-perf');
    if (pf)
      pf.textContent =
        'FPS ' + (mine.fps || '—') + ' · spare ' + mine.spare + '%' + (mine.donate ? ' · ♻' : '');
    var hud = $('field-balance-hud');
    if (hud) hud.classList.toggle('mining-active', !!mine.on);
    paintRibbon();
  }

  function noteFrame() {
    var now = performance.now();
    if (lastF) {
      var dt = now - lastF;
      if (dt > 0 && dt < 500) {
        fpsBuf.push(1000 / dt);
        if (fpsBuf.length > 30) fpsBuf.shift();
        var s = 0;
        for (var i = 0; i < fpsBuf.length; i++) s += fpsBuf[i];
        mine.fps = Math.round(s / fpsBuf.length);
      }
    }
    lastF = now;
    var load = document.hidden ? 0.15 : mine.fps >= 40 ? 0.25 : mine.fps >= 25 ? 0.45 : 0.7;
    mine.spare = Math.max(0, Math.min(100, Math.round((1 - load) * 80) - (mine.donate ? 15 : 0)));
  }

  function tickMine(dt) {
    if (!mine.on || !mine.terms) {
      mine.rate = 0;
      return;
    }
    var load = document.hidden ? 0.2 : mine.fps >= 40 ? 0.3 : 0.55;
    if (load > 0.7) {
      mine.rate = 0;
      return;
    }
    var budget = 1 - load;
    var cores = navigator.hardwareConcurrency || 4;
    var ops = Math.floor(3000 * budget * (cores / 8) * Math.min(dt / 500, 1));
    var h = 0;
    for (var i = 0; i < ops; i++) h = ((h << 5) - h + i) | 0;
    mine.rates.cpu = Math.min(100, Math.round(budget * cores * 8));
    mine.rates.ram = Math.round((navigator.deviceMemory || 4) * 64 * budget);
    mine.rates.storage = Math.round(32 * budget);
    mine.rates.bandwidth = Math.round(200 * budget);
    mine.rate = 0.012 * budget * (document.hidden ? 2 : 1);
    if (mine.rate > 0) {
      var earn = mine.rate * (dt / 3600000);
      mine.session += earn;
      g.SNCurrency && SNCurrency.creditMined(earn);
    }
  }

  function drawRadar() {
    var c = $('field-radar-canvas');
    if (!c) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var w = c.width,
      h = c.height,
      cx = w / 2,
      cy = h / 2,
      R = Math.min(w, h) / 2 - 4;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,180,255,0.25)';
    ctx.lineWidth = 1;
    for (var n = 1; n <= 3; n++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * n) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.stroke();
    sweep = (sweep + 0.07) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(0,180,255,0.12)';
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
    for (var i = 0; i < blips.length; i++) {
      var t = blips[i];
      var x = cx + Math.cos(t.a) * t.r * R;
      var y = cy + Math.sin(t.a) * t.r * R;
      ctx.fillStyle = t.k === 's' ? 'rgba(0,255,150,0.9)' : 'rgba(100,180,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    var v = $('fsh-value');
    var tier = (g.SNGlobe && SNGlobe.tier) || 'global';
    if (v) v.textContent = String(tier === 'city' ? 0 : EARTH);
    noteFrame();
  }

  function refreshBlips() {
    blips = [];
    var vs = (g.SNCommerce && SNCommerce.vendors) || [];
    for (var i = 0; i < Math.min(10, vs.length); i++) {
      blips.push({ a: ((vs[i].lng || 0) * Math.PI) / 180, r: 0.3 + (i % 4) * 0.12, k: 's' });
    }
    var ps = (g.SNSpatial && SNSpatial.list && SNSpatial.list()) || [];
    for (var j = 0; j < Math.min(4, ps.length); j++) {
      blips.push({ a: ((ps[j].lng || 0) * Math.PI) / 180, r: 0.4 + j * 0.1, k: 'p' });
    }
  }

  function setTask(name) {
    task = TASKS[name] ? name : 'idle';
    paintRibbon();
  }

  function infer(line) {
    var l = String(line || '').toLowerCase();
    if (/^shops|^menu|^order|^cart|^market/.test(l)) setTask('shops');
    else if (/^city|^map/.test(l)) setTask('map');
    else if (/^mine|^resources|^donate|^boost/.test(l)) setTask('mine');
    else if (/^rate|^wallet|^money|^finance|^s\b/.test(l)) setTask('money');
    else if (/^thesis|^vault|^mars|^go to/.test(l)) setTask('space');
    else if (/^global|^locate|^earth/.test(l)) setTask('idle');
  }

  function showTerms() {
    var m = $('sn-miner-terms');
    if (m) m.hidden = false;
  }

  function acceptTerms() {
    try {
      localStorage.setItem('astranov:spacenet-miner-v2', String(Date.now()));
    } catch (e) {}
    mine.terms = true;
    mine.on = true;
    var m = $('sn-miner-terms');
    if (m) m.hidden = true;
    g.SNCli && SNCli.log('Mesh on · mining S', 'ok');
    setTask('mine');
    paint();
  }

  function openFinance(tab) {
    var p = $('spacenet-finance-panel');
    if (!p) return;
    p.hidden = false;
    tab = tab || 'stats';
    var C = g.SNCurrency;
    var body = $('sfp-body');
    var snap = C ? C.snapshot() : { balance: 0, mined: 0 };
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === tab);
    });
    if (!body) return;
    if (tab === 'mining') {
      body.innerHTML =
        '<div class="sfp-line"><b>Rate</b> ' +
        mine.rate.toFixed(3) +
        ' S/h · session ' +
        mine.session.toFixed(4) +
        ' S</div>' +
        '<div class="sfp-line">FPS ' +
        mine.fps +
        ' · spare ' +
        mine.spare +
        '%</div>' +
        '<div class="sfp-actions"><button type="button" data-cmd="mine on">Mine on</button>' +
        '<button type="button" data-cmd="mine off">Mine off</button>' +
        '<button type="button" data-cmd="donate on">Donate</button></div>';
    } else if (tab === 'platform') {
      body.innerHTML =
        '<div class="sfp-line"><b>Platform</b> 3% of S · <b>Driver</b> 15% gross S</div>';
    } else if (tab === 'p2p') {
      body.innerHTML = '<div class="sfp-line">P2P ledger in S · wallet ' + (C ? C.format(snap.balance) : '') + '</div>';
    } else if (tab === 'reports') {
      body.innerHTML = '<div class="sfp-line dim">CLI: resources · rate · wallet</div>';
    } else {
      body.innerHTML =
        '<div class="sfp-line"><b>Balance</b> ' +
        (C ? C.format(snap.balance) : '') +
        '</div>' +
        '<div class="sfp-line"><b>Mined</b> ' +
        (C ? C.format(snap.mined) : '') +
        '</div>' +
        '<div class="sfp-line dim">S primary · fiat/crypto secondary</div>';
    }
    body.querySelectorAll('[data-cmd]').forEach(function (b) {
      b.onclick = function () {
        g.SNCli && SNCli.run(b.getAttribute('data-cmd'));
        openFinance(tab);
      };
    });
    setTask('money');
  }

  function report() {
    return {
      fps: mine.fps,
      spareScore: mine.spare,
      donating: mine.donate,
      mining: mine.on && mine.terms,
      rateSPerH: mine.rate,
      sessionMined: mine.session,
      rates: mine.rates,
      line:
        'FPS ~' +
        mine.fps +
        ' · spare ' +
        mine.spare +
        '%' +
        (mine.donate ? ' · donate' : '') +
        (mine.on ? ' · ' + mine.rate.toFixed(3) + ' S/h' : ' · mine off'),
    };
  }

  function init() {
    if (init.done) return;
    init.done = true;
    try {
      mine.terms = !!localStorage.getItem('astranov:spacenet-miner-v2');
      mine.on = mine.terms;
      mine.donate = localStorage.getItem('astranov_donate_compute') === '1';
    } catch (e) {}
    paint();
    refreshBlips();
    drawRadar();
    setInterval(drawRadar, 125);
    setInterval(refreshBlips, 8000);
    var last = performance.now();
    setInterval(function () {
      var n = performance.now();
      tickMine(n - last);
      last = n;
      paint();
    }, 1000);

    $('field-balance-hud') &&
      ($('field-balance-hud').onclick = function () {
        openFinance('stats');
      });
    $('sfp-close') &&
      ($('sfp-close').onclick = function () {
        var p = $('spacenet-finance-panel');
        if (p) p.hidden = true;
      });
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.onclick = function () {
        openFinance(t.getAttribute('data-tab'));
      };
    });
    $('sn-miner-accept') && ($('sn-miner-accept').onclick = acceptTerms);
  }

  g.SNField = {
    init: init,
    paint: paint,
    setTask: setTask,
    infer: infer,
    setNotice: function (t) {
      notice = String(t || '').slice(0, 60);
      paintRibbon();
    },
    showTerms: showTerms,
    openFinance: openFinance,
    closeFinance: function () {
      var p = $('spacenet-finance-panel');
      if (p) p.hidden = true;
    },
    refreshBlips: refreshBlips,
    EARTH_KMH: EARTH,
  };

  // Compat thin aliases (boot/cli may call old names)
  g.SNRadar = {
    init: function () {},
    refresh: refreshBlips,
    EARTH_KMH: EARTH,
  };
  g.SNResources = {
    init: function () {},
    report: report,
    status: function () {
      var r = report();
      return [r.line, 'CPU ' + (r.rates.cpu || 0) + '% · spare ' + r.spareScore + '%', 'Session ' + (g.SNCurrency ? SNCurrency.format(r.sessionMined) : r.sessionMined)];
    },
    checkTerms: function () {
      return mine.terms;
    },
    acceptTerms: acceptTerms,
    setMining: function (on) {
      if (on && !mine.terms) {
        showTerms();
        return false;
      }
      mine.on = !!on;
      paint();
      return true;
    },
    setDonate: function (on) {
      mine.donate = !!on;
      try {
        if (on) localStorage.setItem('astranov_donate_compute', '1');
        else localStorage.removeItem('astranov_donate_compute');
      } catch (e) {}
      paint();
      g.SNCli && SNCli.log(on ? 'Donate on' : 'Donate off', 'ok');
    },
    get mining() {
      return mine.on && mine.terms;
    },
    get rateSPerH() {
      return mine.rate;
    },
    get sessionMined() {
      return mine.session;
    },
    get rates() {
      return mine.rates;
    },
  };
  g.SNRibbon = {
    init: function () {},
    render: paintRibbon,
    setTask: setTask,
    setNotice: function (t) {
      g.SNField.setNotice(t);
    },
    infer: infer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
