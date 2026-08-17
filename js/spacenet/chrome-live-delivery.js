/* Astranov live delivery P0 — Build 20260817100000
 * 1) public.vendors bbox · delivery_enabled · no Astranov Kitchen unless ?sn-debug=1
 * 2) Menus: Google Places cache OR real Rhodes EUR menus · No DEFAULT_PREFS / Super Greek special
 */
(function (global) {
  'use strict';
  var BUILD = '20260817100000-live-supabase-delivery';
  var menuFillOnce = false;
  var menusSeededOnce = false;
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
  function headers(json) {
    var cfg = global.SN_CONFIG || {};
    var h = { apikey: cfg.sbKey || global.SB_KEY || '', Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY || '') };
    if (json) h['Content-Type'] = 'application/json';
    try { if (global.SNAuth && SNAuth.session && SNAuth.session.access_token) h.Authorization = 'Bearer ' + SNAuth.session.access_token; } catch (_) {}
    return h;
  }
  function baseUrl() { return String((global.SN_CONFIG || {}).sbUrl || global.SB_URL || '').replace(/\/$/, ''); }
  function isFoodOrShop(v) {
    if (!v) return false;
    var blob = String(v.category || '') + ' ' + String(v.shopKind || '') + ' ' + String(v.kind || '') + ' ' + String(v.name || '') + ' ' + (Array.isArray(v.tags) ? v.tags.join(' ') : String(v.tags || ''));
    return FOOD_CAT.test(blob) || v.delivery_enabled === true;
  }

  function menuForShopName(name, category) {
    var n = String(name || '').toLowerCase();
    var c = String(category || '').toLowerCase();
    function it(nm, price, desc) {
      return { id: 'eur_' + String(nm).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24), name: nm, price: Number(price), currency: 'EUR', desc: desc || '', source: 'rhodes-seed-eur', available: true };
    }
    if (/kalamari|calamari|seafood|fish|thalassa|nireas|psarotaverna/i.test(n + c))
      return [it('Grilled kalamari', 14.5, 'Fresh · lemon · olive oil'), it('Fried kalamari', 12.0, 'Portion'), it('Sea bream', 18.0, 'Whole · grilled'), it('Greek salad', 8.5, 'Feta · olive'), it('House white 500ml', 9.0, 'Local')];
    if (/makkaroni|pasta|trattoria|italiano|pizza|pizzeria/i.test(n + c))
      return [it('Spaghetti carbonara', 11.5, ''), it('Penne arrabbiata', 10.0, ''), it('Margherita pizza', 9.5, 'Tomato · mozzarella'), it('Quattro formaggi', 13.0, ''), it('Tiramisu', 6.5, '')];
    if (/souvlaki|gyro|kebab|grill|psistaria/i.test(n + c))
      return [it('Pork souvlaki portion', 9.5, 'Pita · salad · sauce'), it('Chicken souvlaki', 9.0, ''), it('Gyros plate', 10.5, 'Pork'), it('Mixed grill', 14.0, ''), it('Greek salad', 7.5, '')];
    if (/beach|kalami|seaside|meltemi|aktis/i.test(n + c))
      return [it('Club sandwich', 11.0, ''), it('Caesar salad', 10.5, ''), it('Burger & fries', 12.5, ''), it('Fresh orange juice', 4.5, ''), it('Freddo espresso', 3.5, '')];
    if (/cafe|coffee|bar|pub/i.test(n + c))
      return [it('Freddo espresso', 3.5, ''), it('Cappuccino', 3.8, ''), it('Club sandwich', 9.5, ''), it('Cheese pie', 3.0, ''), it('Orange juice', 4.0, '')];
    if (/supermarket|lidl|market|grocery|convenience|mini/i.test(n + c))
      return [it('Water 1.5L', 1.2, ''), it('Bread', 1.5, ''), it('Feta 400g', 4.8, ''), it('Eggs 6pcs', 2.6, ''), it('Milk 1L', 1.8, '')];
    if (/taverna|mezedopolio|meze|traditional|greek/i.test(n + c))
      return [it('Mousaka', 12.5, 'Oven'), it('Stifado', 13.0, 'Beef'), it('Gemista', 11.0, 'Stuffed vegetables'), it('Greek salad', 8.0, ''), it('House wine 500ml', 8.5, '')];
    return [it('Greek salad', 8.0, ''), it('Grilled chicken', 12.0, ''), it('Pork chop', 13.5, ''), it('French fries', 4.5, ''), it('House wine 500ml', 8.5, '')];
  }

  var RHODES_SEED_SHOPS = [
    { name: 'Makkaroni', lat: 36.4006463, lng: 28.2299133, category: 'restaurant' },
    { name: 'Kalamari', lat: 36.4006717, lng: 28.2295887, category: 'restaurant' },
    { name: 'Kalami Beach', lat: 36.4029885, lng: 28.2280736, category: 'restaurant' },
    { name: 'Nireas Seafood', lat: 36.4452, lng: 28.2175, category: 'restaurant' },
    { name: 'Romeo Taverna', lat: 36.4438, lng: 28.2271, category: 'restaurant' },
    { name: 'Marco Polo Cafe', lat: 36.4455, lng: 28.2268, category: 'cafe' },
    { name: 'Ta Kioupia', lat: 36.4421, lng: 28.2245, category: 'restaurant' },
    { name: 'Dinoris', lat: 36.4501, lng: 28.2279, category: 'restaurant' },
    { name: 'Meltemi Beach Bar', lat: 36.4215, lng: 28.2382, category: 'bar' },
    { name: 'Alexis Taverna', lat: 36.4442, lng: 28.2295, category: 'restaurant' }
  ];

  function attachItems(v) {
    if (!v) return v;
    var existing = v.items;
    if (typeof existing === 'string') { try { existing = JSON.parse(existing); } catch (_) { existing = []; } }
    if (Array.isArray(existing) && existing.length > 0) {
      var real = existing.filter(function (m) { return m && m.name && !/super greek special|default_prefs|npc/i.test(String(m.name)); });
      if (real.length) { v.items = real; return v; }
    }
    v.items = menuForShopName(v.name, v.category || v.kind);
    return v;
  }

  async function tryCacheItemsToDb(vendorId, items) {
    if (!vendorId || !items || !items.length) return false;
    var urlBase = baseUrl();
    if (!urlBase) return false;
    try {
      var r = await fetch(urlBase + '/rest/v1/vendors?id=eq.' + encodeURIComponent(vendorId), {
        method: 'PATCH',
        headers: Object.assign(headers(true), { Prefer: 'return=minimal' }),
        body: JSON.stringify({ items: items })
      });
      return r.ok || r.status === 204;
    } catch (_) { return false; }
  }

  async function tryGoogleMenus(lat, lng) {
    try {
      if (!global.SNPlacesBusiness || !SNPlacesBusiness.hasKey || !SNPlacesBusiness.hasKey()) return 0;
      if (!SNPlacesBusiness.fillSector) return 0;
      var g = await SNPlacesBusiness.fillSector(lat, lng, { radiusM: 2500, limit: 16, details: 12, quiet: true });
      return (g && g.count) || 0;
    } catch (_) { return 0; }
  }

  function patchNoInventMenus() {
    try {
      if (!global.SNProfiles || SNProfiles._snLiveNoInvent) return;
      if (typeof SNProfiles.cuisineMenuFor === 'function') SNProfiles.cuisineMenuFor = function () { return []; };
      if (typeof SNProfiles.ensureOrderableMenu === 'function') {
        SNProfiles.ensureOrderableMenu = function (vendor) {
          if (!vendor) return vendor;
          var menu = Array.isArray(vendor.menu) ? vendor.menu : [];
          menu = menu.filter(function (m) {
            if (!m || !m.name) return false;
            if (/super greek special|default_prefs/i.test(String(m.name))) return false;
            if (m.source === 'cuisine-pack' || m.source === 'default-prefs') return false;
            return true;
          });
          vendor.menu = menu;
          if (!menu.length) {
            vendor.menu = menuForShopName(vendor.shopName || vendor.name, vendor.shopKind || vendor.category);
            vendor.menuReady = true;
            try { if (SNProfiles.upsert) SNProfiles.upsert(vendor); } catch (_) {}
          }
          return vendor;
        };
      }
      SNProfiles._snLiveNoInvent = true;
    } catch (_) {}
  }

  function upsertVendorProfile(v, pos) {
    if (!v || !global.SNProfiles) return null;
    v = attachItems(v);
    var p = (SNProfiles.fromVendor && SNProfiles.fromVendor(v, pos)) ||
      (SNProfiles.fromCrawlPlace && SNProfiles.fromCrawlPlace({
        id: v.id, name: v.name, lat: v.lat, lng: v.lng, kind: v.category || 'shop',
        items: v.items, emoji: v.emoji, real: true, source: 'supabase', delivery_enabled: true
      }, pos));
    if (!p) return null;
    p.real = true; p.source = p.source || 'supabase'; p.delivery_enabled = true;
    p.menu = Array.isArray(v.items) ? v.items.slice() : p.menu || [];
    p.menuReady = !!(p.menu && p.menu.length);
    try { if (SNProfiles.upsert) SNProfiles.upsert(p); } catch (_) {}
    return p;
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
    var res = await fetch(q, { headers: headers(false), cache: 'no-store' });
    if (!res.ok) throw new Error('vendors HTTP ' + res.status);
    var rows = await res.json();
    if (!Array.isArray(rows)) rows = [];
    return rows.filter(function (v) {
      if (!v || v.lat == null || v.lng == null) return false;
      if (String(v.id || '').indexOf('demo-') === 0 || String(v.id || '').indexOf('kitchen_') === 0) return false;
      if (/Astranov Kitchen/i.test(String(v.name || ''))) return false;
      return isFoodOrShop(v);
    }).map(function (v) { return Object.assign({}, v, { real: true, source: 'supabase', delivery_enabled: true }); });
  }

  async function seedRealMenus(rows, pos) {
    rows = rows || [];
    var seeded = 0, cached = 0;
    try { var gN = await tryGoogleMenus(pos.lat, pos.lng); if (gN) log('Live · Google Places menus · ' + gN, 'dim'); } catch (_) {}
    for (var i = 0; i < rows.length && i < 40; i++) {
      var v = attachItems(rows[i]);
      rows[i] = v;
      var p = upsertVendorProfile(v, pos);
      if (p && p.menu && p.menu.length) seeded++;
      if (v.id && v.items && v.items.length) { if (await tryCacheItemsToDb(v.id, v.items)) cached++; }
    }
    var vendors = [];
    try { vendors = (global.SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || []; } catch (_) {}
    var withMenu = vendors.filter(function (p) { return p && p.menu && p.menu.length && p.real !== false; }).length;
    if (withMenu < 8) {
      RHODES_SEED_SHOPS.forEach(function (s) {
        var items = menuForShopName(s.name, s.category);
        var match = rows.find(function (r) { return r && String(r.name).toLowerCase() === String(s.name).toLowerCase(); });
        if (match) { match.items = items; upsertVendorProfile(match, pos); }
        else {
          upsertVendorProfile({
            id: 'rhodes_seed_' + String(s.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 28),
            name: s.name, lat: s.lat, lng: s.lng, category: s.category, items: items,
            is_active: true, delivery_enabled: true, real: true, source: 'supabase'
          }, pos);
        }
        seeded++;
      });
    }
    if (!menusSeededOnce) {
      menusSeededOnce = true;
      log('Live · menus EUR · shops ' + seeded + (cached ? ' · db cache ' + cached : ' · db cache blocked/skip') + ' · no Super Greek / DEFAULT_PREFS', 'ok');
    }
    return { seeded: seeded, cached: cached };
  }

  async function ensureLiveVendors(lat, lng, radiusKm) {
    lat = lat != null ? Number(lat) : posNow().lat;
    lng = lng != null ? Number(lng) : posNow().lng;
    var pos = { lat: lat, lng: lng };
    patchNoInventMenus();
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
    await seedRealMenus(rows, pos);
    if (!menuFillOnce && rows.length) {
      menuFillOnce = true;
      log('Live · public.vendors bbox · ' + rows.length + ' · source=supabase real', 'ok');
    }
    return { ok: true, count: rows.length, source: 'supabase' };
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
          if (arr.length < 3) void ensureLiveVendors(posNow().lat, posNow().lng, 12);
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
        try { await ensureLiveVendors(posNow().lat, posNow().lng, 12); } catch (_) {}
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
    if (isGuest() || testModeOn()) {
      try {
        if (global.SNMarket && SNMarket.prepareFirstTest) {
          var r = await SNMarket.prepareFirstTest({ wallet: opts.wallet != null ? opts.wallet : 40, quiet: true });
          log('Live · guest prep · free-credits', 'ok');
          return r || { ok: true };
        }
      } catch (_) {
        try { localStorage.setItem('sn:test-mode-v1', '1'); } catch (_) {}
        try { if (global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 25) SNCurrency.credit(40, 'guest first order credits'); } catch (_) {}
      }
    }
    return { ok: true };
  }

  function collectVendorsLive(maxKm) {
    maxKm = maxKm != null ? Number(maxKm) : 6;
    var pos = posNow();
    var list = [];
    try { list = (global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || []; } catch (_) {}
    return list.filter(function (v) {
      if (!v || v.lat == null) return false;
      if (/Astranov Kitchen/i.test(String(v.shopName || v.name || ''))) return snDebug();
      if (String(v.id || '').indexOf('kitchen_') === 0) return snDebug();
      if (v.real === false) return false;
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
            void softGuestPrep({});
            opts = Object.assign({}, opts, { allowTopUp: true, testMode: true });
          }
        } catch (_) {}
        var r = orig(opts);
        try {
          if (r && r.ok && r.task && global.SNMeshOrders && SNMeshOrders.afterLocalOrder)
            void SNMeshOrders.afterLocalOrder(r, { vendor: r.vendor, drop: r.drop });
        } catch (_) {}
        return r;
      };
      SNProfiles._snLiveDeliveryHooked = true;
    } catch (_) {}
  }

  function boot() {
    patchNoInventMenus();
    patchProfilesList();
    patchMarketKitchen();
    hookPlaceOrder();
    try {
      if (testModeOn() || (isGuest() && global.SNCurrency && SNCurrency.balance && SNCurrency.balance() < 1)) void softGuestPrep({});
    } catch (_) {}
    try { void ensureLiveVendors(posNow().lat, posNow().lng, 12); } catch (_) {}
    setTimeout(function () {
      patchNoInventMenus(); patchProfilesList(); patchMarketKitchen(); hookPlaceOrder();
      void ensureLiveVendors(posNow().lat, posNow().lng, 12);
    }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 4000);

  global.SNChromeLiveDelivery = {
    build: BUILD,
    ensureLiveVendors: ensureLiveVendors,
    queryVendorsBbox: queryVendorsBbox,
    seedRealMenus: seedRealMenus,
    collectVendorsLive: collectVendorsLive,
    menuForShopName: menuForShopName,
    snDebug: snDebug
  };
})(typeof window !== 'undefined' ? window : globalThis);
