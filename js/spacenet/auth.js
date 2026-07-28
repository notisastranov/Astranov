/* SpaceNet auth lite — Google via Supabase (lazy SDK) */
(function (global) {
  'use strict';

  const A = {
    client: null,
    user: null,
    ready: false,
  };

  function cfg() {
    return global.SN_CONFIG || {};
  }

  function headers() {
    const h = {
      'Content-Type': 'application/json',
      apikey: cfg().sbKey || global.SB_KEY,
    };
    if (A.client) {
      /* filled async */
    }
    return h;
  }

  async function ensureClient() {
    if (A.client) return A.client;
    if (typeof supabase === 'undefined') throw new Error('auth SDK not loaded');
    const url = cfg().sbUrl || global.SB_URL;
    const key = cfg().sbKey || global.SB_KEY;
    A.client = supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
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
      A.user?.user_metadata?.full_name ||
      A.user?.email?.split?.('@')?.[0] ||
      null;
    if (btn) {
      btn.textContent = A.user ? '✓' : '🔐';
      btn.title = A.user
        ? 'Signed in as ' + (name || 'user') + ' · click to sign out'
        : 'Sign in with Google';
      btn.classList.toggle('in', !!A.user);
    }
    if (chip) {
      chip.textContent = name ? name.slice(0, 18) : '';
      chip.hidden = !name;
    }
    try {
      global.SNCli?.preview?.(
        A.user ? 'Signed in · ' + (name || 'user') : 'Guest · Astranov SpaceNet menu · sign in'
      );
    } catch (_) {}
    try {
      if (global.SNHome && SNHome.openState && SNHome.paint) SNHome.paint();
    } catch (_) {}
  }

  async function signInGoogle() {
    const c = await ensureClient();
    // Must match Supabase Auth → URL Configuration → Redirect URLs
    const origin = location.origin || 'https://astranov.eu';
    const redirectTo = origin.replace(/\/$/, '') + '/';
    const { error } = await c.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (error) throw error;
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
      global.SNCli?.log?.('Signed out', 'dim');
    } else {
      global.SNCli?.log?.('Opening Google sign-in…', 'dim');
      await signInGoogle();
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
      h.Authorization = tok ? 'Bearer ' + tok : 'Bearer ' + (cfg().sbKey || global.SB_KEY);
    } catch (_) {
      h.Authorization = 'Bearer ' + (cfg().sbKey || global.SB_KEY);
    }
    return h;
  }

  function init() {
    if (A._bound) return;
    A._bound = true;
    document.getElementById('btn-login')?.addEventListener('click', () => {
      void toggle().catch((e) => global.SNCli?.log?.(String(e.message || e), 'err'));
    });
    // Session restore + OAuth return (PKCE code in URL)
    ensureClient()
      .then(async () => {
        try {
          // After Google Continue → redirect lands with ?code= or #access_token
          const { data, error } = await A.client.auth.getSession();
          if (error) throw error;
          A.user = data?.session?.user || null;
          if (A.user) {
            global.SNCli?.log?.(
              'Signed in · ' +
                (A.user.user_metadata?.full_name || A.user.email || 'user'),
              'ok'
            );
            // Sync profile name from Google
            try {
              const me = global.SNProfiles?.me?.();
              if (me && A.user) {
                const nm = A.user.user_metadata?.full_name || A.user.email?.split('@')[0];
                if (nm) {
                  me.name = nm;
                  if (A.user.user_metadata?.avatar_url) me.avatar = A.user.user_metadata.avatar_url;
                  if (A.user.email) me.handle = '@' + A.user.email.split('@')[0];
                  global.SNProfiles.upsert(me);
                }
              }
            } catch (_) {}
          }
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
    get user() {
      return A.user;
    },
    get ready() {
      return A.ready;
    },
  };
})(window);
