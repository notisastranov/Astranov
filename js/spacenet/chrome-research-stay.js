/**
 * Guest research stay-put — Build 20260823210000-combine (from #164)
 * ONE guest box: questions asked in the live CLI ANSWER in the CLI,
 * and the camera STAYS PUT for non-place research.
 * Real paid mind only: /api/ai allow_paid:true. Currency ⭐.
 */
(function (G) {
  'use strict';
  if (G.__snResearchStay20260823190000) return;
  G.__snResearchStay20260823190000 = 1;
  var BUILD = '20260823210000-combine';
  var freezeUntil = 0, freezeSnap = null, freezeAllowFly = false, freezeAllowPin = false, answering = false;
  var FAKE_YOU = [
    { lat: 36.387557, lng: 28.222533, r: 0.03 },
    { lat: 36.434, lng: 28.217, r: 0.06 },
    { lat: 37.339, lng: -121.895, r: 0.12 },
    { lat: 37.33, lng: -121.89, r: 0.12 }
  ];
  var PLACES = [
    { re: /\bnairobi\b|\bkenya\b/i, name: 'Nairobi', lat: -1.286389, lng: 36.817223 },
    { re: /\bkalithea\b|\bkallithea\b/i, name: 'Kalithea', lat: 36.387557, lng: 28.222533 },
    { re: /\brhodes\b|\brodos\b|\bρόδος\b/i, name: 'Rhodes', lat: 36.44, lng: 28.22 },
    { re: /\bathens\b|\bαθήνα\b/i, name: 'Athens', lat: 37.9838, lng: 23.7275 }
  ];
  function now() { return Date.now(); }
  function frozen() { return now() < freezeUntil; }
  function near(a, b, r) { if (a == null || b == null) return false; return Math.abs(Number(a) - Number(b)) <= (r || 0.08); }
  function isFakeYou(lat, lng) {
    lat = Number(lat); lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng)) return false;
    for (var i = 0; i < FAKE_YOU.length; i++) {
      var f = FAKE_YOU[i];
      if (near(lat, f.lat, f.r) && near(lng, f.lng, f.r)) return f;
    }
    return null;
  }
  function viewLatLng() {
    try {
      if (G.SNGlobe && typeof SNGlobe.viewLatLng === 'function') {
        var v = SNGlobe.viewLatLng();
        if (v && v.lat != null) return { lat: Number(v.lat), lng: Number(v.lng) };
      }
    } catch (_) {}
    return null;
  }
  function stayGlobe() {
    try { if (G.SNMap && SNMap.active && typeof SNMap.close === 'function') SNMap.close(); } catch (_) {}
  }
  function starify(text) {
    return String(text == null ? '' : text).replace(/[æÆ]/g, '⭐').replace(/\u00e6|\u00c6/g, '⭐').replace(/\bAE\b/g, '⭐');
  }
  function stripActionTags(text) {
    return String(text || '').replace(/\[\[\s*(GO|FLY|LOCATE|CITY|SHOPS|GLOBAL|EARTH|MAP|BASEMAP|LAYER|LAYERS|OVERLAY|PILOT|CLI|TILE|CMD|YOUTUBE|YT|IMAGINE|IMAGE)\s*(?::\s*[^\]]+)?\s*\]\]/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  function genuinePlace(line) {
    var s = String(line || '');
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].re.test(s)) return PLACES[i];
    return null;
  }
  function isSiblingOwned(line) {
    var s = String(line || '').trim();
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (!s) return false;
    if (/\?$/.test(s)) return false;
    if (/^(what|why|how|who|when|explain|tell me|define)\b/i.test(low)) return false;
    if (/^(laptop|laptops|buy (a )?laptops?|order (me )?(a )?laptop|get (me )?(a )?laptop|find (a )?laptop|i want (a )?laptop|need (a )?laptop)$/i.test(low)) return true;
    if (/\bpizza\b|\bpizzeria\b/i.test(low) && !/^(what|why|how)\b/i.test(low)) return true;
    if (/^(nairobi|kenya|africa|kalithea|kallithea|rhodes|rodos|ρόδος)$/i.test(low)) return true;
    if (/^(call|hangup|hang up|webrtc)\b/i.test(low)) return true;
    if (/^(locate|gps|power(\s+on|\s+off)?|polygon|poly|install|login|layers|send)\b/i.test(low)) return true;
    return false;
  }
  function isResearchish(line) {
    var s = String(line || '').trim();
    var low = s.toLowerCase();
    if (!s || s.length < 2) return false;
    if (isSiblingOwned(s)) return false;
    if (/^(help|status|boot|diag|network|battery|device|clear|cancel|mute|install|login)\b/i.test(low) && !/\?$/.test(s)) return false;
    if (/\?$/.test(s)) return true;
    if (/^(what|why|how|who|when|explain|tell me|define)\b/i.test(low)) return true;
    if (/^(is |are |can |do |does |should |would |could )\b/i.test(low) && s.length > 8) return true;
    return false;
  }
  function openLiveCli() {
    try {
      var panel = document.getElementById('panel');
      if (panel) { panel.classList.add('sn-open', 'open'); panel.classList.remove('collapsed', 'sn-quiet'); }
    } catch (_) {}
    try {
      var el = document.getElementById('cli-log');
      if (el) {
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('max-height', '26vh', 'important');
        el.style.setProperty('overflow-y', 'auto', 'important');
      }
    } catch (_) {}
  }
  function paintLiveCli(s, c) {
    s = String(s == null ? '' : s).slice(0, 480);
    if (!s) return;
    openLiveCli();
    try {
      var el = document.getElementById('cli-log');
      if (!el) return;
      var wrap = document.createElement('div');
      wrap.className = 'cli-feed-item is-latest';
      wrap.setAttribute('data-sn-research-stay', '1');
      var line = document.createElement('div');
      line.className = 'cli-line ' + (c === 'dim' ? 'progress' : (c || 'ok'));
      var body = document.createElement('div');
      body.className = 'cli-body';
      body.textContent = s;
      line.appendChild(body);
      wrap.appendChild(line);
      el.appendChild(wrap);
      try { el.scrollTop = el.scrollHeight; } catch (__) {}
    } catch (_) {}
  }
  function say(m, c) {
    var s = starify(String(m == null ? '' : m)).slice(0, 480);
    if (!s) return;
    try { if (G.SNCli && SNCli.log) SNCli.log(s, c || 'ok', true); } catch (_) {}
    paintLiveCli(s, c);
  }
  function clearInputs() {
    try {
      var a = document.getElementById('cli-in'); if (a) a.value = '';
      var b = document.getElementById('stc-cmd-in'); if (b) b.value = '';
    } catch (_) {}
  }
  function paidApiUrl() {
    try {
      var host = location.hostname || '';
      if (host === 'localhost' || host === '127.0.0.1' || /astranov\.eu$/i.test(host)) return location.origin + '/api/ai';
    } catch (_) {}
    return '/api/ai';
  }
  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    try {
      var key = (G.SN_CONFIG && SN_CONFIG.sbKey) || G.SB_KEY || '';
      if (key) { h.apikey = key; h.Authorization = 'Bearer ' + key; }
      if (G.SNAuth && SNAuth.session && SNAuth.session.access_token) h.Authorization = 'Bearer ' + SNAuth.session.access_token;
    } catch (_) {}
    return h;
  }
  function pickReply(j) {
    if (!j) return null;
    var t = String(j.text || j.reply || j.message || j.answer || j.response || j.content || '').trim();
    if (!t) return null;
    if (/try again|no model|warming|unavailable|^error\b/i.test(t) && t.length < 80) return null;
    if (/owner_note|USAGE SHIP|ASTRANOV LAW/i.test(t)) return null;
    return t;
  }
  async function paidMind(line) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { try { if (ctrl) ctrl.abort(); } catch (_) {} }, 14000);
    try {
      if (G.SNSubscription && typeof SNSubscription.askPowerful === 'function') {
        try {
          var pow = await SNSubscription.askPowerful(line, { mode: 'chat', timeoutMs: 12000, allow_paid: true, stayGlobe: true, stay_globe: true });
          if (pow && pow.ok && pow.text) { var pt = pickReply({ text: pow.text }); if (pt) return pt; }
        } catch (_) {}
      }
      var body = {
        text: line, message: line, allow_paid: true, force_paid: true,
        preferred_provider: 'astranov', level: 'personal', source: 'research-stay',
        build: BUILD, stay_globe: true, stayGlobe: true, mode: 'chat', fast: false
      };
      var res = await fetch(paidApiUrl(), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body), mode: 'cors', signal: ctrl ? ctrl.signal : undefined });
      if (res.ok) {
        var j = await res.json().catch(function () { return {}; });
        var t = pickReply(j);
        if (t) return t;
      }
    } catch (_) {
    } finally { clearTimeout(timer); }
    return null;
  }
  function freezeCamera(ms, opts) {
    opts = opts || {};
    freezeUntil = now() + (ms || 16000);
    freezeSnap = viewLatLng();
    freezeAllowFly = !!opts.allowFly;
    freezeAllowPin = !!opts.allowPin;
    stayGlobe();
    wrapGlobe();
  }
  function thawCamera() { freezeUntil = 0; freezeAllowFly = false; freezeAllowPin = false; }
  function wrapOne(obj, name, kind) {
    try {
      if (!obj || typeof obj[name] !== 'function') return;
      if (obj['__snStayWrap_' + name]) return;
      var prev = obj[name].bind(obj);
      obj[name] = function () {
        var lat = arguments[0], lng = arguments[1], opts = arguments[2] || {};
        if (frozen()) {
          if (isFakeYou(lat, lng)) return null;
          if (kind === 'pin') { if (!freezeAllowPin) return null; return prev.apply(this, arguments); }
          if (!freezeAllowFly) return null;
        }
        if (isFakeYou(lat, lng)) return null;
        return prev.apply(this, arguments);
      };
      obj['__snStayWrap_' + name] = 1;
    } catch (_) {}
  }
  function wrapGlobe() {
    try {
      if (!G.SNGlobe) return;
      ['goToPlace','flyNear','diveInAt','setFocus','goToTier','setGlobeLatLng'].forEach(function (n) { wrapOne(SNGlobe, n, 'fly'); });
      wrapOne(SNGlobe, 'pulse', 'pin');
      if (typeof SNGlobe.flyGlobeTo === 'function') wrapOne(SNGlobe, 'flyGlobeTo', 'fly');
    } catch (_) {}
  }
  async function answerResearch(line) {
    var s = String(line || '').trim();
    if (!s || answering) return true;
    answering = true;
    var place = genuinePlace(s);
    freezeCamera(18000, { allowFly: false, allowPin: false });
    stayGlobe();
    clearInputs();
    openLiveCli();
    say(s, 'cmd');
    say('Mind · thinking…', 'dim');
    var paid = null;
    try { paid = await paidMind(s); } catch (_) {}
    paid = stripActionTags(starify(paid || ''));
    freezeCamera(4000, { allowFly: false, allowPin: !!place });
    stayGlobe();
    if (paid) {
      String(paid).split(/\n+/).forEach(function (part) { var p = String(part || '').trim(); if (p) say(p, 'ok'); });
    } else {
      say('Mind · no reply yet · stay put', 'dim');
    }
    setTimeout(function () { thawCamera(); }, 1200);
    try { if (G.SNCli && SNCli.endTurn) SNCli.endTurn(); } catch (_) {}
    clearInputs();
    answering = false;
    return true;
  }
  function handleLine(raw) {
    var s = String(raw || '').trim();
    if (!s || !isResearchish(s)) return false;
    void answerResearch(s);
    return true;
  }
  function patchCliRun() {
    try {
      if (!G.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli.__snResearchStay) return;
      SNCli.__snResearchStay = 1;
      var prev = SNCli.run.bind(SNCli);
      SNCli.run = function (raw) {
        try { if (handleLine(raw)) return Promise.resolve(true); } catch (_) {}
        return prev(raw);
      };
    } catch (_) {}
  }
  function bindInputs() {
    function capture(ev, el) {
      var v = String((el && el.value) || '').trim();
      if (!v || !isResearchish(v)) return false;
      try { ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } catch (_) {}
      if (el) el.value = '';
      void answerResearch(v);
      return true;
    }
    try {
      var form = document.getElementById('cli-form') || document.querySelector('#panel form');
      var input = document.getElementById('cli-in');
      if (form && input && !input._snResearchStay) {
        input._snResearchStay = 1;
        form.addEventListener('submit', function (ev) { capture(ev, input); }, true);
        input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') capture(ev, input); }, true);
      }
    } catch (_) {}
  }
  function tick() { wrapGlobe(); patchCliRun(); bindInputs(); }
  function init() {
    tick();
    setTimeout(tick, 0); setTimeout(tick, 400); setTimeout(tick, 1200); setTimeout(tick, 2800);
    setInterval(tick, 4000);
  }
  G.SNResearchStay = { build: BUILD, answer: answerResearch, isResearchish: isResearchish, stayPut: stayGlobe, viewLatLng: viewLatLng };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
