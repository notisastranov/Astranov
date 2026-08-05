/* SNGlobe — Earth imaging engine (KEEP)
 * Mechanical name: window.SNGlobe (js/spacenet/globe.js)
 * Three.js sphere + TextureLoader: earth_atmos_2048 · specular · clouds · night
 * Sacred: inertia damp · SPACENET pilot fly grid
 *
 * SPACENET (window.SPACENET / spacenet-grid.js) — pilot fly grid net:
 *   GLOBAL → NATIONAL → REGIONAL → CITY
 * Without SPACENET, flying on the net is not possible.
 *
 * NATIONAL layer: day/night · glowing blue borders · major cities · local time
 * SPECS click law:
 *   single tap  → zoom in / dive one cell deeper (same place)
 *   hold press  → zoom out (repeat while held)
 *   drag        → spin / tilt globe
 *   never place huge blue rings on click
 */
(function (global) {
  'use strict';

  function snApi() {
    return global.SPACENET || null;
  }
  var SN = snApi();
  var TIERS = {
    // GLOBAL = full planet in space (ISS / sats visible). Not a cropped close-up.
    // Z values are discrete SNAP altitudes — wheel never free-flies between them.
    solar: { z: 11.5, label: 'SOLAR' },
    global: { z: 5.6, label: 'GLOBAL' },
    national: { z: 2.85, label: 'NATIONAL' },
    regional: { z: 1.95, label: 'REGIONAL' },
    city: { z: 1.48, label: 'CITY' },
  };

  // Sync dramatic Z from SPACENET law when present
  (function syncZ() {
    var S = snApi();
    if (!S || !S.Z) return;
    Object.keys(TIERS).forEach(function (k) {
      if (S.Z[k] != null) TIERS[k].z = S.Z[k];
    });
  })();

  /** Full altitude ladder (includes SOLAR). SPACENET cells = LADDER without solar. */
  var LADDER = (SN && SN.LADDER) || ['solar', 'global', 'national', 'regional', 'city'];
  /** SPACENET pilot fly grid cells (single-tap progression) */
  var DIVE = (SN && SN.CELLS) || ['global', 'national', 'regional', 'city'];

  var G = {
    ready: false,
    renderer: null,
    scene: null,
    camera: null,
    earth: null,
    clouds: null,
    /** tilt = latitude (X only) · spin = longitude (Y only) · pivot alias = spin for children */
    tilt: null,
    spin: null,
    pivot: null,
    raycaster: null,
    markers: [],
    dragging: false,
    lastAct: 0,
    frame: 0,
    tier: 'global',
    zoomAnim: null,
    flying: false,
    flyGen: 0,
    velX: 0,
    velY: 0,
    damp: 0.86,
    lastUserControl: 0,
    /** Last place the user aimed (click / zoom target) — SpaceNet focus */
    focus: null,
    diveTier: null,
    /** SPACENET cell index: 0 global · 1 national · 2 regional · 3 city */
    diveStep: 0,
    /** Anchor lat/lng for same-place SPACENET dive (wide thresholds) */
    diveAnchor: null,
    /** Fly glow rings pulsing during SPACENET travel */
    flyFx: [],
    zoomGen: 0,
    flashEl: null,
    bodyId: 'earth',
    bodyMeta: null,
    earthMat: null,
    cloudMat: null,
    ambLight: null,
    sunLight: null,
    dayNightUniforms: null,
    dayNightReady: false,
    /** SPACENET webbing root — basis of global OS imaging (always on Earth) */
    nationalRoot: null,
    webbGrid: null,
    webbGridGlow: null,
    borderLines: null,
    borderGlow: null,
    cityGlow: null,
    cityCore: null,
    bordersLoaded: false,
    bordersLoading: false,
    webbingBuilt: false,
    nationalOn: false,
    _natHudLast: 0,
  };

  /** Major cities — compact offline set for NATIONAL glow targets */
  var MAJOR_CITIES = [
    { n: 'Athens', lat: 37.98, lng: 23.73 },
    { n: 'Istanbul', lat: 41.01, lng: 28.98 },
    { n: 'Rome', lat: 41.9, lng: 12.5 },
    { n: 'Paris', lat: 48.86, lng: 2.35 },
    { n: 'London', lat: 51.51, lng: -0.13 },
    { n: 'Madrid', lat: 40.42, lng: -3.7 },
    { n: 'Berlin', lat: 52.52, lng: 13.41 },
    { n: 'Moscow', lat: 55.76, lng: 37.62 },
    { n: 'Cairo', lat: 30.04, lng: 31.24 },
    { n: 'Lagos', lat: 6.45, lng: 3.4 },
    { n: 'Johannesburg', lat: -26.2, lng: 28.05 },
    { n: 'Nairobi', lat: -1.29, lng: 36.82 },
    { n: 'Dubai', lat: 25.2, lng: 55.27 },
    { n: 'Mumbai', lat: 19.08, lng: 72.88 },
    { n: 'Delhi', lat: 28.61, lng: 77.21 },
    { n: 'Bangkok', lat: 13.76, lng: 100.5 },
    { n: 'Singapore', lat: 1.35, lng: 103.82 },
    { n: 'Hong Kong', lat: 22.32, lng: 114.17 },
    { n: 'Shanghai', lat: 31.23, lng: 121.47 },
    { n: 'Beijing', lat: 39.9, lng: 116.41 },
    { n: 'Tokyo', lat: 35.68, lng: 139.69 },
    { n: 'Seoul', lat: 37.57, lng: 126.98 },
    { n: 'Sydney', lat: -33.87, lng: 151.21 },
    { n: 'Melbourne', lat: -37.81, lng: 144.96 },
    { n: 'Auckland', lat: -36.85, lng: 174.76 },
    { n: 'Los Angeles', lat: 34.05, lng: -118.24 },
    { n: 'San Francisco', lat: 37.77, lng: -122.42 },
    { n: 'Chicago', lat: 41.88, lng: -87.63 },
    { n: 'New York', lat: 40.71, lng: -74.01 },
    { n: 'Toronto', lat: 43.65, lng: -79.38 },
    { n: 'Mexico City', lat: 19.43, lng: -99.13 },
    { n: 'Bogotá', lat: 4.71, lng: -74.07 },
    { n: 'São Paulo', lat: -23.55, lng: -46.63 },
    { n: 'Rio', lat: -22.91, lng: -43.17 },
    { n: 'Buenos Aires', lat: -34.6, lng: -58.38 },
    { n: 'Santiago', lat: -33.45, lng: -70.67 },
    { n: 'Lima', lat: -12.05, lng: -77.04 },
    { n: 'Cape Town', lat: -33.92, lng: 18.42 },
    { n: 'Riyadh', lat: 24.71, lng: 46.68 },
    { n: 'Tehran', lat: 35.69, lng: 51.39 },
    { n: 'Karachi', lat: 24.86, lng: 67.0 },
    { n: 'Jakarta', lat: -6.21, lng: 106.85 },
    { n: 'Manila', lat: 14.6, lng: 120.98 },
    { n: 'Hanoi', lat: 21.03, lng: 105.85 },
    { n: 'Warsaw', lat: 52.23, lng: 21.01 },
    { n: 'Stockholm', lat: 59.33, lng: 18.07 },
    { n: 'Oslo', lat: 59.91, lng: 10.75 },
    { n: 'Helsinki', lat: 60.17, lng: 24.94 },
    { n: 'Vienna', lat: 48.21, lng: 16.37 },
    { n: 'Prague', lat: 50.08, lng: 14.44 },
    { n: 'Budapest', lat: 47.5, lng: 19.04 },
    { n: 'Bucharest', lat: 44.43, lng: 26.1 },
    { n: 'Kyiv', lat: 50.45, lng: 30.52 },
    { n: 'Ankara', lat: 39.93, lng: 32.86 },
    { n: 'Tel Aviv', lat: 32.09, lng: 34.78 },
    { n: 'Rhodes', lat: 36.43, lng: 28.22 },
    { n: 'Thessaloniki', lat: 40.64, lng: 22.94 },
    { n: 'Heraklion', lat: 35.34, lng: 25.13 },
    { n: 'Patras', lat: 38.25, lng: 21.73 },
    { n: 'Ilioúpoli', lat: 37.93, lng: 23.75 },
    { n: 'Piraeus', lat: 37.94, lng: 23.65 },
    { n: 'Larissa', lat: 39.64, lng: 22.42 },
    { n: 'Ioannina', lat: 39.67, lng: 20.85 },
    { n: 'Chania', lat: 35.51, lng: 24.02 },
    { n: 'Mykonos', lat: 37.45, lng: 25.33 },
    { n: 'Santorini', lat: 36.39, lng: 25.46 },
    { n: 'Nicosia', lat: 35.19, lng: 33.38 },
    { n: 'Sofia', lat: 42.7, lng: 23.32 },
    { n: 'Belgrade', lat: 44.79, lng: 20.45 },
    { n: 'Tirana', lat: 41.33, lng: 19.82 },
    { n: 'Skopje', lat: 41.99, lng: 21.43 },
  ];

  /** Region / state labels — shown at NATIONAL and denser at REGIONAL */
  var REGIONS = [
    { n: 'Attica', lat: 38.0, lng: 23.7 },
    { n: 'Central Greece', lat: 38.7, lng: 22.5 },
    { n: 'Peloponnese', lat: 37.4, lng: 22.3 },
    { n: 'Thessaly', lat: 39.5, lng: 22.3 },
    { n: 'Epirus', lat: 39.6, lng: 20.8 },
    { n: 'Macedonia', lat: 40.7, lng: 22.9 },
    { n: 'Thrace', lat: 41.1, lng: 25.4 },
    { n: 'Crete', lat: 35.2, lng: 24.9 },
    { n: 'South Aegean', lat: 36.8, lng: 25.5 },
    { n: 'North Aegean', lat: 39.1, lng: 26.3 },
    { n: 'Ionian', lat: 38.5, lng: 20.5 },
    { n: 'Anatolia', lat: 39.0, lng: 32.0 },
    { n: 'Balkans', lat: 42.5, lng: 22.0 },
    { n: 'Levant', lat: 33.5, lng: 35.5 },
    { n: 'Nile', lat: 28.0, lng: 31.0 },
    { n: 'Maghreb', lat: 32.0, lng: 3.0 },
    { n: 'Iberia', lat: 40.0, lng: -4.0 },
    { n: 'Italy', lat: 42.5, lng: 12.5 },
    { n: 'Central Europe', lat: 50.0, lng: 10.0 },
    { n: 'British Isles', lat: 54.0, lng: -2.0 },
    { n: 'Scandinavia', lat: 62.0, lng: 15.0 },
    { n: 'Eastern Europe', lat: 52.0, lng: 30.0 },
    { n: 'Caucasus', lat: 42.0, lng: 44.0 },
    { n: 'Gulf', lat: 25.0, lng: 52.0 },
    { n: 'Indus', lat: 28.0, lng: 70.0 },
    { n: 'Ganges', lat: 26.0, lng: 82.0 },
    { n: 'Indochina', lat: 15.0, lng: 105.0 },
    { n: 'China proper', lat: 34.0, lng: 113.0 },
    { n: 'Japan', lat: 36.0, lng: 138.0 },
    { n: 'California', lat: 36.5, lng: -120.0 },
    { n: 'Northeast US', lat: 41.0, lng: -74.0 },
    { n: 'Midwest', lat: 41.5, lng: -88.0 },
    { n: 'Texas', lat: 31.0, lng: -99.0 },
    { n: 'Southeast US', lat: 33.0, lng: -84.0 },
    { n: 'Andes', lat: -12.0, lng: -75.0 },
    { n: 'SE Brazil', lat: -23.0, lng: -46.0 },
    { n: 'Rio de la Plata', lat: -34.0, lng: -58.0 },
    { n: 'SE Australia', lat: -34.0, lng: 151.0 },
  ];

  var BORDER_URL =
    'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_boundary_lines_land.geojson';
  var NIGHT_URL =
    'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-night.jpg';

  function isTouch() {
    try {
      return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
    } catch (_) {
      return false;
    }
  }

  function latLngToVec(lat, lng, r) {
    r = r == null ? 1 : r;
    var phi = ((90 - lat) * Math.PI) / 180;
    var theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /** Inverse of latLngToVec — local unit vector on sphere → lat/lng */
  function vecToLatLng(v) {
    var n = v.clone().normalize();
    var lat = 90 - (Math.acos(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI;
    var lng = (Math.atan2(n.z, -n.x) * 180) / Math.PI - 180;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    return { lat: lat, lng: lng };
  }

  function tierFromZ(z) {
    var S = snApi();
    if (S && S.tierFromZ) return S.tierFromZ(z);
    if (z >= 8.2) return 'solar';
    if (z >= 4.0) return 'global';
    if (z >= 2.35) return 'national';
    if (z >= 1.7) return 'regional';
    return 'city';
  }

  function ladderIndex(name) {
    var S = snApi();
    if (S && S.ladderIndex) return S.ladderIndex(name);
    var i = LADDER.indexOf(name);
    return i >= 0 ? i : LADDER.indexOf('global');
  }

  function currentTier() {
    return G.diveTier || tierFromZ(G.camera ? G.camera.position.z : TIERS.global.z);
  }

  /** Degrees-ish distance — prefer SPACENET anchor */
  function farFromFocus(lat, lng) {
    var S = snApi();
    var f = G.diveAnchor || focusPos();
    if (!f || f.lat == null) return true;
    var thr = 28;
    var t = currentTier();
    if (S && S.SAME_DEG && S.SAME_DEG[t] != null) thr = S.SAME_DEG[t];
    if (S && S.degDist) return S.degDist(f.lat, f.lng, lat, lng) > thr;
    var dLat = Math.abs(f.lat - lat);
    var dLng = Math.abs(f.lng - lng);
    if (dLng > 180) dLng = 360 - dLng;
    return dLat > thr || dLng > thr;
  }

  /**
   * SPACENET next cell — committed diveTier first so z-lag cannot re-pick same cell.
   */
  function nextDiveAction(lat, lng) {
    var z = G.camera ? G.camera.position.z : TIERS.global.z;
    var tier = currentTier();
    var S = snApi();
    if (S && S.nextDive) {
      var n = S.nextDive({
        lat: lat,
        lng: lng,
        z: z,
        tier: tier,
        diveTier: G.diveTier || tier,
        diveStep: G.diveStep,
        anchor: G.diveAnchor || focusPos(),
      });
      return {
        action: n.cell,
        cell: n.cell,
        step: n.step,
        openMap: !!n.openMap,
        same: !!n.same,
        hint: n.hint || '',
        z: n.z,
      };
    }
    // Inline fallback: always deepen committed tier
    if (farFromFocus(lat, lng)) {
      return {
        action: 'national',
        cell: 'national',
        step: 1,
        openMap: false,
        same: false,
        hint: 'NATIONAL',
      };
    }
    var order = ['global', 'national', 'regional', 'city'];
    var i = order.indexOf(tier);
    if (i < 0) i = 0;
    if (i < order.length - 1) i++;
    var cell = order[i];
    return {
      action: cell,
      cell: cell,
      step: i,
      openMap: cell === 'city',
      same: true,
      hint: cell.toUpperCase(),
    };
  }

  function nextDiveTier(lat, lng) {
    return nextDiveAction(lat, lng).action;
  }

  /** One level coarser on SPACENET ladder toward full globe */
  function prevZoomTier() {
    var cur = currentTier();
    if (SN && SN.prevCell) return SN.prevCell(cur);
    var i = ladderIndex(cur);
    if (i <= 0) return 'solar';
    return LADDER[i - 1];
  }

  function setTierLabel() {
    G.tier = G.diveTier || tierFromZ(G.camera.position.z);
    var lab = (TIERS[G.tier] && TIERS[G.tier].label) || G.tier;
    var el = document.getElementById('tier-label');
    if (el) el.textContent = lab;
    var zl = document.getElementById('zoom-label');
    if (zl) zl.textContent = lab;
    syncNationalLayer();
  }

  function setDiveAnchor(lat, lng) {
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
    G.diveAnchor = { lat: lat, lng: lng };
  }

  function syncDiveStepFromTier(tier) {
    var t = tier || currentTier();
    if (t === 'city' || t === 'street') G.diveStep = 3;
    else if (t === 'regional') G.diveStep = 2;
    else if (t === 'national') G.diveStep = 1;
    else if (t === 'global') G.diveStep = 0;
    else G.diveStep = -1; // solar
  }

  /** Subsolar point → unit vector in earth mesh local space (matches latLngToVec) */
  function solarDirectionLocal(date) {
    var d = date || new Date();
    var start = Date.UTC(d.getUTCFullYear(), 0, 0);
    var day =
      (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000;
    var decl =
      23.44 * Math.sin(((360 / 365) * (day - 81) * Math.PI) / 180);
    var utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    var lon = (12 - utcH) * 15;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return latLngToVec(decl, lon, 1).normalize();
  }

  function isDayAt(lat, lng, date) {
    var sun = solarDirectionLocal(date);
    var p = latLngToVec(lat, lng, 1).normalize();
    return p.dot(sun) > 0.02;
  }

  /** Local civil clock from longitude (15° ≈ 1h) — no tzdb dependency */
  function localClockAt(lat, lng, date) {
    var d = date || new Date();
    var offsetH = Math.round(lng / 15);
    if (offsetH > 14) offsetH = 14;
    if (offsetH < -12) offsetH = -12;
    var ms = d.getTime() + offsetH * 3600000;
    var t = new Date(ms);
    var hh = t.getUTCHours();
    var mm = t.getUTCMinutes();
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };
    var day = isDayAt(lat, lng, d);
    return {
      time: pad(hh) + ':' + pad(mm),
      offsetH: offsetH,
      dayNight: day ? 'DAY' : 'NIGHT',
      day: day,
    };
  }

  function nearestMajorCity(lat, lng) {
    var best = null;
    var bestD = 1e9;
    for (var i = 0; i < MAJOR_CITIES.length; i++) {
      var c = MAJOR_CITIES[i];
      var dLat = c.lat - lat;
      var dLng = c.lng - lng;
      if (dLng > 180) dLng -= 360;
      if (dLng < -180) dLng += 360;
      var d = dLat * dLat + dLng * dLng;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  function nationalHudEl() {
    var el = document.getElementById('sn-national-hud');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-national-hud';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function cityLabelsRoot() {
    var el = document.getElementById('sn-city-labels');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-city-labels';
    document.body.appendChild(el);
    return el;
  }

  function projectToScreen(lat, lng) {
    if (!G.camera || !G.earth || !G.renderer || !G.pivot) return null;
    try {
      G.pivot.updateMatrixWorld(true);
      var local = latLngToVec(lat, lng, 1.02);
      var world = local.clone().applyMatrix4(G.pivot.matrixWorld);
      // Front hemisphere relative to camera
      var camDir = G.camera.position.clone().normalize();
      var n = world.clone().normalize();
      if (n.dot(camDir) < 0.12) return null;
      var v = world.project(G.camera);
      if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) return null;
      var rect = G.renderer.domElement.getBoundingClientRect();
      return {
        x: ((v.x + 1) / 2) * rect.width + rect.left,
        y: ((-v.y + 1) / 2) * rect.height + rect.top,
      };
    } catch (_) {
      return null;
    }
  }

  function updateCityLabels() {
    var root = cityLabelsRoot();
    if ((G.bodyId && G.bodyId !== 'earth') || global.SNMap?.active) {
      root.innerHTML = '';
      root.classList.remove('on');
      return;
    }
    var tier = currentTier();
    // GLOBAL: activity-only (no dense city chrome). NATIONAL+: cities + regions.
    if (tier === 'solar' || tier === 'global') {
      // Still show a few megacity anchors at GLOBAL so the planet reads as living
      if (tier === 'solar') {
        root.innerHTML = '';
        root.classList.remove('on');
        return;
      }
    }
    if (!G.nationalOn && tier !== 'global') {
      root.innerHTML = '';
      root.classList.remove('on');
      return;
    }
    root.classList.add('on');
    var f = focusPos();
    var flat = f && f.lat != null ? f.lat : 0;
    var flng = f && f.lng != null ? f.lng : 0;
    var html = [];
    var n = 0;
    var maxN = tier === 'regional' ? 28 : tier === 'national' ? 18 : tier === 'city' ? 10 : 8;
    var maxDLat = tier === 'regional' ? 12 : tier === 'national' ? 32 : tier === 'city' ? 6 : 50;
    var maxDLng = tier === 'regional' ? 14 : tier === 'national' ? 38 : tier === 'city' ? 8 : 60;

    // Regions first at NATIONAL+
    if (tier === 'national' || tier === 'regional') {
      for (var ri = 0; ri < REGIONS.length && n < Math.min(10, maxN); ri++) {
        var reg = REGIONS[ri];
        var rdLat = Math.abs(reg.lat - flat);
        var rdLng = Math.abs(reg.lng - flng);
        if (rdLng > 180) rdLng = 360 - rdLng;
        var rCap = tier === 'regional' ? 18 : 40;
        if (rdLat > rCap || rdLng > rCap + 5) continue;
        var rscr = projectToScreen(reg.lat, reg.lng);
        if (!rscr) continue;
        html.push(
          '<span class="sn-city-lab sn-region-lab" style="left:' +
            Math.round(rscr.x) +
            'px;top:' +
            Math.round(rscr.y) +
            'px"><b>' +
            reg.n +
            '</b><i>REGION</i></span>'
        );
        n++;
      }
    }

    for (var i = 0; i < MAJOR_CITIES.length && n < maxN; i++) {
      var c = MAJOR_CITIES[i];
      var dLat = Math.abs(c.lat - flat);
      var dLng = Math.abs(c.lng - flng);
      if (dLng > 180) dLng = 360 - dLng;
      if (dLat > maxDLat || dLng > maxDLng) continue;
      var scr = projectToScreen(c.lat, c.lng);
      if (!scr) continue;
      var clk = localClockAt(c.lat, c.lng);
      html.push(
        '<span class="sn-city-lab" style="left:' +
          Math.round(scr.x) +
          'px;top:' +
          Math.round(scr.y) +
          'px"><b>' +
          c.n +
          '</b><i>' +
          clk.time +
          ' · ' +
          clk.dayNight +
          '</i></span>'
      );
      n++;
    }
    root.innerHTML = html.join('');
  }

  function updateNationalHud(force) {
    // GLOBAL pill under ASTRANOV retired — fleet resource monitor owns that slot.
    // Keep city labels + internal throttle only.
    var now = Date.now();
    if (!force && now - (G._natHudLast || 0) < 900) return;
    G._natHudLast = now;
    try {
      var el = document.getElementById('sn-national-hud');
      if (el) {
        el.classList.remove('on');
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
        el.textContent = '';
      }
    } catch (_) {}
    updateCityLabels();
  }

  /**
   * SPACENET webbing: national · regional · city globe.
   * Activity arcs stay visible from GLOBAL (high sky) so traffic reads from orbit.
   */
  function webbingShouldShow() {
    if (!(G.bodyId === 'earth' || !G.bodyId)) return false;
    if (global.SNMap && SNMap.active) return false;
    var t = currentTier();
    return t === 'national' || t === 'regional' || t === 'city';
  }

  function activityShouldShow() {
    if (!(G.bodyId === 'earth' || !G.bodyId)) return false;
    if (global.SNMap && SNMap.active) return false;
    var t = currentTier();
    return t === 'global' || t === 'national' || t === 'regional' || t === 'city';
  }

  function nationalTierActive() {
    // denser UI / city labels at national+
    var t = currentTier();
    return t === 'national' || t === 'regional' || t === 'city';
  }

  function ensureNationalRoot() {
    if (G.nationalRoot || !G.pivot) return G.nationalRoot;
    G.nationalRoot = new THREE.Object3D();
    G.nationalRoot.name = 'spacenetWebbing';
    G.nationalRoot.visible = true;
    G.pivot.add(G.nationalRoot);
    return G.nationalRoot;
  }

  function bufAttr(arr, itemSize) {
    var a = arr instanceof Float32Array ? arr : new Float32Array(arr);
    if (THREE.Float32BufferAttribute) return new THREE.Float32BufferAttribute(a, itemSize);
    return new THREE.BufferAttribute(a, itemSize);
  }

  /**
   * Offline SPACENET graticule — glowing blue lat/lng webbing.
   * No CDN required: this IS the net you fly on.
   * stepDeg: 15 global · 10 national · 5 regional
   */
  function buildWebbingGraticule(stepDeg) {
    ensureNationalRoot();
    stepDeg = stepDeg || 15;
    var positions = [];
    // Above clouds (1.015) so webbing is never buried under cloud texture
    var r = 1.022;
    var segs = 36;

    // Meridians (longitude lines)
    for (var lng = -180; lng < 180; lng += stepDeg) {
      for (var lat = -90; lat < 90; lat += 180 / segs) {
        var a = latLngToVec(lat, lng, r);
        var b = latLngToVec(Math.min(90, lat + 180 / segs), lng, r);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    // Parallels (latitude lines)
    for (var la = -75; la <= 75; la += stepDeg) {
      for (var lo = -180; lo < 180; lo += 360 / segs) {
        var p0 = latLngToVec(la, lo, r);
        var p1 = latLngToVec(la, lo + 360 / segs, r);
        positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      }
    }

    if (G.webbGrid) {
      try {
        G.nationalRoot.remove(G.webbGrid);
        if (G.webbGrid.geometry) G.webbGrid.geometry.dispose();
      } catch (_) {}
      G.webbGrid = null;
    }
    if (G.webbGridGlow) {
      try {
        G.nationalRoot.remove(G.webbGridGlow);
        if (G.webbGridGlow.geometry) G.webbGridGlow.geometry.dispose();
      } catch (_) {}
      G.webbGridGlow = null;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', bufAttr(positions, 3));
    // Faded transparent SPACENET grid only — subtle, never loud
    var mat = new THREE.LineBasicMaterial({
      color: 0x3d9eff,
      transparent: true,
      opacity: 0.18,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    G.webbGrid = new THREE.LineSegments(geo, mat);
    G.webbGrid.renderOrder = 8;
    G.webbGrid.name = 'spacenetGraticule';
    G.webbGrid.frustumCulled = false;
    G.nationalRoot.add(G.webbGrid);

    var glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', bufAttr(positions, 3));
    var glowMat = new THREE.LineBasicMaterial({
      color: 0x1a6fd4,
      transparent: true,
      opacity: 0.08,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    G.webbGridGlow = new THREE.LineSegments(glowGeo, glowMat);
    G.webbGridGlow.scale.setScalar(1.002);
    G.webbGridGlow.renderOrder = 7;
    G.webbGridGlow.frustumCulled = false;
    G.nationalRoot.add(G.webbGridGlow);
    G.webbingBuilt = true;
    G._webbStep = stepDeg;
    try {
      if (global.SNCli && SNCli.log) {
        SNCli.log(
          'SPACENET webbing ON · blue grid · step ' + stepDeg + '° · verts ' + positions.length / 2,
          'ok'
        );
      }
    } catch (_) {}
  }

  function webbStepForTier() {
    var t = currentTier();
    if (t === 'city' || t === 'regional') return 5;
    if (t === 'national') return 10;
    if (t === 'solar') return 30;
    return 15; // global
  }

  function ensureWebbing() {
    ensureNationalRoot();
    var step = webbStepForTier();
    if (!G.webbingBuilt || G._webbStep !== step) {
      buildWebbingGraticule(step);
    }
    buildCityLayer();
    loadNationalBorders();
  }

  function buildCityLayer() {
    if (G.cityCore || !G.nationalRoot) return;
    var corePos = [];
    var glowPos = [];
    for (var i = 0; i < MAJOR_CITIES.length; i++) {
      var c = MAJOR_CITIES[i];
      var p = latLngToVec(c.lat, c.lng, 1.011);
      corePos.push(p.x, p.y, p.z);
      var g = latLngToVec(c.lat, c.lng, 1.013);
      glowPos.push(g.x, g.y, g.z);
    }
    var coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', bufAttr(corePos, 3));
    var glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', bufAttr(glowPos, 3));
    G.cityGlow = new THREE.Points(
      glowGeo,
      new THREE.PointsMaterial({
        color: 0x4db8ff,
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    G.cityCore = new THREE.Points(
      coreGeo,
      new THREE.PointsMaterial({
        color: 0xc8ecff,
        size: 0.022,
        sizeAttenuation: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    G.nationalRoot.add(G.cityGlow);
    G.nationalRoot.add(G.cityCore);
  }

  function ringToSegments(coords, positions, r) {
    if (!coords || coords.length < 2) return;
    for (var i = 0; i < coords.length - 1; i++) {
      var a = coords[i];
      var b = coords[i + 1];
      if (!a || !b || a.length < 2 || b.length < 2) continue;
      var pa = latLngToVec(a[1], a[0], r);
      var pb = latLngToVec(b[1], b[0], r);
      positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
  }

  function geoCoordsToSegments(geom, positions, r) {
    if (!geom || !geom.type) return;
    var t = geom.type;
    var c = geom.coordinates;
    if (t === 'LineString') {
      ringToSegments(c, positions, r);
    } else if (t === 'MultiLineString') {
      for (var i = 0; i < c.length; i++) ringToSegments(c[i], positions, r);
    } else if (t === 'Polygon') {
      for (var j = 0; j < c.length; j++) ringToSegments(c[j], positions, r);
    } else if (t === 'MultiPolygon') {
      for (var k = 0; k < c.length; k++) {
        var poly = c[k];
        for (var m = 0; m < poly.length; m++) ringToSegments(poly[m], positions, r);
      }
    }
  }

  function attachBorderLines(positions) {
    if (!G.nationalRoot || !positions.length) return;
    if (G.borderLines) {
      try {
        G.nationalRoot.remove(G.borderLines);
        if (G.borderLines.geometry) G.borderLines.geometry.dispose();
        if (G.borderGlow) {
          G.nationalRoot.remove(G.borderGlow);
          if (G.borderGlow.geometry) G.borderGlow.geometry.dispose();
        }
      } catch (_) {}
      G.borderLines = null;
      G.borderGlow = null;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', bufAttr(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    G.borderLines = new THREE.LineSegments(geo, mat);
    G.borderLines.renderOrder = 5;
    G.borderLines.name = 'spacenetBorders';
    G.nationalRoot.add(G.borderLines);
    var glowMat = new THREE.LineBasicMaterial({
      color: 0x1a6fd4,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    G.borderGlow = new THREE.LineSegments(geo.clone(), glowMat);
    G.borderGlow.scale.setScalar(1.0025);
    G.borderGlow.renderOrder = 4;
    G.nationalRoot.add(G.borderGlow);
    G.bordersLoaded = true;
  }

  function loadNationalBorders() {
    if (G.bordersLoaded || G.bordersLoading) return;
    G.bordersLoading = true;
    ensureNationalRoot();
    var urls = [
      BORDER_URL,
      'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson',
      'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
    ];
    function tryFetch(i) {
      if (i >= urls.length) {
        G.bordersLoading = false;
        // Graticule already provides SPACENET webbing without CDN
        return;
      }
      fetch(urls[i], { mode: 'cors' })
        .then(function (r) {
          if (!r.ok) throw new Error('border ' + r.status);
          return r.json();
        })
        .then(function (data) {
          var positions = [];
          if (data && data.type === 'FeatureCollection' && data.features) {
            for (var f = 0; f < data.features.length; f++) {
              var feat = data.features[f];
              if (feat && feat.geometry) geoCoordsToSegments(feat.geometry, positions, 1.009);
            }
          } else if (data && data.type === 'Feature' && data.geometry) {
            geoCoordsToSegments(data.geometry, positions, 1.009);
          } else if (data && data.objects) {
            throw new Error('topojson');
          }
          if (positions.length < 6) throw new Error('empty borders');
          // Cap vertices for mobile perf
          if (positions.length > 900000) {
            var thin = [];
            for (var t = 0; t < positions.length; t += 6) {
              if ((t / 6) % 2 === 0) {
                thin.push(
                  positions[t],
                  positions[t + 1],
                  positions[t + 2],
                  positions[t + 3],
                  positions[t + 4],
                  positions[t + 5]
                );
              }
            }
            positions = thin;
          }
          attachBorderLines(positions);
          G.bordersLoading = false;
          syncNationalLayer();
        })
        .catch(function () {
          tryFetch(i + 1);
        });
    }
    tryFetch(0);
  }

  /** syncNationalLayer = SPACENET webbing OS layer + activity arcs */
  function syncNationalLayer() {
    if (!G.ready || !G.pivot) return;
    var on = webbingShouldShow();
    G.nationalOn = on;
    if (on) {
      ensureWebbing();
      if (G.nationalRoot) G.nationalRoot.visible = true;
      if (G.webbGrid) G.webbGrid.visible = true;
      if (G.webbGridGlow) G.webbGridGlow.visible = true;
      var close = nationalTierActive();
      if (G.cityCore) G.cityCore.visible = true;
      if (G.cityGlow) G.cityGlow.visible = true;
      if (G.cityCore && G.cityCore.material) {
        G.cityCore.material.opacity = close ? 1 : 0.55;
      }
      if (G.cityGlow && G.cityGlow.material) {
        var z = G.camera ? G.camera.position.z : 3;
        G.cityGlow.material.size = z > 2.5 ? 0.07 : z > 1.9 ? 0.045 : 0.03;
      }
      if (G.borderLines) G.borderLines.visible = true;
      if (G.borderGlow) G.borderGlow.visible = true;
    } else if (G.nationalRoot) {
      // Keep root for activity arcs even at GLOBAL
      if (activityShouldShow()) {
        ensureNationalRoot();
        G.nationalRoot.visible = true;
        if (G.webbGrid) G.webbGrid.visible = false;
        if (G.webbGridGlow) G.webbGridGlow.visible = false;
        if (G.borderLines) G.borderLines.visible = false;
        if (G.borderGlow) G.borderGlow.visible = false;
        // Megacity pinpoints at GLOBAL
        if (!G.cityCore) buildCityLayer();
        if (G.cityCore) {
          G.cityCore.visible = true;
          if (G.cityCore.material) G.cityCore.material.opacity = 0.7;
        }
        if (G.cityGlow) {
          G.cityGlow.visible = true;
          if (G.cityGlow.material) {
            G.cityGlow.material.opacity = 0.45;
            G.cityGlow.material.size = 0.09;
          }
        }
      } else {
        G.nationalRoot.visible = false;
      }
    }
    refreshActivityArcs();
    updateNationalHud(true);
  }

  /**
   * Harvest live marketplace / task pairs → glowing blue great-circle arcs.
   * Visible from GLOBAL so activity density is readable high above.
   */
  function harvestActivityPairs() {
    var pairs = [];
    function pushPair(aLat, aLng, bLat, bLng) {
      if (
        aLat == null ||
        aLng == null ||
        bLat == null ||
        bLng == null ||
        !isFinite(aLat) ||
        !isFinite(bLat)
      )
        return;
      if (Math.abs(aLat - bLat) < 1e-5 && Math.abs(aLng - bLng) < 1e-5) return;
      pairs.push({
        a: { lat: Number(aLat), lng: Number(aLng) },
        b: { lat: Number(bLat), lng: Number(bLng) },
      });
    }
    try {
      var tasks =
        (global.SNTasks && SNTasks.list && (SNTasks.list({ kind: 'delivery' }) || SNTasks.list())) ||
        [];
      for (var i = 0; i < tasks.length && pairs.length < 48; i++) {
        var t = tasks[i];
        if (!t) continue;
        if (t.status === 'done' || t.status === 'cancelled') continue;
        var vLat = t.vendor_lat != null ? t.vendor_lat : t.lat;
        var vLng = t.vendor_lng != null ? t.vendor_lng : t.lng;
        var dLat = t.drop_lat != null ? t.drop_lat : t.to_lat;
        var dLng = t.drop_lng != null ? t.drop_lng : t.to_lng;
        pushPair(vLat, vLng, dLat, dLng);
      }
    } catch (_) {}
    try {
      var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
      var vendors = (global.SNProfiles && SNProfiles.list && SNProfiles.list({ role: 'vendor' })) || [];
      if (me && me.lat != null) {
        for (var v = 0; v < vendors.length && pairs.length < 64; v++) {
          var shop = vendors[v];
          if (!shop || shop.lat == null) continue;
          // only nearby shops for density around you
          var dd = Math.abs(shop.lat - me.lat) + Math.abs(shop.lng - me.lng);
          if (dd > 4) continue;
          pushPair(shop.lat, shop.lng, me.lat, me.lng);
        }
      }
    } catch (_) {}
    try {
      if (global.SNMeshOrders && SNMeshOrders.listLocal) {
        var open = SNMeshOrders.listLocal() || [];
        open.forEach(function (o) {
          if (o && o.vendor_lat != null && o.drop_lat != null)
            pushPair(o.vendor_lat, o.vendor_lng, o.drop_lat, o.drop_lng);
        });
      }
    } catch (_) {}
    // No dummy corridors — only real tasks / mesh / nearby vendor→you
    return pairs;
  }

  function arcPositions(a, b, r, segs) {
    segs = segs || 12;
    r = r || 1.03;
    var out = [];
    for (var i = 0; i < segs; i++) {
      var t0 = i / segs;
      var t1 = (i + 1) / segs;
      // height bulge mid-arc so lines read from orbit
      var h0 = r + 0.04 * Math.sin(Math.PI * t0);
      var h1 = r + 0.04 * Math.sin(Math.PI * t1);
      var lat0 = a.lat + (b.lat - a.lat) * t0;
      var lng0 = a.lng + (b.lng - a.lng) * t0;
      var lat1 = a.lat + (b.lat - a.lat) * t1;
      var lng1 = a.lng + (b.lng - a.lng) * t1;
      var p0 = latLngToVec(lat0, lng0, h0);
      var p1 = latLngToVec(lat1, lng1, h1);
      out.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
    }
    return out;
  }

  function refreshActivityArcs() {
    if (!G.ready || !G.pivot) return;
    ensureNationalRoot();
    if (G.activityLines) {
      try {
        G.nationalRoot.remove(G.activityLines);
        if (G.activityLines.geometry) G.activityLines.geometry.dispose();
      } catch (_) {}
      G.activityLines = null;
    }
    if (!activityShouldShow()) return;
    var pairs = harvestActivityPairs();
    if (!pairs.length) return;
    var positions = [];
    for (var i = 0; i < pairs.length; i++) {
      var segs = arcPositions(pairs[i].a, pairs[i].b, 1.028, 10);
      for (var k = 0; k < segs.length; k++) positions.push(segs[k]);
    }
    if (!positions.length) return;
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', bufAttr(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0x4cc9ff,
      transparent: true,
      opacity: currentTier() === 'global' ? 0.55 : 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    G.activityLines = new THREE.LineSegments(geo, mat);
    G.activityLines.renderOrder = 12;
    G.activityLines.name = 'activityArcs';
    G.activityLines.frustumCulled = false;
    G.nationalRoot.add(G.activityLines);
    G.nationalRoot.visible = true;
  }

  function updateDayNight() {
    if (!G.dayNightUniforms || !G.dayNightReady) return;
    var sun = solarDirectionLocal();
    G.dayNightUniforms.sunDirection.value.copy(sun);
    if (G.sunLight) {
      // Keep a soft world fill aligned with subsolar for specular/clouds
      G.sunLight.position.set(sun.x * 6, sun.y * 6, sun.z * 6);
    }
  }

  function makeDayNightMaterial(dayMap, nightMap) {
    var uniforms = {
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDirection: { value: solarDirectionLocal() },
    };
    G.dayNightUniforms = uniforms;
    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'void main() {',
        '  vUv = uv;',
        '  // Object-space normal — sunDirection is mesh-local (subsolar lat/lng)',
        '  vNormal = normalize(normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D dayMap;',
        'uniform sampler2D nightMap;',
        'uniform vec3 sunDirection;',
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'void main() {',
        '  vec3 n = normalize(vNormal);',
        '  float d = dot(n, normalize(sunDirection));',
        '  float blend = smoothstep(-0.08, 0.18, d);',
        '  vec3 dayC = texture2D(dayMap, vUv).rgb;',
        '  vec3 nightC = texture2D(nightMap, vUv).rgb;',
        '  // City lights on night side; mute day texture in dark',
        '  vec3 nightLit = nightC * 1.15 + vec3(0.01, 0.02, 0.04);',
        '  vec3 dayLit = dayC * (0.55 + 0.55 * max(d, 0.0));',
        '  vec3 col = mix(nightLit, dayLit, blend);',
        '  // Soft terminator glow',
        '  float term = exp(-pow(d * 8.0, 2.0)) * 0.12;',
        '  col += vec3(0.2, 0.45, 0.9) * term;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}',
      ].join('\n'),
    });
  }

  function setFocus(lat, lng) {
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
    G.focus = { lat: lat, lng: lng };
    global._snGlobeFocus = G.focus;
    try {
      global._snLastPos = { lat: lat, lng: lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(lat, lng);
    } catch (_) {}
  }

  function focusPos() {
    return G.focus || global._snGlobeFocus || global._snLastPos || global.SNTasks?.pos || null;
  }

  /**
   * Raycast screen point → Earth lat/lng (SpaceNet address under finger).
   */
  function pickLatLng(clientX, clientY) {
    if (!G.ready || !G.earth || !G.camera || !G.renderer || !G.pivot) return null;
    var rect = G.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = ((clientX - rect.left) / rect.width) * 2 - 1;
    var y = -((clientY - rect.top) / rect.height) * 2 + 1;
    if (!G.raycaster) G.raycaster = new THREE.Raycaster();
    try {
      // Full chain: pivot (user drag) + earth mesh must be current for hit→lat/lng
      G.pivot.updateMatrixWorld(true);
      G.earth.updateMatrixWorld(true);
      G.camera.updateMatrixWorld(true);
    } catch (_) {}
    G.raycaster.setFromCamera(new THREE.Vector2(x, y), G.camera);
    var hits = G.raycaster.intersectObject(G.earth, false);
    if (!hits || !hits.length) return null;
    var local = G.earth.worldToLocal(hits[0].point.clone());
    var ll = vecToLatLng(local);
    if (!ll || !isFinite(ll.lat) || !isFinite(ll.lng)) return null;
    return ll;
  }

  /** Stop inertia / idle spin / in-flight camera so goToPlace is decisive */
  function stopMotion() {
    G.velX = 0;
    G.velY = 0;
    G.flyGen = (G.flyGen || 0) + 1;
    G.flying = false;
    G.lastAct = Date.now();
    G.lastUserControl = Date.now();
  }

  var TILT_MAX = 1.05; // ~60° — stable poles, less shake near extreme tilt

  /** Keep dual axes clean: tilt.X only · spin.Y only · never Z (polar axis law) */
  function bakePivotEuler() {
    if (!G.tilt || !G.spin) return;
    try {
      var x = G.tilt.rotation.x;
      var y = G.spin.rotation.y;
      if (x > TILT_MAX) x = TILT_MAX;
      if (x < -TILT_MAX) x = -TILT_MAX;
      // Direct euler only — no quaternion rewrite (was causing micro-jumps)
      G.tilt.rotation.x = x;
      G.tilt.rotation.y = 0;
      G.tilt.rotation.z = 0;
      G.spin.rotation.x = 0;
      G.spin.rotation.y = y;
      G.spin.rotation.z = 0;
    } catch (_) {}
  }

  /** Face lat/lng toward camera using polar axes only (no free quaternion → no clock spin) */
  function setGlobeLatLng(lat, lng) {
    if (!G.tilt || !G.spin) return;
    var x = (-Number(lat) * Math.PI) / 180;
    var y = (-Number(lng) * Math.PI) / 180;
    if (x > TILT_MAX) x = TILT_MAX;
    if (x < -TILT_MAX) x = -TILT_MAX;
    G.tilt.rotation.set(x, 0, 0);
    G.spin.rotation.set(0, y, 0);
    G.tilt.quaternion.setFromEuler(G.tilt.rotation);
    G.spin.quaternion.setFromEuler(G.spin.rotation);
  }

  function unwrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function init() {
    if (G.ready || typeof THREE === 'undefined') return false;
    var el = document.getElementById('globe');
    if (!el) return false;

    var touch = isTouch();
    var lite = !!(global._snLite || (global.SNPerf && SNPerf.lite) || touch);
    var w = el.clientWidth || window.innerWidth;
    var h = el.clientHeight || window.innerHeight;

    G.scene = new THREE.Scene();
    G.scene.background = new THREE.Color(0x000000);
    G.camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 200);
    // Full-Earth space overview (whole sphere + stars around it)
    G.camera.position.set(0, 0.06, TIERS.global.z);
    G.tier = 'global';
    G.diveTier = 'global';

    G.renderer = new THREE.WebGLRenderer({
      antialias: !lite,
      alpha: false,
      powerPreference: lite ? 'low-power' : 'high-performance',
      stencil: false,
      depth: true,
    });
    G.renderer.setSize(w, h, false);
    var dprCap = (global.SNPerf && SNPerf.dprCap) || (lite ? 1 : 1.25);
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    // Avoid auto-clear thrash
    try {
      G.renderer.sortObjects = false;
    } catch (_) {}
    el.innerHTML = '';
    el.appendChild(G.renderer.domElement);

    var amb = new THREE.AmbientLight(0x334455, 0.28);
    var sun = new THREE.DirectionalLight(0xfff5e6, 1.55);
    sun.position.set(5, 1.2, 2.5);
    G.ambLight = amb;
    G.sunLight = sun;
    G.scene.add(amb, sun);

    // Dual-axis globe: tilt (lat / X) parent of spin (lon / Y) — real polar axis
    G.tilt = new THREE.Object3D();
    G.spin = new THREE.Object3D();
    G.scene.add(G.tilt);
    G.tilt.add(G.spin);
    G.pivot = G.spin; // children (earth, markers, webbing) ride the polar spin

    var segs =
      (global.SNPerf && SNPerf.globeSegs) || (lite ? 32 : 48);
    var loader = new THREE.TextureLoader();
    // Lite: smaller day map first — less decode jank on phones
    var earthUrl = lite
      ? 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg'
      : 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';
    var cloudUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_clouds_1024.png';

    var mat = new THREE.MeshPhongMaterial({
      color: 0x1a4a78,
      specular: 0x222222,
      shininess: 10,
      // Instant solid Earth — textures stream in (no white stall)
      emissive: new THREE.Color(0x041018),
    });
    G.earthMat = mat;
    G.earth = new THREE.Mesh(new THREE.SphereGeometry(1, segs, segs), mat);
    G.spin.add(G.earth);
    G._loader = loader;
    G.bodyId = 'earth';
    G._lite = lite;
    // SPACENET webbing is the OS baselayer — build immediately (offline graticule)
    ensureNationalRoot();
    buildWebbingGraticule(lite ? 20 : 15);
    if (!lite) buildCityLayer();
    else {
      // Cities after first frames
      setTimeout(function () {
        try {
          buildCityLayer();
        } catch (_) {}
      }, 900);
    }

    function applyEarthTextures() {
      G.dayNightReady = false;
      var dayTex = null;
      var nightTex = null;
      var aniso = Math.min(
        4,
        (G.renderer.capabilities.getMaxAnisotropy &&
          G.renderer.capabilities.getMaxAnisotropy()) ||
          1
      );
      function tryShader() {
        if (!dayTex) return;
        // Prefer day/night blend when night map ready; else Phong day only
        if (nightTex) {
          var sm = makeDayNightMaterial(dayTex, nightTex);
          G.earth.material = sm;
          G.earthMat = sm;
          G.dayNightReady = true;
          updateDayNight();
        } else {
          mat.map = dayTex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
          G.earth.material = mat;
          G.earthMat = mat;
        }
      }
      loader.load(
        earthUrl,
        function (tex) {
          tex.anisotropy = aniso;
          dayTex = tex;
          tryShader();
        },
        undefined,
        function () {
          mat.color.set(0x1a4d7a);
          mat.emissive = new THREE.Color(0x041018);
          G.earth.material = mat;
          G.earthMat = mat;
        }
      );
      loader.load(
        NIGHT_URL,
        function (tex) {
          tex.anisotropy = aniso;
          nightTex = tex;
          tryShader();
        },
        undefined,
        function () {
          /* night optional — day Phong still works */
        }
      );
    }
    applyEarthTextures();
    G._applyEarthTextures = applyEarthTextures;

    if (!lite) {
      var cloudMat = new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      G.cloudMat = cloudMat;
      G.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.015, segs, segs), cloudMat);
      G.pivot.add(G.clouds);
      loader.load(cloudUrl, function (tex) {
        cloudMat.map = tex;
        cloudMat.needsUpdate = true;
      });
    } else {
      G.clouds = null;
    }

    G.pivot.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.045, lite ? Math.max(24, segs - 8) : segs, lite ? Math.max(24, segs - 8) : segs),
        new THREE.MeshBasicMaterial({
          color: 0x4a9fff,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
        })
      )
    );

    var starN = (global.SNPerf && SNPerf.starN) || (lite ? 280 : 700);
    var starPos = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var r = 18 + Math.random() * 70;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    G.stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3)),
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: lite ? 0.07 : 0.055,
        sizeAttenuation: true,
        opacity: 0.9,
        transparent: true,
        depthWrite: false,
      })
    );
    G.scene.add(G.stars);
    // Orbit layer after first paint on lite
    if (lite) {
      setTimeout(function () {
        try {
          buildSpaceOrbitLayer();
        } catch (_) {}
      }, 600);
    } else {
      buildSpaceOrbitLayer();
    }

    bindInput();
    var resizeT = 0;
    window.addEventListener(
      'resize',
      function () {
        clearTimeout(resizeT);
        resizeT = setTimeout(onResize, 120);
      },
      { passive: true }
    );
    G.ready = true;
    G.lastAct = Date.now();
    updateDayNight();
    // Prebuild webbing mesh offline; visibility only when below GLOBAL
    try {
      ensureWebbing();
      if (G.nationalRoot) G.nationalRoot.visible = false;
      G.nationalOn = false;
    } catch (e) {
      try {
        console.error('[SNGlobe] SPACENET webbing boot fail', e);
      } catch (_) {}
    }
    setSpaceLive(true);
    setTierLabel();
    ensureGlobeEngine();
    return true;
  }

  /**
   * LEO band + ISS marker — visible at GLOBAL/SOLAR (full Earth in space).
   * ISS lat/lng from free feed; constellation = dense LEO shell (not map layers).
   */
  function buildSpaceOrbitLayer() {
    if (!G.pivot || G.spaceRoot) return;
    G.spaceRoot = new THREE.Object3D();
    G.spaceRoot.name = 'spaceOrbit';
    G.pivot.add(G.spaceRoot);

    // Starlink-style LEO constellation shell (~400–550 km → r ≈ 1.06–1.09)
    var n = 180;
    var pos = new Float32Array(n * 3);
    var i;
    for (i = 0; i < n; i++) {
      var lat = (Math.random() - 0.5) * 140;
      var lng = Math.random() * 360 - 180;
      var rr = 1.055 + Math.random() * 0.04;
      var v = latLngToVec(lat, lng, rr);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
    }
    G.leoCloud = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({
        color: 0x88ccff,
        size: 0.012,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    G.spaceRoot.add(G.leoCloud);

    // Faint orbital ring (visual constellation band)
    var ringPts = [];
    var segs = 96;
    for (i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * 1.07, 0, Math.sin(a) * 1.07));
    }
    G.leoRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({
        color: 0x3d9eff,
        transparent: true,
        opacity: 0.22,
      })
    );
    G.leoRing.rotation.x = 0.55;
    G.spaceRoot.add(G.leoRing);

    // ISS marker
    G.issMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    );
    G.issMesh.visible = false;
    G.spaceRoot.add(G.issMesh);
    G.issHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    G.issHalo.visible = false;
    G.spaceRoot.add(G.issHalo);
    G.spaceRoot.visible = true;
  }

  function spaceLayerShouldShow() {
    if (!(G.bodyId === 'earth' || !G.bodyId)) return false;
    if (global.SNMap && SNMap.active) return false;
    var t = currentTier();
    return t === 'global' || t === 'solar';
  }

  function syncSpaceLayerVis() {
    if (!G.spaceRoot) return;
    var on = spaceLayerShouldShow();
    G.spaceRoot.visible = on;
    if (G.stars) G.stars.visible = true;
  }

  function setSpaceLive(on) {
    if (G._issTimer) {
      try {
        clearInterval(G._issTimer);
      } catch (_) {}
      G._issTimer = null;
    }
    if (!on) return;
    void refreshIssGlobe();
    G._issTimer = setInterval(function () {
      void refreshIssGlobe();
    }, 12000);
  }

  async function refreshIssGlobe() {
    if (!G.issMesh || !spaceLayerShouldShow()) {
      if (G.issMesh) G.issMesh.visible = false;
      if (G.issHalo) G.issHalo.visible = false;
      return;
    }
    try {
      var r = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!r.ok) throw new Error('iss ' + r.status);
      var j = await r.json();
      var lat = parseFloat(j.latitude);
      var lng = parseFloat(j.longitude);
      if (!isFinite(lat) || !isFinite(lng)) return;
      // LEO altitude ~420 km → radius scale ~1.066 on unit Earth
      var alt = 1.066;
      var p = latLngToVec(lat, lng, alt);
      G.issMesh.position.copy(p);
      G.issMesh.visible = true;
      if (G.issHalo) {
        G.issHalo.position.copy(p);
        G.issHalo.visible = true;
      }
      G._issPos = { lat: lat, lng: lng };
    } catch (_) {
      /* feed optional — constellation still shows */
    }
  }

  function bindInput() {
    var canvas = G.renderer.domElement;
    var lx = 0,
      ly = 0,
      down = false,
      lastT = 0,
      downX = 0,
      downY = 0,
      downAt = 0,
      moved = false,
      dragActive = false,
      ptrId = null,
      holdTimer = null,
      holdRepeat = null,
      holdFired = false,
      // EMA of pointer velocity (screen px/ms) for soft fling only
      smVx = 0,
      smVy = 0,
      // Accumulated path length to distinguish tap vs rotate
      pathLen = 0;

    // Sensitivity: calm + distance-scaled (near surface much slower — no flip chaos)
    function rotScale() {
      var z = G.camera && G.camera.position ? G.camera.position.z : 5;
      // closer → smaller spin per pixel
      return Math.max(0.0007, Math.min(0.0018, 0.00115 * (z / 4.5)));
    }

    function clearHold() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (holdRepeat) {
        clearInterval(holdRepeat);
        holdRepeat = null;
      }
    }

    function doZoomOutStep() {
      G.lastAct = Date.now();
      G.lastUserControl = Date.now();
      G.velX = 0;
      G.velY = 0;
      smVx = 0;
      smVy = 0;
      G.flyGen = (G.flyGen || 0) + 1;
      G.flying = false;
      if (global.SNMap && SNMap.active) {
        try {
          SNMap.close();
        } catch (_) {}
        G.diveTier = 'city';
        syncDiveStepFromTier('city');
        animateZ(TIERS.city.z, 420);
        setTierLabel();
        syncSpaceLayerVis();
        syncNationalLayer();
        return;
      }
      zoomOutOne();
    }

    function onDown(e) {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      // Ignore secondary buttons
      if (e.button != null && e.button !== 0) return;
      down = true;
      moved = false;
      dragActive = false;
      holdFired = false;
      pathLen = 0;
      smVx = 0;
      smVy = 0;
      clearHold();
      // Kill fly + inertia so sphere never fights the hand
      G.velX = 0;
      G.velY = 0;
      G.flyGen = (G.flyGen || 0) + 1;
      G.flying = false;
      G.zoomAnim = false; // stop mid-zoom jump during grab
      G.dragging = true;
      G.lastAct = Date.now();
      G.lastUserControl = Date.now();
      lastT = performance.now();
      downAt = lastT;
      var t = e.touches ? e.touches[0] : e;
      lx = t.clientX;
      ly = t.clientY;
      downX = t.clientX;
      downY = t.clientY;
      ptrId = e.pointerId != null ? e.pointerId : 'm';
      try {
        if (e.pointerId != null) canvas.setPointerCapture(e.pointerId);
      } catch (_) {}

      // Hold-zoom only if truly still (not rotating) — longer delay
      holdTimer = setTimeout(function () {
        holdTimer = null;
        if (!down || moved || dragActive) return;
        holdFired = true;
        G.dragging = false;
        doZoomOutStep();
        holdRepeat = setInterval(function () {
          if (!down || moved) {
            clearHold();
            return;
          }
          doZoomOutStep();
        }, 480);
      }, 520);
    }

    function onMove(e) {
      if (!down) return;
      // Only track the pointer we captured
      if (ptrId != null && e.pointerId != null && e.pointerId !== ptrId) return;
      var t = e.touches ? e.touches[0] : e;
      var now = performance.now();
      var dt = Math.max(8, Math.min(48, now - lastT)); // clamp dt → no velocity spikes
      lastT = now;
      var dx = t.clientX - lx;
      var dy = t.clientY - ly;
      lx = t.clientX;
      ly = t.clientY;
      pathLen += Math.abs(dx) + Math.abs(dy);

      var distFromDown = Math.hypot(t.clientX - downX, t.clientY - downY);
      // Deadzone: ignore micro jitter (stops shake on click)
      if (!dragActive) {
        if (distFromDown < 12 && pathLen < 16) {
          if (e.cancelable) e.preventDefault();
          return;
        }
        dragActive = true;
        moved = true;
        clearHold();
        // Re-seed last point so first real frame has no jump
        lx = t.clientX;
        ly = t.clientY;
        if (e.cancelable) e.preventDefault();
        return;
      }

      G.lastAct = Date.now();
      G.lastUserControl = Date.now();

      if (holdFired) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Soft low-pass on deltas (anti-shake / anti-flip)
      var sx = dx * 0.55;
      var sy = dy * 0.55;
      var k = rotScale();

      if (G.spin && G.tilt) {
        G.spin.rotation.y += sx * k;
        var nx = G.tilt.rotation.x + sy * k * 0.85;
        if (nx > TILT_MAX) nx = TILT_MAX;
        if (nx < -TILT_MAX) nx = -TILT_MAX;
        G.tilt.rotation.x = nx;
        G.spin.rotation.x = 0;
        G.spin.rotation.z = 0;
        G.tilt.rotation.y = 0;
        G.tilt.rotation.z = 0;
      }

      // EMA screen velocity for optional fling (rad/frame units later)
      var invDt = 1 / dt;
      smVx = smVx * 0.65 + dx * invDt * 0.35;
      smVy = smVy * 0.65 + dy * invDt * 0.35;

      if (e.cancelable) e.preventDefault();
    }

    function onUp(e) {
      if (!down) return;
      if (ptrId != null && e.pointerId != null && e.pointerId !== ptrId && e.type !== 'pointercancel')
        return;
      down = false;
      G.dragging = false;
      G.lastAct = Date.now();
      G.lastUserControl = Date.now();
      var wasHold = holdFired;
      var wasDrag = dragActive || moved;
      clearHold();
      holdFired = false;
      try {
        if (e.pointerId != null) canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}

      var holdMs = performance.now() - downAt;
      // Almost no fling — sphere stops where the finger leaves (no wild spin)
      var flickSpeed = Math.hypot(smVx, smVy);
      if (wasDrag && flickSpeed > 1.1 && holdMs < 420) {
        var k = rotScale();
        G.velX = Math.max(-0.006, Math.min(0.006, smVx * k * 3.2));
        G.velY = Math.max(-0.004, Math.min(0.004, smVy * k * 2.8));
      } else {
        G.velX = 0;
        G.velY = 0;
      }
      smVx = 0;
      smVy = 0;
      bakePivotEuler();

      // Single tap zoom-in only: short, still, not hold
      if (!wasDrag && !wasHold && holdMs < 320) {
        var t = e.changedTouches ? e.changedTouches[0] : e;
        if (t) {
          var cx = t.clientX;
          var cy = t.clientY;
          var ll = pickLatLng(cx, cy) || focusPos();
          if (ll && ll.lat != null) {
            G.velX = 0;
            G.velY = 0;
            diveInAt(ll.lat, ll.lng);
          } else {
            var cur = currentTier();
            var idx = ladderIndex(cur);
            if (idx < LADDER.length - 1) goToTier(LADDER[idx + 1]);
          }
        }
      }
      ptrId = null;
      dragActive = false;
      moved = false;
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    // Do NOT also bind window pointerup — double-fire caused jumps
    canvas.addEventListener(
      'lostpointercapture',
      function () {
        if (down) {
          down = false;
          G.dragging = false;
          clearHold();
          G.velX = 0;
          G.velY = 0;
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
        G.lastAct = Date.now();
        G.lastUserControl = Date.now();
        G.velX = 0;
        G.velY = 0;
        var under = pickLatLng(e.clientX, e.clientY);
        if (under) setFocus(under.lat, under.lng);

        G._wheelAcc = (G._wheelAcc || 0) + e.deltaY;
        var now = Date.now();
        if (G.zoomAnim || G.flying) return;
        if (now < (G._wheelCoolUntil || 0)) return;
        if (Math.abs(G._wheelAcc) < 48) return;
        var zoomOut = G._wheelAcc > 0;
        G._wheelAcc = 0;
        G._wheelCoolUntil = now + 480;

        if (zoomOut) {
          doZoomOutStep();
          return;
        }

        var p = under || focusPos();
        if (p && p.lat != null) {
          diveInAt(p.lat, p.lng);
        } else {
          var cur = currentTier();
          var idx = ladderIndex(cur);
          if (idx < LADDER.length - 1) goToTier(LADDER[idx + 1]);
        }
      },
      { passive: false }
    );

    canvas.addEventListener('dblclick', function (e) {
      e.preventDefault();
      doZoomOutStep();
    });

    // CSS: prevent browser pan/zoom fighting our drag
    try {
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';
    } catch (_) {}
  }

  /**
   * SPACENET pilot dive — one cell deeper on the fly grid.
   * GLOBAL → NATIONAL → REGIONAL → CITY (street map + operational tiles).
   * New place restarts at GLOBAL facing that lat/lng.
   * No blue rings — fly and zoom only.
   */
  function diveInAt(lat, lng) {
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return false;
    var n = nextDiveAction(lat, lng);
    var cell = n.cell || n.action || 'global';
    if (!TIERS[cell]) cell = 'global';

    // New place: lock SPACENET anchor so the next three taps deepen here
    if (!n.same) {
      setDiveAnchor(lat, lng);
    } else if (!G.diveAnchor) {
      setDiveAnchor(lat, lng);
    }
    // Soft-update anchor toward click (stays in same country/metro)
    setFocus(lat, lng);

    G.diveStep = n.step != null ? n.step : DIVE.indexOf(cell);
    G.velX = 0;
    G.velY = 0;

    var openMap =
      n.openMap === true || (cell === 'city' && (G.bodyId === 'earth' || !G.bodyId));

    var ok = goToPlace(lat, lng, {
      tier: cell,
      openMap: openMap,
      pulse: false,
      body: G.bodyId || 'earth',
      skipScan: cell === 'city' ? false : cell === 'global',
    });

    try {
      var path = (SN && SN.pathString && SN.pathString()) || 'GLOBAL → NATIONAL → REGIONAL → CITY';
      var hint = n.hint || ((TIERS[cell] && TIERS[cell].label) || cell);
      if (global.SNCli && SNCli.log) {
        SNCli.log(hint + ' · ' + lat.toFixed(3) + ', ' + lng.toFixed(3), 'ok');
        if (cell !== 'city') SNCli.log('Zoom · ' + path, 'dim');
        SNCli.preview(hint);
      }
      setHud(hint);
    } catch (_) {}
    return ok;
  }

  /**
   * Double tap/click: SPACENET step OUT one cell (city→regional→national→global→solar).
   */
  function zoomOutOne() {
    var prev = prevZoomTier();
    G.diveTier = prev;
    syncDiveStepFromTier(prev);
    G.velX = 0;
    G.velY = 0;
    if (prev === 'city' || prev === 'regional' || prev === 'national' || prev === 'global') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
      var f = focusPos() || G.diveAnchor;
      if (f && f.lat != null && prev !== 'solar') {
        flyNear(f.lat, f.lng, prev);
      } else {
        animateZ(TIERS[prev] ? TIERS[prev].z : TIERS.global.z, 700);
      }
    } else {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
      animateZ(TIERS[prev] ? TIERS[prev].z : TIERS.solar.z, 700);
      G.diveTier = prev;
    }
    setTierLabel();
    var label = (TIERS[prev] && TIERS[prev].label) || prev;
    setHud(label + ' · zoom out');
    try {
      if (global.SNCli && SNCli.log) SNCli.log('Zoom out · ' + label, 'dim');
      if (global.SNCli && SNCli.preview) SNCli.preview(label);
    } catch (_) {}
    return prev;
  }

  /**
   * Switch planetary / body globe (Earth, Mars, Moon, …). Dedummyfy multi-world.
   */
  function setBody(bodyId, meta) {
    if (!G.ready || !G.earth) return false;
    var id = String(bodyId || 'earth').toLowerCase();
    G.bodyId = id;
    G.bodyMeta = meta || null;
    var loader = G._loader || new THREE.TextureLoader();

    G.dayNightReady = false;
    G.dayNightUniforms = null;

    if (id === 'earth') {
      var earthPhong = new THREE.MeshPhongMaterial({
        color: 0x223344,
        specular: 0x333333,
        shininess: 12,
      });
      G.earth.material = earthPhong;
      G.earthMat = earthPhong;
      if (G._applyEarthTextures) G._applyEarthTextures();
      if (G.clouds) G.clouds.visible = true;
      syncNationalLayer();
      setHud('Earth · GLOBAL');
      return true;
    }

    if (G.clouds) G.clouds.visible = false;
    if (G.nationalRoot) G.nationalRoot.visible = false;
    G.nationalOn = false;
    updateNationalHud(true);
    var col = (meta && meta.color) || 0x888888;
    var bodyMat = new THREE.MeshPhongMaterial({
      color: col,
      specular: 0x222222,
      shininess: 8,
    });
    G.earth.material = bodyMat;
    G.earthMat = bodyMat;

    if (meta && meta.map) {
      loader.load(
        meta.map,
        function (tex) {
          bodyMat.map = tex;
          bodyMat.color.set(0xffffff);
          bodyMat.needsUpdate = true;
        },
        undefined,
        function () {
          bodyMat.color.set(col);
          bodyMat.needsUpdate = true;
        }
      );
    }
    setHud((meta && meta.name) || id);
    try {
      if (global.SNCli && SNCli.log)
        SNCli.log('Globe body · ' + ((meta && meta.name) || id), 'ok');
    } catch (_) {}
    return true;
  }

  /**
   * SpaceNet: fly to lat/lng + zoom tier + optional crawl.
   * Default: NO pulse markers (SPECS — click is fly/zoom only).
   * Pass pulse:true only for explicit pin highlights (locate / optional UI).
   */
  function goToPlace(lat, lng, opts) {
    opts = opts || {};
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return false;
    setFocus(lat, lng);
    setDiveAnchor(lat, lng);
    var tier = opts.tier || 'national';
    if (tier === 'center') tier = 'global';
    if (!TIERS[tier]) tier = 'national';
    G.diveTier = tier;
    // Align SPACENET cell index with explicit tier
    syncDiveStepFromTier(tier);
    var bodyId = opts.body || G.bodyId || 'earth';
    // Fly + zoom only — no decorative rings unless explicitly requested
    flyNear(lat, lng, tier);
    if (opts.pulse === true) {
      pulse(lat, lng, opts.color != null ? opts.color : 0x3d9eff, opts.label || '', opts.ms || 8000);
    }
    try {
      var label = (TIERS[tier] && TIERS[tier].label) || tier;
      var bname =
        (global.SNCosmos && SNCosmos.body && SNCosmos.body.name) ||
        bodyId ||
        'Earth';
      var clock = localClockAt(lat, lng);
      var near = nearestMajorCity(lat, lng);
      var placeBit = near ? near.n : lat.toFixed(2) + '°, ' + lng.toFixed(2) + '°';
      setHud(
        bname +
          ' · ' +
          label +
          ' · ' +
          placeBit +
          ' · ' +
          clock.time +
          ' · ' +
          clock.dayNight
      );
      if (global.SNCli && SNCli.log) {
        var nextHint = '';
        if (tier === 'global') nextHint = ' · tap → NATIONAL';
        else if (tier === 'national') nextHint = ' · tap → REGIONAL';
        else if (tier === 'regional') nextHint = ' · tap → CITY';
        else if (tier === 'city') nextHint = ' · pizza · barman · date';
        SNCli.log(
          bname +
            ' · ' +
            label +
            ' · ' +
            placeBit +
            ' · ' +
            clock.time +
            ' local · ' +
            clock.dayNight +
            nextHint,
          'ok'
        );
        SNCli.preview(label + nextHint);
      }
    } catch (_) {}
    // Earth street map only at CITY (or openMap:true) — not at national/regional
    if (
      (opts.openMap === true || (opts.openMap !== false && tier === 'city')) &&
      (bodyId === 'earth' || G.bodyId === 'earth')
    ) {
      try {
        if (global.SNMap && SNMap.open) void SNMap.open(lat, lng);
      } catch (_) {}
    } else if (tier !== 'city') {
      try {
        if (global.SNMap && SNMap.close && global.SNMap.active) SNMap.close();
      } catch (_) {}
    }
    // Crawl POIs at this address — never re-fly
    if (!opts.skipScan && global.SNCosmos && SNCosmos.scan) {
      void SNCosmos.scan(bodyId || G.bodyId || 'earth', lat, lng, {
        openMap: false,
        fly: false,
      });
    }
    setTierLabel();
    syncNationalLayer();
    return true;
  }

  function onResize() {
    if (!G.renderer) return;
    var el = document.getElementById('globe');
    var w = el.clientWidth || window.innerWidth;
    var h = el.clientHeight || window.innerHeight;
    G.camera.aspect = w / h;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(w, h, false);
  }


  var _globeUnsub = null;
  function ensureGlobeEngine() {
    if (G._engineHooked) return;
    G._engineHooked = true;
    if (global.SNGameLoop && SNGameLoop.subscribe) {
      _globeUnsub = SNGameLoop.subscribe(
        function (dt, now) {
          loop(dt, now);
        },
        { lane: 'visual', name: 'globe' }
      );
    } else {
      function rafLoop(now) {
        requestAnimationFrame(rafLoop);
        loop(16, now);
      }
      requestAnimationFrame(rafLoop);
    }
  }

  function loop(dtMs, now) {
    // When called from RAF fallback, no args — when from SNEngine, dtMs is set
    if (!G.ready || document.hidden) return;
    // City map open: freeze Earth almost completely
    if (global.SNMap && SNMap.active) {
      if (++G.frame % 90 === 0) {
        try {
          G.renderer.render(G.scene, G.camera);
        } catch (_) {}
      }
      return;
    }
    G.frame++;
    var moving =
      G.dragging ||
      G.zoomAnim ||
      G.flying ||
      Math.abs(G.velX) > 0.00005 ||
      Math.abs(G.velY) > 0.00005;
    var idle = Date.now() - G.lastAct > 2400;
    var idleSkip = (global.SNPerf && SNPerf.idleSkip) || (G._lite ? 4 : 3);
    // Never skip frames while user drags or inertia runs (skip was causing jump/shake)
    if (!moving) {
      var skip = idle ? idleSkip : 2;
      if (G.frame % skip !== 0) return;
    }
    var userCool = Date.now() - (G.lastUserControl || 0) < 650;
    if (
      !G.dragging &&
      !G.flying &&
      !userCool &&
      G.spin &&
      G.tilt &&
      (Math.abs(G.velX) > 0.00005 || Math.abs(G.velY) > 0.00005)
    ) {
      G.spin.rotation.y += G.velX;
      G.tilt.rotation.x = Math.max(
        -TILT_MAX,
        Math.min(TILT_MAX, G.tilt.rotation.x + G.velY)
      );
      G.spin.rotation.x = 0;
      G.spin.rotation.z = 0;
      G.tilt.rotation.y = 0;
      G.tilt.rotation.z = 0;
      G.velX *= Math.min(0.86, G.damp || 0.86);
      G.velY *= Math.min(0.86, G.damp || 0.86);
      if (Math.abs(G.velX) < 0.00005) G.velX = 0;
      if (Math.abs(G.velY) < 0.00005) G.velY = 0;
    } else if (
      !G.dragging &&
      !G.flying &&
      !userCool &&
      idle &&
      G.camera.position.z > 4.0 &&
      G.spin &&
      Math.abs(G.velX) < 0.00005
    ) {
      // Idle drift OFF while user has touched recently; otherwise microscopic
      if (Date.now() - (G.lastUserControl || 0) > 8000)
        G.spin.rotation.y += G._lite ? 0.00008 : 0.00012;
    }
    if (G.clouds && !G._lite) G.clouds.rotation.y += 0.00035;
    if (G.issHalo && G.issHalo.visible) {
      var s = 1 + 0.1 * Math.sin(Date.now() * 0.0035);
      G.issHalo.scale.set(s, s, s);
    }
    var hudEvery = G._lite ? 8 : 5;
    if (G.frame % hudEvery === 0) {
      updateDayNight();
      syncSpaceLayerVis();
      if (G.nationalOn || (G.nationalRoot && G.nationalRoot.visible) || activityShouldShow()) {
        updateNationalHud(false);
        if (G.frame % 120 === 0) refreshActivityArcs();
        if (G.webbGrid && G.webbGrid.material && G.webbGrid.visible) {
          G.webbGrid.material.opacity = 0.16;
        }
        if (G.webbGridGlow && G.webbGridGlow.material && G.webbGridGlow.visible) {
          G.webbGridGlow.material.opacity = 0.07;
        }
        if (G.borderLines && G.borderLines.material) {
          G.borderLines.material.opacity = 0.28 + 0.06 * Math.sin(Date.now() * 0.0012);
        }
        if (G.cityGlow && G.cityGlow.material) {
          G.cityGlow.material.opacity =
            (currentTier() === 'global' ? 0.4 : 0.35) + 0.08 * Math.sin(Date.now() * 0.0018);
        }
        if (G.activityLines && G.activityLines.material) {
          G.activityLines.material.opacity =
            (currentTier() === 'global' ? 0.5 : 0.7) +
            0.1 * Math.sin(Date.now() * 0.002);
        }
      }
    }
    try {
      G.renderer.render(G.scene, G.camera);
    } catch (_) {}
  }

  function animateZ(toZ, ms) {
    var from = G.camera.position.z;
    var t0 = performance.now();
    var dur = ms || 650;
    G.zoomAnim = true;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
      G.camera.position.z = from + (toZ - from) * e;
      setTierLabel();
      syncSpaceLayerVis();
      G.lastAct = Date.now();
      if (k < 1) requestAnimationFrame(step);
      else {
        G.zoomAnim = false;
        syncSpaceLayerVis();
      }
    }
    requestAnimationFrame(step);
  }

  function goToTier(name) {
    var key = String(name || 'global').toLowerCase();
    if (key === 'earth' || key === 'full' || key === 'space') key = 'global';
    var t = TIERS[key] || TIERS.global;
    G.diveTier = key in TIERS ? key : 'global';
    syncDiveStepFromTier(G.diveTier);
    if (key !== 'city') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
      } catch (_) {}
    }
    // GLOBAL/SOLAR: full sphere in space — center camera, pull back, show ISS/sats
    if (key === 'global' || key === 'solar') {
      if (G.camera) {
        G.camera.position.x = 0;
        G.camera.position.y = key === 'solar' ? 0.04 : 0.06;
      }
      setSpaceLive(true);
    }
    animateZ(t.z, 800);
    setTierLabel();
    syncSpaceLayerVis();
    G.tier = G.diveTier;
    var hud =
      key === 'global'
        ? 'GLOBAL · full Earth in space · ISS + sats'
        : key === 'solar'
          ? 'SOLAR · deep space overview'
          : 'Astranov · ' + t.label;
    setHud(hud);
    try {
      if (global.SNCli && SNCli.preview) {
        SNCli.preview(
          key === 'global' ? 'GLOBAL · full Earth in space' : t.label
        );
      }
      if (global.SNCli && SNCli.log && (key === 'global' || key === 'solar')) {
        SNCli.log(
          key === 'global'
            ? 'GLOBAL · whole Earth in space · ISS · satellites'
            : 'SOLAR · deep space',
          'ok'
        );
      }
    } catch (_) {}
    return t.label;
  }

  function clearMarkers() {
    G.markers.forEach(function (m) {
      try {
        G.pivot.remove(m.mesh);
        if (m.ring) G.pivot.remove(m.ring);
      } catch (_) {}
    });
    G.markers = [];
  }

  /** Tiny target pulse for locate/shops only — never used on click dive (SPECS) */
  function pulse(lat, lng, color, label, ms) {
    if (!G.ready) return null;
    var c = color != null ? color : 0x44ffaa;
    var pos = latLngToVec(lat, lng, 1.012);
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshBasicMaterial({ color: c })
    );
    mesh.position.copy(pos);
    G.pivot.add(mesh);
    G.markers.push({ mesh: mesh, ring: null, born: Date.now(), ms: ms || 10000 });
    var now = Date.now();
    G.markers = G.markers.filter(function (m) {
      if (now - m.born > m.ms) {
        try {
          G.pivot.remove(m.mesh);
          if (m.ring) G.pivot.remove(m.ring);
        } catch (_) {}
        return false;
      }
      return true;
    });
    G.lastAct = Date.now();
    return mesh;
  }

  /**
   * Rotate pivot so lat/lng faces the camera — same frame as pulse/latLngToVec.
   * Old formula (-lng, lat*0.55) did NOT match the sphere mapping → marker OK, view wrong.
   */
  function flyNear(lat, lng, tierHint) {
    if (!G.ready || !G.tilt || !G.spin || !G.camera) return;
    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
    setFocus(lat, lng);
    G.velX = 0;
    G.velY = 0;
    G.flyGen = (G.flyGen || 0) + 1;
    var gen = G.flyGen;
    G.flying = true;
    G.lastAct = Date.now();

    var x0 = G.tilt.rotation.x;
    var y0 = G.spin.rotation.y;
    var x1 = (-Number(lat) * Math.PI) / 180;
    var y1 = (-Number(lng) * Math.PI) / 180;
    if (x1 > TILT_MAX) x1 = TILT_MAX;
    if (x1 < -TILT_MAX) x1 = -TILT_MAX;
    var dyAng = unwrapAngle(y1 - y0);

    var t0 = performance.now();
    var dur = 780;
    function step(t) {
      if (gen !== G.flyGen) return;
      if (G.dragging) {
        G.flying = false;
        bakePivotEuler();
        return;
      }
      var k = Math.min(1, (t - t0) / dur);
      var e = k * (2 - k);
      G.tilt.rotation.set(x0 + (x1 - x0) * e, 0, 0);
      G.spin.rotation.set(0, y0 + dyAng * e, 0);
      G.lastAct = Date.now();
      if (k < 1) {
        requestAnimationFrame(step);
      } else {
        setGlobeLatLng(lat, lng);
        G.velX = 0;
        G.velY = 0;
        G.flying = false;
        G.lastAct = Date.now();
      }
    }
    requestAnimationFrame(step);
    if (tierHint && TIERS[tierHint]) animateZ(TIERS[tierHint].z, 650);
  }

  function locate() {
    return new Promise(function (resolve) {
      function finish(lat, lng, fallback, reason) {
        try {
          goToPlace(lat, lng, {
            tier: fallback ? 'national' : 'city',
            pulse: true,
            color: 0x3d9eff,
            label: fallback ? 'You (default)' : 'You',
            skipScan: false,
            openMap: !fallback,
          });
        } catch (_) {}
        resolve({
          lat: lat,
          lng: lng,
          fallback: !!fallback,
          demo: false,
          reason: reason || null,
        });
      }
      if (!navigator.geolocation) return finish(36.4341, 28.2176, true, 'unsupported');
      if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
        return finish(36.4341, 28.2176, true, 'insecure');
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          finish(pos.coords.latitude, pos.coords.longitude, false, null);
        },
        function (err) {
          var code = err && err.code;
          var reason =
            code === 1 ? 'denied' : code === 2 ? 'unavailable' : code === 3 ? 'timeout' : 'error';
          finish(36.4341, 28.2176, true, reason);
        },
        { enableHighAccuracy: true, timeout: 14000, maximumAge: 20000 }
      );
    });
  }

  function setHud(text) {
    var el = document.getElementById('hud-line');
    if (el) el.textContent = text || '';
  }

  function getPhysics() {
    return {
      velX: G.velX,
      velY: G.velY,
      damp: G.damp,
      inertia: true,
      dragging: G.dragging,
      tier: G.tier,
      z: G.camera ? G.camera.position.z : null,
      focus: focusPos(),
      diveAnchor: G.diveAnchor,
      diveStep: G.diveStep,
      spacenet: true,
    };
  }

  global.SNGlobe = {
    init: init,
    pulse: pulse,
    clearMarkers: clearMarkers,
    locate: locate,
    flyNear: flyNear,
    goToTier: goToTier,
    goToPlace: goToPlace,
    diveInAt: diveInAt,
    zoomOutOne: zoomOutOne,
    setBody: setBody,
    pickLatLng: pickLatLng,
    setFocus: setFocus,
    focusPos: focusPos,
    setHud: setHud,
    getPhysics: getPhysics,
    nearestCity: nearestMajorCity,
    currentTier: currentTier,
    TIERS: TIERS,
    LADDER: LADDER,
    DIVE: DIVE,
    /** SPACENET pilot fly grid (alias of window.SPACENET) */
    SPACENET: SN || null,
    get tier() {
      return G.tier;
    },
    get bodyId() {
      return G.bodyId || 'earth';
    },
    get ready() {
      return G.ready;
    },
    get lastPos() {
      return focusPos();
    },
    get diveAnchor() {
      return G.diveAnchor;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
