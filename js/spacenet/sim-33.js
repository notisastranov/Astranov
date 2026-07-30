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
    // SPECS: all activity on main CLI only — no floating panels
  }

  /** Kill legacy floating sim panels (never recreate) */
  function killFloatingPanels() {
    try {
      var el = document.getElementById('sn-sim33-live');
      if (el && el.parentNode) el.parentNode.removeChild(el);
      var css = document.getElementById('sn-sim33-css');
      if (css && css.parentNode) css.parentNode.removeChild(css);
      var sp = document.getElementById('sn-super-panel');
      if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
      var sc = document.getElementById('sn-super-css');
      if (sc && sc.parentNode) sc.parentNode.removeChild(sc);
    } catch (e) {}
  }

  function showLivePanel() {
    killFloatingPanels();
  }

  function paintLive() {
    killFloatingPanels();
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

  /** Client SPECS — order from vendor → route polygon vendor→client on Rhodes */
  async function actClient(agent) {
    become(agent);
    flyRhodes(agent, 'city', agent.hub);
    setCurrent(agent, 'client @ ' + agent.hub);
    try {
      var vendors =
        (global.SNProfiles &&
          SNProfiles.list({ role: 'vendor' }).filter(function (v) {
            return v && v.lat != null && v.menu && v.menu.length;
          })) ||
        [];
      // Prefer marketplace order + radar polygon when vendors exist
      if (vendors.length && Math.random() > 0.35) {
        var v = vendors[agent.i % vendors.length];
        var clientP = SNProfiles.get(agent.id) || become(agent);
        if (global.SNMarketLive && SNMarketLive.runOrderLoop) {
          var loop = await SNMarketLive.runOrderLoop(clientP, v, {});
          if (loop && loop.ok) {
            ok(
              agent,
              'order',
              (v.shopName || v.name) + ' → ' + agent.hub + ' · route on radar'
            );
            return;
          }
        }
        // Fallback: cart + placeOrder (triggers startDeliveryRoute)
        try {
          if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 40) {
            SNCurrency.credit(80, 'sim client top-up');
          }
          SNProfiles.setMe(agent.id);
          SNProfiles.cartClear && SNProfiles.cartClear();
          SNProfiles.cartAdd(v.id, v.menu[0], 1);
          global._snLastPos = { lat: agent.lat, lng: agent.lng };
          var ord = SNProfiles.placeOrder();
          if (ord && ord.ok) {
            ok(agent, 'order', (v.shopName || v.name) + ' · polygon ETA');
            return;
          }
        } catch (eO) {}
      }
      var cmds = ['locate', agent.food, 'shops', 'souvlaki', 'fly rhodes'];
      var cmd = cmds[Math.floor(Math.random() * cmds.length)];
      if (cmd === 'locate' || cmd === 'fly rhodes') {
        flyRhodes(agent, 'city', agent.hub);
        ok(agent, cmd, agent.hub);
        return;
      }
      if (global.SNAi && SNAi.ask) {
        var r = await SNAi.ask(cmd);
        ok(agent, 'ai:' + cmd, r);
        return;
      }
      ok(agent, 'idle', agent.hub);
    } catch (e) {
      fail(agent, 'client', e.message || e);
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

  /** Driver on Rhodes: claim delivery · show drive polygon with ETA/speed · complete later */
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
            (t.status === 'open' || t.status === 'claimed' || t.status === 'in_progress')
          );
        });
      }
      if (open && global.SNTasks.claim) {
        var c =
          open.status === 'open'
            ? SNTasks.claim(open.id)
            : { ok: true, task: open };
        if (c && c.ok && c.task) {
          c.task.driverId = agent.id;
          c.task.status = 'in_progress';
          var pick = { lat: c.task.lat, lng: c.task.lng };
          var drop = {
            lat: c.task.drop_lat != null ? c.task.drop_lat : agent.lat,
            lng: c.task.drop_lng != null ? c.task.drop_lng : agent.lng,
          };
          if (global.SNField && SNField.startDeliveryRoute) {
            await SNField.startDeliveryRoute({
              id: 'live:' + c.task.id,
              vendorLat: pick.lat,
              vendorLng: pick.lng,
              dropLat: drop.lat,
              dropLng: drop.lng,
              label: '🛵 ' + agent.name.slice(0, 10),
              driver: agent.name,
              color: 'rgba(255,200,60,0.95)',
              onArrive: function () {
                try {
                  if (SNTasks.complete) SNTasks.complete(c.task.id);
                  log(
                    'Rhodes · driver #' + agent.i + ' delivered · complete',
                    'ok'
                  );
                } catch (eA) {}
              },
            });
          }
          ok(agent, 'driving', 'ETA on radar · ' + (agent.vehicle || 'Scooter'));
          teach('Rhodes driver', 'claim · polygon · ETA km/h · deliver');
          return;
        }
      }
      // Seed an order so next ticks have routes
      var vendors =
        (global.SNProfiles &&
          SNProfiles.list({ role: 'vendor' }).filter(function (v) {
            return v && v.menu && v.menu.length;
          })) ||
        [];
      var clients = agents.filter(function (a) {
        return a.role === 'client';
      });
      if (vendors.length && clients.length && global.SNMarketLive && SNMarketLive.runOrderLoop) {
        var cl = clients[agent.i % clients.length];
        var vn = vendors[agent.i % vendors.length];
        become(cl);
        var clP = SNProfiles.get(cl.id) || become(cl);
        await SNMarketLive.runOrderLoop(clP, vn, {});
        become(agent);
        ok(agent, 'seed order', 'waiting claim · polygon live');
        return;
      }
      flyRhodes(agent, 'city', agent.hub);
      ok(agent, 'driver online', (agent.vehicle || 'ready') + ' · ' + agent.hub);
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
    killFloatingPanels();
    stats.ticks++;
    ensureAgents();
    var agent = agents[idx % agents.length];
    idx++;
    try {
      await actOne(agent);
    } catch (e) {
      fail(agent, 'tick', e.message || e);
    }
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
    killFloatingPanels();
    if (running) {
      log('Sim-33 already running on Rhodes · sim stop · all output on CLI', 'dim');
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
    log('── Sim-33 · RHODES · ' + N + ' agents · CLI only (no extra panels) ──', 'ok');
    log('12 clients · 8 vendors · 8 drivers · 5 ambassadors · ~' + tickMs + 'ms/tick', 'dim');
    preview('Sim-33 Rhodes · CLI');
    try {
      localStorage.setItem('sn:sim-watch', '1');
    } catch (eW) {}
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
    preview('Sim off');
    killFloatingPanels();
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
      killFloatingPanels();
      if (!running) start({ ms: 5500 });
      else log('Sim already on · watch CLI lines only', 'dim');
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
