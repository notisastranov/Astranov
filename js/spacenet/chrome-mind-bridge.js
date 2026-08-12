/**
 * SNMindBridge — in-app conversation + access tiers
 * =================================================
 * Talk inside SpaceNet to improve the OS through use.
 * Not money-only. Time and verification count as contribution.
 *
 * Tiers:
 *  - everyone: local collective mind, teach/train, ambient field, no key
 *  - verified: optional deep path through owner backend (key never in client)
 *  - owner: full mesh + can set bridge endpoint
 *
 * Build: 20260812040000-mind-bridge
 */
(function (global) {
  'use strict';
  var BUILD = '20260812040000-mind-bridge';
  if (global.__SN_MIND_BRIDGE === BUILD) return;
  global.__SN_MIND_BRIDGE = BUILD;

  var CFG_KEY = 'sn:mind-bridge-cfg-v1';
  var SESSION_KEY = 'sn:mind-session-v1';
  var USAGE_KEY = 'sn:mind-usage-v1';
  var HISTORY_KEY = 'sn:mind-history-v1';

  var S = {
    ready: false,
    talking: false,
    history: [],
    cfg: {
      bridgeUrl: '',
      publicFree: true,
      dailyFreeTurns: 40,
      verifiedDailyTurns: 200,
      requireVerifyForBridge: true,
    },
    usage: { day: '', turns: 0 },
    session: { verified: false, role: 'guest', id: '', name: '' },
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

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      S.cfg = Object.assign(S.cfg, c || {});
    } catch (_) {}
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
      if (Array.isArray(h)) S.history = h.slice(-40);
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
      localStorage.setItem(HISTORY_KEY, JSON.stringify(S.history.slice(-40)));
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
    if (isOwner()) return 9999;
    if (isVerified()) return S.cfg.verifiedDailyTurns || 200;
    return S.cfg.dailyFreeTurns || 40;
  }

  function canTakeTurn() {
    return S.usage.turns < turnLimit();
  }

  function noteTurn() {
    S.usage.turns = (S.usage.turns || 0) + 1;
    saveUsage();
  }

  function pushHist(role, text) {
    S.history.push({ role: role, text: String(text).slice(0, 800), t: Date.now() });
    if (S.history.length > 40) S.history = S.history.slice(-40);
    saveHistory();
  }

  async function localAnswer(msg) {
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
    try {
      if (global.SNFreeAI && SNFreeAI.reply) {
        var c = await SNFreeAI.reply(msg);
        if (c) return String(c);
      }
    } catch (_) {}
    return (
      'Local collective mind · free for everyone. ' +
      'Teach: teach Q = A. Interests: interest …. Laws: law …. ' +
      'Deep Grok opens when owner bridge is live and you are verified. ' +
      'You said: “' +
      String(msg).slice(0, 120) +
      '”.'
    );
  }

  async function bridgeAnswer(msg) {
    var url = (S.cfg.bridgeUrl || '').trim();
    if (!url) return null;
    if (S.cfg.requireVerifyForBridge && !isVerified()) return null;
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: msg,
          session: {
            id: S.session.id || '',
            role: S.session.role || 'guest',
            verified: isVerified(),
            name: S.session.name || '',
          },
          history: S.history.slice(-12),
          context: {
            os: 'Astranov SpaceNet',
            build: BUILD,
          },
        }),
        credentials: 'omit',
        mode: 'cors',
      });
      if (!res.ok) throw new Error('bridge ' + res.status);
      var j = await res.json();
      if (j && (j.text || j.reply || j.message)) return String(j.text || j.reply || j.message);
    } catch (e) {
      log('Bridge soft-fail · ' + String(e && e.message ? e.message : e).slice(0, 80), 'dim');
    }
    return null;
  }

  async function talk(msg, opts) {
    opts = opts || {};
    msg = String(msg || '').trim();
    if (!msg) return null;
    if (!canTakeTurn() && !isOwner()) {
      var lim =
        'Daily mind turns used (' +
        turnLimit() +
        '). Tomorrow, or verify as contributor for a higher free ceiling. Time is the other currency.';
      log(lim, 'dim');
      return lim;
    }
    pushHist('user', msg);
    noteTurn();
    preview('Thinking…');

    var answer = null;
    if (S.cfg.bridgeUrl && isVerified()) answer = await bridgeAnswer(msg);
    if (!answer) answer = await localAnswer(msg);

    pushHist('assistant', answer);
    if (!opts.silent) {
      log(String(answer).slice(0, 400), 'ok');
      preview(String(answer).slice(0, 80));
    }
    try {
      if (global.SNChromeHelper && SNChromeHelper.speak && opts.speak !== false) {
        SNChromeHelper.speak(String(answer).slice(0, 160), { ms: 8000, voice: false });
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
    log('Verified · contributor access · higher free mind ceiling', 'ok');
  }

  function status() {
    log('════ MIND BRIDGE ════', 'ok');
    log(
      'Mode · ' +
        (S.cfg.bridgeUrl ? 'local + owner bridge' : 'local collective only') +
        ' · role ' +
        (S.session.role || 'guest') +
        (isVerified() ? ' · verified' : ' · open free'),
      'ok'
    );
    log(
      'Turns today · ' + S.usage.turns + ' / ' + turnLimit() + ' · public free ' + (S.cfg.publicFree ? 'yes' : 'no'),
      'dim'
    );
    log('Philosophy · time is payment · teach improves the OS · bots blocked by verify + limits', 'ok');
    if (!S.cfg.bridgeUrl) {
      log('Owner: mind bridge set https://your-server/chat  (paid key stays on server)', 'dim');
    }
    preview('Mind · live');
  }

  function handleLine(raw) {
    var line = String(raw || '').trim();
    var low = line.toLowerCase();
    if (!low) return false;

    if (low === 'mind' || low === 'talk' || low === 'chat' || low === 'mind status') {
      status();
      return true;
    }
    if (low === 'talk on' || low === 'chat on' || low === 'mind on') {
      S.talking = true;
      log('Talk mode ON · normal sentences go to the mind. talk off to exit.', 'ok');
      return true;
    }
    if (low === 'talk off' || low === 'chat off' || low === 'mind off') {
      S.talking = false;
      log('Talk mode OFF', 'dim');
      return true;
    }
    if (/^mind bridge set\s+/i.test(line) || /^bridge set\s+/i.test(line)) {
      if (!isOwner()) {
        log('Only owner can set the deep bridge URL', 'err');
        return true;
      }
      S.cfg.bridgeUrl = line.replace(/^(mind\s+)?bridge set\s+/i, '').trim();
      saveCfg();
      log('Bridge set · key stays on server · client never sees it', 'ok');
      return true;
    }
    if (low === 'mind bridge clear' || low === 'bridge clear') {
      if (!isOwner()) return true;
      S.cfg.bridgeUrl = '';
      saveCfg();
      log('Bridge cleared · local collective only', 'dim');
      return true;
    }
    if (low === 'verify me' || low === 'i contribute' || low === 'contributor') {
      setVerified({ role: 'contributor', name: 'contributor' });
      log('Contributor path · you pay with time and care. Abuse will be cut.', 'ok');
      return true;
    }
    if (/^say\s+/i.test(line) || /^ask\s+/i.test(line) || /^mind\s+/i.test(line)) {
      void talk(line.replace(/^(say|ask|mind)\s+/i, '').trim());
      return true;
    }

    if (S.talking) {
      if (
        /^(locate|gps|power|call|video|hang|polygon|poly|global|city|map|shops|layers|send|market|offer|install|login|cancel|clear|drive|pilot|youtube|interest|law|teach|train|export|collective|ambient|forget)\b/i.test(
          low
        )
      ) {
        return false;
      }
      void talk(line);
      return true;
    }
    return false;
  }

  function installCli() {
    if (!global.SNCli || typeof SNCli.run !== 'function') return;
    if (SNCli._snMindBridgeHook) return;
    SNCli._snMindBridgeHook = true;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      try {
        if (handleLine(raw)) return Promise.resolve(true);
      } catch (_) {}
      return prev(raw);
    };
  }

  function patchHelper() {
    try {
      if (!global.SNChromeHelper || SNChromeHelper._mindPatched) return;
      SNChromeHelper._mindPatched = true;
      var prev = SNChromeHelper.activate && SNChromeHelper.activate.bind(SNChromeHelper);
      SNChromeHelper.activate = function () {
        S.talking = true;
        log('Silver · talk mode · type or speak. We improve the OS from inside.', 'ok');
        if (prev) return prev();
      };
    } catch (_) {}
  }

  function init() {
    if (S.ready) {
      installCli();
      return;
    }
    S.ready = true;
    load();
    installCli();
    patchHelper();
    setTimeout(installCli, 1200);
    setTimeout(patchHelper, 2000);
    setTimeout(installCli, 4000);
    setTimeout(function () {
      log('Mind bridge · free local collective for all · verify for higher ceiling', 'dim');
    }, 6500);
  }

  global.SNMindBridge = {
    build: BUILD,
    init: init,
    talk: talk,
    status: status,
    setVerified: setVerified,
    isVerified: isVerified,
    isOwner: isOwner,
    handleLine: handleLine,
    get talking() {
      return S.talking;
    },
    set talking(v) {
      S.talking = !!v;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }
})(typeof window !== 'undefined' ? window : globalThis);
