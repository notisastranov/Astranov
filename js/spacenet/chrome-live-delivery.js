/* Astranov — Wire delivery to live Supabase vendors/orders
 * Build: 20260817094500-live-supabase-delivery
 * Law: no new demo CLI · real vendors/orders from project lkoatrkhuigdolnjsbie
 * DB fact 2026-08-17: vendors 4205 (items=[] every row) · orders 13 stuck seeking_driver since 2026-06-25
 * Guest: prepareFirstTest() enables test-mode + free-credits once (silent)
 * Poly: DRIVER EN ROUTE · me-av · dense route points when OSRM available
 * Empty DB menus → local ensureOrderableMenu so S path works; network intake stays best-effort
 */
(function (global) {
  'use strict';
  var BUILD = '20260817094500-live-supabase-delivery';
  var POLL_MS = 14000;
  var guestPrepDone = false;
  var lastPaintKey = '';
  var pollTimer = null;
  var menuFillOnce = false;

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (_) {}
  }

  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(String(m || '').slice(0, 64));
    } catch (_) {}
  }

  function isGuest() {
    try {
      if (global.SNAuth && typeof SNAuth.isLoggedIn === 'function' && SNAuth.isLoggedIn()) return false;
      if (global.SNAuth && SNAuth.session && SNAuth.session.user) return false;
      if (global.SNAuth && SNAuth.user) return false;
    } catch (_) {}
    return true;
  }

  function testModeOn() {
    try {
      return localStorage.getItem('sn:test-mode-v1') === '1';
    } catch (_) {
      return false;
    }
  }

  async function softGuestPrep(opts) {
    opts = opts || {};
    if (guestPrepDone && !opts.force) return { ok: true, already: true };
    if (!isGuest() && !opts.force && !testModeOn()) {
      return { ok: true, skipped: 'signed-in live' };
    }
    guestPrepDone = true;
    try {
      if (global.SNMarket && typeof SNMarket.prepareFirstTest === 'function') {
        var r = await SNMarket.prepareFirstTest({
          wallet: opts.wallet != null ? opts.wallet : 40,
          quiet: true,
        });
        log(
          'Live · guest prep · test-mode + free-credits · ' +
            (r && r.ready ? 'ready' : 'partial'),
          r && r.ready ? 'ok' : 'dim'
        );
        return r || { ok: true };
      }
    } catch (e) {
      try {
        localStorage.setItem('sn:test-mode-v1', '1');
      } catch (_) {}
      try {
        if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 25) {
          SNCurrency.credit(40, 'guest first order credits');
        }
      } catch (_) {}
      return { ok: true, soft: true };
    }
    try {
      localStorage.setItem('sn:test-mode-v1', '1');
    } catch (_) {}
    return { ok: true, flagOnly: true };
  }

  function meAvatarUrl() {
    try {
      var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
      if (me && (me.photo || me.avatar || me.image)) return me.photo || me.avatar || me.image;
      if (global.SNAuth && SNAuth.user) {
        var u = SNAuth.user;
        if (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) {
          return u.user_metadata.avatar_url || u.user_metadata.picture;
        }
        if (u.avatar_url) return u.avatar_url;
      }
    } catch (_) {}
    return null;
  }

  function posNow() {
    return (
      global._snLastPos ||
      (global.SNTasks && SNTasks.pos) ||
      (global.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) || {
        lat: 36.4341,
        lng: 28.2176,
      }
    );
  }

  function fillMenusFromDbVendors(rows, pos) {
    if (!rows || !rows.length || !global.SNProfiles) return 0;
    var n = 0;
    var filled = 0;
    rows.slice(0, 60).forEach(function (v) {
      if (!v || v.lat == null) return;
      try {
        var p =
          (SNProfiles.fromVendor && SNProfiles.fromVendor(v, pos)) ||
          (SNProfiles.fromCrawlPlace &&
            SNProfiles.fromCrawlPlace(
              {
                id: v.id,
                name: v.name,
                lat: v.lat,
                lng: v.lng,
                kind: v.category || 'shop',
                items: v.items,
                emoji: v.emoji,
                real: true,
                delivery_enabled: v.delivery_enabled,
              },
              pos
            ));
        if (!p) return;
        n++;
        var before = (p.menu && p.menu.length) || 0;
        if (SNProfiles.ensureOrderableMenu) {
          p = SNProfiles.ensureOrderableMenu(p) || p;
        }
        if (p.menu && p.menu.length > before) filled++;
      } catch (_) {}
    });
    if (!menuFillOnce && n) {
      menuFillOnce = true;
      log(
        'Live · DB vendors ' +
          n +
          ' · menus local-filled ' +
          filled +
          ' (DB items=[] · S path OK · network intake best-effort)',
        'ok'
      );
    }
    return n;
  }

  async function ensureLiveVendors(lat, lng) {
    lat = lat != null ? Number(lat) : posNow().lat;
    lng = lng != null ? Number(lng) : posNow().lng;
    var pos = { lat: lat, lng: lng };
    var rows = [];
    try {
      if (global.SNCommerce && SNCommerce.loadNear) {
        rows = (await SNCommerce.loadNear(lat, lng, 15)) || [];
      }
    } catch (_) {}
    if (rows.length) {
      fillMenusFromDbVendors(rows, pos);
      return { ok: true, count: rows.length, source: 'db', menusLocal: true };
    }
    try {
      if (global.SNCommerce && SNCommerce.ensureSector) {
        var r = await SNCommerce.ensureSector(lat, lng, { openMap: false });
        try {
          var list = (global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || [];
          list.slice(0, 40).forEach(function (p) {
            try {
              if (SNProfiles.ensureOrderableMenu) SNProfiles.ensureOrderableMenu(p);
            } catch (_) {}
          });
        } catch (_) {}
        return r;
      }
    } catch (_) {}
    return { ok: false, count: 0 };
  }

  async function paintDriverEnRoute(task, opts) {
    opts = opts || {};
    if (!task || task.lat == null || task.drop_lat == null) return null;
    var key =
      String(task.id || '') +
      ':' +
      String(task.status || '') +
      ':' +
      String(task.driver_id || task.driverId || '');
    if (key === lastPaintKey && !opts.force) return null;
    lastPaintKey = key;

    var vendorLat = Number(task.lat);
    var vendorLng = Number(task.lng);
    var dropLat = Number(task.drop_lat);
    var dropLng = Number(task.drop_lng);
    var label =
      opts.label ||
      'DRIVER EN ROUTE · ' +
        String(task.driverName || task.driver_name || task.courier || 'Courier').slice(0, 16);
    var meAv = meAvatarUrl();

    var route = null;
    try {
      if (global.SNField && SNField.startDeliveryRoute) {
        route = await SNField.startDeliveryRoute({
          id: 'live:enroute_' + (task.id || Date.now()),
          vendorLat: vendorLat,
          vendorLng: vendorLng,
          dropLat: dropLat,
          dropLng: dropLng,
          label: label,
          driver: task.driverName || task.driver_name || 'Driver',
          color: 'rgba(0,220,160,0.95)',
          etaMin: task.etaMin || 18,
          speedKmh: 22,
          clientPhoto: meAv,
          meAvatar: meAv,
          status: 'DRIVER EN ROUTE',
          phase: 'en_route',
        });
      }
    } catch (e) {
      log('Live route · ' + (e && e.message ? e.message : e), 'dim');
    }

    try {
      if (route && route.points && route.points.length >= 2 && global.SNMap && SNMap.active && global.L) {
        var map = await SNMap.ensure();
        if (map) {
          var pts = route.points;
          if (pts.length < 40) {
            var denser = [];
            for (var i = 0; i < pts.length - 1; i++) {
              denser.push(pts[i]);
              var steps = Math.max(1, Math.round(85 / Math.max(1, pts.length)));
              for (var s = 1; s < steps; s++) {
                var t = s / steps;
                denser.push({
                  lat: pts[i].lat + (pts[i + 1].lat - pts[i].lat) * t,
                  lng: pts[i].lng + (pts[i + 1].lng - pts[i].lng) * t,
                });
              }
            }
            denser.push(pts[pts.length - 1]);
            pts = denser.slice(0, 120);
          }
          var latlngs = pts.map(function (p) {
            return [p.lat, p.lng];
          });
          if (!global.__snLiveEnRouteLayer) global.__snLiveEnRouteLayer = [];
          global.__snLiveEnRouteLayer.forEach(function (Lyr) {
            try {
              if (Lyr && Lyr.remove) Lyr.remove();
            } catch (_) {}
          });
          global.__snLiveEnRouteLayer = [];
          var poly = L.polyline(latlngs, {
            color: '#00dca0',
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round',
          }).addTo(map);
          poly.bindPopup(label);
          global.__snLiveEnRouteLayer.push(poly);
          try {
            var iconHtml =
              meAv && /^https?:|^data:/i.test(String(meAv))
                ? '<img src="' +
                  String(meAv).replace(/"/g, '') +
                  '" style="width:36px;height:36px;border-radius:50%;border:2px solid #7ec8ff;object-fit:cover;box-shadow:0 0 12px rgba(60,160,255,.6)"/>'
                : '<div style="width:36px;height:36px;border-radius:50%;background:#1a6fd4;border:2px solid #9ad4ff;display:flex;align-items:center;justify-content:center;color:#fff;font:800 11px system-ui">ME</div>';
            var icon = L.divIcon({
              className: 'sn-me-av',
              html: iconHtml,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
            var mk = L.marker([dropLat, dropLng], { icon: icon }).addTo(map);
            mk.bindPopup('You · drop');
            global.__snLiveEnRouteLayer.push(mk);
          } catch (_) {}
          try {
            map.fitBounds(poly.getBounds(), { padding: [48, 48], maxZoom: 15 });
          } catch (_) {}
          log('Guest Poly · ' + pts.length + '-pt DRIVER EN ROUTE · me-av', 'ok');
          preview('DRIVER EN ROUTE · ' + pts.length + ' pts');
        }
      } else if (route && route.points) {
        log('Poly · ' + (route.points.length || 0) + '-pt DRIVER EN ROUTE', 'ok');
      }
    } catch (_) {}

    try {
      if (global.SNGlobe && SNGlobe.pulse) {
        SNGlobe.pulse(vendorLat, vendorLng, 0x44ffaa, 'Pickup', 10000);
        SNGlobe.pulse(dropLat, dropLng, 0x7ec8ff, 'You', 10000);
      }
    } catch (_) {}

    return route;
  }

  function syncOffersFromTasks() {
    try {
      if (!global.SNTasks || !SNTasks.list) return 0;
      if (!global.SNOfferStack || !SNOfferStack.pushTask) return 0;
      var n = 0;
      var list = SNTasks.list({ all: true }) || [];
      list.forEach(function (t) {
        if (!t || t.kind !== 'delivery') return;
        var st = String(t.status || '');
        if (
          st !== 'open' &&
          st !== 'seeking_driver' &&
          st !== 'claimed' &&
          st !== 'assigned' &&
          st !== 'in_progress' &&
          st !== 'en_route' &&
          st !== 'picked_up'
        ) {
          return;
        }
        var isNet = t.source === 'spacenet-mesh' || (t.id && String(t.id).indexOf('net_') === 0);
        if (
          !testModeOn() &&
          !isNet &&
          (t.demo || t.fake || /Night Kitchen|test_task_/i.test(String(t.id || '') + String(t.vendorName || '')))
        ) {
          return;
        }
        try {
          SNOfferStack.pushTask(t, {
            quiet: true,
            vendorName: t.vendorName,
            clientName: t.clientName || 'You',
          });
          n++;
        } catch (_) {}
        if (st === 'in_progress' || st === 'en_route' || st === 'picked_up' || st === 'assigned') {
          void paintDriverEnRoute(t, { force: false });
        }
      });
      return n;
    } catch (_) {
      return 0;
    }
  }

  async function pullAndSync(opts) {
    opts = opts || {};
    var pull = null;
    try {
      if (global.SNMeshOrders && SNMeshOrders.pullOpenOrders) {
        pull = await SNMeshOrders.pullOpenOrders({
          force: opts.force !== false,
          quiet: !opts.verbose,
          maxKm: 80,
        });
      }
    } catch (_) {}
    try {
      if (global.SNMeshOrders && SNMeshOrders.status && !SNMeshOrders.status().polling && SNMeshOrders.start) {
        SNMeshOrders.start();
      }
    } catch (_) {}
    var synced = syncOffersFromTasks();
    if (opts.verbose || (pull && pull.imported)) {
      log(
        'Live mesh · net ' +
          ((pull && pull.count) || 0) +
          ' · imported ' +
          ((pull && pull.imported) || 0) +
          ' · offers ' +
          synced,
        pull && pull.imported ? 'ok' : 'dim'
      );
    }
    return { pull: pull, synced: synced };
  }

  function hookPlaceOrder() {
    try {
      if (!global.SNProfiles || !SNProfiles.placeOrder || SNProfiles._snLiveDeliveryHooked) return;
      var orig = SNProfiles.placeOrder.bind(SNProfiles);
      SNProfiles.placeOrder = function (opts) {
        opts = opts || {};
        try {
          if (isGuest() || testModeOn()) {
            if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 5) {
              void softGuestPrep({ force: false });
              opts = Object.assign({}, opts, { allowTopUp: true, testMode: true });
            }
          }
        } catch (_) {}
        try {
          var cart0 = SNProfiles.cart && SNProfiles.cart();
          if (cart0 && cart0[0] && cart0[0].vendorId && SNProfiles.get && SNProfiles.ensureOrderableMenu) {
            var v = SNProfiles.get(cart0[0].vendorId);
            if (v) SNProfiles.ensureOrderableMenu(v);
          }
        } catch (_) {}
        var r = orig(opts);
        try {
          if (r && r.ok && r.task) {
            if (global.SNMeshOrders && SNMeshOrders.afterLocalOrder) {
              void SNMeshOrders.afterLocalOrder(r, {
                vendor: r.vendor,
                drop: r.drop,
              });
            }
            if (global.SNOfferStack && SNOfferStack.onOrderResult) {
              SNOfferStack.onOrderResult(r, { vendor: r.vendor });
            }
            if (r.drop && r.drop.lat != null) {
              void ensureLiveVendors(r.drop.lat, r.drop.lng);
            }
            setTimeout(function () {
              void pullAndSync({ force: true });
            }, 800);
          }
        } catch (_) {}
        return r;
      };
      SNProfiles._snLiveDeliveryHooked = true;
    } catch (_) {}
  }

  function hookOrderEngine() {
    try {
      if (!global.SNOrderEngine || SNOrderEngine._snLiveDeliveryHooked) return;
      var prev = SNOrderEngine.afterPaid;
      if (typeof prev === 'function') {
        SNOrderEngine.afterPaid = function (orderResult, meta) {
          var out = prev.call(SNOrderEngine, orderResult, meta);
          try {
            if (orderResult && orderResult.ok) {
              setTimeout(function () {
                void pullAndSync({ force: true });
              }, 600);
            }
          } catch (_) {}
          return out;
        };
      }
      SNOrderEngine._snLiveDeliveryHooked = true;
    } catch (_) {}
  }

  function hookTaskTransitions() {
    try {
      if (!global.SNTasks || SNTasks._snLiveDeliveryClaimHook) return;
      if (typeof SNTasks.claim === 'function') {
        var c0 = SNTasks.claim.bind(SNTasks);
        SNTasks.claim = function () {
          var r = c0.apply(SNTasks, arguments);
          try {
            if (r && r.ok && r.task) void paintDriverEnRoute(r.task, { force: true });
          } catch (_) {}
          return r;
        };
      }
      if (typeof SNTasks.complete === 'function') {
        var d0 = SNTasks.complete.bind(SNTasks);
        SNTasks.complete = function () {
          var r = d0.apply(SNTasks, arguments);
          try {
            lastPaintKey = '';
            if (global.__snLiveEnRouteLayer) {
              global.__snLiveEnRouteLayer.forEach(function (Lyr) {
                try {
                  if (Lyr && Lyr.remove) Lyr.remove();
                } catch (_) {}
              });
              global.__snLiveEnRouteLayer = [];
            }
          } catch (_) {}
          return r;
        };
      }
      SNTasks._snLiveDeliveryClaimHook = true;
    } catch (_) {}
  }

  function startPoll() {
    if (pollTimer) return;
    void pullAndSync({ force: true, verbose: true });
    pollTimer = setInterval(function () {
      void pullAndSync({ force: true });
      syncOffersFromTasks();
    }, POLL_MS);
  }

  function boot() {
    hookPlaceOrder();
    hookOrderEngine();
    hookTaskTransitions();
    try {
      if (testModeOn() || (isGuest() && global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 1)) {
        void softGuestPrep({ force: false });
      }
    } catch (_) {}
    try {
      var p = posNow();
      void ensureLiveVendors(p.lat, p.lng);
    } catch (_) {}
    startPoll();
    setTimeout(function () {
      hookPlaceOrder();
      hookOrderEngine();
      hookTaskTransitions();
      void pullAndSync({ force: true, verbose: true });
    }, 2500);
    setTimeout(function () {
      void pullAndSync({ force: true });
    }, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 4000);

  global.SNChromeLiveDelivery = {
    build: BUILD,
    softGuestPrep: softGuestPrep,
    ensureLiveVendors: ensureLiveVendors,
    fillMenusFromDbVendors: fillMenusFromDbVendors,
    paintDriverEnRoute: paintDriverEnRoute,
    pullAndSync: pullAndSync,
    syncOffersFromTasks: syncOffersFromTasks,
  };
})(typeof window !== 'undefined' ? window : globalThis);
