/**
 * SNOfferStack — overlay tiles for tasks + offers (delivery missing link)
 * Peek tiles float above globe/map. Never full-screen on first throw.
 * window.SNOfferStack
 */
(function (global) {
  'use strict';
  var MAX = 5, stack = [], root = null, CSS_ID = 'sn-offer-stack-css-v1';
  function log(m, c) { try { if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim'); } catch (_) {} }
  function esc(s) {
    return String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
  }
  function fmtPrice(n) {
    if (n == null || !isFinite(n)) return '';
    try { if (global.SNCurrency && SNCurrency.format) return SNCurrency.format(n); } catch (_) {}
    return Number(n).toFixed(2) + ' S';
  }
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent = [
      '#sn-offer-stack{position:fixed;right:10px;top:72px;z-index:140;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:min(280px,42vw);max-height:min(58vh,520px)}',
      '#sn-offer-stack .sn-offer{pointer-events:auto;position:relative;border-radius:14px;background:rgba(0,6,16,.94);border:1px solid rgba(61,158,255,.55);box-shadow:0 10px 28px rgba(0,0,0,.65),0 0 18px rgba(26,111,212,.28);color:#c8e4ff;padding:10px 12px;min-width:200px;cursor:pointer;touch-action:manipulation;animation:snOfferIn .28s ease-out}',
      '#sn-offer-stack .kind-task{border-color:rgba(0,221,136,.5)}',
      '#sn-offer-stack .kind-vendor{border-color:rgba(61,158,255,.6)}',
      '#sn-offer-stack .kind-driver{border-color:rgba(255,200,60,.45)}',
      '#sn-offer-stack .sn-offer-k{font:700 9px system-ui;letter-spacing:.12em;text-transform:uppercase;color:#3d9eff;margin-bottom:3px}',
      '#sn-offer-stack .kind-task .sn-offer-k{color:#6dffb0}',
      '#sn-offer-stack .kind-driver .sn-offer-k{color:#f5d76e}',
      '#sn-offer-stack .sn-offer-t{font:700 13px/1.25 system-ui;color:#e8f4ff}',
      '#sn-offer-stack .sn-offer-s{font:11px/1.35 system-ui;color:#7a9cc8;margin-top:2px}',
      '#sn-offer-stack .sn-offer-p{font:800 18px/1.1 ui-monospace,system-ui;color:#1a6fd4;text-shadow:0 0 12px rgba(26,111,212,.9);margin-top:6px}',
      '#sn-offer-stack .sn-offer-row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}',
      '#sn-offer-stack .sn-offer-btn{flex:1;min-width:64px;border-radius:9px;border:1px solid rgba(61,158,255,.45);background:rgba(26,111,212,.22);color:#e8f4ff;font:700 11px system-ui;padding:7px 8px;cursor:pointer}',
      '#sn-offer-stack .sn-offer-btn.primary{background:rgba(0,221,136,.22);border-color:rgba(0,221,136,.5);color:#6dffb0}',
      '#sn-offer-stack .sn-offer-x{position:absolute;top:6px;right:8px;border:0;background:transparent;color:#6a8aaa;font:700 16px/1 system-ui;cursor:pointer;padding:2px 6px}',
      '@keyframes snOfferIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}',
      '@media (max-width:420px){#sn-offer-stack{right:6px;left:6px;max-width:none;top:64px}}'
    ].join('');
    document.head.appendChild(st);
  }
  function ensureRoot() {
    ensureCss();
    if (root && document.body.contains(root)) return root;
    root = document.getElementById('sn-offer-stack');
    if (!root) {
      root = document.createElement('div');
      root.id = 'sn-offer-stack';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    return root;
  }
  function paint() {
    var el = ensureRoot();
    if (!stack.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = stack.map(function (o) {
      return '<div class="sn-offer kind-' + esc(o.kind || 'task') + '" data-oid="' + esc(o.id) + '">' +
        '<button type="button" class="sn-offer-x" data-dismiss="' + esc(o.id) + '" aria-label="Dismiss">×</button>' +
        '<div class="sn-offer-k">' + esc(o.kindLabel || o.kind || 'OFFER') + '</div>' +
        '<div class="sn-offer-t">' + esc(o.title) + '</div>' +
        (o.sub ? '<div class="sn-offer-s">' + esc(o.sub) + '</div>' : '') +
        (o.price ? '<div class="sn-offer-p">' + esc(String(o.price)) + '</div>' : '') +
        '<div class="sn-offer-row">' +
        (o.primary ? '<button type="button" class="sn-offer-btn primary" data-act="primary" data-oid="' + esc(o.id) + '">' + esc(o.primary) + '</button>' : '') +
        (o.secondary ? '<button type="button" class="sn-offer-btn" data-act="secondary" data-oid="' + esc(o.id) + '">' + esc(o.secondary) + '</button>' : '') +
        '</div></div>';
    }).join('');
    el.querySelectorAll('[data-dismiss]').forEach(function (btn) {
      btn.onclick = function (ev) { ev.stopPropagation(); dismiss(btn.getAttribute('data-dismiss')); };
    });
    el.querySelectorAll('.sn-offer').forEach(function (card) {
      card.onclick = function (ev) {
        if (ev.target.closest('button')) return;
        openFull(card.getAttribute('data-oid'));
      };
    });
    el.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.onclick = function (ev) {
        ev.stopPropagation();
        runAct(btn.getAttribute('data-oid'), btn.getAttribute('data-act'));
      };
    });
  }
  function find(id) {
    for (var i = 0; i < stack.length; i++) if (stack[i].id === id) return stack[i];
    return null;
  }
  function dismiss(id) {
    stack = stack.filter(function (o) { return o.id !== id; });
    paint();
  }
  function push(offer) {
    if (!offer || !offer.id) return null;
    stack = stack.filter(function (o) { return o.id !== offer.id; });
    stack.unshift(offer);
    if (stack.length > MAX) stack = stack.slice(0, MAX);
    paint();
    return offer;
  }
  function pushTask(task, extra) {
    extra = extra || {};
    if (!task || !task.id) return null;
    var enriched = null;
    try { if (global.SNTaskBoard && SNTaskBoard.enrich) enriched = SNTaskBoard.enrich(task); } catch (_) {}
    var price = enriched && enriched.price != null ? fmtPrice(enriched.price) : task.total_s != null ? fmtPrice(task.total_s) : '';
    var title = (task.title || 'Delivery').slice(0, 40);
    var sub = (enriched && enriched.vendorName ? enriched.vendorName : '') + (enriched && enriched.clientName ? ' → ' + enriched.clientName : '');
    if (extra.eta) sub = (sub ? sub + ' · ' : '') + String(extra.eta).slice(0, 36);
    var o = push({
      id: 'task:' + task.id, kind: 'task', kindLabel: 'DELIVERY TASK', title: title,
      sub: sub || task.status || 'open', price: price, taskId: task.id, enriched: enriched,
      primary: (task.status === 'open' || task.status === 'seeking_driver') ? 'Claim' : 'Open',
      secondary: 'Map', t: Date.now()
    });
    try {
      if (global.SNTile && SNTile.openTask && enriched) SNTile.openTask(enriched, { quiet: true });
      else if (global.SNTaskBoard && SNTaskBoard.openTaskTile) SNTaskBoard.openTaskTile(task);
    } catch (_) {}
    try { if (global.SNMap && SNMap.showTasks) SNMap.showTasks(); } catch (_) {}
    if (!extra.quiet) log('Tile · task ' + title.slice(0, 28), 'ok');
    return o;
  }
  function pushVendor(profile, extra) {
    extra = extra || {};
    if (!profile || !profile.id) return null;
    var title = (profile.shopName || profile.name || 'Vendor').slice(0, 36);
    var sub = [];
    if (profile._km != null) sub.push(Number(profile._km).toFixed(1) + ' km');
    if (profile.rating != null) sub.push('★' + Number(profile.rating).toFixed(1));
    if (profile.openNow === true) sub.push('open');
    if (extra.item) sub.push(String(extra.item).slice(0, 24));
    return push({
      id: 'vendor:' + profile.id, kind: 'vendor', kindLabel: 'VENDOR', title: title,
      sub: sub.join(' · ') || profile.shopKind || 'shop',
      price: profile._price != null ? fmtPrice(profile._price) : '', profileId: profile.id,
      primary: 'Menu', secondary: 'Map', t: Date.now()
    });
  }
  function pushDriverOffer(driver, task) {
    if (!driver) return null;
    return push({
      id: 'driver:' + (driver.id || driver.name) + (task && task.id ? ':' + task.id : ''),
      kind: 'driver', kindLabel: 'DRIVER', title: (driver.name || 'Driver').slice(0, 32),
      sub: (driver.vehicle || 'scooter') + (driver.driverOnline ? ' · ONLINE' : ''),
      profileId: driver.id, taskId: task && task.id, primary: 'Claim job', secondary: 'Profile', t: Date.now()
    });
  }
  function openFull(id) {
    var o = find(id); if (!o) return;
    if (o.kind === 'task' && o.taskId) {
      try {
        if (global.SNTaskBoard && SNTaskBoard.openTaskTile) SNTaskBoard.openTaskTile(o.taskId);
        else if (global.SNTile && SNTile.openTask && o.enriched) SNTile.openTask(o.enriched);
      } catch (_) {}
      return;
    }
    if (o.profileId && global.SNTile && SNTile.open) {
      try { SNTile.open(o.profileId, { expand: true, tab: o.kind === 'vendor' ? 'menu' : 'about' }); } catch (_) {}
    }
  }
  function runAct(id, act) {
    var o = find(id); if (!o) return;
    if (act === 'secondary') {
      if (o.kind === 'task' && o.taskId) {
        try {
          var t = global.SNTasks && SNTasks.get ? SNTasks.get(o.taskId) : (o.enriched && o.enriched.task);
          if (t && global.SNTaskBoard && SNTaskBoard.previewTaskOnMap) void SNTaskBoard.previewTaskOnMap(t, { fit: true, force: true });
        } catch (_) {}
        return;
      }
      if (o.profileId) {
        try {
          var p = global.SNProfiles && SNProfiles.get && SNProfiles.get(o.profileId);
          if (p && p.lat != null && global.SNMap && SNMap.open) { void SNMap.open(p.lat, p.lng); if (SNMap.showProfiles) SNMap.showProfiles(); }
        } catch (_) {}
      }
      return;
    }
    if (o.kind === 'task' && o.taskId) {
      try {
        var r = global.SNTasks && SNTasks.claim && SNTasks.claim(o.taskId);
        if (r && r.ok) {
          log('Claimed · ' + (r.task.title || o.title), 'ok');
          o.primary = 'Open'; o.sub = 'claimed · en route';
          if (r.task) pushTask(r.task, { quiet: true });
          paint();
          try { if (global.SNTaskBoard && SNTaskBoard.previewTaskOnMap) void SNTaskBoard.previewTaskOnMap(r.task, { fit: true, force: true }); } catch (_) {}
        } else openFull(id);
      } catch (_) { openFull(id); }
      return;
    }
    if (o.kind === 'vendor' && o.profileId) {
      try { if (global.SNTile && SNTile.open) SNTile.open(o.profileId, { expand: true, tab: 'menu', full: true }); } catch (_) {}
      return;
    }
    if (o.kind === 'driver' && o.taskId) {
      try { var r2 = global.SNTasks && SNTasks.claim && SNTasks.claim(o.taskId); if (r2 && r2.ok) log('Claimed · ' + (r2.task.title || ''), 'ok'); openFull(id); } catch (_) {}
      return;
    }
    openFull(id);
  }
  function onOrderResult(orderResult, meta) {
    meta = meta || {};
    if (!orderResult || !orderResult.ok || !orderResult.task) return;
    pushTask(orderResult.task, { eta: meta.eatLine || meta.eta || '' });
    if (meta.vendor) pushVendor(meta.vendor, { item: meta.item });
    if (meta.driver) pushDriverOffer(meta.driver, orderResult.task);
  }
  function afterFulfill(r) {
    if (!r) return;
    if (r.best) pushVendor(r.best, { item: r.judged && r.judged.itemName });
    if (r.top3 && r.top3.length) r.top3.forEach(function (v) { pushVendor(v, {}); });
    else if (r.vendors && r.vendors.length) r.vendors.slice(0, 3).forEach(function (v) { pushVendor(v, {}); });
    var ord = r.order || r.orderResult;
    if (ord && ord.ok && ord.task) onOrderResult(ord, { eatLine: r.eatLine || (r.eta && r.eta.eatLine), vendor: r.best, driver: r.driver, item: r.judged && r.judged.itemName });
    else if (r.task) onOrderResult({ ok: true, task: r.task }, { eatLine: r.eatLine, vendor: r.best });
    else if (r.ok && (r.eatLine || (r.eta && r.eta.eatLine)) && global.SNTasks && SNTasks.list) {
      var open = (SNTasks.list({ all: true }) || []).filter(function (t) {
        return t && t.kind === 'delivery' && t.status !== 'cancelled' && t.status !== 'done';
      }).sort(function (a, b) { return (b.created || b.t || 0) - (a.created || a.t || 0); });
      if (open[0]) pushTask(open[0], { eta: r.eatLine || (r.eta && r.eta.eatLine) });
    }
  }
  function installHooks() {
    try {
      if (global.SNProfiles && SNProfiles.placeOrder && !SNProfiles._snOfferHooked) {
        var orig = SNProfiles.placeOrder.bind(SNProfiles);
        SNProfiles.placeOrder = function (opts) {
          var r = orig(opts);
          try { if (r && r.ok && r.task) onOrderResult(r, opts || {}); } catch (_) {}
          return r;
        };
        SNProfiles._snOfferHooked = true;
      }
    } catch (_) {}
    try {
      if (global.SNMarket && SNMarket.fulfillFoodIntent && !SNMarket._snOfferHooked) {
        var ful = SNMarket.fulfillFoodIntent.bind(SNMarket);
        SNMarket.fulfillFoodIntent = function (q, opts) {
          var p = ful(q, opts);
          if (p && typeof p.then === 'function') return p.then(function (r) { try { afterFulfill(r); } catch (_) {} return r; });
          try { afterFulfill(p); } catch (_) {}
          return p;
        };
        SNMarket._snOfferHooked = true;
      }
    } catch (_) {}
  }
  function syncFromTasks() {
    try {
      if (!global.SNTasks || !SNTasks.list) return;
      (SNTasks.list({ all: true }) || []).filter(function (t) {
        return t && t.kind === 'delivery' && (t.status === 'open' || t.status === 'seeking_driver' || t.status === 'claimed' || t.status === 'in_progress');
      }).slice(0, 4).forEach(function (t) { pushTask(t, { quiet: true }); });
    } catch (_) {}
  }
  function testThrow(opts) {
    opts = opts || {};
    var pos = global._snLastPos || global._snPhysPos || { lat: 36.4341, lng: 28.2176 };
    var n = Math.min(5, Math.max(1, Number(opts.count) || 3));
    var now = Date.now();
    var taskId = 'test_task_' + now.toString(36);
    var fakeTask = {
      id: taskId, kind: 'delivery', status: opts.status || 'seeking_driver',
      title: opts.title || '📦 Test Order · Greek special · 22.00 S',
      total_s: opts.total != null ? opts.total : 22,
      vendorName: opts.vendorName || 'Nonna Fires (test)', clientName: opts.clientName || 'You',
      vendorId: 'test_v_pizza_a',
      lat: Number(pos.lat) + 0.004, lng: Number(pos.lng) + 0.003,
      drop_lat: pos.lat, drop_lng: pos.lng, created: now, paid: true
    };
    try {
      if (global.SNTasks && SNTasks.create && opts.persist) {
        var real = SNTasks.create({
          kind: 'delivery', title: fakeTask.title, status: fakeTask.status,
          lat: fakeTask.lat, lng: fakeTask.lng, drop_lat: fakeTask.drop_lat, drop_lng: fakeTask.drop_lng,
          total_s: fakeTask.total_s, always_on: true, paid: true,
          vendorName: fakeTask.vendorName, clientName: fakeTask.clientName
        });
        if (real && real.id) fakeTask = Object.assign(fakeTask, real);
      }
    } catch (_) {}
    pushTask(fakeTask, { eta: opts.eta || 'You eat ~25 min · test' });
    pushVendor({
      id: 'test_v_pizza_a', shopName: 'Nonna Fires', name: 'Nonna Fires', shopKind: 'pizza',
      _km: 0.6, rating: 4.7, openNow: true, _price: 13.5, lat: fakeTask.lat, lng: fakeTask.lng
    }, { item: 'Super Greek special' });
    if (n >= 2) {
      pushVendor({
        id: 'test_v_pizza_b', shopName: 'Oven 23', name: 'Oven 23', shopKind: 'pizza',
        _km: 1.1, rating: 4.4, openNow: true, _price: 12,
        lat: Number(pos.lat) - 0.003, lng: Number(pos.lng) + 0.004
      }, { item: 'Pepperoni' });
    }
    if (n >= 3) {
      pushDriverOffer({ id: 'test_d_alpha', name: 'Test Driver Alpha', vehicle: 'Scooter', driverOnline: true }, fakeTask);
    }
    log('Test tiles · ' + stack.length + ' in stack · Claim / Map / Menu', 'ok');
    return { ok: true, stack: stack.slice(), task: fakeTask };
  }
  async function demoDelivery(opts) {
    opts = opts || {};
    var pos = global._snLastPos || global._snPhysPos || { lat: 36.4341, lng: 28.2176 };
    try { if (global.SNMarket && SNMarket.seedTestSector) SNMarket.seedTestSector(pos, { food: 'pizza' }); } catch (_) {}
    var thrown = testThrow({
      persist: !!opts.persist,
      eta: opts.eta || 'Demo · ~18 min · driver on polygon',
      title: opts.title || '📦 Demo delivery · polygon + tiles',
      status: 'in_progress'
    });
    var vendorLat = Number(pos.lat) + 0.0042, vendorLng = Number(pos.lng) + 0.0028;
    var dropLat = Number(pos.lat), dropLng = Number(pos.lng);
    var stopLat = Number(pos.lat) + 0.0015, stopLng = Number(pos.lng) + 0.0012;
    var route = null;
    try {
      if (global.SNMap && SNMap.open) {
        await SNMap.open(dropLat, dropLng);
        if (SNMap.ensure) await SNMap.ensure();
        if (SNMap.markYou) SNMap.markYou(dropLat, dropLng, 'YOU · drop');
        if (SNMap.showTasks) SNMap.showTasks();
        if (SNMap.showProfiles) SNMap.showProfiles();
      }
    } catch (_) {}
    try {
      if (global.SNField && SNField.startDeliveryRoute) {
        route = await SNField.startDeliveryRoute({
          id: 'live:demo_' + Date.now().toString(36),
          vendorLat: vendorLat, vendorLng: vendorLng, dropLat: dropLat, dropLng: dropLng,
          stops: opts.multi !== false ? [{ lat: stopLat, lng: stopLng, label: 'stop before you' }] : [],
          waypoints: [{ lat: vendorLat, lng: vendorLng }, { lat: stopLat, lng: stopLng }, { lat: dropLat, lng: dropLng }],
          label: '🛵 Demo · Nonna → you', driver: 'Test Driver Alpha',
          color: 'rgba(0,220,255,0.95)', etaMin: 18, speedKmh: 22
        });
      } else if (global.SNField && SNField.showRoute) {
        route = await SNField.showRoute(
          [{ lat: vendorLat, lng: vendorLng }, { lat: dropLat, lng: dropLng }],
          { id: 'live:demo', label: '🛵 Demo', kind: 'delivery', osrm: true, progress: 0.05 }
        );
      }
    } catch (e) { log('Route demo · ' + (e && e.message ? e.message : e), 'err'); }
    try {
      if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true);
      if (global.SNField && SNField.setRadarExpanded) SNField.setRadarExpanded(true);
    } catch (_) {}
    log('Demo delivery · tiles + cyan polygon · driver moves on route', 'ok');
    log('Radar · yellow scooter along path · Claim on task tile', 'dim');
    return { ok: true, thrown: thrown, route: route, pos: pos };
  }
  function clearAll() {
    stack = []; paint();
    try { if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true); } catch (_) {}
    log('Offer stack cleared', 'dim');
    return { ok: true };
  }
  function init() {
    ensureRoot();
    installHooks();
    setTimeout(function () { try { installHooks(); syncFromTasks(); } catch (_) {} }, 2000);
  }
  global.SNOfferStack = {
    init: init, push: push, pushTask: pushTask, pushVendor: pushVendor, pushDriverOffer: pushDriverOffer,
    onOrderResult: onOrderResult, afterFulfill: afterFulfill, syncFromTasks: syncFromTasks, dismiss: dismiss,
    testThrow: testThrow, demoDelivery: demoDelivery, clear: clearAll,
    list: function () { return stack.slice(); }, paint: paint
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { try { init(); } catch (_) {} });
  else try { init(); } catch (_) {}
})(typeof window !== 'undefined' ? window : globalThis);
