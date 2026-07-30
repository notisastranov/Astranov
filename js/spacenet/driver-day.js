/**
 * SNDriverDay / real Sim mode — YOU dictate on CLI (no auto swarm, no auto day script)
 *
 * Burger: Sim start/stop → arms real Rodos session
 * CLI you type, for example:
 *   wake | coffee | work | deliver | claim | date | offline | day status
 *
 * Real product paths: profiles, orders, 3% fees, routes, tasks, dating.
 * No camera thrash · no auto tiles · all on main CLI.
 */
(function (global) {
  'use strict';

  var RHODES = { lat: 36.4341, lng: 28.2176 };
  var modeOn = false;
  var phase = 'idle';
  var last = { order: null, task: null };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'ok');
    } catch (e) {}
  }

  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(String(m).slice(0, 80));
    } catch (e) {}
  }

  function think(m) {
    try {
      if (global.SNFreeMind && SNFreeMind.think) SNFreeMind.think(m, 'sim');
      else if (global.SNCli && SNCli.log) SNCli.log('🧠 ' + m, 'dim');
    } catch (e) {}
  }

  function spot(i) {
    var hubs = [
      { n: 'Old Town', lat: 36.4425, lng: 28.2272 },
      { n: 'Mandraki', lat: 36.4508, lng: 28.2265 },
      { n: 'Ixia', lat: 36.416, lng: 28.168 },
      { n: 'Faliraki', lat: 36.339, lng: 28.199 },
      { n: 'New Market', lat: 36.4438, lng: 28.222 },
    ];
    var h = hubs[i % hubs.length];
    return {
      lat: h.lat + (Math.random() - 0.5) * 0.006,
      lng: h.lng + (Math.random() - 0.5) * 0.006,
      name: h.n,
    };
  }

  function ensureCafe() {
    var p = spot(1);
    var id = 'day_cafe_rhodes';
    try {
      global.SNProfiles.upsert({
        id: id,
        name: 'Mandraki Coffee',
        handle: '@mandrakicoffee',
        bio: '☕ Rodos · SpaceNet',
        roles: { vendor: true, client: true, social: true },
        lat: p.lat,
        lng: p.lng,
        shopName: 'Mandraki Coffee',
        shopKind: 'cafe',
        sim: true,
        source: 'driver-day',
        menu: [],
      });
      if (global.SNProfiles.setMenuItem) {
        SNProfiles.setMenuItem(id, { name: 'Espresso', price: 2.5, desc: 'Morning' });
        SNProfiles.setMenuItem(id, { name: 'Freddo cappuccino', price: 4.0, desc: 'Rodos' });
      }
      return SNProfiles.get(id);
    } catch (e) {
      return null;
    }
  }

  function ensureDriver() {
    var p = spot(0);
    var id = 'day_driver_me';
    try {
      var d = global.SNProfiles.upsert({
        id: id,
        name: 'Driver · Rodos',
        handle: '@driver_rodos',
        bio: '🛵 You dictate the shift on CLI',
        roles: {
          driver: true,
          client: true,
          dating: true,
          social: true,
          worker: true,
        },
        lat: p.lat,
        lng: p.lng,
        vehicle: 'Scooter',
        driverOnline: false,
        lookingFor: 'Coffee · walk · real talk after shift',
        sim: true,
        source: 'driver-day',
      });
      if (global.SNProfiles.setMe) SNProfiles.setMe(id);
      return d || SNProfiles.get(id);
    } catch (e) {
      return null;
    }
  }

  function ensureDate() {
    var p = spot(3);
    var id = 'day_date_faliraki';
    try {
      return global.SNProfiles.upsert({
        id: id,
        name: 'Alex · Faliraki',
        handle: '@alex_fali',
        bio: 'Evening walk · coffee',
        roles: { dating: true, social: true, client: true },
        lat: p.lat,
        lng: p.lng,
        lookingFor: 'Walk · coffee · real talk',
        sim: true,
        source: 'driver-day',
      });
    } catch (e) {
      return null;
    }
  }

  function meDriver() {
    var d = ensureDriver();
    try {
      if (d && global.SNProfiles.setMe) SNProfiles.setMe(d.id);
    } catch (e) {}
    return d;
  }

  /** Sim mode ON — real session ready; you dictate next CLI lines */
  function start() {
    modeOn = true;
    phase = 'ready';
    try {
      localStorage.setItem('sn:sim-mode', '1');
    } catch (e) {}
    ensureDriver();
    ensureCafe();
    ensureDate();
    try {
      if (global.SNMap && SNMap.open) {
        void SNMap.open(RHODES.lat, RHODES.lng, { force: false });
      }
    } catch (e2) {}
    log('── SIM ON · real Rodos · YOU dictate on CLI ──', 'ok');
    log('Type: wake · coffee · work · deliver · claim · date · offline · sim stop', 'dim');
    log('No auto script · no 33-swarm · drag map = your camera', 'dim');
    think('Sim armed · waiting for your CLI dictation');
    preview('SIM ON · dictate');
    return status();
  }

  function stop() {
    modeOn = false;
    phase = 'idle';
    try {
      localStorage.setItem('sn:sim-mode', '0');
    } catch (e) {}
    try {
      var d = global.SNProfiles && SNProfiles.get('day_driver_me');
      if (d) {
        d.driverOnline = false;
        SNProfiles.upsert(d);
      }
    } catch (e2) {}
    log('── SIM OFF ──', 'dim');
    preview('SIM OFF');
    return status();
  }

  function toggle() {
    if (modeOn) return stop();
    return start();
  }

  /** Dictated steps — call from CLI when sim is on (or always allow) */
  async function cmd(raw) {
    var low = String(raw || '')
      .toLowerCase()
      .trim();
    if (!low) return { ok: false };

    if (!modeOn && !/^(sim|day)/.test(low)) {
      // Allow dictate verbs only in sim mode, or auto-arm
      start();
    }

    var driver = meDriver();
    var cafe = ensureCafe();

    // —— WAKE ——
    if (/^wake\b|^morning\b|^up\b/.test(low)) {
      phase = 'wake';
      log('── WAKE ──', 'ok');
      think('You woke the driver · go online when ready');
      if (driver) {
        driver.driverOnline = true;
        driver.roles = driver.roles || {};
        driver.roles.driver = true;
        try {
          SNProfiles.upsert(driver);
        } catch (e) {}
      }
      try {
        if (global.SNMarket && SNMarket.goDriverOnline) {
          SNMarket.goDriverOnline((driver && driver.vehicle) || 'Scooter');
        }
      } catch (e2) {}
      log('Driver ONLINE · scooter · Rhodes', 'ok');
      preview('Wake · online');
      return { ok: true, phase: phase };
    }

    // —— COFFEE ——
    if (/^coffee\b|^espresso\b|^freddo\b|^café\b|^καφέ/.test(low)) {
      phase = 'coffee';
      log('── COFFEE ──', 'ok');
      think('Ordering coffee · real cart · real 3% · route polygon');
      if (!cafe) {
        log('No cafe · try again', 'err');
        return { ok: false };
      }
      try {
        if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 15) {
          SNCurrency.credit(40, 'sim coffee wallet');
        }
        meDriver();
        global._snLastPos = { lat: driver.lat, lng: driver.lng };
        if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(driver.lat, driver.lng);
        SNProfiles.cartClear && SNProfiles.cartClear();
        var item =
          (cafe.menu || []).find(function (m) {
            return /freddo|cappuccino|espresso|coffee/i.test(m.name || '');
          }) ||
          (cafe.menu && cafe.menu[0]) ||
          { name: 'Coffee', price: 3.5 };
        if (!cafe.menu || !cafe.menu.length) {
          SNProfiles.setMenuItem(cafe.id, { name: item.name, price: item.price || 3.5 });
          cafe = SNProfiles.get(cafe.id);
          item = cafe.menu[0];
        }
        SNProfiles.cartAdd(cafe.id, item, 1);
        var ord = SNProfiles.placeOrder();
        last.order = ord;
        last.task = ord && ord.task;
        if (ord && ord.ok) {
          log(
            'Ordered · ' +
              item.name +
              ' · ' +
              (SNCurrency.format ? SNCurrency.format(ord.total) : ord.total + ' S'),
            'ok'
          );
          log('Next: claim · deliver  (or work for other jobs)', 'dim');
          preview('Coffee ordered');
          return { ok: true, order: ord };
        }
        log((ord && ord.error) || 'order failed', 'err');
      } catch (e) {
        log('Coffee · ' + (e.message || e), 'err');
      }
      return { ok: false };
    }

    // —— WORK: open delivery tasks ——
    if (/^work\b|^shift\b|^jobs?\b|^tasks?\b/.test(low) && !/^task\s*list/.test(low)) {
      phase = 'work';
      log('── WORK · open deliveries ──', 'ok');
      think('You posted work · claim when ready');
      var a = spot(0);
      var b = spot(2);
      var t1 = null;
      try {
        t1 = global.SNTasks.create({
          kind: 'delivery',
          role: 'driver',
          title: '📦 Parcel · ' + a.name + ' → ' + b.name,
          raw: 'delivery ' + a.name,
          lat: a.lat,
          lng: a.lng,
          drop_lat: b.lat,
          drop_lng: b.lng,
          dur: '45m',
          always_on: true,
          total_s: 10,
          driver_s: 1.5,
        });
        last.task = t1;
        log('Task open · ' + (t1 && t1.title) + ' · type claim', 'ok');
        preview('Work · task open');
      } catch (e) {
        log('Work · ' + (e.message || e), 'err');
      }
      return { ok: true, task: t1 };
    }

    // —— CLAIM ——
    if (/^claim\b/.test(low)) {
      phase = 'claim';
      log('── CLAIM ──', 'ok');
      meDriver();
      var task = null;
      try {
        var open = (global.SNTasks.list && SNTasks.list({ all: true })) || [];
        task =
          open.find(function (t) {
            return t && t.kind === 'delivery' && (t.status === 'open' || t.status === 'claimed');
          }) || last.task;
        if (!task) {
          log('No open delivery · type work or coffee first', 'dim');
          return { ok: false };
        }
        var c = SNTasks.claim(task.id);
        if (c && c.ok && c.task) {
          c.task.driverId = driver && driver.id;
          c.task.status = 'in_progress';
          last.task = c.task;
          log('Claimed · ' + (c.task.title || c.task.id), 'ok');
          if (global.SNField && SNField.startDeliveryRoute) {
            await SNField.startDeliveryRoute({
              id: 'live:' + c.task.id,
              vendorLat: c.task.lat,
              vendorLng: c.task.lng,
              dropLat: c.task.drop_lat != null ? c.task.drop_lat : driver.lat,
              dropLng: c.task.drop_lng != null ? c.task.drop_lng : driver.lng,
              label: '🛵 you',
              driver: (driver && driver.name) || 'Driver',
              color: 'rgba(0,200,255,0.95)',
            });
          }
          log('Route painted · type deliver when arrived', 'dim');
          preview('Claimed · en route');
          think('You claimed · polygon on map · camera still yours if held');
          return { ok: true, task: c.task };
        }
        log((c && c.error) || 'claim failed', 'err');
      } catch (e) {
        log('Claim · ' + (e.message || e), 'err');
      }
      return { ok: false };
    }

    // —— DELIVER / complete ——
    if (/^deliver\b|^complete\b|^arrive\b|^drop\b/.test(low)) {
      phase = 'deliver';
      log('── DELIVER ──', 'ok');
      meDriver();
      try {
        var t =
          last.task ||
          ((global.SNTasks.list &&
            SNTasks.list({ all: true }).find(function (x) {
              return x && (x.status === 'claimed' || x.status === 'in_progress');
            })) ||
            null);
        if (!t) {
          log('Nothing to deliver · claim first', 'dim');
          return { ok: false };
        }
        var done = SNTasks.complete(t.id);
        if (done && done.ok) {
          log('Delivered · ' + (t.title || t.id), 'ok');
          think('Delivery complete · 3% already on order if coffee path');
          preview('Delivered');
          return { ok: true };
        }
        log((done && done.error) || 'complete failed', 'err');
      } catch (e) {
        log('Deliver · ' + (e.message || e), 'err');
      }
      return { ok: false };
    }

    // —— OFFLINE / end shift ——
    if (/^offline\b|^end\s*shift\b|^clock\s*out\b/.test(low)) {
      phase = 'offline';
      meDriver();
      try {
        if (driver) {
          driver.driverOnline = false;
          SNProfiles.upsert(driver);
        }
      } catch (e) {}
      log('Driver OFFLINE · shift pause', 'ok');
      preview('Offline');
      return { ok: true };
    }

    // —— DATE / evening ——
    if (/^date\b|^dating\b|^evening\b|^walk\b/.test(low)) {
      phase = 'dating';
      log('── DATING ──', 'ok');
      think('Evening social · you dictated dating');
      meDriver();
      ensureDate();
      try {
        if (driver) {
          driver.driverOnline = false;
          SNProfiles.upsert(driver);
        }
      } catch (e) {}
      try {
        if (global.SNMarket && SNMarket.fulfillDatingIntent) {
          var dr = await SNMarket.fulfillDatingIntent(raw || 'date coffee walk Rhodes', {});
          log((dr && dr.reply) || 'Dating request open', 'ok');
        } else if (global.SNTasks && SNTasks.create) {
          SNTasks.create({
            kind: 'dating',
            role: 'coffee',
            title: '💕 Coffee walk · after shift · Rhodes',
            raw: 'date coffee',
            lat: RHODES.lat,
            lng: RHODES.lng,
            dur: '2h',
            always_on: true,
          });
          log('Dating task open · coffee walk', 'ok');
        }
        preview('Dating');
        return { ok: true };
      } catch (e2) {
        log('Dating · ' + (e2.message || e2), 'err');
      }
      return { ok: false };
    }

    // —— HELP for dictation ——
    if (/^help\s*sim\b|^sim\s*help\b|^dictat/.test(low)) {
      log('Dictate: wake · coffee · work · claim · deliver · offline · date', 'ok');
      log('sim / sim toggle · start or stop mode', 'dim');
      return { ok: true };
    }

    return { ok: false, unknown: true };
  }

  function status() {
    return {
      running: modeOn,
      mode: modeOn ? 'on' : 'off',
      phase: phase,
      focus: 'Rhodes',
      name: 'SNDriverDay',
      dictate: 'wake · coffee · work · claim · deliver · offline · date',
    };
  }

  // Aliases: start/stop/toggle = mode arming only (no auto script)
  global.SNDriverDay = {
    start: start,
    stop: stop,
    toggle: toggle,
    cmd: cmd,
    status: status,
    get running() {
      return modeOn;
    },
    get phase() {
      return phase;
    },
  };

  // Real sim handle
  global.SNSim = global.SNDriverDay;
})(typeof window !== 'undefined' ? window : globalThis);
