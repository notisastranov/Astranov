/**
 * SNMarina — marina berth parking overlay (SPECS / yacht captain path)
 *
 * When city map is zoomed into a marina footprint:
 *   · Overlay grid of berth cells (not full-screen UI)
 *   · Each cell: code · length · price Æ/night · free|held|occupied
 * Vendor (marina owner) can edit price + availability on tap.
 * Captains tap free berths → parking offer on poly-scheduler path.
 *
 * window.SNMarina
 */
(function (global) {
  'use strict';

  var M = {
    layer: null,
    activeId: null,
    vendorMode: false,
    editEl: null,
    marinas: Object.create(null),
    bound: false,
  };

  function log(msg, cls) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, cls || 'ok');
    } catch (_) {}
  }
  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(String(m || '').slice(0, 48));
    } catch (_) {}
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  /** Seed demo marinas near common Mediterranean bases (vendor can overwrite via setBerths) */
  function seedDefaults() {
    if (Object.keys(M.marinas).length) return;
    // Rhodes Mandraki-ish
    registerMarina({
      id: 'marina-rhodes-mandraki',
      name: 'Mandraki Marina',
      lat: 36.4502,
      lng: 28.2241,
      radiusM: 180,
      rows: 4,
      cols: 6,
      bearing: 35,
      cellM: 14,
      vendorId: 'vendor-mandraki',
      basePrice: 45,
    });
    // Athens Flisvos-ish
    registerMarina({
      id: 'marina-athens-flisvos',
      name: 'Flisvos Marina',
      lat: 37.9335,
      lng: 23.6865,
      radiusM: 220,
      rows: 5,
      cols: 8,
      bearing: 10,
      cellM: 16,
      vendorId: 'vendor-flisvos',
      basePrice: 80,
    });
    // Monaco-ish
    registerMarina({
      id: 'marina-monaco',
      name: 'Port Hercule',
      lat: 43.735,
      lng: 7.4245,
      radiusM: 260,
      rows: 5,
      cols: 10,
      bearing: 0,
      cellM: 18,
      vendorId: 'vendor-hercule',
      basePrice: 220,
    });
  }

  function metersToLat(m) {
    return m / 111320;
  }
  function metersToLng(m, lat) {
    return m / (111320 * Math.cos((lat * Math.PI) / 180));
  }

  function hash01(s) {
    var h = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  function buildBerths(marina) {
    var berths = [];
    var rows = marina.rows || 4;
    var cols = marina.cols || 6;
    var cell = marina.cellM || 14;
    var bearing = ((marina.bearing || 0) * Math.PI) / 180;
    var cos = Math.cos(bearing);
    var sin = Math.sin(bearing);
    var rowLetters = 'ABCDEFGHJKLMNPQRST';
    var halfW = ((cols - 1) * cell) / 2;
    var halfH = ((rows - 1) * cell) / 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var lx = c * cell - halfW;
        var ly = r * cell - halfH;
        // rotate local grid
        var east = lx * cos - ly * sin;
        var north = lx * sin + ly * cos;
        var lat = marina.lat + metersToLat(north);
        var lng = marina.lng + metersToLng(east, marina.lat);
        var code = rowLetters[r] + String(c + 1).padStart(2, '0');
        var id = marina.id + ':' + code;
        var h = hash01(id);
        // Mix of free / held / occupied
        var status = h < 0.55 ? 'free' : h < 0.72 ? 'held' : h < 0.95 ? 'occupied' : 'maintenance';
        // Larger berths more expensive
        var lengthM = Math.round(10 + (c % 4) * 4 + (r % 2) * 2);
        var price =
          Math.round(
            (marina.basePrice || 50) *
              (1 + lengthM / 40) *
              (1 + (c > cols / 2 ? 0.15 : 0)) *
              2
          ) / 2;
        // Night premium already in base; round to 0.5
        berths.push({
          id: id,
          code: code,
          lat: lat,
          lng: lng,
          lengthM: lengthM,
          draftM: Math.round((2.2 + (lengthM - 10) * 0.08) * 10) / 10,
          status: status,
          priceNight: price,
          amenities: lengthM >= 18 ? ['power', 'water', 'wifi'] : ['power', 'water'],
          updatedAt: Date.now(),
        });
      }
    }
    return berths;
  }

  function registerMarina(opts) {
    opts = opts || {};
    if (!opts.id || opts.lat == null || opts.lng == null) return null;
    var m = {
      id: String(opts.id),
      name: opts.name || 'Marina',
      lat: Number(opts.lat),
      lng: Number(opts.lng),
      radiusM: Number(opts.radiusM) || 200,
      rows: Number(opts.rows) || 4,
      cols: Number(opts.cols) || 6,
      bearing: Number(opts.bearing) || 0,
      cellM: Number(opts.cellM) || 14,
      vendorId: opts.vendorId || null,
      basePrice: Number(opts.basePrice) || 50,
      berths: null,
    };
    if (opts.berths && opts.berths.length) m.berths = opts.berths.slice();
    else m.berths = buildBerths(m);
    M.marinas[m.id] = m;
    persistOne(m);
    return m;
  }

  function storageKey(id) {
    return 'sn:marina:berths:' + id;
  }

  function persistOne(marina) {
    try {
      localStorage.setItem(
        storageKey(marina.id),
        JSON.stringify({
          id: marina.id,
          name: marina.name,
          lat: marina.lat,
          lng: marina.lng,
          radiusM: marina.radiusM,
          vendorId: marina.vendorId,
          berths: marina.berths,
          updatedAt: Date.now(),
        })
      );
    } catch (_) {}
  }

  function loadPersisted(id) {
    try {
      var raw = localStorage.getItem(storageKey(id));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function hydrate() {
    seedDefaults();
    Object.keys(M.marinas).forEach(function (id) {
      var saved = loadPersisted(id);
      if (saved && saved.berths && saved.berths.length) {
        M.marinas[id].berths = saved.berths;
        if (saved.name) M.marinas[id].name = saved.name;
      }
    });
  }

  function distM(aLat, aLng, bLat, bLng) {
    var R = 6371000;
    var dLat = ((bLat - aLat) * Math.PI) / 180;
    var dLng = ((bLng - aLng) * Math.PI) / 180;
    var x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((aLat * Math.PI) / 180) *
        Math.cos((bLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  function nearestMarina(lat, lng, maxM) {
    maxM = maxM || 450;
    var best = null;
    var bestD = maxM;
    Object.keys(M.marinas).forEach(function (id) {
      var m = M.marinas[id];
      var d = distM(lat, lng, m.lat, m.lng);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    });
    return best;
  }

  function leaflet() {
    return global.L || global.leaflet || null;
  }

  function mapApi() {
    return global.SNMap || null;
  }

  function getMap() {
    var api = mapApi();
    if (api && api.getMap) return api.getMap();
    if (api && api.map) return api.map;
    // internal fallback
    try {
      if (api && api._map) return api._map;
    } catch (_) {}
    return null;
  }

  function ensureLayer(map) {
    var L = leaflet();
    if (!L || !map) return null;
    if (M.layer && map.hasLayer && map.hasLayer(M.layer)) return M.layer;
    if (M.layer) {
      try {
        map.removeLayer(M.layer);
      } catch (_) {}
    }
    M.layer = L.layerGroup().addTo(map);
    return M.layer;
  }

  function statusColor(st) {
    if (st === 'free') return { fill: '#1ad49a', stroke: '#8fffd4', text: '#0a2e22' };
    if (st === 'held') return { fill: '#e6b84d', stroke: '#ffe09a', text: '#2a1e00' };
    if (st === 'occupied') return { fill: '#3a5a8a', stroke: '#7a9acc', text: '#d8e8ff' };
    return { fill: '#5a3a4a', stroke: '#a08090', text: '#f0d8e0' };
  }

  function clearLayer() {
    if (M.layer) {
      try {
        M.layer.clearLayers();
      } catch (_) {}
    }
    M.activeId = null;
  }

  function berthIcon(berth) {
    var L = leaflet();
    if (!L) return null;
    var col = statusColor(berth.status);
    var price = berth.status === 'free' || berth.status === 'held' ? Math.round(berth.priceNight) + 'Æ' : berth.status === 'occupied' ? 'FULL' : '—';
    var html =
      '<div class="sn-berth-cell" data-status="' +
      esc(berth.status) +
      '" style="--fill:' +
      col.fill +
      ';--stroke:' +
      col.stroke +
      ';--fg:' +
      col.text +
      '">' +
      '<b>' +
      esc(berth.code) +
      '</b>' +
      '<i>' +
      esc(price) +
      '</i>' +
      '<em>' +
      esc(berth.lengthM + 'm') +
      '</em></div>';
    return L.divIcon({
      className: 'sn-berth-icon',
      html: html,
      iconSize: [52, 44],
      iconAnchor: [26, 22],
    });
  }

  function ensureCss() {
    if (document.getElementById('sn-marina-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-marina-css';
    st.textContent = [
      '.sn-berth-icon{background:transparent!important;border:0!important}',
      '.sn-berth-cell{width:50px;height:42px;border-radius:12px;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;gap:1px;pointer-events:auto;cursor:pointer;',
      'background:var(--fill);border:1.5px solid var(--stroke);color:var(--fg);',
      'box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 10px rgba(40,140,255,.25);',
      'font-family:system-ui,sans-serif;line-height:1.05;user-select:none}',
      '.sn-berth-cell b{font:800 10px/1 system-ui;letter-spacing:.04em}',
      '.sn-berth-cell i{font:800 11px/1 ui-monospace,Menlo,monospace;font-style:normal}',
      '.sn-berth-cell em{font:600 8px/1 system-ui;font-style:normal;opacity:.85}',
      '.sn-berth-cell[data-status=free]{animation:snBerthPulse 2.4s ease-in-out infinite}',
      '@keyframes snBerthPulse{0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 8px rgba(0,220,160,.35)}50%{box-shadow:0 4px 18px rgba(0,0,0,.5),0 0 16px rgba(0,255,180,.55)}}',
      '#sn-marina-banner{position:fixed;left:50%;top:56px;transform:translateX(-50%);z-index:108;',
      'pointer-events:auto;max-width:min(94vw,340px);padding:8px 14px;border-radius:999px;',
      'background:linear-gradient(165deg,rgba(2,18,52,.94),rgba(0,10,32,.96));',
      'border:1.5px solid rgba(50,150,255,.65);color:#eaf4ff;',
      'box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 18px rgba(30,120,255,.35);',
      'font:700 11px/1.3 system-ui;display:none;align-items:center;gap:10px;white-space:nowrap}',
      '#sn-marina-banner.show{display:flex}',
      '#sn-marina-banner .nm{color:#7ec8ff;text-shadow:0 0 10px rgba(60,160,255,.7)}',
      '#sn-marina-banner .meta{color:#9ec4ee;font-weight:600;font-size:10px}',
      '#sn-marina-banner button{border:0;border-radius:999px;padding:6px 10px;font:700 10px system-ui;',
      'cursor:pointer;background:rgba(20,80,160,.55);color:#cfe6ff}',
      '#sn-marina-banner button.vend{background:rgba(0,120,90,.5);color:#9fffe0;border:1px solid rgba(0,220,160,.45)}',
      '#sn-marina-banner button.vend.on{box-shadow:0 0 12px rgba(0,220,160,.45)}',
      '#sn-marina-edit{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:120;',
      'width:min(92vw,320px);border-radius:22px;padding:14px 16px;display:none;',
      'background:linear-gradient(165deg,rgba(2,18,52,.97),rgba(0,10,32,.98));',
      'border:1.5px solid rgba(50,150,255,.7);color:#eaf4ff;',
      'box-shadow:0 12px 32px rgba(0,0,0,.5);font:600 12px/1.35 system-ui}',
      '#sn-marina-edit.show{display:block}',
      '#sn-marina-edit h4{margin:0 0 8px;font:800 13px system-ui;color:#7ec8ff;letter-spacing:.06em}',
      '#sn-marina-edit label{display:block;font:700 9px system-ui;letter-spacing:.1em;text-transform:uppercase;color:#6a94c4;margin:8px 0 4px}',
      '#sn-marina-edit input,#sn-marina-edit select{width:100%;border-radius:12px;border:1px solid rgba(80,160,255,.4);',
      'background:rgba(8,28,64,.75);color:#eaf4ff;padding:10px 12px;font:600 13px system-ui}',
      '#sn-marina-edit .row{display:flex;gap:8px;margin-top:12px}',
      '#sn-marina-edit .row button{flex:1;min-height:40px;border-radius:999px;border:1px solid rgba(80,160,255,.45);',
      'background:rgba(10,40,90,.5);color:#b8d8ff;font:700 12px system-ui;cursor:pointer}',
      '#sn-marina-edit .row button.ok{border-color:rgba(0,230,160,.65);background:rgba(0,100,70,.45);color:#8fffd4}',
      '#sn-marina-legend{position:fixed;left:10px;bottom:108px;z-index:107;display:none;flex-direction:column;gap:4px;',
      'padding:8px 10px;border-radius:16px;background:rgba(2,14,40,.88);border:1px solid rgba(50,140,255,.4);',
      'font:700 9px/1.2 system-ui;color:#a8d0ff;pointer-events:none}',
      '#sn-marina-legend.show{display:flex}',
      '#sn-marina-legend span{display:flex;align-items:center;gap:6px}',
      '#sn-marina-legend i{width:10px;height:10px;border-radius:4px;display:inline-block}',
    ].join('');
    document.head.appendChild(st);
  }

  function bannerEl() {
    var el = document.getElementById('sn-marina-banner');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-marina-banner';
    el.innerHTML =
      '<span class="nm" id="sn-marina-b-name">Marina</span>' +
      '<span class="meta" id="sn-marina-b-meta"></span>' +
      '<button type="button" id="sn-marina-b-vend" class="vend" title="Vendor edit mode">Vendor</button>' +
      '<button type="button" id="sn-marina-b-close" title="Hide berths">×</button>';
    document.body.appendChild(el);
    el.querySelector('#sn-marina-b-close').onclick = function () {
      hideOverlay(true);
    };
    el.querySelector('#sn-marina-b-vend').onclick = function () {
      setVendorMode(!M.vendorMode);
    };
    return el;
  }

  function legendEl() {
    var el = document.getElementById('sn-marina-legend');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-marina-legend';
    el.innerHTML =
      '<span><i style="background:#1ad49a"></i> Free · price</span>' +
      '<span><i style="background:#e6b84d"></i> Held</span>' +
      '<span><i style="background:#3a5a8a"></i> Occupied</span>' +
      '<span><i style="background:#5a3a4a"></i> Maintenance</span>';
    document.body.appendChild(el);
    return el;
  }

  function editEl() {
    var el = document.getElementById('sn-marina-edit');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-marina-edit';
    el.innerHTML =
      '<h4 id="sn-marina-e-title">Berth</h4>' +
      '<label>Status</label><select id="sn-marina-e-status">' +
      '<option value="free">Free</option><option value="held">Held</option>' +
      '<option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select>' +
      '<label>Price · Æ / night</label><input id="sn-marina-e-price" type="number" min="1" step="0.5" />' +
      '<label>Length m</label><input id="sn-marina-e-len" type="number" min="5" step="0.5" />' +
      '<div class="row"><button type="button" id="sn-marina-e-cancel">Cancel</button>' +
      '<button type="button" class="ok" id="sn-marina-e-save">Save berth</button></div>';
    document.body.appendChild(el);
    el.querySelector('#sn-marina-e-cancel').onclick = function () {
      el.classList.remove('show');
      M._editBerth = null;
    };
    el.querySelector('#sn-marina-e-save').onclick = function () {
      saveEdit();
    };
    return el;
  }

  function setVendorMode(on) {
    M.vendorMode = !!on;
    var b = document.getElementById('sn-marina-b-vend');
    if (b) b.classList.toggle('on', M.vendorMode);
    log(M.vendorMode ? 'Marina vendor mode · tap berth to set price/status' : 'Captain view · tap free berth to book', 'ok');
    preview(M.vendorMode ? 'vendor edit' : 'captain view');
  }

  function freeCount(marina) {
    var n = 0;
    (marina.berths || []).forEach(function (b) {
      if (b.status === 'free') n++;
    });
    return n;
  }

  function showOverlay(marina) {
    ensureCss();
    var map = getMap();
    var L = leaflet();
    if (!map || !L || !marina) return false;
    var layer = ensureLayer(map);
    if (!layer) return false;
    layer.clearLayers();
    M.activeId = marina.id;

    // Footprint ring
    try {
      L.circle([marina.lat, marina.lng], {
        radius: marina.radiusM || 200,
        color: 'rgba(61,158,255,0.7)',
        weight: 1.5,
        fillColor: 'rgba(20,80,180,0.12)',
        fillOpacity: 0.35,
        interactive: false,
      }).addTo(layer);
    } catch (_) {}

    (marina.berths || []).forEach(function (berth) {
      var icon = berthIcon(berth);
      if (!icon) return;
      var mk = L.marker([berth.lat, berth.lng], {
        icon: icon,
        interactive: true,
        keyboard: false,
        zIndexOffset: 400,
      });
      mk.on('click', function (e) {
        if (e && e.originalEvent) {
          try {
            L.DomEvent.stopPropagation(e);
          } catch (_) {}
        }
        onBerthTap(marina, berth);
      });
      mk.addTo(layer);
    });

    var ban = bannerEl();
    ban.classList.add('show');
    var free = freeCount(marina);
    ban.querySelector('#sn-marina-b-name').textContent = marina.name;
    ban.querySelector('#sn-marina-b-meta').textContent =
      free + ' free · ' + (marina.berths || []).length + ' berths · Æ/night on cells';
    legendEl().classList.add('show');
    return true;
  }

  function hideOverlay(soft) {
    clearLayer();
    var ban = document.getElementById('sn-marina-banner');
    if (ban) ban.classList.remove('show');
    var leg = document.getElementById('sn-marina-legend');
    if (leg) leg.classList.remove('show');
    var ed = document.getElementById('sn-marina-edit');
    if (ed) ed.classList.remove('show');
    if (!soft) M.vendorMode = false;
  }

  function onBerthTap(marina, berth) {
    if (M.vendorMode) {
      openEdit(marina, berth);
      return;
    }
    if (berth.status === 'free') {
      bookBerth(marina, berth);
    } else if (berth.status === 'held') {
      log(berth.code + ' held · wait or pick another free berth', 'dim');
    } else {
      log(berth.code + ' · ' + berth.status + ' · not bookable', 'dim');
    }
  }

  function openEdit(marina, berth) {
    var el = editEl();
    M._editMarina = marina;
    M._editBerth = berth;
    el.querySelector('#sn-marina-e-title').textContent = marina.name + ' · ' + berth.code;
    el.querySelector('#sn-marina-e-status').value = berth.status;
    el.querySelector('#sn-marina-e-price').value = berth.priceNight;
    el.querySelector('#sn-marina-e-len').value = berth.lengthM;
    el.classList.add('show');
  }

  function saveEdit() {
    var marina = M._editMarina;
    var berth = M._editBerth;
    if (!marina || !berth) return;
    var el = editEl();
    berth.status = el.querySelector('#sn-marina-e-status').value;
    berth.priceNight = Math.max(1, Number(el.querySelector('#sn-marina-e-price').value) || berth.priceNight);
    berth.lengthM = Math.max(5, Number(el.querySelector('#sn-marina-e-len').value) || berth.lengthM);
    berth.updatedAt = Date.now();
    // write back into marina list
    marina.berths = (marina.berths || []).map(function (b) {
      return b.id === berth.id ? berth : b;
    });
    persistOne(marina);
    el.classList.remove('show');
    showOverlay(marina);
    log('Vendor updated · ' + berth.code + ' · ' + berth.status + ' · ' + berth.priceNight + ' Æ/night', 'ok');
    preview(berth.code + ' saved');
  }

  function bookBerth(marina, berth) {
    // Hold briefly then push parking offer
    berth.status = 'held';
    berth.updatedAt = Date.now();
    persistOne(marina);
    showOverlay(marina);
    log(
      'Berth ' + berth.code + ' · ' + berth.lengthM + 'm · ' + berth.priceNight + ' Æ/night · parking offer',
      'ok'
    );
    preview(berth.code + ' ' + berth.priceNight + 'Æ');

    // Use poly-scheduler if present
    try {
      if (global.SNPolyScheduler && SNPolyScheduler.pushOffer && SNPolyScheduler.makeOffer) {
        var o = SNPolyScheduler.makeOffer({
          vendorName: marina.name,
          clientName: 'Your yacht',
          nature: 'marina berth parking',
          product: 'berth ' + berth.code,
          km: 0.4,
          vLat: marina.lat,
          vLng: marina.lng,
          dLat: berth.lat,
          dLng: berth.lng,
          private: false,
          night: false,
        });
        // Override price to berth nightly rate (not road km model for parking)
        o.price = berth.priceNight;
        o.priceTxt = Math.round(berth.priceNight) + ' € / Æ';
        o.title = 'Berth ' + berth.code + ' · ' + berth.lengthM + 'm';
        o.meta = marina.name + ' parking · 1 night';
        o.quote = Object.assign({}, o.quote || {}, {
          total: berth.priceNight,
          metaLine: berth.code + ' · ' + berth.lengthM + 'm · 1 night',
          nature: { id: 'berth', label: 'Marina berth', emoji: '⚓', private: false, maxParallel: 1 },
        });
        o.priceTxt = o.quote.metaLine ? Math.round(berth.priceNight) + ' € / Æ' : o.priceTxt;
        o.berthId = berth.id;
        o.marinaId = marina.id;
        o.routeLocked = true;
        o.stops = [
          { id: 'v', role: 'vendor', name: marina.name, lat: marina.lat, lng: marina.lng, locked: true },
          { id: 'c', role: 'client', name: 'Berth ' + berth.code, lat: berth.lat, lng: berth.lng, locked: true },
        ];
        SNPolyScheduler.pushOffer(o);
        return;
      }
    } catch (e) {
      try {
        console.warn('[SNMarina] book', e);
      } catch (_) {}
    }
  }

  function refreshFromMap() {
    seedDefaults();
    hydrate();
    var map = getMap();
    if (!map || !map.getCenter) {
      hideOverlay(true);
      return;
    }
    var z = map.getZoom ? map.getZoom() : 0;
    // Need street-level zoom to read berth grid
    if (z < 15.5) {
      if (M.activeId) hideOverlay(true);
      return;
    }
    var c = map.getCenter();
    var marina = nearestMarina(c.lat, c.lng, 500);
    if (!marina) {
      if (M.activeId) hideOverlay(true);
      return;
    }
    // Only show when camera is inside/near footprint
    var d = distM(c.lat, c.lng, marina.lat, marina.lng);
    if (d > (marina.radiusM || 200) * 1.8) {
      if (M.activeId) hideOverlay(true);
      return;
    }
    if (M.activeId !== marina.id) showOverlay(marina);
    else showOverlay(marina); // refresh prices/status
  }

  function bindMap() {
    if (M.bound) return;
    var map = getMap();
    if (!map || !map.on) return;
    M.bound = true;
    map.on('moveend', refreshFromMap);
    map.on('zoomend', refreshFromMap);
    // also when SNMap opens
  }

  function openMarina(idOrName) {
    hydrate();
    var m = null;
    var q = String(idOrName || '').toLowerCase();
    Object.keys(M.marinas).forEach(function (id) {
      var x = M.marinas[id];
      if (id === idOrName || x.name.toLowerCase().indexOf(q) >= 0) m = x;
    });
    if (!m) m = M.marinas['marina-rhodes-mandraki'] || Object.values(M.marinas)[0];
    if (!m) return false;
    try {
      if (global.SNMap && SNMap.open) {
        void Promise.resolve(SNMap.open(m.lat, m.lng, { zoom: 18 })).then(function () {
          setTimeout(function () {
            try {
              if (SNMap.map && SNMap.map.setZoom) SNMap.map.setZoom(18);
              if (SNMap.softSetView) SNMap.softSetView(m.lat, m.lng, 18);
            } catch (_) {}
            bindMap();
            showOverlay(m);
          }, 500);
        });
      } else if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(m.lat, m.lng, { tier: 'city' });
        setTimeout(function () {
          bindMap();
          showOverlay(m);
        }, 800);
      }
    } catch (_) {}
    log('Marina · ' + m.name + ' · berth grid + prices', 'ok');
    return true;
  }

  function updateBerth(marinaId, berthId, patch) {
    var marina = M.marinas[marinaId];
    if (!marina) return false;
    var found = null;
    marina.berths = (marina.berths || []).map(function (b) {
      if (b.id !== berthId && b.code !== berthId) return b;
      found = Object.assign({}, b, patch || {}, { updatedAt: Date.now() });
      return found;
    });
    if (!found) return false;
    persistOne(marina);
    if (M.activeId === marinaId) showOverlay(marina);
    return found;
  }

  async function handleLine(raw) {
    var low = String(raw || '').trim().toLowerCase();
    if (!low) return false;
    if (low === 'marina' || low === 'marinas' || low === 'berths' || low === 'parking marina') {
      openMarina('mandraki');
      return true;
    }
    if (/^marina\s+/.test(low) || /^berths?\s+/.test(low)) {
      openMarina(low.replace(/^(marina|berths?)\s+/, ''));
      return true;
    }
    if (low === 'vendor marina' || low === 'marina vendor' || low === 'edit berths') {
      setVendorMode(true);
      if (!M.activeId) openMarina('mandraki');
      return true;
    }
    if (low === 'captain marina' || low === 'marina captain') {
      setVendorMode(false);
      return true;
    }
    return false;
  }

  function installCli() {
    try {
      if (!global.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli._snMarinaBound === SNCli.run) return;
      var orig = SNCli.run.bind(SNCli);
      SNCli.run = async function (raw) {
        var low = String(raw || '').trim().toLowerCase();
        try {
          if (/^(marina|marinas|berths?|parking marina|vendor marina|marina vendor|edit berths|captain marina|marina captain)\b/i.test(low) || /^marina\s+/i.test(low)) {
            try {
              if (SNCli.beginTurn) SNCli.beginTurn();
            } catch (_) {}
            try {
              if (SNCli.log) SNCli.log(String(raw).trim(), 'cmd');
            } catch (_) {}
            var h = await handleLine(raw);
            try {
              if (SNCli.endTurn) SNCli.endTurn();
            } catch (_) {}
            if (h) return;
          }
        } catch (_) {}
        return orig(raw);
      };
      SNCli._snMarinaBound = SNCli.run;
    } catch (_) {}
  }

  function init() {
    ensureCss();
    hydrate();
    installCli();
    // Bind when map becomes available
    [600, 1500, 3000, 6000].forEach(function (ms) {
      setTimeout(function () {
        installCli();
        try {
          bindMap();
        } catch (_) {}
      }, ms);
    });
    // Hook SNMap.open completion if possible
    try {
      if (global.SNMap && SNMap.open && !SNMap._snMarinaHook) {
        var prev = SNMap.open.bind(SNMap);
        SNMap.open = function () {
          var args = arguments;
          var ret = prev.apply(SNMap, args);
          Promise.resolve(ret)
            .catch(function () {})
            .then(function () {
              setTimeout(function () {
                bindMap();
                refreshFromMap();
              }, 350);
            });
          return ret;
        };
        SNMap._snMarinaHook = true;
      }
    } catch (_) {}
  }

  var api = {
    init: init,
    registerMarina: registerMarina,
    openMarina: openMarina,
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
    refresh: refreshFromMap,
    setVendorMode: setVendorMode,
    updateBerth: updateBerth,
    list: function () {
      return Object.keys(M.marinas).map(function (id) {
        return M.marinas[id];
      });
    },
    get: function (id) {
      return M.marinas[id] || null;
    },
    handleLine: handleLine,
    bookBerth: bookBerth,
  };

  global.SNMarina = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
