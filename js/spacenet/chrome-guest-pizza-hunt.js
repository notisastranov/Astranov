/**
 * Guest pizza hunt — Build 20260822093000-pin-on-globe
 * From #127 · PATCH: shops must appear on the LIVE 3D globe.
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
 * ORIGIN LAW (this patch):
 *   origin = real YOU pin if located, else current camera look-at (viewLatLng/focusPos).
 *   NEVER silent Rhodes 36.43,28.22 while the camera is elsewhere.
 *   If look-at has zero shops → ask Locate once in CLI (no Google wall).
 * Product law: if it is not on the globe it is not shipped.
 */
(function (G) {
  'use strict';
  // Allow re-install of patched build on hot reload
  G.__snGuestPizzaHunt0822 = 1;
  var BUILD = '20260822093000-pin-on-globe';
  var hunting = false;
  var lastPins = [];
  var pinMeshes = [];
  var clickUnsub = null;
  var askedLocate = false;

  var FOOD = /restaurant|fast_food|cafe|bar|pub|food|pizza|pizzeria|bakery|taverna|grill|souvlaki|kebab|burger|sushi|kitchen|deli|ice_cream|dessert|market/i;
  var PIZZA_RE =
    /\b(order\s+(me\s+)?(a\s+)?pizza|pizza\s*(please|order|near|nearby|delivery)?|get\s+(me\s+)?pizza|i\s+want\s+(a\s+)?pizza|find\s+pizza|pizza\s+shops?|hungry\s+for\s+pizza)\b/i;
  var ORDER_FOOD_RE =
    /\b(order\s+(me\s+)?(a\s+)?(food|meal|burger|souvlaki|kebab|sushi)|food\s+delivery|deliver\s+(me\s+)?(food|pizza))\b/i;

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

  /**
   * Origin for bbox hunt.
   * Priority: real YOU → tasks pos → camera look-at (viewLatLng) → focusPos.
   * NEVER invent Rhodes while the camera is on another continent.
   */
  function resolveOrigin() {
    var you = null;
    try {
      if (G._snLastPos && G._snLastPos.lat != null && G._snLastPos.lng != null) {
        you = { lat: +G._snLastPos.lat, lng: +G._snLastPos.lng, source: 'you' };
      }
    } catch (_) {}
    try {
      if (!you && G._snPhysPos && G._snPhysPos.lat != null) {
        you = { lat: +G._snPhysPos.lat, lng: +G._snPhysPos.lng, source: 'phys' };
      }
    } catch (_) {}
    try {
      if (!you && G.SNTasks && SNTasks.pos && SNTasks.pos.lat != null) {
        you = { lat: +SNTasks.pos.lat, lng: +SNTasks.pos.lng, source: 'tasks' };
      }
    } catch (_) {}
    try {
      if (!you && G.SNProfiles && SNProfiles.me) {
        var me = SNProfiles.me();
        if (me && me.lat != null && me.lng != null) {
          you = { lat: +me.lat, lng: +me.lng, source: 'profile' };
        }
      }
    } catch (_) {}
    if (you && isFinite(you.lat) && isFinite(you.lng)) return you;

    // Camera look-at — the land the guest is actually seeing
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

    // No silent Rhodes. Caller must handle null → ask Locate.
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

  /** Never open the auth modal for guest pizza browse. */
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

  /** Soft face nearest shop — no goToTier, no street map, no village teleport. */
  function stayPutSoft(nearest) {
    try {
      if (G.SNMap && SNMap.active && typeof SNMap.close === 'function') SNMap.close();
    } catch (_) {}
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

  /**
   * Drop real 3D pins on the live globe. Product law: if not on the globe, not shipped.
   * Uses SNGlobe.pulse (THREE markers on pivot) — long-lived so guest can tap.
   */
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

      // Primary: live WebGL globe pulse pin
      if (ready) {
        try {
          var mesh = SNGlobe.pulse(lat, lng, color, label, 180000);
          if (mesh) {
            pinMeshes.push(mesh);
            painted++;
          }
        } catch (_) {}
      }

      // Optional space-links field pin (if module loaded)
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

  /** Guest taps a globe pin → CLI names the shop (no auth wall). */
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
        var hit = null;
        try {
          if (typeof SNGlobe.pickLatLng === 'function') {
            var ll = SNGlobe.pickLatLng(cx, cy);
            if (ll && ll.lat != null) {
              var best = 1e9;
              lastPins.forEach(function (p) {
                var d = haversineKm(ll, p);
                if (d < best) {
                  best = d;
                  hit = p;
                }
              });
              // ~25 km pick tolerance at globe scale (generous for finger)
              if (best > 28) hit = null;
            }
          }
        } catch (_) {}
        if (!hit) return false;
        log(
          'Shop · ' +
            String(hit.name || 'vendor').slice(0, 36) +
            (hit.km != null ? ' · ' + hit.km.toFixed(1) + 'km' : '') +
            ' · ⭐ · Google only at pay',
          'ok'
        );
        preview(String(hit.name || 'shop').slice(0, 40) + ' · ⭐');
        try {
          if (G.SNGlobe && typeof SNGlobe.pulse === 'function') {
            SNGlobe.pulse(hit.lat, hit.lng, 0xff9f43, hit.name || 'shop', 12000);
          }
        } catch (_) {}
        return true;
      });
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
      log((i + 1) + ' · ' + name + ' · ' + kmS + ' · ⭐', 'ok');
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
    // Soft auto-locate if globe API exists — no auth modal
    try {
      if (G.SNGlobe && typeof SNGlobe.locate === 'function') {
        void SNGlobe.locate().then(function (row) {
          if (row && row.lat != null) {
            try {
              G._snLastPos = { lat: +row.lat, lng: +row.lng };
            } catch (_) {}
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
            G._snLastPos = { lat: +row.lat, lng: +row.lng };
            log('Located · type pizza again', 'ok');
          }
        });
      }
    } catch (_) {}
  }

  async function huntPizza(raw) {
    if (hunting) return true;
    hunting = true;
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
      log('No origin yet · looking at camera center…', 'dim');
      askLocateOnce();
      hunting = false;
      return true;
    }

    log(
      'Origin · ' +
        origin.source +
        ' · ' +
        origin.lat.toFixed(3) +
        ', ' +
        origin.lng.toFixed(3),
      'dim'
    );

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

    // Prefer pizza-ish names first when query is pizza.
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
      // Camera somewhere empty (e.g. South America ocean) — do NOT list Rhodes km
      clearPizzaPins();
      listInCli([], origin);
      if (origin.source === 'camera' || origin.source === 'focus' || origin.source === 'focus-cache') {
        askLocateOnce();
      } else {
        log('No delivery shops in 16 km · spin globe or try another area', 'dim');
      }
      hunting = false;
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

    var nearest = use
      .map(function (v) {
        return {
          lat: +v.lat,
          lng: +v.lng,
          name: v.name,
          km: haversineKm(origin, { lat: +v.lat, lng: +v.lng }),
        };
      })
      .sort(function (a, b) {
        return a.km - b.km;
      })[0];

    // Soft face nearest only when shops are near the current origin (same view)
    if (nearest && nearest.km < 40) {
      stayPutSoft(nearest);
    }

    if (isGuest()) {
      log('Guest browse · sign in only when you HOLD ⭐ / pay', 'dim');
    }
    hunting = false;
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
    if (!G.SNCli || typeof SNCli.run !== 'function') return;
    // Re-bind on patch so new logic wins even if old guard set
    if (SNCli.__snGuestPizzaHuntBuild === BUILD) return;
    SNCli.__snGuestPizzaHuntBuild = BUILD;
    SNCli.__snGuestPizzaHunt = 1;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      try {
        var s = String(raw || '').trim();
        if (isPizzaLine(s)) {
          void huntPizza(s);
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
        if (!v || !isPizzaLine(v)) return false;
        try {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        } catch (_) {}
        if (el) el.value = '';
        void huntPizza(v);
        return true;
      }
      if (form && input && !input._snPizzaHunt) {
        input._snPizzaHunt = 1;
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
      if (topIn && !topIn._snPizzaHunt) {
        topIn._snPizzaHunt = 1;
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
      if (G.SNMarket && typeof SNMarket.fulfillFoodIntent === 'function' && !SNMarket._snPizzaHunt) {
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
        SNMarket._snPizzaHunt = true;
      }
    } catch (_) {}
  }

  function boot() {
    install();
    blockAuthModalOnPizza();
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
