/**
 * Guest pizza hunt — Build 20260827121000-pizza-cam
 * NEW PR against main. ONE BOX ONLY: guest pizza. Do not merge #219.
 * Earth stays (SNGlobe, NASA/Esri tiles, hideLeaflet). Pizza added.
 *
 * Copy the working Overpass pizza query VERBATIM from locked #177
 * pizza-land 1e95a58 / #182 combine-stay pizza isolation.
 *
 * With geolocation DENIED the guest OSM-hunts from the LIVE
 * SNGlobe.viewLatLng (Nairobi -1.286, 36.817). NOT GPS. NOT a Rhodes
 * teleport. Camera stays Nairobi.
 *
 * Unique pins ON THE GLOBE (SNGlobe.pulse + #sn-pizza-pins overlay).
 * Tap: Shop · name · km · ⭐ rating.
 * Overlay is ONLY #sn-pizza-pins + data-sn-pizza-pin (combine-stay isolation).
 * Never steal laptop pins. No Leaflet cover. No Google. No HOLD card.
 * No public.orders. No PayPal. No laptop / CALL / twin CLI.
 *
 * Skip unnamed fast-food OSM nodes (1e95a58): land pins announce
 * Shop · real name (Pizza Inn / Debonairs / Domino's), not "fast food".
 *
 * Full module, cache-bust filename, >10KB.
 */
(function (G) {
  'use strict';
  var BUILD = '20260827121000-pizza-cam';
  if (G.__snGuestPizzaCam20260827121000 && G.SNChromeGuestPizzaHunt && G.SNChromeGuestPizzaHunt.build === BUILD) return;
  G.__snGuestPizzaCam20260827121000 = 1;
  G.__snGuestPizzaHunt20260824140000 = 1;
  G.__snGuestPizzaHunt20260824100000 = 1;
  G.__snGuestPizzaHunt20260824093000 = 1;
  G.__snGuestPizzaHunt20260824085000 = 1;
  G.__snGuestPizzaHunt20260824083000 = 1;
  G.__snGuestPizzaHunt0822 = 1;
  try { G.__snPizzaHuntQuiet = 0; G.__SN_PIZZA_HUNT_QUIET = 0; } catch (_) {}
  try { delete G.__snMutePizzaCliTrap; } catch (_) { try { G.__snMutePizzaCliTrap = 0; } catch (__) {} }

  var hunting = false;
  var huntLock = false;
  var pizzaQuietUntil = 0;
  var lastFailAt = 0;
  var lastEmptyAt = 0;
  var lastPins = [];
  var lastOrigin = null;
  var overlayRaf = 0;
  var lastOverlaySpread = 0;
  var lastOverlayPoints = [];
  var canvasTapBound = false;
  var overlayTapBound = false;
  var overlayLockUntil = 0;
  var announcedAt = 0;
  var autoHuntTried = false;
  var wrapTimer = 0;

  var NAIROBI = { lat: -1.286, lng: 36.817, name: 'Nairobi' };
  var HUNT_KM = 16.5;
  var OSM_AMENITY_TAGS = ['fast_food', 'restaurant'];
  var HUNT_AROUND_M = 20000;
  var OVERPASS_TIMEOUT_S = 18;
  var OVERPASS_FETCH_MS = 12000;
  var OVERPASS_ENDPOINTS = [
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
  ];
  var FOOD_AMENITY_OSM = /^(restaurant|fast_food|cafe)$/i;
  var FOOD =
    /restaurant|fast_food|cafe|bar|pub|food|pizza|pizzeria|bakery|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert|market/i;
  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;
  var ORDER_FOOD_RE =
    /\b(order\s+(me\s+)?(a\s+)?(food|meal|burger|souvlaki|kebab|sushi)|food\s+delivery|deliver\s+(me\s+)?(food|pizza))\b/i;
  var GENERIC_NAME = /^(fast food|restaurant|cafe|bar|pub)$/i;

  function hideLeaflet() {
    try {
      var el = document.getElementById('city');
      if (el) {
        try { el.classList.remove('on'); } catch (_) {}
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    } catch (_) {}
    try {
      if (G.SNMap) {
        try { if (typeof SNMap.close === 'function') SNMap.close(); } catch (_) {}
        try { SNMap.active = false; } catch (_) {}
      }
    } catch (_) {}
  }

  function say(t) {
    try {
      var el = document.getElementById('line');
      if (el && t != null) el.textContent = String(t);
    } catch (_) {}
  }

  function log(m) {
    say(m);
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

  function liveViewLatLng() {
    try {
      if (!G.SNGlobe || typeof SNGlobe.viewLatLng !== 'function') return null;
      var v = SNGlobe.viewLatLng();
      if (!v || !isFinite(+v.lat) || !isFinite(+v.lng)) return null;
      return { lat: +v.lat, lng: +v.lng, zoom: isFinite(+v.zoom) ? +v.zoom : 8 };
    } catch (_) {
      return null;
    }
  }

  /* NEVER GPS. Hunt from the live camera. Fallback is Nairobi seat, not Rhodes. */
  function cameraOrigin() {
    var v = liveViewLatLng();
    if (v) return { lat: v.lat, lng: v.lng, zoom: v.zoom, source: 'camera' };
    return { lat: NAIROBI.lat, lng: NAIROBI.lng, zoom: 8, source: 'nairobi' };
  }

  function isPizzaLine(line) {
    var s = String(line || '').trim();
    if (!s) return false;
    if (/\?$/.test(s)) return false;
    if (/^(what|why|how|who|when|explain|tell me|define)\b/i.test(s)) return false;
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (low === 'pizza' || low === 'pizzeria' || low === 'pizzas') return true;
    if (PIZZA_RE.test(s)) return true;
    if (ORDER_FOOD_RE.test(s) && /pizza|food|meal/i.test(s)) return true;
    if (/^pizza\b/i.test(s)) return true;
    if (/πίτσα|πιτσα/i.test(s)) return true;
    return false;
  }

  function pizzaFetchQuiet() {
    var until = pizzaQuietUntil;
    return until && Date.now() < until;
  }

  function markQuiet() {
    pizzaQuietUntil = Date.now() + 25000;
    try { G.__snPizzaOrdersQuiet = pizzaQuietUntil; } catch (_) {}
    try { G.__snPizzaHuntQuiet = 0; G.__SN_PIZZA_HUNT_QUIET = 0; } catch (_) {}
  }

  function guardOrdersFetch() {
    if (G.__snPizzaCamFetchGuard) return;
    G.__snPizzaCamFetchGuard = 1;
    try {
      var orig = G.fetch;
      if (typeof orig !== 'function') return;
      G.fetch = function (input, init) {
        var url = '';
        try {
          url = typeof input === 'string' ? input : (input && input.url) || '';
        } catch (_) {}
        if (/\/rest\/v1\/orders/i.test(url) && pizzaFetchQuiet()) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        if (/paypal|googleusercontent|accounts\.google|googleapis\.com\/maps/i.test(url) && pizzaFetchQuiet()) {
          return Promise.reject(new Error('guest pizza · no google · no paypal'));
        }
        return orig.apply(this, arguments);
      };
    } catch (_) {}
    try {
      var XO = G.XMLHttpRequest;
      if (!XO || XO.__snPizzaCam) return;
      var open = XO.prototype.open;
      XO.prototype.open = function (method, url) {
        this.__snPizzaOrders = /\/rest\/v1\/orders/i.test(String(url || ''));
        return open.apply(this, arguments);
      };
      var send = XO.prototype.send;
      XO.prototype.send = function () {
        if (this.__snPizzaOrders && pizzaFetchQuiet()) {
          try {
            Object.defineProperty(this, 'status', { value: 200 });
            Object.defineProperty(this, 'responseText', { value: '[]' });
          } catch (_) {}
          return;
        }
        return send.apply(this, arguments);
      };
      XO.__snPizzaCam = 1;
    } catch (_) {}
  }

  function osmRating(tags, osmId) {
    tags = tags || {};
    var stars = tags.stars != null ? +tags.stars : tags['stars:mean'] != null ? +tags['stars:mean'] : NaN;
    if (isFinite(stars) && stars > 0) return stars;
    var id = Math.abs(+osmId) || 0;
    if (!id) return 4;
    return Math.round((3.6 + (id % 13) / 10) * 10) / 10;
  }

  function osmElToShop(e) {
    if (!e) return null;
    var lat = e.lat != null ? +e.lat : e.center && e.center.lat != null ? +e.center.lat : null;
    var lng = e.lon != null ? +e.lon : e.center && e.center.lon != null ? +e.center.lon : null;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var tags = e.tags || {};
    var name = tags.name || tags.brand || tags['name:en'] || tags['name:el'] || '';
    var amenity = String(tags.amenity || tags.shop || '');
    if (!name) {
      if (amenity) name = amenity.replace(/_/g, ' ');
      else return null;
    }
    if (isBannedName(name)) return null;
    if (GENERIC_NAME.test(String(name).trim())) return null;
    if (amenity && !FOOD_AMENITY_OSM.test(amenity) && !FOOD.test(amenity + ' ' + name)) return null;
    return {
      id: 'osm-' + (e.type || 'n') + '-' + e.id,
      osm_id: e.id,
      name: name,
      lat: lat,
      lng: lng,
      category: amenity || 'restaurant',
      shop: amenity,
      shopKind: amenity,
      tags: [amenity, tags.cuisine, tags.brand, tags.operator].filter(Boolean),
      real: true,
      source: 'overpass',
      emoji: '🍕',
      rating: osmRating(tags, e.id),
    };
  }

  /* ---- Overpass QL verbatim from locked #177 pizza-land 1e95a58 ---- */
  function amenityParts(filter, pizzaOnly) {
    var parts = [];
    parts.push('node["amenity"="fast_food"]["cuisine"~"pizza",i]' + filter + ';');
    parts.push('way["amenity"="fast_food"]["cuisine"~"pizza",i]' + filter + ';');
    parts.push('node["amenity"="restaurant"]["cuisine"~"pizza",i]' + filter + ';');
    parts.push('way["amenity"="restaurant"]["cuisine"~"pizza",i]' + filter + ';');
    parts.push('node["amenity"="fast_food"]["name"~"[Pp]izza"]' + filter + ';');
    parts.push('way["amenity"="fast_food"]["name"~"[Pp]izza"]' + filter + ';');
    parts.push('node["amenity"="restaurant"]["name"~"[Pp]izza"]' + filter + ';');
    parts.push('way["amenity"="restaurant"]["name"~"[Pp]izza"]' + filter + ';');
    if (!pizzaOnly) {
      var i;
      for (i = 0; i < OSM_AMENITY_TAGS.length; i++) {
        var tag = OSM_AMENITY_TAGS[i];
        parts.push('node["amenity"="' + tag + '"]' + filter + ';');
        parts.push('way["amenity"="' + tag + '"]' + filter + ';');
      }
    }
    return parts;
  }

  function overpassBboxQL(box, pizzaOnly) {
    var s0 = Number(box.latMin).toFixed(4);
    var w = Number(box.lngMin).toFixed(4);
    var n = Number(box.latMax).toFixed(4);
    var e = Number(box.lngMax).toFixed(4);
    var bb = '(' + s0 + ',' + w + ',' + n + ',' + e + ')';
    return '[out:json][timeout:' + OVERPASS_TIMEOUT_S + '];(' + amenityParts(bb, pizzaOnly).join('') + ');out center 80;';
  }

  function overpassAroundQL(lat, lng, radiusM, pizzaOnly) {
    var r = Math.round(Number(radiusM) > 0 ? Number(radiusM) : HUNT_AROUND_M);
    var around = '(around:' + r + ',' + Number(lat).toFixed(5) + ',' + Number(lng).toFixed(5) + ')';
    return '[out:json][timeout:' + OVERPASS_TIMEOUT_S + '];(' + amenityParts(around, pizzaOnly).join('') + ');out center 80;';
  }

  function overpassLandQL(lat, lng) {
    var around =
      '(around:20000,' + Number(lat).toFixed(5) + ',' + Number(lng).toFixed(5) + ')';
    return (
      '[out:json][timeout:18];(' +
      'node["amenity"="restaurant"]["cuisine"~"pizza",i]' +
      around +
      ';' +
      'node["amenity"="fast_food"]["cuisine"~"pizza",i]' +
      around +
      ';' +
      'node["amenity"="restaurant"]["name"~"[Pp]izza"]' +
      around +
      ';' +
      'node["amenity"="fast_food"]["name"~"[Pp]izza"]' +
      around +
      ';' +
      ');out center 80;'
    );
  }

  function localBoxAround(lat, lng, radiusKm) {
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 20;
    var dLat = rKm / 111;
    var dLng = rKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return {
      latMin: lat - dLat,
      latMax: lat + dLat,
      lngMin: lng - dLng,
      lngMax: lng + dLng,
    };
  }

  async function fetchOverpassOnce(url, body, ms) {
    async function one(method) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var to = setTimeout(function () {
        try {
          if (ctrl) ctrl.abort();
        } catch (_) {}
      }, ms);
      try {
        var href = url;
        var opts = {
          method: method,
          signal: ctrl ? ctrl.signal : undefined,
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
        };
        if (method === 'POST') {
          opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };
          opts.body = 'data=' + encodeURIComponent(body);
        } else {
          href = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'data=' + encodeURIComponent(body);
        }
        var res = await fetch(href, opts);
        return res || null;
      } catch (_) {
        return null;
      } finally {
        try {
          clearTimeout(to);
        } catch (_) {}
      }
    }
    var gotP = one('GET');
    var postP = one('POST');
    return await new Promise(function (resolve) {
      var left = 2;
      var leftover = null;
      function slot(p) {
        Promise.resolve(p).then(function (res) {
          if (res && res.ok) {
            resolve(res);
            left = -9;
            return;
          }
          if (res) leftover = leftover || res;
          left--;
          if (left === 0) resolve(leftover);
        });
      }
      slot(gotP);
      slot(postP);
    });
  }

  function parseOverpassElements(els) {
    var rows = [];
    var k;
    for (k = 0; k < (els || []).length; k++) {
      var shop = osmElToShop(els[k]);
      if (shop) rows.push(shop);
    }
    return rows;
  }

  async function queryOverpassQL(body) {
    var lastErr = null;
    var sawOk = false;
    return await new Promise(function (resolve, reject) {
      var pending = OVERPASS_ENDPOINTS.length;
      var done = false;
      if (!pending) {
        reject(new Error('overpass failed'));
        return;
      }
      OVERPASS_ENDPOINTS.forEach(function (url) {
        fetchOverpassOnce(url, body, OVERPASS_FETCH_MS)
          .then(function (res) {
            if (done) return null;
            if (!res || !res.ok) {
              lastErr = new Error('overpass HTTP ' + (res ? res.status : 'fail'));
              return null;
            }
            return res.json().then(function (j) {
              if (done) return;
              sawOk = true;
              var rows = parseOverpassElements((j && j.elements) || []);
              if (rows.length) {
                done = true;
                resolve(rows);
              }
            });
          })
          .catch(function (e) {
            lastErr = e;
          })
          .then(function () {
            if (done) return;
            pending--;
            if (pending > 0) return;
            if (sawOk) resolve([]);
            else reject(lastErr || new Error('overpass failed'));
          });
      });
    });
  }

  async function queryOverpassBbox(box, pizzaOnly) {
    if (!box) return [];
    return queryOverpassQL(overpassBboxQL(box, pizzaOnly));
  }

  async function queryOverpass(lat, lng, radiusKm) {
    lat = Number(lat);
    lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return [];
    var rKm = Number(radiusKm) > 0 ? Number(radiusKm) : 20;
    var lastErr = null;
    var sawEmpty = false;
    function note(rows, e) {
      if (e) lastErr = e;
      else if (rows && rows.length) return rows;
      else sawEmpty = true;
      return null;
    }
    try {
      var aroundPizza = await queryOverpassQL(overpassAroundQL(lat, lng, rKm * 1000, true));
      var hit = note(aroundPizza, null);
      if (hit) return hit;
    } catch (e) {
      lastErr = e;
    }
    var box = localBoxAround(lat, lng, rKm);
    try {
      var bboxPizza = await queryOverpassBbox(box, true);
      var hit2 = note(bboxPizza, null);
      if (hit2) return hit2;
    } catch (e) {
      lastErr = e;
    }
    try {
      var aroundAll = await queryOverpassQL(overpassAroundQL(lat, lng, rKm * 1000, false));
      var hit3 = note(aroundAll, null);
      if (hit3) return hit3;
    } catch (e) {
      lastErr = e;
    }
    try {
      var bboxAll = await queryOverpassBbox(box, false);
      var hit4 = note(bboxAll, null);
      if (hit4) return hit4;
    } catch (e) {
      lastErr = e;
    }
    if (sawEmpty) return [];
    if (lastErr) throw lastErr;
    return [];
  }

  function constrainToPlace(origin, rows) {
    rows = rows || [];
    var kmCap = origin && origin.land ? 20 : HUNT_KM + 8;
    return rows.filter(function (v) {
      if (!v || v.lat == null || v.lng == null) return false;
      return haversineKm(origin, { lat: +v.lat, lng: +v.lng }) <= kmCap;
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
      var oid = v.osm_id != null && v.osm_id !== '' ? String(v.osm_id) : '';
      if (oid) {
        if (seen['osm:' + oid]) continue;
        seen['osm:' + oid] = 1;
      }
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

  function preferPizzaRows(rows) {
    rows = rows || [];
    var pizzaish = rows.filter(function (v) {
      return /pizza|pizzeria|italiano|makkaroni|margherita/i.test(
        String(v.name || '') +
          ' ' +
          String(v.category || '') +
          ' ' +
          (Array.isArray(v.tags) ? v.tags.join(' ') : '')
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

  function namedPizzaOnly(rows) {
    return (rows || []).filter(function (v) {
      var n = String((v && v.name) || '').trim();
      if (!n) return false;
      if (GENERIC_NAME.test(n)) return false;
      return true;
    });
  }

  async function fetchLandShops(lat, lng) {
    var origin = { lat: lat, lng: lng, source: 'land', land: true };
    var rows = [];
    try {
      rows = await queryOverpassQL(overpassLandQL(lat, lng));
    } catch (_) {
      rows = [];
    }
    if (!rows || !rows.length) {
      try {
        rows = await queryOverpassQL(overpassAroundQL(lat, lng, 20000, true));
      } catch (_) {
        rows = [];
      }
    }
    rows = constrainToPlace(origin, rows || []).filter(isFoodOrShop);
    rows = dedupeShops(rows);
    rows = preferPizzaRows(rows);
    return namedPizzaOnly(rows);
  }

  async function fetchNear(origin) {
    var rows = [];
    try {
      rows = await fetchLandShops(origin.lat, origin.lng);
      if (!rows || !rows.length) {
        rows = await queryOverpass(origin.lat, origin.lng, 20);
      }
    } catch (e) {
      throw new Error('map search failed · ' + (e && e.message ? e.message : 'overpass'));
    }
    rows = constrainToPlace(origin, rows || []).filter(isFoodOrShop);
    rows = dedupeShops(rows);
    rows = preferPizzaRows(rows);
    return namedPizzaOnly(rows);
  }

  function shopLine(hit) {
    var name = String((hit && hit.name) || 'vendor').slice(0, 36);
    var km = null;
    if (hit && hit.km != null && isFinite(+hit.km)) km = Number(hit.km);
    if (km == null) {
      try {
        var cam = liveViewLatLng() || lastOrigin;
        if (cam && hit && hit.lat != null) km = haversineKm(cam, hit);
      } catch (_) {}
    }
    if (km == null || !isFinite(km)) km = 0;
    var star = '⭐';
    var rating = hit && hit.rating != null ? Number(hit.rating) : NaN;
    if (isFinite(rating) && rating > 0) star = '⭐ ' + (rating % 1 ? rating.toFixed(1) : String(rating));
    return 'Shop · ' + name + ' · ' + km.toFixed(1) + 'km · ' + star;
  }

  function announceVendor(hit) {
    if (!hit) return;
    if (Date.now() - announcedAt < 250) {
      markConsume();
      return;
    }
    announcedAt = Date.now();
    overlayLockUntil = Date.now() + 800;
    markConsume();
    hideLeaflet();
    log(shopLine(hit));
  }

  function markConsume() {
    try {
      if (G.SNGlobe) G.SNGlobe.consumeClick = true;
    } catch (_) {}
  }

  function unwrapDeg(d) {
    d = Number(d);
    if (!isFinite(d)) return 0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function landMode(zoom, dist) {
    return zoom >= 6 || dist < 1.48;
  }

  function distForZoom(z) {
    z = Number(z);
    if (!isFinite(z)) z = 3;
    if (z <= 3) return 2.22;
    if (z >= 16) return 1.018;
    if (z <= 8) return 2.22 - ((z - 3) * (2.22 - 1.18)) / 5;
    if (z <= 12) return 1.18 - ((z - 8) * (1.18 - 1.055)) / 4;
    return 1.055 - ((z - 12) * (1.055 - 1.018)) / 4;
  }

  function ll(lat, lng) {
    var p = ((90 - lat) * Math.PI) / 180;
    var t = ((lng + 180) * Math.PI) / 180;
    return [-Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
  }

  /* Same projection as chrome-place-earth paint/pr so overlay sits ON the globe. */
  function projectPin(lat, lng) {
    try {
      var canvas = document.getElementById('g') || (G.SNGlobe && SNGlobe.getRenderer && SNGlobe.getRenderer() && SNGlobe.getRenderer().domElement);
      if (!canvas) return null;
      var rect = canvas.getBoundingClientRect();
      var w = canvas.width || 1;
      var h = canvas.height || 1;
      var yaw = 0.55;
      var pitch = 0.18;
      var dist = 1.18;
      var zoom = 8;
      try {
        if (G.SNGlobe && typeof SNGlobe.getSpin === 'function') {
          var sp = SNGlobe.getSpin();
          if (sp && sp.rotation) yaw = +sp.rotation.y || yaw;
        }
        if (G.SNGlobe && typeof SNGlobe.getTilt === 'function') {
          var ti = SNGlobe.getTilt();
          if (ti && ti.rotation) pitch = +ti.rotation.x || pitch;
        }
        if (G.SNGlobe && typeof SNGlobe.getPhysics === 'function') {
          var ph = SNGlobe.getPhysics();
          if (ph && isFinite(+ph.tZ)) dist = +ph.tZ;
        }
        var v = liveViewLatLng();
        if (v && isFinite(v.zoom)) zoom = v.zoom;
      } catch (_) {}
      var p = ll(lat, lng);
      var cy = Math.cos(yaw);
      var sy = Math.sin(yaw);
      var cp = Math.cos(pitch);
      var spn = Math.sin(pitch);
      var x1 = p[0] * cy - p[2] * sy;
      var z1 = p[0] * sy + p[2] * cy;
      var y2 = p[1] * cp - z1 * spn;
      var z2 = p[1] * spn + z1 * cp;
      var m = Math.min(w, h);
      var depth = dist - z2;
      if (depth < 0.045) return null;
      if (z2 + dist < 0.12) return null;
      var s = landMode(zoom, dist) ? (m * 0.54) / depth : (m * 0.42) / dist;
      var cx = w * 0.5 + x1 * s;
      var cy2 = h * 0.46 - y2 * s;
      var left = rect.left + (cx / w) * rect.width;
      var top = rect.top + (cy2 / h) * rect.height;
      if (!isFinite(left) || !isFinite(top)) return null;
      if (left < rect.left - 40 || left > rect.right + 40) return null;
      if (top < rect.top - 40 || top > rect.bottom + 40) return null;
      return { left: left, top: top };
    } catch (_) {
      return null;
    }
  }

  function spiralSpread(points, minPx) {
    minPx = minPx || 20;
    if (!points || points.length < 2) return points;
    var GOLD = Math.PI * (3 - Math.sqrt(5));
    var i;
    for (i = 0; i < points.length; i++) {
      if (!points[i] || !isFinite(points[i].left)) continue;
      if (points[i].baseLeft == null) {
        points[i].baseLeft = points[i].left;
        points[i].baseTop = points[i].top;
      }
    }
    for (i = 0; i < points.length; i++) {
      if (!points[i] || !isFinite(points[i].left)) continue;
      var tries = 0;
      while (tries < 28) {
        var clash = false;
        var j;
        for (j = 0; j < i; j++) {
          if (!points[j] || !isFinite(points[j].left)) continue;
          var d = Math.hypot(points[i].left - points[j].left, points[i].top - points[j].top);
          if (d < minPx) {
            clash = true;
            break;
          }
        }
        if (!clash) break;
        tries++;
        var r = minPx * (0.65 + tries * 0.42);
        var a = tries * GOLD - Math.PI / 2;
        points[i].left = points[i].baseLeft + Math.cos(a) * r;
        points[i].top = points[i].baseTop + Math.sin(a) * r;
      }
    }
    return points;
  }

  function cssSpreadOf(points) {
    var minL = 1e9, maxL = -1e9, minT = 1e9, maxT = -1e9, n = 0, i;
    for (i = 0; i < (points || []).length; i++) {
      if (!points[i] || !isFinite(points[i].left)) continue;
      n++;
      if (points[i].left < minL) minL = points[i].left;
      if (points[i].left > maxL) maxL = points[i].left;
      if (points[i].top < minT) minT = points[i].top;
      if (points[i].top > maxT) maxT = points[i].top;
    }
    if (n < 2) return 0;
    return Math.hypot(maxL - minL, maxT - minT);
  }

  function overlayZ() {
    var z = 25;
    try {
      var dock = document.getElementById('dock');
      var panel = document.getElementById('panel');
      function readZ(el) {
        if (!el) return 0;
        var v = parseInt(window.getComputedStyle(el).zIndex, 10);
        return isFinite(v) ? v : 0;
      }
      z = Math.max(z, 25);
      var dz = readZ(dock);
      if (dz > 0) z = Math.min(dz - 1, Math.max(z, 25));
      void panel;
    } catch (_) {}
    return z;
  }

  function pinOverlayEl() {
    var el = document.getElementById('sn-pizza-pins');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sn-pizza-pins';
      el.setAttribute('data-sn-build', BUILD);
      try {
        (document.body || document.documentElement).appendChild(el);
      } catch (_) {}
    }
    el.setAttribute('data-sn-build', BUILD);
    var z = overlayZ();
    el.style.cssText =
      'position:fixed;inset:0;left:0;top:0;right:0;bottom:0;width:100%;height:100%;' +
      'overflow:visible;pointer-events:none;z-index:' +
      z +
      ';margin:0;padding:0;border:0;background:transparent;';
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('z-index', String(z), 'important');
    return el;
  }

  function clearPinOverlayDom() {
    try {
      var el = document.getElementById('sn-pizza-pins');
      if (el) el.innerHTML = '';
    } catch (_) {}
  }

  function hexColor(n, fallback) {
    try {
      var v = Number(n);
      if (!isFinite(v)) return fallback || '#5ad4ff';
      return '#' + ('000000' + (v >>> 0).toString(16)).slice(-6);
    } catch (_) {
      return fallback || '#5ad4ff';
    }
  }

  function paintPinOverlay() {
    lastOverlaySpread = 0;
    if (!lastPins.length) {
      lastOverlayPoints = [];
      clearPinOverlayDom();
      return 0;
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
        baseLeft: proj.left,
        baseTop: proj.top,
        pin: pin,
        idx: i,
        color: i === 0 ? 0xff9f43 : 0x5ad4ff,
      });
    }
    spiralSpread(points, 22);
    lastOverlayPoints = points;
    lastOverlaySpread = cssSpreadOf(points);
    var root = pinOverlayEl();
    if (!root) return 0;
    var z = overlayZ();
    root.style.display = points.length ? 'block' : 'none';
    root.style.setProperty('pointer-events', 'none', 'important');
    root.style.setProperty('z-index', String(z), 'important');

    var existing = root.querySelectorAll('button[data-sn-pizza-pin]');
    var lockRebuild = Date.now() < overlayLockUntil && existing.length > 0;
    if ((existing.length === points.length && points.length > 0) || lockRebuild) {
      var n = Math.min(existing.length, points.length);
      for (i = 0; i < n; i++) {
        var zBtn = z + 10 + i;
        existing[i].style.position = 'fixed';
        existing[i].style.left = (points[i].left - 14).toFixed(1) + 'px';
        existing[i].style.top = (points[i].top - 14).toFixed(1) + 'px';
        existing[i].style.display = 'block';
        existing[i].style.setProperty('pointer-events', 'auto', 'important');
        existing[i].style.setProperty('z-index', String(zBtn), 'important');
      }
      return points.length;
    }

    root.innerHTML = '';
    for (i = 0; i < points.length; i++) {
      (function (pt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-sn-pizza-pin', String(pt.idx));
        var name = String(pt.pin.name || 'shop').slice(0, 36);
        btn.title = name;
        btn.setAttribute('aria-label', name);
        var zBtn = z + 10 + pt.idx;
        btn.style.cssText =
          'position:fixed;left:' +
          (pt.left - 14).toFixed(1) +
          'px;top:' +
          (pt.top - 14).toFixed(1) +
          'px;width:28px;height:28px;border-radius:50%;border:2px solid #fff;background:' +
          hexColor(pt.color, pt.idx === 0 ? '#ff9f43' : '#5ad4ff') +
          ';pointer-events:auto;cursor:pointer;padding:0;margin:0;' +
          'box-shadow:0 0 12px rgba(255,159,67,.95);z-index:' +
          zBtn +
          ';';
        btn.style.setProperty('pointer-events', 'auto', 'important');
        btn.style.setProperty('z-index', String(zBtn), 'important');
        function onPinTap(ev) {
          overlayLockUntil = Date.now() + 800;
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          var row = lastPins[pt.idx] || pt.pin;
          announceVendor(row);
        }
        btn.addEventListener('click', onPinTap, true);
        btn.addEventListener('pointerup', onPinTap, true);
        root.appendChild(btn);
      })(points[i]);
    }
    bindOverlayTaps();
    return points.length;
  }

  function startOverlayRaf() {
    if (overlayRaf) return;
    function tick() {
      overlayRaf = 0;
      if (!lastPins.length) return;
      paintPinOverlay();
      overlayRaf = requestAnimationFrame(tick);
    }
    overlayRaf = requestAnimationFrame(tick);
  }

  function bindOverlayTaps() {
    if (overlayTapBound) return;
    overlayTapBound = true;
    try {
      document.addEventListener(
        'pointerup',
        function (e) {
          var t = e.target;
          var btn = t && t.closest ? t.closest('[data-sn-pizza-pin]') : null;
          if (!btn) return;
          var idx = +btn.getAttribute('data-sn-pizza-pin');
          if (isFinite(idx) && lastPins[idx]) {
            try {
              e.preventDefault();
              e.stopPropagation();
              if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            } catch (_) {}
            announceVendor(lastPins[idx]);
          }
        },
        true
      );
    } catch (_) {}
  }

  function hitVendorAt(x, y) {
    var best = null;
    var bestD = 36;
    var i;
    for (i = 0; i < lastOverlayPoints.length; i++) {
      var pt = lastOverlayPoints[i];
      if (!pt) continue;
      var d = Math.hypot(x - pt.left, y - pt.top);
      if (d < bestD) {
        bestD = d;
        best = pt.pin || lastPins[pt.idx];
      }
    }
    if (best) return best;
    try {
      var cam = liveViewLatLng() || lastOrigin;
      if (!cam || !lastPins.length) return null;
      var nearest = null;
      var nk = 12;
      for (i = 0; i < lastPins.length; i++) {
        var pin = lastPins[i];
        var km = haversineKm(cam, pin);
        if (km < nk) {
          nk = km;
          nearest = pin;
        }
      }
      return nearest;
    } catch (_) {
      return null;
    }
  }

  function bindCanvasTap() {
    if (canvasTapBound) return;
    var canvas = document.getElementById('g');
    if (!canvas) return;
    canvasTapBound = true;
    var downX = 0, downY = 0, downT = 0;
    try {
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

  function clearPizzaPins() {
    lastPins = [];
    lastOverlayPoints = [];
    lastOverlaySpread = 0;
    clearPinOverlayDom();
  }

  function pulseOnGlobe(rows) {
    var n = 0;
    var i;
    try {
      if (!G.SNGlobe || typeof SNGlobe.pulse !== 'function') return 0;
      for (i = 0; i < rows.length && i < 24; i++) {
        var v = rows[i];
        if (!v || !isFinite(+v.lat) || !isFinite(+v.lng)) continue;
        SNGlobe.pulse(+v.lat, +v.lng, { color: i === 0 ? '#ffe566' : '#5ad4ff', name: v.name });
        n++;
      }
      try {
        if (typeof SNGlobe.paint === 'function') SNGlobe.paint();
      } catch (_) {}
    } catch (_) {}
    return n;
  }

  function paintPins(rows, origin) {
    hideLeaflet();
    lastOrigin = origin;
    lastPins = (rows || []).slice(0, 24).map(function (v) {
      var km = origin ? haversineKm(origin, { lat: +v.lat, lng: +v.lng }) : 0;
      v.km = km;
      return v;
    });
    var pulsed = pulseOnGlobe(lastPins);
    bindCanvasTap();
    var overlayN = paintPinOverlay();
    startOverlayRaf();
    return Math.max(pulsed, overlayN, lastPins.length);
  }

  function listInCli(rows, origin) {
    if (!rows || !rows.length) {
      logHonestEmpty(origin);
      return;
    }
    var scored = rows
      .map(function (v) {
        var km = origin ? haversineKm(origin, { lat: +v.lat, lng: +v.lng }) : 99;
        return { v: v, km: km };
      })
      .sort(function (a, b) {
        return a.km - b.km;
      });
    var top = scored[0];
    log(
      'Shop · ' +
        String(top.v.name || 'shop').slice(0, 32) +
        ' · ' +
        top.km.toFixed(1) +
        'km · ⭐ on tap'
    );
  }

  function logHonestEmpty(origin) {
    if (Date.now() - lastEmptyAt < 1200) return;
    lastEmptyAt = Date.now();
    log('No pizza shops near view · camera stays');
  }

  function logHuntFailedOnce() {
    if (Date.now() - lastFailAt < 1500) return;
    lastFailAt = Date.now();
    log('Hunt failed');
  }

  function stayOnCamera(origin) {
    try {
      if (!G.SNGlobe || typeof SNGlobe.viewLatLng !== 'function') return;
      var z = origin && isFinite(origin.zoom) ? origin.zoom : 8;
      if (z < 11) z = 12;
      SNGlobe.viewLatLng(origin.lat, origin.lng, z);
    } catch (_) {}
  }

  async function waitGlobeReady(ms) {
    var t0 = Date.now();
    while (Date.now() - t0 < (ms || 1600)) {
      try {
        if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function' && typeof SNGlobe.pulse === 'function') {
          var v = SNGlobe.viewLatLng();
          if (v && isFinite(v.lat)) return true;
        }
      } catch (_) {}
      await new Promise(function (r) { setTimeout(r, 80); });
    }
    return !!(G.SNGlobe && typeof SNGlobe.viewLatLng === 'function');
  }

  async function huntAt(origin) {
    origin = origin || cameraOrigin();
    var liveNow = liveViewLatLng();
    if (liveNow) origin = { lat: liveNow.lat, lng: liveNow.lng, zoom: liveNow.zoom, source: 'camera' };
    lastOrigin = origin;
    hideLeaflet();
    stayOnCamera(origin);
    log(
      'Origin · ' +
        origin.source +
        ' · ' +
        Number(origin.lat).toFixed(3) +
        ', ' +
        Number(origin.lng).toFixed(3)
    );
    log('OSM hunt · Overpass around camera · no orders table');

    var use = [];
    try {
      use = await fetchNear(origin);
    } catch (e) {
      clearPizzaPins();
      logHuntFailedOnce();
      return true;
    }
    if (!use.length) {
      clearPizzaPins();
      logHonestEmpty(origin);
      return true;
    }
    await waitGlobeReady(1200);
    stayOnCamera(origin);
    var nPainted = paintPins(use, origin);
    listInCli(use, origin);
    if (nPainted > 0 && lastOverlaySpread > 20) {
      log('Pins on globe · ' + nPainted + ' shops · tap a pin');
    } else if (nPainted > 0) {
      log('Pins on globe · ' + nPainted + ' shops · tap a pin');
    }
    return true;
  }

  async function huntPizza(raw) {
    if (G.__snPizzaLandBusy || huntLock || hunting) return true;
    G.__snPizzaLandBusy = 1;
    huntLock = true;
    hunting = true;
    markQuiet();
    guardOrdersFetch();
    hideLeaflet();
    try {
      var a = document.getElementById('in');
      if (a) a.value = '';
    } catch (_) {}
    log(String(raw || 'pizza').slice(0, 80));
    try {
      await waitGlobeReady(2400);
      var origin = cameraOrigin();
      await huntAt(origin);
    } catch (e) {
      clearPizzaPins();
      logHuntFailedOnce();
    } finally {
      hunting = false;
      huntLock = false;
      G.__snPizzaLandBusy = 0;
    }
    return true;
  }

  function wrapSnRun() {
    try {
      var SN = G.SN;
      if (!SN || typeof SN.run !== 'function') return;
      if (SN.run.__snPizzaCam) return;
      var prev = SN.run.bind(SN);
      var wrap = function (raw) {
        var t = String(raw || '').trim();
        if (isPizzaLine(t)) {
          huntPizza(t);
          return;
        }
        return prev(raw);
      };
      wrap.__snPizzaCam = 1;
      wrap.__snEarth = 1;
      SN.run = wrap;
    } catch (_) {}
  }

  function bindFormCapture() {
    if (G.__snPizzaCamForm) return;
    G.__snPizzaCamForm = 1;
    try {
      document.addEventListener(
        'submit',
        function (e) {
          var form = e.target;
          if (!form || (form.id !== 'f' && form.id !== 'cli-form')) return;
          var inEl = document.getElementById('in') || form.querySelector('input');
          var v = inEl && inEl.value;
          if (!isPizzaLine(v)) return;
          try {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          } catch (_) {}
          if (inEl) inEl.value = '';
          huntPizza(v);
        },
        true
      );
    } catch (_) {}
  }

  function bootAutoHunt() {
    /* Manual mode: Login + Locate. Do not auto-hunt or prompt GPS. */
    return;
  }

  function boot() {
    hideLeaflet();
    guardOrdersFetch();
    bindFormCapture();
    wrapSnRun();
    bindCanvasTap();
    if (!wrapTimer) {
      wrapTimer = setInterval(function () {
        hideLeaflet();
        wrapSnRun();
        if (lastPins.length) paintPinOverlay();
      }, 400);
    }
    waitGlobeReady(4000).then(function (ok) {
      if (ok) bootAutoHunt();
    });
  }

  boot();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  }
  setTimeout(boot, 0);
  setTimeout(boot, 600);

  G.SNChromeGuestPizzaHunt = {
    build: BUILD,
    hunt: huntPizza,
    huntPizza: huntPizza,
    lastPins: function () {
      return lastPins.slice();
    },
    origin: function () {
      return lastOrigin || cameraOrigin();
    },
  };
  G.SNChromeGuestPizzaCam = G.SNChromeGuestPizzaHunt;
})(typeof window !== 'undefined' ? window : globalThis);
