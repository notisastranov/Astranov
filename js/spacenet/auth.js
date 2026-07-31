/* Astranov auth — Google via GIS id_token (brand: astranov.eu only) */
(function (global) {
  'use strict';

  const A = {
    client: null,
    user: null,
    ready: false,
    _gsiReady: null,
    _gsiInit: false,
  };

  /** Public Google OAuth client — must list https://astranov.eu as Authorized JavaScript origin */
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

  function scrub(text) {
    return String(text || '')
      .replace(/https?:\/\/[a-z0-9-]+\.supabase\.co[^\s]*/gi, 'astranov.eu')
      .replace(/[a-z0-9]{15,}\.supabase\.co/gi, 'astranov.eu')
      .replace(/\bsupabase\b/gi, 'Astranov')
      .replace(/\binvalid_client\b/gi, 'Google app not configured for this site')
      .replace(/\bno registered origin\b/gi, 'site origin not registered in Google');
  }

  function say(msg, cls) {
    try {
      if (global.SNCli) {
        if (SNCli.beginTurn && !SNCli.inTurn?.()) {
          SNCli.beginTurn();
          try {
            SNCli.log(msg, cls || 'ok');
          } finally {
            SNCli.endTurn();
          }
        } else if (SNCli.log) {
          SNCli.log(msg, cls || 'ok', true);
        }
      }
    } catch (_) {}
  }

  function authBaseUrl() {
    const custom = (cfg().brand && cfg().brand.authHost) || cfg().authHost || 'https://api.astranov.eu';
    const direct = cfg().sbUrl || global.SB_URL || '';
    if (cfg().preferCustomAuth === true && custom) return custom.replace(/\/$/, '');
    return String(direct).replace(/\/$/, '');
  }

  async function ensureClient() {
    if (A.client) return A.client;
    if (typeof supabase === 'undefined') throw new Error('Auth not loaded yet · wait a moment');
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
          : 'Guest · tap User to sign in'
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
        reject(new Error('Google sign-in script blocked · check network'));
      };
      document.head.appendChild(s);
    });
    return A._gsiReady;
  }

  function originHelp() {
    const origin = (location.origin || 'https://astranov.eu').replace(/\/$/, '');
    return (
      'Google blocked this site. In Google Cloud → Credentials → OAuth client, add Authorized JavaScript origin: ' +
      origin +
      ' (and https://www.astranov.eu if used). Then hard refresh.'
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
    if (error) throw error;
    applyUser(data?.user || data?.session?.user || null);
    if (A.user) {
      say(
        'Signed in · ' + (A.user.user_metadata?.full_name || A.user.email || 'user') + ' · astranov.eu',
        'ok'
      );
    }
    return data;
  }

  /**
   * Google Identity Services → Supabase signInWithIdToken.
   * Origin https://astranov.eu MUST be registered on the OAuth client.
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
        if (err) reject(err);
        else resolve(data);
      }

      // Always re-init with current origin (avoids stale GIS state)
      try {
        global.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async function (resp) {
            try {
              if (!resp || !resp.credential) {
                done(new Error('Google sign-in cancelled'));
                return;
              }
              say('Signing in to astranov.eu…', 'dim');
              const data = await completeIdToken(resp.credential);
              done(null, data);
            } catch (e) {
              const raw = String((e && e.message) || e || '');
              if (/invalid_client|origin|401|registered/i.test(raw)) {
                done(new Error(originHelp()));
              } else {
                done(e);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });
        A._gsiInit = true;
      } catch (eInit) {
        done(eInit);
        return;
      }

      try {
        global.google.accounts.id.prompt(function (notification) {
          if (!notification) return;
          try {
            // Google surfaces origin errors here when prompt cannot display
            if (notification.isNotDisplayed && notification.isNotDisplayed()) {
              const reason =
                (notification.getNotDisplayedReason && notification.getNotDisplayedReason()) ||
                '';
              if (/origin|invalid_client|unregistered/i.test(String(reason))) {
                done(new Error(originHelp()));
                return;
              }
              // User dismissed or browser blocked One Tap → try OAuth redirect
              void signInGoogleOAuthFallback().then(
                function (d) {
                  done(null, d);
                },
                function (e) {
                  done(e);
                }
              );
            } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
              void signInGoogleOAuthFallback().then(
                function (d) {
                  done(null, d);
                },
                function (e) {
                  done(e);
                }
              );
            } else if (notification.isDismissedMoment && notification.isDismissedMoment()) {
              // User closed chooser — do not auto-fallback spam
              done(new Error('Sign-in cancelled'));
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

  async function signInGoogleOAuthFallback() {
    const c = await ensureClient();
    const b = brand();
    const redirectTo = (location.origin || b.site).replace(/\/$/, '') + '/';
    say('Sign in · opening Google for ' + b.domain + '…', 'ok');
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
      const raw = String(error.message || error);
      if (/invalid_client|origin|redirect/i.test(raw)) throw new Error(originHelp());
      throw error;
    }
    return null;
  }

  async function signInGoogle() {
    try {
      return await signInGoogleGis();
    } catch (e) {
      const msg = scrub(e && e.message ? e.message : e);
      if (/Authorized JavaScript origin|Google blocked|not registered/i.test(msg)) {
        throw new Error(msg);
      }
      say('Trying alternate Google handoff…', 'dim');
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
      say('Signed out · astranov.eu', 'ok');
    } else {
      try {
        await signInGoogle();
      } catch (e) {
        const msg = scrub(e && e.message ? e.message : e);
        say(msg, 'err');
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

  function init() {
    if (A._bound) return;
    A._bound = true;
    document.getElementById('btn-login')?.addEventListener('click', () => {
      void toggle().catch(() => {});
    });
    ensureClient()
      .then(async () => {
        try {
          const { data, error } = await A.client.auth.getSession();
          if (error) throw error;
          A.user = data?.session?.user || null;
          if (A.user) {
            applyUser(A.user);
          }
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
    originHelp,
    GOOGLE_CLIENT_ID,
    get user() {
      return A.user;
    },
    get ready() {
      return A.ready;
    },
  };
})(window);
