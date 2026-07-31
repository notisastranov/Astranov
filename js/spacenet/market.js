/* SNMarket — first vendor listing + first self-delivery (real path, zero NPC)
 * Coached by SpaceNet AI · chat steps · CLI: list shop · menu add · first delivery
 */
(function (global) {
  'use strict';

  var WIZ_KEY = 'sn:market-wiz-v1';
  var W = { step: 'idle', shopName: '', lastItem: null };

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(WIZ_KEY) || '{}');
      if (raw && raw.step) W = Object.assign(W, raw);
    } catch (_) {}
  }

  function save() {
    try {
      localStorage.setItem(WIZ_KEY, JSON.stringify(W));
    } catch (_) {}
  }

  function track(n, p) {
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track(n, p || {});
    } catch (_) {}
  }

  function say(msg, cls) {
    try {
      if (global.SNAi && SNAi.say) SNAi.say(msg, cls || 'ok');
      else if (global.SNCli && SNCli.log) SNCli.log(msg, cls || 'ok');
    } catch (_) {}
  }

  function pos() {
    return (
      global._snLastPos ||
      global.SNTasks?.pos ||
      global.SNGlobe?.focusPos?.() || { lat: 36.4341, lng: 28.2176 }
    );
  }

  function me() {
    return global.SNProfiles?.me?.() || null;
  }

  /** List my shop at current focus — real user vendor tile */
  function listShop(name, kind) {
    var p = me();
    if (!p || !global.SNProfiles) return { ok: false, error: 'profiles offline' };
    var shop = String(name || p.shopName || p.name || 'My shop').slice(0, 80);
    var k = String(kind || p.shopKind || 'shop').slice(0, 40);
    var loc = pos();
    if (!p.roles) p.roles = {};
    p.roles.vendor = true;
    p.roles.client = true;
    p.shopName = shop;
    p.shopKind = k;
    p.name = p.name || shop;
    p.lat = loc.lat != null ? Number(loc.lat) : p.lat;
    p.lng = loc.lng != null ? Number(loc.lng) : p.lng;
    if (!Array.isArray(p.menu)) p.menu = [];
    p.bio = '🏪 ' + shop + ' · listed on SpaceNet · 24/7 marketplace';
    p.updated = Date.now();
    global.SNProfiles.upsert(p);
    try {
      global.SNMap?.showProfiles?.();
      // Do NOT auto-open full tile over CLI (SPECS: no bury controls)
    } catch (_) {}
    W.shopName = shop;
    W.step = p.menu.length ? 'ready_order' : 'need_menu';
    save();
    track('vendor_list', { shop: shop, kind: k, lat: p.lat, lng: p.lng });
    return { ok: true, profile: p, shop: shop, menuCount: p.menu.length };
  }

  /** Add one real menu line in S */
  function addMenuItem(name, price) {
    var p = me();
    if (!p) return { ok: false, error: 'no me' };
    if (!p.roles?.vendor) {
      var lr = listShop(p.shopName || p.name, p.shopKind);
      if (!lr.ok) return lr;
      p = me();
    }
    var n = String(name || '').trim().slice(0, 80);
    var pr = Number(price);
    if (!n) return { ok: false, error: 'need item name' };
    if (!isFinite(pr) || pr < 0) pr = 0;
    var item = global.SNProfiles.setMenuItem(p.id, {
      name: n,
      price: pr,
      desc: 'Listed in S · SpaceNet',
    });
    W.lastItem = { name: n, price: pr };
    W.step = 'ready_order';
    save();
    track('menu_add', { name: n, price: pr });
    try {
      global.SNMap?.showProfiles?.();
    } catch (_) {}
    return { ok: true, item: item, menu: (me() && me().menu) || [] };
  }

  /** Client buys from own shop (first loop) — cart + place order */
  function orderFromMyShop(qty) {
    var p = me();
    if (!p || !p.roles?.vendor) return { ok: false, error: 'list shop first' };
    if (!p.menu || !p.menu.length) return { ok: false, error: 'add menu item first' };
    var item = p.menu[0];
    global.SNProfiles.cartClear();
    global.SNProfiles.cartAdd(p.id, item, qty || 1);
    // Drop to me (client)
    var loc = pos();
    p.roles.client = true;
    if (p.lat == null) {
      p.lat = loc.lat;
      p.lng = loc.lng;
      global.SNProfiles.upsert(p);
    }
    var r = global.SNProfiles.placeOrder();
    if (r && r.ok) {
      track('order_place', {
        total: r.total,
        vendorId: r.vendorId,
        taskId: r.task && r.task.id,
        self: true,
      });
      W.step = 'need_driver';
      save();
      try {
        global.SNMap?.open?.(loc.lat, loc.lng);
        global.SNMap?.showTasks?.();
        global.SNMap?.showProfiles?.();
      } catch (_) {}
    }
    return r || { ok: false, error: 'order failed' };
  }

  /** Same user goes driver online — real capability, not NPC */
  function goDriverOnline(vehicle) {
    var p = me();
    if (!p) return { ok: false, error: 'no me' };
    p.roles = p.roles || {};
    p.roles.driver = true;
    p.driverOnline = true;
    p.vehicle = String(vehicle || p.vehicle || 'Scooter').slice(0, 40);
    var loc = pos();
    if (p.lat == null) {
      p.lat = loc.lat;
      p.lng = loc.lng;
    }
    global.SNProfiles.upsert(p);
    track('driver_online', { vehicle: p.vehicle });
    try {
      global.SNMap?.showProfiles?.();
    } catch (_) {}
    W.step = 'claim';
    save();
    return { ok: true, profile: p };
  }

  /** Claim open delivery + complete → first delivery done */
  function claimAndComplete() {
    var open =
      (global.SNTasks?.list?.({ kind: 'delivery' }) || []).filter(function (t) {
        return t.status === 'open';
      })[0] ||
      (global.SNTasks?.list?.() || []).filter(function (t) {
        return t.status === 'open' && t.kind === 'delivery';
      })[0];
    if (!open) {
      var any = (global.SNTasks?.list?.({ all: true }) || []).find(function (t) {
        return t.kind === 'delivery' && (t.status === 'open' || t.status === 'claimed');
      });
      open = any;
    }
    if (!open) return { ok: false, error: 'no delivery task — order first' };
    var p = me();
    var claim = global.SNTasks.claim(open.id);
    if (!claim.ok) return claim;
    if (claim.task) {
      claim.task.driverId = p && p.id;
      claim.task.status = 'in_progress';
    }
    var done = global.SNTasks.complete(claim.task.id);
    if (done.ok) {
      track('delivery_complete', { taskId: done.task && done.task.id, self: true });
      try {
        if (global.SNUsage && SNUsage.flag) SNUsage.flag('firstDeliveryDone', true);
        if (global.SNUsage && SNUsage.flag) SNUsage.flag('firstVendorListed', true);
      } catch (_) {}
      W.step = 'done';
      save();
      // Small driver tip credit in S (honest self-loop reward)
      try {
        var tip = (done.task && done.task.driver_s) || 0;
        if (tip > 0 && global.SNCurrency && SNCurrency.credit) {
          SNCurrency.credit(tip, 'driver delivery');
        }
      } catch (_) {}
    }
    return { ok: !!(done && done.ok), claim: claim, complete: done, task: done && done.task };
  }

  /**
   * Full first painful path: list → menu → order → drive → deliver to me.
   * Uses real user roles only (you are vendor + client + driver).
   */
  async function runFirstLoop(opts) {
    opts = opts || {};
    var shop = opts.shop || W.shopName || 'My Astranov Shop';
    var item = opts.item || 'House special';
    var price = opts.price != null ? opts.price : 5;
    try {
      global.speechSynthesis?.cancel?.();
      global.SNCli?.stopHandsfree?.('first-loop');
      global.SNTile?.minimize?.();
    } catch (_) {}
    say('First order · listing your shop…', 'dim');
    // Fast path: never block on GPS — use focus / last pos (2s max if locate asked)
    if (!opts.skipLocate && global.SNGlobe && SNGlobe.locate) {
      try {
        await Promise.race([
          SNGlobe.locate(),
          new Promise(function (r) {
            setTimeout(r, 1800);
          }),
        ]);
      } catch (_) {}
    }
    var listed = listShop(shop, opts.kind || 'cafe');
    if (!listed.ok) {
      say(listed.error || 'list shop failed', 'err');
      return listed;
    }
    try {
      if (global.SNTile && SNTile.offer) SNTile.offer(listed.profile || global.SNProfiles.me());
    } catch (_) {}
    say('Shop live: ' + listed.shop + ' · menu…', 'ok');
    var menu = addMenuItem(item, price);
    if (!menu.ok) {
      say(menu.error || 'menu failed', 'err');
      return menu;
    }
    say(
      'Menu · ' +
        item +
        ' · ' +
        (global.SNCurrency ? SNCurrency.format(price) : price + ' S') +
        ' · ordering as you…',
      'ok'
    );
    var ord = orderFromMyShop(1);
    if (!ord.ok) {
      say(ord.error || 'order failed', 'err');
      return ord;
    }
    say(
      'Order · ' +
        (global.SNCurrency ? SNCurrency.format(ord.total) : ord.total + ' S') +
        ' · driver online…',
      'ok'
    );
    goDriverOnline(opts.vehicle || 'Scooter');
    say('Claim + deliver to you…', 'dim');
    var del = claimAndComplete();
    if (del.ok) {
      say(
        'FIRST ORDER DONE · shop → menu → pay S → drive → you. Tap tile in feed · donate on for mesh S.',
        'ok'
      );
      track('first_loop_ok', { shop: shop, item: item, total: ord.total });
      try {
        if (ord.task && global.SNTaskBoard && SNTaskBoard.enrich && global.SNTile) {
          var en = SNTaskBoard.enrich(ord.task);
          if (en) SNTile.offer(en);
        } else if (global.SNTile && SNTile.openMe) {
          SNTile.openMe('cart');
        }
      } catch (_) {}
      try {
        if (global.SNUsage && SNUsage.flag) SNUsage.flag('firstDeliveryDone', true);
      } catch (_) {}
    } else {
      say('Delivery: ' + (del.error || 'claim failed') + ' · try claim · complete', 'err');
      track('first_loop_fail', { error: del.error });
    }
    return {
      ok: !!(del && del.ok),
      listed: listed,
      menu: menu,
      order: ord,
      delivery: del,
    };
  }

  /** Conversational coach — one step at a time for AI actLocal */
  function coachStatus() {
    var p = me();
    var flags = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
    return {
      step: W.step,
      shopName: W.shopName || (p && p.shopName) || '',
      isVendor: !!(p && p.roles && p.roles.vendor),
      menuCount: (p && p.menu && p.menu.length) || 0,
      driverOnline: !!(p && p.driverOnline),
      firstDeliveryDone: !!flags.firstDeliveryDone,
      firstVendorListed: !!flags.firstVendorListed,
      openDeliveries: (global.SNTasks?.list?.({ kind: 'delivery' }) || []).filter(function (t) {
        return t.status === 'open' || t.status === 'claimed';
      }).length,
    };
  }

  function coachStart() {
    W.step = 'ask_shop';
    save();
    track('coach_start', {});
    return {
      ok: true,
      reply:
        'First order — you only. Step 1: list shop My Cafe  (or say first delivery to auto-run all steps).',
    };
  }

  /**
   * Parse free chat into market actions. Returns { handled, reply, did }.
   */
  function handleChat(message) {
    var line = String(message || '').trim();
    var low = line.toLowerCase();
    var did = [];
    var st = coachStatus();

    if (
      /^(first\s*(delivery|loop|order)|list\s*my\s*shop|open\s*my\s*shop|become\s*vendor|πρώτη\s*παράδοση|μαγαζί\s*μου)/i.test(
        low
      ) ||
      low === 'first' ||
      low === 'coach'
    ) {
      if (/first\s*(delivery|loop)|πρώτη/.test(low) || /auto|run|go/.test(low)) {
        return { handled: true, async: true, action: 'runFirstLoop', did: did };
      }
      var c = coachStart();
      did.push('coach_start');
      return { handled: true, reply: c.reply, did: did };
    }

    // list shop <name>
    var mList = line.match(/^list\s+shop\s+(.+)$/i) || line.match(/^shop\s+name\s+(.+)$/i);
    if (mList) {
      var r = listShop(mList[1].trim());
      did.push('list_shop');
      return {
        handled: true,
        reply: r.ok
          ? 'Shop live: ' +
            r.shop +
            ' at your target. Step 2: add a menu line — menu add Espresso 3.5  (price in S).'
          : r.error,
        did: did,
      };
    }

    // menu add Name price
    var mMenu =
      line.match(/^menu\s+add\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*s?$/i) ||
      line.match(/^add\s+item\s+(.+?)\s+(\d+(?:[.,]\d+)?)/i) ||
      line.match(/^item\s+(.+?)\s+@\s*(\d+(?:[.,]\d+)?)/i);
    if (mMenu) {
      var price = parseFloat(String(mMenu[2]).replace(',', '.'));
      var ar = addMenuItem(mMenu[1].trim(), price);
      did.push('menu_add');
      return {
        handled: true,
        reply: ar.ok
          ? 'Menu: ' +
            mMenu[1].trim() +
            ' · ' +
            (global.SNCurrency ? SNCurrency.format(price) : price + ' S') +
            '. Step 3: type order me  (buy from your shop as client).'
          : ar.error,
        did: did,
      };
    }

    if (/^order\s*me$|^order\s*self$|^buy\s*from\s*me$|^checkout\s*me$/i.test(low) || low === 'order my menu') {
      var o = orderFromMyShop(1);
      did.push('order_self');
      return {
        handled: true,
        reply: o.ok
          ? 'Order ' +
            (global.SNCurrency ? SNCurrency.format(o.total) : o.total + ' S') +
            ' open for drivers. Step 4: type drive on  then deliver me'
          : o.error || 'order failed',
        did: did,
      };
    }

    if (/^drive\s*on$|^driver\s*on$|^go\s*online$|^online\s*driver$/i.test(low)) {
      var d = goDriverOnline();
      did.push('driver_on');
      return {
        handled: true,
        reply: d.ok
          ? 'You are ONLINE as driver. Step 5: type deliver me  (claim + complete to yourself).'
          : d.error,
        did: did,
      };
    }

    if (/^deliver\s*me$|^claim\s*and\s*deliver$|^complete\s*delivery$/i.test(low) || low === 'finish delivery') {
      var fin = claimAndComplete();
      did.push('deliver_me');
      return {
        handled: true,
        reply: fin.ok
          ? 'Delivered. First vendor → client → driver loop complete. Type usage for ship data. What hurt? Tell me — I queue a handoff for midnight Greek fix.'
          : fin.error || 'no open delivery',
        did: did,
      };
    }

    // Wizard nudges
    if (W.step === 'ask_shop' && line.length > 1 && line.length < 60 && !/^(hi|help)/i.test(low)) {
      var r2 = listShop(line);
      did.push('list_shop_wiz');
      return {
        handled: true,
        reply: r2.ok
          ? 'Listed “' + r2.shop + '”. Now: menu add <name> <priceS>  e.g. menu add Souvlaki 4.5'
          : r2.error,
        did: did,
      };
    }

    if (st.firstDeliveryDone && /pain|broken|fix|bug|handoff|improve/i.test(low)) {
      try {
        if (global.SNUsage && SNUsage.handoff) SNUsage.handoff(line, { source: 'chat' });
      } catch (_) {}
      did.push('handoff');
      return {
        handled: true,
        reply: 'Queued for the coding agent. At Athens midnight we ship one fix from usage + handoffs. Type usage export to copy the packet.',
        did: did,
      };
    }

    return { handled: false, reply: '', did: did, status: st };
  }

  /**
   * Food keywords → what to hunt on map / Overpass / crawl
   * "pizza" | "I want sushi" | "order coffee" | Greek equivalents
   */
  function parseFoodIntent(line) {
    var low = String(line || '')
      .toLowerCase()
      .trim();
    if (!low) return null;
    // Skip pure place navigation
    if (/^(go\s+to|fly|locate|mars|moon)/i.test(low)) return null;
    var map = [
      { re: /\b(pizza|πίτσα|πιτσα|pizzeria)\b/i, food: 'pizza', overpass: 'pizza restaurant' },
      { re: /\b(sushi|σούσι)\b/i, food: 'sushi', overpass: 'sushi restaurant' },
      { re: /\b(burger|μπέργκερ|hamburger)\b/i, food: 'burger', overpass: 'burger restaurant' },
      { re: /\b(coffee|cafe|καφέ|καφε|espresso)\b/i, food: 'coffee', overpass: 'cafe coffee' },
      { re: /\b(souvlaki|σουβλάκι|gyro|γύρο)\b/i, food: 'souvlaki', overpass: 'fast_food souvlaki' },
      { re: /\b(kebab|kebap|döner|ντονέρ)\b/i, food: 'kebab', overpass: 'kebab restaurant' },
      { re: /\b(pasta|italian|ιταλικ)\b/i, food: 'pasta', overpass: 'italian restaurant' },
      { re: /\b(chinese|κινέζικ)\b/i, food: 'chinese', overpass: 'chinese restaurant' },
      { re: /\b(food|φαγητ|delivery|παράδοση|πεινάω|hungry|eat)\b/i, food: 'food', overpass: 'restaurant food' },
    ];
    for (var i = 0; i < map.length; i++) {
      if (map[i].re.test(low)) {
        return {
          food: map[i].food,
          overpass: map[i].overpass,
          raw: line,
          // Auto-order only on explicit buy words — browse is default (AI shows tile · next · show all)
          autoOrder: /\b(order|order\s+me|bring|get\s+me|παράγγειλ|παράγγειλε)\b/i.test(low),
        };
      }
    }
    return null;
  }

  function haversineKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return 99;
    var R = 6371;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  function defaultFoodPrice(food) {
    var f = String(food || 'food').toLowerCase();
    if (f === 'coffee') return 3.5;
    if (f === 'pizza') return 11;
    if (f === 'sushi') return 14;
    if (f === 'burger') return 9;
    if (f === 'souvlaki' || f === 'kebab') return 6.5;
    return 10;
  }

  function scoreVendor(v, pos, food) {
    var score = 0;
    var name = String(v.shopName || v.name || '').toLowerCase();
    var kind = String(v.shopKind || '').toLowerCase();
    var f = String(food || '').toLowerCase();
    if (name.indexOf(f) >= 0) score += 40;
    if (kind.indexOf(f) >= 0 || kind.indexOf('restaurant') >= 0 || kind.indexOf('pizza') >= 0 || kind.indexOf('cafe') >= 0)
      score += 15;
    if (v.real) score += 10;
    if (v.menu && v.menu.length) score += 12 + Math.min(8, v.menu.length);
    var km = haversineKm(pos, v);
    score += Math.max(0, 25 - km * 8);
    if (v.rating != null) score += Math.min(10, Number(v.rating));
    // Prefer open-looking (we don't always have hours — slight boost if delivery enabled)
    if (v.delivery_enabled !== false) score += 5;
    return { score: score, km: km };
  }

  function ensureFoodMenu(vendor, food) {
    if (!vendor || !global.SNProfiles) return vendor;
    var menu = vendor.menu || [];
    var f = String(food || 'Food');
    var has = menu.some(function (m) {
      return String(m.name || '')
        .toLowerCase()
        .indexOf(f.toLowerCase()) >= 0;
    });
    if (!has) {
      // User-requested line item on a real place (not NPC shop invent) — honest custom order in S
      global.SNProfiles.setMenuItem(vendor.id, {
        name: f.charAt(0).toUpperCase() + f.slice(1),
        price: defaultFoodPrice(food),
        desc: 'Ordered via SpaceNet AI · pay in S · confirm with kitchen',
      });
      vendor = global.SNProfiles.get(vendor.id) || vendor;
    }
    return vendor;
  }

  function pickMenuItem(vendor, food) {
    var menu = (vendor && vendor.menu) || [];
    var f = String(food || '').toLowerCase();
    var hit = menu.find(function (m) {
      return String(m.name || '')
        .toLowerCase()
        .indexOf(f) >= 0;
    });
    return hit || menu[0] || null;
  }

  /**
   * Full juice path for "pizza" / "order sushi" / "I want coffee":
   * locate → find open places → vendor tiles + menus/prices → judge → order → assign driver
   */
  async function fulfillFoodIntent(query, opts) {
    opts = opts || {};
    var quiet = opts.quiet === true;
    var intent = typeof query === 'object' ? query : parseFoodIntent(query);
    if (!intent) return { ok: false, error: 'not a food intent' };
    var food = intent.food || 'food';
    var log = function (m, c) {
      if (quiet) return;
      try {
        if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
      } catch (_) {}
    };
    var steps = [];

    // 1) Prefer globe/city focus (dive place) — locate only if none
    log('1/6 · Locating you…', 'dim');
    var pos = null;
    try {
      if (global.SNGlobe && SNGlobe.focusPos) {
        var fp = SNGlobe.focusPos();
        if (fp && fp.lat != null) pos = { lat: fp.lat, lng: fp.lng };
      }
    } catch (_) {}
    if (!pos || pos.lat == null) {
      pos = global._snLastPos || (global.SNTasks && SNTasks.pos) || null;
    }
    if (!pos || pos.lat == null) {
      try {
        if (global.SNGlobe && SNGlobe.locate) pos = await SNGlobe.locate();
      } catch (_) {}
    }
    if (!pos || pos.lat == null) {
      pos = { lat: 36.4341, lng: 28.2176 };
      log('GPS soft · using default focus', 'dim');
    } else {
      log('Focus · ' + pos.lat.toFixed(3) + ', ' + pos.lng.toFixed(3), 'dim');
    }
    global._snLastPos = { lat: pos.lat, lng: pos.lng };
    try {
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(pos.lat, pos.lng);
    } catch (_) {}
    steps.push('locate');

    // 2) Find pizza (etc.) places — Overpass + sector DB
    log('2/6 · Finding ' + food + ' places near you…', 'dim');
    var pois = [];
    try {
      if (global.SNSearch && SNSearch.nearby) {
        pois = (await SNSearch.nearby(pos.lat, pos.lng, 3500, intent.overpass || food)) || [];
      }
    } catch (_) {}
    try {
      if (global.SNCommerce && SNCommerce.ensureSector) {
        await SNCommerce.ensureSector(pos.lat, pos.lng, { openMap: true });
      }
    } catch (_) {}
    // Paint crawl places as vendor tiles
    (pois || []).slice(0, 24).forEach(function (p) {
      if (p.lat == null) return;
      try {
        global.SNProfiles.fromCrawlPlace(
          {
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            kind: p.kind || food,
            real: true,
            source: p.source || 'overpass',
          },
          pos
        );
      } catch (_) {}
    });
    steps.push('find');

    // 3) Collect + show vendor tiles
    log('3/6 · Building vendor tiles · menus · prices in S…', 'dim');
    var vendors = (global.SNProfiles.list({ role: 'vendor' }) || []).filter(function (v) {
      if (v.lat == null) return false;
      var km = haversineKm(pos, v);
      if (km > 8) return false;
      var blob = (v.shopName || '') + ' ' + (v.name || '') + ' ' + (v.shopKind || '');
      if (food === 'food') return true;
      return (
        blob.toLowerCase().indexOf(food) >= 0 ||
        km < 2.5 ||
        (pois || []).some(function (p) {
          return p.name && v.name && p.name.indexOf(v.name.slice(0, 8)) >= 0;
        })
      );
    });
    // If filter too tight, fall back to nearest vendors
    if (vendors.length < 2) {
      vendors = (global.SNProfiles.list({ role: 'vendor' }) || [])
        .filter(function (v) {
          return v.lat != null && haversineKm(pos, v) < 6;
        })
        .slice(0, 12);
    }
    vendors = vendors.map(function (v) {
      v = ensureFoodMenu(v, food);
      var sc = scoreVendor(v, pos, food);
      return Object.assign({}, v, { _score: sc.score, _km: sc.km });
    });
    vendors.sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });
    vendors = vendors.slice(0, 8);
    try {
      if (global.SNMap && SNMap.showProfiles) SNMap.showProfiles();
      if (global.SNField && SNField.refreshBlips) SNField.refreshBlips();
    } catch (_) {}
    steps.push('tiles');

    // 4) Judge
    log('4/6 · Judging vendors…', 'ok');
    var lines = [];
    vendors.forEach(function (v, idx) {
      var item = pickMenuItem(v, food);
      var price = item
        ? global.SNCurrency
          ? SNCurrency.format(item.price)
          : item.price + ' S'
        : '—';
      var line =
        idx +
        1 +
        '. ' +
        (v.shopName || v.name) +
        ' · ' +
        (v._km != null ? v._km.toFixed(1) + ' km' : '?') +
        ' · score ' +
        Math.round(v._score || 0) +
        ' · ' +
        (item ? item.name + ' ' + price : 'no menu');
      lines.push(line);
      log(line, idx === 0 ? 'ok' : 'dim');
    });
    if (!vendors.length) {
      return {
        ok: false,
        error: 'No ' + food + ' vendors near you · try fly another city or long-press to list your shop',
        steps: steps,
        pos: pos,
      };
    }
    steps.push('judge');
    var best = vendors[0];
    best = ensureFoodMenu(best, food);
    var menuItem = pickMenuItem(best, food);
    try {
      // Never auto-open vendor tile — user taps map target
      if (global.SNGlobe && SNGlobe.goToPlace && best.lat != null) {
        SNGlobe.goToPlace(best.lat, best.lng, {
          tier: 'city',
          body: 'earth',
          pulse: false,
          openMap: false,
          label: best.shopName || best.name,
        });
      }
      if (global.SNMap && SNMap.open && best.lat != null) {
        if (SNMap.active && SNMap.ensure) {
          void SNMap.ensure().then(function (map) {
            try {
              map.setView([best.lat, best.lng], map.getZoom() || 14);
            } catch (e) {}
          });
        }
      }
    } catch (_) {}

    // 5) Order (auto when intent is order-like or single food word)
    var orderResult = null;
    if (opts.autoOrder !== false && intent.autoOrder !== false && menuItem) {
      log('5/6 · Ordering from ' + (best.shopName || best.name) + '…', 'ok');
      try {
        global.SNProfiles.cartClear();
        global.SNProfiles.cartAdd(best.id, menuItem, 1);
        orderResult = global.SNProfiles.placeOrder();
        if (orderResult && orderResult.ok) {
          log(
            'Order placed · ' +
              (global.SNCurrency ? SNCurrency.format(orderResult.total) : orderResult.total + ' S'),
            'ok'
          );
          steps.push('order');
        } else {
          log((orderResult && orderResult.error) || 'order failed', 'err');
        }
      } catch (e) {
        log('Order error · ' + (e.message || e), 'err');
      }
    } else {
      log('5/6 · Best pick open · say order me or + on menu to buy', 'dim');
    }

    // 6) Assign driver from available online, else you go online
    var driver = null;
    var claim = null;
    if (orderResult && orderResult.ok && orderResult.task) {
      log('6/6 · Assigning driver…', 'dim');
      var drivers = (global.SNProfiles.list({ role: 'driver' }) || []).filter(function (d) {
        return d.driverOnline && d.id !== (global.SNProfiles.me() && global.SNProfiles.me().id);
      });
      // Prefer nearest online driver
      drivers.sort(function (a, b) {
        return haversineKm(pos, a) - haversineKm(pos, b);
      });
      if (drivers.length) {
        driver = drivers[0];
        try {
          claim = global.SNTasks.claim(orderResult.task.id);
          if (claim && claim.ok && claim.task) {
            claim.task.driverId = driver.id;
            claim.task.status = 'in_progress';
          }
          log('Driver · ' + driver.name + ' · claimed delivery', 'ok');
        } catch (_) {}
      } else {
        // Self as courier so path completes (real user, not NPC)
        goDriverOnline('Scooter');
        driver = global.SNProfiles.me();
        try {
          claim = global.SNTasks.claim(orderResult.task.id);
          log('No other drivers online · you are ONLINE as driver · claim ready', 'dim');
        } catch (_) {}
      }
      try {
        if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true);
        if (global.SNMap && SNMap.showTasks) SNMap.showTasks();
      } catch (_) {}
      steps.push('driver');
    }

    // Schedule check (hours / 24-7 marketplace law)
    var sched = verifySchedule(best);
    log(
      'Schedule · ' +
        (best.shopName || best.name) +
        ' · ' +
        sched.label +
        (sched.hours ? ' · ' + sched.hours : ''),
      sched.open ? 'ok' : 'dim'
    );
    steps.push('schedule');

    track('food_intent', {
      food: food,
      vendors: vendors.length,
      best: best && best.id,
      ordered: !!(orderResult && orderResult.ok),
      driver: driver && driver.id,
      schedule: sched.open,
    });

    var fmt = function (n) {
      return global.SNCurrency ? SNCurrency.format(n) : Number(n).toFixed(2) + ' S';
    };
    // Brief by default — AI presents on globe; user says next / show all
    var reply =
      (best.shopName || best.name || 'Shop') +
      (best._km != null ? ' · ' + best._km.toFixed(1) + ' km' : '') +
      (menuItem ? ' · ' + menuItem.name + ' ' + fmt(menuItem.price) : '') +
      ' · 1/' +
      vendors.length +
      (orderResult && orderResult.ok
        ? ' · ordered ' + fmt(orderResult.total)
        : ' · next | show all');

    // Register for AI carousel (next / show all)
    try {
      if (global.SNAi && SNAi.setSuggestList) {
        SNAi.setSuggestList(vendors, { query: food, idx: 0 });
      }
    } catch (_) {}

    return {
      ok: true,
      food: food,
      pos: pos,
      vendors: vendors,
      best: best,
      menuItem: menuItem,
      order: orderResult,
      driver: driver,
      claim: claim,
      schedule: sched,
      steps: steps,
      lines: lines,
      reply: reply,
    };
  }

  /** Working hours check — marketplace is 24/7; vendor hours are informational */
  function verifySchedule(profile) {
    var hours = String((profile && (profile.hours || profile.opening_hours)) || '').trim();
    if (!hours || /24\s*[\/7]|24h|always|open/i.test(hours)) {
      return {
        open: true,
        label: 'OPEN · SpaceNet 24/7',
        hours: hours || '24/7',
        alwaysOn: true,
      };
    }
    // Heuristic: if string contains "closed" alone, treat closed; else assume open for order path
    if (/^closed$/i.test(hours) || /\bpermanently closed\b/i.test(hours)) {
      return { open: false, label: 'CLOSED (listed hours)', hours: hours, alwaysOn: false };
    }
    return {
      open: true,
      label: 'HOURS · ' + hours.slice(0, 40),
      hours: hours,
      alwaysOn: false,
    };
  }

  function parseWorkIntent(line) {
    var low = String(line || '')
      .toLowerCase()
      .trim();
    if (!low) return null;
    if (/^(go\s+to|fly|locate|pizza|sushi)/i.test(low)) return null;
    var roles = [
      { re: /\b(barman|bartender|μπαρμαν|μπαρτέντερ)\b/i, role: 'barman', title: 'Barman / bartender' },
      { re: /\b(cleaner|καθαριστ)\b/i, role: 'cleaner', title: 'Cleaner' },
      { re: /\b(nanny|babysitter)\b/i, role: 'nanny', title: 'Nanny' },
      { re: /\b(waiter|σερβιτόρ)\b/i, role: 'waiter', title: 'Waiter' },
      { re: /\b(tutor|teacher|δάσκαλ)\b/i, role: 'tutor', title: 'Tutor' },
      { re: /\b(worker|handyman|gardener|cook|chef)\b/i, role: 'worker', title: 'Worker' },
    ];
    for (var i = 0; i < roles.length; i++) {
      if (roles[i].re.test(low) || new RegExp('job\\s+' + roles[i].role).test(low) || new RegExp('hire\\s+(a\\s+)?' + roles[i].role).test(low)) {
        var dm = low.match(/(\d+(?:\.\d+)?)\s*(h|hr|hours?|d|days?)\b/);
        return {
          role: roles[i].role,
          title: roles[i].title,
          dur: dm ? dm[1] + (dm[2][0] === 'd' ? 'd' : 'h') : '3h',
          raw: line,
          place: /villa|home|house|office/i.test(low) ? 'venue' : 'local',
        };
      }
    }
    if (/^job\b|^gig\b|^hire\b|looking\s+for\s+work|need\s+a\b/.test(low)) {
      return { role: 'worker', title: 'Job', dur: '3h', raw: line, place: 'local' };
    }
    return null;
  }

  function parseDatingIntent(line) {
    var low = String(line || '')
      .toLowerCase()
      .trim();
    if (!low) return null;
    if (!/\b(date|dating|date\s*me|coffee\s*date|dinner\s*date|meet\s*(a\s*)?(woman|man|girl|guy)|available\s*woman)\b/i.test(low) && low !== 'dating')
      return null;
    var gender =
      /\b(woman|girl|female|lady)\b/i.test(low) ? 'woman' : /\b(man|guy|male)\b/i.test(low) ? 'man' : null;
    var kind = /dinner/.test(low) ? 'dinner' : /walk/.test(low) ? 'walk' : 'coffee';
    return { kind: kind, gender: gender, raw: line };
  }

  function scoreWorker(p, pos, role) {
    var score = 0;
    var blob = (
      (p.name || '') +
      ' ' +
      (p.bio || '') +
      ' ' +
      (p.skills || '') +
      ' ' +
      (p.jobTitle || '') +
      ' ' +
      (p.workerRole || '')
    ).toLowerCase();
    if (blob.indexOf(String(role || '').toLowerCase()) >= 0) score += 40;
    if (p.roles && p.roles.worker) score += 25;
    if (p.workerOnline || p.available) score += 20;
    if (p.real) score += 8;
    var km = haversineKm(pos, p);
    score += Math.max(0, 20 - km * 5);
    if (p.rating != null) score += Math.min(10, Number(p.rating));
    return { score: score, km: km };
  }

  function scoreDating(p, pos, intent) {
    var score = 0;
    if (p.roles && p.roles.dating) score += 30;
    if (p.lookingFor) score += 12;
    if (p.available !== false) score += 10;
    if (intent && intent.gender) {
      var g = String(p.gender || p.sex || p.lookingAs || '').toLowerCase();
      if (g && g.indexOf(intent.gender[0]) >= 0) score += 25;
      // Prefer profiles that match requested gender when tagged; else keep list honest
    }
    var km = haversineKm(pos, p);
    score += Math.max(0, 18 - km * 4);
    if (p.real) score += 8;
    return { score: score, km: km };
  }

  /**
   * Work offer path: barman for villa · cleaner · etc.
   * Find best listed available worker → open tile → post working offer task.
   */
  async function fulfillWorkIntent(query, opts) {
    opts = opts || {};
    var intent = typeof query === 'object' ? query : parseWorkIntent(query);
    if (!intent) return { ok: false, error: 'not a work intent' };
    var log = function (m, c) {
      try {
        if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
      } catch (_) {}
      try {
        if (global.SNAi && SNAi.say) SNAi.say(m, c || 'dim');
      } catch (_) {}
    };
    var role = intent.role || 'worker';
    var loc = pos();
    try {
      if (global.SNGlobe && SNGlobe.focusPos) {
        var f = SNGlobe.focusPos();
        if (f && f.lat != null) loc = f;
      }
    } catch (_) {}
    log('Work · finding ' + role + ' near focus…', 'dim');
    try {
      if (global.SNCommerce && SNCommerce.ensureSector) {
        await SNCommerce.ensureSector(loc.lat, loc.lng, { openMap: true });
      } else if (global.SNMap && SNMap.open) {
        await SNMap.open(loc.lat, loc.lng);
      }
    } catch (_) {}

    var workers = (global.SNProfiles.list({ role: 'worker' }) || []).concat(
      (global.SNProfiles.list() || []).filter(function (p) {
        return p.roles && (p.roles.worker || p.roles.vendor) && p.id !== (me() && me().id);
      })
    );
    // Dedupe by id
    var seen = {};
    workers = workers.filter(function (p) {
      if (!p || !p.id || seen[p.id]) return false;
      seen[p.id] = true;
      return p.lat != null && haversineKm(loc, p) < 25;
    });
    workers = workers.map(function (p) {
      var sc = scoreWorker(p, loc, role);
      return Object.assign({}, p, { _score: sc.score, _km: sc.km });
    });
    workers.sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });
    workers = workers.slice(0, 8);
    try {
      global.SNMap?.showProfiles?.();
      global.SNMap?.showTasks?.();
    } catch (_) {}

    var best = workers[0] || null;
    var task = null;
    try {
      task = global.SNTasks.create({
        kind: 'job',
        role: role,
        title:
          '🧰 ' +
          (intent.title || role) +
          (best ? ' · ' + best.name : '') +
          ' · ' +
          (intent.dur || '3h'),
        dur: intent.dur || '3h',
        lat: loc.lat,
        lng: loc.lng,
        raw: intent.raw || role,
        clientId: me() && me().id,
        targetId: best && best.id,
        targetName: best && best.name,
        always_on: true,
      });
    } catch (_) {}

    if (best) {
      var sched = verifySchedule(best);
      log(
        'Best ' +
          role +
          ' · ' +
          best.name +
          (best._km != null ? ' · ' + best._km.toFixed(1) + ' km' : '') +
          ' · ' +
          sched.label,
        'ok'
      );
      // no auto tile open
    } else {
      log(
        'No listed ' +
          role +
          ' online yet · offer posted for real workers · enable Worker on ME tile to appear',
        'dim'
      );
    }
    try {
      global.SNMap?.showTasks?.();
    } catch (_) {}

    track('work_intent', { role: role, workers: workers.length, best: best && best.id });
    var reply = best
      ? 'Best available ' +
        role +
        ': ' +
        best.name +
        '. Working offer open · they can claim · ' +
        (intent.dur || '3h') +
        '. Schedule: ' +
        verifySchedule(best).label +
        '.'
      : 'Working offer for ' +
        role +
        ' posted at your place (' +
        (intent.dur || '3h') +
        '). No listed workers in sector yet — real users enable Worker on their tile.';

    return {
      ok: true,
      role: role,
      pos: loc,
      workers: workers,
      best: best,
      task: task,
      schedule: best ? verifySchedule(best) : { open: true, label: 'OFFER OPEN 24/7' },
      reply: reply,
    };
  }

  /**
   * Dating path: find available dating profiles → open tile → send dating request task.
   * Zero dummy — only real profiles with dating role.
   */
  async function fulfillDatingIntent(query, opts) {
    opts = opts || {};
    var intent = typeof query === 'object' ? query : parseDatingIntent(query);
    if (!intent) return { ok: false, error: 'not a dating intent' };
    var log = function (m, c) {
      try {
        if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
      } catch (_) {}
      try {
        if (global.SNAi && SNAi.say) SNAi.say(m, c || 'dim');
      } catch (_) {}
    };
    var loc = pos();
    try {
      if (global.SNGlobe && SNGlobe.focusPos) {
        var f = SNGlobe.focusPos();
        if (f && f.lat != null) loc = f;
      }
    } catch (_) {}
    log('Dating · searching available profiles near focus…', 'dim');
    try {
      if (global.SNCommerce && SNCommerce.ensureSector) {
        await SNCommerce.ensureSector(loc.lat, loc.lng, { openMap: true });
      } else if (global.SNMap && SNMap.open) {
        await SNMap.open(loc.lat, loc.lng);
      }
    } catch (_) {}

    var people = (global.SNProfiles.list({ role: 'dating' }) || []).filter(function (p) {
      return p && p.id !== (me() && me().id) && p.lat != null && haversineKm(loc, p) < 40;
    });
    people = people.map(function (p) {
      var sc = scoreDating(p, loc, intent);
      return Object.assign({}, p, { _score: sc.score, _km: sc.km });
    });
    people.sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });
    people = people.slice(0, 8);
    try {
      global.SNMap?.showProfiles?.();
    } catch (_) {}

    var best = people[0] || null;
    var task = null;
    try {
      task = global.SNTasks.create({
        kind: 'dating',
        role: intent.kind || 'coffee',
        title:
          '💕 ' +
          (intent.kind === 'dinner' ? 'Dinner' : intent.kind === 'walk' ? 'Walk' : 'Coffee') +
          ' date request' +
          (best ? ' · ' + best.name : ''),
        dur: intent.kind === 'dinner' ? '3h' : '1h',
        lat: best && best.lat != null ? best.lat : loc.lat,
        lng: best && best.lng != null ? best.lng : loc.lng,
        raw: intent.raw || 'date',
        clientId: me() && me().id,
        targetId: best && best.id,
        always_on: true,
      });
    } catch (_) {}

    if (best) {
      log(
        'Available · ' +
          best.name +
          (best._km != null ? ' · ' + best._km.toFixed(1) + ' km' : '') +
          ' · dating request sent',
        'ok'
      );
      // no auto tile open
    } else {
      log(
        'No dating profiles listed nearby · enable Dating on ME tile (real users only) · request still open on map',
        'dim'
      );
    }
    try {
      global.SNMap?.showTasks?.();
    } catch (_) {}

    track('dating_intent', { people: people.length, best: best && best.id, kind: intent.kind });
    var reply = best
      ? 'Found available profile: ' +
        best.name +
        '. Dating request open — they can accept from map/tasks. Coffee/walk/dinner via same tile.'
      : 'Dating request posted. No listed profiles in sector yet — real users enable Dating on their multi-tile.';

    return {
      ok: true,
      pos: loc,
      people: people,
      best: best,
      task: task,
      intent: intent,
      reply: reply,
    };
  }

  load();

  global.SNMarket = {
    listShop: listShop,
    addMenuItem: addMenuItem,
    orderFromMyShop: orderFromMyShop,
    goDriverOnline: goDriverOnline,
    claimAndComplete: claimAndComplete,
    runFirstLoop: runFirstLoop,
    coachStart: coachStart,
    coachStatus: coachStatus,
    handleChat: handleChat,
    parseFoodIntent: parseFoodIntent,
    fulfillFoodIntent: fulfillFoodIntent,
    parseWorkIntent: parseWorkIntent,
    fulfillWorkIntent: fulfillWorkIntent,
    parseDatingIntent: parseDatingIntent,
    fulfillDatingIntent: fulfillDatingIntent,
    verifySchedule: verifySchedule,
    get step() {
      return W.step;
    },
  };
})(window);
