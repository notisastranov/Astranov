/**
 * P0 guest + cold-present law — 2026-08-17
 *
 * 1. Cold load = PRESENT live globe (not Meshtastic/USB radio checklist)
 * 2. Never land on 2025 FROZEN PAST — PRESENT 2026
 * 3. No geolocation until Locate / coach; denied GPS = stay on globe; no Rhodes fake pin
 * 4–5. Guest LOGIN scrubbed in auth.js; owner runbook only isOwner() or ?sn-debug=1
 * 6. Live now must not blank the globe
 * 7. EventSource /__reload removed from production index
 * 8. Guest Call: sign in → Athens-line on globe → WebRTC (webrtc.js canCall)
 * 9. Guest Poly: no fake DRIVER EN ROUTE; empty = "Sign in and locate to draw a delivery area."
 *
 * Build: 20260817090000-p0-guest-present
 */
(function (global) {
  'use strict';
  if (global.__snP0Guest) return;
  global.__snP0Guest = 1;
  var BUILD = '20260817090000-p0-guest-present';
  var RHODES = { lat: 36.4341, lng: 28.2176 };
  var ATHENS = { lat: 37.9838, lng: 23.7275 };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 200), c || 'ok', true);
    } catch (_) {}
  }

  function signedIn() {
    try {
      return !!(global.SNAuth && SNAuth.user);
    } catch (_) {
      return false;
    }
  }

  function isOwner() {
    try {
      return !!(global.SNAuth && typeof SNAuth.isOwner === 'function' && SNAuth.isOwner());
    } catch (_) {
      return false;
    }
  }

  function isFakeRhodes(p) {
    if (!p || p.lat == null) return false;
    return Math.abs(Number(p.lat) - RHODES.lat) < 0.02 && Math.abs(Number(p.lng) - RHODES.lng) < 0.02;
  }

  function realPos() {
    try {
      var p =
        global._snPhysPos ||
        (global.SNCli && SNCli._lastGps) ||
        global._snLastPos ||
        (global.SNProfiles && SNProfiles.me && SNProfiles.me());
      if (p && p.lat != null && !isFakeRhodes(p) && !p.fake && p.source !== 'demo-kitchen') return p;
    } catch (_) {}
    return null;
  }

  var gpsAllowed = false;
  try {
    if (localStorage.getItem('sn:gps-user-ok') === '1') gpsAllowed = true;
  } catch (_) {}

  function allowGps(reason) {
    gpsAllowed = true;
    try {
      localStorage.setItem('sn:gps-user-ok', '1');
    } catch (_) {}
    log('Locate ready · ' + (reason || 'share place when you want'), 'ok');
  }

  function coachLocate() {
    log('Why location: so delivery and pins are where you are — not a demo city.', 'ok');
    log('Tap Locate when ready · if you deny, we stay on the live globe.', 'dim');
  }

  function patchGeolocation() {
    if (!navigator.geolocation || navigator.geolocation.__snP0) return;
    var geo = navigator.geolocation;
    var origGet = geo.getCurrentPosition.bind(geo);
    var origWatch = geo.watchPosition.bind(geo);
    geo.getCurrentPosition = function (success, error, opts) {
      if (!gpsAllowed) {
        coachLocate();
        if (typeof error === 'function') {
          try {
            error({ code: 1, message: 'Locate first · in-app coach', PERMISSION_DENIED: 1 });
          } catch (_) {}
        }
        return;
      }
      return origGet(
        function (pos) {
          try {
            if (pos && pos.coords) {
              global._snPhysPos = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                source: 'gps',
              };
              global._snLastPos = global._snPhysPos;
            }
          } catch (_) {}
          if (success) success(pos);
        },
        function (err) {
          log('GPS denied or unavailable · stay on live globe', 'dim');
          try {
            if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
          } catch (_) {}
          if (error) error(err);
        },
        opts
      );
    };
    geo.watchPosition = function (success, error, opts) {
      if (!gpsAllowed) {
        coachLocate();
        if (typeof error === 'function') {
          try {
            error({ code: 1, message: 'Locate first', PERMISSION_DENIED: 1 });
          } catch (_) {}
        }
        return 0;
      }
      return origWatch(success, error, opts);
    };
    geo.__snP0 = 1;
  }

  function scrubBootSheet() {
    try {
      var box = document.getElementById('sn-os-facts');
      if (!box) return;
      box.querySelectorAll('.sn-boot-sec').forEach(function (sec) {
        var t = (sec.textContent || '').toLowerCase();
        if (t.indexOf('links') >= 0 || t.indexOf('packet') >= 0 || t.indexOf('donate') >= 0) {
          sec.style.display = 'none';
          var n = sec.nextElementSibling;
          while (n && !n.classList.contains('sn-boot-sec')) {
            var hide =
              /wifi|cell|bluetooth|radio|mesh|fallback|usb|meshtastic|donate|mining/i.test(
                n.textContent || ''
              );
            if (hide) n.style.display = 'none';
            n = n.nextElementSibling;
          }
        }
      });
      var sub = document.getElementById('sn-os-sub');
      if (sub && /Checking this device|Meshtastic|radio/i.test(sub.textContent || '')) {
        sub.textContent = 'PRESENT · live globe';
      }
      var actions = document.getElementById('sn-os-actions');
      if (actions && !document.getElementById('sn-boot-diag-link')) {
        var a = document.createElement('button');
        a.type = 'button';
        a.id = 'sn-boot-diag-link';
        a.className = 'sn-cli-glow alt';
        a.textContent = 'diagnostics';
        a.addEventListener('click', function () {
          try {
            if (global.SNOsBoot && SNOsBoot.diagnostics) SNOsBoot.diagnostics();
            else if (global.SNCli && SNCli.run) void SNCli.run('diagnostics');
          } catch (_) {}
        });
        actions.appendChild(a);
      }
    } catch (_) {}
  }

  function forcePresent() {
    try {
      var y = document.getElementById('tl-year');
      if (y) {
        var now = new Date().getFullYear();
        if (Number(y.value) < 2026 || Number(y.value) === 2025) {
          y.value = String(now >= 2026 ? now : 2026);
        }
      }
      var st = document.getElementById('tl-status');
      if (st) st.textContent = 'PRESENT · live';
      var td = document.getElementById('tl-date');
      if (td) {
        var d = new Date();
        td.textContent = d.toISOString().slice(0, 10);
      }
    } catch (_) {}
    try {
      if (global.SNGlobe && SNGlobe.setTimelineYear) {
        var yr = new Date().getFullYear();
        if (yr < 2026) yr = 2026;
        SNGlobe.setTimelineYear(yr, { live: true });
      }
    } catch (_) {}
  }

  function bindLiveNow() {
    var btn = document.getElementById('stc-data-present');
    if (!btn || btn.__snP0) return;
    btn.__snP0 = 1;
    btn.addEventListener(
      'click',
      function (ev) {
        forcePresent();
        try {
          if (global.SNMap && SNMap.active && SNMap.close) SNMap.close();
        } catch (_) {}
        try {
          document.body.classList.remove('city-map-on');
          var cm = document.getElementById('city-map');
          if (cm) cm.classList.remove('active');
        } catch (_) {}
        try {
          if (global.SNGlobe) {
            if (SNGlobe.goToTier) SNGlobe.goToTier('global');
            var canvas = document.querySelector('#globe canvas');
            if (!canvas && SNGlobe.init) SNGlobe.init();
          }
        } catch (_) {}
        log('PRESENT · live globe', 'ok');
      },
      true
    );
  }

  function patchPolyGuest() {
    try {
      if (global.SNOfferStack && SNOfferStack.demoDelivery && !SNOfferStack.__snP0) {
        var orig = SNOfferStack.demoDelivery.bind(SNOfferStack);
        SNOfferStack.demoDelivery = function (opts) {
          opts = opts || {};
          if (!signedIn() && !isOwner() && !opts.force) {
            log('Sign in and locate to draw a delivery area.', 'dim');
            return Promise.resolve({ ok: false, reason: 'guest' });
          }
          return orig(opts);
        };
        SNOfferStack.__snP0 = 1;
      }
    } catch (_) {}
    try {
      if (global.SNChromeMarket && SNChromeMarket.simulate && !SNChromeMarket.__snP0) {
        var sim = SNChromeMarket.simulate.bind(SNChromeMarket);
        SNChromeMarket.simulate = function (kind, opts) {
          if (!signedIn() && !isOwner()) {
            log('Sign in and locate to draw a delivery area.', 'dim');
            return Promise.resolve({ ok: false });
          }
          return sim(kind, opts);
        };
        SNChromeMarket.__snP0 = 1;
      }
    } catch (_) {}
  }

  function patchCallCli() {
    try {
      if (!global.SNCli || typeof SNCli.run !== 'function' || SNCli.__snP0Call) return;
      SNCli.__snP0Call = 1;
      var prev = SNCli.run.bind(SNCli);
      SNCli.run = function (raw) {
        var s = String(raw || '').trim();
        var low = s.toLowerCase();
        if (/^(call|phone)\b/.test(low) || low === 'call') {
          if (!signedIn()) {
            log('Sign in to call', 'err');
            try {
              if (global.SNAuth && SNAuth.openModal) SNAuth.openModal('Sign in to call');
            } catch (_) {}
            return Promise.resolve(true);
          }
          try {
            if (global.SNSpaceLinks && SNSpaceLinks.addCall) {
              var m = s.match(/^(?:call|phone)\s+(.+)$/i);
              var q = m ? m[1] : 'athens';
              void SNSpaceLinks.resolvePlace(q).then(function (p) {
                p = p || { lat: ATHENS.lat, lng: ATHENS.lng, label: 'Athens' };
                SNSpaceLinks.addCall(p, { label: p.label || q });
              });
            }
          } catch (_) {}
        }
        if (low === 'locate' || low === 'location' || low === 'gps' || low === 'where am i') {
          allowGps('user locate');
          coachLocate();
        }
        if (low === 'poly' || low === 'polygon' || low === 'delivery area' || low === 'area') {
          if (!signedIn() || !realPos()) {
            log('Sign in and locate to draw a delivery area.', 'dim');
            return Promise.resolve(true);
          }
        }
        return prev(raw);
      };
    } catch (_) {}
  }

  function clearFakeHome() {
    try {
      if (isFakeRhodes(global._snLastPos)) global._snLastPos = null;
      if (isFakeRhodes(global._snPhysPos)) global._snPhysPos = null;
    } catch (_) {}
    try {
      var last = JSON.parse(localStorage.getItem('sn:last-good-gps') || 'null');
      if (isFakeRhodes(last)) localStorage.removeItem('sn:last-good-gps');
    } catch (_) {}
  }

  function tick() {
    scrubBootSheet();
    forcePresent();
    bindLiveNow();
    patchPolyGuest();
    patchCallCli();
  }

  function init() {
    patchGeolocation();
    clearFakeHome();
    forcePresent();
    tick();
    setInterval(tick, 2000);
    document.addEventListener('sn:os-ready', function () {
      clearFakeHome();
      forcePresent();
      try {
        if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
      } catch (_) {}
      log('SpaceNet · PRESENT · live globe', 'ok');
    });
  }

  global.SNP0Guest = {
    build: BUILD,
    allowGps: allowGps,
    coachLocate: coachLocate,
    forcePresent: forcePresent,
    realPos: realPos,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
