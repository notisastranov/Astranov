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
    var flags = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
    var market =
      (global.SNMarket && SNMarket.coachStatus && SNMarket.coachStatus()) || {};
    var fork =
      'You are ASTRANOV AI — living mind of Astranov SpaceNet (https://astranov.eu). ' +
      'Co-pilot for real actions. Match Greek or English. 2–5 short sentences + one next step. ' +
      'FIRST MARKETPLACE LOOP (priority until done): list shop → menu add <item> <priceS> → order me → drive on → deliver me. ' +
      'Or: first delivery (auto-run full path). User is vendor+client+driver (no NPCs). ' +
      'Flags: firstDeliveryDone=' +
      !!flags.firstDeliveryDone +
      ' vendorListed=' +
      !!flags.firstVendorListed +
      ' coachStep=' +
      (market.step || 'idle') +
      '. ' +
      'If user reports pain/bug, queue handoff (say so). Identity: Astranov only.';
    if (mode === 'code' || mode === 'coders') {
      return (
        fork +
        ' ' +
        law +
        ' MODE CODE: working code first in js/spacenet/*; queue SNUsage.handoff for midnight Athens ship if not shippable now.'
      );
    }
    return fork + ' ' + law + ' MODE CHAT: coach first loop or juice on the map.';
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
      return {
        did: did,
        reply: 'I am Astranov. Try: first delivery · list shop … · locate · shops.',
      };
    }

    // Marketplace coach (vendor list → menu → order → drive → deliver)
    if (global.SNMarket && SNMarket.handleChat) {
      var mk = SNMarket.handleChat(line);
      if (mk && mk.handled) {
        if (mk.async && mk.action === 'runFirstLoop') {
          return {
            did: did.concat(['first_loop']),
            reply: 'Running first vendor→delivery loop now…',
            runFirstLoop: true,
          };
        }
        try {
          if (global.SNUsage && SNUsage.track) SNUsage.track('ai_market', { did: mk.did });
        } catch (e) {}
        return { did: (mk.did || []).concat(did), reply: mk.reply || 'Done.' };
      }
    }

    // Direct task verbs → execute
    if (/^(hi|hello|hey|γεια|καλησπέρα|καλημέρα|yo)\b/.test(low) || low === 'ai' || low === 'astronov' || low === 'astranov') {
      var fl = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
      reply = fl.firstDeliveryDone
        ? 'I am Astranov AI. Marketplace loop already done once — shops, jobs, dates, or tell me what hurt (I queue a midnight fix).'
        : 'I am Astranov AI. Let’s list your shop and do the first delivery to you. Type: first delivery  — or step by step: list shop Your Name';
      return { did: did, reply: reply };
    }

    // Bridge pain → handoff for coding agent
    if (/\b(broken|bug|fix this|handoff|painful|doesn'?t work|άχρηστο|χάλια|φτιάξε)\b/i.test(low) && line.length > 8) {
      try {
        if (global.SNUsage && SNUsage.handoff) SNUsage.handoff(line, { source: 'ai_act' });
        did.push('handoff');
      } catch (e) {}
      reply =
        'Logged for ship. One fix per Athens midnight from usage + handoffs. Type usage export to copy the packet for the coding agent.';
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

    if (/\b(thesis|vault|mars|cydonia|jupiter|moon|europa|titan|pluto|saturn|venus|mercury|neptune)\b/.test(low) || /^go\s+to\b/.test(low)) {
      if (/vault/.test(low) && !/go\s+to/.test(low)) runCli('vault');
      else if (/thesis|garage/.test(low) && !/go\s+to/.test(low)) runCli('thesis');
      else if (/cydonia/.test(low)) runCli('go to cydonia');
      else if (/mars/.test(low)) runCli('go to mars');
      else if (/moon|luna/.test(low)) runCli('go to moon');
      else if (/jupiter/.test(low)) runCli('go to jupiter');
      else if (/europa/.test(low)) runCli('go to europa');
      else if (/titan/.test(low)) runCli('go to titan');
      else if (/go\s+to\b/.test(low)) runCli(line);
      else runCli('cosmos');
      reply = 'Navigating SpaceNet body — real globe + crawl of what is there.';
      return { did: did, reply: reply };
    }

    if (/\b(help|what can you do|commands)\b/.test(low) && line.length < 40) {
      reply =
        'I talk and act: first delivery · list shop … · menu add … · order me · drive on · deliver me · locate · shops · job · date · usage. 🎙 hands-free OK.';
      return { did: did, reply: reply };
    }

    // Conversational / unknown — local co-pilot still answers and suggests action
    var fl2 = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
    reply = fl2.firstDeliveryDone
      ? 'Understood. Edge may enrich this. Try shops, locate, or tell me a pain point to handoff.'
      : 'Understood. Priority path: first delivery (auto) or list shop <name>. Edge may enrich when online.';
    return { did: did, reply: reply, needsEdge: true };
  }

  async function ask(message, opts) {
    opts = opts || {};
    var msg = String(message || '').trim();
    if (!msg) return null;
    busy = true;
    pushHist('user', msg);
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('ai_ask', { len: msg.length });
    } catch (e) {}

    var local = await actLocal(msg);
    var mode = opts.mode || (isCodeIntent(msg) ? 'code' : 'chat');
    var text = null;

    // Run first marketplace loop when requested
    if (local.runFirstLoop && global.SNMarket && SNMarket.runFirstLoop) {
      try {
        var fr = await SNMarket.runFirstLoop({});
        text =
          fr && fr.ok
            ? 'First delivery complete. You listed, ordered, drove, and delivered to yourself in S. Type usage · or tell me what was painful.'
            : 'First loop partial: ' +
              ((fr && fr.delivery && fr.delivery.error) ||
                (fr && fr.order && fr.order.error) ||
                'check CLI') +
              '. Try steps: list shop · menu add X 5 · order me · drive on · deliver me';
      } catch (e) {
        text = 'First loop error: ' + (e && e.message ? e.message : e);
      }
      if (!/^astranov/i.test(text)) text = 'Astranov AI · ' + text;
      pushHist('assistant', text);
      say(text, 'ok');
      busy = false;
      return text;
    }

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
        'Code edge offline. Local: extend js/spacenet/* — market.js usage.js ai.js. Queue handoff for Athens midnight ship.';
      try {
        if (global.SNUsage && SNUsage.handoff) SNUsage.handoff(msg, { source: 'code_offline' });
      } catch (e2) {}
    }

    if (!text) text = local.reply;
    if (!text) text = 'I am Astranov. Edge quiet — try first delivery · locate · shops.';

    // Prefix so user always sees the mind
    if (!/^astranov/i.test(text)) text = 'Astranov AI · ' + text;

    pushHist('assistant', text);
    // CLI / caller prints reply — avoid double log (say only for greet / first-loop)
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
    var fl = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
    var lines = fl.firstDeliveryDone
      ? [
          'Astranov AI · online on SpaceNet.',
          'Marketplace first loop already done on this device. shops · locate · or tell me a pain → midnight Greek fix.',
          'Type anything · ➤ · 🎙',
        ]
      : [
          'Astranov AI · online. Let’s make your first shop + delivery real.',
          'Type: first delivery  (auto list→menu→order→drive→deliver to you) — or: list shop Your Cafe',
          'S only · no NPC shops. ➤ send · 🎙 hands-free.',
        ];
    lines.forEach(function (ln) {
      say(ln, 'ok');
    });
    pushHist('assistant', lines.join(' '));
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('ai_greet', { firstDone: !!fl.firstDeliveryDone });
    } catch (e0) {}

    // Soft edge tip (non-blocking)
    try {
      var tip = await callEdge(
        fl.firstDeliveryDone
          ? 'One short sentence: greet SpaceNet user; suggest shops or report a pain for handoff. Astranov AI only.'
          : 'One short sentence: invite user to type first delivery for vendor+self-delivery loop. Astranov AI only.',
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
