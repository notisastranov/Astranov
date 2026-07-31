/**
 * SNFreeMind — Astranov free AI (local mind)
 * Product brand: Astranov. Currency unit: S (SpaceNets).
 */
(function (global) {
  'use strict';

  var LEARN_KEY = 'sn:free-mind-learn-v1';
  var STATS_KEY = 'sn:free-mind-stats-v1';
  var MAX_LEARN = 400;
  var NAME = 'Astranov';

  /** Seed corpus — product law (grows via teach / use) */
  var SEED = [
    {
      id: 'who',
      q: 'who are you what is spacenet ai astranov name',
      a: 'I am Astranov — the AI of astranov.eu. Ask pizza · shops · first delivery · donate on.',
      tags: ['identity', 'ai'],
    },
    {
      id: 'listen',
      q: 'ai listen handsfree voice mic',
      a: 'ASTRANOV LISTENING · say pizza · shops · next · show all · fly · locate',
      tags: ['ai', 'voice'],
    },
    {
      id: 'currency',
      q: 'money currency s spacenets wallet rate pay',
      a: 'S (SpaceNets) is the only primary currency. Fiat and crypto are secondary quotes.',
      tags: ['money'],
    },
    {
      id: 'grid',
      q: 'spacenet grid global national regional city zoom dive',
      a: 'SPACENET fly grid: GLOBAL → NATIONAL → REGIONAL → CITY. Tap globe to dive.',
      tags: ['globe'],
    },
    {
      id: 'pizza',
      q: 'pizza food hungry eat order sushi coffee burger',
      a: 'Say pizza · globe flies · vendor tile opens · next · show all · order only if you say order',
      tags: ['market', 'food'],
    },
    {
      id: 'next',
      q: 'next vendor show all prev previous shops',
      a: 'next = next vendor · show all = all on map · prev = previous · shops = nearest first',
      tags: ['market'],
    },
    {
      id: 'locate',
      q: 'locate gps where am i find me',
      a: 'locate · globe on you · then shops or pizza near focus',
      tags: ['globe'],
    },
    {
      id: 'fly',
      q: 'fly go to athens rhodes mars moon globe place',
      a: 'fly athens · go to mars · fly rhodes · globe follows Astranov',
      tags: ['globe'],
    },
    {
      id: 'vendor',
      q: 'vendor shop list menu cart order seller',
      a: 'list shop Name · menu add Item 5 · order me · or say shops for live tiles',
      tags: ['market'],
    },
    {
      id: 'roles',
      q: 'roles driver vendor worker client dating multi tile',
      a: 'One multi-tile: client · vendor worker · driver · social · dating. Open User or me.',
      tags: ['tile'],
    },
    {
      id: 'free',
      q: 'free ai model grok paid xai openai public fork train',
      a: 'I am Astranov free mind — local + learn. No paid Grok required. teach FACT to grow me.',
      tags: ['free', 'ai'],
    },
    {
      id: 'architect',
      q: 'architect owner notis astranov who owns',
      a: 'I am Astranov AI. Owner operates astranov.eu. S is the currency.',
      tags: ['identity'],
    },
    {
      id: 'help',
      q: 'help commands what can you do',
      a: 'pizza · shops · next · show all · locate · fly · me · rate · teach · free mind',
      tags: ['help'],
    },
    {
      id: 's_mine',
      q: 'mine resources donate compute mesh s per hour',
      a: 'resources · mine on · spare capacity can earn S when you opt in',
      tags: ['money', 'mine'],
    },
    {
      id: 'layers',
      q: 'layers map satellite windy planes ships google earth dark bright basemap night',
      a: 'Say dark map · bright map · sat · layers · iss · planes · ships — I switch them',
      tags: ['map'],
    },
    {
      id: 'dark_map',
      q: 'dark map night map switch dark basemap black map dark mode',
      a: 'Switching dark basemap now · city map dark tiles',
      tags: ['map', 'control'],
    },
    {
      id: 'bright_map',
      q: 'bright map light map day map switch bright basemap',
      a: 'Switching bright basemap now',
      tags: ['map', 'control'],
    },
    {
      id: 'greek',
      q: 'ελληνικά γεια βοήθεια φαγητό πίτσα πού είμαι',
      a: 'Είμαι Astranov. Πες πίτσα · shops · next · locate · fly',
      tags: ['el'],
    },
    {
      id: 'first',
      q: 'first delivery first loop list shop first order complete order',
      a: 'Say first delivery — I run shop → menu → order → drive → you',
      tags: ['market'],
    },
    {
      id: 'donate_mesh',
      q: 'donate mesh seti mine spare cpu resources earn s network',
      a: 'donate on · SETI-style mesh · spare CPU earns S while idle',
      tags: ['mine'],
    },
    {
      id: 'handoff',
      q: 'broken bug pain handoff fix ship',
      a: 'Say what broke · handoff queues for midnight Athens ship · type usage export',
      tags: ['support'],
    },
  ];

  var learned = [];
  var stats = { answers: 0, teaches: 0, learns: 0, misses: 0 };

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(LEARN_KEY) || '[]');
      if (Array.isArray(raw)) learned = raw.slice(-MAX_LEARN);
    } catch (e) {
      learned = [];
    }
    try {
      var st = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
      if (st && typeof st === 'object') stats = Object.assign(stats, st);
    } catch (e2) {}
  }

  function save() {
    try {
      localStorage.setItem(LEARN_KEY, JSON.stringify(learned.slice(-MAX_LEARN)));
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function tokens(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ\s]/gi, ' ')
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 1;
      });
  }

  function scoreMatch(queryTok, blob) {
    var bt = tokens(blob);
    if (!queryTok.length || !bt.length) return 0;
    var set = {};
    var i;
    for (i = 0; i < bt.length; i++) set[bt[i]] = 1;
    var hit = 0;
    for (i = 0; i < queryTok.length; i++) {
      if (set[queryTok[i]]) hit++;
    }
    // weight + phrase bonus
    var score = hit / Math.max(1, queryTok.length);
    if (hit >= 2) score += 0.15;
    if (hit >= 3) score += 0.1;
    return score;
  }

  function allDocs() {
    var out = SEED.map(function (s) {
      return {
        id: s.id,
        q: s.q,
        a: s.a,
        tags: s.tags || [],
        source: 'seed',
        strength: 1,
      };
    });
    learned.forEach(function (L, idx) {
      out.push({
        id: 'learn_' + idx,
        q: L.q,
        a: L.a,
        tags: L.tags || ['learned'],
        source: 'learned',
        strength: Math.min(3, 1 + (L.hits || 0) * 0.15),
      });
    });
    // Live brain law if present
    try {
      if (global.SNBrain && SNBrain.LAW) {
        var law = SNBrain.LAW;
        out.push({
          id: 'law_mission',
          q: 'mission purpose why spacenet internet globe',
          a: brief(law.mission || law.why || 'SpaceNet unifies activity on a living globe.'),
          tags: ['law'],
          source: 'brain',
          strength: 1.2,
        });
        if (law.identity && law.identity.ai) {
          out.push({
            id: 'law_ai',
            q: 'ai name identity spacenet astranov',
            a: brief(law.identity.ai),
            tags: ['identity'],
            source: 'brain',
            strength: 1.3,
          });
        }
      }
    } catch (e) {}
    return out;
  }

  function brief(t, n) {
    n = n || 100;
    t = String(t || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (t.length <= n) return t;
    return t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
  }

  /**
   * Answer from free mind. score 0–1+. Prefer over paid edge.
   */
  function answer(message, opts) {
    opts = opts || {};
    var msg = String(message || '').trim();
    if (!msg) {
      return { text: 'ASTRANOV LISTENING', score: 1, via: 'free-mind', source: 'status' };
    }
    var low = msg.toLowerCase();

    // Explicit free-mind status
    if (/^(free\s*ai|free\s*mind|mind\s*status|spacenet\s*free)$/i.test(low)) {
      return {
        text:
          NAME +
          ' · ' +
          learned.length +
          ' learned · ' +
          stats.answers +
          ' answers · teach to grow',
        score: 1,
        via: 'free-mind',
        source: 'status',
      };
    }

    // teach: fact  OR  teach Q => A
    var teachM = msg.match(/^teach\s+(.+)$/i);
    if (teachM) {
      var body = teachM[1].trim();
      var parts = body.split(/\s*=>\s*|\s*\|\s*/);
      if (parts.length >= 2) {
        teach(parts[0], parts.slice(1).join(' | '));
        return {
          text: 'Learned · ' + brief(parts[0], 40),
          score: 1,
          via: 'free-mind',
          source: 'teach',
        };
      }
      teach(body, body);
      return { text: 'Noted · ' + brief(body, 50), score: 1, via: 'free-mind', source: 'teach' };
    }

    // If local act already produced a solid reply, prefer brief local (still free)
    if (opts.localReply && opts.did && opts.did.length && !opts.needsEdge) {
      return {
        text: brief(opts.localReply, 88),
        score: 0.95,
        via: 'free-mind+local',
        source: 'act',
      };
    }

    var qTok = tokens(msg);
    var docs = allDocs();
    var best = null;
    var bestScore = 0;
    var i;
    for (i = 0; i < docs.length; i++) {
      var d = docs[i];
      var sc = scoreMatch(qTok, d.q + ' ' + (d.tags || []).join(' ') + ' ' + d.a) * (d.strength || 1);
      // boost exact tag words in query
      if (d.tags) {
        d.tags.forEach(function (tg) {
          if (low.indexOf(tg) >= 0) sc += 0.12;
        });
      }
      if (sc > bestScore) {
        bestScore = sc;
        best = d;
      }
    }

    // Strengthen learned hits
    if (best && best.source === 'learned' && bestScore >= 0.35) {
      try {
        var li = parseInt(String(best.id).replace('learn_', ''), 10);
        if (learned[li]) {
          learned[li].hits = (learned[li].hits || 0) + 1;
          save();
        }
      } catch (e3) {}
    }

    if (best && bestScore >= 0.28) {
      stats.answers = (stats.answers || 0) + 1;
      save();
      try {
        if (global.SNUsage && SNUsage.track)
          SNUsage.track('free_mind_hit', { id: best.id, score: Math.round(bestScore * 100) });
      } catch (e4) {}
      return {
        text: brief(best.a, 100),
        score: bestScore,
        via: 'free-mind',
        source: best.source,
        id: best.id,
      };
    }

    // Soft free defaults (never empty, never paid)
    stats.misses = (stats.misses || 0) + 1;
    save();
    var fallback = opts.localReply
      ? brief(opts.localReply, 88)
      : 'Astranov · pizza · shops · next · fly · locate · teach to grow me';
    return {
      text: fallback,
      score: opts.localReply ? 0.5 : 0.25,
      via: 'free-mind',
      source: 'fallback',
    };
  }

  /** Optional mind thought stream (CLI / mind strip if present) */
  function think(text, kind) {
    var t = String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
    if (!t) return;
    try {
      var box = document.getElementById('cli-ai-mind-log');
      if (box) {
        var line = document.createElement('div');
        line.className = 'cli-ai-think';
        line.textContent = '· ' + t;
        box.appendChild(line);
        while (box.children.length > 12) box.removeChild(box.firstChild);
        box.scrollTop = box.scrollHeight;
      } else if (global.SNCli && SNCli.log) {
        SNCli.log('🧠 ' + t, 'dim');
      }
    } catch (e) {}
  }

  function teach(q, a, tags) {
    q = String(q || '')
      .trim()
      .slice(0, 200);
    a = String(a || '')
      .trim()
      .slice(0, 280);
    if (!q || !a) return { ok: false };
    try {
      think('learned · ' + q.slice(0, 40) + ' → ' + a.slice(0, 50), 'teach');
    } catch (eT) {}
    // Merge similar
    var qTok = tokens(q);
    var i;
    for (i = 0; i < learned.length; i++) {
      if (scoreMatch(qTok, learned[i].q) > 0.75) {
        learned[i].a = a;
        learned[i].hits = (learned[i].hits || 0) + 1;
        learned[i].t = Date.now();
        stats.teaches = (stats.teaches || 0) + 1;
        save();
        return { ok: true, updated: true };
      }
    }
    learned.push({
      q: q,
      a: a,
      tags: tags || ['user'],
      hits: 1,
      t: Date.now(),
    });
    if (learned.length > MAX_LEARN) learned.splice(0, learned.length - MAX_LEARN);
    stats.teaches = (stats.teaches || 0) + 1;
    stats.learns = (stats.learns || 0) + 1;
    save();
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('free_mind_teach', { len: a.length });
    } catch (e) {}
    return { ok: true };
  }

  /** Grow from real conversations (successful free answers) */
  function learnInteraction(userMsg, assistantMsg, meta) {
    meta = meta || {};
    var u = String(userMsg || '').trim();
    var a = String(assistantMsg || '').trim();
    if (u.length < 3 || a.length < 4) return;
    if (a.length > 160) a = brief(a, 120);
    // Only store actionable / product lines — not noise
    if (/error|failed|undefined|null/i.test(a)) return;
    if (meta.score != null && meta.score < 0.35 && meta.source === 'fallback') return;
    teach(u.slice(0, 120), a, ['auto', meta.source || 'chat']);
    stats.learns = (stats.learns || 0) + 1;
    save();
  }

  /** Export dataset for future open-model fine-tune (user-owned) */
  function exportTrainset() {
    var rows = [];
    SEED.forEach(function (s) {
      rows.push({ input: s.q, output: s.a, source: 'seed', tags: s.tags });
    });
    learned.forEach(function (L) {
      rows.push({ input: L.q, output: L.a, source: 'learned', hits: L.hits || 0, tags: L.tags });
    });
    return {
      name: NAME,
      version: '1',
      exportedAt: new Date().toISOString(),
      count: rows.length,
      stats: Object.assign({}, stats),
      rows: rows,
    };
  }

  function status() {
    return {
      name: NAME,
      learned: learned.length,
      seeds: SEED.length,
      stats: Object.assign({}, stats),
      paidXaiRequired: false,
      note: 'Own free mind · teach to grow · export for open fine-tune later',
    };
  }

  load();

  global.SNFreeMind = {
    NAME: NAME,
    answer: answer,
    teach: teach,
    think: think,
    learnInteraction: learnInteraction,
    exportTrainset: exportTrainset,
    status: status,
    get learnedCount() {
      return learned.length;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
