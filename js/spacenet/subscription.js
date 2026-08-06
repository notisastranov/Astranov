/**
 * SNSubscription — Astranov AI billing + Grok cycle
 *
 * Law (owner 2026-08-06):
 *  - All users need a monthly subscription for powerful AI.
 *  - Markup 3×: every €1 real xAI cost → €3 of user quota.
 *  - Base €3/mo includes €1 real API budget; then free models.
 *  - Tiers: €3 · €13 · €33 · €300 (API budgets €1 · €4.33 · €11 · €100).
 *  - Owner (notisastranov@gmail.com) always uses paid Grok immediately.
 *  - Owner API key (server-side only) funds every paid subscriber within budget.
 *  - Transcript of app AI use is stored to train Astranov Mind.
 *
 * CLI: plan · plans · subscribe 3|13|33|300 · plan status · usage ai · transcript
 * Never put XAI_API_KEY in this file.
 */
(function (global) {
  'use strict';

  var KEY = 'sn:sub-v1';
  var TX_KEY = 'sn:ai-transcript-v1';
  var MARKUP = 3;
  var ARCHITECT_EMAIL = 'notisastranov@gmail.com';

  /** priceEur → realApiBudgetEur (price / 3) */
  var TIERS = [
    {
      id: 'spark',
      priceEur: 3,
      apiBudgetEur: 1,
      label: 'Spark',
      note: 'Base · €1 real Grok · then free mind',
    },
    {
      id: 'pulse',
      priceEur: 13,
      apiBudgetEur: Math.round((13 / MARKUP) * 100) / 100,
      label: 'Pulse',
      note: 'More power · ~€4.33 real Grok',
    },
    {
      id: 'orbit',
      priceEur: 33,
      apiBudgetEur: 11,
      label: 'Orbit',
      note: 'Heavy use · €11 real Grok',
    },
    {
      id: 'nova',
      priceEur: 300,
      apiBudgetEur: 100,
      label: 'Nova',
      note: 'Pro · €100 real Grok on your sub',
    },
  ];

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'ok');
    } catch (_) {}
  }

  function now() {
    return Date.now();
  }

  function periodKey(d) {
    d = d || new Date();
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object') return s;
    } catch (_) {}
    return {
      tierId: null,
      priceEur: 0,
      apiBudgetEur: 0,
      period: periodKey(),
      spentApiEur: 0,
      subscribedAt: 0,
      active: false,
      paymentRef: null,
    };
  }

  function saveState(st) {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (_) {}
  }

  function rollPeriod(st) {
    var pk = periodKey();
    if (st.period !== pk) {
      st.period = pk;
      st.spentApiEur = 0;
      saveState(st);
    }
    return st;
  }

  function userEmail() {
    try {
      var u = global.SNAuth && SNAuth.user;
      if (u && u.email) return String(u.email).toLowerCase();
    } catch (_) {}
    try {
      var raw = localStorage.getItem('astranov_auth_v3') || localStorage.getItem('sn:auth-email');
      if (raw && raw.indexOf('@') > 0) return raw.toLowerCase();
      if (raw) {
        var j = JSON.parse(raw);
        var em =
          (j && j.user && j.user.email) ||
          (j && j.currentSession && j.currentSession.user && j.currentSession.user.email);
        if (em) return String(em).toLowerCase();
      }
    } catch (_) {}
    return '';
  }

  function isOwner() {
    var em = userEmail();
    if (em === ARCHITECT_EMAIL) return true;
    try {
      if (global.SNAuth && SNAuth.isOwner && SNAuth.isOwner()) return true;
    } catch (_) {}
    try {
      if (localStorage.getItem('sn:owner-session') === '1') return true;
    } catch (_) {}
    return false;
  }

  function tierByPrice(n) {
    n = Number(n);
    for (var i = 0; i < TIERS.length; i++) {
      if (TIERS[i].priceEur === n) return TIERS[i];
    }
    return null;
  }

  function tierById(id) {
    id = String(id || '').toLowerCase();
    for (var i = 0; i < TIERS.length; i++) {
      if (TIERS[i].id === id || String(TIERS[i].priceEur) === id) return TIERS[i];
    }
    return null;
  }

  function status() {
    var st = rollPeriod(loadState());
    var owner = isOwner();
    var remaining = Math.max(0, (st.apiBudgetEur || 0) - (st.spentApiEur || 0));
    return {
      owner: owner,
      active: owner || !!st.active,
      tierId: owner ? 'architect' : st.tierId,
      priceEur: owner ? 0 : st.priceEur,
      apiBudgetEur: owner ? Infinity : st.apiBudgetEur,
      spentApiEur: st.spentApiEur || 0,
      remainingApiEur: owner ? Infinity : remaining,
      period: st.period,
      markup: MARKUP,
      mode: owner
        ? 'owner-paid-unlimited'
        : remaining > 0 && st.active
          ? 'paid-grok'
          : st.active
            ? 'free-fallback'
            : 'no-sub-free-only',
      label: owner
        ? 'Architect · unlimited paid Grok'
        : st.active
          ? (st.tierId || 'sub') + ' · €' + remaining.toFixed(2) + ' API left'
          : 'No subscription · free mind only',
    };
  }

  /**
   * Can this turn use paid Grok (owner key on server)?
   */
  function canUsePaid() {
    var s = status();
    if (s.owner) return { ok: true, reason: 'owner', remaining: Infinity };
    if (!s.active) return { ok: false, reason: 'no_subscription', remaining: 0 };
    if (s.remainingApiEur <= 0.0001)
      return { ok: false, reason: 'quota_exhausted', remaining: 0 };
    return { ok: true, reason: 'subscriber', remaining: s.remainingApiEur };
  }

  /**
   * Estimate API € from tokens (rough). Default floor 0.002 € per call.
   * User-facing charge = apiEur * MARKUP but we only meter API budget.
   */
  function estimateApiEur(usage) {
    usage = usage || {};
    var inTok = Number(usage.prompt_tokens || usage.input_tokens || 0);
    var outTok = Number(usage.completion_tokens || usage.output_tokens || 0);
    // grok-class ~ $2/M in + $6/M out ≈ €1.85/M in + €5.55/M out — use €2/€6
    var eur = (inTok / 1e6) * 2 + (outTok / 1e6) * 6;
    if (!eur || !isFinite(eur)) {
      // flat estimate when provider omits usage
      eur = Number(usage.api_eur) || 0.004;
    }
    return Math.max(0.001, Math.round(eur * 10000) / 10000);
  }

  function recordSpend(apiEur, meta) {
    var st = rollPeriod(loadState());
    if (isOwner()) {
      // Owner unlimited — still transcript + track for ops
      trackTranscript('spend', {
        apiEur: apiEur,
        owner: true,
        meta: meta || {},
      });
      return { ok: true, owner: true, spent: st.spentApiEur, remaining: Infinity };
    }
    st.spentApiEur = Math.round(((st.spentApiEur || 0) + apiEur) * 10000) / 10000;
    saveState(st);
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('ai_api_spend', {
          apiEur: apiEur,
          spent: st.spentApiEur,
          budget: st.apiBudgetEur,
          period: st.period,
        });
    } catch (_) {}
    trackTranscript('spend', { apiEur: apiEur, spent: st.spentApiEur, meta: meta || {} });
    var rem = Math.max(0, st.apiBudgetEur - st.spentApiEur);
    return { ok: true, owner: false, spent: st.spentApiEur, remaining: rem };
  }

  function subscribe(priceOrId, opts) {
    opts = opts || {};
    var t = tierByPrice(priceOrId) || tierById(priceOrId);
    if (!t) {
      log('Plans: 3 · 13 · 33 · 300 €/mo', 'err');
      return { ok: false, error: 'unknown_tier' };
    }
    var st = {
      tierId: t.id,
      priceEur: t.priceEur,
      apiBudgetEur: t.apiBudgetEur,
      period: periodKey(),
      spentApiEur: 0,
      subscribedAt: now(),
      active: true,
      paymentRef: opts.paymentRef || 'local-demo-' + t.id + '-' + now(),
      demo: opts.demo !== false,
    };
    saveState(st);
    log(
      'Subscribed ' +
        t.label +
        ' · €' +
        t.priceEur +
        '/mo · API budget €' +
        t.apiBudgetEur +
        ' (3× markup) · then free models',
      'ok'
    );
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('subscribe', { tier: t.id, price: t.priceEur, api: t.apiBudgetEur });
    } catch (_) {}
    return { ok: true, tier: t, state: st };
  }

  function cancel() {
    var st = loadState();
    st.active = false;
    saveState(st);
    log('Subscription cancelled · free mind only', 'dim');
    return { ok: true };
  }

  function listPlans() {
    return TIERS.map(function (t) {
      return {
        id: t.id,
        priceEur: t.priceEur,
        apiBudgetEur: t.apiBudgetEur,
        userFacingApiValue: t.apiBudgetEur * MARKUP,
        label: t.label,
        note: t.note,
      };
    });
  }

  function printPlans() {
    log('— Astranov AI plans (markup 3×) —', 'ok');
    TIERS.forEach(function (t) {
      log(
        '€' +
          t.priceEur +
          '/mo · ' +
          t.label +
          ' · real Grok budget €' +
          t.apiBudgetEur +
          ' · then free · ' +
          t.note,
        'dim'
      );
    });
    var s = status();
    log('You: ' + s.label + ' · mode=' + s.mode, s.active || s.owner ? 'ok' : 'dim');
    if (s.owner) log('Owner path: paid Grok ON immediately (your key, server-side)', 'ok');
  }

  /* ── Transcript (training fuel) ── */
  function loadTx() {
    try {
      var a = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (_) {
      return [];
    }
  }

  function saveTx(a) {
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(a.slice(-500)));
    } catch (_) {}
  }

  function trackTranscript(kind, row) {
    var a = loadTx();
    a.push({
      t: now(),
      iso: new Date().toISOString(),
      kind: kind,
      email: userEmail() || null,
      owner: isOwner(),
      plan: status().tierId,
      row: row,
    });
    saveTx(a);
    // Feed mind when user/assistant pair
    try {
      if (
        kind === 'turn' &&
        row &&
        row.user &&
        row.assistant &&
        global.SNAstranovMind &&
        SNAstranovMind.learnInteraction
      ) {
        SNAstranovMind.learnInteraction(row.user, row.assistant, {
          score: 0.55,
          source: 'transcript',
        });
      }
    } catch (_) {}
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('ai_tx_' + kind, { k: kind });
    } catch (_) {}
  }

  function recordTurn(userMsg, assistantMsg, meta) {
    trackTranscript('turn', {
      user: String(userMsg || '').slice(0, 2000),
      assistant: String(assistantMsg || '').slice(0, 4000),
      meta: meta || {},
    });
  }

  function exportTranscript() {
    return {
      exportedAt: new Date().toISOString(),
      status: status(),
      turns: loadTx(),
    };
  }

  /**
   * Decide engine for this AI turn.
   * Returns { engine: 'owner-paid'|'paid'|'free-cloud'|'free-mind', forcePaid, allowPaid }
   */
  function routeEngine(opts) {
    opts = opts || {};
    var s = status();
    if (s.owner) {
      return {
        engine: 'owner-paid',
        forcePaid: true,
        allowPaid: true,
        freeFirst: false,
        notice: 'Architect · paid Grok',
      };
    }
    var gate = canUsePaid();
    if (gate.ok) {
      return {
        engine: 'paid',
        forcePaid: false,
        allowPaid: true,
        freeFirst: true,
        remaining: gate.remaining,
        notice: 'Sub active · €' + gate.remaining.toFixed(2) + ' API left',
      };
    }
    if (gate.reason === 'quota_exhausted') {
      return {
        engine: 'free-cloud',
        forcePaid: false,
        allowPaid: false,
        freeFirst: true,
        notice: 'API budget used · free models only · upgrade plan',
      };
    }
    return {
      engine: 'free-mind',
      forcePaid: false,
      allowPaid: false,
      freeFirst: true,
      notice: 'Subscribe from €3/mo for Grok · type plans',
    };
  }

  /**
   * Local sandbox AI proxy path (serve-astranov /api/ai) + cloud aicycle.
   */
  async function askPowerful(message, opts) {
    opts = opts || {};
    var route = routeEngine(opts);
    var headers = { 'Content-Type': 'application/json' };
    try {
      if (global.SNAuth && SNAuth.authHeaders) {
        var h = await SNAuth.authHeaders();
        Object.keys(h).forEach(function (k) {
          headers[k] = h[k];
        });
      }
    } catch (_) {}

    var body = {
      message: String(message || '').slice(0, 4000),
      mode: opts.mode || 'chat',
      allow_paid: !!route.allowPaid,
      force_paid: !!route.forcePaid,
      owner: isOwner(),
      subscription: status(),
      history: opts.history || [],
    };

    // Prefer same-origin /api/ai (sandbox proxy) then cloud aicycle
    var urls = [];
    try {
      urls.push(location.origin + '/api/ai');
    } catch (_) {}
    try {
      var cfg = global.SN_CONFIG || {};
      if (cfg.sbUrl || global.SB_URL)
        urls.push((cfg.sbUrl || global.SB_URL).replace(/\/$/, '') + '/functions/v1/aicycle');
    } catch (_) {}

    var lastErr = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var t = setTimeout(function () {
          try {
            if (ctrl) ctrl.abort();
          } catch (_) {}
        }, opts.timeoutMs || 20000);
        var r = await fetch(urls[i], {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
          signal: ctrl ? ctrl.signal : undefined,
        });
        clearTimeout(t);
        if (!r.ok) {
          lastErr = 'HTTP ' + r.status;
          continue;
        }
        var j = await r.json().catch(function () {
          return {};
        });
        var text = String(j.text || j.response || j.message || '').trim();
        if (!text) {
          lastErr = 'empty';
          continue;
        }
        var apiEur = estimateApiEur(j.usage || j.meter || {});
        if (j.paid || j.paid_fallback || j.via && /xai|grok/i.test(String(j.via))) {
          recordSpend(apiEur, { via: j.via, url: urls[i] });
        }
        recordTurn(message, text, {
          via: j.via || route.engine,
          paid: !!(j.paid || j.paid_fallback),
          route: route.engine,
        });
        return {
          ok: true,
          text: text,
          via: j.via || route.engine,
          paid: !!(j.paid || j.paid_fallback),
          route: route,
          notice: j.paid_notice || route.notice,
        };
      } catch (e) {
        lastErr = e && e.message ? e.message : String(e);
      }
    }
    return { ok: false, error: lastErr || 'offline', route: route };
  }

  async function handleLine(raw) {
    var low = String(raw || '').trim().toLowerCase();
    if (!low) return false;

    if (
      low === 'plans' ||
      low === 'plan list' ||
      low === 'subscriptions' ||
      low === 'pricing ai' ||
      low === 'ai plans'
    ) {
      printPlans();
      return true;
    }
    if (low === 'plan' || low === 'plan status' || low === 'sub' || low === 'subscription') {
      var s = status();
      log(s.label, s.active || s.owner ? 'ok' : 'dim');
      log(
        'Mode ' +
          s.mode +
          ' · spent €' +
          (s.spentApiEur === Infinity ? 0 : Number(s.spentApiEur).toFixed(4)) +
          ' · period ' +
          s.period +
          ' · markup ×' +
          MARKUP,
        'dim'
      );
      if (!s.owner && !s.active) log('Type: subscribe 3  · or subscribe 13|33|300', 'ok');
      return true;
    }
    var mSub = low.match(/^subscribe\s+(\d+|spark|pulse|orbit|nova)\b/);
    if (mSub || low === 'subscribe') {
      if (!mSub) {
        printPlans();
        log('Example: subscribe 3', 'ok');
        return true;
      }
      subscribe(mSub[1], { demo: true });
      return true;
    }
    if (low === 'unsubscribe' || low === 'cancel plan' || low === 'plan cancel') {
      cancel();
      return true;
    }
    if (low === 'transcript' || low === 'ai transcript' || low === 'usage ai') {
      var tx = loadTx();
      log('AI transcript · ' + tx.length + ' rows (training fuel)', 'ok');
      tx.slice(-8).forEach(function (row) {
        if (row.kind === 'turn' && row.row) {
          log(
            '· ' +
              String(row.row.user || '').slice(0, 40) +
              ' → ' +
              String(row.row.assistant || '').slice(0, 40),
            'dim'
          );
        } else if (row.kind === 'spend') {
          log('· spend €' + (row.row && row.row.apiEur), 'dim');
        }
      });
      return true;
    }
    if (low === 'transcript export' || low === 'export transcript') {
      try {
        var blob = new Blob([JSON.stringify(exportTranscript(), null, 2)], {
          type: 'application/json',
        });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'astranov-ai-transcript.json';
        a.click();
        log('Transcript exported', 'ok');
      } catch (e) {
        log('Export failed', 'err');
      }
      return true;
    }
    if (low === 'owner session' || low === 'i am owner') {
      // Local demo flag only — real owner is auth email
      try {
        localStorage.setItem('sn:owner-session', '1');
      } catch (_) {}
      log('Local owner flag set · paid Grok path open (demo). Real owner = Google login.', 'ok');
      return true;
    }
    return false;
  }

  global.SNSubscription = {
    MARKUP: MARKUP,
    TIERS: TIERS,
    ARCHITECT_EMAIL: ARCHITECT_EMAIL,
    status: status,
    canUsePaid: canUsePaid,
    subscribe: subscribe,
    cancel: cancel,
    listPlans: listPlans,
    printPlans: printPlans,
    recordSpend: recordSpend,
    estimateApiEur: estimateApiEur,
    routeEngine: routeEngine,
    askPowerful: askPowerful,
    recordTurn: recordTurn,
    exportTranscript: exportTranscript,
    handleLine: handleLine,
    isOwner: isOwner,
    loadTx: loadTx,
  };
})(typeof window !== 'undefined' ? window : globalThis);
