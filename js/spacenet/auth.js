/* Astranov auth — Google GIS only · brand face astranov.eu · never supabase host */
(function (global) {
  'use strict';

  const A = {
    client: null,
    user: null,
    ready: false,
    _gsiReady: null,
    _gsiInit: false,
    _bound: false,
    _modal: null,
    _customAuthOk: null,
  };

  /** Google OAuth Web client — Authorized JS origins must include https://astranov.eu */
  const GOOGLE_CLIENT_ID =
    '73846897360-va7gcqngfc370gfp7rl059no0vd4ts11.apps.googleusercontent.com';

  function cfg() {
    return global.SN_CONFIG || {};
  }

  function brand() {
    const b = cfg().brand || {};
    return {
      name: b.name || 'ASTRANOV',
      domain: b.domain || 'astranov.eu',
      site: (b.site || cfg().live || 'https://astranov.eu').replace(/\/$/, ''),
      authHost: (b.authHost || cfg().authHost || 'https://api.astranov.eu').replace(/\/$/, ''),
    };
  }

  /** Never show supabase project ref to humans */
  function scrub(text) {
    return String(text || '')
      .replace(/https?:\/\/[a-z0-9-]+\.supabase\.co[^\s"'<>]*/gi, 'astranov.eu')
      .replace(/[a-z0-9]{12,}\.supabase\.co/gi, 'astranov.eu')
      .replace(/\blkoatrkhuigdolnjsbie\b/gi, 'astranov')
      .replace(/\bsupabase\b/gi, 'Astranov')
      .replace(/\bgotrue\b/gi, 'Astranov')
      .replace(/\binvalid_client\b/gi, 'Google app not configured for this site')
      .replace(/\bno registered origin\b/gi, 'site origin not registered for Google')
      .replace(/\bredirect_uri_mismatch\b/gi, 'sign-in redirect not allowed');
  }

  function say(msg, cls) {
    try {
      if (global.SNCli) {
        if (SNCli.beginTurn && !SNCli.inTurn?.()) {
          SNCli.beginTurn();
          try {
            SNCli.log(scrub(msg), cls || 'ok');
          } finally {
            SNCli.endTurn();
          }
        } else if (SNCli.log) {
          SNCli.log(scrub(msg), cls || 'ok', true);
        }
      }
    } catch (_) {}
  }

  /**
   * API base for Supabase client.
   * Prefer custom domain only when it actually answers (else GIS still works
   * against direct host — users never see that host; only API traffic does).
   */
  function authBaseUrl() {
    const b = brand();
    const direct = String(cfg().sbUrl || global.SB_URL || '').replace(/\/$/, '');
    if (cfg().preferCustomAuth === true && b.authHost) return b.authHost;
    if (A._customAuthOk === true && b.authHost) return b.authHost;
    return direct;
  }

  /** Probe custom domain once — enable silently if healthy */
  async function probeCustomAuth() {
    if (A._customAuthOk != null) return A._customAuthOk;
    const host = brand().authHost;
    if (!host || /supabase\.co/i.test(host)) {
      A._customAuthOk = false;
      return false;
    }
    try {
      const key = cfg().sbKey || global.SB_KEY || '';
      const r = await fetch(host + '/auth/v1/health', {
        method: 'GET',
        headers: key ? { apikey: key } : {},
        cache: 'no-store',
      });
      // 1014 / 403 Cloudflare CNAME fail → not ready
      A._customAuthOk = r.ok || r.status === 200;
      if (A._customAuthOk) {
        try {
          if (cfg()) cfg().preferCustomAuth = true;
        } catch (_) {}
      }
    } catch (_) {
      A._customAuthOk = false;
    }
    return A._customAuthOk;
  }

  async function ensureClient() {
    if (A.client) return A.client;
    if (typeof supabase === 'undefined') throw new Error('Auth loading · wait a moment');
    await probeCustomAuth();
    const url = authBaseUrl();
    const key = cfg().sbKey || global.SB_KEY;
    A.client = supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'astranov_auth_v3',
      },
    });
    A.client.auth.onAuthStateChange((_e, session) => {
      A.user = session?.user || null;
      paint();
    });
    const { data } = await A.client.auth.getSession();
    A.user = data?.session?.user || null;
    A.ready = true;
    paint();
    return A.client;
  }

  function paint() {
    const btn = document.getElementById('btn-login');
    const chip = document.getElementById('user-chip');
    const name =
      A.user?.user_metadata?.full_name || A.user?.email?.split?.('@')?.[0] || null;
    if (btn) {
      btn.textContent = A.user ? '✓' : '🔐';
      btn.title = A.user
        ? 'Signed in as ' + (name || 'user') + ' · astranov.eu'
        : 'Sign in · ASTRANOV · astranov.eu';
      btn.classList.toggle('in', !!A.user);
    }
    if (chip) {
      chip.textContent = name ? name.slice(0, 18) : '';
      chip.hidden = !name;
    }
    try {
      global.SNCli?.preview?.(
        A.user
          ? 'Signed in · ' + (name || 'user') + ' · astranov.eu'
          : 'Guest · tap User to sign in to astranov.eu'
      );
    } catch (_) {}
    try {
      if (global.SNHome && SNHome.openState && SNHome.paint) SNHome.paint();
    } catch (_) {}
    try {
      if (global.SNField && SNField.paintRibbon) SNField.paintRibbon();
    } catch (_) {}
  }

  function loadGsi() {
    if (global.google && global.google.accounts && global.google.accounts.id) {
      return Promise.resolve();
    }
    if (A._gsiReady) return A._gsiReady;
    A._gsiReady = new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error('Google sign-in blocked · check network / adblock'));
      };
      document.head.appendChild(s);
    });
    return A._gsiReady;
  }

  function originHelp() {
    const origin = (location.origin || 'https://astranov.eu').replace(/\/$/, '');
    return (
      'Google does not allow this origin yet. Owner: Google Cloud → Credentials → OAuth client → Authorized JavaScript origins → add ' +
      origin +
      ' (and https://www.astranov.eu). Hard refresh after save.'
    );
  }

  function applyUser(user) {
    A.user = user || null;
    paint();
    if (!A.user) return;
    try {
      const me = global.SNProfiles?.me?.();
      if (me) {
        const nm = A.user.user_metadata?.full_name || A.user.email?.split('@')[0];
        if (nm) me.name = nm;
        if (A.user.user_metadata?.avatar_url) me.avatar = A.user.user_metadata.avatar_url;
        if (A.user.email) me.handle = '@' + A.user.email.split('@')[0];
        me.authUid = A.user.id;
        global.SNProfiles.upsert(me);
      }
    } catch (_) {}
  }

  async function completeIdToken(credential) {
    await ensureClient();
    const { data, error } = await A.client.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    });
    if (error) {
      const msg = scrub(error.message || error);
      // Never leak API host
      throw new Error(msg);
    }
    applyUser(data?.user || data?.session?.user || null);
    if (A.user) {
      say(
        'Signed in · ' +
          (A.user.user_metadata?.full_name || A.user.email || 'user') +
          ' · astranov.eu',
        'ok'
      );
    }
    closeModal();
    return data;
  }

  function ensureModalStyles() {
    if (document.getElementById('sn-auth-style')) return;
    const st = document.createElement('style');
    st.id = 'sn-auth-style';
    st.textContent =
      '#sn-auth-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,4,12,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:20px}' +
      '#sn-auth-modal[hidden]{display:none!important}' +
      '#sn-auth-card{width:min(360px,100%);background:linear-gradient(165deg,#061018 0%,#0a1624 55%,#050c14 100%);' +
      'border:1px solid rgba(61,158,255,.35);border-radius:18px;padding:28px 24px 22px;box-shadow:0 24px 80px rgba(0,40,80,.55),0 0 40px rgba(61,158,255,.12);' +
      'color:#e8f2ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:center}' +
      '#sn-auth-card .sn-auth-mark{font-size:13px;letter-spacing:.28em;font-weight:700;color:#3d9eff;margin:0 0 6px}' +
      '#sn-auth-card h2{margin:0 0 8px;font-size:22px;font-weight:650;color:#fff;letter-spacing:.02em}' +
      '#sn-auth-card .sn-auth-domain{font-size:13px;color:#8ab4d9;margin:0 0 18px}' +
      '#sn-auth-card .sn-auth-copy{font-size:13px;line-height:1.45;color:#a8c4dc;margin:0 0 20px}' +
      '#sn-auth-gsi{display:flex;justify-content:center;min-height:44px;margin:0 0 14px}' +
      '#sn-auth-card .sn-auth-note{font-size:11px;color:#6a8aaa;margin:0 0 12px;line-height:1.4}' +
      '#sn-auth-card .sn-auth-close{background:transparent;border:1px solid rgba(138,180,217,.25);color:#8ab4d9;' +
      'border-radius:999px;padding:8px 18px;font-size:12px;cursor:pointer}' +
      '#sn-auth-card .sn-auth-close:hover{border-color:#3d9eff;color:#cfe8ff}' +
      '#sn-auth-card .sn-auth-err{font-size:12px;color:#ff8a8a;margin:10px 0 0;min-height:1.2em}';
    document.head.appendChild(st);
  }

  function closeModal() {
    if (A._modal) {
      A._modal.hidden = true;
    }
  }

  function openModal(errText) {
    ensureModalStyles();
    const b = brand();
    if (!A._modal) {
      const root = document.createElement('div');
      root.id = 'sn-auth-modal';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Sign in to ASTRANOV');
      root.innerHTML =
        '<div id="sn-auth-card">' +
        '<div class="sn-auth-mark">ASTRANOV</div>' +
        '<h2>Sign in</h2>' +
        '<p class="sn-auth-domain">' +
        b.domain +
        '</p>' +
        '<p class="sn-auth-copy">You are signing in to <b>ASTRANOV</b> on <b>' +
        b.domain +
        '</b>. Google will only show this site — not any third-party project host.</p>' +
        '<div id="sn-auth-gsi"></div>' +
        '<p class="sn-auth-note">Secure Google · stays on ' +
        b.domain +
        '</p>' +
        '<button type="button" class="sn-auth-close" id="sn-auth-close">Cancel</button>' +
        '<p class="sn-auth-err" id="sn-auth-err"></p>' +
        '</div>';
      root.addEventListener('click', function (ev) {
        if (ev.target === root) closeModal();
      });
      document.body.appendChild(root);
      A._modal = root;
      root.querySelector('#sn-auth-close')?.addEventListener('click', closeModal);
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && A._modal && !A._modal.hidden) closeModal();
      });
    }
    A._modal.hidden = false;
    const errEl = document.getElementById('sn-auth-err');
    if (errEl) errEl.textContent = errText ? scrub(errText) : '';
    return document.getElementById('sn-auth-gsi');
  }

  function initGis(callback) {
    global.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: callback,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      itp_support: true,
      // FedCM can hide the prompt on some browsers; button path is primary
      use_fedcm_for_prompt: false,
      // Branding hint for Google UI (app name still set in Google Cloud console)
    });
    A._gsiInit = true;
  }

  /**
   * Primary path: branded modal + Google button on THIS origin.
   * Uses signInWithIdToken — Google never redirects through *.supabase.co.
   * OAuth redirect fallback is intentionally disabled (ship-red / phishing face).
   */
  async function signInGoogleGis() {
    await ensureClient();
    await loadGsi();
    if (!global.google || !global.google.accounts || !global.google.accounts.id) {
      throw new Error('Google sign-in unavailable');
    }
    const b = brand();
    say('Sign in · ' + b.name + ' · ' + b.domain, 'ok');

    return new Promise(function (resolve, reject) {
      let settled = false;
      function done(err, data) {
        if (settled) return;
        settled = true;
        if (err) {
          closeModal();
          reject(err);
        } else resolve(data);
      }

      async function onCredential(resp) {
        try {
          if (!resp || !resp.credential) {
            done(new Error('Sign-in cancelled'));
            return;
          }
          say('Signing in to astranov.eu…', 'dim');
          const data = await completeIdToken(resp.credential);
          done(null, data);
        } catch (e) {
          const raw = String((e && e.message) || e || '');
          if (/invalid_client|origin|401|registered|FedCM|NotAllowed/i.test(raw)) {
            const help = originHelp();
            const errEl = document.getElementById('sn-auth-err');
            if (errEl) errEl.textContent = scrub(help);
            done(new Error(help));
          } else {
            const errEl = document.getElementById('sn-auth-err');
            if (errEl) errEl.textContent = scrub(raw);
            done(e);
          }
        }
      }

      try {
        initGis(onCredential);
      } catch (eInit) {
        done(eInit);
        return;
      }

      // Always show branded modal with official Google button (origin = astranov.eu)
      const mount = openModal();
      if (mount) {
        mount.innerHTML = '';
        try {
          global.google.accounts.id.renderButton(mount, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          });
        } catch (eBtn) {
          done(eBtn);
          return;
        }
      }

      // Optional One Tap on top of button (same origin — no redirect)
      try {
        global.google.accounts.id.prompt(function (notification) {
          if (!notification) return;
          try {
            if (notification.isNotDisplayed && notification.isNotDisplayed()) {
              const reason =
                (notification.getNotDisplayedReason && notification.getNotDisplayedReason()) ||
                '';
              if (/invalid_client|unregistered_origin|origin/i.test(String(reason))) {
                const help = originHelp();
                const errEl = document.getElementById('sn-auth-err');
                if (errEl) errEl.textContent = help;
              }
              // Button remains — do NOT fall back to OAuth redirect
            }
          } catch (_) {}
        });
      } catch (_) {
        /* button is enough */
      }

      // If user closes modal without signing in, settle after they click cancel
      const closeBtn = document.getElementById('sn-auth-close');
      if (closeBtn) {
        const onCancel = function () {
          closeBtn.removeEventListener('click', onCancel);
          if (!settled) done(new Error('Sign-in cancelled'));
        };
        closeBtn.addEventListener('click', onCancel);
      }
    });
  }

  /**
   * HARD BAN on redirect OAuth through Supabase project host.
   * That path shows lkoatrkhuigdolnjsbie.supabase.co on Google → users flee.
   * Only re-enable if custom domain health is true AND preferCustomAuth is forced.
   */
  async function signInGoogleOAuthFallback() {
    const customOk = await probeCustomAuth();
    if (!customOk || cfg().preferCustomAuth !== true) {
      throw new Error(
        'Sign in uses Google on astranov.eu only. Full-page redirect is off (prevents third-party project names). Use the Google button on the sign-in card.'
      );
    }
    // Custom domain live: OAuth callback is api.astranov.eu — brand-safe
    const c = await ensureClient();
    const b = brand();
    const redirectTo = (location.origin || b.site).replace(/\/$/, '') + '/';
    say('Sign in · Google · ' + b.domain, 'ok');
    const { error } = await c.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      const raw = scrub(error.message || error);
      if (/invalid_client|origin|redirect/i.test(raw)) throw new Error(originHelp());
      throw new Error(raw);
    }
    return null;
  }

  async function signInGoogle() {
    // Never auto-chain into supabase OAuth face
    return signInGoogleGis();
  }

  async function signOut() {
    if (!A.client) await ensureClient();
    await A.client.auth.signOut();
    A.user = null;
    paint();
  }

  async function toggle() {
    if (A.user) {
      await signOut();
      say('Signed out · astranov.eu', 'ok');
    } else {
      try {
        await signInGoogle();
      } catch (e) {
        const msg = scrub(e && e.message ? e.message : e);
        if (!/cancelled/i.test(msg)) say(msg, 'err');
        throw new Error(msg);
      }
    }
  }

  async function authHeaders() {
    const h = {
      'Content-Type': 'application/json',
      apikey: cfg().sbKey || global.SB_KEY,
    };
    try {
      await ensureClient();
      const { data } = await A.client.auth.getSession();
      const tok = data?.session?.access_token;
      h.Authorization = tok
        ? 'Bearer ' + tok
        : 'Bearer ' + (cfg().sbKey || global.SB_KEY);
    } catch (_) {
      h.Authorization = 'Bearer ' + (cfg().sbKey || global.SB_KEY);
    }
    return h;
  }

  function authHeadersSync() {
    const h = {
      'Content-Type': 'application/json',
      apikey: cfg().sbKey || global.SB_KEY,
    };
    try {
      // best-effort from local storage session
      const raw = localStorage.getItem('astranov_auth_v3') || localStorage.getItem('astranov_auth_v2');
      if (raw) {
        const j = JSON.parse(raw);
        const tok = j?.access_token || j?.currentSession?.access_token;
        if (tok) h.Authorization = 'Bearer ' + tok;
      }
    } catch (_) {}
    if (!h.Authorization) h.Authorization = 'Bearer ' + (cfg().sbKey || global.SB_KEY);
    return h;
  }

  function init() {
    if (A._bound) return;
    A._bound = true;
    document.getElementById('btn-login')?.addEventListener('click', () => {
      void toggle().catch(() => {});
    });
    // Preload GSI + probe custom domain (non-blocking)
    void loadGsi().catch(() => {});
    void probeCustomAuth();
    ensureClient()
      .then(async () => {
        try {
          const { data, error } = await A.client.auth.getSession();
          if (error) throw error;
          A.user = data?.session?.user || null;
          if (A.user) applyUser(A.user);
          try {
            if (location.search || location.hash) {
              // Strip oauth codes/errors; never leave supabase-looking junk in URL
              let q = (location.search || '')
                .replace(/[?&](code|error|error_description|state|provider)=[^&]*/gi, '')
                .replace(/\?&/, '?')
                .replace(/\?$/, '');
              let hash = (location.hash || '')
                .replace(/#.*access_token[^&]*/gi, '')
                .replace(/[&#](access_token|refresh_token|token_type|expires_in|provider_token)=[^&]*/gi, '');
              if (hash === '#' || hash === '') hash = '';
              history.replaceState(null, '', (location.pathname || '/') + q + hash);
            }
          } catch (_) {}
          paint();
        } catch (_) {
          paint();
        }
      })
      .catch(() => {
        A.ready = true;
        paint();
      });
  }

  global.SNAuth = {
    init,
    toggle,
    signInGoogle,
    signInGoogleGis,
    /** Exported but blocked unless custom domain healthy */
    signInGoogleOAuthFallback,
    signOut,
    authHeaders,
    authHeadersSync,
    ensureClient,
    scrub,
    originHelp,
    openModal,
    closeModal,
    probeCustomAuth,
    GOOGLE_CLIENT_ID,
    get user() {
      return A.user;
    },
    get ready() {
      return A.ready;
    },
    get session() {
      return null;
    },
  };
})(window);
