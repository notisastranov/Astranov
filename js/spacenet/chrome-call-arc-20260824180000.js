/**
 * SpaceNet CALL = glowing great-circle ARC on the live SNGlobe.
 * Build: 20260824180000-call-arc
 *
 * Locked #129 unauth CALL (7051ecf / leftover chrome 8d6758a):
 *   Guest tap/type "call" → ONLY the Google Sign-in wall
 *   (Sign in with Google · Privacy · Terms · Cancel).
 *   No u-xxxx room, no me-av, no plaza fallback, no VIDEO CALL modal.
 *
 * Signed-in path (this prototype): if a session exists, draw the
 * SNGlobe great-circle ARC (me pin + them pin + glowing orbit arc).
 * CLI: "Call name arc". Camera may ease to frame the arc. Never teleport.
 *
 * Do not restyle chrome. Do not paint wallet 3M. Leave github.io untouched.
 * Guest tester never signs in or pays.
 */
(function (G) {
  'use strict';
  if (G.__snCallArc20260824180000) return;
  G.__snCallArc20260824180000 = 1;
  G.__snCallArc234500 = 1;

  var BUILD = '20260824180000-call-arc';
  var CALL_LABEL = 'Call · place or answer';
  var CARD_ID = 'sn-call-signin';
  var CSS_ID = 'sn-call-arc-css';
  var GROUP_NAME = 'sn-call-arc';

  var RHODES = { lat: 36.4341, lng: 28.2176 };
  var KALITHEA = { lat: 36.387557, lng: 28.222533 };
  var DEMO = { lat: 37.9838, lng: 23.7275, name: 'Athens' };

  var SEEDS = {
    athens: DEMO,
    greece: DEMO,
    tokyo: { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    paris: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    london: { lat: 51.5074, lng: -0.1278, name: 'London' },
    'new york': { lat: 40.7128, lng: -74.006, name: 'New York' },
    nyc: { lat: 40.7128, lng: -74.006, name: 'New York' },
    lisbon: { lat: 38.7223, lng: -9.1393, name: 'Lisbon' },
    singapore: { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    nairobi: { lat: -1.2921, lng: 36.8219, name: 'Nairobi' },
    cairo: { lat: 30.0444, lng: 31.2357, name: 'Cairo' },
    dublin: { lat: 53.3498, lng: -6.2603, name: 'Dublin' },
  };

  var GOOGLE_SVG =
    '<svg class="sn-call-g" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.7-8 19.7-20c0-1.3-.1-2.3-.4-3.5z"/>' +
    '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>' +
    '<path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.2l.1.1 6.2 5.2C36.9 41.2 44 36 44 24c0-1.3-.1-2.3-.4-3.5z"/>' +
    '</svg>';

  var group = null;
  var live = false;
  var pending = null;
  var easing = false;
  var pulseOn = false;
  var retryTimer = 0;
  var wrapRun = null;

  function signed() {
    try {
      if (G.SNAuth && typeof SNAuth.isLoggedIn === 'function' && SNAuth.isLoggedIn()) return true;
    } catch (_) {}
    try {
      if (G.SNAuth && SNAuth.session && SNAuth.session.user) return true;
    } catch (_) {}
    try {
      if (G.SNAuth && SNAuth.user) return true;
    } catch (_) {}
    try {
      if (G.A && G.A.user) return true;
    } catch (_) {}
    try {
      if (G.SNAccess && typeof SNAccess.status === 'function') {
        var st = SNAccess.status();
        if (st && (st.registered || st.role === 'owner' || st.role === 'funded' || st.role === 'registered')) {
          return true;
        }
      }
    } catch (_) {}
    try {
      if (localStorage.getItem('sn:owner-session') === '1') return true;
    } catch (_) {}
    return false;
  }

  function log(m, c) {
    try {
      if (G.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 220), c || 'ok', true);
    } catch (_) {}
    try {
      var el = document.getElementById('cli-log');
      if (!el) return;
      var last = el.lastElementChild;
      var s = String(m).slice(0, 220);
      if (last && String(last.textContent || '') === s) return;
      var d = document.createElement('div');
      d.className = 'cli-line ' + (c || 'ok');
      d.setAttribute('data-sn-call-arc', '1');
      d.textContent = s;
      el.appendChild(d);
      el.scrollTop = el.scrollHeight;
    } catch (_) {}
  }

  function near(p, q, d) {
    if (!p || !q || p.lat == null || q.lat == null) return false;
    d = d || 0.05;
    return Math.abs(Number(p.lat) - Number(q.lat)) < d && Math.abs(Number(q.lng) - Number(p.lng)) < d
      ? true
      : Math.abs(Number(p.lat) - Number(q.lat)) < d && Math.abs(Number(p.lng) - Number(q.lng)) < d;
  }

  function isPlaza(p) {
    if (!p || p.lat == null) return true;
    if (near(p, RHODES, 0.06)) return true;
    if (near(p, KALITHEA, 0.06)) return true;
    return false;
  }

  function honestGps() {
    try {
      var p = G._snPhysPos;
      if (
        p &&
        p.lat != null &&
        isFinite(p.lat) &&
        isFinite(p.lng) &&
        (G._snLocatedThisSession || p.source === 'gps') &&
        !isPlaza(p)
      ) {
        return { lat: Number(p.lat), lng: Number(p.lng), name: 'YOU' };
      }
    } catch (_) {}
    return null;
  }

  function cameraLook() {
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function') {
        var v = SNGlobe.viewLatLng();
        if (v && v.lat != null && isFinite(v.lat) && isFinite(v.lng)) {
          return { lat: Number(v.lat), lng: Number(v.lng), name: 'YOU' };
        }
      }
    } catch (_) {}
    try {
      if (G.SNGlobe && typeof SNGlobe.focusPos === 'function') {
        var f = SNGlobe.focusPos();
        if (f && f.lat != null && isFinite(f.lat) && !isPlaza(f)) {
          return { lat: Number(f.lat), lng: Number(f.lng), name: 'YOU' };
        }
      }
    } catch (_) {}
    return null;
  }

  function mePos() {
    return honestGps() || cameraLook();
  }

  function livePeer() {
    var rows = [];
    try {
      if (G.SNMeshPeers && typeof SNMeshPeers.visible === 'function') rows = SNMeshPeers.visible() || [];
    } catch (_) {}
    try {
      if (!rows.length && G.SNMesh && SNMesh.peers) rows = SNMesh.peers() || [];
    } catch (_) {}
    var me = mePos();
    var i, p, lat, lng;
    for (i = 0; i < rows.length; i++) {
      p = rows[i];
      if (!p) continue;
      lat = p.lat != null ? p.lat : p.lon != null ? null : p.latitude;
      lng = p.lng != null ? p.lng : p.lon != null ? p.lon : p.longitude;
      if (lat == null || lng == null) continue;
      if (p.role === 'self') continue;
      if (me && near({ lat: lat, lng: lng }, me, 0.3)) continue;
      if (isPlaza({ lat: lat, lng: lng })) continue;
      return {
        lat: Number(lat),
        lng: Number(lng),
        name: p.name || p.city || p.label || 'Peer',
      };
    }
    return null;
  }

  function seedPlace(q) {
    var k = String(q || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (!k) return null;
    if (SEEDS[k]) return { lat: SEEDS[k].lat, lng: SEEDS[k].lng, name: SEEDS[k].name };
    var keys = Object.keys(SEEDS);
    var i;
    for (i = 0; i < keys.length; i++) {
      if (k.indexOf(keys[i]) >= 0) {
        var s = SEEDS[keys[i]];
        return { lat: s.lat, lng: s.lng, name: s.name };
      }
    }
    return null;
  }

  function themPos(want) {
    if (want && want.lat != null && isFinite(want.lat)) {
      return {
        lat: Number(want.lat),
        lng: Number(want.lng),
        name: want.name || want.label || 'Peer',
      };
    }
    if (want && want.name && !want.lat) {
      var named = seedPlace(want.name);
      if (named) return named;
    }
    var liveP = livePeer();
    if (liveP) return liveP;
    return { lat: DEMO.lat, lng: DEMO.lng, name: DEMO.name };
  }

  function killModal() {
    try {
      [
        'sn-rtc-layer',
        'sn-rtc-dial',
        'sn-rtc-box',
        'sn-rtc-room',
        'sn-video-call',
        'sn-phone-call',
        'sn-call-modal',
        'sn-webrtc-modal',
      ].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('on', 'min', 'max', 'open', 'show', 'sn-open');
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.setAttribute('hidden', '');
      });
    } catch (_) {}
    try {
      var nodes = document.querySelectorAll(
        '.sn-video-call-modal,.video-call-modal,[data-sn-video-call-modal],.sn-rtc-room,[data-sn-room-code]'
      );
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.setProperty('display', 'none', 'important');
        nodes[i].style.setProperty('visibility', 'hidden', 'important');
      }
    } catch (_) {}
  }

  function killRoomCode() {
    try {
      var el = document.getElementById('cli-log');
      if (!el) return;
      var kids = el.querySelectorAll('.cli-line, .cli-feed-item, div');
      for (var i = 0; i < kids.length; i++) {
        var t = String(kids[i].textContent || '');
        if (/\bu-[a-z0-9]{3,}\b/i.test(t) && /room|video\s*call|join/i.test(t)) {
          kids[i].style.setProperty('display', 'none', 'important');
        }
      }
    } catch (_) {}
  }

  function injectCss() {
    var st = document.getElementById(CSS_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = CSS_ID;
      try {
        (document.head || document.documentElement).appendChild(st);
      } catch (_) {}
    }
    st.textContent =
      '#sn-rtc-layer,#sn-rtc-layer.on,#sn-rtc-dial.on,#sn-rtc-box,#sn-rtc-room,' +
      '.sn-video-call-modal,.video-call-modal,[data-sn-video-call-modal],' +
      '#sn-video-call,#sn-phone-call,#sn-call-modal,#sn-webrtc-modal{' +
      'display:none!important;visibility:hidden!important;pointer-events:none!important;' +
      'opacity:0!important;height:0!important;width:0!important;overflow:hidden!important}' +
      '#' +
      CARD_ID +
      '{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,4,12,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:20px;' +
      'pointer-events:auto;visibility:visible;opacity:1}' +
      '#' +
      CARD_ID +
      '[hidden]{display:none!important}' +
      '#' +
      CARD_ID +
      ' .sn-call-card{width:min(400px,100%);max-height:min(92vh,640px);overflow:auto;' +
      'background:linear-gradient(165deg,#061018 0%,#0a1624 55%,#050c14 100%);' +
      'border:1px solid rgba(61,158,255,.35);border-radius:18px;padding:28px 24px 22px;' +
      'box-shadow:0 24px 80px rgba(0,40,80,.55),0 0 40px rgba(61,158,255,.12);' +
      'color:#e8f2ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:center}' +
      '#' +
      CARD_ID +
      ' .sn-auth-mark{font-size:13px;letter-spacing:.28em;font-weight:700;color:#3d9eff;margin:0 0 6px}' +
      '#' +
      CARD_ID +
      ' h2{margin:0 0 8px;font-size:22px;font-weight:650;color:#fff;letter-spacing:.02em}' +
      '#' +
      CARD_ID +
      ' .sn-auth-copy{font-size:13px;line-height:1.45;color:#a8c4dc;margin:0 0 20px}' +
      '#' +
      CARD_ID +
      ' .sn-call-google{display:inline-flex!important;align-items:center;justify-content:center;gap:10px;width:min(280px,100%);' +
      'min-height:44px;visibility:visible!important;opacity:1!important;' +
      'cursor:pointer;border:1px solid rgba(61,158,255,.55);border-radius:999px;padding:12px 18px;margin:0 0 16px;' +
      'font:700 14px/1.2 system-ui;letter-spacing:.02em;background:linear-gradient(180deg,#0a1624,#050c14);color:#e8f4ff;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.45),0 0 18px rgba(61,158,255,.25)}' +
      '#' +
      CARD_ID +
      ' .sn-call-google:hover{border-color:#7ec8ff;color:#fff}' +
      '#' +
      CARD_ID +
      ' .sn-call-g{display:block;flex:0 0 18px}' +
      '#' +
      CARD_ID +
      ' .sn-auth-note{font-size:11px;color:#6a8aaa;margin:0 0 14px;line-height:1.4}' +
      '#' +
      CARD_ID +
      ' .sn-auth-note a{color:#cfe8ff;text-decoration:none;border-bottom:1px solid rgba(61,158,255,.45)}' +
      '#' +
      CARD_ID +
      ' .sn-auth-close{background:transparent;border:1px solid rgba(138,180,217,.25);color:#8ab4d9;' +
      'border-radius:999px;padding:8px 18px;font-size:12px;cursor:pointer}' +
      '#' +
      CARD_ID +
      ' .sn-auth-close:hover{border-color:#3d9eff;color:#cfe8ff}' +
      '#' +
      CARD_ID +
      ' iframe,#sn-auth-gsi iframe,iframe[src*="accounts.google.com"],iframe[src*="gsi/button"]{display:none!important;width:0!important;height:0!important}' +
      'html.sn-call-arc-wall #sn-auth-modal,html.sn-call-arc-wall #sn-auth-card{display:none!important}';
  }

  function hideAuthModal() {
    try {
      var modal = document.getElementById('sn-auth-modal');
      if (modal) {
        modal.hidden = true;
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('open', 'show', 'sn-open');
        modal.style.setProperty('display', 'none', 'important');
      }
    } catch (_) {}
    try {
      var gsi = document.getElementById('sn-auth-gsi');
      if (gsi) gsi.innerHTML = '';
    } catch (_) {}
    try {
      var iframes = document.querySelectorAll(
        'iframe[src*="accounts.google.com"], iframe[src*="gsi/button"], iframe[src*="gsi/iframe"]'
      );
      for (var i = 0; i < iframes.length; i++) {
        try {
          iframes[i].remove();
        } catch (_) {}
      }
    } catch (_) {}
  }

  function dropWall() {
    G.__snCallArcWall = false;
    try {
      document.documentElement.classList.remove('sn-call-arc-wall');
    } catch (_) {}
    try {
      var el = document.getElementById(CARD_ID);
      if (el) {
        el.hidden = true;
        el.setAttribute('hidden', '');
        el.setAttribute('aria-hidden', 'true');
        el.style.setProperty('display', 'none', 'important');
      }
    } catch (_) {}
    hideAuthModal();
  }

  function authBase() {
    try {
      if (G.SN_CONFIG && SN_CONFIG.preferCustomAuth && SN_CONFIG.authHost) {
        return String(SN_CONFIG.authHost).replace(/\/$/, '');
      }
    } catch (_) {}
    try {
      if (G.SN_CONFIG && SN_CONFIG.sbUrl) return String(SN_CONFIG.sbUrl).replace(/\/$/, '');
    } catch (_) {}
    try {
      if (G.SB_URL) return String(G.SB_URL).replace(/\/$/, '');
    } catch (_) {}
    return 'https://lkoatrkhuigdolnjsbie.supabase.co';
  }

  function oauthAuthorizeUrl() {
    var redirectTo = String((G.location && location.origin) || '').replace(/\/$/, '') + '/';
    var base = authBase();
    var key = '';
    try {
      key = (G.SN_CONFIG && SN_CONFIG.sbKey) || G.SB_KEY || '';
    } catch (_) {}
    var url = base + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirectTo);
    if (key) url += '&apikey=' + encodeURIComponent(key);
    return url;
  }

  function nativeGoogleSignIn() {
    var redirectTo = String((G.location && location.origin) || '').replace(/\/$/, '') + '/';
    var opts = {
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
        skipBrowserRedirect: false,
      },
    };
    function goUrl(u) {
      var href = u || oauthAuthorizeUrl();
      try {
        location.assign(href);
      } catch (_) {
        try {
          location.href = href;
        } catch (__) {}
      }
    }
    try {
      if (G.SNAuth && typeof SNAuth.ensureClient === 'function') {
        void Promise.resolve(SNAuth.ensureClient())
          .then(function (c) {
            if (c && c.auth && typeof c.auth.signInWithOAuth === 'function') {
              return c.auth.signInWithOAuth(opts).then(function (res) {
                var u = res && ((res.data && res.data.url) || res.url);
                if (u) goUrl(u);
              });
            }
            goUrl();
          })
          .catch(function () {
            goUrl();
          });
        return;
      }
    } catch (_) {}
    goUrl();
  }

  function cardMarkup() {
    return (
      '<div class="sn-call-card" id="sn-call-card">' +
      '<div class="sn-auth-mark">ASTRANOV</div>' +
      '<h2>Sign in</h2>' +
      '<p class="sn-auth-copy">Sign in with Google to call, order, and keep your place on Earth.</p>' +
      '<button type="button" class="sn-call-google" id="sn-call-google" aria-label="Sign in with Google">' +
      GOOGLE_SVG +
      '<span>Sign in with Google</span></button>' +
      '<p class="sn-auth-note"><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>' +
      '<div><button type="button" class="sn-auth-close" id="sn-call-cancel">Cancel</button></div>' +
      '</div>'
    );
  }

  function bindCardChrome(root) {
    if (!root || root._snCallArcBound === BUILD) return;
    root._snCallArcBound = BUILD;
    root.addEventListener(
      'click',
      function (ev) {
        if (ev.target === root) dropWall();
      },
      true
    );
    var cancel = root.querySelector('#sn-call-cancel');
    if (cancel) {
      cancel.addEventListener(
        'click',
        function (ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          dropWall();
        },
        true
      );
    }
    var googleBtn = root.querySelector('#sn-call-google');
    if (googleBtn) {
      googleBtn.addEventListener(
        'click',
        function (ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          nativeGoogleSignIn();
        },
        true
      );
    }
    if (!document.documentElement._snCallArcEsc) {
      document.documentElement._snCallArcEsc = 1;
      document.addEventListener(
        'keydown',
        function (ev) {
          if (ev.key === 'Escape' && G.__snCallArcWall) dropWall();
        },
        true
      );
    }
  }

  function openSignInCard() {
    killModal();
    hideAuthModal();
    injectCss();
    G.__snCallArcWall = true;
    try {
      document.documentElement.classList.add('sn-call-arc-wall');
    } catch (_) {}
    var root = document.getElementById(CARD_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = CARD_ID;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Sign in to ASTRANOV');
      root.setAttribute('data-sn-build', BUILD);
      root.innerHTML = cardMarkup();
      try {
        (document.body || document.documentElement).appendChild(root);
      } catch (_) {}
      bindCardChrome(root);
    } else {
      if (!root.querySelector('#sn-call-google')) {
        root.innerHTML = cardMarkup();
        root._snCallArcBound = 0;
      }
      bindCardChrome(root);
    }
    root.hidden = false;
    root.removeAttribute('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.setAttribute('data-sn-build', BUILD);
    root.style.setProperty('display', 'flex', 'important');
    root.style.setProperty('visibility', 'visible', 'important');
    root.style.setProperty('opacity', '1', 'important');
    root.style.setProperty('pointer-events', 'auto', 'important');
    root.style.setProperty('z-index', '2147483000', 'important');
    try {
      if (document.body && root.parentNode !== document.body) document.body.appendChild(root);
    } catch (_) {}
    return root;
  }

  function promptGis() {
    killModal();
    pending = pending || { name: '' };
    openSignInCard();
  }

  function host() {
    try {
      if (G.SNGlobe && SNGlobe.getEarth) {
        var e = SNGlobe.getEarth();
        if (e) return e;
      }
    } catch (_) {}
    try {
      if (G.SNGlobe && SNGlobe.getPivot) return SNGlobe.getPivot();
    } catch (_) {}
    return null;
  }

  function vec(lat, lng, r) {
    try {
      if (G.SNGlobe && SNGlobe.latLngToVec) return SNGlobe.latLngToVec(lat, lng, r);
    } catch (_) {}
    if (typeof THREE === 'undefined') return null;
    r = r == null ? 1 : r;
    var phi = ((90 - lat) * Math.PI) / 180;
    var theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function slerpPts(a, b, n) {
    var va = vec(a.lat, a.lng, 1);
    var vb = vec(b.lat, b.lng, 1);
    if (!va || !vb || typeof THREE === 'undefined') return [];
    va = va.clone().normalize();
    vb = vb.clone().normalize();
    var dot = Math.max(-1, Math.min(1, va.dot(vb)));
    var omega = Math.acos(dot);
    var out = [];
    var i, t, p, s0, s1, lift;
    for (i = 0; i <= n; i++) {
      t = i / n;
      if (omega < 1e-4) p = va.clone();
      else {
        s0 = Math.sin((1 - t) * omega) / Math.sin(omega);
        s1 = Math.sin(t * omega) / Math.sin(omega);
        p = va.clone().multiplyScalar(s0).add(vb.clone().multiplyScalar(s1)).normalize();
      }
      lift = 1.018 + Math.sin(t * Math.PI) * 0.055;
      p.multiplyScalar(lift);
      out.push(p);
    }
    return out;
  }

  function pinMesh(lat, lng, color, r) {
    var T = typeof THREE !== 'undefined' ? THREE : null;
    if (!T) return null;
    var p = vec(lat, lng, r == null ? 1.02 : r);
    if (!p) return null;
    var core = new T.Mesh(
      new T.SphereGeometry(0.014, 18, 18),
      new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.98, depthWrite: false })
    );
    core.position.copy(p);
    var halo = new T.Mesh(
      new T.SphereGeometry(0.028, 18, 18),
      new T.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
    );
    halo.position.copy(p);
    core.renderOrder = 21;
    halo.renderOrder = 20;
    core.userData = core.userData || {};
    core.userData.snCallPin = 1;
    halo.userData = halo.userData || {};
    halo.userData.snCallHalo = 1;
    return { core: core, halo: halo };
  }

  function clearArc() {
    pulseOn = false;
    if (!group) return;
    try {
      var parent = group.parent;
      if (parent) parent.remove(group);
      group.traverse(function (obj) {
        try {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        } catch (_) {}
      });
    } catch (_) {}
    group = null;
    live = false;
  }

  function unwrap(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function easeFrame(a, b) {
    var globe = G.SNGlobe;
    if (!globe || !globe.getSpin || !globe.getTilt) return;
    var spin = globe.getSpin();
    var tilt = globe.getTilt();
    if (!spin || !tilt) return;
    var midLat = (Number(a.lat) + Number(b.lat)) / 2;
    var dlng = Number(b.lng) - Number(a.lng);
    if (dlng > 180) dlng -= 360;
    if (dlng < -180) dlng += 360;
    var midLng = Number(a.lng) + dlng / 2;
    if (midLng > 180) midLng -= 360;
    if (midLng < -180) midLng += 360;
    var x1 = (-midLat * Math.PI) / 180;
    var y1 = (-midLng * Math.PI) / 180;
    if (x1 > 1.05) x1 = 1.05;
    if (x1 < -1.05) x1 = -1.05;
    var x0 = tilt.rotation.x;
    var y0 = spin.rotation.y;
    var dy = unwrap(y1 - y0);
    if (Math.abs(x1 - x0) < 0.02 && Math.abs(dy) < 0.02) return;
    easing = true;
    var t0 = Date.now();
    var dur = 880;
    function step() {
      var t = Math.min(1, (Date.now() - t0) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      try {
        tilt.rotation.x = x0 + (x1 - x0) * e;
        spin.rotation.y = y0 + dy * e;
        if (globe.paint) globe.paint();
      } catch (_) {}
      if (t < 1) requestAnimationFrame(step);
      else easing = false;
    }
    requestAnimationFrame(step);
  }

  function startPulse() {
    if (pulseOn) return;
    pulseOn = true;
    var t0 = Date.now();
    function pulse() {
      if (!pulseOn || !group) return;
      var t = (Date.now() - t0) / 900;
      var k = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
      try {
        group.traverse(function (obj) {
          if (!obj.material || obj.material.opacity == null) return;
          if (obj.userData && obj.userData.snCallHalo) {
            obj.material.opacity = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
          } else if (obj.type === 'Mesh' && obj.geometry && obj.geometry.type === 'TubeGeometry') {
            obj.material.opacity = k;
          }
        });
        if (G.SNGlobe && SNGlobe.paint) SNGlobe.paint();
      } catch (_) {}
      requestAnimationFrame(pulse);
    }
    requestAnimationFrame(pulse);
  }

  function drawArc(a, b) {
    var T = typeof THREE !== 'undefined' ? THREE : null;
    var earth = host();
    if (!T || !earth || !a || !b) return false;
    clearArc();
    var pts = slerpPts(a, b, 72);
    if (pts.length < 2) return false;
    group = new T.Group();
    group.name = GROUP_NAME;
    group.userData = { snCallArc: 1, build: BUILD };
    var verts = [];
    var vecs = [];
    pts.forEach(function (p) {
      verts.push(p.x, p.y, p.z);
      vecs.push(p.clone ? p.clone() : new T.Vector3(p.x, p.y, p.z));
    });
    try {
      if (T.CatmullRomCurve3 && T.TubeGeometry && vecs.length > 3) {
        var tube = new T.Mesh(
          new T.TubeGeometry(new T.CatmullRomCurve3(vecs), 72, 0.0075, 12, false),
          new T.MeshBasicMaterial({
            color: 0x7ec8ff,
            transparent: true,
            opacity: 0.78,
            depthWrite: false,
          })
        );
        tube.renderOrder = 18;
        tube.userData = { snCallTube: 1 };
        group.add(tube);
      }
    } catch (_) {}
    try {
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
      var line = new T.Line(
        geo,
        new T.LineBasicMaterial({
          color: 0xb8ecff,
          transparent: true,
          opacity: 0.98,
          depthWrite: false,
        })
      );
      line.renderOrder = 19;
      line.userData = { snCallLine: 1 };
      group.add(line);
    } catch (_) {}
    var pinA = pinMesh(a.lat, a.lng, 0x44ffaa, 1.022);
    var pinB = pinMesh(b.lat, b.lng, 0xffd080, 1.022);
    if (pinA) {
      group.add(pinA.core);
      group.add(pinA.halo);
    }
    if (pinB) {
      group.add(pinB.core);
      group.add(pinB.halo);
    }
    earth.add(group);
    try {
      if (earth.updateMatrixWorld) earth.updateMatrixWorld(true);
      if (G.SNGlobe && SNGlobe.paint) SNGlobe.paint();
    } catch (_) {}
    live = true;
    startPulse();
    return true;
  }

  function stayGlobe() {
    try {
      if (G.SNMap && SNMap.active && typeof SNMap.close === 'function') SNMap.close();
    } catch (_) {}
  }

  function retryDraw(a, b) {
    if (retryTimer) {
      try {
        clearTimeout(retryTimer);
      } catch (_) {}
    }
    var n = 0;
    function go() {
      n += 1;
      var ok = false;
      try {
        ok = drawArc(a, b);
      } catch (_) {}
      if (ok) {
        easeFrame(a, b);
        return;
      }
      if (n < 16) retryTimer = setTimeout(go, 400);
    }
    retryTimer = setTimeout(go, 280);
  }

  function paintCall(opts) {
    opts = opts || {};
    stayGlobe();
    killModal();
    killRoomCode();
    if (!signed()) {
      pending = { name: (opts && (opts.name || opts.label)) || '' };
      promptGis();
      return { ok: false, needAuth: true };
    }
    dropWall();
    var a = mePos();
    if (!a) {
      log('Call · share location or keep Earth in view', 'dim');
      retryDraw(
        { lat: 37.4, lng: -122.0, name: 'YOU' },
        themPos(opts.peer || (opts.name ? { name: opts.name } : null))
      );
      var bWait = themPos(opts.peer || (opts.name ? { name: opts.name } : null));
      setTimeout(function () {
        var me = mePos();
        if (me) {
          drawArc(me, bWait);
          easeFrame(me, bWait);
          log('Call ' + (bWait.name || 'Athens') + ' arc', 'ok');
        }
      }, 600);
      return { ok: false, error: 'no-me-yet', pending: true };
    }
    var b = themPos(opts.peer || (opts.name ? { name: opts.name } : null));
    var name = String(b.name || opts.name || opts.label || 'Athens').trim() || 'Athens';
    var ok = drawArc(a, b);
    if (!ok) {
      retryDraw(a, b);
    } else {
      easeFrame(a, b);
    }
    log('Call ' + name + ' arc', 'ok');
    pending = null;
    return { ok: true, spatial: true, name: name, me: a, them: b };
  }

  function dimCall() {
    if (!group) return;
    pulseOn = false;
    try {
      group.traverse(function (obj) {
        if (obj.material && obj.material.opacity != null) {
          obj.material.opacity = Math.min(obj.material.opacity, 0.22);
          if (obj.material.color) obj.material.color.setHex(0x4a6080);
        }
      });
      if (G.SNGlobe && SNGlobe.paint) SNGlobe.paint();
    } catch (_) {}
    setTimeout(clearArc, 1600);
  }

  function isCallIntent(raw) {
    var s = String(raw || '').trim();
    var low = s.toLowerCase();
    if (!low) return false;
    if (/^(call|phone|webrtc|rtc)\b/.test(low)) return true;
    if (/^video(\s*call)?$/.test(low)) return true;
    if (/^video\s+call\b/.test(low)) return true;
    return false;
  }

  function isHang(raw) {
    var low = String(raw || '')
      .trim()
      .toLowerCase();
    return /^(hang|hangup|end call|call end|call hang)/.test(low) || /\b(hang ?up|end call)\b/.test(low);
  }

  function placeFrom(raw) {
    var s = String(raw || '')
      .replace(/^(call|phone|webrtc|rtc|video(\s*call)?)\s+/i, '')
      .replace(/^(to|in|at)\s+/i, '')
      .trim();
    if (!s || /^(now|me|us|start|open|instant|video|audio)$/i.test(s)) return '';
    return s;
  }

  function handleCall(raw) {
    killModal();
    killRoomCode();
    if (isHang(raw)) {
      dimCall();
      return true;
    }
    if (!isCallIntent(raw)) return false;
    var place = placeFrom(raw);
    if (!signed()) {
      pending = { name: place };
      promptGis();
      return true;
    }
    paintCall({ name: place, peer: place ? { name: place } : null });
    return true;
  }

  function patchWebRtc() {
    var W = G.SNWebRTC;
    if (!W || W.__snCallArc180000) {
      if (W && !W.__snCallArc180000) {
        /* fall through */
      } else if (W) return;
      else return;
    }
    if (!W) return;
    W.__snCallArc180000 = 1;
    W.__snCallArc = 1;

    W.canCall = function (order, opts) {
      opts = opts || {};
      if (!signed() && !opts.force) return { ok: false, reason: 'Sign in', needAuth: true };
      return { ok: true, reason: 'arc' };
    };

    function spatial(order, opts) {
      opts = opts || {};
      killModal();
      if (!signed()) {
        pending = { name: (opts && opts.label) || (order && (order.vendorName || order.clientName)) || '' };
        promptGis();
        return Promise.resolve({ ok: false, needAuth: true, spatial: true });
      }
      var peer = null;
      if (opts.peerLat != null && opts.peerLng != null) {
        peer = { lat: Number(opts.peerLat), lng: Number(opts.peerLng), name: opts.label || 'Peer' };
      } else if (order && (order.vendor_lat != null || order.lat != null)) {
        peer = {
          lat: Number(order.vendor_lat != null ? order.vendor_lat : order.lat),
          lng: Number(order.vendor_lng != null ? order.vendor_lng : order.lng),
          name: order.vendorName || order.clientName || opts.label || 'Peer',
        };
      } else if (opts.label) {
        peer = { name: opts.label };
      }
      var r = paintCall({ name: (peer && peer.name) || opts.label || '', peer: peer });
      return Promise.resolve(r);
    }

    W.startCall = spatial;
    W.startInstant = function (opts) {
      return spatial(null, opts || {});
    };
    W.openFromRibbon = function () {
      handleCall('call');
    };
    W.open = W.openFromRibbon;
    var prevHang = W.hangup && W.hangup.bind(W);
    W.hangup = function (silent) {
      dimCall();
      killModal();
      if (prevHang) {
        try {
          return prevHang(silent);
        } catch (_) {}
      }
    };
    var prevLine = W.handleLine && W.handleLine.bind(W);
    W.handleLine = function (raw) {
      if (handleCall(raw)) return true;
      if (prevLine) {
        try {
          var r = prevLine(raw);
          killModal();
          return r;
        } catch (_) {}
      }
      return false;
    };
  }

  function patchStage() {
    try {
      if (!G.SNStage || G.SNStage.__snCallArc180000) return;
      G.SNStage.__snCallArc180000 = 1;
      G.SNStage.call = function (peer, opts) {
        opts = opts || {};
        var r = paintCall({
          name: (peer && peer.name) || opts.label || opts.place || '',
          peer: peer && peer.lat != null ? peer : opts.place ? { name: opts.place } : null,
        });
        return Promise.resolve(r);
      };
      var prevLink = G.SNStage.link && G.SNStage.link.bind(G.SNStage);
      G.SNStage.link = function (from, to, opts) {
        opts = opts || {};
        if (opts.kind === 'call') {
          return paintCall({
            name: (to && to.name) || 'name',
            peer: to,
          });
        }
        return prevLink ? prevLink(from, to, opts) : null;
      };
    } catch (_) {}
  }

  function patchAccess() {
    try {
      if (!G.SNAccess) return;
      if (G.SNAccess.__snCallArc180000) return;
      G.SNAccess.__snCallArc180000 = 1;
      if (typeof G.SNAccess.gateTask === 'function') {
        var prevG = G.SNAccess.gateTask.bind(G.SNAccess);
        G.SNAccess.gateTask = function (name) {
          if (String(name || '') === 'call') {
            handleCall('call');
            return false;
          }
          return prevG(name);
        };
      }
    } catch (_) {}
  }

  function patchShell() {
    try {
      if (!G.SNShell) return;
      if (G.SNShell.__snCallArc180000) return;
      G.SNShell.__snCallArc180000 = 1;
      if (typeof G.SNShell.task === 'function') {
        var prevT = G.SNShell.task.bind(G.SNShell);
        G.SNShell.task = function (name) {
          if (String(name || '') === 'call') {
            handleCall('call');
            return;
          }
          return prevT(name);
        };
      }
    } catch (_) {}
  }

  function installCli() {
    try {
      if (!G.SNCli || typeof SNCli.run !== 'function') return;
      if (wrapRun && SNCli.run === wrapRun) return;
      var prev = SNCli.run.bind(SNCli);
      wrapRun = function (raw) {
        try {
          if (handleCall(raw)) return Promise.resolve(true);
        } catch (_) {}
        return prev(raw);
      };
      SNCli.run = wrapRun;
      SNCli.__snCallArcRun = BUILD;
    } catch (_) {}
  }

  function bindInputs() {
    function capture(ev, el) {
      var v = String((el && el.value) || '').trim();
      if (!v || (!isCallIntent(v) && !isHang(v))) return false;
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      } catch (_) {}
      if (el) el.value = '';
      handleCall(v);
      return true;
    }
    try {
      var form = document.getElementById('cli-form');
      var input = document.getElementById('cli-in');
      if (form && input && !input._snCallArc180000) {
        input._snCallArc180000 = 1;
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
      if (topIn && !topIn._snCallArc180000) {
        topIn._snCallArc180000 = 1;
        topIn.addEventListener(
          'keydown',
          function (ev) {
            if (ev.key === 'Enter') capture(ev, topIn);
          },
          true
        );
      }
      var topForm = document.getElementById('stc-cmd');
      if (topForm && topIn && !topForm._snCallArc180000) {
        topForm._snCallArc180000 = 1;
        topForm.addEventListener(
          'submit',
          function (ev) {
            capture(ev, topIn);
          },
          true
        );
      }
      var shellForm = document.getElementById('sn-shell-form');
      var shellIn = document.getElementById('sn-shell-in');
      if (shellForm && shellIn && !shellIn._snCallArc180000) {
        shellIn._snCallArc180000 = 1;
        shellForm.addEventListener(
          'submit',
          function (ev) {
            capture(ev, shellIn);
          },
          true
        );
      }
    } catch (_) {}
  }

  function labelCallBtn() {
    try {
      var btn = document.getElementById('sn-rib-call');
      if (!btn) btn = document.querySelector('#sn-task-ribbon [data-act="call"]');
      if (!btn) btn = document.querySelector('#sn-shell-tasks [data-t="call"]');
      if (!btn) return;
      btn.setAttribute('aria-label', CALL_LABEL);
      btn.setAttribute('title', CALL_LABEL);
    } catch (_) {}
  }

  function isCallButton(btn) {
    if (!btn) return false;
    var id = btn.id || '';
    var act = btn.getAttribute('data-act') || '';
    var t = btn.getAttribute('data-t') || '';
    var rtc = btn.getAttribute('data-rtc') || '';
    var dial = btn.getAttribute('data-dial') || '';
    return (
      id === 'sn-rib-call' ||
      act === 'call' ||
      t === 'call' ||
      dial === 'video' ||
      dial === 'audio' ||
      dial === 'instant' ||
      rtc === 'call'
    );
  }

  function bindRibbon() {
    try {
      if (document._snCallArcClick180000) return;
      document._snCallArcClick180000 = 1;
      document.addEventListener(
        'click',
        function (ev) {
          var t = ev.target;
          if (!t || !t.closest) return;
          if (t.closest('#' + CARD_ID)) return;
          var btn = t.closest(
            '#sn-rib-call, [data-act="call"], [data-t="call"], [data-rtc], [data-dial], .sn-shell-btn'
          );
          if (!btn) return;
          if (!isCallButton(btn)) return;
          try {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          } catch (_) {}
          handleCall('call');
        },
        true
      );
    } catch (_) {}
  }

  function watchAuth() {
    if (G.__snCallArcAuth180000) return;
    G.__snCallArcAuth180000 = 1;
    var last = signed();
    setInterval(function () {
      var now = signed();
      if (now && !last && pending) {
        var p = pending;
        pending = null;
        dropWall();
        paintCall(p);
      }
      if (now && G.__snCallArcWall) dropWall();
      last = now;
      killModal();
      killRoomCode();
    }, 700);
  }

  function tick() {
    injectCss();
    killModal();
    patchWebRtc();
    patchStage();
    patchAccess();
    patchShell();
    installCli();
    bindInputs();
    bindRibbon();
    labelCallBtn();
  }

  function init() {
    injectCss();
    tick();
    watchAuth();
    setTimeout(tick, 0);
    setTimeout(tick, 400);
    setTimeout(tick, 1200);
    setTimeout(tick, 2800);
    setInterval(tick, 3500);
  }

  G.SNCallArc = {
    build: BUILD,
    paint: paintCall,
    clear: clearArc,
    dim: dimCall,
    handle: handleCall,
    openSignIn: openSignInCard,
    signInCard: openSignInCard,
    live: function () {
      return !!live;
    },
    group: function () {
      return group;
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
