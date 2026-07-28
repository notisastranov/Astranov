/* SpaceNet Commerce — real vendors from Supabase (DB-first, no demo pollution)
 * SPECS P4-M: marketplace alwaysOn 24/7/365 all locations — no platform curfew.
 */
(function (global) {
  'use strict';

  const C = {
    vendors: [],
    lastLoad: 0,
    /** Product law: platform never time-gates delivery marketplace */
    alwaysOn: true,
    hours: '24/7',
    daysPerYear: 365,
    allLocations: true,
  };

  function headers() {
    const cfg = global.SN_CONFIG || {};
    return {
      apikey: cfg.sbKey || global.SB_KEY,
      Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY),
    };
  }

  function haversineKm(a, b, c, d) {
    const R = 6371;
    const dLat = ((c - a) * Math.PI) / 180;
    const dLng = ((d - b) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  async function loadNear(lat, lng, radiusKm) {
    const cfg = global.SN_CONFIG || {};
    const urlBase = cfg.sbUrl || global.SB_URL;
    if (!urlBase || !cfg.sbKey) return [];
    lat = Number(lat);
    lng = Number(lng);
    const rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 15;
    const dLat = rKm / 111;
    const dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    const q =
      urlBase +
      '/rest/v1/vendors?select=id,osm_id,name,emoji,lat,lng,category,items,tags,is_active,delivery_enabled' +
      '&is_active=eq.true' +
      '&lat=gte.' +
      (lat - dLat) +
      '&lat=lte.' +
      (lat + dLat) +
      '&lng=gte.' +
      (lng - dLng) +
      '&lng=lte.' +
      (lng + dLng) +
      '&limit=80';
    const t0 = Date.now();
    const res = await fetch(q, { headers: headers() });
    if (!res.ok) throw new Error('vendors HTTP ' + res.status);
    let rows = await res.json();
    if (!Array.isArray(rows)) rows = [];
    rows = rows
      .filter((v) => v && v.lat != null && v.lng != null && !String(v.id || '').startsWith('demo-'))
      .map((v) => ({
        ...v,
        km: haversineKm(lat, lng, v.lat, v.lng),
        real: true,
      }))
      .sort((a, b) => a.km - b.km);
    C.vendors = rows;
    C.lastLoad = Date.now();
    global.SNCli?.log?.(
      'shops · ' + rows.length + ' real · ' + (Date.now() - t0) + 'ms · db',
      rows.length ? 'ok' : 'dim'
    );
    return rows;
  }

  function toPlaces() {
    return C.vendors.map((v) => ({
      name: v.name,
      lat: v.lat,
      lng: v.lng,
      kind: v.category || 'shop',
      source: 'supabase',
      id: v.id,
      emoji: v.emoji,
      real: true,
    }));
  }

  /**
   * Load real shops. Default: keep full GLOBAL Earth (no auto city map).
   * opts.openMap: true only when user asked (city / shops / locate path).
   */
  async function populateMap(lat, lng, opts) {
    opts = opts || {};
    const openMap = opts.openMap === true;
    const pos = {
      lat: lat != null ? lat : global._snLastPos?.lat || global.SNTasks?.pos?.lat || 36.4341,
      lng: lng != null ? lng : global._snLastPos?.lng || global.SNTasks?.pos?.lng || 28.2176,
    };
    global._snLastPos = pos;
    try {
      global.SNTasks?.setPos?.(pos.lat, pos.lng);
    } catch (_) {}

    let rows = [];
    try {
      rows = await loadNear(pos.lat, pos.lng, 15);
    } catch (e) {
      global.SNCli?.log?.('shops db fail · ' + (e.message || e), 'err');
      return { ok: false, count: 0, error: String(e.message || e) };
    }

    // Profile/crawl data always; city map only if already open or user asked
    rows.slice(0, 40).forEach((v) => {
      try {
        global.SNProfiles?.fromCrawlPlace?.(
          { name: v.name, lat: v.lat, lng: v.lng, kind: v.category || 'shop' },
          pos
        );
      } catch (_) {}
    });

    if (openMap || global.SNMap?.active) {
      try {
        if (!global.SNMap?.active) await global.SNMap?.open?.(pos.lat, pos.lng);
        else {
          const map = await global.SNMap.ensure?.();
          map?.setView?.([pos.lat, pos.lng], 14);
        }
      } catch (_) {}
      global.SNMap?.plotCrawl?.(toPlaces());
      global.SNMap?.showProfiles?.();
    }

    // Globe pulses keep full-Earth default useful without stealing the view
    rows.slice(0, 12).forEach((v, i) => {
      try {
        global.SNGlobe?.pulse?.(v.lat, v.lng, i === 0 ? 0x44ffaa : 0x3d9eff, v.name, 18000);
      } catch (_) {}
    });

    return { ok: rows.length > 0, count: rows.length, source: 'db', lat: pos.lat, lng: pos.lng };
  }

  global.SNCommerce = {
    loadNear,
    populateMap,
    toPlaces,
    haversineKm,
    alwaysOn: true,
    hours: '24/7',
    daysPerYear: 365,
    allLocations: true,
    get vendors() {
      return C.vendors;
    },
    get lastLoad() {
      return C.lastLoad;
    },
  };
})(window);
