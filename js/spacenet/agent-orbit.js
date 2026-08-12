/**
 * SNAgentOrbit — Multi-agent orchestration + Astranov planet
 * Build: 20260812190000-chrome-orbit-restore
 *
 * Planet high above Earth. Tap a satellite to paste a key (CLI sheet,
 * never a map tile). collab / agent commands orchestrate Gemini,
 * ChatGPT, Claude + Astranov Mind. Keys stay in localStorage only.
 */
(function (global) {
  'use strict';
  var BUILD = '20260812190000-chrome-orbit-restore';
  if (global.__SN_AGENT_ORBIT === BUILD) return;
  global.__SN_AGENT_ORBIT = BUILD;

  var CREDS_KEY = 'sn:agent-creds-v1';
  var PROVIDERS = {
    astranov: { id: 'astranov', name: 'Astranov Mind', hex: 0x3d9eff, role: 'orchestrator', needsKey: false, icon: '\u25ce' },
    gemini: {
      id: 'gemini', name: 'Gemini', hex: 0x8ab4f8, role: 'reasoner', needsKey: true, icon: '\u2726',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    },
    chatgpt: {
      id: 'chatgpt', name: 'ChatGPT', hex: 0x10a37f, role: 'coder', needsKey: true, icon: '\u2b21',
      endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini'
    },
    claude: {
      id: 'claude', name: 'Claude', hex: 0xd4a27f, role: 'reviewer', needsKey: true, icon: '\u25c8',
      endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20241022'
    }
  };
  var PLANET = { lat: 36.43, lng: 28.22, altitude: 1.22, color: 0x3d9eff };
  var SAT = {
    astranov: { dLat: 0, dLng: 0, alt: 1.22 },
    gemini: { dLat: 2.4, dLng: 3.1, alt: 1.18 },
    chatgpt: { dLat: -2.1, dLng: 2.8, alt: 1.19 },
    claude: { dLat: 1.6, dLng: -3.4, alt: 1.17 }
  };
  var S = { ready: false, creds: {}, entityIds: [], planetVisible: false, awaitingKey: null, lastLinks: [] };

  function log(m, c) {
    m = String(m == null ? '' : m).slice(0, 420);
    c = c || 'ok';
    try { if (global.SNCli && SNCli.log) SNCli.log(m, c); } catch (_) {}
    try { if (global.AciCli && AciCli.print) AciCli.print(m, c === 'err' ? 'err' : 'ok'); } catch (_) {}
    try { if (global.ACIControl && ACIControl.reply) ACIControl.reply(m); } catch (_) {}
    try {
      var el = document.getElementById('cli-log') || document.getElementById('globe-deck-log');
      if (el) {
        var line = document.createElement('div');
        line.className = 'cli-line ' + (c === 'err' ? 'err' : c === 'dim' ? 'dim' : 'ok');
        line.innerHTML = '<span class="cli-body">' + esc(m) + '</span>';
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }

  function esc(s) {
    return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }

  function loadCreds() {
    try { S.creds = JSON.parse(localStorage.getItem(CREDS_KEY) || '{}') || {}; } catch (_) { S.creds = {}; }
  }
  function saveCreds() {
    try { localStorage.setItem(CREDS_KEY, JSON.stringify(S.creds)); } catch (_) {}
  }
  function hasKey(id) {
    if (id === 'astranov') return true;
    return !!(S.creds[id] && String(S.creds[id]).length > 8);
  }

  function expandCli() {
    try {
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
    } catch (_) {}
  }

  function ensureKeySheet() {
    var el = document.getElementById('sn-orbit-key');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-orbit-key';
    el.setAttribute('hidden', '');
    el.innerHTML =
      '<style>' +
      '#sn-orbit-key{position:fixed;left:50%;bottom:calc(118px + env(safe-area-inset-bottom,0px));' +
      'transform:translateX(-50%);z-index:140;width:min(720px,calc(100vw - 24px));' +
      'padding:14px 16px 16px;border-radius:18px;pointer-events:auto;' +
      'background:rgba(0,4,14,0.28);backdrop-filter:blur(16px) saturate(1.2);' +
      '-webkit-backdrop-filter:blur(16px) saturate(1.2);' +
      'border:1px solid rgba(61,158,255,0.35);box-shadow:0 0 28px rgba(40,140,255,0.25);}' +
      '#sn-orbit-key[hidden]{display:none!important}' +
      '#sn-orbit-key .ok-title{font:800 18px/1.2 Space Grotesk,system-ui,sans-serif;' +
      'letter-spacing:.14em;color:#7ec8ff;text-shadow:0 0 16px rgba(80,180,255,.85);margin:0 0 6px}' +
      '#sn-orbit-key .ok-sub{font:600 12px/1.35 Inter,system-ui,sans-serif;color:#9ab;margin:0 0 10px}' +
      '#sn-orbit-key input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;' +
      'border:1px solid rgba(61,158,255,.45);background:transparent;color:#d8ecff;' +
      'font:600 15px/1.3 JetBrains Mono,ui-monospace,monospace;outline:none}' +
      '#sn-orbit-key input:focus{box-shadow:0 0 0 2px rgba(61,158,255,.35),0 0 18px rgba(61,158,255,.3)}' +
      '#sn-orbit-key .ok-row{display:flex;gap:8px;margin-top:10px}' +
      '#sn-orbit-key button{flex:1;min-height:40px;border-radius:999px;border:1px solid rgba(61,158,255,.4);' +
      'background:transparent;color:#9cf;font:800 13px/1 system-ui;letter-spacing:.08em;cursor:pointer}' +
      '#sn-orbit-key .ok-save{border-color:rgba(61,214,140,.7);color:#7ef0b0;text-shadow:0 0 10px rgba(61,214,140,.7)}' +
      '#sn-orbit-key .ok-cancel{border-color:rgba(232,33,39,.55);color:#ff8a90}' +
      '</style>' +
      '<p class="ok-title" id="ok-title">AGENT KEY</p>' +
      '<p class="ok-sub" id="ok-sub">Stored only on this device. Never sent to our servers.</p>' +
      '<input id="ok-input" type="password" autocomplete="off" spellcheck="false" placeholder="paste key · Enter to save" />' +
      '<div class="ok-row">' +
      '<button type="button" class="ok-save" id="ok-save">SAVE</button>' +
      '<button type="button" class="ok-cancel" id="ok-cancel">CANCEL</button>' +
      '</div>';
    document.body.appendChild(el);
    var inp = el.querySelector('#ok-input');
    el.querySelector('#ok-save').addEventListener('click', function () { commitKeySheet(); });
    el.querySelector('#ok-cancel').addEventListener('click', function () { hideKeySheet(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commitKeySheet(); }
      if (e.key === 'Escape') hideKeySheet();
    });
    return el;
  }

  function showKeySheet(id) {
    var p = PROVIDERS[id];
    if (!p || !p.needsKey) return;
    S.awaitingKey = id;
    expandCli();
    var el = ensureKeySheet();
    el.querySelector('#ok-title').textContent = p.icon + '  ' + p.name.toUpperCase() + '  KEY';
    el.querySelector('#ok-sub').textContent = 'Paste your ' + p.name + ' key. Local only. Then we light the satellite.';
    var inp = el.querySelector('#ok-input');
    inp.value = '';
    el.removeAttribute('hidden');
    setTimeout(function () { try { inp.focus(); } catch (_) {} }, 80);
    log(p.name + ' · paste key in the glowing field · Enter to save', 'ok');
  }

  function hideKeySheet() {
    S.awaitingKey = null;
    var el = document.getElementById('sn-orbit-key');
    if (el) el.setAttribute('hidden', '');
  }

  function commitKeySheet() {
    var el = document.getElementById('sn-orbit-key');
    var id = S.awaitingKey;
    var val = el ? el.querySelector('#ok-input').value : '';
    if (!id) { hideKeySheet(); return; }
    setKey(id, val);
    hideKeySheet();
  }

  function clearPlanet() {
    S.entityIds.forEach(function (id) {
      try { if (global.GlobeEntity) GlobeEntity.unregister(id); } catch (_) {}
    });
    S.entityIds = [];
    S.planetVisible = false;
    hideKeySheet();
  }

  function paintPlanet() {
    if (!global.GlobeEntity || !GlobeEntity.register) {
      log('GlobeEntity not ready — wait a second then type orbit', 'dim');
      return;
    }
    clearPlanet();
    var core = GlobeEntity.register({
      id: 'agent-planet-core', type: 'place', lat: PLANET.lat, lng: PLANET.lng,
      altitude: PLANET.altitude, title: '\u25ce ASTRANOV',
      description: 'Multi-agent orbit · tap a satellite to enter a key · collab to think together',
      urgency: 3, color: PLANET.color, icon: '\u25ce', radius: 0.046, persist: true,
      data: { alwaysShowLabel: true, agentOrbit: true },
      onTap: function () { listAgents(); expandCli(); }
    });
    if (core) S.entityIds.push('agent-planet-core');
    Object.keys(PROVIDERS).forEach(function (id) {
      var p = PROVIDERS[id], off = SAT[id], online = hasKey(id), eid = 'agent-sat-' + id;
      var ent = GlobeEntity.register({
        id: eid, type: 'place',
        lat: PLANET.lat + off.dLat, lng: PLANET.lng + off.dLng, altitude: off.alt,
        title: p.icon + ' ' + p.name,
        description: p.role + ' · ' + (online ? 'ONLINE' : p.needsKey ? 'TAP TO ENTER KEY' : 'READY'),
        urgency: online ? 3 : 1, color: online ? p.hex : 0x445566, icon: p.icon,
        radius: id === 'astranov' ? 0.03 : 0.022, persist: true,
        data: { alwaysShowLabel: true, agentOrbit: true, agentId: id },
        onTap: function () {
          if (p.needsKey && !online) showKeySheet(id);
          else log(p.name + ' · ' + p.role + ' · ' + (online ? 'ONLINE' : 'READY'), online ? 'ok' : 'dim');
        }
      });
      if (ent) S.entityIds.push(eid);
    });
    S.planetVisible = true;
  }

  function flyToOrbit() {
    try {
      if (typeof latLngToPos === 'function' && typeof flyToPoint === 'function' && global.THREE) {
        var fp = latLngToPos(PLANET.lat, PLANET.lng, 1.24);
        var z = (global.GlobeControl && GlobeControl.Z && GlobeControl.Z.global) || 2.55;
        flyToPoint(new THREE.Vector3(fp.x, fp.y, fp.z), z);
        return;
      }
    } catch (_) {}
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(PLANET.lat, PLANET.lng, { tier: 'global', label: 'Astranov Orbit', openMap: false });
      }
    } catch (_) {}
  }

  function listAgents() {
    log('-- ASTRANOV ORBIT --', 'ok');
    Object.keys(PROVIDERS).forEach(function (id) {
      var p = PROVIDERS[id];
      log((hasKey(id) ? '\u25cf ' : '\u25cb ') + p.name + ' · ' + p.role + ' · ' + (hasKey(id) ? 'ONLINE' : p.needsKey ? 'NEED KEY' : 'READY'), hasKey(id) ? 'ok' : 'dim');
    });
    log('tap a satellite to paste a key · collab <task> · agent <name> <prompt>', 'dim');
  }

  function goOrbit() {
    expandCli();
    log('\u25ce ASTRANOV PLANET · high orbit · multi-agent station', 'ok');
    flyToOrbit();
    paintPlanet();
    listAgents();
  }

  function setKey(provider, key) {
    var id = String(provider || '').toLowerCase();
    if (id === 'openai' || id === 'gpt') id = 'chatgpt';
    if (id === 'anthropic') id = 'claude';
    if (id === 'google') id = 'gemini';
    if (!PROVIDERS[id] || id === 'astranov') { log('use gemini · chatgpt · claude', 'err'); return; }
    key = String(key || '').trim();
    if (key.length < 8) { log('key too short', 'err'); return; }
    S.creds[id] = key;
    saveCreds();
    log('\u25cf ' + PROVIDERS[id].name + ' ONLINE · key stored on this device only', 'ok');
    if (S.planetVisible) paintPlanet();
  }

  function clearKey(id) {
    id = String(id || '').toLowerCase();
    if (id === 'all') { S.creds = {}; saveCreds(); log('keys cleared', 'ok'); }
    else if (S.creds[id]) { delete S.creds[id]; saveCreds(); log(id + ' cleared', 'ok'); }
    if (S.planetVisible) paintPlanet();
  }

  function pulseSat(id, mode) {
    try {
      if (!global.GlobeEntity || !GlobeEntity.register) return;
      var p = PROVIDERS[id];
      var off = SAT[id];
      if (!p || !off) return;
      GlobeEntity.register({
        id: 'agent-sat-' + id, type: 'place',
        lat: PLANET.lat + off.dLat, lng: PLANET.lng + off.dLng, altitude: off.alt,
        title: p.icon + ' ' + p.name,
        description: mode === 'think' ? 'THINKING…' : mode === 'ok' ? 'REPLIED' : mode === 'fail' ? 'FAIL' : p.role,
        urgency: mode === 'think' ? 3 : mode === 'fail' ? 2 : 3,
        color: mode === 'fail' ? 0xe82127 : p.hex,
        icon: p.icon, radius: 0.028, persist: true,
        data: { alwaysShowLabel: true, agentOrbit: true, agentId: id }
      });
    } catch (_) {}
  }

  async function callAstranov(prompt) {
    try {
      var base = (global.SB_URL || (global.SN_CONFIG && SN_CONFIG.sbUrl) || 'https://lkoatrkhuigdolnjsbie.supabase.co').replace(/\/$/, '');
      var headers = { 'Content-Type': 'application/json' };
      var k = global.SB_KEY || (global.SN_CONFIG && SN_CONFIG.sbKey) || '';
      if (k) { headers.apikey = k; headers.Authorization = 'Bearer ' + k; }
      try {
        var tok = (global.Auth && Auth.session && Auth.session.access_token) || (global.SNAuth && SNAuth.session && SNAuth.session.access_token) || '';
        if (tok) headers.Authorization = 'Bearer ' + tok;
      } catch (_) {}
      var res = await fetch(base + '/functions/v1/ai-router', {
        method: 'POST', headers: headers,
        body: JSON.stringify({ text: prompt, preferred_provider: 'astranov' })
      });
      var j = await res.json().catch(function () { return {}; });
      return { ok: res.ok, text: j.text || j.reply || j.message || JSON.stringify(j).slice(0, 600), provider: 'astranov' };
    } catch (e) {
      return { ok: false, text: 'astranov fail · ' + (e && e.message), provider: 'astranov' };
    }
  }

  async function callGemini(prompt) {
    var key = S.creds.gemini;
    if (!key) return { ok: false, text: 'no gemini key', provider: 'gemini' };
    try {
      var res = await fetch(PROVIDERS.gemini.endpoint + '?key=' + encodeURIComponent(key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
      });
      var j = await res.json().catch(function () { return {}; });
      var text = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text) || (j.error && j.error.message) || JSON.stringify(j).slice(0, 400);
      return { ok: res.ok, text: text, provider: 'gemini' };
    } catch (e) { return { ok: false, text: 'gemini fail · ' + e.message, provider: 'gemini' }; }
  }

  async function callChatGPT(prompt) {
    var key = S.creds.chatgpt;
    if (!key) return { ok: false, text: 'no chatgpt key', provider: 'chatgpt' };
    try {
      var res = await fetch(PROVIDERS.chatgpt.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({ model: PROVIDERS.chatgpt.model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 })
      });
      var j = await res.json().catch(function () { return {}; });
      var text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || (j.error && j.error.message) || JSON.stringify(j).slice(0, 400);
      return { ok: res.ok, text: text, provider: 'chatgpt' };
    } catch (e) { return { ok: false, text: 'chatgpt fail (CORS?) · ' + e.message, provider: 'chatgpt' }; }
  }

  async function callClaude(prompt) {
    var key = S.creds.claude;
    if (!key) return { ok: false, text: 'no claude key', provider: 'claude' };
    try {
      var res = await fetch(PROVIDERS.claude.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: PROVIDERS.claude.model, max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      });
      var j = await res.json().catch(function () { return {}; });
      var text = (j.content && j.content[0] && j.content[0].text) || (j.error && j.error.message) || JSON.stringify(j).slice(0, 400);
      return { ok: res.ok, text: text, provider: 'claude' };
    } catch (e) { return { ok: false, text: 'claude fail · ' + e.message, provider: 'claude' }; }
  }

  async function callProvider(id, prompt) {
    id = String(id || '').toLowerCase();
    if (id === 'openai' || id === 'gpt') id = 'chatgpt';
    if (id === 'google') id = 'gemini';
    if (id === 'anthropic') id = 'claude';
    pulseSat(id, 'think');
    var r;
    if (id === 'astranov') r = await callAstranov(prompt);
    else if (id === 'gemini') r = await callGemini(prompt);
    else if (id === 'chatgpt') r = await callChatGPT(prompt);
    else if (id === 'claude') r = await callClaude(prompt);
    else r = { ok: false, text: 'unknown ' + id, provider: id };
    pulseSat(id, r.ok ? 'ok' : 'fail');
    return r;
  }

  async function collab(task) {
    task = String(task || '').trim();
    if (!task) { log('usage: collab <task>', 'dim'); return; }
    expandCli();
    if (!S.planetVisible) {
      paintPlanet();
      flyToOrbit();
    }
    log('\u25ce COLLAB · ' + task.slice(0, 120), 'ok');
    var online = Object.keys(PROVIDERS).filter(hasKey);
    log('link  ' + online.map(function (i) { return PROVIDERS[i].icon + ' ' + PROVIDERS[i].name; }).join('  \u2194  '), 'ok');
    pulseSat('astranov', 'think');
    var plan = await callAstranov('SpaceNet multi-agent orchestrator. Task: ' + task + '\nOnline: ' + online.join(', ') + '\nShort plan max 6 lines.');
    log('PLAN · ' + String(plan.text || '').slice(0, 260), plan.ok ? 'ok' : 'err');
    var targets = online.filter(function (i) { return i !== 'astranov'; });
    if (!targets.length) targets = ['astranov'];
    var results = [];
    await Promise.all(targets.slice(0, 3).map(async function (id) {
      log('\u25ce \u2192 ' + PROVIDERS[id].name + ' …', 'dim');
      var r = await callProvider(id, 'Task: ' + task + '\nPlan: ' + String(plan.text || '').slice(0, 400) + '\nConcise actionable answer max 300 words.');
      results.push(r);
      log(PROVIDERS[id].name + ' \u2192 ASTRANOV · ' + (r.ok ? 'ok' : 'fail') + ' · ' + String(r.text || '').slice(0, 140), r.ok ? 'ok' : 'err');
    }));
    pulseSat('astranov', 'think');
    var final = await callAstranov('Merge into ONE final answer.\nTask: ' + task + '\n\n' + results.map(function (r) { return '### ' + r.provider + '\n' + String(r.text || '').slice(0, 700); }).join('\n\n'));
    pulseSat('astranov', final.ok ? 'ok' : 'fail');
    log('-- FINAL --', 'ok');
    String(final.text || '').split(/\n+/).slice(0, 22).forEach(function (ln) { if (ln.trim()) log(ln.trim(), 'ok'); });
  }

  async function singleAgent(name, prompt) {
    var id = String(name || '').toLowerCase();
    if (id === 'openai' || id === 'gpt') id = 'chatgpt';
    if (id === 'google') id = 'gemini';
    if (id === 'anthropic') id = 'claude';
    if (id === 'mind') id = 'astranov';
    prompt = String(prompt || '').trim();
    if (!prompt) { log('usage: agent <name> <prompt>', 'dim'); return; }
    expandCli();
    log('\u2192 ' + ((PROVIDERS[id] && PROVIDERS[id].name) || id) + '…', 'dim');
    var r = await callProvider(id, prompt);
    log((r.ok ? '\u2713 ' : '\u2717 ') + String(r.text || '').slice(0, 420), r.ok ? 'ok' : 'err');
  }

  function handleLine(line) {
    var raw = String(line || '').trim();
    var low = raw.toLowerCase();
    if (!low) return false;
    if (S.awaitingKey && raw.length > 8 && raw.indexOf(' ') < 0) {
      setKey(S.awaitingKey, raw);
      hideKeySheet();
      return true;
    }
    if (low === 'agents' || low === 'orbit' || low === 'planet' || low === 'astranov planet') { goOrbit(); return true; }
    if (low === 'agents off' || low === 'orbit off' || low === 'planet off') { clearPlanet(); log('orbit cleared', 'ok'); return true; }
    if (low === 'agents help') {
      log('orbit · tap satellite for key · agents key <p> <KEY> · collab <task> · agent <name> <prompt>', 'dim');
      return true;
    }
    var mKey = raw.match(/^agents?\s+key\s+(\w+)\s+(.+)$/i);
    if (mKey) { setKey(mKey[1], mKey[2]); return true; }
    var mClear = low.match(/^agents?\s+clear\s+(\w+)$/);
    if (mClear) { clearKey(mClear[1]); return true; }
    if (low.indexOf('collab ') === 0) { collab(raw.slice(7).trim()); return true; }
    var mA = raw.match(/^agent\s+(astranov|mind|gemini|google|chatgpt|openai|gpt|claude|anthropic)\s+(.+)$/i);
    if (mA) { singleAgent(mA[1], mA[2]); return true; }
    return false;
  }

  function installCli() {
    try {
      if (global.SNCli && SNCli.run && !SNCli.__agentOrbitWrapped) {
        var p = SNCli.run.bind(SNCli);
        SNCli.run = function (line) { if (handleLine(line)) return true; return p(line); };
        SNCli.__agentOrbitWrapped = true;
      }
    } catch (_) {}
    try {
      if (global.SuperCli && SuperCli.run && !SuperCli.__agentOrbitWrapped) {
        var p2 = SuperCli.run.bind(SuperCli);
        SuperCli.run = function (line) { if (handleLine(line)) return true; return p2(line); };
        SuperCli.__agentOrbitWrapped = true;
      }
    } catch (_) {}
    try {
      if (global.AciCli && AciCli.submit && !AciCli.__agentOrbitWrapped) {
        var p3 = AciCli.submit.bind(AciCli);
        AciCli.submit = function (line) { if (handleLine(line)) return true; return p3(line); };
        AciCli.__agentOrbitWrapped = true;
      }
    } catch (_) {}
    try {
      var form = document.getElementById('cli-form') || document.getElementById('aci-cli-form');
      if (form && !form.__agentOrbit) {
        form.__agentOrbit = true;
        form.addEventListener('submit', function () {
          var inp = document.getElementById('cli-in') || document.getElementById('aci-cli-in');
          if (inp && inp.value) handleLine(inp.value);
        }, true);
      }
    } catch (_) {}
  }

  function ensureRibbonBtn() {
    try {
      var bar = document.getElementById('sn-task-ribbon');
      if (!bar || document.getElementById('sn-rib-orbit')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.id = 'sn-rib-orbit';
      b.className = 'sn-rib-btn';
      b.title = 'Astranov planet · multi-agent orbit';
      b.setAttribute('aria-label', 'Astranov orbit planet');
      b.textContent = '\u25ce';
      b.style.cssText = 'min-width:34px;height:34px;border-radius:50%;border:1px solid rgba(61,158,255,.55);background:transparent;color:#7ec8ff;font:800 16px/1 system-ui;box-shadow:0 0 12px rgba(61,158,255,.35)';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        goOrbit();
      });
      bar.appendChild(b);
    } catch (_) {}
  }

  function silentPaintWhenReady() {
    if (S.planetVisible) return;
    if (global.GlobeEntity && GlobeEntity.register) {
      paintPlanet();
    }
  }

  function init() {
    if (S.ready) return;
    loadCreds();
    installCli();
    ensureRibbonBtn();
    S.ready = true;
  }

  global.SNAgentOrbit = global.SNAgents = global.AstranovOrbit = {
    BUILD: BUILD, init: init, goOrbit: goOrbit, list: listAgents, setKey: setKey,
    clearKey: clearKey, collab: collab, ask: singleAgent, handleLine: handleLine,
    hasKey: hasKey, clearPlanet: clearPlanet, showKeySheet: showKeySheet,
    providers: PROVIDERS, planet: PLANET
  };

  function boot() {
    init();
    [400, 1400, 3200, 7000].forEach(function (ms) {
      setTimeout(function () {
        installCli();
        ensureRibbonBtn();
      }, ms);
    });
    setTimeout(silentPaintWhenReady, 5000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(boot, 80);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  window.addEventListener('load', function () { setTimeout(boot, 400); });
})(typeof window !== 'undefined' ? window : globalThis);
