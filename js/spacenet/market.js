/* SNMarket — first vendor listing + first self-delivery (real path, zero NPC)
 * Coached by Astranov AI · chat steps · CLI: list shop · menu add · first delivery
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
      global.SNTile?.open?.(p, { tab: 'menu' });
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
      global.SNTile?.open?.(me(), { tab: 'menu' });
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
      global.SNTile?.open?.(p, { tab: 'drive' });
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
    var shop = opts.shop || W.shopName || 'My SpaceNet Shop';
    var item = opts.item || 'House special';
    var price = opts.price != null ? opts.price : 5;
    say('First loop · listing your shop at current place…', 'dim');
    // Prefer GPS focus
    try {
      if (global.SNGlobe && SNGlobe.locate && !opts.skipLocate) {
        await SNGlobe.locate();
      }
    } catch (_) {}
    var listed = listShop(shop, opts.kind || 'cafe');
    if (!listed.ok) return listed;
    say('Shop listed: ' + listed.shop + ' · adding menu in S…', 'ok');
    var menu = addMenuItem(item, price);
    if (!menu.ok) return menu;
    say(
      'Menu: ' +
        item +
        ' · ' +
        (global.SNCurrency ? SNCurrency.format(price) : price + ' S') +
        ' · ordering as client…',
      'ok'
    );
    var ord = orderFromMyShop(1);
    if (!ord.ok) return ord;
    say(
      'Order placed · ' +
        (global.SNCurrency ? SNCurrency.format(ord.total) : ord.total + ' S') +
        ' · you go ONLINE as driver…',
      'ok'
    );
    goDriverOnline(opts.vehicle || 'Scooter');
    say('Claiming + completing delivery to you…', 'dim');
    var del = claimAndComplete();
    if (del.ok) {
      say(
        'First delivery DONE · vendor → order → driver → you. Marketplace path is live. Type usage for data.',
        'ok'
      );
      track('first_loop_ok', { shop: shop, item: item, total: ord.total });
    } else {
      say('Delivery step: ' + (del.error || 'claim failed') + ' · try: claim · complete', 'err');
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
        'First SpaceNet loop — real you only. Step 1: shop name? Reply like: list shop Rhodes Grill  (or first delivery to auto-run).',
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
            ' at your pin. Step 2: add a menu line — menu add Espresso 3.5  (price in S).'
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
    get step() {
      return W.step;
    },
  };
})(window);
