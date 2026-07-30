/**
 * SNDriverDay — one tight all-inclusive Rodos scenario (no token-burn swarm)
 *
 * Driver daily routine:
 *   1 WAKE     · morning · go driver online
 *   2 COFFEE   · order coffee · route vendor→you
 *   3 WORK     · claim/make deliveries · tasks · routes
 *   4 EVENING  · dating request · day complete
 *
 * CLI: day | driver day | day start | day stop
 * Camera: never thrash · no auto tiles · all story on main CLI
 */
(function (global) {
  'use strict';

  var RHODES = { lat: 36.4341, lng: 28.2176 };
  var running = false;
  var abort = false;
  var stepTimer = null;
  var phase = 'idle';

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
      if (global.SNFreeMind && SNFreeMind.think) SNFreeMind.think(m, 'day');
      else if (global.SNCli && SNCli.log) SNCli.log('🧠 ' + m, 'dim');
    } catch (e) {
      try {
        if (global.SNCli && SNCli.log) SNCli.log('🧠 ' + m, 'dim');
      } catch (e2) {}
    }
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      stepTimer = setTimeout(resolve, ms);
    });
  }

  function stopped() {
    return abort || !running;
  }

  function pos(hub) {
    var hubs = [
      { n: 'Old Town', lat: 36.4425, lng: 28.2272 },
      { n: 'Mandraki', lat: 36.4508, lng: 28.2265 },
      { n: 'Ixia', lat: 36.416, lng: 28.168 },
      { n: 'Faliraki', lat: 36.339, lng: 28.199 },
    ];
    var h = hubs[hub % hubs.length];
    return {
      lat: h.lat + (Math.random() - 0.5) * 0.008,
      lng: h.lng + (Math.random() - 0.5) * 0.008,
      name: h.n,
    };
  }

  function ensureCafe() {
    var p = pos(0);
    var id = 'day_cafe_rhodes';
    var cafe = null;
    try {
      cafe = global.SNProfiles.upsert({
        id: id,
        name: 'Mandraki Coffee',
        handle: '@mandrakicoffee',
        bio: '☕ Rodos morning coffee · SpaceNet 24/7',
        roles: { vendor: true, client: true, social: true },
        lat: p.lat,
        lng: p.lng,
        shopName: 'Mandraki Coffee',
        shopKind: 'cafe',
        sim: true,
        source: 'driver-day',
        menu: [
          { id: 'c1', name: 'Espresso', price: 2.5, desc: 'Morning shot' },
          { id: 'c2', name: 'Freddo cappuccino', price: 4.0, desc: 'Rodos classic' },
        ],
      });
      if (global.SNProfiles.setMenuItem) {
        global.SNProfiles.setMenuItem(id, {
          name: 'Espresso',
          price: 2.5,
          desc: 'Morning shot',
        });
        global.SNProfiles.setMenuItem(id, {
          name: 'Freddo cappuccino',
          price: 4.0,
          desc: 'Rodos classic',
        });
        cafe = global.SNProfiles.get(id) || cafe;
      }
    } catch (e) {}
    return cafe || global.SNProfiles.get(id);
  }

  function ensureDriver() {
    var p = pos(1);
    var id = 'day_driver_me';
    try {
      var d = global.SNProfiles.upsert({
        id: id,
        name: 'Driver · Rodos',
        handle: '@driver_rodos',
        bio: '🛵 Delivery driver · Rhodes daily routine',
        roles: { driver: true, client: true, dating: true, social: true, worker: true },
        lat: p.lat,
        lng: p.lng,
        vehicle: 'Scooter',
        driverOnline: true,
        lookingFor: 'Coffee · walk · real talk after shift',
        sim: true,
        source: 'driver-day',
      });
      if (global.SNProfiles.setMe) SNProfiles.setMe(id);
      return d;
    } catch (e) {
      return null;
    }
  }

  function ensureClientDrop() {
    var p = pos(2);
    var id = 'day_client_drop';
    try {
      return global.SNProfiles.upsert({
        id: id,
        name: 'Client · Ixia',
        handle: '@client_ixia',
        bio: 'Waiting for delivery',
        roles: { client: true, social: true },
        lat: p.lat,
        lng: p.lng,
        sim: true,
        source: 'driver-day',
      });
    } catch (e) {
      return { id: id, lat: p.lat, lng: p.lng, name: 'Client' };
    }
  }

  function ensureDateProfile() {
    var p = pos(3);
    var id = 'day_date_faliraki';
    try {
      return global.SNProfiles.upsert({
        id: id,
        name: 'Alex · Faliraki',
        handle: '@alex_fali',
        bio: 'Evening walk · coffee · honest talk',
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

  async function phaseWake(driver) {
    phase = 'wake';
    log('── DAY 1/4 · WAKE · Rhodes morning ──', 'ok');
    think('Driver wakes on Rhodes · shift ahead · coffee then deliveries then maybe date');
    preview('Day · wake');
    try {
      if (global.SNMap && SNMap.open) {
        void SNMap.open(RHODES.lat, RHODES.lng, { force: false });
      }
    } catch (e) {}
    try {
      if (global.SNMarket && SNMarket.goDriverOnline) {
        SNMarket.goDriverOnline(driver.vehicle || 'Scooter');
      } else if (driver) {
        driver.driverOnline = true;
        driver.roles = driver.roles || {};
        driver.roles.driver = true;
        global.SNProfiles.upsert(driver);
      }
    } catch (e2) {}
    log('Driver ONLINE · scooter · ready for Rodos streets', 'ok');
    think('Online as driver · no thrash camera · user may observe any spot');
    await sleep(4500);
  }

  async function phaseCoffee(driver, cafe) {
    phase = 'coffee';
    log('── DAY 2/4 · COFFEE · order morning fuel ──', 'ok');
    think('Order coffee from Mandraki · self as client · then ride the route');
    preview('Day · coffee');
    if (!cafe || !cafe.menu || !cafe.menu.length) {
      log('Coffee shop missing · skip order', 'dim');
      return null;
    }
    try {
      if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 20) {
        SNCurrency.credit(50, 'day start wallet');
      }
    } catch (e) {}
    var ord = null;
    try {
      if (global.SNProfiles.setMe) SNProfiles.setMe(driver.id);
      global._snLastPos = { lat: driver.lat, lng: driver.lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(driver.lat, driver.lng);
      SNProfiles.cartClear && SNProfiles.cartClear();
      var item =
        (cafe.menu || []).find(function (m) {
          return /freddo|cappuccino|coffee|espresso/i.test(m.name || '');
        }) || cafe.menu[0];
      SNProfiles.cartAdd(cafe.id, item, 1);
      ord = SNProfiles.placeOrder();
      if (ord && ord.ok) {
        log(
          'Coffee ordered · ' +
            item.name +
            ' · ' +
            (global.SNCurrency && SNCurrency.format
              ? SNCurrency.format(ord.total)
              : ord.total + ' S'),
          'ok'
        );
        think('Coffee task live · vendor→me polygon · 3% vault tick');
      } else {
        log((ord && ord.error) || 'coffee order failed', 'err');
      }
    } catch (e2) {
      log('Coffee · ' + (e2.message || e2), 'err');
    }
    await sleep(6000);
    // Claim own coffee delivery as driver (self-loop day path)
    if (ord && ord.task && global.SNTasks) {
      try {
        if (global.SNProfiles.setMe) SNProfiles.setMe(driver.id);
        var c = SNTasks.claim(ord.task.id);
        if (c && c.ok && c.task) {
          c.task.driverId = driver.id;
          c.task.status = 'in_progress';
          if (global.SNField && SNField.startDeliveryRoute) {
            await SNField.startDeliveryRoute({
              id: 'live:coffee:' + c.task.id,
              vendorLat: cafe.lat,
              vendorLng: cafe.lng,
              dropLat: driver.lat,
              dropLng: driver.lng,
              label: '☕ coffee',
              driver: driver.name,
              color: 'rgba(255,180,80,0.95)',
              onArrive: function () {
                try {
                  SNTasks.complete(c.task.id);
                  log('Coffee in hand · fuel for the shift', 'ok');
                  think('Morning coffee delivered · ready for work tasks');
                } catch (e3) {}
              },
            });
          }
          log('Driving for coffee · route on map · ETA on radar/CLI', 'ok');
        }
      } catch (e4) {}
    }
    await sleep(8000);
    return ord;
  }

  async function phaseWork(driver, client) {
    phase = 'work';
    log('── DAY 3/4 · WORK · deliveries on Rodos ──', 'ok');
    think('Shift peak · claim deliveries · polygons stay even if camera held');
    preview('Day · work');

    // Seed 2–3 delivery tasks for the day
    var jobs = [
      { title: '📦 Parcel · Old Town → Ixia', from: pos(0), to: pos(2) },
      { title: '📦 Food bag · Mandraki → Faliraki', from: pos(1), to: pos(3) },
      { title: '📦 Docs · Airport side → New Market', from: pos(0), to: pos(1) },
    ];
    var i;
    for (i = 0; i < jobs.length; i++) {
      if (stopped()) return;
      var j = jobs[i];
      try {
        var t = global.SNTasks.create({
          kind: 'delivery',
          role: 'driver',
          title: j.title,
          raw: 'delivery ' + j.title,
          lat: j.from.lat,
          lng: j.from.lng,
          drop_lat: j.to.lat,
          drop_lng: j.to.lng,
          dur: '45m',
          always_on: true,
          total_s: 8 + i * 2,
          driver_s: 1.5,
        });
        log('Task open · ' + j.title + ' · ' + j.from.name + ' → drop', 'ok');
        think('New delivery task · claim when ready · route will paint');
        // Claim and drive
        if (t && global.SNTasks.claim) {
          if (global.SNProfiles.setMe) SNProfiles.setMe(driver.id);
          var cl = SNTasks.claim(t.id);
          if (cl && cl.ok && cl.task) {
            cl.task.driverId = driver.id;
            cl.task.status = 'in_progress';
            if (global.SNField && SNField.startDeliveryRoute) {
              await SNField.startDeliveryRoute({
                id: 'live:work:' + t.id,
                vendorLat: j.from.lat,
                vendorLng: j.from.lng,
                dropLat: j.to.lat,
                dropLng: j.to.lng,
                label: '🛵 job ' + (i + 1),
                driver: driver.name,
                color: 'rgba(0,200,255,0.95)',
                onArrive: function () {
                  try {
                    SNTasks.complete(t.id);
                    log('Delivered · ' + j.title, 'ok');
                    think('Job done · next task or wind down toward evening');
                  } catch (eA) {}
                },
              });
            }
            log('En route · ' + j.title + ' · ETA on map polyline', 'ok');
          }
        }
      } catch (e) {
        log('Work task · ' + (e.message || e), 'err');
      }
      await sleep(7000);
    }

    // Also post a worker-style gig for the day log
    try {
      if (global.SNTasks && SNTasks.create) {
        SNTasks.create({
          kind: 'job',
          role: 'barman',
          title: '💼 Evening barman shift · Mandraki (optional)',
          raw: 'job barman 3h Rhodes',
          lat: RHODES.lat,
          lng: RHODES.lng,
          dur: '3h',
        });
        log('Optional job posted · barman 3h · still on board if wanted', 'dim');
      }
    } catch (eJ) {}

    await sleep(4000);
  }

  async function phaseDating(driver, dateP) {
    phase = 'dating';
    log('── DAY 4/4 · EVENING · dating after shift ──', 'ok');
    think('Shift done · go offline · open dating · honest evening plan');
    preview('Day · dating');
    try {
      if (driver) {
        driver.driverOnline = false;
        global.SNProfiles.upsert(driver);
        log('Driver OFFLINE · shift complete', 'ok');
      }
    } catch (e) {}

    try {
      if (global.SNProfiles.setMe) SNProfiles.setMe(driver.id);
      if (global.SNMarket && SNMarket.fulfillDatingIntent) {
        var dr = await SNMarket.fulfillDatingIntent('date coffee walk Rhodes evening', {});
        log((dr && dr.reply) || 'Dating path ran', 'ok');
        think('Dating request · evening social · day arc complete');
      } else if (global.SNTasks && SNTasks.create) {
        SNTasks.create({
          kind: 'dating',
          role: 'coffee',
          title:
            '💕 Coffee walk · ' +
            ((dateP && dateP.name) || 'someone') +
            ' · after deliveries',
          raw: 'date coffee',
          lat: (dateP && dateP.lat) || RHODES.lat,
          lng: (dateP && dateP.lng) || RHODES.lng,
          dur: '2h',
          always_on: true,
        });
        log('Dating task open · coffee walk after work', 'ok');
      }
    } catch (e2) {
      log('Dating · ' + (e2.message || e2), 'err');
    }

    await sleep(3500);
    log('── DAY COMPLETE · wake · coffee · work · dating ──', 'ok');
    think('Full driver day on Rodos closed · vault + routes + tasks exercised');
    preview('Day complete');
    try {
      if (global.SNUsage && SNUsage.track) {
        SNUsage.track('driver_day_complete', { focus: 'Rhodes' });
      }
      if (global.SNFreeMind && SNFreeMind.teach) {
        SNFreeMind.teach(
          'driver day Rhodes',
          'Wake · go online · order coffee · claim deliveries with routes · offline · dating'
        );
      }
    } catch (e3) {}
  }

  async function runDay() {
    if (running) {
      log('Driver day already running · day stop to abort', 'dim');
      return status();
    }
    // Kill continuous swarm burn
    try {
      if (global.SNSim33 && SNSim33.running && SNSim33.stop) SNSim33.stop();
      localStorage.setItem('sn:sim-auto', '0');
    } catch (e) {}

    running = true;
    abort = false;
    log('── DRIVER DAY · RODOS · tight loop (not 33-swarm) ──', 'ok');
    log('Phases: wake → coffee → work deliveries → evening dating', 'dim');
    log('Camera: your drag holds view · routes still paint · no auto tiles', 'dim');

    var driver = ensureDriver();
    var cafe = ensureCafe();
    var client = ensureClientDrop();
    var dateP = ensureDateProfile();

    try {
      if (!stopped()) await phaseWake(driver);
      if (!stopped()) await phaseCoffee(driver, cafe);
      if (!stopped()) await phaseWork(driver, client);
      if (!stopped()) await phaseDating(driver, dateP);
    } catch (e) {
      log('Day error · ' + (e.message || e), 'err');
    }

    running = false;
    phase = 'idle';
    if (abort) {
      log('── DAY STOPPED ──', 'dim');
      preview('Day stopped');
    }
    return status();
  }

  function stopDay() {
    abort = true;
    running = false;
    if (stepTimer) {
      clearTimeout(stepTimer);
      stepTimer = null;
    }
    phase = 'idle';
    log('Driver day aborted', 'dim');
    preview('Day stop');
  }

  function status() {
    return {
      running: running,
      phase: phase,
      focus: 'Rhodes',
      name: 'SNDriverDay',
    };
  }

  // Kill auto sim burn on load
  try {
    localStorage.setItem('sn:sim-auto', '0');
  } catch (e) {}

  global.SNDriverDay = {
    start: runDay,
    stop: stopDay,
    status: status,
    get running() {
      return running;
    },
    get phase() {
      return phase;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
