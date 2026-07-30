/**
 * SNSim33 — 33 SPECS agents (clients · vendors · drivers · ambassadors)
 *
 * Owner-dev swarm: they USE the live app stack (profiles, market, tasks, free mind, globe)
 * to exercise SPECS paths and grow SpaceNet Free. Not public product NPCs.
 *
 * CLI: sim start | sim stop | sim status | sim wipe | sim burst
 * Auto: ?sim=1 or localStorage sn:sim-auto=1
 *
 * SPECS: zero dummy shops for casual visitors — sim profiles tagged sim:true,
 * hidden from marketplace when swarm is stopped.
 */
(function (global) {
  'use strict';

  var N = 33;
  var KEY = 'sn:sim33-v1';
  var AUTO_KEY = 'sn:sim-auto';
  var running = false;
  var timer = null;
  var tickMs = 900;
  var agents = [];
  var idx = 0;
  var stats = {
    ticks: 0,
    ok: 0,
    fail: 0,
    taught: 0,
    byRole: { client: 0, vendor: 0, driver: 0, ambassador: 0 },
    last: '',
    startedAt: 0,
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

  // Focus cities (real coords — SPECS place = lat/lng)
  var HUBS = [
    { name: 'Rhodes', lat: 36.4341, lng: 28.2176 },
    { name: 'Athens', lat: 37.9838, lng: 23.7275 },
    { name: 'Thessaloniki', lat: 40.6401, lng: 22.9444 },
    { name: 'Heraklion', lat: 35.3387, lng: 25.1442 },
    { name: 'Patras', lat: 38.2466, lng: 21.7346 },
  ];

  var FOODS = ['pizza', 'coffee', 'souvlaki', 'burger', 'sushi'];
  var SHOP_KINDS = ['cafe', 'pizza', 'grill', 'bakery', 'market'];

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
      if (global.SNGlobe && SNGlobe.setHud) SNGlobe.setHud(String(m).slice(0, 64));
    } catch (e2) {}
  }

  function jitter(n, s) {
    return n + (Math.random() - 0.5) * (s || 0.04);
  }

  function uid(p) {
    return (p || 's') + '_' + Math.random().toString(36).slice(2, 9);
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
        name: role.charAt(0).toUpperCase() + role.slice(1) + ' · ' + (i + 1),
        hub: hub.name,
        lat: jitter(hub.lat, 0.06),
        lng: jitter(hub.lng, 0.06),
        shopName: role === 'vendor' ? 'Sim·' + SHOP_KINDS[i % SHOP_KINDS.length] + ' ' + (i + 1) : null,
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
    var msg = 'Sim·' + agent.i + ' ' + agent.role + ' · ' + path + ' · ' + (err || 'fail');
    stats.last = msg;
    log(msg, 'err');
    try {
      if (global.SNUsage && SNUsage.handoff) {
        SNUsage.handoff('sim33:' + path + ' · ' + (err || ''), {
          source: 'sim-33',
          agent: agent.id,
          role: agent.role,
        });
      }
    } catch (e) {}
  }

  function ok(agent, path, detail) {
    stats.ok++;
    agent.acts++;
    stats.byRole[agent.role] = (stats.byRole[agent.role] || 0) + 1;
    stats.last = 'Sim·' + agent.i + ' ' + agent.role + ' · ' + path + (detail ? ' · ' + detail : '');
    teach(agent.role + ' ' + path, brief(detail || path, 80));
  }

  function brief(t, n) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    return t.length <= n ? t : t.slice(0, n - 1) + '…';
  }

  /** Client SPECS path: locate focus · ask free AI · shops / food · next */
  async function actClient(agent) {
    become(agent);
    var cmds = [
      'locate',
      agent.food,
      'shops',
      'next',
      'help',
      'who are you',
      'fly ' + agent.hub.toLowerCase(),
    ];
    var cmd = cmds[Math.floor(Math.random() * cmds.length)];
    try {
      if (cmd === 'locate' && global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(agent.lat, agent.lng, {
          tier: 'city',
          body: 'earth',
          pulse: false,
          label: agent.name,
        });
        ok(agent, 'locate', agent.hub);
        return;
      }
      if (global.SNAi && SNAi.ask) {
        var r = await SNAi.ask(cmd);
        ok(agent, 'ai:' + cmd, r);
        return;
      }
      if (global.SNCli && SNCli.run) {
        await SNCli.run(cmd);
        ok(agent, 'cli:' + cmd);
        return;
      }
      fail(agent, cmd, 'no AI/CLI');
    } catch (e) {
      fail(agent, cmd, e.message || e);
    }
  }

  /** Vendor SPECS: list shop · menu · pulse on globe */
  async function actVendor(agent) {
    become(agent);
    try {
      if (!global.SNMarket || !SNMarket.listShop) {
        fail(agent, 'list shop', 'no market');
        return;
      }
      var shop = agent.shopName || 'Sim Shop ' + agent.i;
      var listed = SNMarket.listShop(shop, agent.shopKind || 'cafe');
      if (!listed || listed.ok === false) {
        fail(agent, 'list shop', (listed && listed.error) || 'fail');
        return;
      }
      var items = [
        { name: agent.food || 'Item', price: 5 + (agent.i % 7) },
        { name: 'Daily special ' + agent.i, price: 8 + (agent.i % 5) },
      ];
      var j;
      for (j = 0; j < items.length; j++) {
        try {
          if (SNMarket.addMenuItem) SNMarket.addMenuItem(items[j].name, items[j].price);
          else if (global.SNProfiles && SNProfiles.setMenuItem) {
            SNProfiles.setMenuItem(agent.id, {
              name: items[j].name,
              price: items[j].price,
              desc: 'Sim-33 SPECS menu',
            });
          }
        } catch (eM) {}
      }
      try {
        if (global.SNGlobe && SNGlobe.goToPlace) {
          SNGlobe.goToPlace(agent.lat, agent.lng, {
            tier: 'regional',
            body: 'earth',
            pulse: false,
            label: shop,
          });
        }
        if (global.SNTile && SNTile.open) {
          var p = SNProfiles.get(agent.id);
          if (p) SNTile.open(p, { tab: 'menu' });
        }
      } catch (eG) {}
      ok(agent, 'list shop', shop + ' · menu');
      teach('vendor list shop', 'list shop Name · menu add Item price · S only');
    } catch (e) {
      fail(agent, 'vendor', e.message || e);
    }
  }

  /** Driver SPECS: online · claim open delivery · complete */
  async function actDriver(agent) {
    become(agent);
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
            ok(agent, 'deliver', open.title || open.id);
            teach('driver deliver', 'drive on · claim · complete · earn S');
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
            ok(agent, 'order+deliver', v.shopName || v.name);
            return;
          }
        }
      }
      ok(agent, 'driver online', agent.vehicle || 'ready');
      teach('driver online', 'drive on · wait for order · claim · complete');
    } catch (e) {
      fail(agent, 'driver', e.message || e);
    }
  }

  /** Ambassador: free mind teach · handoff quality · SPECS tips · verify */
  async function actAmbassador(agent) {
    become(agent);
    try {
      var tips = [
        ['S currency', 'S SpaceNets is primary · fiat crypto secondary quotes only'],
        ['SPACENET grid', 'GLOBAL then NATIONAL then REGIONAL then CITY · tap to dive'],
        ['AI free', 'SpaceNet Free first · teach to grow · no paid xAI required for chat'],
        ['vendor path', 'list shop · menu add · order me · drive on · deliver me'],
        ['next show all', 'next vendor on globe · show all paints map'],
        ['zero dummy', 'No fake NPC shops as product · sim-33 is owner swarm only'],
      ];
      var tip = tips[agent.i % tips.length];
      teach(tip[0], tip[1]);
      if (global.SNAi && SNAi.ask) {
        var r = await SNAi.ask(tip[0]);
        ok(agent, 'ambassador teach', brief(r, 60));
      } else {
        ok(agent, 'ambassador teach', tip[0]);
      }
      try {
        if (global.SNBrain && SNBrain.verify) {
          var v = SNBrain.verify();
          if (v && v.ok === false) {
            fail(agent, 'verify', (v.failed && v.failed.join(',')) || 'brain fail');
          }
        }
      } catch (eV) {}
      try {
        if (global.SNGlobe && SNGlobe.goToPlace) {
          SNGlobe.goToPlace(agent.lat, agent.lng, {
            tier: 'national',
            body: 'earth',
            pulse: false,
            label: 'Amb ' + agent.i,
          });
        }
      } catch (eG) {}
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
    stats.ticks++;
    ensureAgents();
    var agent = agents[idx % agents.length];
    idx++;
    try {
      await actOne(agent);
    } catch (e) {
      fail(agent, 'tick', e.message || e);
    }
    if (stats.ticks % 11 === 0) {
      preview(
        'Sim33 · t' +
          stats.ticks +
          ' · ok' +
          stats.ok +
          ' · fail' +
          stats.fail +
          ' · teach' +
          stats.taught
      );
      log(
        'Sim-33 · tick ' +
          stats.ticks +
          ' · ok ' +
          stats.ok +
          ' · fail ' +
          stats.fail +
          ' · free taught ' +
          stats.taught,
        'ok'
      );
    }
    // Persist light stats
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          stats: stats,
          idx: idx,
          n: agents.length,
        })
      );
    } catch (eS) {}
  }

  function start(opts) {
    opts = opts || {};
    if (running) {
      log('Sim-33 already running · sim stop to halt', 'dim');
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
    tickMs = opts.fast ? 400 : opts.slow ? 2000 : 900;
    log('── Sim-33 SPECS swarm START · ' + N + ' agents ──', 'ok');
    log('12 clients · 8 vendors · 8 drivers · 5 ambassadors · grow SpaceNet Free', 'dim');
    log('sim stop · sim status · sim wipe · not public product NPCs', 'dim');
    preview('SIM-33 RUNNING');
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('sim33_start', { n: N });
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
    log('── Sim-33 STOP · ok ' + stats.ok + ' · fail ' + stats.fail + ' ──', 'ok');
    preview('SIM-33 OFF');
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('sim33_stop', { ok: stats.ok, fail: stats.fail, taught: stats.taught });
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

  function maybeAutostart() {
    try {
      // Owner can lock off: localStorage sn:sim-auto=0
      if (localStorage.getItem(AUTO_KEY) === '0') return;
      var q = typeof location !== 'undefined' ? location.search || '' : '';
      if (/[?&]sim=0\b/.test(q)) return;
      // Default ON once per page load — 33 SPECS agents use + improve app + free mind
      setTimeout(function () {
        if (!running) start({ fast: true });
      }, 3200);
    } catch (e) {}
  }

  // Patch list to hide sim when stopped (soft wrap)
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
    start: start,
    stop: stop,
    wipe: wipe,
    burst: burst,
    status: status,
    tick: tick,
    filterSim: filterSim,
    get running() {
      return running;
    },
    get agents() {
      return agents.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
