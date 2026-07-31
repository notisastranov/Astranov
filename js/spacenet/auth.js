/* Astranov auth — Google via GIS id_token (brand: astranov.eu, not supabase host) */
(function (global) {
  'use strict';

  const A = {
    client: null,
    user: null,
    ready: false,
    _gsiReady: null,
    _gsiInit: false,
  };

  /** Public Google OAuth client — must match Google Cloud app branded ASTRANOV / astranov.eu */
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
    };
  }

  /** Never show supabase project host in user-facing strings */
  function scrub(text) {
    return String(text || '')
      .replace(/https?:\/\/[a-z0-9-]+\.supabase\.co[^\s]*/gi, 'astranov.eu')
      .replace(/[a-z0-9]{15,}\.supabase\.co/gi, 'astranov.eu')
      .replace(/\bsupabase\b/gi, 'Astranov');
  }

  function authBaseUrl() {
    const custom = (cfg().brand && cfg().brand.authHost) || cfg().authHost || 'https://api.astranov.eu';
    const direct = cfg().sbUrl || global.SB_URL || '';
    // Prefer custom domain when configured; client still needs working Supabase project
    if (cfg().preferCustomAuth === true && custom) return custom.replace(/\/$/, '');
    return String(direct).replace(/\/$/, '');
  }

  async function ensureClient() {
    if (A.client) return A.client;
    if (typeof supabase === 'undefined') throw new Error('auth SDK not loaded');
    const url = authBaseUrl();
    const key = cfg().sbKey || global.SB_KEY;
    A.client = supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'astranov_auth_v2',
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
        ? 'Signed in as ' + (name || 'user') + ' · click to sign out'
        : 'Sign in with Google · astranov.eu';
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
          : 'Guest · sign in at astranov.eu'
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
        reject(new Error('Google sign-in script failed'));
      };
      document.head.appendChild(s);
    });
    return A._gsiReady;
  }

  /**
   * Google Identity Services → Supabase signInWithIdToken.
   * User stays on Google account picker branded for the OAuth client (astranov.eu),
   * without opening authorize URL that displays *.supabase.co as redirect host.
   */
  async function signInGoogleGis() {
    await ensureClient();
    await loadGsi();
    if (!global.google || !global.google.accounts || !global.google.accounts.id) {
      throw new Error('Google sign-in unavailable');
    }
    const b = brand();
    global.SNCli?.log?.('Sign in · ' + b.name + ' · ' + b.domain, 'ok');

    return new Promise(function (resolve, reject) {
      let settled = false;
      function done(err, data) {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve(data);
      }

      if (!A._gsiInit) {
        A._gsiInit = true;
        global.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async function (resp) {
            try {
              if (!resp || !resp.credential) {
                done(new Error('Google sign-in cancelled'));
                return;
              }
              global.SNCli?.log?.('Signing in to astranov.eu…', 'dim');
              const { data, error } = await A.client.auth.signInWithIdToken({
                provider: 'google',
                token: resp.credential,
              });
              if (error) throw error;
              A.user = data?.user || data?.session?.user || null;
              paint();
              if (A.user) {
                try {
                  const me = global.SNProfiles?.me?.();
                  if (me) {
                    const nm =
                      A.user.user_metadata?.full_name || A.user.email?.split('@')[0];
                    if (nm) me.name = nm;
                    if (A.user.user_metadata?.avatar_url)
                      me.avatar = A.user.user_metadata.avatar_url;
                    if (A.user.email) me.handle = '@' + A.user.email.split('@')[0];
                    global.SNProfiles.upsert(me);
                  }
                } catch (_) {}
                global.SNCli?.log?.(
                  'Signed in · ' +
                    (A.user.user_metadata?.full_name || A.user.email || 'user') +
                    ' · astranov.eu',
                  'ok'
                );
              }
              done(null, data);
            } catch (e) {
              done(e);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          ux_mode: 'popup',
        });
      }

      // Prompt One Tap / account chooser (no supabase.co in the URL bar path)
      try {
        global.google.accounts.id.prompt(function (notification) {
          if (!notification) return;
          try {
            if (
              notification.isNotDisplayed &&
              notification.isNotDisplayed()
            ) {
              // Fallback: OAuth still used only if GIS prompt blocked
              void signInGoogleOAuthFallback().then(
                function (d) {
                  done(null, d);
                },
                function (e) {
                  done(e);
                }
              );
            } else if (
              notification.isSkippedMoment &&
              notification.isSkippedMoment()
            ) {
              void signInGoogleOAuthFallback().then(
                function (d) {
                  done(null, d);
                },
                function (e) {
                  done(e);
                }
              );
            }
          } catch (_) {}
        });
      } catch (e) {
        void signInGoogleOAuthFallback().then(
          function (d) {
            done(null, d);
          },
          function (err) {
            done(err || e);
          }
        );
      }
    });
  }

  /** Last-resort OAuth — still redirect back to astranov.eu (never leave user on supabase app) */
  async function signInGoogleOAuthFallback() {
    const c = await ensureClient();
    const b = brand();
    const redirectTo = (location.origin || b.site).replace(/\/$/, '') + '/';
    global.SNCli?.log?.(
      'Sign in · ' + b.name + ' · ' + b.domain + ' (secure handoff)',
      'ok'
    );
    const { error } = await c.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
        // Do not skip browser redirect — user returns to astranov.eu
      },
    });
    if (error) throw error;
    return null;
  }

  async function signInGoogle() {
    try {
      return await signInGoogleGis();
    } catch (e) {
      const msg = scrub(e && e.message ? e.message : e);
      global.SNCli?.log?.('GIS path · ' + msg + ' · trying handoff…', 'dim');
      return signInGoogleOAuthFallback();
    }
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
      global.SNCli?.log?.('Signed out · astranov.eu', 'dim');
    } else {
      global.SNCli?.log?.('Opening Google · astranov.eu…', 'dim');
      try {
        await signInGoogle();
      } catch (e) {
        throw new Error(scrub(e && e.message ? e.message : e));
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

  function init() {
    if (A._bound) return;
    A._bound = true;
    document.getElementById('btn-login')?.addEventListener('click', () => {
      void toggle().catch((e) =>
        global.SNCli?.log?.(scrub(String(e.message || e)), 'err')
      );
    });
    ensureClient()
      .then(async () => {
        try {
          const { data, error } = await A.client.auth.getSession();
          if (error) throw error;
          A.user = data?.session?.user || null;
          if (A.user) {
            global.SNCli?.log?.(
              'Signed in · ' +
                (A.user.user_metadata?.full_name || A.user.email || 'user') +
                ' · astranov.eu',
              'ok'
            );
            try {
              const me = global.SNProfiles?.me?.();
              if (me && A.user) {
                const nm =
                  A.user.user_metadata?.full_name || A.user.email?.split('@')[0];
                if (nm) me.name = nm;
                if (A.user.user_metadata?.avatar_url)
                  me.avatar = A.user.user_metadata.avatar_url;
                if (A.user.email) me.handle = '@' + A.user.email.split('@')[0];
                global.SNProfiles.upsert(me);
              }
            } catch (_) {}
          }
          // Clean OAuth junk from URL without showing supabase
          try {
            if (location.search || location.hash) {
              const clean =
                location.pathname +
                (location.search || '')
                  .replace(/[?&]code=[^&]*/g, '')
                  .replace(/[?&]error=[^&]*/g, '')
                  .replace(/\?&/, '?')
                  .replace(/\?$/, '');
              history.replaceState(null, '', clean || '/');
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
    signOut,
    authHeaders,
    ensureClient,
    scrub,
    GOOGLE_CLIENT_ID,
    get user() {
      return A.user;
    },
    get ready() {
      return A.ready;
    },
  };
})(window);
