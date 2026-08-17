/* Astranov live delivery P0 — Build 20260817095500
 * public.vendors bbox · delivery_enabled · is_active · food/shop
 * source=supabase real=true · No Astranov Kitchen unless ?sn-debug=1
 */
(function (global) {
  'use strict';
  var BUILD = '20260817095500-live-supabase-delivery';
  var POLL_MS = 14000;
  var guestPrepDone = false;
  var lastPaintKey = '';
  var pollTimer = null;
  var menuFillOnce = false;
  var FOOD_CAT = /restaurant|fast_food|cafe|bar|pub|food|pizza|bakery|supermarket|convenience|grocery|shop|market|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert/i;

  function log(m, c) { try { if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim'); } catch (_) {} }
  function snDebug() { try { return /(?:\?|&)sn-debug=1(?:&|$)/.test(String(location.search || '')); } catch (_) { return false; } }
  function isGuest() {
    try {
      if (global.SNAuth && typeof SNAuth.isLoggedIn === 'function' && SNAuth.isLoggedIn()) return false;
      if (global.SNAuth && SNAuth.session && SNAuth.session.user) return false;
      if (global.SNAuth && SNAuth.user) return false;
    } catch (_) {}
    return true;
  }
  function testModeOn() { try { return localStorage.getItem('sn:test-mode-v1') === '1'; } catch (_) { return false; } }
  function posNow() {
    return global._snLastPos || (global.SNTasks && SNTasks.pos) || (global.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) || { lat: 36.4341, lng: 28.2176 };
  }
  function headers() {
    var cfg = global.SN_CONFIG || {};
    var h = { apikey: cfg.sbKey || global.SB_KEY || '', Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY || '') };
    try { if (global.SNAuth && SNAuth.session && SNAuth.session.access_token) h.Authorization = 'Bearer ' + SNAuth.session.access_token; } catch (_) {}
    return h;
  }
  function baseUrl() { return String((global.SN_CONFIG || {}).sbUrl || global.SB_URL || '').replace(/\/$/, ''); }
  function isFoodOrShop(v) {
    if (!v) return false;
    var blob = String(v.category || '') + ' ' + String(v.shopKind || '') + ' ' + String(v.kind || '') + ' ' + String(v.name || '') + ' ' + (Array.isArray(v.tags) ? v.tags.join(' ') : String(v.tags || ''));
    return FOOD_CAT.test(blob) || v.delivery_enabled === true;
  }

  async function queryVendorsBbox(lat, lng, radiusKm) {
    var urlBase = baseUrl();
    if (!urlBase) return [];
    lat = Number(lat); lng = Number(lng);
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 12;
    var dLat = rKm / 111;
    var dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    var q = urlBase + '/rest/v1/vendors?select=id,osm_id,name,emoji,lat,lng,category,items,tags,is_active,delivery_enabled'
      + '&is_active=eq.true&delivery_enabled=eq.true'
      + '&lat=gte.' + (lat - dLat) + '&lat=lte.' + (lat + dLat)
      + '&lng=gte.' + (lng - dLng) + '&lng=lte.' + (lng + dLng) + '&limit=100';
    var res = await fetch(q, { headers: headers(), cache: 'no-store' });
    if (!res.ok) throw new Error('vendors HTTP ' + res.status);
    var rows = await res.json();
    if (!Array.isArray(rows)) rows = [];
    return rows.filter(function (v) {
      if (!v || v.lat == null || v.lng == null) return false;
      if (String(v.id || '').indexOf('demo-') === 0 || String(v.id || '').indexOf('kitchen_') === 0) return false;
      if (/Astranov Kitchen/i.test(String(v.name || ''))) return false;
      return isFoodOrShop(v);
    }).map(function (v) {
      return Object.assign({}, v, { real: true, source: 'supabase', delivery_enabled: true });
    });
  }

  function fillMenusFromDbVendors(rows, pos) {
    if (!rows || !rows.length || !global.SNProfiles) return 0;
    var n = 0, filled = 0;
    rows.slice(0, 80).forEach(function (v) {
      if (!v || v.lat == null) return;
      try {
        var p = (SNProfiles.fromVendor && SNProfiles.fromVendor(v, pos)) ||
          (SNProfiles.fromCrawlPlace && SNProfiles.fromCrawlPlace({
            id: v.id, name: v.name, lat: v.lat, lng: v.lng, kind: v.category || 'shop',
            items: v.items, emoji: v.emoji, real: true, source: 'supabase', delivery_enabled: true
          }, pos));
        if (!p) return;
        try { p.real = true; p.source = 'supabase'; p.delivery_enabled = true; if (SNProfiles.upsert) SNProfiles.upsert(p); } catch (_) {}
        n++;
        var before = (p.menu && p.menu.length) || 0;
        if (SNProfiles.ensureOrderableMenu) p = SNProfiles.ensureOrderableMenu(p) || p;
        if (p.menu && p.menu.length > before) filled++;
      } catch (_) {}
    });
    if (!menuFillOnce && n) {
      menuFillOnce = true;
      log('Live · public.vendors bbox · ' + n + ' · menus local ' + filled + ' · source=supabase real', 'ok');
    }
    return n;
  }

  async function ensureLiveVendors(lat, lng, radiusKm) {
    lat = lat != null ? Number(lat) : posNow().lat;
    lng = lng != null ? Number(lng) : posNow().lng;
    var pos = { lat: lat, lng: lng };
    var rows = [];
    try { rows = await queryVendorsBbox(lat, lng, radiusKm || 12); }
    catch (e) {
      log('Live vendors query · ' + (e && e.message ? e.message : e), 'dim');
      try {
        if (global.SNCommerce && SNCommerce.loadNear) {
          rows = ((await SNCommerce.loadNear(lat, lng, radiusKm || 12)) || []).filter(function (v) {
            return v && v.delivery_enabled !== false && isFoodOrShop(v);
          });
        }
      } catch (_) {}
    }
    if (rows.length) {
      fillMenusFromDbVendors(rows, pos);
      return { ok: true, count: rows.length, source: 'supabase', menusLocal: true };
    }
    return { ok: false, count: 0, source: 'supabase' };
  }

  function patchProfilesList() {
    try {
      if (!global.SNProfiles || !SNProfiles.list || SNProfiles._snLiveListPatched) return;
      var orig = SNProfiles.list.bind(SNProfiles);
      SNProfiles.list = function (filter) {
        filter = filter || {};
        var arr = orig(filter) || [];
        if (filter.role === 'vendor') {
          arr = arr.filter(function (p) {
            if (!p) return false;
            if (/Astranov Kitchen/i.test(String(p.shopName || p.name || ''))) return snDebug();
            if (String(p.id || '').indexOf('kitchen_') === 0) return snDebug();
            if (p.source === 'astranov-kitchen-test') return snDebug();
            if (p.real === false) return false;
            return true;
          });
          if (arr.length < 3) {
            var p = posNow();
            void ensureLiveVendors(p.lat, p.lng, 12);
          }
        }
        return arr;
      };
      SNProfiles._snLiveListPatched = true;
    } catch (_) {}
  }

  function patchMarketKitchen() {
    try {
      if (!global.SNMarket || SNMarket._snLiveKitchenPatched) return;
      if (typeof SNMarket.fulfillFoodIntent !== 'function') return;
      var ful = SNMarket.fulfillFoodIntent.bind(SNMarket);
      SNMarket.fulfillFoodIntent = async function (q, opts) {
        opts = opts || {};
        var p = posNow();
        try { await ensureLiveVendors(p.lat, p.lng, 12); } catch (_) {}
        if (!snDebug()) {
          opts = Object.assign({}, opts, { testMode: false });
          try {
            ((global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || []).forEach(function (v) {
              if (v && (/Astranov Kitchen/i.test(String(v.shopName || v.name || '')) || String(v.id || '').indexOf('kitchen_') === 0 || v.source === 'astranov-kitchen-test')) {
                try {
                  if (SNProfiles.remove) SNProfiles.remove(v.id);
                  else if (SNProfiles.upsert) { v.roles = v.roles || {}; v.roles.vendor = false; SNProfiles.upsert(v); }
                } catch (_) {}
              }
            });
          } catch (_) {}
        }
        return ful(q, opts);
      };
      SNMarket._snLiveKitchenPatched = true;
    } catch (_) {}
  }

  async function softGuestPrep(opts) {
    opts = opts || {};
    if (guestPrepDone && !opts.force) return { ok: true, already: true };
    if (!isGuest() && !opts.force && !testModeOn()) return { ok: true, skipped: 'signed-in live' };
    guestPrepDone = true;
    try {
      if (global.SNMarket && typeof SNMarket.prepareFirstTest === 'function') {
        var r = await SNMarket.prepareFirstTest({ wallet: opts.wallet != null ? opts.wallet : 40, quiet: true });
        if (!snDebug()) {
          try {
            ((global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || []).forEach(function (v) {
              if (v && (/Astranov Kitchen/i.test(String(v.shopName || v.name || '')) || String(v.id || '').indexOf('kitchen_') === 0)) {
                try { if (SNProfiles.remove) SNProfiles.remove(v.id); } catch (_) {}
              }
            });
          } catch (_) {}
        }
        log('Live · guest prep · free-credits · ' + (r && r.ready ? 'ready' : 'partial'), r && r.ready ? 'ok' : 'dim');
        return r || { ok: true };
      }
    } catch (e) {
      try { localStorage.setItem('sn:test-mode-v1', '1'); } catch (_) {}
      try { if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 25) SNCurrency.credit(40, 'guest first order credits'); } catch (_) {}
      return { ok: true, soft: true };
    }
    try { localStorage.setItem('sn:test-mode-v1', '1'); } catch (_) {}
    return { ok: true, flagOnly: true };
  }

  function collectVendorsLive(maxKm) {
    maxKm = maxKm != null ? Number(maxKm) : 6;
    var pos = posNow();
    var list = [];
    try { list = (global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || []; } catch (_) {}
    return list.filter(function (v) {
      if (!v || v.lat == null || v.lng == null) return false;
      if (/Astranov Kitchen/i.test(String(v.shopName || v.name || ''))) return snDebug();
      if (String(v.id || '').indexOf('kitchen_') === 0) return snDebug();
      if (v.source === 'astranov-kitchen-test') return snDebug();
      if (v.real === false) return false;
      if (!isFoodOrShop(v) && v.source !== 'supabase') return false;
      var R = 6371;
      var dLat = ((v.lat - pos.lat) * Math.PI) / 180;
      var dLng = ((v.lng - pos.lng) * Math.PI) / 180;
      var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((pos.lat * Math.PI) / 180) * Math.cos((v.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) <= maxKm;
    });
  }

  function hookPlaceOrder() {
    try {
      if (!global.SNProfiles || !SNProfiles.placeOrder || SNProfiles._snLiveDeliveryHooked) return;
      var orig = SNProfiles.placeOrder.bind(SNProfiles);
      SNProfiles.placeOrder = function (opts) {
        opts = opts || {};
        try {
          if ((isGuest() || testModeOn()) && global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 5) {
            void softGuestPrep({ force: false });
            opts = Object.assign({}, opts, { allowTopUp: true, testMode: true });
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
            if (global.SNMeshOrders && SNMeshOrders.afterLocalOrder) void SNMeshOrders.afterLocalOrder(r, { vendor: r.vendor, drop: r.drop });
            if (global.SNOfferStack && SNOfferStack.onOrderResult) SNOfferStack.onOrderResult(r, { vendor: r.vendor });
            if (r.drop && r.drop.lat != null) void ensureLiveVendors(r.drop.lat, r.drop.lng);
          }
        } catch (_) {}
        return r;
      };
      SNProfiles._snLiveDeliveryHooked = true;
    } catch (_) {}
  }

  function boot() {
    patchProfilesList();
    patchMarketKitchen();
    hookPlaceOrder();
    try {
      if (testModeOn() || (isGuest() && global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 1))
        void softGuestPrep({ force: false });
    } catch (_) {}
    try { var p = posNow(); void ensureLiveVendors(p.lat, p.lng, 12); } catch (_) {}
    setTimeout(function () {
      patchProfilesList(); patchMarketKitchen(); hookPlaceOrder();
      void ensureLiveVendors(posNow().lat, posNow().lng, 12);
    }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 4000);

  global.SNChromeLiveDelivery = {
    build: BUILD,
    softGuestPrep: softGuestPrep,
    ensureLiveVendors: ensureLiveVendors,
    queryVendorsBbox: queryVendorsBbox,
    fillMenusFromDbVendors: fillMenusFromDbVendors,
    collectVendorsLive: collectVendorsLive,
    snDebug: snDebug,
  };
})(typeof window !== 'undefined' ? window : globalThis);
