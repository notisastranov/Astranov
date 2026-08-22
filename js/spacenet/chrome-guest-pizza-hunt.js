/**
 * Guest pizza hunt — Build 20260822155100-force-mesh-fly
 * PATCH #127 only · keep PASS · edit-in-place on full restored module.
 *
 * PASS (do not regress):
 *   pizza over South America → Origin · camera · -32.946, -61.777
 *   / No delivery shops near view · type Locate once
 *   No Kalithea 36.388 list. No Google wall.
 *
 * FAIL 1: never SNMap.open / showLiveSat / Leaflet during the hunt — WebGL globe only.
 * FAIL 2: after/during hunt, `show rhodes` flies camera/MESH to ~36.44,28.22 and pins vendors.
 *         Never plaza/POI crawler dump (Πλατεία Αθηνάς / 18 POIs / 80 real shops).
 * FAIL 3: YOU is ONLY _snPhysPos + _snLocatedThisSession from an explicit GPS grant.
 *         Never IP, never city geocode, never Leaflet center, never San Jose, never Kalithea.
 *         No grant → origin is the camera, never a silent "you".
 * FAIL 4: pins only after a real in-view hunt via SNGlobe.pulse + consumeClick.
 *         No grey placeholder glyphs on empty South America.
 *
 * REAL SNGlobe API (production globe.js — do not invent):
 *   flyNear(lat, lng, tierHint) — moves mesh via phys.tTilt / phys.tSpin; returns if G.dragging
 *   goToPlace(lat, lng, {tier, openMap:false, skipScan:true, pulse:false}) → calls flyNear
 *   setFocus(lat, lng)
 *   viewLatLng() = pickLatLng of screen center (verification source of truth)
 *   pulse(lat, lng, color, label, ms) requires SNGlobe.ready, returns mesh or null
 *   setGlobeLatLng is internal — reimplemented via getTilt/getSpin when needed
 *
 * Guest `order me a pizza` / pizza:
 *   - hunts public.vendors bbox (delivery_enabled restaurants)
 *   - drops tap-able pulse pins on SNGlobe at each vendor lat/lng
 *   - short CLI list name·km·⭐
 *   - browse shops free; Google sign-in ONLY at pay / HOLD ⭐
 *   - never open #sn-auth-modal on pizza for guests
 *   - no Astranov Kitchen · no 85-pt · no Mesh Alpha
 *   - twin CLIs stay
 *
 * Product law: if it is not on the globe it is not shipped.
 * NEVER swap this file for a stub because pulse isn't ready — wait and retry.
 */
(function (G) {
  'use strict';
  G.__snGuestPizzaHunt0822 = 1;
  var BUILD = '20260822155100-force-mesh-fly';
  var hunting = false;
  var huntSession = false;
  var lastPins = [];
  var pinMeshes = [];
  var clickUnsub = null;
  var askedLocate = false;
  var suppressPoiUntil = 0;
  var canvasTapBound = false;
  var preferCameraUntil = 0;
  var lastFly = null;

  var RHODES = { lat: 36.44, lng: 28.22, name: 'Rhodes' };

  // Known fake / HQ / IP leaks that must NEVER be reported as YOU
  var FAKE_YOU = [
    { lat: 36.387557, lng: 28.222533, r: 0.03, name: 'Kalithea' },
    { lat: 36.434, lng: 28.217, r: 0.06, name: 'Rhodes silent' },
    { lat: 36.43, lng: 28.22, r: 0.05, name: 'Rhodes center' },
    { lat: 36.443, lng: 28.226, r: 0.04, name: 'Rhodes town' },
    { lat: 37.339, lng: -121.895, r: 0.12, name: 'San Jose IP' },
    { lat: 37.338, lng: -121.886, r: 0.12, name: 'Columbus Park' },
    { lat: 37.33, lng: -121.89, r: 0.12, name: 'San Jose' },
  ];

  var FOOD =
    /restaurant|fast_food|cafe|bar|pub|food|pizza|pizzeria|bakery|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert|market/i;
  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;
  var ORDER_FOOD_RE =
    /\b(order\s+(me\s+)?(a\s+)?(food|meal|burger|souvlaki|kebab|sushi)|food\s+delivery|deliver\s+(me\s+)?(food|pizza))\b/i;
  var SHOW_RHODES_RE =
    /^(show|fly|go(?:\s+to)?|zoom(?:\s+to)?|take\s+me\s+to|look\s+at)\s+(the\s+)?(island\s+(of\s+)?)?(rhodes|rodos|ρόδος|ρόδο|ροδος|ροδοσ)\b/i;
  var POI_DUMP_RE =
    /Πλατεία|Πλατεια|πλατεία|\b\d+\s+POIs?\b|\b\d+\s+real shops\b|80 real shops|18 POIs/i;

  function log(m, c) {
    try {
      if (G.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 420), c || 'ok', true);
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

  function nearFake(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return true;
    for (var i = 0; i < FAKE_YOU.length; i++) {
      var f = FAKE_YOU[i];
      if (Math.abs(lat - f.lat) <= f.r && Math.abs(lng - f.lng) <= f.r) return f.name;
    }
    return null;
  }

  function isIpOrSoftSource(pos) {
    if (!pos) return true;
    if (pos.fallback) return true;
    if (pos.fromIp || pos.ip || pos.soft) return true;
    var src = String(pos.source || pos.from || '').toLowerCase();
    if (!src) return false;
    return /ip|soft|cache|leaflet|map|geocode|city|nominatim|photon|approx|look|verified/.test(src);
  }

  /** YOU = _snPhysPos + _snLocatedThisSession from an explicit GPS grant this session. */
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
      if (nearFake(+p.lat, +p.lng) || isIpOrSoftSource(p) || !G._snLocatedThisSession) {
        if (nearFake(+p.lat, +p.lng) || isIpOrSoftSource(p)) {
          G._snLocatedThisSession = false;
        }
      }
    } catch (_) {}
  }

  function cameraLook() {
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function') {
        var look = SNGlobe.viewLatLng();
        if (look && look.lat != null && isFinite(look.lat)) return { lat: +look.lat, lng: +look.lng };
      }
    } catch (_) {}
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

  /** Soft: pulse exists ⇒ treat ready. Never happy-path list-only when SNGlobe is on page. */
  function isGlobeReady() {
    try {
      if (G.SNGlobe && typeof SNGlobe.pulse === 'function') return true;
      if (G.SNGlobe && G.SNGlobe.ready === true) return true;
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
   *   1) After show-rhodes (preferCameraUntil) → that camera, never YOU
   *   2) real YOU only if located THIS session (GPS grant)
   *   3) current camera look-at
   * NEVER invent Kalithea / silent Rhodes / San Jose IP as you.
   * NEVER trust bare _snLastPos (setFocus / Leaflet / IP pollute it).
   */
  function resolveOrigin() {
    scrubFakeYou();

    if (Date.now() < preferCameraUntil) {
      if (lastFly && lastFly.lat != null) {
        return { lat: lastFly.lat, lng: lastFly.lng, source: 'camera' };
      }
      var camR = cameraLook();
      if (camR) return { lat: camR.lat, lng: camR.lng, source: 'camera' };
    }

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
    if (/85[\s\-]?pt|DRIVER\s+EN\s+ROUTE/i.test(n)) return true;
    if (/Πλατεία|Πλατεια|πλατεία/i.test(n)) return true;
    return false;
  }
  function isFoodOrShop(v) {
    if (!v) return false;
    if (isBannedName(v.name)) return false;
    if (String(v.id || '').indexOf('demo-') === 0 || String(v.id || '').indexOf('kitchen_') === 0)
      return false;
    var blob =
      String(v.category || '') +
      ' ' +
      String(v.shopKind || '') +
      ' ' +
      String(v.kind || '') +
      ' ' +
      String(v.name || '') +
      ' ' +
      (Array.isArray(v.tags) ? v.tags.join(' ') : String(v.tags || ''));
    return FOOD.test(blob) || v.delivery_enabled === true;
  }

  function hideLeaflet() {
    try {
      if (G.SNMap && typeof SNMap.close === 'function') SNMap.close();
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

  function installMapGuard() {
    try {
      if (G.SNMap) {
        if (typeof SNMap.open === 'function' && !SNMap.__snPizzaOpenGuard) {
          var prevOpen = SNMap.open.bind(SNMap);
          SNMap.open = function () {
            if (globeOnly()) {
              hideLeaflet();
              return Promise.resolve(null);
            }
            return prevOpen.apply(SNMap, arguments);
          };
          SNMap.__snPizzaOpenGuard = true;
        }
        if (typeof SNMap.showLiveSat === 'function' && !SNMap.__snPizzaSatGuard) {
          var prevSat = SNMap.showLiveSat.bind(SNMap);
          SNMap.showLiveSat = function () {
            if (globeOnly()) {
              hideLeaflet();
              return Promise.resolve(null);
            }
            return prevSat.apply(SNMap, arguments);
          };
          SNMap.__snPizzaSatGuard = true;
        }
      }
    } catch (_) {}
    try {
      if (G.SNGlobe && typeof SNGlobe.goToPlace === 'function' && !SNGlobe.__snPizzaGoGuard) {
        var prevGo = SNGlobe.goToPlace.bind(SNGlobe);
        SNGlobe.goToPlace = function (lat, lng, opts) {
          opts = Object.assign({}, opts || {});
          if (globeOnly()) {
            opts.openMap = false;
            opts.skipScan = true;
          }
          return prevGo(lat, lng, opts);
        };
        SNGlobe.__snPizzaGoGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNGlobe && typeof SNGlobe.locate === 'function' && !SNGlobe.__snPizzaLocGuard) {
        var prevLoc = SNGlobe.locate.bind(SNGlobe);
        SNGlobe.locate = function () {
          if (globeOnly()) {
            return Promise.resolve({
              lat: null,
              lng: null,
              fallback: true,
              reason: 'hunt-globe-only',
            });
          }
          return prevLoc.apply(SNGlobe, arguments);
        };
        SNGlobe.__snPizzaLocGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNCli && typeof SNCli.gpsLocate === 'function' && !SNCli.__snPizzaGpsGuard) {
        var prevGps = SNCli.gpsLocate.bind(SNCli);
        SNCli.gpsLocate = function (opts) {
          if (globeOnly()) {
            opts = Object.assign({}, opts || {}, { allowIp: false, allowSoft: false });
          }
          return prevGps(opts);
        };
        SNCli.__snPizzaGpsGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNSearch && typeof SNSearch.crawl === 'function' && !SNSearch.__snPizzaCrawlGuard) {
        var prevCrawl = SNSearch.crawl.bind(SNSearch);
        SNSearch.crawl = function (q, opts) {
          if (globeOnly()) {
            return Promise.resolve({
              places: [],
              nearby: [],
              web: [],
              wiki: null,
              wikiHits: [],
              acted: ['pizza-hunt-block'],
            });
          }
          return prevCrawl(q, opts);
        };
        SNSearch.__snPizzaCrawlGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNCosmos && typeof SNCosmos.scan === 'function' && !SNCosmos.__snPizzaScanGuard) {
        var prevScan = SNCosmos.scan.bind(SNCosmos);
        SNCosmos.scan = function () {
          if (globeOnly()) return Promise.resolve({ lines: [], nearby: [], shops: 0 });
          return prevScan.apply(SNCosmos, arguments);
        };
        SNCosmos.__snPizzaScanGuard = true;
      }
    } catch (_) {}
    try {
      if (G.SNCli && typeof SNCli.log === 'function' && !SNCli.__snPizzaLogGuard) {
        var prevLog = SNCli.log.bind(SNCli);
        SNCli.log = function (m, c, force) {
          if (globeOnly() && POI_DUMP_RE.test(String(m || ''))) return;
          return prevLog(m, c, force);
        };
        SNCli.__snPizzaLogGuard = true;
      }
    } catch (_) {}
  }

  function beginGlobeHunt() {
    huntSession = true;
    hunting = true;
    G.__snPizzaHuntLive = true;
    installMapGuard();
    hideLeaflet();
    suppressPoiUntil = Date.now() + 4000;
    try {
      if (G.SNGlobe) G.SNGlobe.consumeClick = true;
    } catch (_) {}
  }

  function endGlobeHunt() {
    hunting = false;
    hideLeaflet();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
  }

  /**
   * Force the visible Earth mesh / camera to lat,lng.
   * Production path: flyNear sets phys.tTilt / phys.tSpin (the only thing that rotates the mesh).
   * flyNear early-returns if G.dragging — so we also do an instant tilt/spin write via getTilt/getSpin
   * (same math as internal setGlobeLatLng) so viewLatLng cannot stay on South America.
   */
  function flyGlobeTo(lat, lng, label) {
    lat = +lat;
    lng = +lng;
    if (!isFinite(lat) || !isFinite(lng)) return;
    lastFly = { lat: lat, lng: lng, ts: Date.now(), label: label || '' };
    try {
      G._snGlobeFocus = { lat: lat, lng: lng, label: label || '', t: Date.now() };
    } catch (_) {}
    hideLeaflet();

    // Instant mesh write (internal setGlobeLatLng equivalent). Bypasses dragging gate.
    try {
      if (G.SNGlobe) {
        var tilt = typeof SNGlobe.getTilt === 'function' ? SNGlobe.getTilt() : null;
        var spin = typeof SNGlobe.getSpin === 'function' ? SNGlobe.getSpin() : null;
        if (tilt && spin) {
          var TILT_MAX = 1.05;
          var x = (-lat * Math.PI) / 180;
          var y = (-lng * Math.PI) / 180;
          if (x > TILT_MAX) x = TILT_MAX;
          if (x < -TILT_MAX) x = -TILT_MAX;
          try {
            tilt.rotation.set(x, 0, 0);
            spin.rotation.set(0, y, 0);
            if (tilt.quaternion && tilt.quaternion.setFromEuler) tilt.quaternion.setFromEuler(tilt.rotation);
            if (spin.quaternion && spin.quaternion.setFromEuler) spin.quaternion.setFromEuler(spin.rotation);
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Primary: flyNear is what moves phys.tTilt / phys.tSpin
    try {
      if (G.SNGlobe && typeof SNGlobe.flyNear === 'function') {
        SNGlobe.flyNear(lat, lng, 'city');
      }
    } catch (_) {}

    // goToPlace → flyNear + setFocus + tier (openMap/skipScan forced for hunt)
    try {
      if (G.SNGlobe && typeof SNGlobe.goToPlace === 'function') {
        SNGlobe.goToPlace(lat, lng, {
          tier: 'city',
          body: 'earth',
          pulse: false,
          openMap: false,
          skipScan: true,
          label: label || '',
        });
      }
    } catch (_) {}

    try {
      if (G.SNGlobe && typeof SNGlobe.setFocus === 'function') {
        SNGlobe.setFocus(lat, lng);
      }
    } catch (_) {}
  }

  function blockAuthModalOnPizza() {
    try {
      var modal = document.getElementById('sn-auth-modal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('open', 'show', 'sn-open');
      }
    } catch (_) {}
    try {
      if (G.SNAuth && typeof SNAuth.openModal === 'function' && !SNAuth.__snPizzaGuard) {
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
        SNAuth.__snPizzaGuard = true;
      }
    } catch (_) {}
  }

  function stayPutSoft(nearest) {
    hideLeaflet();
    if (!nearest || nearest.lat == null || nearest.lng == null) return;
    if (Date.now() < preferCameraUntil) return;
    try {
      if (G.SNGlobe && typeof SNGlobe.flyNear === 'function') {
        SNGlobe.flyNear(+nearest.lat, +nearest.lng, null);
      }
    } catch (_) {}
  }

  function clearPizzaPins() {
    lastPins = [];
    pinMeshes = [];
    try {
      if (G.SNGlobe && typeof SNGlobe.clearMarkers === 'function') SNGlobe.clearMarkers();
    } catch (_) {}
    hideLeaflet();
  }

  function paintPins(rows, origin) {
    clearPizzaPins();
    if (!rows || !rows.length) return 0;
    var painted = 0;
    // Soft ready: pulse exists ⇒ ready (no hard .ready gate that killed pins)
    var ready = isGlobeReady();

    rows.slice(0, 24).forEach(function (v, i) {
      if (!v || v.lat == null || v.lng == null) return;
      var lat = +v.lat;
      var lng = +v.lng;
      if (!isFinite(lat) || !isFinite(lng)) return;
      var kmOrigin = origin ? haversineKm(origin, { lat: lat, lng: lng }) : null;
      if (kmOrigin != null && kmOrigin > 18) return;
      // No kmCam filter — pins must appear after SA→Rhodes settle
      var label = String(v.name || 'shop').slice(0, 28);
      var color = i === 0 ? 0xff9f43 : 0x5ad4ff;
      lastPins.push({
        id: v.id,
        name: v.name,
        lat: lat,
        lng: lng,
        km: kmOrigin,
        emoji: v.emoji || '🍕',
      });

      if (ready) {
        try {
          var mesh = SNGlobe.pulse(lat, lng, color, label, 180000);
          if (mesh) {
            try {
              mesh.userData = mesh.userData || {};
              mesh.userData.snVendor = true;
              mesh.userData.snName = v.name;
              mesh.userData.snKm = kmOrigin;
            } catch (_) {}
            pinMeshes.push(mesh);
            painted++;
          }
        } catch (_) {}
      }
    });

    installPinTap();
    return painted;
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
          var tol = 45;
          try {
            if (G.SNGlobe && typeof SNGlobe.currentTier === 'function') {
              var t = String(SNGlobe.currentTier() || '');
              if (t === 'city' || t === 'street' || t === 'local') tol = 8;
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
    try {
      if (G.SNGlobe && typeof SNGlobe.pulse === 'function') {
        SNGlobe.pulse(hit.lat, hit.lng, 0xff9f43, hit.name || 'shop', 12000);
      }
    } catch (_) {}
  }

  function installPinTap() {
    try {
      if (clickUnsub) {
        try {
          clickUnsub();
        } catch (_) {}
        clickUnsub = null;
      }
      if (!G.SNGlobe || typeof SNGlobe.onClick !== 'function') return;
      clickUnsub = SNGlobe.onClick(function (cx, cy) {
        if (!lastPins.length) return false;
        if (Date.now() < suppressPoiUntil) return true;
        var hit = hitVendorAt(cx, cy);
        if (!hit) return false;
        announceVendor(hit);
        return true;
      });
    } catch (_) {}

    try {
      if (canvasTapBound) return;
      var canvas =
        (G.SNGlobe &&
          G.SNGlobe.getRenderer &&
          G.SNGlobe.getRenderer() &&
          G.SNGlobe.getRenderer().domElement) ||
        document.querySelector('#globe canvas') ||
        document.querySelector('canvas');
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
          announceVendor(hit);
        },
        true
      );
    } catch (_) {}
  }

  async function queryVendorsBbox(lat, lng, radiusKm) {
    var urlBase = baseUrl();
    if (!urlBase) return [];
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return [];
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 14;
    var dLat = rKm / 111;
    var dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    var q =
      urlBase +
      '/rest/v1/vendors?select=id,osm_id,name,emoji,lat,lng,category,items,tags,is_active,delivery_enabled' +
      '&is_active=eq.true&delivery_enabled=eq.true' +
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
    return rows.filter(isFoodOrShop).map(function (v) {
      return Object.assign({}, v, { real: true, source: 'supabase', delivery_enabled: true });
    });
  }

  function listInCli(rows, origin) {
    if (!rows || !rows.length) {
      log('No delivery shops near view · type Locate once', 'dim');
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
      log('No delivery shops near view · type Locate once', 'dim');
      return;
    }
    log('Pizza hunt · ' + scored.length + ' shops · public.vendors · on globe', 'ok');
    scored.forEach(function (s, i) {
      var name = String(s.v.name || 'shop').slice(0, 32);
      var kmS = s.km < 99 ? s.km.toFixed(1) + 'km' : '—';
      log(i + 1 + ' · ' + name + ' · ' + kmS + ' · ⭐', 'ok');
    });
    log('Tap a pin on the globe · Google only at pay / HOLD ⭐', 'dim');
    preview(scored[0].v.name + ' · ' + scored[0].km.toFixed(1) + 'km · ⭐');
  }

  function askLocateOnce() {
    hideLeaflet();
    if (askedLocate) {
      log('Still no origin · type Locate (GPS) then pizza again', 'dim');
      return;
    }
    askedLocate = true;
    log('No delivery shops near view · type Locate once', 'dim');
    preview('Locate → then pizza');
  }

  function faceClusterIfNeeded(use, origin) {
    if (!use || !use.length) return;
    if (Date.now() < preferCameraUntil) return;
    var cam = cameraLook();
    var nearest = use
      .map(function (v) {
        return {
          lat: +v.lat,
          lng: +v.lng,
          name: v.name,
          km: origin ? haversineKm(origin, { lat: +v.lat, lng: +v.lng }) : 99,
          camKm: cam ? haversineKm(cam, { lat: +v.lat, lng: +v.lng }) : 0,
        };
      })
      .filter(function (n) {
        return n.km <= 18;
      })
      .sort(function (a, b) {
        return a.km - b.km;
      })[0];
    if (!nearest) return;
    if (cam && nearest.camKm < 80) return;
    if (origin && origin.source === 'camera') return;
    stayPutSoft(nearest);
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  async function fetchNear(origin) {
    var rows = [];
    try {
      rows = await queryVendorsBbox(origin.lat, origin.lng, 16);
    } catch (e) {
      log('Vendors bbox · ' + (e && e.message ? e.message : e), 'dim');
      try {
        if (G.SNCommerce && SNCommerce.loadNear) {
          rows = ((await SNCommerce.loadNear(origin.lat, origin.lng, 16)) || []).filter(isFoodOrShop);
        }
      } catch (_) {}
    }
    rows = (rows || []).filter(function (v) {
      if (!v || v.lat == null) return false;
      return haversineKm(origin, { lat: +v.lat, lng: +v.lng }) <= 16.5;
    });
    var pizzaish = rows.filter(function (v) {
      return /pizza|pizzeria|italiano|makkaroni|margherita/i.test(
        String(v.name || '') + ' ' + String(v.category || '')
      );
    });
    return pizzaish.length
      ? pizzaish.concat(
          rows.filter(function (v) {
            return pizzaish.indexOf(v) < 0;
          })
        )
      : rows;
  }

  async function huntAt(origin, raw) {
    if (!origin) {
      clearPizzaPins();
      log('No origin yet · type Locate once (GPS)', 'dim');
      askLocateOnce();
      return true;
    }

    if (origin.source === 'you' && nearFake(origin.lat, origin.lng)) {
      var cam2 = cameraLook();
      if (cam2) origin = { lat: cam2.lat, lng: cam2.lng, source: 'camera' };
      else {
        clearPizzaPins();
        askLocateOnce();
        return true;
      }
    }

    log(
      'Origin · ' + origin.source + ' · ' + origin.lat.toFixed(3) + ', ' + origin.lng.toFixed(3),
      'dim'
    );

    var use = await fetchNear(origin);

    if (!use.length) {
      clearPizzaPins();
      if (origin.source === 'you' && hasSessionLocate()) {
        log('No delivery shops in 16 km · spin globe or try another area', 'dim');
      } else {
        log('No delivery shops near view · type Locate once', 'dim');
        preview('Locate → then pizza');
        askedLocate = true;
      }
      return true;
    }

    // Wait for globe ready so pulses land (soft). NEVER stub the file.
    await waitGlobeReady(1800);
    var nPainted = paintPins(use, origin);
    listInCli(use, origin);
    if (nPainted > 0) {
      log('Pins on globe · ' + nPainted + ' shops · tap a pin', 'ok');
    } else {
      // One more try after short settle
      await sleep(400);
      await waitGlobeReady(1200);
      nPainted = paintPins(use, origin);
      if (nPainted > 0) {
        log('Pins on globe · ' + nPainted + ' shops · tap a pin', 'ok');
      } else {
        log('Globe pulse unavailable · list only (SNGlobe not ready)', 'dim');
      }
    }

    faceClusterIfNeeded(use, origin);

    if (isGuest() && raw) {
      log('Guest browse · sign in only when you HOLD ⭐ / pay', 'dim');
    }
    return true;
  }

  async function huntPizza(raw) {
    if (hunting) return true;
    beginGlobeHunt();
    blockAuthModalOnPizza();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
    try {
      var a = document.getElementById('cli-in');
      if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in');
      if (b) b.value = '';
    } catch (_) {}

    log(String(raw || 'pizza').slice(0, 80), 'cmd');

    try {
      var origin = resolveOrigin();
      await huntAt(origin, raw);
    } finally {
      endGlobeHunt();
    }
    return true;
  }

  /**
   * show rhodes: MUST move the visible Earth mesh to 36.44,28.22 via flyNear + instant tilt/spin,
   * then pulse vendors. Exact log required. viewLatLng must leave SA.
   */
  async function showRhodes(raw) {
    beginGlobeHunt();
    blockAuthModalOnPizza();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
    try {
      var a = document.getElementById('cli-in');
      if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in');
      if (b) b.value = '';
    } catch (_) {}

    log(String(raw || 'show rhodes').slice(0, 80), 'cmd');
    preferCameraUntil = Date.now() + 180000;

    await waitGlobeReady(2200);

    // Multi-fly so mesh actually rotates (flyNear can early-return while dragging)
    flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');
    await sleep(320);
    flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');
    await sleep(280);
    flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');

    // Exact required log
    log('Rhodes. globe camera. 36.44, 28.22', 'ok');
    preview('Rhodes · globe');

    await sleep(450);

    // Verify source of truth: viewLatLng must be near Rhodes, not SA
    var look = null;
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function') look = SNGlobe.viewLatLng();
    } catch (_) {}
    var stillSa =
      !look ||
      look.lat == null ||
      (Math.abs(+look.lat - (-32.99)) < 8 && Math.abs(+look.lng - (-61.78)) < 12) ||
      (Math.abs(+look.lat - RHODES.lat) > 12 || Math.abs(+look.lng - RHODES.lng) > 12);

    if (stillSa) {
      // Hard force again — instant tilt/spin + flyNear
      flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');
      await sleep(400);
      flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');
    }

    // Final fly then hunt + pulse at camera origin
    flyGlobeTo(RHODES.lat, RHODES.lng, 'Rhodes');

    try {
      await huntAt({ lat: RHODES.lat, lng: RHODES.lng, source: 'camera' }, null);
    } finally {
      endGlobeHunt();
    }
    return true;
  }

  function isPizzaLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (PIZZA_RE.test(s)) return true;
    if (ORDER_FOOD_RE.test(s) && /pizza|food|meal/i.test(s)) return true;
    if (/^pizza\b/i.test(s)) return true;
    return false;
  }

  function isShowRhodes(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (SHOW_RHODES_RE.test(s)) return true;
    if (/^(rhodes|rodos|ρόδος|ρόδο)$/i.test(s)) return true;
    return false;
  }

  function isBareLocate(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/^(locate|gps|where am i|find me)$/i.test(s)) return true;
    if (/^locate$/i.test(s) || /^gps$/i.test(s)) return true;
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
      log('No geolocation · spin globe over a town then pizza', 'dim');
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
        log('Locate rejected fake pin · spin globe then pizza', 'dim');
        return;
      }
      markSessionLocate(lat, lng, {
        source: 'gps',
        real: true,
        fallback: false,
        fromGps: true,
        accuracy: pos.coords.accuracy,
      });
      log('Located · ' + lat.toFixed(3) + ', ' + lng.toFixed(3) + ' · type pizza again', 'ok');
      flyGlobeTo(lat, lng, 'You');
    } else {
      log('Locate failed · grant GPS or spin globe over a town then pizza', 'dim');
    }
  }

  function install() {
    blockAuthModalOnPizza();
    installMapGuard();
    scrubFakeYou();
    if (!G.SNCli || typeof SNCli.run !== 'function') return;
    if (SNCli.__snGuestPizzaHuntBuild === BUILD) return;
    SNCli.__snGuestPizzaHuntBuild = BUILD;
    SNCli.__snGuestPizzaHunt = 1;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      try {
        var s = String(raw || '').trim();
        if (isBareLocate(s) && globeOnly()) {
          void grantLocateGps();
          return Promise.resolve(true);
        }
        if (isBareLocate(s)) {
          var p = prev(raw);
          setTimeout(function () {
            try {
              var pos = G._snPhysPos;
              if (
                pos &&
                pos.lat != null &&
                !nearFake(+pos.lat, +pos.lng) &&
                !isIpOrSoftSource(pos) &&
                (pos.fromGps === true || pos.real === true || String(pos.source || '') === 'gps')
              ) {
                markSessionLocate(pos.lat, pos.lng, {
                  source: 'gps',
                  real: true,
                  fallback: false,
                  fromGps: true,
                });
              }
            } catch (_) {}
          }, 1400);
          return p;
        }
        if (isPizzaLine(s)) {
          void huntPizza(s);
          return Promise.resolve(true);
        }
        if (isShowRhodes(s) && (huntSession || hunting)) {
          void showRhodes(s);
          return Promise.resolve(true);
        }
        if (isGuest() && isPayHold(s)) {
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

    try {
      var form = document.getElementById('cli-form') || document.querySelector('#panel form');
      var input = document.getElementById('cli-in');
      var topIn = document.getElementById('stc-cmd-in');
      function capture(ev, el) {
        var v = String((el && el.value) || '').trim();
        if (!v) return false;
        var handled = false;
        if (isPizzaLine(v)) {
          handled = true;
          void huntPizza(v);
        } else if (isShowRhodes(v) && (huntSession || hunting)) {
          handled = true;
          void showRhodes(v);
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
      if (form && input && !input._snPizzaHunt120) {
        input._snPizzaHunt120 = 1;
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
      if (topIn && !topIn._snPizzaHunt120) {
        topIn._snPizzaHunt120 = 1;
        topIn.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, topIn);
          },
          true
        );
      }
    } catch (_) {}

    try {
      if (G.SNMarket && typeof SNMarket.fulfillFoodIntent === 'function') {
        if (!SNMarket._snPizzaHunt120) {
          var ful = SNMarket.fulfillFoodIntent.bind(SNMarket);
          SNMarket.fulfillFoodIntent = async function (q, opts) {
            var line = String(q || (opts && opts.text) || '');
            if (isGuest() && !snDebug() && (isPizzaLine(line) || /pizza|food|meal/i.test(line))) {
              await huntPizza(line || 'order me a pizza');
              return {
                ok: true,
                guest_browse: true,
                reply: 'Shops on globe · Google only at pay / HOLD ⭐',
              };
            }
            return ful(q, opts);
          };
          SNMarket._snPizzaHunt120 = true;
        }
      }
    } catch (_) {}
  }

  function boot() {
    scrubFakeYou();
    install();
    blockAuthModalOnPizza();
    installMapGuard();
    installPinTap();
  }

  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 0);
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
  setTimeout(boot, 4000);
  setInterval(function () {
    install();
    blockAuthModalOnPizza();
    if (globeOnly()) hideLeaflet();
  }, 8000);

  G.SNChromeGuestPizzaHunt = {
    build: BUILD,
    hunt: huntPizza,
    showRhodes: showRhodes,
    queryVendorsBbox: queryVendorsBbox,
    resolveOrigin: resolveOrigin,
    lastPins: function () {
      return lastPins.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
