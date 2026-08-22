/**
 * Guest pizza hunt — Build 20260822114500-show-clean
 * PATCH #127 only · origin + pin-tap + NO Leaflet + clean show place.
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
 * ORIGIN LAW (20260822110000):
 *   YOU = window._snPhysPos / real GPS ONLY if user located THIS session.
 *   Else current camera look-at (viewLatLng / focusPos).
 *   NEVER Kalithea 36.387557,28.222533 · NEVER silent Rhodes 36.43,28.22 as you.
 *   _snLastPos is polluted by setFocus (village/HQ) — NEVER treat as YOU alone.
 *   Empty ocean / SA / no vendors in bbox → CLI Locate CTA only · zero shop list · zero fake you.
 *
 * GLOBE-ONLY LAW (20260822113000):
 *   FORBID any SNMap.open / showLiveSat / Leaflet / street overlay for the whole hunt.
 *   Stay WebGL globe only. No San Jose / Columbus Park / OSM street takeover during wait.
 *
 * SHOW LAW (20260822114500):
 *   After/during pizza hunt, `show rhodes` (or any show <place>) MUST only fly the
 *   WebGL camera and pin vendors. NEVER run plaza/POI crawler dump
 *   (Πλατεία Αθηνάς / 18 POIs / 80 real shops).
 *
 * After successful hunt: face pin cluster if pins are off current camera,
 * or keep camera and only pin vendors already in view.
 *
 * PIN TAP: vendor pulse → SNCli.log name·km·⭐ only.
 * Block plaza/POI dump. No camera drift to SA.
 *
 * Product law: if it is not on the globe it is not shipped.
 */
(function (G) {
  'use strict';
  // Force re-install of this build even if older pizza-hunt already bound
  G.__snGuestPizzaHunt0822 = 1;
  var BUILD = '20260822114500-show-clean';
  var hunting = false;
  var lastPins = [];
  var pinMeshes = [];
  var clickUnsub = null;
  var askedLocate = false;
  var suppressPoiUntil = 0;
  var canvasTapBound = false;
  var mapGuardInstalled = false;
  var pizzaLiveUntil = 0; // after successful hunt, keep show-intercept active for a while

  // Known fake / HQ defaults that must NEVER be reported as YOU
  var FAKE_YOU = [
    { lat: 36.387557, lng: 28.222533, r: 0.02, name: 'Kalithea' },
    { lat: 36.434, lng: 28.217, r: 0.06, name: 'Rhodes silent' },
    { lat: 36.43, lng: 28.22, r: 0.05, name: 'Rhodes center' },
    { lat: 36.443, lng: 28.226, r: 0.04, name: 'Rhodes town' },
  ];

  // Simple place → lat/lng for clean show (no POI crawl)
  var KNOWN_PLACES = {
    rhodes: { lat: 36.4341, lng: 28.2176, name: 'Rhodes' },
    rhodos: { lat: 36.4341, lng: 28.2176, name: 'Rhodes' },
    'rhodes town': { lat: 36.443, lng: 28.226, name: 'Rhodes town' },
    kalithea: { lat: 36.3876, lng: 28.2225, name: 'Kalithea' },
    athens: { lat: 37.9838, lng: 23.7275, name: 'Athens' },
    athina: { lat: 37.9838, lng: 23.7275, name: 'Athens' },
  };

  var FOOD =
    /restaurant|fast_food|cafe|bar|pub|food|pizza|pizzeria|bakery|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert|market/i;
  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;
  var ORDER_FOOD_RE =
    /\b(order\s+(me\s+)?(a\s+)?(food|meal|burger|souvlaki|kebab|sushi)|food\s+delivery|deliver\s+(me\s+)?(food|pizza))\b/i;
  var SHOW_RE = /^show\s+(.+)$/i;

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

  function nearFake(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return true;
    for (var i = 0; i < FAKE_YOU.length; i++) {
      var f = FAKE_YOU[i];
      if (Math.abs(lat - f.lat) <= f.r && Math.abs(lng - f.lng) <= f.r) return f.name;
    }
    return null;
  }

  /** True only when user actually Located this browser session. */
  function hasSessionLocate() {
    try {
      if (G._snLocatedThisSession) return true;
    } catch (_) {}
    try {
      if (G._snPhysPos && (G._snPhysPos.fromGps || G._snPhysPos.session || G._snPhysPos.ts)) {
        if (!nearFake(+G._snPhysPos.lat, +G._snPhysPos.lng)) return true;
      }
    } catch (_) {}
    return false;
  }

  function markSessionLocate(lat, lng, extra) {
    try {
      G._snLocatedThisSession = true;
      var row = Object.assign(
        { lat: +lat, lng: +lng, fromGps: true, session: true, ts: Date.now() },
        extra || {}
      );
      G._snPhysPos = row;
      G._snLastPos = row;
    } catch (_) {}
  }

  function resolveOrigin() {
    try {
      if (hasSessionLocate() && G._snPhysPos && G._snPhysPos.lat != null) {
        var plat = +G._snPhysPos.lat;
        var plng = +G._snPhysPos.lng;
        if (isFinite(plat) && isFinite(plng) && !nearFake(plat, plng)) {
          return { lat: plat, lng: plng, source: 'you' };
        }
      }
    } catch (_) {}

    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function') {
        var look = SNGlobe.viewLatLng();
        if (look && look.lat != null && look.lng != null && isFinite(look.lat)) {
          return { lat: +look.lat, lng: +look.lng, source: 'camera' };
        }
      }
    } catch (_) {}
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

  function forceGlobeOnly() {
    try {
      if (G.SNMap) {
        if (typeof SNMap.close === 'function') SNMap.close();
        if (typeof SNMap.hide === 'function') SNMap.hide();
        if (typeof SNMap.closeStreet === 'function') SNMap.closeStreet();
        if (typeof SNMap.closeLive === 'function') SNMap.closeLive();
        SNMap.active = false;
      }
    } catch (_) {}
    try {
      var sels = [
        '#sn-map',
        '#map',
        '.leaflet-container',
        '.sn-street',
        '.sn-live-sat',
        '#live-sat',
        '[data-sn-map]',
        '.mapboxgl-map',
      ];
      sels.forEach(function (sel) {
        try {
          document.querySelectorAll(sel).forEach(function (el) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.setAttribute('aria-hidden', 'true');
          });
        } catch (_) {}
      });
    } catch (_) {}
  }

  function installMapGuard() {
    if (mapGuardInstalled) return;
    mapGuardInstalled = true;
    try {
      if (G.SNMap) {
        if (typeof SNMap.open === 'function' && !SNMap.__snPizzaGuardOpen) {
          var prevOpen = SNMap.open.bind(SNMap);
          SNMap.open = function () {
            if (hunting || Date.now() < pizzaLiveUntil) {
              forceGlobeOnly();
              return;
            }
            return prevOpen.apply(SNMap, arguments);
          };
          SNMap.__snPizzaGuardOpen = true;
        }
        if (typeof SNMap.show === 'function' && !SNMap.__snPizzaGuardShow) {
          var prevShow = SNMap.show.bind(SNMap);
          SNMap.show = function () {
            if (hunting || Date.now() < pizzaLiveUntil) {
              forceGlobeOnly();
              return;
            }
            return prevShow.apply(SNMap, arguments);
          };
          SNMap.__snPizzaGuardShow = true;
        }
        if (typeof SNMap.showLiveSat === 'function' && !SNMap.__snPizzaGuardLive) {
          var prevLive = SNMap.showLiveSat.bind(SNMap);
          SNMap.showLiveSat = function () {
            if (hunting || Date.now() < pizzaLiveUntil) {
              forceGlobeOnly();
              return;
            }
            return prevLive.apply(SNMap, arguments);
          };
          SNMap.__snPizzaGuardLive = true;
        }
        if (typeof SNMap.goToStreet === 'function' && !SNMap.__snPizzaGuardStreet) {
          var prevStreet = SNMap.goToStreet.bind(SNMap);
          SNMap.goToStreet = function () {
            if (hunting || Date.now() < pizzaLiveUntil) {
              forceGlobeOnly();
              return;
            }
            return prevStreet.apply(SNMap, arguments);
          };
          SNMap.__snPizzaGuardStreet = true;
        }
      }
    } catch (_) {}
    try {
      if (typeof G.showLiveSat === 'function' && !G.__snPizzaMapGuard) {
        var prevG = G.showLiveSat.bind(G);
        G.showLiveSat = function () {
          if (hunting || Date.now() < pizzaLiveUntil) {
            forceGlobeOnly();
            return;
          }
          return prevG.apply(G, arguments);
        };
        G.__snPizzaMapGuard = true;
      }
    } catch (_) {}
  }

  function stayPutSoft(nearest) {
    forceGlobeOnly();
    if (!nearest || nearest.lat == null || nearest.lng == null) return;
    try {
      if (G.SNGlobe && typeof SNGlobe.flyNear === 'function') {
        SNGlobe.flyNear(+nearest.lat, +nearest.lng, null);
        return;
      }
    } catch (_) {}
    try {
      if (G.SNGlobe && typeof SNGlobe.pulse === 'function') {
        SNGlobe.pulse(+nearest.lat, +nearest.lng, 0xff9f43, nearest.name || 'shop', 8000);
      }
    } catch (_) {}
  }

  function clearPizzaPins() {
    lastPins = [];
    pinMeshes = [];
    try {
      if (G.SNGlobe && typeof SNGlobe.clearMarkers === 'function') SNGlobe.clearMarkers();
    } catch (_) {}
  }

  function paintPins(rows, origin) {
    clearPizzaPins();
    if (!rows || !rows.length) return 0;
    var painted = 0;
    var ready = !!(G.SNGlobe && G.SNGlobe.ready && typeof SNGlobe.pulse === 'function');

    rows.slice(0, 24).forEach(function (v, i) {
      if (!v || v.lat == null || v.lng == null) return;
      var lat = +v.lat;
      var lng = +v.lng;
      if (!isFinite(lat) || !isFinite(lng)) return;
      var km = origin ? haversineKm(origin, { lat: lat, lng: lng }) : null;
      var label = String(v.name || 'shop').slice(0, 28);
      var color = i === 0 ? 0xff9f43 : 0x5ad4ff;
      lastPins.push({
        id: v.id,
        name: v.name,
        lat: lat,
        lng: lng,
        km: km,
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
              mesh.userData.snKm = km;
            } catch (_) {}
            pinMeshes.push(mesh);
            painted++;
          }
        } catch (_) {}
      }

      try {
        if (G.SNSpaceLinks && typeof SNSpaceLinks.addFieldPin === 'function') {
          SNSpaceLinks.addFieldPin(
            { lat: lat, lng: lng },
            { label: label, kind: 'vendor', color: color, ms: 180000 }
          );
        }
      } catch (_) {}
      try {
        if (G.SNField && typeof SNField.dropPin === 'function') {
          SNField.dropPin(lat, lng, { label: v.name, kind: 'vendor' });
        }
      } catch (_) {}
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
        (G.SNGlobe && G.SNGlobe.getRenderer && G.SNGlobe.getRenderer() && G.SNGlobe.getRenderer().domElement) ||
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
      log('No delivery shops near view · type Locate to hunt near you', 'dim');
      return;
    }
    var scored = rows
      .map(function (v) {
        var km = origin ? haversineKm(origin, { lat: +v.lat, lng: +v.lng }) : 99;
        return { v: v, km: km };
      })
      .sort(function (a, b) {
        return a.km - b.km;
      })
      .slice(0, 10);
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
    if (askedLocate) {
      log('Still no origin · type Locate (GPS) then pizza again', 'dim');
      return;
    }
    askedLocate = true;
    log('Camera has no local shops · type Locate once (no Google wall)', 'ok');
    preview('Locate → then pizza');
    try {
      if (G.SNGlobe && typeof SNGlobe.locate === 'function') {
        void SNGlobe.locate().then(function (row) {
          if (row && row.lat != null) {
            markSessionLocate(row.lat, row.lng, { fallback: !!row.fallback });
            log(
              'Located · ' +
                (+row.lat).toFixed(3) +
                ', ' +
                (+row.lng).toFixed(3) +
                (row.fallback ? ' (approx)' : '') +
                ' · type pizza again',
              'ok'
            );
          } else {
            log('Locate failed · grant GPS or spin globe over a town then pizza', 'dim');
          }
        });
        return;
      }
    } catch (_) {}
    try {
      if (G.SNCli && typeof SNCli.gpsLocate === 'function') {
        void SNCli.gpsLocate({ allowIp: true, allowSoft: true }).then(function (row) {
          if (row && row.lat != null) {
            markSessionLocate(row.lat, row.lng, { soft: true });
            log('Located · type pizza again', 'ok');
          }
        });
      }
    } catch (_) {}
  }

  function faceClusterIfNeeded(use, origin) {
    if (!use || !use.length) return;
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
      .sort(function (a, b) {
        return a.km - b.km;
      })[0];
    if (!nearest) return;

    if (cam && nearest.camKm < 80) {
      if (nearest.km < 40) stayPutSoft(nearest);
      return;
    }
    stayPutSoft(nearest);
  }

  /** Clean show <place>: fly globe + pin vendors only. Never POI dump. */
  async function cleanShowPlace(placeName) {
    forceGlobeOnly();
    var key = String(placeName || '')
      .trim()
      .toLowerCase();
    var place = KNOWN_PLACES[key];
    if (!place) {
      // Unknown place — still block POI dump, just log and stay
      log('Show · ' + placeName + ' · (no plaza dump) · type Locate or pizza', 'dim');
      return true;
    }

    log('Show · ' + place.name + ' · fly + vendor pins only (no POI dump)', 'ok');
    preview(place.name + ' · pins');

    // Fly camera
    try {
      if (G.SNGlobe && typeof SNGlobe.flyNear === 'function') {
        SNGlobe.flyNear(place.lat, place.lng, null);
      } else if (G.SNGlobe && typeof SNGlobe.pulse === 'function') {
        SNGlobe.pulse(place.lat, place.lng, 0x5ad4ff, place.name, 12000);
      }
    } catch (_) {}

    // Pin vendors at that place (same path as pizza hunt)
    var origin = { lat: place.lat, lng: place.lng, source: 'show' };
    var rows = [];
    try {
      rows = await queryVendorsBbox(place.lat, place.lng, 16);
    } catch (_) {}
    forceGlobeOnly();

    if (rows.length) {
      var n = paintPins(rows, origin);
      listInCli(rows, origin);
      if (n > 0) log('Pins on globe · ' + n + ' shops · tap a pin', 'ok');
      pizzaLiveUntil = Date.now() + 120000;
    } else {
      log('No delivery shops near ' + place.name + ' · try pizza after Locate', 'dim');
    }
    forceGlobeOnly();
    return true;
  }

  function isShowLine(line) {
    var m = SHOW_RE.exec(String(line || '').trim());
    return m ? m[1].trim() : null;
  }

  function pizzaIsLive() {
    return hunting || lastPins.length > 0 || Date.now() < pizzaLiveUntil;
  }

  async function huntPizza(raw) {
    if (hunting) return true;
    hunting = true;
    installMapGuard();
    forceGlobeOnly();
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

    var origin = resolveOrigin();
    if (!origin) {
      clearPizzaPins();
      log('No origin yet · type Locate once (GPS)', 'dim');
      askLocateOnce();
      hunting = false;
      forceGlobeOnly();
      return true;
    }

    if (origin.source === 'you' && nearFake(origin.lat, origin.lng)) {
      var cam2 = cameraLook();
      if (cam2) origin = { lat: cam2.lat, lng: cam2.lng, source: 'camera' };
      else {
        clearPizzaPins();
        askLocateOnce();
        hunting = false;
        forceGlobeOnly();
        return true;
      }
    }

    log(
      'Origin · ' + origin.source + ' · ' + origin.lat.toFixed(3) + ', ' + origin.lng.toFixed(3),
      'dim'
    );

    forceGlobeOnly();
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
    forceGlobeOnly();

    var pizzaish = rows.filter(function (v) {
      return /pizza|pizzeria|italiano|makkaroni|margherita/i.test(
        String(v.name || '') + ' ' + String(v.category || '')
      );
    });
    var use = pizzaish.length
      ? pizzaish.concat(
          rows.filter(function (v) {
            return pizzaish.indexOf(v) < 0;
          })
        )
      : rows;

    if (!use.length) {
      clearPizzaPins();
      log('No delivery shops near view · type Locate to hunt near you', 'dim');
      preview('Locate → then pizza');
      if (origin.source === 'camera' || origin.source === 'focus' || origin.source === 'focus-cache') {
        askLocateOnce();
      } else if (!hasSessionLocate()) {
        askLocateOnce();
      } else {
        log('No delivery shops in 16 km · spin globe or try another area', 'dim');
      }
      hunting = false;
      forceGlobeOnly();
      try {
        if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
      } catch (_) {}
      return true;
    }

    var nPainted = paintPins(use, origin);
    listInCli(use, origin);
    if (nPainted > 0) {
      log('Pins on globe · ' + nPainted + ' shops · tap a pin', 'ok');
    } else {
      log('Globe pulse unavailable · list only (SNGlobe not ready)', 'dim');
    }

    faceClusterIfNeeded(use, origin);
    forceGlobeOnly();

    if (isGuest()) {
      log('Guest browse · sign in only when you HOLD ⭐ / pay', 'dim');
    }
    hunting = false;
    pizzaLiveUntil = Date.now() + 180000; // keep show-clean active after hunt
    forceGlobeOnly();
    try {
      if (G.SNChromeCliAnswer && SNChromeCliAnswer.forcePaint) SNChromeCliAnswer.forcePaint();
    } catch (_) {}
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

  function isPayHold(line) {
    var s = String(line || '')
      .trim()
      .toLowerCase();
    return /^(pay|hold\s*⭐|hold\s*star|checkout|confirm\s+order|buy\s+now)\b/.test(s);
  }

  function install() {
    blockAuthModalOnPizza();
    installMapGuard();
    if (!G.SNCli || typeof SNCli.run !== 'function') return;
    if (SNCli.__snGuestPizzaHuntBuild === BUILD) return;
    SNCli.__snGuestPizzaHuntBuild = BUILD;
    SNCli.__snGuestPizzaHunt = 1;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      try {
        var s = String(raw || '').trim();
        if (/^locate\b/i.test(s) || /^gps\b/i.test(s)) {
          var p = prev(raw);
          setTimeout(function () {
            try {
              if (G._snPhysPos && G._snPhysPos.lat != null && !nearFake(+G._snPhysPos.lat, +G._snPhysPos.lng)) {
                markSessionLocate(G._snPhysPos.lat, G._snPhysPos.lng);
              }
            } catch (_) {}
          }, 1200);
          return p;
        }
        if (isPizzaLine(s)) {
          void huntPizza(s);
          return Promise.resolve(true);
        }
        // After / during pizza hunt: show <place> = clean fly + pins only (never POI dump)
        var place = isShowLine(s);
        if (place && pizzaIsLive()) {
          void cleanShowPlace(place);
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
        if (isPizzaLine(v)) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          if (el) el.value = '';
          void huntPizza(v);
          return true;
        }
        var place = isShowLine(v);
        if (place && pizzaIsLive()) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          if (el) el.value = '';
          void cleanShowPlace(place);
          return true;
        }
        return false;
      }
      if (form && input && !input._snPizzaHunt110) {
        input._snPizzaHunt110 = 1;
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
      if (topIn && !topIn._snPizzaHunt110) {
        topIn._snPizzaHunt110 = 1;
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
        if (!SNMarket._snPizzaHunt110) {
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
          SNMarket._snPizzaHunt110 = true;
        }
      }
    } catch (_) {}
  }

  function boot() {
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
    installMapGuard();
  }, 8000);

  G.SNChromeGuestPizzaHunt = {
    build: BUILD,
    hunt: huntPizza,
    queryVendorsBbox: queryVendorsBbox,
    resolveOrigin: resolveOrigin,
    lastPins: function () {
      return lastPins.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
