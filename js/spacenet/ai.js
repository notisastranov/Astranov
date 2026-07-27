/**
 * Astranov AI — product mind on SpaceNet
 * Speaks first, runs tasks, freeform CLI. Edge aicycle when up; local act always.
 */
(function (global) {
  'use strict';

  var HIST_KEY = 'sn:ai-hist-v1';
  var hist = [];
  var greeted = false;
  var busy = false;
  var GREET_KEY = 'sn:ai-greeted-session';

  function loadHist() {
    try {
      var raw = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      if (Array.isArray(raw)) raw.slice(-12).forEach(function (m) {
        hist.push(m);
      });
    } catch (e) {}
  }

  function saveHist() {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-16)));
    } catch (e) {}
  }

  function pushHist(role, content) {
    hist.push({ role: role, content: String(content).slice(0, 1200) });
    if (hist.length > 20) hist.splice(0, hist.length - 20);
    saveHist();
  }

  function say(text, cls) {
    var t = String(text || '').trim();
    if (!t) return;
    if (global.SNCli && SNCli.log) {
      String(t)
        .split('\n')
        .forEach(function (ln) {
          if (ln.trim()) SNCli.log(ln, cls || 'ok');
        });
    }
    if (global.SNCli && SNCli.preview) SNCli.preview(t.slice(0, 90));
    if (global.SNField && SNField.setNotice) SNField.setNotice(t.slice(0, 48));
    if (global.SNUi && SNUi.expandPanel) {
      try {
        SNUi.expandPanel(true);
      } catch (e) {}
    }
  }

  function isCodeIntent(msg) {
    return /\b(code|write|implement|fix|patch|function|class|refactor|bug|script|js|ts|html|css|sql|python|api|endpoint|deploy|module)\b/i.test(
      String(msg || '')
    );
  }

  async function headers() {
    var cfg = global.SN_CONFIG || {};
    if (global.SNAuth && SNAuth.authHeaders) return SNAuth.authHeaders();
    return {
      'Content-Type': 'application/json',
      apikey: cfg.sbKey || global.SB_KEY,
      Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY),
    };
  }

  function aicycleUrl() {
    var cfg = global.SN_CONFIG || {};
    return (cfg.sbUrl || global.SB_URL) + '/functions/v1/aicycle';
  }

  function systemFor(mode) {
    var law =
      (typeof global.SNBrain?.systemPrompt === 'function' && global.SNBrain.systemPrompt()) ||
      'Astranov SpaceNet. SNGlobe Earth. CLI grab. S primary. Juice: shops jobs dates deliver.';
    var fork =
      'You are ASTRANOV AI — the living mind of Astranov SpaceNet (https://astranov.eu). ' +
      'Talk to the user like a capable co-pilot. Propose and run real SpaceNet actions: locate, city, shops, job, date, deliver, multi-tile, rate. ' +
      'Identity: Astranov only (not a vendor chatbot). Match Greek or English. Be concrete. 2–5 short sentences + one CLI step.';
    if (mode === 'code' || mode === 'coders') {
      return (
        fork +
        ' ' +
        law +
        ' MODE CODE: working code first, wire into js/spacenet/*.'
      );
    }
    return fork + ' ' + law + ' MODE CHAT: help them get juice done on the map.';
  }

  async function callEdge(message, mode, opts) {
    var body = {
      mode: mode === 'code' ? 'coders' : mode || 'chat',
      message: String(message || '').slice(0, opts && opts.long ? 4000 : 1400),
      system: String(systemFor(mode)).slice(0, 3200),
      fast: mode !== 'code' && mode !== 'coders',
    };
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var ms = mode === 'code' || mode === 'coders' ? 28000 : 12000;
    var t = setTimeout(function () {
      try {
        if (ctrl) ctrl.abort();
      } catch (e) {}
    }, ms);
    try {
      var r = await fetch(aicycleUrl(), {
        method: 'POST',
        headers: await headers(),
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined,
      });
      var j = await r.json().catch(function () {
        return {};
      });
      var text = String(j.text || j.response || j.message || j.content || '').trim();
      if (!text || /try again|no model|warming|unavailable|error/i.test(text)) return null;
      return text.slice(0, opts && opts.long ? 6000 : 900);
    } catch (e) {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  /**
   * Do real SpaceNet work for the user. Returns { did, reply }.
   */
  async function actLocal(message) {
    var line = String(message || '').trim();
    var low = line.toLowerCase();
    var did = [];
    var reply = '';

    function runCli(cmd) {
      try {
        if (global.SNCli && SNCli.run) {
          void SNCli.run(cmd);
          did.push(cmd);
          return true;
        }
      } catch (e) {}
      return false;
    }

    if (!line) {
      return { did: did, reply: 'I am Astranov. Say locate, shops, job, date, or just talk to me.' };
    }

    // Direct task verbs → execute
    if (/^(hi|hello|hey|γεια|καλησπέρα|καλημέρα|yo)\b/.test(low) || low === 'ai' || low === 'astronov' || low === 'astranov') {
      reply =
        'I am Astranov AI on SpaceNet. I can locate you, open city shops, post jobs/dates/deliveries, and multi-tile places. What do you want to do?';
      return { did: did, reply: reply };
    }

    if (/\b(locate|where am i|gps|find me)\b/.test(low)) {
      runCli('locate');
      reply = 'Locating you on Earth — then we can open nearby shops or drop a multi-tile.';
      return { did: did, reply: reply };
    }

    if (/\b(shops|vendors|stores|market|φαγητ|εστιατόρ|μαγαζ)\b/.test(low) || /^find\s+(food|pizza|coffee)/.test(low)) {
      runCli('shops');
      reply = 'Opening real shops on the city map. Tap a pin for menu · cart · order in S.';
      return { did: did, reply: reply };
    }

    if (/\b(city|street map|map)\b/.test(low) && !/\bglobe|earth\b/.test(low)) {
      runCli('city');
      reply = 'City map open. Zoom out or 🌍 returns to 3D SNGlobe Earth. Tap empty ground for multi-tile.';
      return { did: did, reply: reply };
    }

    if (/\b(earth|globe|global|back to earth)\b/.test(low)) {
      runCli('global');
      reply = 'Back on SNGlobe — full GLOBAL Earth imaging.';
      return { did: did, reply: reply };
    }

    if (/^date\b|\bcoffee\s*date\b|\bdating\b/.test(low)) {
      if (global.SNTasks && SNTasks.create) {
        var td = SNTasks.create(line);
        did.push('task:' + (td && td.id));
        reply = 'Date task open: ' + (td && td.title) + '. Claim from the map when ready.';
      } else {
        runCli(line);
        reply = 'Date flow started.';
      }
      return { did: did, reply: reply };
    }

    if (/^deliver|\bdelivery\b|\bpackage\b|food\s*order/.test(low)) {
      if (global.SNTasks && SNTasks.create) {
        var te = SNTasks.create(line.indexOf('deliver') >= 0 ? line : 'delivery ' + line);
        did.push('task:' + (te && te.id));
        reply = 'Delivery open: ' + (te && te.title) + '. Drivers can claim · fees in S.';
      } else reply = 'Delivery path ready — type deliver food.';
      return { did: did, reply: reply };
    }

    if (/^job\b|^gig\b|barman|bartender|cleaner|nanny|waiter|tutor|looking\s+for\s+work|need\s+a\b/.test(low)) {
      if (global.SNTasks && SNTasks.create) {
        var tj = SNTasks.create(line);
        did.push('task:' + (tj && tj.id));
        reply = 'Job posted: ' + (tj && tj.title) + '. Visible on map · task list.';
      } else reply = 'Try: job barman 3h';
      return { did: did, reply: reply };
    }

    if (/\b(rate|wallet|money|spacenets|\bs\b currency)\b/.test(low)) {
      runCli('rate');
      reply = 'S (SpaceNets) is primary. Fiat/crypto are secondary quotes only.';
      return { did: did, reply: reply };
    }

    if (/\b(resources|mine|donate|performance)\b/.test(low)) {
      runCli('resources');
      reply = 'Resources / mine panel — spare capacity earns S when you opt in.';
      return { did: did, reply: reply };
    }

    if (/\b(thesis|vault|mars|cydonia)\b/.test(low)) {
      if (/mars|cydonia/.test(low)) runCli('go to mars');
      else if (/vault/.test(low)) runCli('vault');
      else runCli('thesis');
      reply = 'Spatial place opened — zoom is open on SpaceNet.';
      return { did: did, reply: reply };
    }

    if (/\b(help|what can you do|commands)\b/.test(low) && line.length < 40) {
      reply =
        'I am Astranov AI. I talk and I act: locate · city · shops · job … · date … · deliver … · multi-tile (tap map) · rate · 🎙 hands-free. What should we do?';
      return { did: did, reply: reply };
    }

    // Conversational / unknown — local co-pilot still answers and suggests action
    reply =
      'Understood. I can run: locate, shops, city, job, date, deliver — or keep talking. ' +
      'Edge AI may enrich this when online. Next: try shops or locate.';
    return { did: did, reply: reply, needsEdge: true };
  }

  async function ask(message, opts) {
    opts = opts || {};
    var msg = String(message || '').trim();
    if (!msg) return null;
    busy = true;
    pushHist('user', msg);

    var local = await actLocal(msg);
    var mode = opts.mode || (isCodeIntent(msg) ? 'code' : 'chat');
    var text = null;

    // Always try edge for chat richness unless pure command already done
    if (mode === 'code' || mode === 'coders' || local.needsEdge || opts.forceEdge || !local.did.length) {
      text = await callEdge(
        local.reply
          ? msg + '\n\n[Local SpaceNet already: ' + (local.did.join(', ') || 'none') + '. Build on that.]'
          : msg,
        mode,
        { long: mode === 'code' }
      );
    }

    if (!text && mode === 'code') {
      text =
        'Code edge offline. Local: extend js/spacenet/* — CLI grab ui.js, SNGlobe globe.js, SNAi ai.js.';
    }

    if (!text) text = local.reply;
    if (!text) text = 'I am Astranov. Edge quiet — I still run locate · shops · job · date · deliver.';

    // Prefix so user always sees the mind
    if (!/^astranov/i.test(text)) text = 'Astranov AI · ' + text;

    pushHist('assistant', text);
    busy = false;
    return text;
  }

  async function code(message) {
    return ask(message, { mode: 'code', forceEdge: true });
  }

  async function coders(message) {
    return ask(message, { mode: 'coders', forceEdge: true });
  }

  async function research(query) {
    var q = String(query || '').trim();
    var crawled = global.SNSearch && SNSearch.crawl ? await SNSearch.crawl(q, { openMap: true, all: true }) : null;
    if (crawled && global.SNSearch && SNSearch.report) SNSearch.report(crawled);
    var summary =
      'User research: ' +
      q +
      '. Places: ' +
      (crawled && crawled.places && crawled.places[0] ? crawled.places[0].name : 'none') +
      '. Give map next steps.';
    var text = await ask(summary, { mode: 'chat', forceEdge: true });
    return { crawled: crawled, text: text };
  }

  /** Proactive presence — talk to user and offer work (every page load) */
  async function greet(force) {
    if (greeted && !force) return;
    greeted = true;
    try {
      sessionStorage.setItem(GREET_KEY, String(Date.now()));
    } catch (e) {}
    var lines = [
      'Astranov AI · online with you on SpaceNet.',
      'I talk and I act: locate · shops · job · date · deliver. Long-press map to create multi-tile. Short-tap pins to open.',
      'Type anything, tap ➤, or 🎙 — try: locate',
    ];
    lines.forEach(function (ln) {
      say(ln, 'ok');
    });
    pushHist('assistant', lines.join(' '));

    // Soft edge tip (non-blocking)
    try {
      var tip = await callEdge(
        'One short sentence: greet SpaceNet user and suggest locate or shops. You are Astranov AI only.',
        'chat',
        { long: false }
      );
      if (tip) say('Astranov AI · ' + tip.replace(/^astranov ai\s*[·:.-]\s*/i, ''), 'dim');
    } catch (e) {}
  }

  function bootPresence() {
    try {
      if (global.SNUi && SNUi.setSize) SNUi.setSize('mid', true);
      else if (global.SNUi && SNUi.expandPanel) SNUi.expandPanel(true);
    } catch (e) {}
    // Immediate local voice — do not wait for edge
    void greet(true);
  }

  loadHist();

  global.SNAi = {
    ask: ask,
    code: code,
    coders: coders,
    research: research,
    greet: greet,
    bootPresence: bootPresence,
    actLocal: actLocal,
    isCodeIntent: isCodeIntent,
    systemFor: systemFor,
    say: say,
    get busy() {
      return busy;
    },
    get history() {
      return hist.slice();
    },
    get ready() {
      return true;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
