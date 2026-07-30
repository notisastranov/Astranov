/**
 * SNSim33 — 33 SPECS agents focused on RHODES ISLAND, Greece
 *
 * Owner-dev swarm uses live stack on Rhodes only (Old Town · Mandraki · Lindos · …).
 * Real-time LIVE panel when logged in / watching. CLI: sim start|stop|status|wipe|burst
 *
 * sim:true tags — hidden from marketplace when swarm stopped.
 */
(function (global) {
  'use strict';

  var N = 33;
  var KEY = 'sn:sim33-v1';
  var AUTO_KEY = 'sn:sim-auto';
  var running = false;
  var timer = null;
  var authWatch = null;
  /** Normal human-watchable pace (ms). fast=2.5s · normal=5.5s · slow=9s */
  var tickMs = 5500;
  var agents = [];
  var idx = 0;
  var feed = [];
  var currentAct = null;
  var stats = {
    ticks: 0,
    ok: 0,
    fail: 0,
    taught: 0,
    byRole: { client: 0, vendor: 0, driver: 0, ambassador: 0 },
    last: '',
    startedAt: 0,
    focus: 'Rhodes Island, Greece',
  };
  var savedMe = null;

  // Role mix: 12 client · 8 vendor · 8 driver · 5 ambassador = 33
  var ROLE_PLAN = [];
  (function buildPlan() {
    var i;
    for (i = 0; i < 12; i++) ROLE_PLAN.push('client');
    for (i = 0; i < 8; i++) ROLE_PLAN.push('vendor');
    for (i = 0; i < 8; i++) ROLE_PLAN.push('driver');
    for (i = 0; i < 5; i++) ROLE_PLAN.push('ambassador');
  })();

  /**
   * RHODES ONLY — real island places (lat/lng).
   * All swarm activity stays on Rhodes, Greece.
   */
  var RHODES = { name: 'Rhodes', lat: 36.4341, lng: 28.2176 };
  var HUBS = [
    { name: 'Old Town', lat: 36.4425, lng: 28.2272 },
    { name: 'Mandraki', lat: 36.4508, lng: 28.2265 },
    { name: 'New Market', lat: 36.4438, lng: 28.222 },
    { name: 'Garage Rhodes', lat: 36.44125, lng: 28.22255 },
    { name: 'Ixia', lat: 36.416, lng: 28.168 },
    { name: 'Ialysos', lat: 36.413, lng: 28.155 },
    { name: 'Faliraki', lat: 36.339, lng: 28.199 },
    { name: 'Afandou', lat: 36.294, lng: 28.167 },
    { name: 'Kolymbia', lat: 36.249, lng: 28.165 },
    { name: 'Lindos', lat: 36.0917, lng: 28.0856 },
    { name: 'Airport Diagoras', lat: 36.4054, lng: 28.0862 },
    { name: 'Kremasti', lat: 36.411, lng: 28.119 },
    { name: 'Pastida', lat: 36.388, lng: 28.135 },
    { name: 'Koskinou', lat: 36.392, lng: 28.21 },
    { name: 'Kalithea', lat: 36.377, lng: 28.228 },
  ];

  var FOODS = ['pizza', 'souvlaki', 'coffee', 'gyro', 'seafood'];
  var SHOP_KINDS = ['cafe', 'pizza', 'grill', 'taverna', 'bakery'];
  var ROLE_EMOJI = { client: '👤', vendor: '🏪', driver: '🛵', ambassador: '📣' };
  var ROLE_COLOR = { client: 0x3d9eff, vendor: 0x44ffaa, driver: 0xffcc44, ambassador: 0xff66aa };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (e) {}
  }

  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(m);
    } catch (e) {}
    try {
      if (global.SNGlobe && SNGlobe.setHud) SNGlobe.setHud(String(m).slice(0, 72));
    } catch (e2) {}
  }

  function isLoggedIn() {
    try {
      return !!(global.SNAuth && SNAuth.user);
    } catch (e) {
      return false;
    }
  }

  /** Spectator: logged-in owner wants real-time view */
  function isWatching() {
    if (isLoggedIn()) return true;
    try {
      if (localStorage.getItem('sn:sim-watch') === '1') return true;
      if (/[?&]sim=1\b/.test(location.search || '')) return true;
    } catch (e) {}
    return false;
  }

  function jitter(n, s) {
    // Small jitter — stay on Rhodes island
    return n + (Math.random() - 0.5) * (s || 0.012);
  }

  function flyRhodes(agent, tier, label) {
    if (!agent || !global.SNGlobe) return;
    var t = tier || 'city';
    try {
      if (SNGlobe.setBody) SNGlobe.setBody('earth');
      if (SNGlobe.goToPlace) {
        SNGlobe.goToPlace(agent.lat, agent.lng, {
          tier: t,
          body: 'earth',
          pulse: false,
          openMap: false,
          label: label || agent.hub || 'Rhodes',
        });
      }
      if (SNGlobe.pulse) {
        SNGlobe.pulse(
          agent.lat,
          agent.lng,
          ROLE_COLOR[agent.role] || 0x3d9eff,
          (ROLE_EMOJI[agent.role] || '·') + ' ' + (label || agent.name),
          9000
        );
      }
    } catch (e) {}
    try {
      global._snLastPos = { lat: agent.lat, lng: agent.lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(agent.lat, agent.lng);
    } catch (e2) {}
  }

  function pushFeed(line, kind) {
    feed.unshift({
      t: Date.now(),
      line: String(line || '').slice(0, 120),
      kind: kind || 'ok',
    });
    if (feed.length > 24) feed.length = 24;
    paintLive();
  }

  function ensureLiveCss() {
    if (document.getElementById('sn-sim33-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-sim33-css';
    st.textContent = [
      '#sn-sim33-live{position:fixed;top:12px;right:12px;z-index:140;width:min(320px,calc(100vw - 24px));',
      'max-height:min(52vh,420px);display:none;flex-direction:column;gap:6px;padding:10px 12px;',
      'background:rgba(0,8,18,.94);border:1px solid rgba(61,158,255,.55);border-radius:14px;',
      'box-shadow:0 8px 32px rgba(0,0,0,.65),0 0 20px rgba(26,111,212,.2);color:#c8e4ff;',
      'font:12px/1.35 system-ui,Segoe UI,sans-serif;pointer-events:auto}',
      '#sn-sim33-live.open{display:flex}',
      '#sn-sim33-live .sim-head{display:flex;align-items:center;gap:8px;font-weight:700;',
      'letter-spacing:.06em;text-transform:uppercase;color:#3d9eff;font-size:11px}',
      '#sn-sim33-live .sim-dot{width:9px;height:9px;border-radius:50%;background:#44ffaa;',
      'box-shadow:0 0 10px #44ffaa;animation:snSimPulse 1s ease infinite}',
      '#sn-sim33-live.off .sim-dot{background:#666;box-shadow:none;animation:none}',
      '@keyframes snSimPulse{0%,100%{opacity:1}50%{opacity:.35}}',
      '#sn-sim33-live .sim-focus{color:#ffd633;font-size:11px;font-weight:600}',
      '#sn-sim33-live .sim-now{font-size:13px;color:#e8f4ff;min-height:2.6em}',
      '#sn-sim33-live .sim-stats{display:flex;flex-wrap:wrap;gap:6px 10px;color:#8ab4d8;font-size:11px}',
      '#sn-sim33-live .sim-feed{overflow:auto;max-height:min(28vh,220px);border-top:1px solid rgba(26,111,212,.3);',
      'padding-top:6px;margin-top:2px}',
      '#sn-sim33-live .sim-row{padding:3px 0;border-bottom:1px solid rgba(26,111,212,.12);color:#9ec8f0}',
      '#sn-sim33-live .sim-row.err{color:#ff8899}',
      '#sn-sim33-live .sim-row.ok{color:#a8f0c8}',
      '#sn-sim33-live .sim-btns{display:flex;gap:6px;margin-top:4px}',
      '#sn-sim33-live button{flex:1;cursor:pointer;border-radius:8px;border:1px solid rgba(61,158,255,.45);',
      'background:rgba(0,24,56,.7);color:#c8e4ff;padding:6px 8px;font:700 11px system-ui}',
      '#sn-sim33-live button:hover{border-color:#3d9eff}',
    ].join('');
    document.head.appendChild(st);
  }

  function ensureLivePanel() {
    ensureLiveCss();
    var el = document.getElementById('sn-sim33-live');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-sim33-live';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="sim-head"><span class="sim-dot"></span><span>Sim-33 LIVE</span></div>' +
      '<div class="sim-focus" id="sn-sim33-focus">📍 Rhodes Island, Greece</div>' +
      '<div class="sim-now" id="sn-sim33-now">Waiting…</div>' +
      '<div class="sim-stats" id="sn-sim33-stats"></div>' +
      '<div class="sim-feed" id="sn-sim33-feed"></div>' +
      '<div class="sim-btns">' +
      '<button type="button" id="sn-sim33-stop">Stop</button>' +
      '<button type="button" id="sn-sim33-hide">Hide</button>' +
      '</div>';
    document.body.appendChild(el);
    var stopB = document.getElementById('sn-sim33-stop');
    var hideB = document.getElementById('sn-sim33-hide');
    if (stopB)
      stopB.onclick = function () {
        stop();
      };
    if (hideB)
      hideB.onclick = function () {
        el.classList.remove('open');
        try {
          localStorage.setItem('sn:sim-watch', '0');
        } catch (e) {}
      };
    return el;
  }

  function showLivePanel(on) {
    if (!isWatching() && on) return;
    var el = ensureLivePanel();
    if (on) {
      el.classList.add('open');
      el.classList.toggle('off', !running);
    } else {
      el.classList.remove('open');
    }
    paintLive();
  }

  function paintLive() {
    var el = document.getElementById('sn-sim33-live');
    if (!el || !el.classList.contains('open')) return;
    el.classList.toggle('off', !running);
    var now = document.getElementById('sn-sim33-now');
    var st = document.getElementById('sn-sim33-stats');
    var fd = document.getElementById('sn-sim33-feed');
    var fo = document.getElementById('sn-sim33-focus');
    if (fo) fo.textContent = '📍 Rhodes Island · Old Town · Lindos · Faliraki…';
    if (now) {
      if (currentAct) {
        now.textContent =
          (ROLE_EMOJI[currentAct.role] || '·') +
          ' #' +
          currentAct.i +
          ' ' +
          currentAct.role +
          ' @ ' +
          (currentAct.hub || 'Rhodes') +
          '\n' +
          (currentAct.action || '…');
      } else {
        now.textContent = running ? 'Swarm on Rhodes…' : 'Stopped';
      }
    }
    if (st) {
      st.innerHTML =
        '<span>ok ' +
        stats.ok +
        '</span><span>fail ' +
        stats.fail +
        '</span><span>taught ' +
        stats.taught +
        '</span><span>t' +
        stats.ticks +
        '</span>';
    }
    if (fd) {
      fd.innerHTML = feed
        .slice(0, 12)
        .map(function (r) {
          return (
            '<div class="sim-row ' +
            (r.kind === 'err' ? 'err' : 'ok') +
            '">' +
            escapeHtml(r.line) +
            '</div>'
          );
        })
        .join('');
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function setCurrent(agent, action) {
    currentAct = {
      i: agent.i,
      role: agent.role,
      hub: agent.hub,
      name: agent.name,
      action: action,
    };
    preview(
      'Rhodes · ' +
        (ROLE_EMOJI[agent.role] || '') +
        ' #' +
        agent.i +
        ' ' +
        agent.role +
        ' · ' +
        String(action || '').slice(0, 40)
    );
    try {
      if (global.SNField && SNField.setNotice)
        SNField.setNotice(
          'Rhodes · #' + agent.i + ' ' + agent.role + ' · ' + String(action || '').slice(0, 28)
        );
    } catch (e) {}
    paintLive();
  }

  function ensureAgents() {
    if (agents.length === N) return agents;
    agents = [];
    var i;
    for (i = 0; i < N; i++) {
      var hub = HUBS[i % HUBS.length];
      var role = ROLE_PLAN[i];
      var id = 'sim33_' + (i + 1);
      agents.push({
        i: i + 1,
        id: id,
        role: role,
        name: role.charAt(0).toUpperCase() + role.slice(1) + ' · Rhodes · ' + (i + 1),
        hub: hub.name,
        lat: jitter(hub.lat, 0.01),
        lng: jitter(hub.lng, 0.01),
        shopName:
          role === 'vendor'
            ? 'Sim·' + SHOP_KINDS[i % SHOP_KINDS.length] + ' ' + hub.name
            : null,
        shopKind: role === 'vendor' ? SHOP_KINDS[i % SHOP_KINDS.length] : null,
        food: FOODS[i % FOODS.length],
        vehicle: role === 'driver' ? (i % 2 ? 'Scooter' : 'Bike') : null,
        acts: 0,
        fails: 0,
      });
    }
    return agents;
  }

  function become(agent) {
    if (!global.SNProfiles) return null;
    var roles = {
      social: true,
      client: true,
      vendor: agent.role === 'vendor',
      driver: agent.role === 'driver',
      worker: agent.role === 'ambassador',
      ambassador: agent.role === 'ambassador',
      dating: false,
    };
    var p = SNProfiles.upsert({
      id: agent.id,
      name: agent.name,
      handle: '@sim' + agent.i,
      bio: 'Sim-33 · ' + agent.role + ' · SPECS swarm · not public NPC product',
      roles: roles,
      lat: agent.lat,
      lng: agent.lng,
      sim: true,
      source: 'sim-33',
      shopName: agent.shopName || undefined,
      shopKind: agent.shopKind || undefined,
      vehicle: agent.vehicle || undefined,
      driverOnline: agent.role === 'driver',
      ambassadorOnline: agent.role === 'ambassador',
      menu: agent.role === 'vendor' ? [] : undefined,
    });
    try {
      SNProfiles.setMe(agent.id);
    } catch (e) {}
    try {
      global._snLastPos = { lat: agent.lat, lng: agent.lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(agent.lat, agent.lng);
    } catch (e2) {}
    return p;
  }

  function restoreMe() {
    try {
      if (savedMe && global.SNProfiles && SNProfiles.setMe) SNProfiles.setMe(savedMe);
    } catch (e) {}
  }

  function teach(q, a) {
    try {
      if (global.SNFreeMind && SNFreeMind.teach) {
        SNFreeMind.teach(q, a, ['sim-33', 'specs']);
        stats.taught++;
      }
    } catch (e) {}
  }

  function fail(agent, path, err) {
    stats.fail++;
    agent.fails++;
    var msg =
      'Rhodes · #' +
      agent.i +
      ' ' +
      agent.role +
      ' @ ' +
      (agent.hub || '') +
      ' · ' +
      path +
      ' · ' +
      (err || 'fail');
    stats.last = msg;
    log(msg, 'err');
    pushFeed(msg, 'err');
    setCurrent(agent, path + ' FAIL');
    try {
      if (global.SNUsage && SNUsage.handoff) {
        SNUsage.handoff('sim33:rhodes:' + path + ' · ' + (err || ''), {
          source: 'sim-33',
          agent: agent.id,
          role: agent.role,
          hub: agent.hub,
        });
      }
    } catch (e) {}
  }

  function ok(agent, path, detail) {
    stats.ok++;
    agent.acts++;
    stats.byRole[agent.role] = (stats.byRole[agent.role] || 0) + 1;
    var msg =
      'Rhodes · #' +
      agent.i +
      ' ' +
      agent.role +
      ' @ ' +
      (agent.hub || '') +
      ' · ' +
      path +
      (detail ? ' · ' + brief(detail, 40) : '');
    stats.last = msg;
    log(msg, 'ok');
    pushFeed(msg, 'ok');
    setCurrent(agent, path + (detail ? ' · ' + brief(detail, 36) : ''));
    teach('Rhodes ' + agent.role + ' ' + path, brief(detail || path, 80));
    teach('Rhodes Island Greece', 'SpaceNet activity on Rhodes · ' + (agent.hub || 'island'));
  }

  function brief(t, n) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    return t.length <= n ? t : t.slice(0, n - 1) + '…';
  }

  /** Client SPECS path — always on Rhodes */
  async function actClient(agent) {
    become(agent);
    flyRhodes(agent, 'city', agent.hub);
    setCurrent(agent, 'client @ ' + agent.hub);
    var cmds = [
      'locate',
      agent.food,
      'shops',
      'next',
      'souvlaki',
      'fly rhodes',
      'who are you',
    ];
    var cmd = cmds[Math.floor(Math.random() * cmds.length)];
    try {
      if (cmd === 'locate' || cmd === 'fly rhodes') {
        flyRhodes(agent, 'city', agent.hub);
        ok(agent, cmd === 'locate' ? 'locate' : 'fly rhodes', agent.hub);
        return;
      }
      if (global.SNAi && SNAi.ask) {
        setCurrent(agent, 'says: ' + cmd);
        var r = await SNAi.ask(cmd);
        flyRhodes(agent, 'city', agent.hub);
        ok(agent, 'ai:' + cmd, r);
        return;
      }
      if (global.SNCli && SNCli.run) {
        await SNCli.run(cmd);
        flyRhodes(agent, 'city', agent.hub);
        ok(agent, 'cli:' + cmd);
        return;
      }
      fail(agent, cmd, 'no AI/CLI');
    } catch (e) {
      fail(agent, cmd, e.message || e);
    }
  }

  /** Vendor SPECS on Rhodes: list shop · menu · fly · open tile */
  async function actVendor(agent) {
    become(agent);
    flyRhodes(agent, 'city', agent.hub);
    setCurrent(agent, 'vendor @ ' + agent.hub);
    try {
      if (!global.SNMarket || !SNMarket.listShop) {
        fail(agent, 'list shop', 'no market');
        return;
      }
      var shop = agent.shopName || 'Sim·Taverna ' + agent.hub;
      var listed = SNMarket.listShop(shop, agent.shopKind || 'taverna');
      if (!listed || listed.ok === false) {
        fail(agent, 'list shop', (listed && listed.error) || 'fail');
        return;
      }
      var items = [
        { name: agent.food || 'Souvlaki', price: 5 + (agent.i % 7) },
        { name: 'Rhodes special · ' + agent.hub, price: 8 + (agent.i % 5) },
      ];
      var j;
      for (j = 0; j < items.length; j++) {
        try {
          if (SNMarket.addMenuItem) SNMarket.addMenuItem(items[j].name, items[j].price);
          else if (global.SNProfiles && SNProfiles.setMenuItem) {
            SNProfiles.setMenuItem(agent.id, {
              name: items[j].name,
              price: items[j].price,
              desc: 'Rhodes Sim-33 · S',
            });
          }
        } catch (eM) {}
      }
      flyRhodes(agent, 'city', shop);
      try {
        if (global.SNTile && SNTile.open) {
          var p = SNProfiles.get(agent.id);
          if (p) SNTile.open(p, { tab: 'menu' });
        }
      } catch (eG) {}
      ok(agent, 'list shop', shop + ' · ' + agent.hub);
      teach('Rhodes vendor', 'list shop on Rhodes · menu in S · tile open');
    } catch (e) {
      fail(agent, 'vendor', e.message || e);
    }
  }

  /** Driver SPECS on Rhodes: online · claim · complete */
  async function actDriver(agent) {
    become(agent);
    flyRhodes(agent, 'city', agent.hub);
    setCurrent(agent, 'driver @ ' + agent.hub);
    try {
      if (global.SNMarket && SNMarket.goDriverOnline) {
        SNMarket.goDriverOnline(agent.vehicle || 'Scooter');
      } else if (global.SNProfiles) {
        var p = SNProfiles.get(agent.id) || become(agent);
        p.roles.driver = true;
        p.driverOnline = true;
        p.vehicle = agent.vehicle || 'Scooter';
        SNProfiles.upsert(p);
      }
      var open = null;
      if (global.SNTasks && SNTasks.list) {
        var tasks = SNTasks.list({ all: true }) || [];
        open = tasks.find(function (t) {
          return (
            t &&
            t.kind === 'delivery' &&
            (t.status === 'open' || t.status === 'claimed')
          );
        });
      }
      if (open && global.SNTasks.claim) {
        var c = SNTasks.claim(open.id);
        if (c && c.ok && c.task) {
          c.task.driverId = agent.id;
          c.task.status = 'in_progress';
          if (SNTasks.complete) {
            var d = SNTasks.complete(c.task.id);
            flyRhodes(agent, 'city', 'delivery');
            ok(agent, 'deliver', open.title || open.id);
            teach('Rhodes driver', 'scooter on Rhodes · claim · complete · S');
            return;
          }
        }
      }
      // No open order — create self-loop order path if vendors exist
      var vendors =
        (global.SNProfiles &&
          SNProfiles.list({ role: 'vendor' }).filter(function (v) {
            return v.sim && v.menu && v.menu.length;
          })) ||
        [];
      if (vendors.length && global.SNProfiles.cartAdd && global.SNProfiles.placeOrder) {
        // Switch to a client agent briefly for order, then back
        var clients = agents.filter(function (a) {
          return a.role === 'client';
        });
        var cl = clients[agent.i % Math.max(1, clients.length)];
        if (cl) {
          become(cl);
          try {
            if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 50) {
              SNCurrency.credit(80, 'sim top-up');
            }
          } catch (eC) {}
          var v = vendors[agent.i % vendors.length];
          var item = v.menu[0];
          SNProfiles.cartClear && SNProfiles.cartClear();
          SNProfiles.cartAdd(v.id, item, 1);
          var ord = SNProfiles.placeOrder();
          become(agent);
          if (ord && ord.ok && ord.task && SNTasks.claim) {
            var c2 = SNTasks.claim(ord.task.id);
            if (c2 && c2.ok && SNTasks.complete) SNTasks.complete(c2.task.id);
            flyRhodes(agent, 'city', 'order+deliver');
            ok(agent, 'order+deliver', (v.shopName || v.name) + ' · ' + agent.hub);
            return;
          }
        }
      }
      flyRhodes(agent, 'city', agent.hub);
      ok(agent, 'driver online', (agent.vehicle || 'ready') + ' · ' + agent.hub);
      teach('Rhodes driver online', 'drive on Rhodes · claim · complete');
    } catch (e) {
      fail(agent, 'driver', e.message || e);
    }
  }

  /** Ambassador on Rhodes: teach SPECS · free mind · fly island */
  async function actAmbassador(agent) {
    become(agent);
    flyRhodes(agent, 'regional', agent.hub);
    setCurrent(agent, 'ambassador @ ' + agent.hub);
    try {
      var tips = [
        ['Rhodes SpaceNet', 'Activity on Rhodes Island Greece · Old Town · Lindos · Faliraki'],
        ['S currency', 'S SpaceNets is primary · fiat crypto secondary quotes only'],
        ['SPACENET grid', 'GLOBAL then NATIONAL then REGIONAL then CITY · tap to dive on Rhodes'],
        ['AI free', 'SpaceNet Free first · teach to grow · no paid xAI required for chat'],
        ['Rhodes vendor', 'list shop on Rhodes · menu add · order · driver scooter'],
        ['next show all', 'next vendor on globe · show all paints map near Rhodes'],
      ];
      var tip = tips[agent.i % tips.length];
      teach(tip[0], tip[1]);
      if (global.SNAi && SNAi.ask) {
        setCurrent(agent, 'teaches: ' + tip[0]);
        var r = await SNAi.ask(tip[0]);
        flyRhodes(agent, 'regional', agent.hub);
        ok(agent, 'ambassador', brief(r, 60));
      } else {
        ok(agent, 'ambassador', tip[0]);
      }
      try {
        if (global.SNBrain && SNBrain.verify) {
          var v = SNBrain.verify();
          if (v && v.ok === false) {
            fail(agent, 'verify', (v.failed && v.failed.join(',')) || 'brain fail');
          }
        }
      } catch (eV) {}
    } catch (e) {
      fail(agent, 'ambassador', e.message || e);
    }
  }

  async function actOne(agent) {
    if (!agent) return;
    if (agent.role === 'vendor') return actVendor(agent);
    if (agent.role === 'driver') return actDriver(agent);
    if (agent.role === 'ambassador') return actAmbassador(agent);
    return actClient(agent);
  }

  async function tick() {
    if (!running) return;
    // Real-time view only when logged in / watching
    if (!isWatching()) {
      showLivePanel(false);
    } else {
      showLivePanel(true);
    }
    stats.ticks++;
    ensureAgents();
    var agent = agents[idx % agents.length];
    idx++;
    try {
      await actOne(agent);
    } catch (e) {
      fail(agent, 'tick', e.message || e);
    }
    paintLive();
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          stats: stats,
          idx: idx,
          n: agents.length,
          focus: 'Rhodes',
        })
      );
    } catch (eS) {}
  }

  function start(opts) {
    opts = opts || {};
    if (running) {
      log('Sim-33 already running on Rhodes · sim stop to halt', 'dim');
      showLivePanel(true);
      return status();
    }
    ensureAgents();
    try {
      savedMe = global.SNProfiles && SNProfiles.me && SNProfiles.me().id;
    } catch (e) {
      savedMe = null;
    }
    running = true;
    stats.startedAt = Date.now();
    // Observable pace for any user; superuser can bridge sim_speed later
    tickMs =
      opts.ms > 0
        ? opts.ms
        : opts.fast
          ? 2500
          : opts.slow
            ? 9000
            : 5500;
    // Open globe on Rhodes immediately so you SEE the island
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(RHODES.lat, RHODES.lng, {
          tier: 'regional',
          body: 'earth',
          pulse: false,
          label: 'Rhodes Island',
        });
      }
    } catch (eR) {}
    log('── Sim-33 LIVE · RHODES ISLAND, Greece · ' + N + ' agents ──', 'ok');
    log('Old Town · Mandraki · Lindos · Faliraki · Ialysos · Garage…', 'dim');
    log('12 clients · 8 vendors · 8 drivers · 5 ambassadors', 'dim');
    preview('RHODES · SIM-33 LIVE');
    try {
      localStorage.setItem('sn:sim-watch', '1');
    } catch (eW) {}
    showLivePanel(true);
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('sim33_start', { n: N, focus: 'Rhodes' });
    } catch (e2) {}
    void tick();
    timer = setInterval(function () {
      void tick();
    }, tickMs);
    return status();
  }

  function stop() {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    restoreMe();
    currentAct = null;
    log('── Sim-33 STOP · Rhodes · ok ' + stats.ok + ' · fail ' + stats.fail + ' ──', 'ok');
    preview('RHODES · SIM OFF');
    paintLive();
    var el = document.getElementById('sn-sim33-live');
    if (el) el.classList.add('off');
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('sim33_stop', {
          ok: stats.ok,
          fail: stats.fail,
          taught: stats.taught,
          focus: 'Rhodes',
        });
    } catch (e) {}
    return status();
  }

  function wipe() {
    stop();
    if (global.SNProfiles && SNProfiles.list) {
      var all = SNProfiles.list({}) || [];
      all.forEach(function (p) {
        if (p && (p.sim || String(p.id || '').indexOf('sim33_') === 0)) {
          try {
            if (SNProfiles.remove) SNProfiles.remove(p.id);
            else if (SNProfiles.P && SNProfiles.P.profiles) SNProfiles.P.profiles.delete(p.id);
          } catch (e) {}
        }
      });
    }
    // Hard wipe sim ids from profiles map if exposed
    try {
      if (global.SNProfiles && typeof SNProfiles.upsert === 'function') {
        agents.forEach(function (a) {
          try {
            var p = SNProfiles.get(a.id);
            if (p && SNProfiles.upsert) {
              // mark inactive
              p.sim = true;
              p.inactive = true;
              p.roles = { client: false, vendor: false, driver: false };
              SNProfiles.upsert(p);
            }
          } catch (e2) {}
        });
      }
    } catch (e3) {}
    agents = [];
    log('Sim-33 wiped (best-effort) · refresh if tiles linger', 'dim');
    return status();
  }

  async function burst(count) {
    count = Math.min(200, Math.max(1, count || 33));
    ensureAgents();
    log('Sim-33 burst · ' + count + ' acts…', 'dim');
    var was = running;
    if (!was) {
      try {
        savedMe = global.SNProfiles && SNProfiles.me && SNProfiles.me().id;
      } catch (e) {}
    }
    var k;
    for (k = 0; k < count; k++) {
      var agent = agents[k % agents.length];
      await actOne(agent);
    }
    if (!was) restoreMe();
    log('Sim-33 burst done · ok ' + stats.ok + ' · fail ' + stats.fail, 'ok');
    return status();
  }

  function status() {
    return {
      n: N,
      running: running,
      agents: agents.length,
      stats: Object.assign({}, stats),
      roles: { client: 12, vendor: 8, driver: 8, ambassador: 5 },
      tickMs: tickMs,
      focus: 'Rhodes Island, Greece',
      hubs: HUBS.map(function (h) {
        return h.name;
      }),
      watching: isWatching(),
      loggedIn: isLoggedIn(),
    };
  }

  /** Hide sim profiles from casual list when swarm off */
  function filterSim(list) {
    if (!Array.isArray(list)) return list;
    if (running) return list;
    return list.filter(function (p) {
      return !(p && (p.sim || String(p.id || '').indexOf('sim33_') === 0));
    });
  }

  function setSpeed(ms) {
    ms = Math.max(2000, Math.min(30000, Number(ms) || 5500));
    tickMs = ms;
    if (running && timer) {
      clearInterval(timer);
      timer = setInterval(function () {
        void tick();
      }, tickMs);
    }
    log('Sim-33 speed · ' + tickMs + ' ms/tick', 'ok');
    return tickMs;
  }

  function maybeAutostart() {
    try {
      if (localStorage.getItem(AUTO_KEY) === '0') return;
      var q = typeof location !== 'undefined' ? location.search || '' : '';
      if (/[?&]sim=0\b/.test(q)) return;
      // Normal speed for everyone to observe (not blitz)
      function tryStart() {
        if (running) return;
        if (isLoggedIn() || /[?&]sim=1\b/.test(q) || localStorage.getItem(AUTO_KEY) === '1') {
          start({ ms: 5500 });
        }
      }
      setTimeout(tryStart, 3500);
      if (authWatch) clearInterval(authWatch);
      authWatch = setInterval(function () {
        if (!running && isLoggedIn() && localStorage.getItem(AUTO_KEY) !== '0') {
          start({ ms: 5500 });
        }
        if (running && isWatching()) showLivePanel(true);
      }, 5000);
    } catch (e) {}
  }

  function patchProfilesList() {
    try {
      if (!global.SNProfiles || !SNProfiles.list || SNProfiles.list._simPatched) return;
      var orig = SNProfiles.list.bind(SNProfiles);
      SNProfiles.list = function (filter) {
        return filterSim(orig(filter));
      };
      SNProfiles.list._simPatched = true;
    } catch (e) {}
  }

  setTimeout(patchProfilesList, 500);
  setTimeout(maybeAutostart, 1200);

  global.SNSim33 = {
    N: N,
    RHODES: RHODES,
    HUBS: HUBS,
    start: start,
    stop: stop,
    wipe: wipe,
    burst: burst,
    status: status,
    tick: tick,
    filterSim: filterSim,
    showLive: function () {
      try {
        localStorage.setItem('sn:sim-watch', '1');
      } catch (e) {}
      showLivePanel(true);
      if (!running) start({ ms: 5500 });
    },
    setSpeed: setSpeed,
    get running() {
      return running;
    },
    get agents() {
      return agents.slice();
    },
    get feed() {
      return feed.slice();
    },
    get tickMs() {
      return tickMs;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
