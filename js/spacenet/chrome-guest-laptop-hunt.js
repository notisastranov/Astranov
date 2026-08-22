/**
 * Guest laptop hunt — Build 20260823013000-laptop-hunt
 * NEW PR against main. Never edit chrome-guest-pizza-hunt.js (#127).
 *
 * Guest types `laptop` / `buy a laptop` / `laptops`:
 *   (1) Honestly fly to the guest locate if GPS is known this session;
 *       otherwise stay where the view is. Never yank to a false city.
 *       If the current view is Rhodes after kalithea, hunt THAT place.
 *   (2) Hunt REAL electronics / computer shops near the live view
 *       (OSM Overpass + Nominatim + public.vendors electronics).
 *       Pulse UNIQUE pins at each shop's own lat/lng (parent onto
 *       getEarth() at latLngToVec(lat,lng,1.012) — not one pile).
 *   (3) Overlay tap → Shop · name · km · ⭐, consumeClick, no diveInAt,
 *       must not fling the camera.
 *   (4) Google only at pay / HOLD ⭐. No paywall before pay.
 *   (5) No fake DRIVER EN ROUTE. No me-av for guests.
 *   (6) Hunt or fly fail → say so honestly, empty pins, never fake results.
 *
 * Reuses #127 hunt/projection: prefer SNGlobe.flyGlobeTo when already
 * defined; else attach the same probe-sign helper (do NOT overwrite).
 * Overlay #sn-laptop-pins (not #sn-pizza-pins).
 *
 * Product law: if it is not on the globe it is not shipped.
 */
(function (G) {
  'use strict';
  if (G.__snGuestLaptopHunt20260823013000) return;
  G.__snGuestLaptopHunt20260823013000 = 1;

  var BUILD = '20260823013000-laptop-hunt';
  var hunting = false;
  var huntSession = false;
  var lastPins = [];
  var pinMeshes = [];
  var earthPinMeshes = [];
  var clickUnsub = null;
  var askedLocate = false;
  var suppressPoiUntil = 0;
  var canvasTapBound = false;
  var lastFly = null;
  var lastProbe = { sLat: 0, sLng: 0 };
  var overlayRaf = 0;
  var lastOverlaySpread = 0;
  var lastWorldDistinct = false;
  var cliWrap = null;
  var huntFailed = false;

  var SETTLE_DEG = 0.15;
  var HUNT_KM = 16.5;
  var PIN_MS = 180000;
  var PIN_COLOR_A = 0x7ee9ff;
  var PIN_COLOR_B = 0xb48eff;
  var KALITHEA = { lat: 36.387557, lng: 28.222533 };
  var RHODES = { lat: 36.44, lng: 28.22, name: 'Rhodes' };
  var RHODES_BOX = { latMin: 35.82, latMax: 36.52, lngMin: 27.62, lngMax: 28.42 };

  var PLACES = [
    { name: 'Rhodes', latMin: 35.82, latMax: 36.52, lngMin: 27.62, lngMax: 28.42 },
    { name: 'Nairobi', latMin: -1.7, latMax: -0.9, lngMin: 36.5, lngMax: 37.1 },
    { name: 'Athens', latMin: 37.85, latMax: 38.15, lngMin: 23.6, lngMax: 23.9 },
    { name: 'SanJose', latMin: 37.2, latMax: 37.45, lngMin: -122.05, lngMax: -121.75 },
  ];

  var FAKE_YOU = [
    { lat: 36.387557, lng: 28.222533, r: 0.03, name: 'Kalithea' },
    { lat: 36.434, lng: 28.217, r: 0.06, name: 'Rhodes silent' },
    { lat: 36.43, lng: 28.22, r: 0.05, name: 'Rhodes center' },
    { lat: 36.443, lng: 28.226, r: 0.04, name: 'Rhodes town' },
    { lat: 37.339, lng: -121.895, r: 0.12, name: 'San Jose IP' },
    { lat: 37.338, lng: -121.886, r: 0.12, name: 'Columbus Park' },
    { lat: 37.33, lng: -121.89, r: 0.12, name: 'San Jose' },
  ];

  var TECH =
    /electronics|computer|laptop|notebook|macbook|pc\b|desktop|notebook|smartphone|mobile_phone|mobile phone|hifi|hi-fi|telecom|telecommunication|plaisio|kotsovolos|germanos|media\s*markt|best\s*buy|currys|fnac|saturn|apple\s*store|microsoft|public\b|multirama|electro\b|tech\s*shop|computer_shop|computershop/i;
  var TECH_SHOP_OSM = /^(computer|electronics|mobile_phone|hifi|telecommunication|appliance)$/i;
  var FOOD_BLOCK =
    /restaurant|fast_food|cafe|bar|pub|pizza|pizzeria|bakery|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert/i;
  var FAKE_OPS_RE = /DRIVER\s+EN\s+ROUTE|SEEKING\s+DRIVER|\bme-av\b|\bme_av\b|\bmeav\b/i;
  var POI_DUMP_RE =
    /Πλατεία|Πλατεια|πλατεία|\b\d+\s+POIs?\b|\b\d+\s+real shops\b|80 real shops|18 POIs/i;
  var LAPTOP_RE =
    /^(laptop|laptops|buy\s+(a\s+)?laptop|buy\s+laptops|order\s+(me\s+)?(a\s+)?laptop|get\s+(me\s+)?(a\s+)?laptop|find\s+(a\s+)?laptop|i\s+want\s+(a\s+)?laptop|need\s+(a\s+)?laptop)$/i;

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function log(m, c) {
    try {
      var s = String(m == null ? '' : m).slice(0, 420);
      if (FAKE_OPS_RE.test(s)) return;
      if (POI_DUMP_RE.test(s) && globeOnly()) return;
      if (G.SNCli && SNCli.log) SNCli.log(s, c || 'ok', true);
    } catch (_) {}
  }

  function preview(m) {
    try {
      if (G.SNCli && SNCli.preview) SNCli.preview(String(m).slice(0, 90));
    } catch (_) {}
  }

  function isGuest() {
    try {
      if (G.SNAuth && typeof SNAuth.isLoggedIn === 'function' && SNAuth.isLoggedIn()) return false;
      if (G.SNAuth && SNAuth.session && SNAuth.session.user) return false;
      if (G.SNAuth && SNAuth.user) return false;
    } catch (_) {}
    return true;
  }

  function snDebug() {
    try {
      return /(?:\?|&)sn-debug=1(?:&|$)/.test(String(location.search || ''));
    } catch (_) {
      return false;
    }
  }

  function globeOnly() {
    return hunting || huntSession;
  }

  function unwrapDeg(d) {
    d = Number(d);
    if (!isFinite(d)) return 0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function lngDelta(a, b) {
    return Math.abs(unwrapDeg(Number(a) - Number(b)));
  }

  function axisSign(d) {
    d = Number(d);
    if (!isFinite(d) || d === 0) return 0;
    return d > 0 ? 1 : -1;
  }

  function fmtSignedDeg(n) {
    n = Number(n);
    if (!isFinite(n)) return '?';
    return n.toFixed(3);
  }

  function fmtLiveLL(ll) {
    if (!ll || ll.lat == null || !isFinite(ll.lat)) return '?, ?';
    return fmtSignedDeg(ll.lat) + ', ' + fmtSignedDeg(ll.lng);
  }

  function inBox(lat, lng, box) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng) || !box) return false;
    var lngN = unwrapDeg(lng);
    return lat >= box.latMin && lat <= box.latMax && lngN >= box.lngMin && lngN <= box.lngMax;
  }

  function inRhodes(lat, lng) {
    return inBox(lat, lng, RHODES_BOX);
  }

  function placeOf(lat, lng) {
    var i;
    for (i = 0; i < PLACES.length; i++) {
      if (inBox(lat, lng, PLACES[i])) return PLACES[i].name;
    }
    return null;
  }

  function nearFake(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return true;
    for (var i = 0; i < FAKE_YOU.length; i++) {
      var f = FAKE_YOU[i];
      if (Math.abs(lat - f.lat) <= f.r && Math.abs(lng - f.lng) <= f.r) return f.name;
    }
    return null;
  }

  function isKalitheaCoord(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return false;
    return Math.abs(+lat - KALITHEA.lat) <= 0.0008 && Math.abs(+lng - KALITHEA.lng) <= 0.0008;
  }

  function isIpOrSoftSource(pos) {
    if (!pos) return true;
    if (pos.fallback) return true;
    if (pos.fromIp || pos.ip || pos.soft) return true;
    var src = String(pos.source || pos.from || '').toLowerCase();
    if (!src) return false;
    return /ip|soft|cache|leaflet|map|geocode|city|nominatim|photon|approx|look|verified/.test(src);
  }

  function gpsAtKalithea() {
    try {
      var p = G._snPhysPos;
      if (!p || p.lat == null || p.lng == null) return false;
      if (isIpOrSoftSource(p)) return false;
      var src = String(p.source || '').toLowerCase();
      var granted =
        p.fromGps === true || p.real === true || src === 'gps' || src === 'gps-watch';
      if (!granted) return false;
      return isKalitheaCoord(p.lat, p.lng);
    } catch (_) {
      return false;
    }
  }

  function hasSessionLocate() {
    try {
      if (!G._snLocatedThisSession) return false;
    } catch (_) {
      return false;
    }
    try {
      var p = G._snPhysPos;
      if (!p || p.lat == null || p.lng == null) return false;
      var lat = +p.lat;
      var lng = +p.lng;
      if (!isFinite(lat) || !isFinite(lng)) return false;
      if (nearFake(lat, lng)) return false;
      if (isIpOrSoftSource(p)) return false;
      var src = String(p.source || '').toLowerCase();
      var granted =
        p.fromGps === true ||
        p.real === true ||
        p.session === true ||
        src === 'gps' ||
        src === 'gps-watch';
      if (!granted) return false;
      return true;
    } catch (_) {}
    return false;
  }

  function markSessionLocate(lat, lng, extra) {
    extra = extra || {};
    if (extra.fallback || extra.fromIp || extra.ip || extra.soft) return;
    if (isIpOrSoftSource(extra)) return;
    if (nearFake(+lat, +lng)) return;
    try {
      G._snLocatedThisSession = true;
      var row = {
        lat: +lat,
        lng: +lng,
        fromGps: true,
        session: true,
        real: true,
        fallback: false,
        source: 'gps',
        ts: Date.now(),
        accuracy: extra.accuracy,
      };
      G._snPhysPos = row;
      G._snLastPos = row;
    } catch (_) {}
  }

  function scrubFakeYou() {
    try {
      var p = G._snPhysPos;
      if (!p) {
        G._snLocatedThisSession = false;
        return;
      }
      if (nearFake(+p.lat, +p.lng) || isIpOrSoftSource(p)) {
        G._snLocatedThisSession = false;
      }
    } catch (_) {}
  }

  function noMeAv() {
    if (!isGuest()) return;
    try {
      ['sn-me-av', 'sn-meav', 'sn-you-av', 'sn-guest-me'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    } catch (_) {}
    try {
      var nodes = document.querySelectorAll(
        '[data-sn-me-av], .sn-me-av, .sn-meav, .sn-you-pin, .sn-driver-en-route'
      );
      for (var i = 0; i < nodes.length; i++) {
        try {
          nodes[i].remove();
        } catch (_) {}
      }
    } catch (_) {}
  }

  function liveViewLatLng() {
    try {
      if (!G.SNGlobe || typeof SNGlobe.viewLatLng !== 'function') return null;
      var v = SNGlobe.viewLatLng();
      if (!v || v.lat == null || !isFinite(v.lat) || !isFinite(v.lng)) return null;
      return { lat: +v.lat, lng: +v.lng };
    } catch (_) {
      return null;
    }
  }

  function cameraLook() {
    var live = liveViewLatLng();
    if (live) return live;
    try {
      if (G.SNGlobe && typeof SNGlobe.focusPos === 'function') {
        var f = SNGlobe.focusPos();
        if (f && f.lat != null && isFinite(f.lat)) return { lat: +f.lat, lng: +f.lng };
      }
    } catch (_) {}
    try {
      if (G._snGlobeFocus && G._snGlobeFocus.lat != null) {
        return { lat: +G._snGlobeFocus.lat, lng: +G._snGlobeFocus.lng };
      }
    } catch (_) {}
    if (lastFly && lastFly.lat != null && Date.now() - lastFly.ts < 20000) {
      return { lat: lastFly.lat, lng: lastFly.lng };
    }
    return null;
  }

  function viewNear(targetLat, targetLng, tolLat, tolLng) {
    tolLat = tolLat != null ? tolLat : SETTLE_DEG;
    tolLng = tolLng != null ? tolLng : SETTLE_DEG;
    var ll = liveViewLatLng();
    if (!ll) return false;
    return Math.abs(+ll.lat - targetLat) < tolLat && lngDelta(ll.lng, targetLng) < tolLng;
  }

  function isGlobeReady() {
    try {
      if (G.SNGlobe && G.SNGlobe.ready === true) return true;
      if (G.SNGlobe && typeof SNGlobe.pulse === 'function') return true;
      if (G.SNGlobe && typeof SNGlobe.getEarth === 'function' && SNGlobe.getEarth()) return true;
    } catch (_) {}
    return false;
  }

  async function waitGlobeReady(ms) {
    var t0 = Date.now();
    var limit = typeof ms === 'number' && ms > 0 ? ms : 2400;
    try {
      if (G.SNGlobe && typeof SNGlobe.init === 'function') SNGlobe.init();
    } catch (_) {}
    while (Date.now() - t0 < limit) {
      if (isGlobeReady()) return true;
      await sleep(90);
    }
    return isGlobeReady();
  }

  /**
   * Origin for bbox hunt.
   *   1) real YOU only if located THIS session (GPS grant)
   *   2) current camera look-at (Rhodes after kalithea stays Rhodes)
   * NEVER invent Kalithea / silent Rhodes / San Jose IP as you.
   * NEVER trust bare _snLastPos (setFocus / Leaflet / IP pollute it).
   */
  function resolveOrigin() {
    scrubFakeYou();
    try {
      if (hasSessionLocate() && G._snPhysPos && G._snPhysPos.lat != null) {
        var plat = +G._snPhysPos.lat;
        var plng = +G._snPhysPos.lng;
        if (isFinite(plat) && isFinite(plng) && !nearFake(plat, plng) && !isIpOrSoftSource(G._snPhysPos)) {
          return { lat: plat, lng: plng, source: 'you' };
        }
      }
    } catch (_) {}
    var cam = cameraLook();
    if (cam) return { lat: cam.lat, lng: cam.lng, source: 'camera' };
    try {
      if (G.SNGlobe && typeof SNGlobe.focusPos === 'function') {
        var f = SNGlobe.focusPos();
        if (f && f.lat != null && f.lng != null && isFinite(f.lat)) {
          return { lat: +f.lat, lng: +f.lng, source: 'focus' };
        }
      }
    } catch (_) {}
    try {
      if (G._snGlobeFocus && G._snGlobeFocus.lat != null) {
        return { lat: +G._snGlobeFocus.lat, lng: +G._snGlobeFocus.lng, source: 'focus-cache' };
      }
    } catch (_) {}
    return null;
  }

  function baseUrl() {
    return String((G.SN_CONFIG && SN_CONFIG.sbUrl) || G.SB_URL || '').replace(/\/$/, '');
  }

  function headers() {
    var cfg = G.SN_CONFIG || {};
    var h = {
      apikey: cfg.sbKey || G.SB_KEY || '',
      Authorization: 'Bearer ' + (cfg.sbKey || G.SB_KEY || ''),
      Accept: 'application/json',
    };
    try {
      if (G.SNAuth && SNAuth.session && SNAuth.session.access_token)
        h.Authorization = 'Bearer ' + SNAuth.session.access_token;
    } catch (_) {}
    return h;
  }

  function haversineKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return 9999;
    var R = 6371;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function isBannedName(name) {
    var n = String(name || '');
    if (/Astranov\s*Kitchen/i.test(n)) return true;
    if (/Mesh\s*Alpha|Mesh\s*Beta|Mesh\s*Gamma/i.test(n)) return true;
    if (/Rai\s*Mesone|Rai\s*drone/i.test(n)) return true;
    if (/85[\s\-]?pt|DRIVER\s+EN\s+ROUTE|SEEKING\s+DRIVER/i.test(n)) return true;
    if (/Πλατεία|Πλατεια|πλατεία/i.test(n)) return true;
    if (/\bme-av\b|\bme_av\b|\bmeav\b/i.test(n)) return true;
    if (/^you$|^me$/i.test(n)) return true;
    return false;
  }

  function shopBlob(v) {
    return (
      String((v && v.category) || '') +
      ' ' +
      String((v && v.shopKind) || '') +
      ' ' +
      String((v && v.shop) || '') +
      ' ' +
      String((v && v.kind) || '') +
      ' ' +
      String((v && v.name) || '') +
      ' ' +
      (Array.isArray(v && v.tags) ? v.tags.join(' ') : String((v && v.tags) || ''))
    );
  }

  function isElectronicsShop(v) {
    if (!v) return false;
    if (isBannedName(v.name)) return false;
    if (String(v.id || '').indexOf('demo-') === 0 || String(v.id || '').indexOf('kitchen_') === 0)
      return false;
    var blob = shopBlob(v);
    if (FOOD_BLOCK.test(blob) && !TECH.test(blob)) return false;
    if (v.shop && TECH_SHOP_OSM.test(String(v.shop))) return true;
    return TECH.test(blob);
  }

  function hideLeaflet() {
    try {
      if (G.SNMap && typeof SNMap.close === 'function') SNMap.close();
    } catch (_) {}
    try {
      if (G.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}
    try {
      var nodes = document.querySelectorAll(
        '.leaflet-container, .leaflet-pane, .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-control-container, #sn-map, #sn-map-root, #map'
      );
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('z-index', '-1', 'important');
      }
    } catch (_) {}
  }

  function globeCanvas() {
    try {
      var ren = G.SNGlobe && typeof SNGlobe.getRenderer === 'function' ? SNGlobe.getRenderer() : null;
      if (ren && ren.domElement) return ren.domElement;
    } catch (_) {}
    try {
      return document.querySelector('#globe canvas') || document.querySelector('#globe');
    } catch (_) {}
    return null;
  }

  function releasePointer(el) {
    if (!el) return;
    try {
      var opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true };
      try {
        el.dispatchEvent(new PointerEvent('pointerup', opts));
      } catch (_) {
        try {
          el.dispatchEvent(new Event('pointerup', { bubbles: true, cancelable: true }));
        } catch (__) {}
      }
      try {
        el.dispatchEvent(new PointerEvent('pointercancel', opts));
      } catch (_) {
        try {
          el.dispatchEvent(new Event('pointercancel', { bubbles: true, cancelable: true }));
        } catch (__) {}
      }
      try {
        if (typeof el.releasePointerCapture === 'function') el.releasePointerCapture(1);
      } catch (_) {}
      try {
        el.dispatchEvent(new Event('lostpointercapture', { bubbles: true }));
      } catch (_) {}
    } catch (_) {}
  }

  function dispatchCanvasPointerCancel() {
    try {
      releasePointer(globeCanvas());
    } catch (_) {}
  }

  function callStopMotion() {
    try {
      if (G.SNGlobe && typeof SNGlobe.stopMotion === 'function') SNGlobe.stopMotion();
    } catch (_) {}
  }

  function callZeroInertia() {
    try {
      if (G.SNGlobe && typeof SNGlobe.zeroInertia === 'function') SNGlobe.zeroInertia();
    } catch (_) {}
    try {
      var p = G.SNGlobe && typeof SNGlobe.getPhysics === 'function' ? SNGlobe.getPhysics() : null;
      if (p) {
        p.vTilt = 0;
        p.vSpin = 0;
        p.tTilt = null;
        p.tSpin = null;
      }
    } catch (_) {}
  }

  function unfreezeGlobe() {
    try {
      if (G.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}
    dispatchCanvasPointerCancel();
    callStopMotion();
    callZeroInertia();
    hideLeaflet();
  }

  function paintGlobe() {
    try {
      if (G.SNGlobe && typeof SNGlobe.paint === 'function') SNGlobe.paint();
    } catch (_) {}
  }

  function nodeIsSceneOrCam(n) {
    if (!n) return true;
    try {
      if (n.isScene || n.type === 'Scene') return true;
      if (n.isCamera || (n.type && String(n.type).indexOf('Camera') >= 0)) return true;
    } catch (_) {}
    return false;
  }

  function walkEarthChain() {
    var out = { nodes: [], names: [] };
    try {
      if (!G.SNGlobe || typeof SNGlobe.getEarth !== 'function') return out;
      var n = SNGlobe.getEarth();
      var hops = 0;
      while (n && hops < 14) {
        out.nodes.push(n);
        var nm = 'obj';
        try {
          if (n.name) nm = String(n.name);
          else if (n.type) nm = String(n.type);
          else if (n.isMesh) nm = 'Mesh';
          else if (n.isScene) nm = 'Scene';
          else if (n.isCamera) nm = 'Camera';
          else nm = 'Object3D';
        } catch (_) {}
        out.names.push(String(nm).slice(0, 28));
        try {
          n = n.parent;
        } catch (_) {
          n = null;
        }
        hops++;
      }
    } catch (_) {}
    return out;
  }

  function tiltSpinNodes() {
    var out = { earth: null, spin: null, tilt: null };
    try {
      if (!G.SNGlobe || typeof SNGlobe.getEarth !== 'function') return out;
      var earth = SNGlobe.getEarth();
      out.earth = earth;
      if (!earth) return out;
      var spin = earth.parent;
      var tilt = spin ? spin.parent : null;
      if (spin && !nodeIsSceneOrCam(spin)) out.spin = spin;
      if (tilt && !nodeIsSceneOrCam(tilt)) out.tilt = tilt;
      if (!out.tilt && typeof SNGlobe.getTilt === 'function') out.tilt = SNGlobe.getTilt();
      if (!out.spin && typeof SNGlobe.getSpin === 'function') out.spin = SNGlobe.getSpin();
    } catch (_) {}
    return out;
  }

  function paintTiltSpin(nodes) {
    nodes = nodes || tiltSpinNodes();
    try {
      if (nodes.tilt && nodes.tilt.updateMatrixWorld) nodes.tilt.updateMatrixWorld(true);
    } catch (_) {}
    try {
      if (nodes.spin && nodes.spin.updateMatrixWorld) nodes.spin.updateMatrixWorld(true);
    } catch (_) {}
    try {
      if (nodes.earth && nodes.earth.updateMatrixWorld) nodes.earth.updateMatrixWorld(true);
    } catch (_) {}
    try {
      var cam = typeof SNGlobe.getCamera === 'function' ? SNGlobe.getCamera() : null;
      if (cam && cam.updateMatrixWorld) cam.updateMatrixWorld(true);
    } catch (_) {}
    paintGlobe();
  }

  function addRot(node, axis, delta) {
    if (!node || !node.rotation) return false;
    try {
      node.rotation[axis] = (+node.rotation[axis] || 0) + delta;
      try {
        node.matrixAutoUpdate = true;
      } catch (_) {}
      return true;
    } catch (_) {
      return false;
    }
  }

  function readRot(node, axis) {
    try {
      return node && node.rotation ? +node.rotation[axis] : 0;
    } catch (_) {
      return 0;
    }
  }

  function writeRot(node, axis, val) {
    try {
      if (node && node.rotation) node.rotation[axis] = val;
    } catch (_) {}
  }

  function probeNodeAxis(node, axis, kind, nodes, earth) {
    if (!node || node === earth || !node.rotation) return 0;
    var v0 = liveViewLatLng();
    if (!v0) return 0;
    var old = readRot(node, axis);
    addRot(node, axis, 0.04);
    callZeroInertia();
    paintTiltSpin(nodes);
    var v1 = liveViewLatLng();
    writeRot(node, axis, old);
    callZeroInertia();
    paintTiltSpin(nodes);
    if (!v1) return 0;
    var d = 0;
    if (kind === 'lat') d = v1.lat - v0.lat;
    else d = unwrapDeg(v1.lng - v0.lng);
    return axisSign(d);
  }

  /**
   * Honest flyGlobeTo — same algorithm as #127 pizza hunt.
   * Attached as SNGlobe.flyGlobeTo only if that helper is not already defined.
   * Does NOT remap Kalithea → Rhodes.
   */
  async function flyGlobeToLocal(lat, lng, label) {
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return false;

    try {
      if (G.SNMap) {
        try {
          SNMap.active = false;
        } catch (_) {}
      }
    } catch (_) {}

    unfreezeGlobe();
    callStopMotion();
    callZeroInertia();
    dispatchCanvasPointerCancel();

    lastProbe = { sLat: 0, sLng: 0 };

    var nodes = tiltSpinNodes();
    var tilt = nodes.tilt;
    var spin = nodes.spin;
    var earth = nodes.earth;
    var GAIN = 0.35;
    var maxSteps = 16;

    var latCtrl = { node: tilt, axis: 'x' };
    var lngCtrl = { node: spin, axis: 'y' };

    var sLat = probeNodeAxis(tilt, 'x', 'lat', nodes, earth);
    if (sLat === 0) {
      sLat = probeNodeAxis(spin, 'x', 'lat', nodes, earth);
      if (sLat !== 0) latCtrl = { node: spin, axis: 'x' };
    }
    var sLng = probeNodeAxis(spin, 'y', 'lng', nodes, earth);
    if (sLng === 0) {
      sLng = probeNodeAxis(tilt, 'y', 'lng', nodes, earth);
      if (sLng !== 0) lngCtrl = { node: tilt, axis: 'y' };
    }
    lastProbe = { sLat: sLat, sLng: sLng };

    function settled(v) {
      if (!v) return false;
      return Math.abs(v.lat - lat) < SETTLE_DEG && Math.abs(unwrapDeg(v.lng - lng)) < SETTLE_DEG;
    }
    function markSuccess() {
      callZeroInertia();
      lastFly = { lat: lat, lng: lng, ts: Date.now(), label: label || '' };
      try {
        G._snGlobeFocus = { lat: lat, lng: lng, label: label || '', t: Date.now() };
      } catch (_) {}
      return true;
    }
    function nudgeSigned(dLat, dLng) {
      if (latCtrl.node && latCtrl.node !== earth && sLat) {
        addRot(latCtrl.node, latCtrl.axis, sLat * dLat * (Math.PI / 180) * GAIN);
      }
      if (lngCtrl.node && lngCtrl.node !== earth && sLng) {
        addRot(lngCtrl.node, lngCtrl.axis, sLng * dLng * (Math.PI / 180) * GAIN);
      }
    }

    var step = 0;
    while (step < maxSteps) {
      var v = liveViewLatLng();
      if (settled(v)) return markSuccess();
      if (v) {
        var dLat = lat - v.lat;
        var dLng = unwrapDeg(lng - v.lng);
        nudgeSigned(dLat, dLng);
        callZeroInertia();
        paintTiltSpin(nodes);
      } else {
        callZeroInertia();
        paintTiltSpin(nodes);
      }
      step++;
    }

    callZeroInertia();
    paintTiltSpin(nodes);
    var vEnd = liveViewLatLng();
    if (settled(vEnd)) return markSuccess();
    lastFly = null;
    return false;
  }

  function attachFlyHelper() {
    try {
      if (!G.SNGlobe) return;
      if (typeof SNGlobe.flyGlobeTo === 'function') return;
      SNGlobe.flyGlobeTo = flyGlobeToLocal;
    } catch (_) {}
  }

  function getFly() {
    try {
      if (G.SNGlobe && typeof SNGlobe.flyGlobeTo === 'function') return SNGlobe.flyGlobeTo.bind(SNGlobe);
    } catch (_) {}
    return flyGlobeToLocal;
  }

  function flyFailDiag() {
    callZeroInertia();
    try {
      paintTiltSpin();
    } catch (_) {}
    var names = '?';
    var viewS = '?, ?';
    var sLat = lastProbe && lastProbe.sLat != null ? lastProbe.sLat : 0;
    var sLng = lastProbe && lastProbe.sLng != null ? lastProbe.sLng : 0;
    try {
      var walk = walkEarthChain();
      if (walk.names && walk.names.length) names = walk.names.join('>');
    } catch (_) {}
    try {
      viewS = fmtLiveLL(liveViewLatLng());
    } catch (_) {}
    return (
      'Fly failed - viewLatLng still ' +
      viewS +
      ' · sLat=' +
      sLat +
      ' sLng=' +
      sLng +
      ' · parents=' +
      names
    );
  }

  function installMapGuard() {
    try {
      if (G.SNMap) {
        if (typeof SNMap.open === 'function' && !SNMap.__snLaptopOpenGuard) {
          var prevOpen = SNMap.open.bind(SNMap);
          SNMap.open = function () {
            if (globeOnly()) {
              hideLeaflet();
              return Promise.resolve(null);
            }
            return prevOpen.apply(SNMap, arguments);
          };
          SNMap.__snLaptopOpenGuard = true;
        }
        if (typeof SNMap.showLiveSat === 'function' && !SNMap.__snLaptopSatGuard) {
          var prevSat = SNMap.showLiveSat.bind(SNMap);
          SNMap.showLiveSat = function () {
            if (globeOnly()) {
              hideLeaflet();
              return Promise.resolve(null);
            }
            return prevSat.apply(SNMap, arguments);
          };
          SNMap.__snLaptopSatGuard = true;
        }
      }
    } catch (_) {}
    try {
      if (G.SNSearch && typeof SNSearch.crawl === 'function' && !SNSearch.__snLaptopCrawlGuard) {
        var prevCrawl = SNSearch.crawl.bind(SNSearch);
        SNSearch.crawl = function (q, opts) {
          if (globeOnly()) {
            return Promise.resolve({
              places: [],
              nearby: [],
              web: [],
              wiki: null,
              wikiHits: [],
              acted: ['laptop-hunt-block'],
            });
          }
          return prevCrawl(q, opts);
        };
        SNSearch.__snLaptopCrawlGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNCosmos && typeof SNCosmos.scan === 'function' && !SNCosmos.__snLaptopScanGuard) {
        var prevScan = SNCosmos.scan.bind(SNCosmos);
        SNCosmos.scan = function () {
          if (globeOnly()) return Promise.resolve({ lines: [], nearby: [], shops: 0 });
          return prevScan.apply(SNCosmos, arguments);
        };
        SNCosmos.__snLaptopScanGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNCli && typeof SNCli.log === 'function' && SNCli.__snLaptopLogGuard !== BUILD) {
        var prevLog = SNCli.log.bind(SNCli);
        SNCli.log = function (m, c, force) {
          var s = String(m || '');
          if (FAKE_OPS_RE.test(s)) return;
          if (globeOnly() && POI_DUMP_RE.test(s)) return;
          return prevLog(m, c, force);
        };
        SNCli.__snLaptopLogGuard = BUILD;
      }
    } catch (_) {}
  }

  function beginGlobeHunt() {
    huntSession = true;
    hunting = true;
    huntFailed = false;
    G.__snLaptopHuntLive = true;
    attachFlyHelper();
    installMapGuard();
    unfreezeGlobe();
    noMeAv();
    suppressPoiUntil = Date.now() + 4000;
    try {
      if (G.SNGlobe) G.SNGlobe.consumeClick = true;
    } catch (_) {}
  }

  function endGlobeHunt() {
    hunting = false;
    hideLeaflet();
    noMeAv();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
  }

  function latLngToVecLocal(lat, lng, r) {
    r = r == null ? 1 : r;
    try {
      if (G.SNGlobe && typeof SNGlobe.latLngToVec === 'function') {
        var v = SNGlobe.latLngToVec(lat, lng, r);
        if (v) return v;
      }
    } catch (_) {}
    var phi = ((90 - lat) * Math.PI) / 180;
    var theta = ((lng + 180) * Math.PI) / 180;
    var x = -r * Math.sin(phi) * Math.cos(theta);
    var y = r * Math.cos(phi);
    var z = r * Math.sin(phi) * Math.sin(theta);
    try {
      var earth0 = G.SNGlobe && typeof SNGlobe.getEarth === 'function' ? SNGlobe.getEarth() : null;
      if (earth0 && earth0.position && earth0.position.clone) {
        return earth0.position.clone().set(x, y, z);
      }
    } catch (_) {}
    return { x: x, y: y, z: z };
  }

  function threeNS() {
    try {
      if (G.THREE) return G.THREE;
    } catch (_) {}
    try {
      if (typeof THREE !== 'undefined') return THREE;
    } catch (_) {}
    return null;
  }

  function stopOverlayRaf() {
    if (!overlayRaf) return;
    try {
      cancelAnimationFrame(overlayRaf);
    } catch (_) {}
    overlayRaf = 0;
  }

  function clearEarthPins() {
    var i;
    for (i = 0; i < earthPinMeshes.length; i++) {
      try {
        var m = earthPinMeshes[i];
        if (m && m.parent && typeof m.parent.remove === 'function') m.parent.remove(m);
      } catch (_) {}
    }
    earthPinMeshes = [];
  }

  function clearPinOverlayDom() {
    try {
      var el = document.getElementById('sn-laptop-pins');
      if (el) {
        el.innerHTML = '';
        el.style.display = 'none';
      }
    } catch (_) {}
    lastOverlaySpread = 0;
  }

  function clearLaptopPins() {
    lastPins = [];
    pinMeshes = [];
    lastWorldDistinct = false;
    stopOverlayRaf();
    clearEarthPins();
    clearPinOverlayDom();
    hideLeaflet();
  }

  function worldPosOf(mesh) {
    if (!mesh) return null;
    try {
      var T = threeNS();
      var v = T && T.Vector3 ? new T.Vector3() : null;
      if (mesh.getWorldPosition) {
        if (v) {
          mesh.getWorldPosition(v);
          return v;
        }
        var tmp = { x: 0, y: 0, z: 0 };
        mesh.getWorldPosition(tmp);
        return tmp;
      }
      if (mesh.position) return { x: +mesh.position.x, y: +mesh.position.y, z: +mesh.position.z };
    } catch (_) {}
    return null;
  }

  function maxWorldSpread(meshes) {
    if (!meshes || meshes.length < 2) return 0;
    var pts = [];
    var i, j;
    for (i = 0; i < meshes.length; i++) {
      var p = worldPosOf(meshes[i]);
      if (p && isFinite(p.x) && isFinite(p.y) && isFinite(p.z)) pts.push(p);
    }
    if (pts.length < 2) return 0;
    var maxD = 0;
    for (i = 0; i < pts.length; i++) {
      for (j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x;
        var dy = pts[i].y - pts[j].y;
        var dz = pts[i].z - pts[j].z;
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d > maxD) maxD = d;
      }
    }
    return maxD;
  }

  /**
   * world = latLngToVec applied through earth.matrixWorld (or pivot);
   * ndc = world.project(camera); unique css left/top;
   * skip if behind globe (dot with camera < 0).
   */
  function projectPin(lat, lng) {
    try {
      if (!G.SNGlobe) return null;
      var earth = typeof SNGlobe.getEarth === 'function' ? SNGlobe.getEarth() : null;
      var pivot = typeof SNGlobe.getPivot === 'function' ? SNGlobe.getPivot() : null;
      var camera = typeof SNGlobe.getCamera === 'function' ? SNGlobe.getCamera() : null;
      var renderer = typeof SNGlobe.getRenderer === 'function' ? SNGlobe.getRenderer() : null;
      if (!camera) return null;
      var frame = earth || pivot;
      if (!frame) return null;
      try {
        if (frame.updateMatrixWorld) frame.updateMatrixWorld(true);
      } catch (_) {}
      var local = null;
      try {
        if (typeof SNGlobe.latLngToVec === 'function') local = SNGlobe.latLngToVec(lat, lng, 1.012);
      } catch (_) {}
      if (!local) local = latLngToVecLocal(lat, lng, 1.012);
      if (!local || local.x == null || !isFinite(local.x)) return null;
      var world = null;
      try {
        world = local.clone ? local.clone() : null;
        if (world && frame.matrixWorld && world.applyMatrix4) {
          world.applyMatrix4(frame.matrixWorld);
        } else if (frame.localToWorld && local.clone) {
          world = frame.localToWorld(local.clone());
        }
      } catch (_) {
        world = null;
      }
      if (!world || world.x == null) return null;
      var camPos = null;
      try {
        camPos = camera.position.clone ? camera.position.clone() : null;
        if (camera.getWorldPosition && camPos) camera.getWorldPosition(camPos);
      } catch (_) {
        camPos = camera.position;
      }
      if (!camPos) return null;
      var dot = world.x * camPos.x + world.y * camPos.y + world.z * camPos.z;
      if (dot < 0) return null;
      var ndc = null;
      try {
        ndc = world.clone ? world.clone() : world;
        if (typeof ndc.project !== 'function') return null;
        ndc.project(camera);
      } catch (_) {
        return null;
      }
      var canvas =
        (renderer && renderer.domElement) ||
        document.querySelector('#globe canvas') ||
        document.querySelector('canvas');
      if (!canvas) return null;
      var rect = canvas.getBoundingClientRect();
      var left = ((ndc.x + 1) / 2) * rect.width + rect.left;
      var top = ((-ndc.y + 1) / 2) * rect.height + rect.top;
      if (!isFinite(left) || !isFinite(top)) return null;
      return { left: left, top: top, ndc: ndc, world: world };
    } catch (_) {
      return null;
    }
  }

  function attachEarthPin(pin, color) {
    if (!pin || pin.lat == null || pin.lng == null) return null;
    try {
      if (!G.SNGlobe || typeof SNGlobe.getEarth !== 'function') return null;
      var earth = SNGlobe.getEarth();
      if (!earth || typeof earth.add !== 'function') return null;
      var vec = null;
      try {
        if (typeof SNGlobe.latLngToVec === 'function') vec = SNGlobe.latLngToVec(pin.lat, pin.lng, 1.012);
      } catch (_) {}
      if (!vec) vec = latLngToVecLocal(pin.lat, pin.lng, 1.012);
      if (!vec || vec.x == null) return null;
      var mesh = null;
      var T = threeNS();
      if (T && T.Mesh && T.SphereGeometry) {
        mesh = new T.Mesh(
          new T.SphereGeometry(0.01, 10, 10),
          new T.MeshBasicMaterial({
            color: color != null ? color : PIN_COLOR_A,
            depthTest: true,
            transparent: true,
            opacity: 0.95,
          })
        );
      } else if (pinMeshes[0] && typeof pinMeshes[0].clone === 'function') {
        mesh = pinMeshes[0].clone();
      }
      if (!mesh) return null;
      try {
        if (mesh.position.copy && vec.clone) mesh.position.copy(vec);
        else if (mesh.position.set) mesh.position.set(vec.x, vec.y, vec.z);
        else {
          mesh.position.x = vec.x;
          mesh.position.y = vec.y;
          mesh.position.z = vec.z;
        }
      } catch (_) {}
      try {
        mesh.userData = mesh.userData || {};
        mesh.userData.snVendor = true;
        mesh.userData.snLaptop = true;
        mesh.userData.snEarthPin = true;
        mesh.userData.snName = pin.name;
        mesh.userData.snKm = pin.km;
        mesh.userData.snLat = pin.lat;
        mesh.userData.snLng = pin.lng;
      } catch (_) {}
      earth.add(mesh);
      earthPinMeshes.push(mesh);
      return mesh;
    } catch (_) {
      return null;
    }
  }

  function cssSpreadOf(points) {
    if (!points || points.length < 2) return 0;
    var minL = 1e9;
    var maxL = -1e9;
    var minT = 1e9;
    var maxT = -1e9;
    var i;
    for (i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p || !isFinite(p.left) || !isFinite(p.top)) continue;
      if (p.left < minL) minL = p.left;
      if (p.left > maxL) maxL = p.left;
      if (p.top < minT) minT = p.top;
      if (p.top > maxT) maxT = p.top;
    }
    if (minL === 1e9) return 0;
    return Math.hypot(maxL - minL, maxT - minT);
  }

  function pinOverlayEl() {
    var el = document.getElementById('sn-laptop-pins');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-laptop-pins';
    el.setAttribute('data-sn-build', BUILD);
    el.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;overflow:visible;' +
      'pointer-events:auto;z-index:81;margin:0;padding:0;border:0;';
    try {
      (document.body || document.documentElement).appendChild(el);
    } catch (_) {}
    return el;
  }

  function hexColor(n, fallback) {
    try {
      var v = Number(n);
      if (!isFinite(v)) return fallback || '#7ee9ff';
      return '#' + ('000000' + (v >>> 0).toString(16)).slice(-6);
    } catch (_) {
      return fallback || '#7ee9ff';
    }
  }

  function paintPinOverlay() {
    lastOverlaySpread = 0;
    lastWorldDistinct =
      maxWorldSpread(earthPinMeshes) > 1e-4 || maxWorldSpread(pinMeshes) > 1e-4;
    if (!lastPins.length) {
      clearPinOverlayDom();
      return;
    }
    var points = [];
    var i;
    for (i = 0; i < lastPins.length; i++) {
      var pin = lastPins[i];
      if (!pin || pin.lat == null) continue;
      var proj = projectPin(pin.lat, pin.lng);
      if (!proj) continue;
      points.push({
        left: proj.left,
        top: proj.top,
        pin: pin,
        idx: i,
        color: i === 0 ? PIN_COLOR_A : PIN_COLOR_B,
      });
    }
    lastOverlaySpread = cssSpreadOf(points);
    var root = pinOverlayEl();
    if (!root) return;
    root.style.display = points.length ? 'block' : 'none';
    root.style.setProperty('pointer-events', 'auto', 'important');
    root.style.setProperty('z-index', '81', 'important');
    try {
      var panel = document.getElementById('panel');
      if (panel) {
        var z = parseInt(window.getComputedStyle(panel).zIndex, 10);
        if (isFinite(z) && z >= 81) root.style.setProperty('z-index', String(z + 20), 'important');
      }
    } catch (_) {}

    var existing = root.querySelectorAll('button[data-sn-laptop-pin]');
    if (existing.length === points.length && points.length > 0) {
      for (i = 0; i < points.length; i++) {
        existing[i].style.left = (points[i].left - 11).toFixed(1) + 'px';
        existing[i].style.top = (points[i].top - 11).toFixed(1) + 'px';
        existing[i].style.display = 'block';
      }
      return;
    }

    root.innerHTML = '';
    for (i = 0; i < points.length; i++) {
      (function (pt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-sn-laptop-pin', String(pt.idx));
        var name = String(pt.pin.name || 'shop').slice(0, 36);
        btn.title = name;
        btn.setAttribute('aria-label', name);
        btn.style.cssText =
          'position:absolute;left:' +
          (pt.left - 11).toFixed(1) +
          'px;top:' +
          (pt.top - 11).toFixed(1) +
          'px;width:22px;height:22px;border-radius:50%;border:2px solid #fff;background:' +
          hexColor(pt.color, pt.idx === 0 ? '#7ee9ff' : '#b48eff') +
          ';pointer-events:auto;cursor:pointer;padding:0;margin:0;' +
          'box-shadow:0 0 10px rgba(126,233,255,.85);z-index:1;';
        function onPinTap(ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          try {
            if (G.SNGlobe) G.SNGlobe.consumeClick = true;
          } catch (_) {}
          var row = lastPins[pt.idx] || pt.pin;
          announceVendor(row);
        }
        btn.addEventListener('pointerdown', onPinTap, true);
        btn.addEventListener('pointerup', onPinTap, true);
        btn.addEventListener('click', onPinTap, true);
        root.appendChild(btn);
      })(points[i]);
    }
  }

  function startOverlayRaf() {
    stopOverlayRaf();
    if (!lastPins.length) return;
    function tick() {
      overlayRaf = 0;
      if (!lastPins.length) return;
      paintPinOverlay();
      try {
        overlayRaf = requestAnimationFrame(tick);
      } catch (_) {}
    }
    tick();
  }

  function canLogPinsOnGlobe(nPainted) {
    if (!(nPainted > 0)) return false;
    lastWorldDistinct =
      maxWorldSpread(earthPinMeshes) > 1e-4 || maxWorldSpread(pinMeshes) > 1e-4;
    if (lastWorldDistinct) return true;
    if (lastOverlaySpread > 20) return true;
    if (lastPins.length === 1 && nPainted >= 1) return true;
    return false;
  }

  function installDiveGuard() {
    try {
      if (!G.SNGlobe || typeof SNGlobe.diveInAt !== 'function') return;
      if (SNGlobe.__snLaptopDiveGuard === BUILD) return;
      var prev = SNGlobe.diveInAt.bind(SNGlobe);
      SNGlobe.diveInAt = function (lat, lng) {
        try {
          if (G.SNGlobe && G.SNGlobe.consumeClick) return false;
          if (lastPins.length && Date.now() < suppressPoiUntil) return false;
        } catch (_) {}
        return prev(lat, lng);
      };
      SNGlobe.__snLaptopDiveGuard = BUILD;
    } catch (_) {}
  }

  /**
   * Paint pins — pulse + ALWAYS parent each pin onto getEarth() at that
   * shop's own latLngToVec(lat,lng,1.012) so they never pile at one point.
   */
  function paintPins(rows, origin) {
    clearLaptopPins();
    if (!rows || !rows.length) return 0;
    var painted = 0;
    var ready = isGlobeReady();
    var slice = rows.slice(0, 24);

    slice.forEach(function (v, i) {
      if (!v || v.lat == null || v.lng == null) return;
      var lat = +v.lat;
      var lng = +v.lng;
      if (!isFinite(lat) || !isFinite(lng)) return;
      var kmOrigin = origin ? haversineKm(origin, { lat: lat, lng: lng }) : null;
      if (kmOrigin != null && kmOrigin > 18) return;
      var label = String(v.name || 'shop').slice(0, 28);
      var color = i === 0 ? PIN_COLOR_A : PIN_COLOR_B;
      var pin = {
        id: v.id,
        name: v.name,
        lat: lat,
        lng: lng,
        km: kmOrigin,
        emoji: v.emoji || '💻',
        source: v.source || '',
      };
      lastPins.push(pin);

      if (ready) {
        try {
          var mesh = SNGlobe.pulse(lat, lng, color, label, PIN_MS);
          if (mesh) {
            try {
              mesh.userData = mesh.userData || {};
              mesh.userData.snVendor = true;
              mesh.userData.snLaptop = true;
              mesh.userData.snName = v.name;
              mesh.userData.snKm = kmOrigin;
              mesh.userData.snLat = lat;
              mesh.userData.snLng = lng;
            } catch (_) {}
            pinMeshes.push(mesh);
            var isMesh = false;
            try {
              isMesh = !!(
                mesh.isMesh ||
                (mesh.type && String(mesh.type).indexOf('Mesh') >= 0) ||
                (mesh.geometry && mesh.material && !mesh.isSprite)
              );
            } catch (_) {
              isMesh = true;
            }
            if (isMesh) painted++;
          }
        } catch (_) {}
      }
      var earth = attachEarthPin(pin, color);
      if (earth && !painted) painted++;
      else if (earth) painted++;
    });

    try {
      if (G.SNGlobe && typeof SNGlobe.getEarth === 'function') {
        var earth0 = SNGlobe.getEarth();
        if (earth0 && earth0.updateMatrixWorld) earth0.updateMatrixWorld(true);
      }
    } catch (_) {}

    if (lastPins.length) {
      paintPinOverlay();
      startOverlayRaf();
    }

    lastWorldDistinct =
      maxWorldSpread(earthPinMeshes) > 1e-4 || maxWorldSpread(pinMeshes) > 1e-4;
    installPinTap();
    return lastPins.length ? Math.max(painted, lastPins.length) : 0;
  }

  function hitVendorAt(cx, cy) {
    if (!lastPins.length) return null;
    var hit = null;
    var best = 1e9;
    try {
      if (G.SNGlobe && typeof SNGlobe.pickLatLng === 'function') {
        var ll = SNGlobe.pickLatLng(cx, cy);
        if (ll && ll.lat != null) {
          lastPins.forEach(function (p) {
            var d = haversineKm(ll, p);
            if (d < best) {
              best = d;
              hit = p;
            }
          });
          var tol = 12;
          try {
            if (G.SNGlobe && typeof SNGlobe.currentTier === 'function') {
              var t = String(SNGlobe.currentTier() || '');
              if (t === 'city' || t === 'street' || t === 'local' || t === 'streets') tol = 12;
              else if (t === 'regional') tol = 18;
              else if (t === 'national') tol = 35;
            }
          } catch (_) {}
          if (best > tol) hit = null;
        }
      }
    } catch (_) {}
    return hit;
  }

  function announceVendor(hit) {
    if (!hit) return;
    suppressPoiUntil = Date.now() + 2500;
    try {
      if (G.SNGlobe) G.SNGlobe.consumeClick = true;
    } catch (_) {}
    hideLeaflet();
    log(
      'Shop · ' +
        String(hit.name || 'vendor').slice(0, 36) +
        (hit.km != null && isFinite(hit.km) ? ' · ' + Number(hit.km).toFixed(1) + 'km' : '') +
        ' · ⭐',
      'ok'
    );
    preview(String(hit.name || 'shop').slice(0, 40) + ' · ⭐');
  }

  function installPinTap() {
    installDiveGuard();
    try {
      if (clickUnsub) {
        try {
          clickUnsub();
        } catch (_) {}
        clickUnsub = null;
      }
      if (G.SNGlobe && typeof SNGlobe.onClick === 'function') {
        clickUnsub = SNGlobe.onClick(function (cx, cy) {
          if (!lastPins.length) return false;
          if (Date.now() < suppressPoiUntil) return true;
          var hit = hitVendorAt(cx, cy);
          if (!hit) return false;
          try {
            if (G.SNGlobe) G.SNGlobe.consumeClick = true;
          } catch (_) {}
          announceVendor(hit);
          return true;
        });
      }
    } catch (_) {}

    try {
      if (canvasTapBound) return;
      var canvas = globeCanvas();
      if (!canvas) return;
      canvasTapBound = true;
      var downX = 0;
      var downY = 0;
      var downT = 0;
      canvas.addEventListener(
        'pointerdown',
        function (e) {
          downX = e.clientX;
          downY = e.clientY;
          downT = performance.now();
        },
        true
      );
      canvas.addEventListener(
        'pointerup',
        function (e) {
          if (!lastPins.length) return;
          if (performance.now() - downT > 320) return;
          if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
          var hit = hitVendorAt(e.clientX, e.clientY);
          if (!hit) return;
          try {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          } catch (_) {}
          try {
            if (G.SNGlobe) G.SNGlobe.consumeClick = true;
          } catch (_) {}
          announceVendor(hit);
        },
        true
      );
    } catch (_) {}
  }

  function constrainToPlace(origin, rows) {
    rows = rows || [];
    var place = origin ? placeOf(origin.lat, origin.lng) : null;
    return rows.filter(function (v) {
      if (!v || v.lat == null || v.lng == null) return false;
      if (haversineKm(origin, { lat: +v.lat, lng: +v.lng }) > HUNT_KM) return false;
      var shopPlace = placeOf(v.lat, v.lng);
      if (place && shopPlace && shopPlace !== place) return false;
      if (place === 'Rhodes' && !inRhodes(v.lat, v.lng)) return false;
      if (place && !shopPlace && place === 'Rhodes') return false;
      return true;
    });
  }

  function dedupeShops(rows) {
    var seen = {};
    var out = [];
    var i;
    for (i = 0; i < (rows || []).length; i++) {
      var v = rows[i];
      if (!v || v.lat == null || v.lng == null) continue;
      var lat = +v.lat;
      var lng = +v.lng;
      if (!isFinite(lat) || !isFinite(lng)) continue;
      var key =
        String(v.name || '')
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .slice(0, 40) +
        '@' +
        lat.toFixed(4) +
        ',' +
        lng.toFixed(4);
      if (seen[key]) continue;
      var j;
      var tooClose = false;
      for (j = 0; j < out.length; j++) {
        if (haversineKm(out[j], { lat: lat, lng: lng }) < 0.04) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      seen[key] = 1;
      out.push(v);
    }
    return out;
  }

  function osmElToShop(e) {
    if (!e) return null;
    var lat = e.lat != null ? +e.lat : e.center && e.center.lat != null ? +e.center.lat : null;
    var lng = e.lon != null ? +e.lon : e.center && e.center.lon != null ? +e.center.lon : null;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var tags = e.tags || {};
    var name = tags.name || tags.brand || tags['name:en'] || tags['name:el'] || '';
    if (!name) {
      if (tags.shop) name = String(tags.shop).replace(/_/g, ' ');
      else return null;
    }
    if (isBannedName(name)) return null;
    var shop = String(tags.shop || tags.amenity || '');
    var row = {
      id: 'osm-' + (e.type || 'n') + '-' + e.id,
      osm_id: e.id,
      name: name,
      lat: lat,
      lng: lng,
      category: shop || 'electronics',
      shop: shop,
      shopKind: shop,
      tags: [shop, tags.brand, tags.operator].filter(Boolean),
      real: true,
      source: 'overpass',
      emoji: '💻',
    };
    if (!isElectronicsShop(row)) return null;
    return row;
  }

  async function queryOverpass(lat, lng, radiusKm) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return [];
    var r = Math.round((Number(radiusKm) > 0 ? Number(radiusKm) : 16) * 1000);
    var around = '(around:' + r + ',' + lat.toFixed(5) + ',' + lng.toFixed(5) + ')';
    var body =
      '[out:json][timeout:14];(' +
      'node["shop"="computer"]' +
      around +
      ';' +
      'node["shop"="electronics"]' +
      around +
      ';' +
      'node["shop"="mobile_phone"]' +
      around +
      ';' +
      'node["shop"="hifi"]' +
      around +
      ';' +
      'node["shop"="telecommunication"]' +
      around +
      ';' +
      'way["shop"="computer"]' +
      around +
      ';' +
      'way["shop"="electronics"]' +
      around +
      ';' +
      'way["shop"="mobile_phone"]' +
      around +
      ';' +
      ');out center 40;';
    var endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];
    var i;
    for (i = 0; i < endpoints.length; i++) {
      try {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var to = setTimeout(function () {
          try {
            if (ctrl) ctrl.abort();
          } catch (_) {}
        }, 14000);
        var res = await fetch(endpoints[i], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(body),
          signal: ctrl ? ctrl.signal : undefined,
        });
        clearTimeout(to);
        if (!res.ok) continue;
        var j = await res.json();
        var els = (j && j.elements) || [];
        var rows = [];
        var k;
        for (k = 0; k < els.length; k++) {
          var shop = osmElToShop(els[k]);
          if (shop) rows.push(shop);
        }
        return rows;
      } catch (_) {}
    }
    throw new Error('overpass failed');
  }

  async function queryNominatim(lat, lng, radiusKm) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return [];
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 16;
    var dLat = rKm / 111;
    var dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    var left = lng - dLng;
    var right = lng + dLng;
    var top = lat + dLat;
    var bottom = lat - dLat;
    var viewbox = [left, top, right, bottom].join(',');
    var queries = ['computer shop', 'electronics shop'];
    var out = [];
    var q;
    for (q = 0; q < queries.length; q++) {
      try {
        var url =
          'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&bounded=1&addressdetails=0' +
          '&viewbox=' +
          encodeURIComponent(viewbox) +
          '&q=' +
          encodeURIComponent(queries[q]);
        var res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AstranovSpaceNet/20260823013000-laptop-hunt (https://astranov.eu)',
          },
          cache: 'no-store',
        });
        if (!res.ok) continue;
        var rows = await res.json();
        if (!Array.isArray(rows)) continue;
        var i;
        for (i = 0; i < rows.length; i++) {
          var r = rows[i];
          if (!r || r.lat == null || r.lon == null) continue;
          var name = r.display_name ? String(r.display_name).split(',')[0] : r.name;
          var row = {
            id: 'nom-' + (r.osm_id || i) + '-' + q,
            osm_id: r.osm_id,
            name: name || 'shop',
            lat: +r.lat,
            lng: +r.lon,
            category: r.type || r.class || 'electronics',
            shop: r.type || '',
            shopKind: r.type || '',
            tags: [r.type, r.class, r.category].filter(Boolean),
            real: true,
            source: 'nominatim',
            emoji: '💻',
          };
          if (isElectronicsShop(row) || /computer|electronics|mobile|hifi/i.test(String(r.type || '') + ' ' + String(name || ''))) {
            if (!isBannedName(row.name)) out.push(row);
          }
        }
      } catch (_) {}
    }
    return out;
  }

  async function queryVendorsBbox(lat, lng, radiusKm) {
    var urlBase = baseUrl();
    if (!urlBase) return [];
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return [];
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 16;
    var dLat = rKm / 111;
    var dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    var q =
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
    var res = await fetch(q, { headers: headers(), cache: 'no-store' });
    if (!res.ok) throw new Error('vendors HTTP ' + res.status);
    var rows = await res.json();
    if (!Array.isArray(rows)) rows = [];
    return rows.filter(isElectronicsShop).map(function (v) {
      return Object.assign({}, v, { real: true, source: 'supabase', emoji: v.emoji || '💻' });
    });
  }

  function listInCli(rows, origin) {
    if (!rows || !rows.length) {
      log('Hunt failed · no electronics shops near view', 'dim');
      return;
    }
    var scored = rows
      .map(function (v) {
        var km = origin ? haversineKm(origin, { lat: +v.lat, lng: +v.lng }) : 99;
        return { v: v, km: km };
      })
      .filter(function (s) {
        return s.km <= 18;
      })
      .sort(function (a, b) {
        return a.km - b.km;
      })
      .slice(0, 10);
    if (!scored.length) {
      log('Hunt failed · no electronics shops near view', 'dim');
      return;
    }
    var place = origin ? placeOf(origin.lat, origin.lng) : null;
    log(
      'Laptop hunt · ' +
        scored.length +
        ' shops' +
        (place ? ' · ' + place : '') +
        ' · on globe',
      'ok'
    );
    scored.forEach(function (s, i) {
      var name = String(s.v.name || 'shop').slice(0, 32);
      var kmS = s.km < 99 ? s.km.toFixed(1) + 'km' : '—';
      log(i + 1 + ' · ' + name + ' · ' + kmS + ' · ⭐', 'ok');
    });
    log('Tap a pin on the globe · Google only at pay / HOLD ⭐', 'dim');
    preview(scored[0].v.name + ' · ' + scored[0].km.toFixed(1) + 'km · ⭐');
  }

  async function fetchNear(origin) {
    var rows = [];
    var osmErr = null;
    var vendErr = null;
    try {
      rows = rows.concat(await queryOverpass(origin.lat, origin.lng, 16));
    } catch (e) {
      osmErr = e;
    }
    if (!rows.length) {
      try {
        rows = rows.concat(await queryNominatim(origin.lat, origin.lng, 16));
      } catch (_) {}
    }
    try {
      rows = rows.concat(await queryVendorsBbox(origin.lat, origin.lng, 16));
    } catch (e) {
      vendErr = e;
    }
    try {
      if (G.SNCommerce && SNCommerce.loadNear) {
        var extra = (await SNCommerce.loadNear(origin.lat, origin.lng, 16)) || [];
        rows = rows.concat(extra.filter(isElectronicsShop));
      }
    } catch (_) {}
    rows = constrainToPlace(origin, rows).filter(isElectronicsShop);
    rows = dedupeShops(rows);
    if (!rows.length && osmErr && vendErr) {
      throw new Error(
        'hunt failed · ' +
          (osmErr && osmErr.message ? osmErr.message : 'overpass') +
          ' · ' +
          (vendErr && vendErr.message ? vendErr.message : 'vendors')
      );
    }
    return rows;
  }

  function failHunt(msg) {
    huntFailed = true;
    clearLaptopPins();
    log(msg || 'Hunt failed', 'dim');
    preview('Hunt failed');
  }

  async function huntAt(origin, raw) {
    if (!origin) {
      failHunt('Hunt failed · no origin · type Locate once');
      askedLocate = true;
      return true;
    }

    if (origin.source === 'you' && nearFake(origin.lat, origin.lng)) {
      var cam2 = cameraLook();
      if (cam2) origin = { lat: cam2.lat, lng: cam2.lng, source: 'camera' };
      else {
        failHunt('Hunt failed · no origin · type Locate once');
        return true;
      }
    }

    log(
      'Origin · ' + origin.source + ' · ' + origin.lat.toFixed(3) + ', ' + origin.lng.toFixed(3),
      'dim'
    );

    var use = [];
    try {
      use = await fetchNear(origin);
    } catch (e) {
      failHunt('Hunt failed · ' + (e && e.message ? e.message : e));
      return true;
    }

    if (!use.length) {
      if (origin.source === 'you' && hasSessionLocate()) {
        failHunt('Hunt failed · no electronics shops in 16 km');
      } else {
        failHunt('Hunt failed · no electronics shops near view · type Locate once');
        askedLocate = true;
      }
      return true;
    }

    await waitGlobeReady(1800);
    var nPainted = paintPins(use, origin);
    listInCli(use, origin);

    if (nPainted <= 0) {
      await sleep(400);
      await waitGlobeReady(1200);
      nPainted = paintPins(use, origin);
    }
    if (nPainted > 0 && !canLogPinsOnGlobe(nPainted)) {
      paintPinOverlay();
      startOverlayRaf();
    }
    if (canLogPinsOnGlobe(nPainted)) {
      log('Pins on globe · ' + lastPins.length + ' shops · tap a pin', 'ok');
    } else if (nPainted > 0) {
      log('Globe pulse unavailable · list only (pins stacked)', 'dim');
    } else {
      failHunt('Hunt failed · globe pulse unavailable');
      return true;
    }

    if (isGuest() && raw) {
      log('Guest browse · sign in only when you HOLD ⭐ / pay', 'dim');
    }
    noMeAv();
    return true;
  }

  function blockAuthModalOnLaptop() {
    try {
      var modal = document.getElementById('sn-auth-modal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('open', 'show', 'sn-open');
      }
    } catch (_) {}
    try {
      if (G.SNAuth && typeof SNAuth.openModal === 'function' && !SNAuth.__snLaptopGuard) {
        var prev = SNAuth.openModal.bind(SNAuth);
        SNAuth.openModal = function (msg) {
          var m = String(msg || '');
          if (
            isGuest() &&
            !snDebug() &&
            !/pay|HOLD\s*⭐|hold\s*star|checkout|wallet|balance/i.test(m)
          ) {
            log('Browse free · Google only at pay / HOLD ⭐', 'dim');
            return;
          }
          return prev(msg);
        };
        SNAuth.__snLaptopGuard = true;
      }
    } catch (_) {}
  }

  async function huntLaptop(raw) {
    if (hunting) return true;
    beginGlobeHunt();
    blockAuthModalOnLaptop();
    noMeAv();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
    try {
      var a = document.getElementById('cli-in');
      if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in');
      if (b) b.value = '';
    } catch (_) {}

    log(String(raw || 'laptop').slice(0, 80), 'cmd');

    try {
      var ready = await waitGlobeReady(2200);
      if (!ready) {
        failHunt('Hunt failed · globe not ready');
        return true;
      }

      var origin = resolveOrigin();
      attachFlyHelper();

      if (origin && origin.source === 'you') {
        var fly = getFly();
        var ok = false;
        try {
          ok = await fly(origin.lat, origin.lng, 'You');
        } catch (_) {
          ok = false;
        }
        if (ok && !viewNear(origin.lat, origin.lng, SETTLE_DEG, SETTLE_DEG)) ok = false;
        if (!ok) {
          log('Fly failed', 'err');
          log(flyFailDiag(), 'dim');
          preview('Fly failed');
          clearLaptopPins();
          huntFailed = true;
          return true;
        }
        origin = { lat: origin.lat, lng: origin.lng, source: 'you' };
      } else {
        var cam = liveViewLatLng() || cameraLook();
        if (cam) origin = { lat: cam.lat, lng: cam.lng, source: 'camera' };
      }

      if (!origin) {
        failHunt('Hunt failed · no origin · type Locate once');
        return true;
      }

      await huntAt(origin, raw);
    } catch (e) {
      failHunt('Hunt failed · ' + (e && e.message ? e.message : e));
    } finally {
      endGlobeHunt();
    }
    return true;
  }

  function isLaptopLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/pizza|nairobi|kenya|\bafrica\b|kalithea|kallithea|rhodes|rodos|ρόδο|webrtc|\bcall\b|hangup/i.test(s))
      return false;
    if (/\?$/.test(s)) return false;
    if (/^(what|why|how|who|when|explain|tell me|define|is |are )\b/i.test(s)) return false;
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (LAPTOP_RE.test(low)) return true;
    if (/^(laptop|laptops)$/.test(low)) return true;
    if (/^buy (a )?laptops?$/.test(low)) return true;
    return false;
  }

  function isBareLocate(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/^(locate|gps|where am i|find me)$/i.test(s)) return true;
    return false;
  }

  function isPayHold(line) {
    var s = String(line || '')
      .trim()
      .toLowerCase();
    return /^(pay|hold\s*⭐|hold\s*star|checkout|confirm\s+order|buy\s+now)\b/.test(s);
  }

  async function grantLocateGps() {
    hideLeaflet();
    log('Locate · GPS grant only · globe stays', 'dim');
    preview('GPS…');
    if (!navigator.geolocation) {
      log('No geolocation · spin globe over a town then laptop', 'dim');
      return;
    }
    var pos = await new Promise(function (resolve) {
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, 12000);
      try {
        navigator.geolocation.getCurrentPosition(
          function (p) {
            if (done) return;
            done = true;
            clearTimeout(to);
            resolve(p);
          },
          function () {
            if (done) return;
            done = true;
            clearTimeout(to);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (_) {
        clearTimeout(to);
        resolve(null);
      }
    });
    if (pos && pos.coords && isFinite(pos.coords.latitude)) {
      var lat = +pos.coords.latitude;
      var lng = +pos.coords.longitude;
      if (nearFake(lat, lng)) {
        log('Locate rejected fake pin · spin globe then laptop', 'dim');
        return;
      }
      markSessionLocate(lat, lng, {
        source: 'gps',
        real: true,
        fallback: false,
        fromGps: true,
        accuracy: pos.coords.accuracy,
      });
      log('Located · ' + lat.toFixed(3) + ', ' + lng.toFixed(3) + ' · type laptop again', 'ok');
      var fly = getFly();
      var ok = false;
      try {
        ok = await fly(lat, lng, 'You');
      } catch (_) {
        ok = false;
      }
      if (!ok) {
        log('Fly failed', 'err');
        log(flyFailDiag(), 'dim');
      }
    } else {
      log('Locate failed · grant GPS or spin globe over a town then laptop', 'dim');
    }
  }

  function patchCliRun() {
    try {
      if (!G.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli.run === cliWrap && SNCli.__snGuestLaptopHuntBuild === BUILD) return;
      var prev = SNCli.run.bind(SNCli);
      cliWrap = function (raw) {
        try {
          var s = String(raw || '').trim();
          if (isBareLocate(s) && globeOnly()) {
            void grantLocateGps();
            return Promise.resolve(true);
          }
          if (isLaptopLine(s)) {
            void huntLaptop(s);
            return Promise.resolve(true);
          }
          if (isGuest() && isPayHold(s) && lastPins.length) {
            try {
              if (G.SNAuth && typeof SNAuth.openModal === 'function') {
                SNAuth.openModal('Sign in with Google to HOLD ⭐ / pay');
              }
            } catch (_) {}
            log('HOLD ⭐ · Sign in with Google to pay', 'ok');
            return Promise.resolve(true);
          }
        } catch (_) {}
        return prev(raw);
      };
      SNCli.run = cliWrap;
      SNCli.__snGuestLaptopHuntBuild = BUILD;
      SNCli.__snGuestLaptopHunt = 1;
    } catch (_) {}
  }

  function bindInputs() {
    function capture(ev, el) {
      var v = String((el && el.value) || '').trim();
      if (!v) return false;
      var handled = false;
      if (isLaptopLine(v)) {
        handled = true;
        void huntLaptop(v);
      } else if (isBareLocate(v) && globeOnly()) {
        handled = true;
        void grantLocateGps();
      }
      if (!handled) return false;
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      } catch (_) {}
      if (el) el.value = '';
      return true;
    }
    try {
      var form = document.getElementById('cli-form') || document.querySelector('#panel form');
      var input = document.getElementById('cli-in');
      if (form && input && !input._snLaptopHunt) {
        input._snLaptopHunt = 1;
        form.addEventListener(
          'submit',
          function (ev) {
            capture(ev, input);
          },
          true
        );
        input.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, input);
          },
          true
        );
      }
      var topIn = document.getElementById('stc-cmd-in');
      if (topIn && !topIn._snLaptopHunt) {
        topIn._snLaptopHunt = 1;
        topIn.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, topIn);
          },
          true
        );
      }
    } catch (_) {}
  }

  function patchMarket() {
    try {
      if (!G.SNMarket || typeof SNMarket.fulfillFoodIntent !== 'function') return;
      if (SNMarket._snLaptopHunt) return;
      var ful = SNMarket.fulfillFoodIntent.bind(SNMarket);
      SNMarket.fulfillFoodIntent = async function (q, opts) {
        var line = String(q || (opts && opts.text) || '');
        if (isGuest() && !snDebug() && isLaptopLine(line)) {
          await huntLaptop(line || 'laptop');
          return {
            ok: true,
            guest_browse: true,
            reply: 'Shops on globe · Google only at pay / HOLD ⭐',
          };
        }
        return ful(q, opts);
      };
      SNMarket._snLaptopHunt = true;
    } catch (_) {}
  }

  function tick() {
    attachFlyHelper();
    blockAuthModalOnLaptop();
    installMapGuard();
    patchCliRun();
    bindInputs();
    patchMarket();
    installDiveGuard();
    noMeAv();
    if (globeOnly()) hideLeaflet();
  }

  function boot() {
    scrubFakeYou();
    tick();
  }

  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 0);
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
  setTimeout(boot, 4000);
  setInterval(function () {
    tick();
  }, 8000);

  G.SNChromeGuestLaptopHunt = {
    build: BUILD,
    hunt: huntLaptop,
    queryVendorsBbox: queryVendorsBbox,
    queryOverpass: queryOverpass,
    resolveOrigin: resolveOrigin,
    projectPin: projectPin,
    flyGlobeTo: flyGlobeToLocal,
    lastPins: function () {
      return lastPins.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
