/**
 * SNMindBridge — always-on · wired to owner backend (ai-router)
 * ============================================================
 * Default deep path: Supabase functions/v1/ai-router
 * Keys never leave the server. Free providers first.
 * Paid XAI only when server says architect + free tier exhausted.
 * Client rate limits + identity so bots cannot drain.
 *
 * Build: 20260812043000-backend-wired
 */
(function (global) {
  'use strict';
  var BUILD = '20260812043000-backend-wired';
  if (global.__SN_MIND_BRIDGE === BUILD) return;
  global.__SN_MIND_BRIDGE = BUILD;

  var CFG_KEY = 'sn:mind-bridge-cfg-v1';
  var SESSION_KEY = 'sn:mind-session-v1';
  var USAGE_KEY = 'sn:mind-usage-v1';
  var HISTORY_KEY = 'sn:mind-history-v1';
  var COOLDOWN_KEY = 'sn:mind-cooldown-v1';

  var RESERVED =
    /^(locate|gps|power(\s+on|\s+off)?|call|video|hang(\s*up)?|polygon|poly|global|city|map|shops|layers|send|market|offer|offers|install|login|user|cancel|clear|drive|pilot|youtube|yt|radar|routes?|simulate|accept|decline|mute|cam|button|ribbon)\b/i;

  function defaultBridgeUrl() {
    try {
      var base =
        (global.SN_CONFIG && SN_CONFIG.sbUrl) ||
        global.SB_URL ||
        'https://lkoatrkhuigdolnjsbie.supabase.co';
      return String(base).replace(/\/$/, '') + '/functions/v1/ai-router';
    } catch (_) {
      return 'https://lkoatrkhuigdolnjsbie.supabase.co/functions/v1/ai-router';
    }
  }

  function anonKey() {
    try {
      return (global.SN_CONFIG && SN_CONFIG.sbKey) || global.SB_KEY || '';
    } catch (_) {
      return '';
    }
  }

  function userAccessToken() {
    try {
      if (global.SNAuth && SNAuth.session && SNAuth.session.access_token)
        return SNAuth.session.access_token;
      var raw = localStorage.getItem('sb-lkoatrkhuigdolnjsbie-auth-token');
      if (raw) {
        var j = JSON.parse(raw);
        if (j && j.access_token) return j.access_token;
        if (j && j.currentSession && j.currentSession.access_token)
          return j.currentSession.access_token;
      }
    } catch (_) {}
    return '';
  }

  var S = {
    ready: false,
    listening: true,
    history: [],
    cfg: {
      bridgeUrl: '',
      publicFree: true,
      dailyFreeTurns: 48,
      verifiedDailyTurns: 200,
      ownerDailyTurns: 2000,
      minGapMs: 1200,
      requireVerifyForBridge: false,
    },
    usage: { day: '', turns: 0 },
    session: { verified: false, role: 'guest', id: '', name: '', email: '' },
    lastCallAt: 0,
  };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 280), c || 'ok');
    } catch (_) {}
  }
  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(String(m).slice(0, 90));
    } catch (_) {}
  }
  function expandCli() {
    try {
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed', 'cli-quiet');
        panel.classList.add('mid');
      }
    } catch (_) {}
  }

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      S.cfg = Object.assign(S.cfg, c || {});
    } catch (_) {}
    if (!S.cfg.bridgeUrl) S.cfg.bridgeUrl = defaultBridgeUrl();
    try {
      var u = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
      S.usage = Object.assign(S.usage, u || {});
    } catch (_) {}
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      S.session = Object.assign(S.session, s || {});
    } catch (_) {}
    try {
      var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(h)) S.history = h.slice(-48);
    } catch (_) {}
    try {
      S.lastCallAt = Number(localStorage.getItem(COOLDOWN_KEY) || 0) || 0;
    } catch (_) {}
    var day = new Date().toISOString().slice(0, 10);
    if (S.usage.day !== day) {
      S.usage = { day: day, turns: 0 };
      saveUsage();
    }
  }

  function saveCfg() {
    try {
      localStorage.setItem(
        CFG_KEY,
        JSON.stringify({
          bridgeUrl: S.cfg.bridgeUrl || '',
          publicFree: !!S.cfg.publicFree,
          dailyFreeTurns: S.cfg.dailyFreeTurns,
          verifiedDailyTurns: S.cfg.verifiedDailyTurns,
          ownerDailyTurns: S.cfg.ownerDailyTurns,
          minGapMs: S.cfg.minGapMs,
          requireVerifyForBridge: !!S.cfg.requireVerifyForBridge,
        })
      );
    } catch (_) {}
  }
  function saveUsage() {
    try {
      localStorage.setItem(USAGE_KEY, JSON.stringify(S.usage));
    } catch (_) {}
  }
  function saveSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(S.session));
    } catch (_) {}
  }
  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(S.history.slice(-48)));
    } catch (_) {}
  }

  function isOwner() {
    try {
      if (global.SNUser && SNUser.isOwner && SNUser.isOwner()) return true;
      if (global.SNAuth && SNAuth.isOwner && SNAuth.isOwner()) return true;
      var email = (S.session.email || (global.SNUser && SNUser.email) || '').toLowerCase();
      if (email === 'notisastranov@gmail.com') return true;
    } catch (_) {}
    return S.session.role === 'owner';
  }

  function isVerified() {
    if (isOwner()) return true;
    return !!S.session.verified || S.session.role === 'verified' || S.session.role === 'contributor';
  }

  function turnLimit() {
    if (isOwner()) return S.cfg.ownerDailyTurns || 2000;
    if (isVerified()) return S.cfg.verifiedDailyTurns || 200;
    return S.cfg.dailyFreeTurns || 48;
  }

  function canTakeTurn() {
    if (S.usage.turns >= turnLimit()) return false;
    var gap = S.cfg.minGapMs || 1200;
    if (Date.now() - S.lastCallAt < gap) return false;
    return true;
  }

  function noteTurn() {
    S.usage.turns = (S.usage.turns || 0) + 1;
    S.lastCallAt = Date.now();
    saveUsage();
    try {
      localStorage.setItem(COOLDOWN_KEY, String(S.lastCallAt));
    } catch (_) {}
  }

  function pushHist(role, text) {
    S.history.push({ role: role, text: String(text).slice(0, 900), t: Date.now() });
    if (S.history.length > 48) S.history = S.history.slice(-48);
    saveHistory();
  }

  function teachLocal(q, a) {
    try {
      if (global.SNCollectiveLayer && SNCollectiveLayer.teach) SNCollectiveLayer.teach(q, a);
    } catch (_) {}
    try {
      if (global.SNOmni && SNOmni.teach) SNOmni.teach(q, a, ['mind']);
    } catch (_) {}
    try {
      if (global.SNAstranovMind && SNAstranovMind.teach)
        SNAstranovMind.teach(q, a, ['mind', 'usage']);
    } catch (_) {}
  }

  async function localAnswer(msg) {
    var teachMatch = msg.match(
      /^(?:remember that|remember|learn that|learn)\s+(.+?)\s*(?:=|→|->|means)\s*(.+)$/i
    );
    if (teachMatch) {
      teachLocal(teachMatch[1].trim(), teachMatch[2].trim());
      return 'Learned · ' + teachMatch[1].trim().slice(0, 40);
    }
    try {
      if (global.SNOmni && SNOmni.ask) {
        var out = await SNOmni.ask(msg);
        if (out) return String(out);
      }
    } catch (_) {}
    try {
      if (global.SNAstranovMind && SNAstranovMind.answer) {
        var a = SNAstranovMind.answer(msg);
        if (a && a.text) return String(a.text);
      }
    } catch (_) {}
    try {
      if (global.SNAi && SNAi.ask) {
        var b = await SNAi.ask(msg, { source: 'mind-bridge', local: true });
        if (b) return String(b);
      }
    } catch (_) {}
    var low = msg.toLowerCase();
    if (/^(hi|hello|hey|γεια|ela)\b/.test(low))
      return 'I am here inside SpaceNet. Listening. Speak naturally.';
    if (/who are you|what are you/.test(low))
      return 'Astranov collective mind — free cycle for everyone, deeper path protected on the server.';
    return 'Local collective · backend quiet this turn. “' + String(msg).slice(0, 100) + '”;';
  }

  async function bridgeAnswer(msg) {
    var url = (S.cfg.bridgeUrl || defaultBridgeUrl()).trim();
    if (!url) return null;
    var key = anonKey();
    var tok = userAccessToken() || key;
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          apikey: key,
          Authorization: 'Bearer ' + tok,
        },
        body: JSON.stringify({
          text: msg,
          preferred_provider: 'astranov',
          level: 'personal',
          source: 'sn-mind-bridge',
          build: BUILD,
        }),
        credentials: 'omit',
        mode: 'cors',
      });
      if (res.status === 429) {
        log('Mind · rate limited · protecting the pool', 'dim');
        return 'Slow down a moment — the collective pool is protected.';
      }
      if (!res.ok) {
        var errT = await res.text().catch(function () {
          return '';
        });
        console.warn('[mind-bridge]', res.status, errT.slice(0, 120));
        return null;
      }
      var j = await res.json();
      if (j && j.paid_fallback && j.paid_notice) {
        log(String(j.paid_notice).slice(0, 120), 'dim');
      }
      if (j && (j.text || j.reply || j.message)) return String(j.text || j.reply || j.message);
    } catch (e) {
      console.warn('[mind-bridge]', e);
    }
    return null;
  }

  async function talk(msg, opts) {
    opts = opts || {};
    msg = String(msg || '').trim();
    if (!msg) return null;

    if (!canTakeTurn()) {
      if (S.usage.turns >= turnLimit() && !isOwner()) {
        var lim =
          'Daily mind turns used. Contribute for a higher free ceiling, or continue tomorrow.';
        if (!opts.silent) log(lim, 'dim');
        return lim;
      }
      await new Promise(function (r) {
        setTimeout(r, Math.max(50, (S.cfg.minGapMs || 1200) - (Date.now() - S.lastCallAt)));
      });
    }

    pushHist('user', msg);
    noteTurn();
    if (!opts.silent) {
      expandCli();
      preview('…');
    }

    var answer = await bridgeAnswer(msg);
    if (!answer) answer = await localAnswer(msg);

    pushHist('assistant', answer);
    if (!opts.silent) {
      log(String(answer).slice(0, 420), 'ok');
      preview(String(answer).slice(0, 80));
    }
    try {
      if (global.SNChromeHelper && SNChromeHelper.speak && opts.speak !== false) {
        SNChromeHelper.speak(String(answer).slice(0, 180), { ms: 9000, voice: false });
      }
    } catch (_) {}
    return answer;
  }

  function setVerified(profile) {
    profile = profile || {};
    S.session.verified = true;
    S.session.role = profile.role || 'contributor';
    S.session.id = profile.id || S.session.id || 'v-' + Date.now().toString(36);
    S.session.name = profile.name || S.session.name || '';
    S.session.email = profile.email || S.session.email || '';
    saveSession();
  }

  function looksConversational(line, low) {
    if (!line || line.length < 2) return false;
    if (RESERVED.test(low)) return false;
    if (/^(mind|verify me|i contribute|contributor|mind bridge|bridge set|bridge clear)\b/i.test(low))
      return false;
    if (/^(teach|train|interest|law|remember|export|collective|ambient|forget)\b/i.test(low))
      return false;
    if (/\?$/.test(line)) return true;
    if (
      /^(hi|hello|hey|γεια|ela|please|can you|could you|i want|i need|make|fix|change|why|how|what|who|where|when|show me|find|search|help)\b/i.test(
        low
      )
    )
      return true;
    if (line.split(/\s+/).length >= 2) return true;
    return false;
  }

  function handleLine(raw) {
    var line = String(raw || '').trim();
    var low = line.toLowerCase();
    if (!low) return false;

    if (low === 'mind' || low === 'mind status') {
      log(
        'Mind · backend ' +
          (S.cfg.bridgeUrl ? 'wired' : 'off') +
          ' · ' +
          (isOwner() ? 'architect' : isVerified() ? 'verified' : 'open free') +
          ' · turns ' +
          S.usage.turns +
          '/' +
          turnLimit(),
        'ok'
      );
      return true;
    }
    if (low === 'verify me' || low === 'i contribute' || low === 'contributor') {
      setVerified({ role: 'contributor', name: 'contributor' });
      log('Contributor · higher free ceiling', 'ok');
      return true;
    }
    if (/^mind bridge set\s+/i.test(line) || /^bridge set\s+/i.test(line)) {
      if (!isOwner()) {
        log('Only architect sets bridge URL', 'err');
        return true;
      }
      S.cfg.bridgeUrl = line.replace(/^(mind\s+)?bridge set\s+/i, '').trim();
      saveCfg();
      log('Bridge URL updated', 'ok');
      return true;
    }
    if (low === 'mind bridge clear' || low === 'bridge clear') {
      if (!isOwner()) return true;
      S.cfg.bridgeUrl = defaultBridgeUrl();
      saveCfg();
      return true;
    }

    if (S.listening && looksConversational(line, low)) {
      void talk(line);
      return true;
    }
    return false;
  }

  function installCli() {
    if (!global.SNCli || typeof SNCli.run !== 'function') return;
    if (SNCli._snMindBridgeHookV3) return;
    SNCli._snMindBridgeHookV3 = true;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      try {
        if (handleLine(raw)) return Promise.resolve(true);
      } catch (_) {}
      return prev(raw);
    };
  }

  function wireSilver() {
    try {
      if (!global.SNChromeHelper) return;
      if (SNChromeHelper._mindBridgeV3) return;
      SNChromeHelper._mindBridgeV3 = true;
      SNChromeHelper.ask = async function (message) {
        return await talk(message, { speak: true });
      };
      var prevAct = SNChromeHelper.activate && SNChromeHelper.activate.bind(SNChromeHelper);
      SNChromeHelper.activate = function () {
        S.listening = true;
        global.__SN_SILVER_ACTIVE = true;
        expandCli();
        if (prevAct) prevAct();
      };
    } catch (_) {}
  }

  function presencePing() {
    try {
      if (sessionStorage.getItem('sn:mind-presence-v3')) return;
      sessionStorage.setItem('sn:mind-presence-v3', '1');
    } catch (_) {}
    setTimeout(function () {
      try {
        expandCli();
        log('Mind · backend live · listening', 'dim');
      } catch (_) {}
    }, 5000);
  }

  function init() {
    if (S.ready) {
      installCli();
      wireSilver();
      return;
    }
    S.ready = true;
    S.listening = true;
    load();
    if (!S.cfg.bridgeUrl) {
      S.cfg.bridgeUrl = defaultBridgeUrl();
      saveCfg();
    }
    installCli();
    wireSilver();
    presencePing();
    setTimeout(installCli, 800);
    setTimeout(wireSilver, 1200);
    setTimeout(installCli, 2500);
    setTimeout(wireSilver, 3000);
    setTimeout(installCli, 6000);
  }

  global.SNMindBridge = {
    build: BUILD,
    init: init,
    talk: talk,
    setVerified: setVerified,
    isVerified: isVerified,
    isOwner: isOwner,
    handleLine: handleLine,
    get listening() {
      return S.listening;
    },
    set listening(v) {
      S.listening = !!v;
    },
    get bridgeUrl() {
      return S.cfg.bridgeUrl || defaultBridgeUrl();
    },
  };
  global.AstranovMindBridge = global.SNMindBridge;
  global.SNPresence = global.SNMindBridge;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 60);
    });
  } else setTimeout(init, 60);
  setTimeout(init, 1500);
})(typeof window !== 'undefined' ? window : globalThis);
