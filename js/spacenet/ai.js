/**
 * SpaceNet AI — the mind of the net
 * Astranov = Architect of SpaceNet (human owner). AI is named SpaceNet only.
 * Priority: LISTEN → ANALYZE → RESPOND brief · show on globe (fly/zoom + vendor tile).
 * FREE FIRST: SNFreeMind (own product AI) — no paid xAI required for chat.
 * Vendor carousel: next · show all.
 */
(function (global) {
  'use strict';

  var HIST_KEY = 'sn:ai-hist-v1';
  var hist = [];
  var greeted = false;
  var busy = false;
  var GREET_KEY = 'sn:ai-greeted-session';
  var AI_NAME = 'SpaceNet';
  /** Vendor suggestion session: list + index for next / show all */
  var suggest = { list: [], idx: 0, query: '' };

  function brandReply(text) {
    var t = String(text || '').trim();
    if (!t) return t;
    t = t.replace(/^SpaceNet\s*[·:.-]\s*/i, '');
    t = t.replace(/^astranov\s*[·:.-]\s*/i, '');
    t = t.replace(/^SPACENET\s*[·:.-]\s*/i, '');
    // Keep all-caps status lines clean (SPACENET LISTENING)
    if (/^SPACENET\b/i.test(t) && t === t.toUpperCase()) return t;
    return AI_NAME + ' · ' + t;
  }

  /** One short line — AI must not monologue */
  function brief(text, maxLen) {
    maxLen = maxLen || 88;
    var t = String(text || '')
      .replace(/^SpaceNet\s*[·:.-]\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return '';
    var cut = t.search(/[.!?\n]/);
    if (cut > 12 && cut < maxLen) t = t.slice(0, cut + 1);
    if (t.length > maxLen) t = t.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…';
    return t;
  }

  /** Always paint reply on globe HUD + CLI preview/notice */
  function showOnGlobe(text) {
    var t = brief(text, 72);
    if (!t) return;
    try {
      if (global.SNGlobe && SNGlobe.setHud) SNGlobe.setHud(t);
    } catch (e) {}
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(t.slice(0, 90));
    } catch (e2) {}
    try {
      if (global.SNField && SNField.setNotice) SNField.setNotice(t.slice(0, 48));
    } catch (e3) {}
  }

  function setSuggestList(list, opts) {
    opts = opts || {};
    suggest.list = (list || []).filter(function (v) {
      return v && v.lat != null && v.lng != null;
    });
    suggest.idx = Math.max(0, Math.min(opts.idx || 0, Math.max(0, suggest.list.length - 1)));
    suggest.query = String(opts.query || suggest.query || '');
    return suggest.list.length;
  }

  function vendorLabel(v) {
    if (!v) return 'Shop';
    return String(v.shopName || v.name || 'Shop').slice(0, 36);
  }

  /**
   * Fly + zoom globe to vendor and open multi-tile.
   * Response always brief on globe HUD.
   */
  function presentVendor(idx, opts) {
    opts = opts || {};
    var n = suggest.list.length;
    if (!n) {
      return { ok: false, reply: 'No vendors · say pizza or shops', did: [] };
    }
    var i = ((Number(idx) % n) + n) % n;
    suggest.idx = i;
    var v = suggest.list[i];
    var name = vendorLabel(v);
    var km =
      v._km != null
        ? Number(v._km).toFixed(1) + ' km'
        : v.km != null
          ? Number(v.km).toFixed(1) + ' km'
          : '';
    try {
      if (opts.closeMap !== false && global.SNMap && SNMap.active && SNMap.close) {
        try {
          SNMap.close();
        } catch (e0) {}
      }
    } catch (e1) {}
    try {
      if (global.SNGlobe && SNGlobe.goToPlace && v.lat != null) {
        SNGlobe.goToPlace(v.lat, v.lng, {
          tier: opts.tier || 'city',
          body: 'earth',
          pulse: false,
          openMap: false,
          label: name,
        });
      }
    } catch (e2) {}
    try {
      if (global.SNTile && SNTile.open) SNTile.open(v, { tab: opts.tab || 'menu' });
    } catch (e3) {}
    try {
      global._snLastPos = { lat: v.lat, lng: v.lng };
      if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(v.lat, v.lng);
    } catch (e4) {}
    var reply =
      i +
      1 +
      '/' +
      n +
      ' · ' +
      name +
      (km ? ' · ' + km : '') +
      (n > 1 ? ' · next | show all' : '');
    // goToPlace sets HUD — re-apply AI line after camera settles
    setTimeout(function () {
      showOnGlobe(reply);
    }, 120);
    showOnGlobe(reply);
    return {
      ok: true,
      reply: reply,
      did: ['vendor:' + (v.id || i), 'suggest'],
      vendor: v,
      idx: i,
    };
  }

  function presentNext() {
    if (!suggest.list.length) {
      return { ok: false, reply: 'Nothing queued · say pizza or shops first', did: [] };
    }
    return presentVendor(suggest.idx + 1);
  }

  function presentPrev() {
    if (!suggest.list.length) {
      return { ok: false, reply: 'Nothing queued · say pizza or shops first', did: [] };
    }
    return presentVendor(suggest.idx - 1);
  }

  /** Pulse every vendor, fly to cluster center, open map marks */
  function presentAll() {
    var n = suggest.list.length;
    if (!n) {
      return { ok: false, reply: 'Nothing to show · say pizza or shops', did: [] };
    }
    var sumLat = 0;
    var sumLng = 0;
    var i;
    for (i = 0; i < n; i++) {
      sumLat += Number(suggest.list[i].lat);
      sumLng += Number(suggest.list[i].lng);
      try {
        if (global.SNGlobe && SNGlobe.pulse) {
          SNGlobe.pulse(
            suggest.list[i].lat,
            suggest.list[i].lng,
            i === suggest.idx ? 0x44ffaa : 0x3d9eff,
            vendorLabel(suggest.list[i]),
            22000
          );
        }
      } catch (e) {}
    }
    var cLat = sumLat / n;
    var cLng = sumLng / n;
    try {
      if (global.SNGlobe && SNGlobe.goToPlace) {
        SNGlobe.goToPlace(cLat, cLng, {
          tier: n > 4 ? 'regional' : 'city',
          body: 'earth',
          pulse: false,
          openMap: true,
          label: n + ' vendors',
        });
      }
    } catch (e2) {}
    try {
      if (global.SNMap && SNMap.open) {
        void SNMap.open(cLat, cLng).then(function () {
          try {
            if (global.SNMap.showProfiles) SNMap.showProfiles();
          } catch (e3) {}
        });
      }
    } catch (e4) {}
    var reply = n + ' vendors on map · next for one · tap tile';
    setTimeout(function () {
      showOnGlobe(reply);
    }, 160);
    showOnGlobe(reply);
    return { ok: true, reply: reply, did: ['suggest:all', 'shops'], count: n };
  }

  /** Build vendor list near focus (shops / food without full order path) */
  async function loadVendorsNear(query) {
    var pos =
      (global.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) ||
      global._snLastPos ||
      (global.SNTasks && SNTasks.pos) ||
      { lat: 36.4341, lng: 28.2176 };
    try {
      if (global.SNCommerce && SNCommerce.ensureSector) {
        await SNCommerce.ensureSector(pos.lat, pos.lng, { openMap: false });
      }
    } catch (e) {}
    var list = [];
    try {
      list = (global.SNProfiles && SNProfiles.list({ role: 'vendor' })) || [];
    } catch (e2) {}
    list = (list || []).filter(function (v) {
      return v && v.lat != null && v.lng != null;
    });
    var q = String(query || '').toLowerCase();
    if (q && q !== 'food' && q !== 'shops' && q !== 'vendors') {
      var scored = list.map(function (v) {
        var blob = ((v.shopName || '') + ' ' + (v.name || '') + ' ' + (v.shopKind || '')).toLowerCase();
        var hit = blob.indexOf(q) >= 0 ? 20 : 0;
        var km = 99;
        try {
          var R = 6371;
          var dLat = ((v.lat - pos.lat) * Math.PI) / 180;
          var dLng = ((v.lng - pos.lng) * Math.PI) / 180;
          var x =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((pos.lat * Math.PI) / 180) *
              Math.cos((v.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          km = 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
        } catch (e3) {}
        return Object.assign({}, v, { _km: km, _score: hit + Math.max(0, 25 - km * 5) });
      });
      scored.sort(function (a, b) {
        return (b._score || 0) - (a._score || 0);
      });
      list = scored;
    } else {
      list = list
        .map(function (v) {
          var km = 99;
          try {
            var R = 6371;
            var dLat = ((v.lat - pos.lat) * Math.PI) / 180;
            var dLng = ((v.lng - pos.lng) * Math.PI) / 180;
            var x =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((pos.lat * Math.PI) / 180) *
                Math.cos((v.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            km = 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
          } catch (e4) {}
          return Object.assign({}, v, { _km: km });
        })
        .sort(function (a, b) {
          return (a._km || 99) - (b._km || 99);
        });
    }
    return list.slice(0, 12);
  }

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
    var t = brief(text, 120);
    if (!t) return;
    showOnGlobe(t);
    if (global.SNCli && SNCli.log) {
      SNCli.log(t, cls || 'ok');
    }
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
    var focus = '';
    try {
      var f = (global.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) || global._snLastPos;
      if (f && f.lat != null)
        focus = ' Globe focus ' + Number(f.lat).toFixed(3) + ',' + Number(f.lng).toFixed(3) + '.';
    } catch (e) {}
    var fork =
      'You are SPACENET — AI of https://astranov.eu. Astranov = Architect of SpaceNet (human). Never call yourself Astranov. ' +
      'PRIORITY: 1) LISTEN 2) ANALYZE 3) RESPOND in ONE short line (max ~12 words). No monologue. ' +
      'Show results on the globe: fly + zoom + open vendor tile. ' +
      'User may say NEXT (next vendor) or SHOW ALL (all vendors on map). ' +
      'Local client already flies SNGlobe and opens tiles. ' +
      'Optional tags only: [[LOCATE]] [[GO:place]] [[CITY]] [[SHOPS]] [[GLOBAL]]. ' +
      'FOOD: browse vendors first; order only if user says order. ' +
      'Flags: firstDeliveryDone=' +
      !!flags.firstDeliveryDone +
      ' vendorListed=' +
      !!flags.firstVendorListed +
      ' coachStep=' +
      (market.step || 'idle') +
      '.' +
      focus +
      ' Sign as SpaceNet only.';
    if (mode === 'code' || mode === 'coders') {
      return (
        fork +
        ' ' +
        law +
        ' MODE CODE: working code first in js/spacenet/*; queue SNUsage.handoff for midnight Athens ship if not shippable now.'
      );
    }
    return fork + ' ' + law + ' MODE CHAT: coach first loop; globe follows place intents.';
  }

  /**
   * Drive SNGlobe / SNCosmos for real — AI words must move the sphere.
   * Never nested freeform CLI (that re-enters AI and leaves the globe stuck).
   */
  async function globeGo(target, opts) {
    opts = opts || {};
    var raw = String(target || '').trim();
    if (!raw) return { ok: false, error: 'empty' };
    var low = raw.toLowerCase().replace(/^(go\s+to|goto|fly\s+to|fly|take\s+me\s+to|show\s+me|where\s+is|open)\s+/i, '').trim();
    try {
      if (global.SNMap && SNMap.close && opts.closeMap !== false) {
        try {
          SNMap.close();
        } catch (e) {}
      }
      // Planetary / multi-body
      if (global.SNCosmos && SNCosmos.resolve && SNCosmos.resolve(low)) {
        await SNCosmos.go(low);
        return { ok: true, kind: 'body', id: low };
      }
      if (global.SNCosmos && SNCosmos.parseGo) {
        var dest = SNCosmos.parseGo('go to ' + low);
        if (dest && SNCosmos.resolve && SNCosmos.resolve(dest)) {
          await SNCosmos.go(dest);
          return { ok: true, kind: 'body', id: dest };
        }
      }
      // Earth place via geocode
      var places = null;
      if (global.SNSearch && SNSearch.geocode) {
        places = await SNSearch.geocode(raw);
      }
      if (places && places[0] && places[0].lat != null) {
        var p = places[0];
        if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody('earth');
        if (global.SNGlobe && SNGlobe.goToPlace) {
          SNGlobe.goToPlace(p.lat, p.lng, {
            tier: opts.tier || 'national',
            label: String(p.name || raw).slice(0, 40),
            body: 'earth',
            pulse: false,
            openMap: !!opts.openMap,
          });
        } else if (global.SNGlobe && SNGlobe.flyNear) {
          SNGlobe.flyNear(p.lat, p.lng, opts.tier || 'national');
        }
        try {
          if (global.SNTasks && SNTasks.setPos) SNTasks.setPos(p.lat, p.lng);
          global._snLastPos = { lat: p.lat, lng: p.lng };
        } catch (e2) {}
        return { ok: true, kind: 'place', name: p.name, lat: p.lat, lng: p.lng };
      }
      // Locate self
      if (/^(me|here|home|gps|locate)$/i.test(low)) {
        if (global.SNGlobe && SNGlobe.locate) {
          var pos = await SNGlobe.locate();
          return { ok: !!pos, kind: 'locate', lat: pos && pos.lat, lng: pos && pos.lng };
        }
      }
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
    return { ok: false, error: 'not found', query: raw };
  }

  /** Pull place/body intent from user speech/text */
  function parsePlaceIntent(line) {
    var s = String(line || '').trim();
    if (!s) return null;
    var m =
      s.match(
        /^(?:go\s+to|goto|fly\s+to|fly|take\s+me\s+to|show\s+me|where\s+is|open|πήγαινε(?:\s+στην|\s+στο|\s+σε)?|δείξε(?:\s+μου)?)\s+(.+)$/i
      ) ||
      s.match(/^(?:near|around|in)\s+(.+)$/i);
    if (m) return m[1].trim();
    // Bare body names
    if (
      /^(earth|mars|moon|luna|jupiter|europa|titan|venus|mercury|saturn|neptune|uranus|pluto|cydonia)$/i.test(
        s
      )
    )
      return s;
    return null;
  }

  /** Execute [[GO:x]] [[LOCATE]] etc from edge AI; strip tags from visible text */
  async function applyActionTags(text) {
    var t = String(text || '');
    var did = [];
    var re = /\[\[\s*(GO|FLY|LOCATE|CITY|SHOPS|GLOBAL|EARTH)\s*(?::\s*([^\]]+))?\s*\]\]/gi;
    var m;
    var targets = [];
    while ((m = re.exec(t))) {
      targets.push({ op: m[1].toUpperCase(), arg: (m[2] || '').trim() });
    }
    t = t.replace(re, ' ').replace(/\s{2,}/g, ' ').trim();
    for (var i = 0; i < targets.length; i++) {
      var a = targets[i];
      try {
        if (a.op === 'LOCATE') {
          if (global.SNGlobe && SNGlobe.locate) await SNGlobe.locate();
          did.push('locate');
        } else if (a.op === 'CITY') {
          var pos = global._snLastPos || (global.SNTasks && SNTasks.pos);
          if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('city');
          if (pos && global.SNMap && SNMap.open) await SNMap.open(pos.lat, pos.lng);
          did.push('city');
        } else if (a.op === 'SHOPS') {
          var p2 = global._snLastPos || { lat: 36.43, lng: 28.22 };
          if (global.SNGlobe && SNGlobe.goToPlace)
            SNGlobe.goToPlace(p2.lat, p2.lng, { tier: 'national', body: 'earth', pulse: false });
          if (global.SNCommerce && SNCommerce.ensureSector)
            await SNCommerce.ensureSector(p2.lat, p2.lng, { openMap: true });
          did.push('shops');
        } else if (a.op === 'GLOBAL' || a.op === 'EARTH') {
          if (global.SNMap && SNMap.close) SNMap.close();
          if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody('earth');
          if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
          did.push('global');
        } else if ((a.op === 'GO' || a.op === 'FLY') && a.arg) {
          var r = await globeGo(a.arg, { closeMap: true });
          if (r && r.ok) did.push('go:' + a.arg);
        }
      } catch (e) {}
    }
    return { text: t, did: did };
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
   * Globe navigation uses globeGo — never nested freeform AI.
   */
  async function actLocal(message) {
    var line = String(message || '').trim();
    var low = line.toLowerCase();
    var did = [];
    var reply = '';

    /** Safe CLI for known short commands only (not freeform) */
    async function runCli(cmd) {
      try {
        if (global.SNCli && SNCli.run) {
          await SNCli.run(cmd);
          did.push(cmd);
          return true;
        }
      } catch (e) {}
      return false;
    }

    if (!line) {
      return {
        did: did,
        reply: 'SPACENET LISTENING',
      };
    }

    // —— Vendor carousel: NEXT / PREV / SHOW ALL (priority after listen) ——
    if (/^(next|επόμεν|επομεν|άλλο|αλλο|another|next\s*one|n)\b/i.test(low) || low === 'n' || low === '>>') {
      var nx = presentNext();
      return { did: did.concat(nx.did || []), reply: nx.reply, skipBrand: true };
    }
    if (/^(prev|previous|back|προηγ|πίσω|πριν)\b/i.test(low) || low === 'p' || low === '<<') {
      var pv = presentPrev();
      return { did: did.concat(pv.did || []), reply: pv.reply, skipBrand: true };
    }
    if (
      /^(show\s*all|all|όλα|ολα|όλοι|ολοι|show\s*all\s*vendors|list\s*all)\b/i.test(low) ||
      low === 'show all'
    ) {
      var al = presentAll();
      return { did: did.concat(al.did || []), reply: al.reply, skipBrand: true };
    }

    // Food juice: "pizza" / "order sushi" → find vendors · fly · tile (order only if said)
    if (global.SNMarket && SNMarket.parseFoodIntent && SNMarket.fulfillFoodIntent) {
      var foodIntent = SNMarket.parseFoodIntent(line);
      if (foodIntent) {
        return {
          did: did.concat(['food_intent:' + foodIntent.food]),
          reply: 'Finding ' + foodIntent.food + '…',
          runFoodIntent: foodIntent,
        };
      }
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
    if (
      /^(hi|hello|hey|γεια|καλησπέρα|καλημέρα|yo)\b/.test(low) ||
      low === 'ai' ||
      low === 'spacenet' ||
      low === 'astronov' ||
      low === 'astranov'
    ) {
      reply = 'SPACENET LISTENING';
      showOnGlobe(reply);
      return { did: did, reply: reply, skipBrand: true };
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

    // —— Globe follows AI (priority navigation) ——
    if (/\b(locate|where am i|gps|find me|βρες\s+με)\b/.test(low)) {
      try {
        if (global.SNGlobe && SNGlobe.locate) {
          var loc = await SNGlobe.locate();
          did.push('locate');
          reply = loc
            ? 'Globe on you · ' +
              Number(loc.lat).toFixed(3) +
              ', ' +
              Number(loc.lng).toFixed(3) +
              (loc.fallback ? ' (GPS default)' : '') +
              '. Say shops when ready.'
            : 'Locate failed · try again.';
        } else {
          await runCli('locate');
          reply = 'Locating on SNGlobe…';
        }
      } catch (e) {
        reply = 'Locate error · ' + (e.message || e);
      }
      return { did: did, reply: reply };
    }

    var placeIntent = parsePlaceIntent(line);
    if (
      placeIntent ||
      /\b(thesis|vault|mars|cydonia|jupiter|moon|europa|titan|pluto|saturn|venus|mercury|neptune)\b/.test(
        low
      ) ||
      /^go\s+to\b|^fly\b|^take\s+me\b/.test(low)
    ) {
      var dest = placeIntent;
      if (!dest) {
        if (/vault/.test(low)) dest = 'garage';
        else if (/thesis|garage/.test(low)) dest = 'garage rhodes';
        else if (/cydonia/.test(low)) dest = 'cydonia';
        else if (/mars/.test(low)) dest = 'mars';
        else if (/moon|luna/.test(low)) dest = 'moon';
        else if (/jupiter/.test(low)) dest = 'jupiter';
        else if (/europa/.test(low)) dest = 'europa';
        else if (/titan/.test(low)) dest = 'titan';
        else if (/pluto/.test(low)) dest = 'pluto';
        else if (/saturn/.test(low)) dest = 'saturn';
        else if (/venus/.test(low)) dest = 'venus';
        else if (/mercury/.test(low)) dest = 'mercury';
        else if (/neptune/.test(low)) dest = 'neptune';
        else dest = line.replace(/^(go\s+to|fly\s+to|fly|take\s+me\s+to)\s+/i, '').trim();
      }
      if (/garage|thesis|rhodes\s*garage/i.test(dest)) {
        if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody('earth');
        if (global.SNGlobe && SNGlobe.goToPlace) {
          SNGlobe.goToPlace(36.44125, 28.22255, {
            tier: 'national',
            label: 'Garage Rhodes',
            body: 'earth',
            pulse: false,
          });
          did.push('go:garage');
          reply = 'Globe · garage Rhodes. National zoom.';
          return { did: did, reply: reply };
        }
      }
      var nav = await globeGo(dest, { closeMap: true, tier: 'national' });
      if (nav && nav.ok) {
        did.push('go:' + (nav.id || nav.name || dest));
        reply =
          nav.kind === 'body'
            ? 'Globe switched · ' + (nav.id || dest) + ' · land + crawl.'
            : 'Globe flying · ' +
              (nav.name || dest) +
              (nav.lat != null ? ' · ' + Number(nav.lat).toFixed(2) + ', ' + Number(nav.lng).toFixed(2) : '') +
              '.';
        return { did: did, reply: reply };
      }
      reply = 'Could not find “' + dest + '” on SpaceNet · try fly athens · go to mars · locate.';
      return { did: did, reply: reply };
    }

    if (
      /^(shops|vendors|stores|market)$/i.test(low) ||
      /\b(shops|vendors|stores|market|φαγητ|εστιατόρ|μαγαζ)\b/.test(low) ||
      /^find\s+(food|pizza|coffee)/.test(low)
    ) {
      try {
        var near = await loadVendorsNear('shops');
        setSuggestList(near, { query: 'shops', idx: 0 });
        if (near.length) {
          var sh = presentVendor(0);
          return {
            did: did.concat(sh.did || ['shops']),
            reply: sh.reply,
            skipBrand: true,
          };
        }
        did.push('shops');
        reply = 'No shops near focus · fly a city first';
      } catch (e) {
        await runCli('shops');
        reply = 'Shops scan failed · try again';
      }
      return { did: did, reply: reply };
    }

    if (/\b(city|street map|map)\b/.test(low) && !/\bglobe|earth\b/.test(low)) {
      var cp = global._snLastPos || (global.SNTasks && SNTasks.pos) || { lat: 36.43, lng: 28.22 };
      try {
        if (global.SNGlobe && SNGlobe.goToPlace) {
          SNGlobe.goToPlace(cp.lat, cp.lng, { tier: 'city', body: 'earth', pulse: false, openMap: true });
        } else {
          if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('city');
          if (global.SNMap && SNMap.open) await SNMap.open(cp.lat, cp.lng);
        }
        did.push('city');
      } catch (e) {
        await runCli('city');
      }
      reply = 'City map at focus · Astranov SpaceNet home returns to full Earth.';
      return { did: did, reply: reply };
    }

    if (/\b(earth|globe|global|back to earth)\b/.test(low) || low === 'home') {
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
        if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody('earth');
        if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
        did.push('global');
      } catch (e) {
        await runCli('global');
      }
      reply = 'Globe · full GLOBAL Earth.';
      return { did: did, reply: reply };
    }

    if (/^date\b|\bcoffee\s*date\b|\bdating\b|available\s*woman|meet\s*(a\s*)?woman/.test(low)) {
      if (global.SNMarket && SNMarket.fulfillDatingIntent) {
        try {
          var dr = await SNMarket.fulfillDatingIntent(line);
          did.push('dating_fulfill');
          reply = (dr && dr.reply) || 'Dating request path ran.';
        } catch (e) {
          reply = 'Dating path failed · ' + (e.message || e);
        }
      } else if (global.SNTasks && SNTasks.create) {
        var td = SNTasks.create(line);
        did.push('task:' + (td && td.id));
        reply = 'Date task open: ' + (td && td.title) + '. Claim from the map when ready.';
      } else {
        reply = 'Date flow — try: date coffee';
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
      if (global.SNMarket && SNMarket.fulfillWorkIntent) {
        try {
          var wr = await SNMarket.fulfillWorkIntent(line);
          did.push('work_fulfill');
          reply = (wr && wr.reply) || 'Work offer path ran.';
        } catch (e) {
          reply = 'Work path failed · ' + (e.message || e);
        }
      } else if (global.SNTasks && SNTasks.create) {
        var tj = SNTasks.create(line);
        did.push('task:' + (tj && tj.id));
        reply = 'Job posted: ' + (tj && tj.title) + '. Visible on map · task list.';
      } else reply = 'Try: job barman 3h';
      return { did: did, reply: reply };
    }

    if (/\b(rate|wallet|money|spacenets|\bs\b currency)\b/.test(low)) {
      await runCli('rate');
      reply = 'S (SpaceNets) is primary. Fiat/crypto are secondary quotes only.';
      return { did: did, reply: reply };
    }

    if (/\b(resources|mine|donate|performance)\b/.test(low)) {
      await runCli('resources');
      reply = 'Resources / mine panel — spare capacity earns S when you opt in.';
      return { did: did, reply: reply };
    }

    if (/\b(help|what can you do|commands)\b/.test(low) && line.length < 40) {
      reply = 'pizza · shops · next · show all · fly · locate';
      return { did: did, reply: reply };
    }

    // Conversational — still try place-ish free text as geocode (short phrases)
    if (line.length < 48 && !/\?$/.test(line) && /^[a-zA-Zα-ωΑ-Ω\s\-']+$/u.test(line)) {
      var guess = await globeGo(line, { closeMap: true });
      if (guess && guess.ok) {
        did.push('go:' + (guess.name || line));
        reply =
          'Globe · ' +
          (guess.name || line) +
          (guess.kind === 'body' ? ' body' : '') +
          '. Say shops or city next.';
        return { did: did, reply: reply };
      }
    }

    var fl2 = (global.SNUsage && SNUsage.getFlags && SNUsage.getFlags()) || {};
    reply = fl2.firstDeliveryDone
      ? 'Understood. Edge may enrich. Globe: fly <place> · go to mars · locate.'
      : 'Understood. Globe follows: fly athens · go to mars · locate · or first delivery.';
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
      text = brandReply(text);
      pushHist('assistant', text);
      say(text, 'ok');
      busy = false;
      return text;
    }

    // Food intent: find → fly/zoom → open tile · next / show all (order only if said)
    if (local.runFoodIntent && global.SNMarket && SNMarket.fulfillFoodIntent) {
      try {
        var wantOrder =
          local.runFoodIntent.autoOrder === true ||
          /\b(order|order\s+me|bring|get\s+me|παράγγειλ)\b/i.test(msg);
        var foodR = await SNMarket.fulfillFoodIntent(local.runFoodIntent, {
          autoOrder: wantOrder,
          quiet: true,
        });
        if (foodR && foodR.vendors && foodR.vendors.length) {
          setSuggestList(foodR.vendors, { query: foodR.food || local.runFoodIntent.food, idx: 0 });
          var shown = presentVendor(0);
          text = shown.reply;
          if (wantOrder && foodR.order && foodR.order.ok) {
            text = brief(shown.reply + ' · ordered', 88);
            showOnGlobe(text);
          }
        } else {
          text = brief(
            (foodR && foodR.error) ||
              (foodR && foodR.reply) ||
              'No ' + (local.runFoodIntent.food || 'food') + ' near you',
            88
          );
          showOnGlobe(text);
        }
      } catch (eFood) {
        text = 'Find failed · try shops';
        showOnGlobe(text);
      }
      text = local.skipBrand ? text : brandReply(text);
      // presentVendor already branded-free brief — keep as-is if skip
      if (text && text.indexOf('·') > 0 && /^\d+\//.test(text)) {
        /* carousel line: leave unbranded for HUD clarity */
      } else if (!/^SpaceNet\b/i.test(text) && !/^SPACENET\b/i.test(text) && !/^\d+\//.test(text)) {
        text = brandReply(text);
      }
      pushHist('assistant', text);
      // CLI caller logs once — avoid double lines
      busy = false;
      return text;
    }

    // —— FREE FIRST: own SpaceNet Free mind (no paid xAI / no begging) ——
    var freeHit = null;
    if (mode !== 'code' && mode !== 'coders' && !opts.forceEdge) {
      try {
        if (global.SNFreeMind && SNFreeMind.answer) {
          freeHit = SNFreeMind.answer(msg, {
            localReply: local.reply,
            did: local.did,
            needsEdge: !!local.needsEdge,
          });
          if (freeHit && freeHit.text && freeHit.score >= 0.28) {
            text = freeHit.text;
            try {
              if (SNFreeMind.learnInteraction)
                SNFreeMind.learnInteraction(msg, text, {
                  score: freeHit.score,
                  source: freeHit.source,
                });
            } catch (eLearn) {}
          }
        }
      } catch (eFree) {}
    }

    // Paid/cloud edge ONLY for code modes or explicit forceEdge — never required for free chat
    if (
      !text &&
      (mode === 'code' || mode === 'coders' || opts.forceEdge === true)
    ) {
      text = await callEdge(
        local.reply
          ? msg +
              '\n\n[Local SpaceNet already did: ' +
              (local.did.join(', ') || 'none') +
              '. Globe may have moved. Build on that. You may add [[GO:place]] tags.]'
          : msg,
        mode,
        { long: mode === 'code' }
      );
    }

    if (!text && mode === 'code') {
      text =
        'Code offline · free mind cannot ship patches yet · handoff for Athens midnight.';
      try {
        if (global.SNUsage && SNUsage.handoff) SNUsage.handoff(msg, { source: 'code_offline' });
      } catch (e2) {}
    }

    if (!text) text = local.reply;
    if (!text && freeHit && freeHit.text) text = freeHit.text;
    if (!text) text = 'SpaceNet Free · pizza · shops · next · fly · locate · teach to grow';

    // Edge tags → move globe; strip tags from spoken/visible text
    try {
      var applied = await applyActionTags(text);
      text = applied.text || text;
      if (applied.did && applied.did.length) {
        try {
          if (global.SNUsage && SNUsage.track)
            SNUsage.track('ai_globe_tags', { did: applied.did });
        } catch (e3) {}
      }
    } catch (e4) {}

    // If nothing navigated yet and user mentioned a place-ish phrase, last chance follow
    if (!local.did || !local.did.some(function (d) {
      return /^(go:|locate|shops|city|global)/.test(d);
    })) {
      var pi = parsePlaceIntent(msg);
      if (pi) {
        try {
          var late = await globeGo(pi, { closeMap: true });
          if (late && late.ok) {
            text =
              (text || '') +
              (late.kind === 'body'
                ? ' · Globe on ' + (late.id || pi)
                : ' · Globe on ' + (late.name || pi));
          }
        } catch (e5) {}
      }
    }

    // Brief + brand; carousel / status lines stay clean
    text = brief(text, 100);
    if (local.skipBrand || /^\d+\//.test(text) || /^SPACENET\b/i.test(text)) {
      /* keep */
    } else {
      text = brandReply(text);
    }
    showOnGlobe(text);

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

  /** Boot stays quiet — AI button says SPACENET LISTENING when user taps */
  async function greet(force) {
    if (greeted && !force) return;
    greeted = true;
    try {
      sessionStorage.setItem(GREET_KEY, String(Date.now()));
    } catch (e) {}
    // No boot monologue — listen-first law
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('ai_greet', { silent: true });
    } catch (e0) {}
  }

  function bootPresence() {
    // Do not spam CLI on load — user activates AI ribbon for SPACENET LISTENING
    greeted = true;
  }

  /** AI ribbon pressed — brief status only */
  function listeningOn() {
    var t = 'SPACENET LISTENING';
    showOnGlobe(t);
    if (global.SNCli && SNCli.log) SNCli.log(t, 'ok');
    return t;
  }

  function listeningOff() {
    var t = 'SPACENET OFF';
    showOnGlobe(t);
    if (global.SNCli && SNCli.log) SNCli.log(t, 'dim');
    return t;
  }

  loadHist();

  global.SNAi = {
    NAME: AI_NAME,
    brandReply: brandReply,
    brief: brief,
    showOnGlobe: showOnGlobe,
    ask: ask,
    code: code,
    coders: coders,
    research: research,
    greet: greet,
    bootPresence: bootPresence,
    listeningOn: listeningOn,
    listeningOff: listeningOff,
    actLocal: actLocal,
    globeGo: globeGo,
    parsePlaceIntent: parsePlaceIntent,
    applyActionTags: applyActionTags,
    isCodeIntent: isCodeIntent,
    systemFor: systemFor,
    say: say,
    freeMind: function () {
      return global.SNFreeMind || null;
    },
    setSuggestList: setSuggestList,
    presentVendor: presentVendor,
    presentNext: presentNext,
    presentPrev: presentPrev,
    presentAll: presentAll,
    get suggest() {
      return {
        list: suggest.list.slice(),
        idx: suggest.idx,
        query: suggest.query,
      };
    },
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
