/**
 * SNOfferStack — overlay tiles for tasks + offers (delivery missing link)
 * Peek tiles float above globe/map. Never full-screen on first throw.
 * window.SNOfferStack · CLI: offers test · demo delivery · polygon · harness
 */
(function (global) {
  'use strict';
  var MAX = 5, stack = [], root = null, CSS_ID = 'sn-offer-stack-css-v2';
  function log(m, c) { try { if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim'); } catch (_) {} }
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
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
      '#sn-offer-stack .sn-offer{pointer-events:auto;position:relative;border-radius:16px;background:rgba(0,8,28,.94);border:1px solid rgba(0,110,255,.65);box-shadow:0 10px 28px rgba(0,0,0,.65),0 0 22px rgba(0,90,255,.35);color:#c8e4ff;padding:10px 12px;min-width:200px;cursor:pointer;touch-action:manipulation;animation:snOfferIn .28s ease-out}',
      '#sn-offer-stack .kind-task{border-color:rgba(0,221,136,.55)}',
      '#sn-offer-stack .kind-vendor{border-color:rgba(61,158,255,.65)}',
      '#sn-offer-stack .kind-driver{border-color:rgba(255,200,60,.5)}',
      '#sn-offer-stack .sn-offer-k{font:700 9px system-ui;letter-spacing:.12em;text-transform:uppercase;color:#3d9eff;margin-bottom:3px}',
      '#sn-offer-stack .kind-task .sn-offer-k{color:#6dffb0}',
      '#sn-offer-stack .kind-driver .sn-offer-k{color:#f5d76e}',
      '#sn-offer-stack .sn-offer-t{font:700 13px/1.25 system-ui;color:#e8f4ff}',
      '#sn-offer-stack .sn-offer-s{font:11px/1.35 system-ui;color:#7a9cc8;margin-top:2px}',
      '#sn-offer-stack .sn-offer-p{font:800 18px/1.1 ui-monospace,system-ui;color:#1a6fd4;text-shadow:0 0 12px rgba(26,111,212,.9);margin-top:6px}',
      '#sn-offer-stack .sn-offer-row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}',
      '#sn-offer-stack .sn-offer-btn{flex:1;min-width:64px;border-radius:12px;border:1px solid rgba(61,158,255,.45);background:rgba(26,111,212,.22);color:#e8f4ff;font:700 11px system-ui;padding:7px 8px;cursor:pointer}',
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
    var sub = (enriched && enriched.vendorName ? enriched.vendorName : (task.vendorName || '')) +
      (enriched && enriched.clientName ? ' → ' + enriched.clientName : (task.clientName ? ' → ' + task.clientName : ''));
    if (extra.eta) sub = (sub ? sub + ' · ' : '') + String(extra.eta).slice(0, 36);
    var o = push({
      id: 'task:' + task.id, kind: 'task', kindLabel: 'DELIVERY TASK', title: title,
      sub: sub || task.status || 'open', price: price, taskId: task.id, enriched: enriched,
      primary: (task.status === 'open' || task.status === 'seeking_driver') ? 'Claim' : 'Open',
      secondary: 'Map', t: Date.now()
    });
    try {
      // Never auto-wall the map: only peek stack paints. Full tile opens on Claim / card tap.
      if (!extra.quiet && extra.openFull && global.SNTile && SNTile.openTask && enriched) {
        SNTile.openTask(enriched, { quiet: true });
      } else if (!extra.quiet && extra.openFull && global.SNTaskBoard && SNTaskBoard.openTaskTile) {
        SNTaskBoard.openTaskTile(task);
      }
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
  function posNow() {
    return global._snLastPos || global._snPhysPos || { lat: 36.4341, lng: 28.2176 };
  }
  function testThrow(opts) {
    opts = opts || {};
    var pos = posNow();
    var n = Math.min(5, Math.max(1, Number(opts.count) || 3));
    var now = Date.now();
    var fakeTask = {
      id: 'test_task_' + now.toString(36), kind: 'delivery',
      status: opts.status || 'seeking_driver',
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
  async function demoPolygon(opts) {
    opts = opts || {};
    var pos = posNow();
    var vendorLat = Number(pos.lat) + 0.0042, vendorLng = Number(pos.lng) + 0.0028;
    var dropLat = Number(pos.lat), dropLng = Number(pos.lng);
    var stopLat = Number(pos.lat) + 0.0015, stopLng = Number(pos.lng) + 0.0012;
    var speed = opts.speedKmh != null ? Number(opts.speedKmh) : 22;
    var route = null;
    try {
      if (global.SNMap && SNMap.open) {
        await SNMap.open(dropLat, dropLng);
        if (SNMap.ensure) await SNMap.ensure();
        if (SNMap.markYou) SNMap.markYou(dropLat, dropLng, 'YOU · drop');
      }
    } catch (_) {}
    try {
      if (global.SNField && SNField.startDeliveryRoute) {
        route = await SNField.startDeliveryRoute({
          id: 'live:poly_' + Date.now().toString(36),
          vendorLat: vendorLat, vendorLng: vendorLng, dropLat: dropLat, dropLng: dropLng,
          stops: opts.multi !== false ? [{ lat: stopLat, lng: stopLng, label: 'stop before you' }] : [],
          waypoints: opts.multi !== false
            ? [{ lat: vendorLat, lng: vendorLng }, { lat: stopLat, lng: stopLng }, { lat: dropLat, lng: dropLng }]
            : [{ lat: vendorLat, lng: vendorLng }, { lat: dropLat, lng: dropLng }],
          label: opts.label || '🛵 Route · vendor → you',
          driver: opts.driver || 'Test Driver Alpha',
          color: 'rgba(0,220,255,0.95)', etaMin: opts.etaMin || 18, speedKmh: speed
        });
      } else if (global.SNField && SNField.showRoute) {
        route = await SNField.showRoute(
          [{ lat: vendorLat, lng: vendorLng }, { lat: dropLat, lng: dropLng }],
          { id: 'live:poly', label: '🛵 Route', kind: 'delivery', osrm: true, progress: 0.05 }
        );
      }
    } catch (e) { log('Polygon · ' + (e && e.message ? e.message : e), 'err'); }
    try {
      if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true);
      if (global.SNField && SNField.setRadarExpanded) SNField.setRadarExpanded(true);
    } catch (_) {}
    return { ok: !!route || true, route: route, pos: pos, speed: speed };
  }
  async function demoDelivery(opts) {
    opts = opts || {};
    var pos = posNow();
    try { if (global.SNMarket && SNMarket.seedTestSector) SNMarket.seedTestSector(pos, { food: 'pizza' }); } catch (_) {}
    var thrown = testThrow({
      persist: !!opts.persist,
      eta: opts.eta || 'Demo · ~18 min · driver on polygon',
      title: opts.title || '📦 Demo delivery · polygon + tiles',
      status: 'in_progress'
    });
    var route = await demoPolygon({ multi: opts.multi !== false, speedKmh: opts.speedKmh || 22 });
    log('Demo delivery · tiles + cyan polygon · driver moves on route', 'ok');
    log('Radar · yellow scooter along path · Claim on task tile', 'dim');
    return { ok: true, thrown: thrown, route: route, pos: pos };
  }
  function clearAll() {
    stack = []; paint();
    log('Offer stack cleared', 'dim');
    return { ok: true };
  }
  function clearRoutes() {
    try {
      if (global.SNField && SNField.clearRoutes) SNField.clearRoutes();
      else if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true);
    } catch (_) {}
    log('Routes cleared', 'dim');
    return { ok: true };
  }
  function listRoutes() {
    try {
      if (global.SNField && SNField.listRoutes) return SNField.listRoutes() || [];
      if (global.SNField && SNField.routes) return SNField.routes || [];
    } catch (_) {}
    return [];
  }
  function radar(on) {
    try {
      if (global.SNField && SNField.setRadarExpanded) SNField.setRadarExpanded(on !== false);
    } catch (_) {}
    return { ok: true, on: on !== false };
  }
  function runTestCommand(cmd) {
    cmd = String(cmd || '').toLowerCase().trim();
    if (cmd === 'tiles' || cmd === 'offers' || cmd === 'throw') return testThrow({});
    if (cmd === 'polygon' || cmd === 'poly') return demoPolygon({ multi: true });
    if (cmd === 'delivery' || cmd === 'demo' || cmd === 'full') return demoDelivery({ multi: true });
    if (cmd === 'clear') { clearAll(); clearRoutes(); return { ok: true }; }
    if (cmd === 'sync') { syncFromTasks(); return { ok: true, stack: stack.slice() }; }
    if (cmd === 'routes') return { ok: true, routes: listRoutes() };
    return { ok: false, error: 'unknown' };
  }

  function isOfferCmd(low) {
    if (!low) return false;
    if (
      low === 'offers' || low === 'offer stack' || low === 'tiles stack' ||
      low === 'offers test' || low === 'offer test' || low === 'test tiles' ||
      low === 'throw tiles' || low === 'tile test' || low === 'test offers' ||
      low === 'demo tiles' || low === 'throw offers' || low === 'launch tiles' ||
      low === 'offers clear' || low === 'clear offers' || low === 'clear tiles' || low === 'tiles clear' ||
      low === 'clear routes' || low === 'routes clear' || low === 'clear polygons' || low === 'polygon clear' ||
      low === 'clear all' || low === 'test clear' || low === 'reset test' ||
      low === 'demo delivery' || low === 'test delivery' || low === 'test polygons' || low === 'test polygon' ||
      low === 'test driver route' || low === 'demo route' || low === 'test route demo' ||
      low === 'moving driver' || low === 'driver on route' || low === 'demo full' || low === 'full demo' ||
      low === 'test full delivery' ||
      low === 'polygon' || low === 'test poly' || low === 'poly test' || low === 'show polygon' ||
      low === 'start polygon' || low === 'route demo' || low === 'draw route' || low === 'show route' ||
      low === 'radar' || low === 'radar on' || low === 'radar expand' ||
      low === 'radar off' || low === 'radar collapse' ||
      low === 'routes' || low === 'list routes' || low === 'show routes' || low === 'live routes' ||
      low === 'refresh routes' || low === 'routes refresh' ||
      low === 'test harness' || low === 'demo all' || low === 'test all' || low === 'offers help' ||
      low === 'test help' || low === 'help offers' ||
      /^offers?\s+(list|sync|show)$/i.test(low) ||
      /^polygon\s/i.test(low) ||
      /^(do|run|launch|start)\s+(tiles|offers|polygon|demo|delivery)/i.test(low)
    ) return true;
    return false;
  }

  async function handleOfferLine(raw) {
    var line = String(raw || '').trim();
    var low = line.toLowerCase();
    function begin() { try { if (global.SNCli && SNCli.beginTurn) SNCli.beginTurn(); } catch (_) {} }
    function end() { try { if (global.SNCli && SNCli.endTurn) SNCli.endTurn(); } catch (_) {} }
    function say(m, c) {
      try {
        if (global.SNCli && SNCli.log) SNCli.log(m, c || 'ok');
        if (global.SNCli && SNCli.preview) SNCli.preview(String(m).slice(0, 48));
      } catch (_) {}
    }
    // do/run/launch prefix strip
    low = low.replace(/^(do|run|launch|start)\s+/, '');
    begin();
    try {
      if (low === 'offers' || low === 'offer stack' || low === 'tiles stack' || /^offers?\s+(list|sync|show)$/i.test(low) || low === 'tiles list') {
        syncFromTasks();
        var list = stack.slice();
        if (!list.length) say('No offer tiles · type: offers test  · or demo delivery', 'dim');
        else list.forEach(function (o) {
          say((o.kindLabel || o.kind || 'OFFER') + ' · ' + String(o.title || '').slice(0, 36) + (o.price ? ' · ' + o.price : ''), 'ok');
        });
        if (global.SNCli && SNCli.preview) SNCli.preview(list.length + ' offer tiles');
        return true;
      }
      if (low === 'offers test' || low === 'offer test' || low === 'test tiles' || low === 'throw tiles' || low === 'tile test' || low === 'test offers' || low === 'demo tiles' || low === 'throw offers' || low === 'launch tiles' || low === 'tiles') {
        var r = testThrow({});
        say(r && r.ok ? 'Test tiles thrown · peek top-right · Claim / Map / Menu' : 'Could not throw tiles', r && r.ok ? 'ok' : 'err');
        return true;
      }
      if (low === 'offers clear' || low === 'clear offers' || low === 'clear tiles' || low === 'tiles clear') {
        clearAll(); say('Offer stack cleared', 'dim'); return true;
      }
      if (low === 'clear routes' || low === 'routes clear' || low === 'clear polygons' || low === 'polygon clear') {
        clearRoutes(); say('Delivery routes / polygons cleared', 'dim'); return true;
      }
      if (low === 'clear all' || low === 'test clear' || low === 'reset test') {
        clearAll(); clearRoutes(); say('Tiles + routes cleared', 'dim'); return true;
      }
      if (low === 'demo delivery' || low === 'test delivery' || low === 'test polygons' || low === 'test polygon' || low === 'test driver route' || low === 'demo route' || low === 'test route demo' || low === 'moving driver' || low === 'driver on route' || low === 'demo full' || low === 'full demo' || low === 'test full delivery' || low === 'delivery' || low === 'demo') {
        say('Demo · tiles + cyan route polygon · driver moves along path', 'ok');
        var d = await demoDelivery({ multi: true });
        if (d && d.ok) {
          say('Polygon live · radar/map · yellow driver advances', 'ok');
          say('Tiles · Claim / Map · type offers clear when done', 'dim');
        } else say('Demo soft-fail · try locate then demo delivery', 'err');
        return true;
      }
      if (low === 'polygon' || low === 'test poly' || low === 'poly test' || low === 'show polygon' || low === 'start polygon' || low === 'route demo' || low === 'draw route' || low === 'show route' || /^polygon\s/i.test(low)) {
        var speed = 22;
        var m = low.match(/(?:speed|kmh|km\/h)\s*(\d+)/i) || low.match(/(\d+)\s*km/);
        if (m) speed = Math.max(5, Math.min(80, Number(m[1])));
        var multi = !/no.?stop|direct|single/i.test(low);
        say('Drawing cyan polygon · driver @ ' + speed + ' km/h' + (multi ? ' · multi-stop' : ''), 'ok');
        var pr = await demoPolygon({ multi: multi, speedKmh: speed });
        if (pr && pr.ok) say('Polygon live · yellow scooter advances on path', 'ok');
        else say('Polygon soft-fail · open map / locate first', 'err');
        return true;
      }
      if (low === 'radar' || low === 'radar on' || low === 'radar expand') {
        radar(true); say('Radar expanded', 'ok'); return true;
      }
      if (low === 'radar off' || low === 'radar collapse') {
        radar(false); say('Radar collapsed', 'dim'); return true;
      }
      if (low === 'routes' || low === 'list routes' || low === 'show routes' || low === 'live routes') {
        var rs = listRoutes();
        if (!rs.length) say('No live delivery routes · try demo delivery', 'dim');
        else rs.slice(0, 8).forEach(function (rt, i) {
          say((i + 1) + ') ' + String((rt && (rt.label || rt.id)) || 'route').slice(0, 40), 'ok');
        });
        return true;
      }
      if (low === 'refresh routes' || low === 'routes refresh') {
        try { if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true); } catch (_) {}
        say('Routes refreshed', 'dim'); return true;
      }
      if (low === 'test harness' || low === 'demo all' || low === 'test all' || low === 'offers help' || low === 'test help' || low === 'help offers') {
        [
          '═══ OWNER TEST HARNESS ═══',
          'offers test      · peek task / vendor / driver tiles',
          'demo delivery    · tiles + cyan polygon + moving driver',
          'polygon          · polygon only · polygon speed 30',
          'polygon direct   · single-leg no stop',
          'radar / radar off',
          'routes           · list live polygons',
          'refresh routes',
          'offers clear · clear routes · clear all',
          'Also: throw tiles · moving driver · launch tiles'
        ].forEach(function (ln, i) { say(ln, i === 0 ? 'ok' : 'dim'); });
        return true;
      }
    } catch (e) {
      say('Test · ' + (e && e.message ? e.message : e), 'err');
      return true;
    } finally {
      end();
    }
    return false;
  }

  /** CLI empowerment — intercept without rewriting cli.js; rebind-safe (no stack wrap) */
  function installCli() {
    try {
      if (!global.SNCli || typeof SNCli.run !== 'function') return;
      if (!SNCli._snOfferOrigRun) {
        SNCli._snOfferOrigRun = SNCli.run.bind(SNCli);
      }
      // Always assign the same wrapper shape once; re-entry safe
      SNCli.run = async function (raw) {
        var low = String(raw || '').trim().toLowerCase();
        try {
          if (isOfferCmd(low) || isOfferCmd(low.replace(/^(do|run|launch|start)\s+/, ''))) {
            var handled = await handleOfferLine(raw);
            if (handled) return;
          }
        } catch (_) {}
        return SNCli._snOfferOrigRun(raw);
      };
      SNCli._snOfferCli = true;
    } catch (_) {}
  }

  function init() {
    ensureRoot();
    installHooks();
    installCli();
    [600, 1800, 4000, 10000].forEach(function (ms) {
      setTimeout(function () {
        try {
          installHooks();
          installCli();
          if (ms >= 1800) syncFromTasks();
        } catch (_) {}
      }, ms);
    });
  }

  global.SNOfferStack = {
    init: init,
    push: push,
    pushTask: pushTask,
    pushVendor: pushVendor,
    pushDriverOffer: pushDriverOffer,
    onOrderResult: onOrderResult,
    afterFulfill: afterFulfill,
    syncFromTasks: syncFromTasks,
    dismiss: dismiss,
    testThrow: testThrow,
    demoDelivery: demoDelivery,
    demoPolygon: demoPolygon,
    clear: clearAll,
    clearRoutes: clearRoutes,
    listRoutes: listRoutes,
    radar: radar,
    runTest: runTestCommand,
    handleLine: handleOfferLine,
    list: function () { return stack.slice(); },
    paint: paint
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { init(); } catch (_) {} });
  } else {
    try { init(); } catch (_) {}
  }
})(typeof window !== 'undefined' ? window : globalThis);
