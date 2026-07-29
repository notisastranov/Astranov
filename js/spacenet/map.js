/* SpaceNet surface map — lightweight Leaflet engine
 * Near surface (SPACENET CITY / street): bright · dark · satellite basemaps
 * Lazy-load Leaflet only when flying close enough to open the flat map.
 */
(function (global) {
  'use strict';

  const LAYER_KEY = 'sn:map-layer-v1';

  /** Lightweight free tile stacks (no API key) */
  const BASEMAPS = {
    dark: {
      id: 'dark',
      label: 'Dark',
      emoji: '🌑',
      // Carto Dark — light CDN, pairs with SpaceNet chrome
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      opts: { maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', attribution: '© OSM · CARTO' },
    },
    bright: {
      id: 'bright',
      label: 'Bright',
      emoji: '☀️',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      opts: { maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', attribution: '© OSM · CARTO' },
    },
    satellite: {
      id: 'satellite',
      label: 'Sat',
      emoji: '🛰',
      // Esri World Imagery — free tile service, good satellite variation
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      opts: { maxZoom: 19, maxNativeZoom: 19, attribution: 'Esri · Maxar' },
      // Optional light labels on top of imagery
      labelsUrl: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      labelsOpts: { maxZoom: 20, maxNativeZoom: 19, subdomains: 'abcd', opacity: 0.85, pane: 'overlayPane' },
    },
  };

  const M = {
    map: null,
    active: false,
    markers: [],
    profileMarkers: [],
    basemapId: 'dark',
    basemapLayer: null,
    labelsLayer: null,
    layerCtl: null,
  };

  function loadBasemapPref() {
    try {
      const v = localStorage.getItem(LAYER_KEY);
      if (v && BASEMAPS[v]) M.basemapId = v;
    } catch (_) {}
  }

  function saveBasemapPref(id) {
    try {
      localStorage.setItem(LAYER_KEY, id);
    } catch (_) {}
  }

  /**
   * Prefer dark at night / bright by day when user has not locked a preference this session.
   * Still overridable via layer control.
   */
  function suggestBasemapFromDayNight(lat, lng) {
    // Local civil hour from longitude (15° ≈ 1h) — bright by day, dark by night
    const offsetH = Math.round((lng || 0) / 15);
    const h = (new Date().getUTCHours() + offsetH + 24) % 24;
    return h >= 7 && h < 19 ? 'bright' : 'dark';
  }

  function hasUserLayerPref() {
    try {
      return !!localStorage.getItem(LAYER_KEY);
    } catch (_) {
      return false;
    }
  }

  function loadCss(href) {
    if (document.querySelector('link[data-sn-map]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.dataset.snMap = '1';
    document.head.appendChild(l);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('leaflet'));
      document.head.appendChild(s);
    });
  }

  function backToGlobe() {
    close();
    // Animate 3D Earth only after map is closed (do not call goToTier before close —
    // goToTier also calls close; recursion-safe via M.active false).
    try {
      if (global.SNGlobe?.goToTier) global.SNGlobe.goToTier('global');
      else if (global.SNGlobe?.animateZ) global.SNGlobe.animateZ?.(2.75, 700);
    } catch (_) {}
    try {
      global.SNCli?.log?.('3D Earth · SNGlobe imaging', 'ok');
      global.SNCli?.preview?.('GLOBAL Earth');
    } catch (_) {}
  }

  function ensureLayerCss() {
    if (document.getElementById('sn-map-layer-css')) return;
    const st = document.createElement('style');
    st.id = 'sn-map-layer-css';
    st.textContent = [
      '#sn-map-layers{position:absolute;top:12px;right:12px;z-index:1000;display:flex;gap:6px;',
      'pointer-events:auto;background:rgba(0,8,20,.82);border:1px solid rgba(61,158,255,.45);',
      'border-radius:12px;padding:5px;box-shadow:0 4px 18px rgba(0,0,0,.45)}',
      '#sn-map-layers button{border:1px solid transparent;background:transparent;color:#9ec8ff;',
      'border-radius:9px;padding:7px 9px;font:700 11px/1.1 system-ui;cursor:pointer;',
      'display:flex;flex-direction:column;align-items:center;gap:2px;min-width:48px}',
      '#sn-map-layers button span{font-size:16px;line-height:1}',
      '#sn-map-layers button.on{border-color:#3d9eff;background:rgba(26,111,212,.35);color:#e8f4ff;',
      'box-shadow:0 0 12px rgba(61,158,255,.35)}',
      '#sn-map-layers button:active{transform:scale(0.96)}',
      /* No Leaflet +/− zoom chrome (pinch/wheel only) */
      '.leaflet-control-zoom{display:none!important}',
    ].join('');
    document.head.appendChild(st);
  }

  function buildLayerControl(map) {
    ensureLayerCss();
    let box = document.getElementById('sn-map-layers');
    if (box) box.remove();
    box = document.createElement('div');
    box.id = 'sn-map-layers';
    box.setAttribute('role', 'toolbar');
    box.setAttribute('aria-label', 'Map style: bright dark satellite');
    Object.keys(BASEMAPS).forEach((id) => {
      const def = BASEMAPS[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.layer = id;
      btn.title = def.label + ' basemap';
      btn.innerHTML = '<span aria-hidden="true">' + def.emoji + '</span>' + def.label;
      if (id === M.basemapId) btn.classList.add('on');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBasemap(id, { user: true });
      });
      box.appendChild(btn);
    });
    map.getContainer().appendChild(box);
    M.layerCtl = box;
  }

  function setBasemap(id, opts) {
    opts = opts || {};
    if (!M.map || typeof L === 'undefined') return false;
    const def = BASEMAPS[id] || BASEMAPS.dark;
    id = def.id;
    M.basemapId = id;
    if (opts.user) saveBasemapPref(id);

    if (M.basemapLayer) {
      try {
        M.map.removeLayer(M.basemapLayer);
      } catch (_) {}
      M.basemapLayer = null;
    }
    if (M.labelsLayer) {
      try {
        M.map.removeLayer(M.labelsLayer);
      } catch (_) {}
      M.labelsLayer = null;
    }

    M.basemapLayer = L.tileLayer(def.url, Object.assign({ className: 'sn-base-' + id }, def.opts));
    M.basemapLayer.addTo(M.map);
    // keep basemap under markers
    try {
      M.basemapLayer.bringToBack();
    } catch (_) {}

    if (def.labelsUrl) {
      M.labelsLayer = L.tileLayer(def.labelsUrl, def.labelsOpts || {});
      M.labelsLayer.addTo(M.map);
    }

    if (M.layerCtl) {
      M.layerCtl.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('on', b.dataset.layer === id);
      });
    }

    try {
      if (opts.user || opts.log) {
        global.SNCli?.log?.(
          'Surface map · ' + def.label + ' layer (bright / dark / satellite)',
          'ok'
        );
      }
    } catch (_) {}
    return true;
  }

  async function ensure() {
    if (M.map) return M.map;
    loadBasemapPref();
    loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    const el = document.getElementById('city-map');
    if (!el || typeof L === 'undefined') throw new Error('map container');
    const pos = global.SNTasks?.pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 };
    M.map = L.map(el, {
      zoomControl: false, // no +/− corner controls — pinch/wheel only
      attributionControl: true,
      minZoom: 3,
      maxZoom: 20,
      preferCanvas: true, // lighter pin drawing when many markers
    }).setView([pos.lat, pos.lng], 14);

    // Lightweight basemap engine: bright · dark · satellite
    setBasemap(M.basemapId || 'dark', { log: false });
    buildLayerControl(M.map);

    // Zoom OUT at min → real 3D globe (never leave user on flat map forever)
    M._lastZ = 14;
    M.map.on('zoomend', () => {
      if (!M.active) return;
      const z = M.map.getZoom();
      if (z < M._lastZ && z <= M.map.getMinZoom()) {
        backToGlobe();
        return;
      }
      M._lastZ = z;
    });
    // Wheel zoom-out past min also returns to globe
    M.map.getContainer().addEventListener(
      'wheel',
      (e) => {
        if (!M.active || e.deltaY <= 0) return;
        if (M.map.getZoom() <= M.map.getMinZoom()) {
          e.preventDefault();
          backToGlobe();
        }
      },
      { passive: false }
    );

    // LONG-PRESS empty map → multi-tile create (never short accidental click)
    bindLongPressCreate(M.map);

    return M.map;
  }

  function bindLongPressCreate(map) {
    if (!map || map._snLongPressBound) return;
    map._snLongPressBound = true;
    const HOLD_MS = 580;
    let timer = null;
    let startLL = null;
    let startPt = null;
    let cancelled = false;

    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      startLL = null;
      startPt = null;
    }

    function onDown(e) {
      // Original event may be on a marker — skip create
      const oe = e.originalEvent;
      if (oe && oe.target) {
        const t = oe.target;
        if (
          t.closest &&
          (t.closest('.leaflet-marker-icon') ||
            t.closest('.leaflet-interactive') ||
            t.closest('.sn-pin') ||
            t.closest('.sn-pin-inner'))
        ) {
          return;
        }
      }
      if (M._markerHit) return;
      cancelled = false;
      startLL = e.latlng;
      startPt = e.containerPoint;
      timer = setTimeout(() => {
        timer = null;
        if (cancelled || !startLL || !M.active) return;
        try {
          global.SNTile?.createAt?.(startLL.lat, startLL.lng);
          global.SNCli?.log?.('Long-press · multi-tile', 'ok');
        } catch (err) {
          global.SNCli?.log?.('Tile create failed · ' + (err.message || err), 'err');
        }
      }, HOLD_MS);
    }

    function onMove(e) {
      if (!startPt || !e.containerPoint) return;
      const dx = e.containerPoint.x - startPt.x;
      const dy = e.containerPoint.y - startPt.y;
      if (dx * dx + dy * dy > 100) {
        cancelled = true;
        clear();
      }
    }

    function onUp() {
      clear();
      // allow next marker hit flag to clear after click cycle
      setTimeout(() => {
        M._markerHit = false;
      }, 50);
    }

    map.on('mousedown', onDown);
    map.on('touchstart', onDown, { passive: true });
    map.on('mousemove', onMove);
    map.on('touchmove', onMove, { passive: true });
    map.on('mouseup', onUp);
    map.on('touchend', onUp);
    map.on('touchcancel', onUp);
    // Short click empty map → NATIONAL globe at that place (map was unusable before)
    map.on('click', (e) => {
      clear();
      if (M._markerHit) return;
      if (!e || !e.latlng) return;
      const la = e.latlng.lat;
      const lo = e.latlng.lng;
      try {
        // Leave street map, fly 3D Earth to that place at NATIONAL
        close();
        if (global.SNGlobe?.goToPlace) {
          global.SNGlobe.goToPlace(la, lo, {
            tier: 'national',
            openMap: false,
            pulse: false,
            body: 'earth',
            label: 'Map focus',
          });
        } else if (global.SNGlobe?.flyNear) {
          global.SNGlobe.flyNear(la, lo, 'national');
        }
        global._snLastPos = { lat: la, lng: lo };
        global.SNTasks?.setPos?.(la, lo);
        global.SNCli?.log?.(
          'NATIONAL · ' + la.toFixed(3) + ', ' + lo.toFixed(3),
          'ok'
        );
      } catch (err) {
        global.SNCli?.log?.('Map fly failed · ' + (err.message || err), 'err');
      }
    });
  }

  function markMarkerHit() {
    M._markerHit = true;
    setTimeout(() => {
      M._markerHit = false;
    }, 400);
  }

  function clearGroup(arr) {
    arr.forEach((m) => {
      try {
        M.map.removeLayer(m);
      } catch (_) {}
    });
    arr.length = 0;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function avatarIcon(url, color) {
    const c = color || '#3d9eff';
    const u = url || '';
    return L.divIcon({
      className: 'sn-pin',
      html:
        '<div class="sn-pin-inner" style="border-color:' +
        c +
        ';box-shadow:0 0 12px ' +
        c +
        '66">' +
        (u ? '<img src="' + escapeHtml(u) + '" alt="" />' : '<span>·</span>') +
        '</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  function showTasks() {
    if (!M.map) return;
    clearGroup(M.markers);
    const tasks = global.SNTasks?.list?.() || [];
    tasks.forEach((t) => {
      if (t.lat == null) return;
      const color = (global.SNTasks?.KINDS?.[t.kind] || {}).color;
      const hex =
        typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : '#6dffb0';
      const m = L.circleMarker([t.lat, t.lng], {
        radius: 7,
        color: hex,
        fillColor: hex,
        fillOpacity: 0.85,
        weight: 1,
      })
        .addTo(M.map)
        .bindPopup(
          '<b>' +
            escapeHtml(t.title) +
            '</b><br/>' +
            t.kind +
            ' · ' +
            t.dur +
            '<br/><button type="button" class="sn-pop-btn" data-task="' +
            escapeHtml(t.id) +
            '">Claim</button>'
        );
      m.on('click', (e) => {
        markMarkerHit();
        try {
          L.DomEvent.stopPropagation(e);
          if (e.originalEvent) L.DomEvent.stop(e.originalEvent);
        } catch (_) {}
      });
      m.on('popupopen', () => {
        document.querySelectorAll('[data-task="' + t.id + '"]').forEach((btn) => {
          btn.onclick = (ev) => {
            ev?.stopPropagation?.();
            const r = global.SNTasks?.claim?.(t.id);
            if (r?.ok) global.SNCli?.log?.('Claimed · ' + r.task.title, 'ok');
          };
        });
      });
      M.markers.push(m);
    });
  }

  function roleBadge(p) {
    const r = p.roles || {};
    const bits = [];
    if (r.vendor) bits.push('🏪');
    if (r.driver) bits.push(p.driverOnline ? '🛵🟢' : '🛵');
    if (r.worker) bits.push('🧰');
    if (r.dating) bits.push('💕');
    if (r.client) bits.push('👤');
    return bits.join(' ') || '·';
  }

  function hoursLine(p) {
    const h = p.hours || p.opening_hours || '';
    if (!h) return 'Hours · SpaceNet 24/7';
    return 'Hours · ' + String(h).slice(0, 48);
  }

  function showProfiles() {
    if (!M.map) return;
    clearGroup(M.profileMarkers);
    const Prof = global.SNProfiles;
    if (!Prof) return;
    const list = Prof.list() || [];
    list.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const color = Prof.pinColor(p);
      const m = L.marker([p.lat, p.lng], {
        icon: avatarIcon(p.avatar, color),
        title: (p.shopName || p.name || 'Tile') + ' ' + roleBadge(p),
        riseOnHover: true,
        keyboard: true,
      }).addTo(M.map);
      const menuN = (p.menu && p.menu.length) || 0;
      m.bindPopup(
        '<b>' +
          escapeHtml(p.shopName || p.name) +
          '</b> ' +
          roleBadge(p) +
          '<br/>' +
          escapeHtml(hoursLine(p)) +
          (menuN ? '<br/>Menu · ' + menuN + ' items' : '') +
          (p.driverOnline ? '<br/>Driver ONLINE' : '') +
          (p.roles?.worker ? '<br/>Worker available' : '') +
          (p.roles?.dating ? '<br/>Dating open' : '') +
          '<br/><small>Tap pin again or Close → open full tile</small>'
      );
      m.on('click', (e) => {
        markMarkerHit();
        try {
          L.DomEvent.stopPropagation(e);
          if (e.originalEvent) {
            L.DomEvent.preventDefault(e.originalEvent);
            L.DomEvent.stop(e.originalEvent);
          }
        } catch (_) {}
        try {
          const full = global.SNProfiles?.get?.(p.id) || p;
          const tab = full.roles?.vendor
            ? 'menu'
            : full.roles?.dating
              ? 'dating'
              : full.roles?.driver
                ? 'drive'
                : 'about';
          global.SNTile?.open?.(full, { tab: tab });
        } catch (err) {
          global.SNCli?.log?.('Tile open failed · ' + (err.message || err), 'err');
        }
      });
      M.profileMarkers.push(m);
    });
  }

  async function open(lat, lng) {
    const map = await ensure();
    const p = {
      lat: lat != null ? lat : global.SNTasks?.pos?.lat || 36.43,
      lng: lng != null ? lng : global.SNTasks?.pos?.lng || 28.22,
    };
    const wrap = document.getElementById('city-map');
    const globe = document.getElementById('globe');
    if (wrap) {
      wrap.classList.add('active');
      wrap.setAttribute('aria-hidden', 'false');
    }
    if (globe) globe.classList.add('city-hidden');
    document.body.classList.add('city-map-on');
    M.active = true;
    map.setView([p.lat, p.lng], 15);
    setTimeout(() => map.invalidateSize(), 80);

    // Surface basemap: keep user choice, else bright/dark from local day-night
    if (!hasUserLayerPref()) {
      setBasemap(suggestBasemapFromDayNight(p.lat, p.lng), { log: false });
    } else if (!M.basemapLayer) {
      setBasemap(M.basemapId || 'dark', { log: false });
    }

    try {
      global.SNCli?.log?.(
        'SPACENET surface · Leaflet · ' +
          (BASEMAPS[M.basemapId]?.label || M.basemapId) +
          ' · ☀️ bright · 🌑 dark · 🛰 sat (top-right)',
        'dim'
      );
    } catch (_) {}

    // Real sector only — DB + edge + Overpass + crawl (SPECS: zero dummy)
    try {
      if (global.SNCommerce?.ensureSector) {
        await global.SNCommerce.ensureSector(p.lat, p.lng, { openMap: true });
      } else {
        await global.SNCommerce?.populateMap?.(p.lat, p.lng, { openMap: true });
      }
    } catch (e) {
      global.SNCli?.log?.('Sector load · ' + (e.message || e), 'err');
    }

    showTasks();
    showProfiles();

    if (!M._me) {
      M._me = L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: '#ffffff',
        fillColor: '#3d9eff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      M._me.on('click', (e) => {
        markMarkerHit();
        try {
          L.DomEvent.stopPropagation(e);
          if (e.originalEvent) L.DomEvent.stop(e.originalEvent);
        } catch (_) {}
        global.SNTile?.openMe?.();
      });
    } else {
      M._me.setLatLng([p.lat, p.lng]);
    }

    // City briefing — vendors · workers · drivers · dating (real tiles only)
    try {
      const Prof = global.SNProfiles;
      const all = (Prof?.list?.() || []).filter((x) => x.lat != null);
      const nV = all.filter((x) => x.roles?.vendor).length;
      const nD = all.filter((x) => x.roles?.driver).length;
      const nW = all.filter((x) => x.roles?.worker).length;
      const nDate = all.filter((x) => x.roles?.dating).length;
      const nTask = (global.SNTasks?.list?.() || []).length;
      global.SNCli?.log?.(
        'CITY · 🏪' +
          nV +
          ' vendors · 🛵' +
          nD +
          ' drivers · 🧰' +
          nW +
          ' workers · 💕' +
          nDate +
          ' dating · tasks ' +
          nTask,
        nV || nD || nW || nDate ? 'ok' : 'dim'
      );
      global.SNCli?.log?.(
        'Tap pin → tile (menu · hours · roles) · pizza · job barman · date coffee · long-press create',
        'dim'
      );
      global.SNCli?.preview?.(
        nV || nD ? nV + ' shops · ' + nD + ' drivers' : 'City · pizza · barman · date'
      );
    } catch (_) {
      global.SNCli?.log?.(
        'City · short-tap pin = open · long-press empty = create · live crawl shops',
        'ok'
      );
      global.SNCli?.preview?.('Tap pin · long-press create · 🌍 Earth');
    }
    return true;
  }

  function close() {
    if (!M.active && !document.body.classList.contains('city-map-on')) {
      // already closed — avoid recursion with SNGlobe.goToTier → close
      if (document.getElementById('globe')) {
        document.getElementById('globe').classList.remove('city-hidden');
      }
      return;
    }
    const wrap = document.getElementById('city-map');
    const globe = document.getElementById('globe');
    if (wrap) {
      wrap.classList.remove('active');
      wrap.setAttribute('aria-hidden', 'true');
    }
    if (globe) globe.classList.remove('city-hidden');
    document.body.classList.remove('city-map-on');
    M.active = false;
    try {
      global.SNTile?.close?.();
    } catch (_) {}
    global.SNCli?.preview?.('Earth · type a command');
  }

  function toggle() {
    if (M.active) close();
    else return open();
  }

  function plotCrawl(places) {
    if (!places?.length) return;
    const Prof = global.SNProfiles;
    const pos = global.SNTasks?.pos || global._snLastPos;
    places.forEach((pl) => {
      if (Prof?.fromCrawlPlace) {
        Prof.fromCrawlPlace(pl, pos);
      }
    });
    if (M.map) {
      showProfiles();
      // also light markers for raw places without profiles
      places.forEach((p) => {
        if (p.lat == null || p.lng == null) return;
        const m = L.circleMarker([p.lat, p.lng], {
          radius: 6,
          color: '#ffcc66',
          fillColor: '#ffaa33',
          fillOpacity: 0.75,
          weight: 1,
        })
          .addTo(M.map)
          .on('click', (e) => {
            markMarkerHit();
            try {
              L.DomEvent.stopPropagation(e);
            } catch (_) {}
            const id =
              'poi_' +
              String(p.name || 'x')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .slice(0, 24);
            const prof = Prof?.get?.(id) || Prof?.fromCrawlPlace?.(p, pos);
            if (prof) global.SNTile?.open?.(prof);
          });
        M.markers.push(m);
      });
    }
  }

  function init() {
    document.getElementById('btn-city')?.addEventListener('click', () => {
      void toggle().catch((e) => global.SNCli?.log?.(String(e.message || e), 'err'));
    });
    document.getElementById('btn-city-close')?.addEventListener('click', () => {
      backToGlobe();
    });
  }

  global.SNMap = {
    init,
    open,
    close,
    toggle,
    backToGlobe,
    showTasks,
    showProfiles,
    plotCrawl,
    ensure,
    setBasemap,
    getBasemap: function () {
      return M.basemapId;
    },
    BASEMAPS,
    get active() {
      return M.active;
    },
  };
})(window);
