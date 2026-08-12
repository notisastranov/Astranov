/**
 * SNAgentOrbit — Multi-Agent Orchestration + Astranov Planet
 * Build: 20260812181000-agent-orbit
 *
 * OWNER LAW:
 * - Explicit CLI only (no auto overlay, no auto zoom)
 * - Credentials stay on device (localStorage). Never auto-upload.
 * - Astranov planet sits high above Earth; zoom only on `orbit` / `agents`
 * - Collaboration runs through Astranov Mind first, then subscribed agents
 * - Transparent / no white chrome / no sticky tiles
 */
(function (global) {
  'use strict';
  var BUILD = '20260812181000-agent-orbit';
  if (global.__SN_AGENT_ORBIT === BUILD) return;
  global.__SN_AGENT_ORBIT = BUILD;

  var CREDS_KEY = 'sn:agent-creds-v1';
  var CFG_KEY = 'sn:agent-orbit-cfg-v1';
  var LOG_KEY = 'sn:agent-orbit-log-v1';

  var PROVIDERS = {
    astranov: {
      id: 'astranov',
      name: 'Astranov Mind',
      color: '#3d9eff',
      role: 'orchestrator',
      needsKey: false,
      endpoint: null,
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      color: '#8ab4f8',
      role: 'reasoner',
      needsKey: true,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    },
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      color: '#10a37f',
      role: 'coder',
      needsKey: true,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      color: '#d4a27f',
      role: 'reviewer',
      needsKey: true,
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-sonnet-20241022',
    },
  };

  var ASTRANOV_PLANET = {
    id: 'astranov-orbit',
    name: 'Astranov',
    lat: 36.43,
    lng: 28.22,
    altitudeKm: 42000,
    color: 0x3d9eff,
  };

  var S = {
    ready: false,
    creds: {},
    cfg: { maxParallel: 3, timeoutMs: 45000, preferBridge: true },
    lastCollab: null,
    nodes: {},
    links: [],
  };

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 320), c || 'ok');
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

  function loadCreds() {
    try {
      var raw = localStorage.getItem(CREDS_KEY);
      if (raw) S.creds = JSON.parse(raw) || {};
    } catch (_) {
      S.creds = {};
    }
  }
  function saveCreds() {
    try {
      localStorage.setItem(CREDS_KEY, JSON.stringify(S.creds));
    } catch (_) {}
  }
  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      S.cfg = Object.assign(S.cfg, c || {});
    } catch (_) {}
  }

  function hasKey(id) {
    if (id === 'astranov') return true;
    var k = S.creds[id];
    return !!(k && String(k).trim().length > 8);
  }

  function maskKey(k) {
    k = String(k || '');
    if (k.length < 10) return '(short)';
    return k.slice(0, 4) + '…' + k.slice(-4);
  }

  function publishEvent(type, detail) {
    try {
      if (global.SNEvent && SNEvent.publish) {
        SNEvent.publish({
          type: type,
          lat: ASTRANOV_PLANET.lat,
          lng: ASTRANOV_PLANET.lng,
          stale: 120,
          detail: detail || {},
          from: 'agent-orbit',
        });
      }
    } catch (_) {}
  }

  function goOrbit(opts) {
    opts = opts || {};
    expandCli();
    log('◎ ASTRANOV PLANET · high orbit · multi-agent station', 'ok');
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(ASTRANOV_PLANET.lat, ASTRANOV_PLANET.lng, {
          tier: 'global',
          label: 'Astranov Orbit',
          color: ASTRANOV_PLANET.color,
          openMap: false,
          body: 'earth',
        });
      } else if (global.SNGlobe && SNGlobe.flyNear) {
        SNGlobe.flyNear(ASTRANOV_PLANET.lat, ASTRANOV_PLANET.lng, 'global');
      }
    } catch (e) {
      log('orbit fly soft · ' + (e && e.message), 'dim');
    }
    Object.keys(PROVIDERS).forEach(function (id, i) {
      var p = PROVIDERS[id];
      var online = hasKey(id);
      publishEvent('agent.node', {
        id: id,
        name: p.name,
        role: p.role,
        color: p.color,
        online: online,
        idx: i,
      });
    });
    listAgents();
    if (opts.promptCreds) {
      log('Type: agents key gemini <YOUR_KEY>', 'dim');
      log('Type: agents key chatgpt <YOUR_KEY>', 'dim');
      log('Type: agents key claude <YOUR_KEY>', 'dim');
      log('Keys stay on THIS device only.', 'dim');
    }
    return true;
  }

  function listAgents() {
    expandCli();
    log('── AGENTS · ASTRANOV ORBIT ──', 'ok');
    Object.keys(PROVIDERS).forEach(function (id) {
      var p = PROVIDERS[id];
      var st = hasKey(id) ? 'ONLINE' : p.needsKey ? 'NEED KEY' : 'READY';
      var col = hasKey(id) ? 'ok' : 'dim';
      log((hasKey(id) ? '● ' : '○ ') + p.name + ' · ' + p.role + ' · ' + st, col);
    });
    log('collab <task> · agent <name> <prompt> · orbit', 'dim');
  }

  function setKey(provider, key) {
    var id = String(provider || '').toLowerCase().trim();
    if (id === 'openai') id = 'chatgpt';
    if (id === 'gpt') id = 'chatgpt';
    if (id === 'anthropic') id = 'claude';
    if (id === 'google') id = 'gemini';
    if (!PROVIDERS[id]) {
      log('unknown provider · gemini | chatgpt | claude', 'err');
      return false;
    }
    if (id === 'astranov') {
      log('Astranov Mind needs no external key', 'dim');
      return true;
    }
    key = String(key || '').trim();
    if (!key || key.length < 8) {
      log('key too short', 'err');
      return false;
    }
    S.creds[id] = key;
    saveCreds();
    log(PROVIDERS[id].name + ' key stored locally · ' + maskKey(key), 'ok');
    publishEvent('agent.key', { id: id, online: true });
    return true;
  }

  function clearKey(provider) {
    var id = String(provider || '').toLowerCase().trim();
    if (id === 'openai') id = 'chatgpt';
    if (id === 'all') {
      S.creds = {};
      saveCreds();
      log('all external keys cleared from device', 'ok');
      return true;
    }
    if (S.creds[id]) {
      delete S.creds[id];
      saveCreds();
      log((PROVIDERS[id] && PROVIDERS[id].name) || id + ' key cleared', 'ok');
      return true;
    }
    log('no key for ' + id, 'dim');
    return false;
  }

  async function callAstranov(prompt, meta) {
    meta = meta || {};
    try {
      if (global.SNMindBridge && SNMindBridge.ask) {
        var r = await SNMindBridge.ask(prompt, { preferred_provider: 'astranov', silent: true });
        return { ok: true, text: (r && (r.text || r.reply || r.message)) || String(r || ''), provider: 'astranov' };
      }
    } catch (_) {}
    try {
      var base =
        (global.SN_CONFIG && SN_CONFIG.sbUrl) ||
        'https://lkoatrkhuigdolnjsbie.supabase.co';
      var url = String(base).replace(/\/$/, '') + '/functions/v1/ai-router';
      var headers = { 'Content-Type': 'application/json' };
      var key = (global.SN_CONFIG && SN_CONFIG.sbKey) || '';
      if (key) headers.apikey = key;
      var tok = '';
      try {
        if (global.SNAuth && SNAuth.session && SNAuth.session.access_token)
          tok = SNAuth.session.access_token;
      } catch (_) {}
      if (tok) headers.Authorization = 'Bearer ' + tok;
      else if (key) headers.Authorization = 'Bearer ' + key;
      var res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          text: prompt,
          preferred_provider: 'astranov',
          meta: meta,
        }),
      });
      var j = await res.json().catch(function () { return {}; });
      var text = j.text || j.reply || j.message || j.output || JSON.stringify(j).slice(0, 800);
      return { ok: res.ok, text: text, provider: 'astranov', raw: j };
    } catch (e) {
      return { ok: false, text: 'astranov fail · ' + (e && e.message), provider: 'astranov' };
    }
  }

  async function callGemini(prompt) {
    var key = S.creds.gemini;
    if (!key) return { ok: false, text: 'no gemini key · agents key gemini <KEY>', provider: 'gemini' };
    try {
      var url = PROVIDERS.gemini.endpoint + '?key=' + encodeURIComponent(key);
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      });
      var j = await res.json().catch(function () { return {}; });
      var text =
        (j.candidates &&
          j.candidates[0] &&
          j.candidates[0].content &&
          j.candidates[0].content.parts &&
          j.candidates[0].content.parts[0] &&
          j.candidates[0].content.parts[0].text) ||
        (j.error && j.error.message) ||
        JSON.stringify(j).slice(0, 600);
      return { ok: res.ok, text: text, provider: 'gemini', raw: j };
    } catch (e) {
      return {
        ok: false,
        text: 'gemini blocked or failed · ' + (e && e.message) + ' · use bridge or CORS proxy',
        provider: 'gemini',
      };
    }
  }

  async function callChatGPT(prompt) {
    var key = S.creds.chatgpt;
    if (!key) return { ok: false, text: 'no chatgpt key · agents key chatgpt <KEY>', provider: 'chatgpt' };
    try {
      var res = await fetch(PROVIDERS.chatgpt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + key,
        },
        body: JSON.stringify({
          model: PROVIDERS.chatgpt.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
        }),
      });
      var j = await res.json().catch(function () { return {}; });
      var text =
        (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) ||
        (j.error && j.error.message) ||
        JSON.stringify(j).slice(0, 600);
      return { ok: res.ok, text: text, provider: 'chatgpt', raw: j };
    } catch (e) {
      return {
        ok: false,
        text: 'chatgpt blocked or failed · ' + (e && e.message) + ' · browser CORS common',
        provider: 'chatgpt',
      };
    }
  }

  async function callClaude(prompt) {
    var key = S.creds.claude;
    if (!key) return { ok: false, text: 'no claude key · agents key claude <KEY>', provider: 'claude' };
    try {
      var res = await fetch(PROVIDERS.claude.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: PROVIDERS.claude.model,
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      var j = await res.json().catch(function () { return {}; });
      var text =
        (j.content && j.content[0] && j.content[0].text) ||
        (j.error && j.error.message) ||
        JSON.stringify(j).slice(0, 600);
      return { ok: res.ok, text: text, provider: 'claude', raw: j };
    } catch (e) {
      return {
        ok: false,
        text: 'claude blocked or failed · ' + (e && e.message),
        provider: 'claude',
      };
    }
  }

  async function callProvider(id, prompt) {
    id = String(id || '').toLowerCase();
    if (id === 'openai' || id === 'gpt') id = 'chatgpt';
    if (id === 'google') id = 'gemini';
    if (id === 'anthropic') id = 'claude';
    publishEvent('agent.talk', { id: id, phase: 'start' });
    var r;
    if (id === 'astranov') r = await callAstranov(prompt);
    else if (id === 'gemini') r = await callGemini(prompt);
    else if (id === 'chatgpt') r = await callChatGPT(prompt);
    else if (id === 'claude') r = await callClaude(prompt);
    else r = { ok: false, text: 'unknown agent ' + id, provider: id };
    publishEvent('agent.talk', { id: id, phase: 'end', ok: !!(r && r.ok) });
    return r;
  }

  async function collab(task) {
    task = String(task || '').trim();
    if (!task) {
      log('usage: collab <what to solve together>', 'dim');
      return null;
    }
    expandCli();
    log('◎ COLLAB · ' + task.slice(0, 120), 'ok');
    preview('collab…');
    publishEvent('agent.collab', { phase: 'start', task: task.slice(0, 200) });

    var online = Object.keys(PROVIDERS).filter(function (id) {
      return hasKey(id);
    });
    log('crew online: ' + online.map(function (id) { return PROVIDERS[id].name; }).join(' · '), 'dim');

    var planPrompt =
      'You are Astranov Mind, orchestrator of a multi-agent OS (SpaceNet). ' +
      'Task: ' + task + '\n' +
      'Online agents: ' + online.join(', ') + '.\n' +
      'Reply with a short plan (max 6 lines) assigning roles: who researches, who codes, who reviews. Then we will run them.';
    var plan = await callAstranov(planPrompt, { mode: 'plan' });
    log('PLAN · ' + String(plan.text || '').slice(0, 280), plan.ok ? 'ok' : 'err');

    var agentPrompt =
      'SpaceNet multi-agent collab. Task for you:\n' + task +
      '\n\nOrchestrator plan:\n' + String(plan.text || '').slice(0, 600) +
      '\n\nAnswer concisely, actionable, max 400 words. You are one specialist in a team.';
    var targets = online.filter(function (id) { return id !== 'astranov'; });
    if (!targets.length) targets = ['astranov'];

    var results = [];
    var jobs = targets.slice(0, S.cfg.maxParallel).map(function (id) {
      return callProvider(id, agentPrompt).then(function (r) {
        results.push(r);
        log(
          (PROVIDERS[id] ? PROVIDERS[id].name : id) + ' · ' + (r.ok ? 'ok' : 'fail') + ' · ' + String(r.text || '').slice(0, 160),
          r.ok ? 'ok' : 'err'
        );
        return r;
      });
    });
    await Promise.all(jobs);

    var mergePrompt =
      'Astranov Mind — merge multi-agent answers into ONE final, practical response for the user.\n' +
      'Original task: ' + task + '\n\n' +
      results
        .map(function (r) {
          return '### ' + r.provider + '\n' + String(r.text || '').slice(0, 900);
        })
        .join('\n\n') +
      '\n\nProduce the best unified answer. Be concrete.';
    var final = await callAstranov(mergePrompt, { mode: 'merge' });
    log('── FINAL ──', 'ok');
    String(final.text || '')
      .split(/\n+/)
      .slice(0, 24)
      .forEach(function (ln) {
        if (ln.trim()) log(ln.trim(), 'ok');
      });
    preview('collab done');
    S.lastCollab = { task: task, results: results, final: final, at: Date.now() };
    try {
      var hist = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      hist.unshift({ t: Date.now(), task: task.slice(0, 120), ok: !!(final && final.ok) });
      localStorage.setItem(LOG_KEY, JSON.stringify(hist.slice(0, 40)));
    } catch (_) {}
    publishEvent('agent.collab', { phase: 'end', ok: !!(final && final.ok) });
    return { plan: plan, results: results, final: final };
  }

  async function singleAgent(name, prompt) {
    var id = String(name || '').toLowerCase().trim();
    if (id === 'openai' || id === 'gpt') id = 'chatgpt';
    if (id === 'google') id = 'gemini';
    if (id === 'anthropic') id = 'claude';
    if (id === 'mind' || id === 'astranov-mind') id = 'astranov';
    prompt = String(prompt || '').trim();
    if (!prompt) {
      log('usage: agent <astranov|gemini|chatgpt|claude> <prompt>', 'dim');
      return null;
    }
    expandCli();
    log('→ ' + ((PROVIDERS[id] && PROVIDERS[id].name) || id) + '…', 'dim');
    var r = await callProvider(id, prompt);
    log((r.ok ? '✓ ' : '✗ ') + String(r.text || '').slice(0, 400), r.ok ? 'ok' : 'err');
    return r;
  }

  function handleLine(line) {
    var raw = String(line || '').trim();
    var low = raw.toLowerCase();
    if (!low) return false;

    if (low === 'agents' || low === 'agent list' || low === 'orbit' || low === 'astranov planet') {
      goOrbit({ promptCreds: true });
      return true;
    }
    if (low === 'agents help' || low === 'agent help') {
      log('agents | orbit — open Astranov planet + list', 'dim');
      log('agents key <gemini|chatgpt|claude> <API_KEY>', 'dim');
      log('agents clear <provider|all>', 'dim');
      log('agent <name> <prompt>', 'dim');
      log('collab <task> — multi-agent plan → run → merge', 'dim');
      return true;
    }
    var mKey = raw.match(/^agents?\s+key\s+(\w+)\s+(.+)$/i);
    if (mKey) {
      setKey(mKey[1], mKey[2]);
      return true;
    }
    var mClear = low.match(/^agents?\s+clear\s+(\w+)$/);
    if (mClear) {
      clearKey(mClear[1]);
      return true;
    }
    if (low.indexOf('collab ') === 0 || low.indexOf('collaborate ') === 0) {
      var task = raw.replace(/^(collab|collaborate)\s+/i, '').trim();
      collab(task);
      return true;
    }
    var mAgent = raw.match(/^agent\s+(astranov|mind|gemini|google|chatgpt|openai|gpt|claude|anthropic)\s+(.+)$/i);
    if (mAgent) {
      singleAgent(mAgent[1], mAgent[2]);
      return true;
    }
    return false;
  }

  function installCli() {
    try {
      if (global.SNCli && SNCli.installHandler) {
        SNCli.installHandler('agent-orbit', handleLine, 40);
        return;
      }
    } catch (_) {}
    try {
      if (global.SNCli && SNCli.run && !SNCli.__agentOrbitWrapped) {
        var prev = SNCli.run.bind(SNCli);
        SNCli.run = function (line) {
          if (handleLine(line)) return true;
          return prev(line);
        };
        SNCli.__agentOrbitWrapped = true;
      }
    } catch (_) {}
    try {
      var form = document.getElementById('cli-form');
      if (form && !form.__agentOrbit) {
        form.__agentOrbit = true;
        form.addEventListener(
          'submit',
          function (ev) {
            try {
              var inp = document.getElementById('cli-in');
              var v = inp && inp.value;
              if (v && handleLine(v)) {
              }
            } catch (_) {}
          },
          true
        );
      }
    } catch (_) {}
  }

  function init() {
    if (S.ready) return;
    loadCreds();
    loadCfg();
    installCli();
    S.ready = true;
  }

  var API = {
    BUILD: BUILD,
    init: init,
    goOrbit: goOrbit,
    list: listAgents,
    setKey: setKey,
    clearKey: clearKey,
    collab: collab,
    ask: singleAgent,
    call: callProvider,
    handleLine: handleLine,
    hasKey: hasKey,
    providers: PROVIDERS,
    planet: ASTRANOV_PLANET,
    get status() {
      return {
        ready: S.ready,
        online: Object.keys(PROVIDERS).filter(hasKey),
        lastCollab: S.lastCollab && S.lastCollab.at,
      };
    },
  };

  global.SNAgentOrbit = API;
  global.SNAgents = API;
  global.AstranovOrbit = API;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 60);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
