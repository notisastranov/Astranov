/* SpaceNet unit trainer · 20260823220000-train
 * Living mind: live envelopes + taught lessons. Not static programming.
 * Does not restyle CLI placeholders. Not a training sim.
 */
(function (global) {
  'use strict';
  var BUILD = '20260823220000-train';
  if (global.__SN_MIND_FACTS === BUILD) return;
  global.__SN_MIND_FACTS = BUILD;

  var KEY = 'sn:unit-lessons-v1';
  var envelope = null;

  function log(m, k) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(String(m).slice(0, 420), k || 'ok');
    } catch (_) {}
  }

  function lessons() {
    try {
      var raw = localStorage.getItem(KEY);
      var j = raw ? JSON.parse(raw) : [];
      return Array.isArray(j) ? j : [];
    } catch (_) {
      return [];
    }
  }

  function saveLesson(text) {
    var list = lessons();
    list.push({ t: Date.now(), text: String(text).slice(0, 800) });
    if (list.length > 80) list = list.slice(-80);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (_) {}
    try {
      if (global.ACI && typeof ACI.teach === 'function') ACI.teach(text);
    } catch (_) {}
    return list.length;
  }

  function eur(k) {
    k = Number(k) || 0;
    if (Math.abs(k) >= 1000) return '€' + (k / 1000).toFixed(2).replace(/\.00$/, '') + 'M';
    return '€' + Math.round(k) + 'k';
  }

  function fromDeck(d) {
    var pkgs = (d && d.packages) || [];
    var p1 = 0;
    var p2 = 0;
    var got = Number(d.gathered_keur) || 0;
    pkgs.forEach(function (p) {
      var c = Number(p.capex) || 0;
      if (p.phase === 2) p2 += c;
      else p1 += c;
      got += Number(p.raised) || 0;
    });
    var sn = Number((d.complete && d.complete.spacenet_keur) || d.spacenet_keur || 7000);
    var work = p1 + sn;
    var left = Math.max(0, work - got);
    return {
      p1: p1,
      p2: p2,
      sn: sn,
      got: got,
      left: left,
      line:
        'Live: to complete SpaceNet + Phase 1 is ' +
        eur(left) +
        ' remaining (SpaceNet ' +
        eur(sn) +
        ' + Phase 1 ' +
        eur(p1) +
        '). Gathered ' +
        eur(got) +
        '. Lake + pontoon ' +
        eur(p2) +
        ' not in that number. Land extra. Not a quote.'
    };
  }

  function loadEnvelope() {
    return fetch('https://astranov.eu/investors/budget.json?v=' + BUILD, { cache: 'no-store' })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        envelope = fromDeck(d);
        return envelope;
      })
      .catch(function () {
        envelope = envelope || fromDeck({ spacenet_keur: 7000, gathered_keur: 0, packages: [] });
        envelope.line =
          envelope.p1
            ? envelope.line
            : 'Live envelope did not load. Last trained: SpaceNet + Phase 1 working target €32.63M remaining, gathered €0.';
        return envelope;
      });
  }

  function contextBlock() {
    var bits = [];
    if (envelope && envelope.line) bits.push(envelope.line);
    var ls = lessons();
    if (ls.length) {
      bits.push(
        'Taught lessons (' +
          ls.length +
          '): ' +
          ls
            .slice(-8)
            .map(function (x) {
              return x.text;
            })
            .join(' · ')
      );
    }
    bits.push('SpaceNet is a trained living OS, not a static traditional app.');
    return bits.join(' ');
  }

  function handle(raw) {
    var line = String(raw || '').trim();
    var low = line.toLowerCase();
    if (!low) return false;
    if (/^(train|teach)\s+status$/.test(low) || low === 'train' || low === 'unit') {
      log(
        'Unit · trained living OS · lessons ' +
          lessons().length +
          ' · ' +
          ((envelope && envelope.line) || 'loading live envelope…'),
        'ok'
      );
      loadEnvelope().then(function (e) {
        log(e.line, 'ok');
      });
      return true;
    }
    var m = /^(train|teach)\s+(.+)$/i.exec(line);
    if (m) {
      var n = saveLesson(m[2]);
      log('Trained · lesson ' + n + ' kept. The unit is not a static app.', 'ok');
      return true;
    }
    if (/how much|need to complete|remaining to gather|complete spacenet|money we need|raise to finish|to complete the projects/.test(low)) {
      loadEnvelope().then(function (e) {
        log(e.line + ' · investors.astranov.eu', 'ok');
      });
      try {
        location.href = 'https://investors.astranov.eu';
      } catch (_) {}
      return true;
    }
    return false;
  }

  function injectTalk() {
    try {
      if (!global.SNMindBridge || typeof SNMindBridge.talk !== 'function') return;
      if (SNMindBridge._snTrainWrap) return;
      var prev = SNMindBridge.talk.bind(SNMindBridge);
      SNMindBridge.talk = function (msg, opts) {
        try {
          var ctx = contextBlock();
          if (ctx && opts && typeof opts === 'object') opts.system = (opts.system || '') + ' ' + ctx;
          if (ctx && global.SNMindBridge && SNMindBridge.S) {
            /* prefix last user with live context via history side-channel */
          }
        } catch (_) {}
        return prev(msg, opts);
      };
      SNMindBridge._snTrainWrap = 1;
    } catch (_) {}
  }

  function wrapCli() {
    if (global.__SN_MIND_FACTS_WRAP) return;
    global.__SN_MIND_FACTS_WRAP = 1;
    function attach() {
      if (!global.SNCli || typeof SNCli.run !== 'function') return false;
      if (SNCli._snTrainOuter) return true;
      var prev = SNCli.run.bind(SNCli);
      SNCli.run = function (raw) {
        try {
          if (handle(raw)) return Promise.resolve(true);
        } catch (_) {}
        return prev(raw);
      };
      SNCli._snTrainOuter = 1;
      return true;
    }
    if (!attach()) setTimeout(attach, 400);
    setTimeout(attach, 1200);
    injectTalk();
    setTimeout(injectTalk, 800);
  }

  global.SNMindTrain = {
    handle: handle,
    lessons: lessons,
    context: contextBlock,
    load: loadEnvelope,
    BUILD: BUILD
  };
  loadEnvelope();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapCli);
  else wrapCli();
})(window);
