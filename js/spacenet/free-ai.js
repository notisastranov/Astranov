/**
 * SNFreeMind — Astranov free AI (local mind)
 * Product brand: Astranov. Currency unit: S (SpaceNets).
 */
(function (global) {
  'use strict';

  // v3: wipe poisoned stores (Elizabeth Candy / climb / random OUT lines)
  var LEARN_KEY = 'sn:free-mind-learn-v3';
  var STATS_KEY = 'sn:free-mind-stats-v3';
  var MAX_LEARN = 200;
  var NAME = 'Astranov';
  var LEGACY_KEYS = [
    'sn:free-mind-learn-v1',
    'sn:free-mind-learn-v2',
    'sn:free-mind-stats-v1',
    'sn:free-mind-stats-v2',
  ];

  /**
   * Seed corpus — FIRST TASK is P0 (lazy pizza order).
   * Task law: locate → verify if soft GPS → research likes/temper/company →
   * judge type/size/vendor/courier → pay S → map route → tell eat time.
   */
  var SEED = [
    {
      id: 'first_task',
      q:
        'first task first order lazy order me a pizza you judge type size vendor delivery guy ' +
        'what time i eat order me pizza judge whatever else retsina soda greek special',
      a:
        'FIRST TASK · type: ORDER ME A PIZZA YOU JUDGE THE TYPE SIZE VENDOR DELIVERY GUY AND WHATEVER ELSE AND TELL ME WHAT TIME I EAT · ' +
        'I locate you · if GPS soft I ask YES/NO · I use your likes (feisty Greek · company · Super Greek 13 · retsina · 1.5L soda) · ' +
        'pick vendor + Astranov courier · pay S · map shows route · I tell when you eat.',
      tags: ['market', 'food', 'p0', 'first'],
    },
    {
      id: 'first_task_steps',
      q: 'how first order pizza steps locate verify yes no eat time eta',
      a:
        '1 locate · 2 if location soft I ask YES or NO · 3 research your temper/company/likes · ' +
        '4 Super Greek special 13 pieces + retsina + 1.5L soda for feisty Greek company · ' +
        '5 vendor + courier on map · 6 pay S · 7 you eat at HH:MM.',
      tags: ['market', 'food', 'p0'],
    },
    {
      id: 'first_task_yes',
      q: 'yes correct here location ok go proceed confirm location',
      a: 'YES continues the paused pizza order from your confirmed pin on the map.',
      tags: ['market', 'food', 'p0'],
    },
    {
      id: 'first_task_no',
      q: 'no wrong not me location false relocate',
      a: 'NO cancels that pin · type locate or fly city · then paste the pizza order again.',
      tags: ['market', 'food', 'p0'],
    },
    {
      id: 'owner_likes',
      q: 'girlfriends cats dogs feisty greek retsina soda super greek special 13 pieces company temper',
      a:
        'Owner tray: feisty Greek guy · company ~3 (you + 2 girlfriends) · pets noted · ' +
        'Super Greek special 13 pieces · retsina · big soda 1.5L · Astranov delivery not Wolt/eFood.',
      tags: ['market', 'prefs', 'p0'],
    },
    {
      id: 'who',
      q: 'who are you what is spacenet ai astranov name',
      a:
        'I am Astranov — AI of astranov.eu. First task: order me a pizza you judge… · also locate · shops · donate on.',
      tags: ['identity', 'ai'],
    },
    {
      id: 'spacenet_name',
      q: 'what is spacenet system grid os net',
      a: 'I am Astranov. The live grid runs under ASTRANOV on the globe.',
      tags: ['identity', 'system'],
    },
    {
      id: 'listen',
      q: 'ai listen handsfree voice mic',
      a: 'ASTRANOV LISTENING · first task: order me a pizza you judge… · or locate · shops',
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
      a: 'Zoom grid: GLOBAL → NATIONAL → REGIONAL → CITY. Tap the globe to dive.',
      tags: ['globe'],
    },
    {
      id: 'pizza',
      q: 'pizza food hungry eat order sushi coffee burger order me a pizza',
      a:
        'Lazy first task: ORDER ME A PIZZA YOU JUDGE THE TYPE SIZE VENDOR DELIVERY GUY AND WHATEVER ELSE AND TELL ME WHAT TIME I EAT · ' +
        'I run locate → verify → judge → pay → eat time.',
      tags: ['market', 'food', 'p0'],
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
      a: 'locate · map on you · first step before pizza. If soft GPS I ask YES/NO.',
      tags: ['globe', 'p0'],
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
      a: 'Lazy order pizza first · or list shop Name · menu add Item 5 · shops for tiles',
      tags: ['market'],
    },
    {
      id: 'roles',
      q: 'roles driver vendor worker client dating multi tile',
      a: 'One multi-tile: client · vendor worker · driver · social · dating. Tap User when logged in.',
      tags: ['tile'],
    },
    {
      id: 'free',
      q: 'free ai model paid public fork train mind local',
      a: 'I am Astranov free mind — local + learn. First task is pizza lazy order. teach FACT to grow me.',
      tags: ['free', 'ai'],
    },
    {
      id: 'grok',
      q: 'grok xai elon paid grok is grok here is grok there do you have grok are you grok',
      a: 'No Grok here. I am Astranov — free local mind on astranov.eu. No xAI/Grok key required.',
      tags: ['identity', 'ai', 'grok'],
    },
    {
      id: 'openai',
      q: 'openai chatgpt gpt claude gemini anthropic which model',
      a: 'I am Astranov free mind — not ChatGPT/Claude/Gemini. Local first; no paid API required for chat.',
      tags: ['identity', 'ai'],
    },
    {
      id: 'architect',
      q: 'architect owner notis who owns brand',
      a: 'I am Astranov AI. Owner operates astranov.eu. S is the currency. First task is pizza order.',
      tags: ['identity'],
    },
    {
      id: 'help',
      q: 'help commands what can you do',
      a:
        'FIRST: order me a pizza you judge type size vendor delivery… · locate · shops · donate on · me · rate · teach',
      tags: ['help', 'p0'],
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
      q: 'ελληνικά γεια βοήθεια φαγητό πίτσα πού είμαι παράγγειλε πίτσα',
      a:
        'Είμαι Astranov. Πρώτη αποστολή: παράγγειλε πίτσα · κρίνω τύπο μέγεθος μαγαζί κούριερ · πες τι ώρα τρως · locate · YES/NO αν ρωτήσω',
      tags: ['el', 'p0'],
    },
    {
      id: 'first',
      q: 'first delivery first loop list shop complete self delivery train',
      a:
        'Self-loop: first delivery (you = shop + buyer + driver). Real first food task: order me a pizza you judge…',
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
    {
      id: 'wolt_efood',
      q: 'wolt efood delivery app uber eats box',
      a: 'We do not use Wolt or eFood. Courier is Astranov mesh delivery on the map · pay in S.',
      tags: ['market', 'food'],
    },
  ];

  var learned = [];
  var stats = { answers: 0, teaches: 0, learns: 0, misses: 0, purged: 0 };

  /** Product-shaped text only — random names / dating spam / OUT logs never stick */
  function isProductish(t) {
    return /\b(astranov|spacenet|pizza|order|locate|map|vendor|courier|delivery|shop|donate|mine|grid|globe|wallet|pay|retsina|greek|soda|first\s*task|basemap|layers|driver|tile|s\b|eat\s*time|yes|no)\b/i.test(
      String(t || '')
    );
  }

  function isJunkAnswer(a) {
    var t = String(a || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (t.length < 12) return true;
    if (/^(climb|yes|no|ok|idk|lol|test|asdf|null|undefined|out|in|sys)$/i.test(t)) return true;
    // Proper-name spam (e.g. "Elizabeth Candy")
    if (/^[A-Z][a-z]{1,20}(\s+[A-Z][a-z]{1,20}){1,3}$/.test(t) && t.length < 48) return true;
    // Log lines / actor OUT junk auto-stored by market-live
    if (/^\s*\[?.{0,28}\]?\s*(OUT|IN|SYS)\b/i.test(t)) return true;
    if (/\bOUT\s*·|\bIN\s*·|\bSYS\s*·/i.test(t)) return true;
    var words = t.split(/\s+/).filter(Boolean);
    if (words.length < 3) return true;
    if (words.length <= 4 && !isProductish(t)) return true;
    // High ratio of Title Case tokens with no product words = celebrity/name sludge
    var titleish = 0;
    words.forEach(function (w) {
      if (/^[A-Z][a-z]+$/.test(w)) titleish++;
    });
    if (titleish >= 2 && titleish / words.length >= 0.6 && !isProductish(t)) return true;
    return false;
  }

  function isJunkQuestion(q) {
    var t = String(q || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (t.length < 3) return true;
    // Keys like "SpaceNet OUT" / "Vendor OUT" poisoned the mind
    if (/\b(OUT|IN|SYS)\b/i.test(t) && t.length < 40) return true;
    if (/^[A-Z][a-z]{1,20}(\s+[A-Z][a-z]{1,20}){1,3}$/.test(t) && !isProductish(t)) return true;
    return false;
  }

  function purgeLegacy() {
    try {
      LEGACY_KEYS.forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function sanitizeLearned(rows) {
    if (!Array.isArray(rows)) return [];
    var out = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      var L = rows[i];
      if (!L || typeof L !== 'object') continue;
      var q = String(L.q || '').trim();
      var a = String(L.a || '').trim();
      if (isJunkQuestion(q) || isJunkAnswer(a)) {
        stats.purged = (stats.purged || 0) + 1;
        continue;
      }
      // Auto market-live rows without product shape — drop
      var tags = L.tags || [];
      if (
        tags.indexOf('auto') >= 0 &&
        (String(L.source || tags.join(' ')).indexOf('market') >= 0 ||
          /\bOUT\b/i.test(q)) &&
        !isProductish(a)
      ) {
        stats.purged = (stats.purged || 0) + 1;
        continue;
      }
      out.push({
        q: q.slice(0, 200),
        a: a.slice(0, 280),
        tags: tags,
        hits: L.hits || 0,
        t: L.t || Date.now(),
      });
    }
    return out.slice(-MAX_LEARN);
  }

  function load() {
    purgeLegacy();
    try {
      var raw = JSON.parse(localStorage.getItem(LEARN_KEY) || '[]');
      learned = sanitizeLearned(raw);
    } catch (e) {
      learned = [];
    }
    try {
      var st = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
      if (st && typeof st === 'object') stats = Object.assign(stats, st);
    } catch (e2) {}
    // Install first-task training once per browser (owner law)
    trainFirstTask();
    // Persist cleaned set (drops poison left from partial v3)
    if (learned.length) save();
  }

  /** Nuclear: wipe learned memory (keeps seeds; re-trains first task) */
  function wipe(reason) {
    learned = [];
    stats.purged = (stats.purged || 0) + 1;
    try {
      localStorage.removeItem(LEARN_KEY);
      localStorage.setItem('sn:free-mind-first-task-v2', '0');
    } catch (e) {}
    trainFirstTask();
    save();
    try {
      think('mind wiped · ' + (reason || 'clean'), 'wipe');
    } catch (e2) {}
    return { ok: true, learned: learned.length };
  }

  /** Hard-wire first task facts into learned memory (idempotent) */
  function trainFirstTask() {
    var FLAG = 'sn:free-mind-first-task-v2';
    try {
      if (localStorage.getItem(FLAG) === '1') return;
    } catch (e0) {}
    var drills = [
      [
        'ORDER ME A PIZZA YOU JUDGE THE TYPE SIZE VENDOR DELIVERY GUY AND WHATEVER ELSE AND TELL ME WHAT TIME I EAT',
        'FIRST TASK: locate → verify soft GPS (YES/NO) → research feisty Greek company likes → Super Greek special 13 pieces + retsina + 1.5L soda → vendor + Astranov courier → pay S → map route → eat time HH:MM',
      ],
      [
        'first task',
        'First task is the lazy pizza order. Paste the full ORDER ME A PIZZA YOU JUDGE… line. I run it on the map.',
      ],
      [
        'what do I like to eat',
        'Owner tray: Super Greek special 13 pieces · retsina · big soda 1.5L · company ~3 · feisty Greek temper · not Wolt/eFood',
      ],
      [
        'yes',
        'If a pizza order is paused on location check, YES means continue from this pin.',
      ],
      [
        'no',
        'If a pizza order is paused on location check, NO cancels — locate again then re-order.',
      ],
    ];
    drills.forEach(function (d) {
      teach(d[0], d[1], ['p0', 'first-task', 'train']);
    });
    try {
      localStorage.setItem(FLAG, '1');
    } catch (e1) {}
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('free_mind_train_first_task', {});
    } catch (e2) {}
  }

  function save() {
    try {
      localStorage.setItem(LEARN_KEY, JSON.stringify(learned.slice(-MAX_LEARN)));
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  var STOP = {
    is: 1,
    are: 1,
    am: 1,
    the: 1,
    a: 1,
    an: 1,
    to: 1,
    of: 1,
    in: 1,
    on: 1,
    for: 1,
    and: 1,
    or: 1,
    do: 1,
    does: 1,
    did: 1,
    you: 1,
    your: 1,
    me: 1,
    my: 1,
    we: 1,
    can: 1,
    could: 1,
    would: 1,
    will: 1,
    what: 1,
    who: 1,
    how: 1,
    when: 1,
    where: 1,
    why: 1,
    there: 1,
    here: 1,
    this: 1,
    that: 1,
    with: 1,
    from: 1,
    have: 1,
    has: 1,
    had: 1,
    be: 1,
    been: 1,
    was: 1,
    were: 1,
    it: 1,
    its: 1,
    if: 1,
    so: 1,
    just: 1,
    please: 1,
    tell: 1,
    say: 1,
    about: 1,
  };

  function tokens(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ\s]/gi, ' ')
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 1 && !STOP[t];
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
    if (!hit) return 0;
    // Require real content hits — do not reward stopword-only matches
    var score = hit / Math.max(1, queryTok.length);
    if (hit >= 2) score += 0.2;
    if (hit >= 3) score += 0.12;
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

    // —— Hard intents (never fuzzy-wrong) ——
    // P0 FIRST TASK — always point at the live market path (not a chat monologue)
    if (
      /\border\s+me\s+(a\s+)?pizza\b/i.test(low) ||
      (/\bpizza\b/i.test(low) &&
        /\b(judge|type|size|vendor|delivery|eat|time)\b/i.test(low)) ||
      /\bfirst\s+task\b/i.test(low) ||
      (/\bfirst\s+order\b/i.test(low) && !/\bfirst\s+delivery\b/i.test(low))
    ) {
      return {
        text:
          'FIRST TASK live · I locate you · verify if GPS soft (YES/NO) · ' +
          'use your likes (feisty Greek · Super Greek 13 · retsina · 1.5L soda) · ' +
          'vendor + courier on map · pay S · tell you when you eat. Running that path now.',
        score: 1,
        via: 'free-mind',
        source: 'intent-first-task',
        runFood: true,
      };
    }
    if (/\bgrok\b|\bxai\b|\bx\.?ai\b/i.test(low)) {
      return {
        text:
          'No Grok here. I am Astranov — free local mind on astranov.eu. No xAI/Grok required for chat.',
        score: 1,
        via: 'free-mind',
        source: 'intent-grok',
      };
    }
    if (/\b(chatgpt|openai|gpt-?\d|claude|gemini|anthropic)\b/i.test(low)) {
      return {
        text:
          'I am Astranov free mind — not ChatGPT/Claude/Gemini. Local first; no paid API for chat.',
        score: 1,
        via: 'free-mind',
        source: 'intent-model',
      };
    }
    if (
      /who\s+are\s+you|what\s+are\s+you|your\s+name|are\s+you\s+astranov|τι\s+είσαι|ποιος\s+είσαι/i.test(
        low
      )
    ) {
      return {
        text:
          'I am Astranov — AI of astranov.eu. First task: ORDER ME A PIZZA YOU JUDGE TYPE SIZE VENDOR DELIVERY… · locate · donate on.',
        score: 1,
        via: 'free-mind',
        source: 'intent-who',
      };
    }

    // Explicit free-mind status
    if (/^(free\s*ai|free\s*mind|mind\s*status|spacenet\s*free)$/i.test(low)) {
      return {
        text:
          NAME +
          ' · ' +
          learned.length +
          ' learned · ' +
          stats.answers +
          ' answers · teach to grow · mind wipe if junk',
        score: 1,
        via: 'free-mind',
        source: 'status',
      };
    }

    // Kill poisoned memory
    if (
      /^(mind\s*wipe|wipe\s*mind|forget\s*all|clear\s*mind|mind\s*reset)$/i.test(low)
    ) {
      wipe('user');
      return {
        text: 'Mind wiped · junk gone · first-task drills reloaded · teach only product facts',
        score: 1,
        via: 'free-mind',
        source: 'wipe',
      };
    }

    // teach: fact  OR  teach Q => A
    var teachM = msg.match(/^teach\s+(.+)$/i);
    if (teachM) {
      var body = teachM[1].trim();
      var parts = body.split(/\s*=>\s*|\s*\|\s*/);
      if (parts.length >= 2) {
        var ans = parts.slice(1).join(' | ');
        if (isJunkAnswer(ans) || isJunkQuestion(parts[0])) {
          return {
            text: 'Teach rejected · looks like junk (names/logs/too short)',
            score: 1,
            via: 'free-mind',
            source: 'teach-reject',
          };
        }
        teach(parts[0], ans, ['user', 'teach']);
        return {
          text: 'Learned · ' + brief(parts[0], 40),
          score: 1,
          via: 'free-mind',
          source: 'teach',
        };
      }
      if (isJunkAnswer(body) && !isProductish(body)) {
        return {
          text: 'Teach rejected · not product-shaped · use: teach Q => A',
          score: 1,
          via: 'free-mind',
          source: 'teach-reject',
        };
      }
      teach(body, body, ['user', 'teach']);
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
    // Too little signal after stopwords → honest fallback, no random seed
    if (qTok.length < 1) {
      return {
        text:
          'Astranov · first task: order me a pizza you judge… · or locate · who are you',
        score: 0.2,
        via: 'free-mind',
        source: 'fallback',
      };
    }

    var docs = allDocs();
    var best = null;
    var bestScore = 0;
    var i;
    for (i = 0; i < docs.length; i++) {
      var d = docs[i];
      // Match question + tags ONLY — never answer body (avoids garbage like "climb")
      var sc =
        scoreMatch(qTok, d.q + ' ' + (d.tags || []).join(' ')) * (d.strength || 1);
      if (d.tags) {
        d.tags.forEach(function (tg) {
          if (low.indexOf(String(tg).toLowerCase()) >= 0) sc += 0.18;
        });
      }
      // Prefer seeds; learned must earn it
      if (d.source === 'seed') sc += 0.05;
      if (d.source === 'brain') sc += 0.03;
      if (d.source === 'learned') {
        if (isJunkAnswer(d.a) || isJunkQuestion(d.q)) continue;
        // Auto-learned without product shape never surfaces
        if ((d.tags || []).indexOf('auto') >= 0 && !isProductish(d.a)) continue;
        sc *= 0.72;
      }
      if (sc > bestScore) {
        bestScore = sc;
        best = d;
      }
    }

    // High bar — random name sludge must never win a weak token hit
    var need = qTok.length <= 2 ? 0.72 : 0.58;
    if (best && best.source === 'learned') need = Math.max(need, 0.78);
    // Require at least 2 content-token hits for learned rows
    if (best && best.source === 'learned') {
      var learnHits = 0;
      var bset = {};
      tokens(best.q + ' ' + (best.tags || []).join(' ')).forEach(function (t) {
        bset[t] = 1;
      });
      qTok.forEach(function (t) {
        if (bset[t]) learnHits++;
      });
      if (learnHits < 2 && qTok.length >= 2) need = 9;
    }

    if (best && bestScore >= need && !isJunkAnswer(best.a)) {
      if (best.source === 'learned') {
        try {
          var li = parseInt(String(best.id).replace('learn_', ''), 10);
          if (learned[li]) {
            learned[li].hits = (learned[li].hits || 0) + 1;
            save();
          }
        } catch (e3) {}
      }
      stats.answers = (stats.answers || 0) + 1;
      save();
      try {
        if (global.SNUsage && SNUsage.track)
          SNUsage.track('free_mind_hit', { id: best.id, score: Math.round(bestScore * 100) });
      } catch (e4) {}
      return {
        text: brief(best.a, 110),
        score: bestScore,
        via: 'free-mind',
        source: best.source,
        id: best.id,
      };
    }

    // Soft free defaults (never empty, never paid, never random junk)
    stats.misses = (stats.misses || 0) + 1;
    save();
    var fallback = opts.localReply
      ? brief(opts.localReply, 88)
      : 'Astranov · not sure · try: who are you · pizza · shops · first delivery · donate on';
    return {
      text: fallback,
      score: opts.localReply ? 0.45 : 0.22,
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
    tags = tags || ['user'];
    // Hard reject poison (unless explicit p0 train drills)
    var train = tags.indexOf('train') >= 0 || tags.indexOf('first-task') >= 0;
    if (!train && (isJunkQuestion(q) || isJunkAnswer(a))) return { ok: false, junk: true };
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
        learned[i].tags = tags;
        stats.teaches = (stats.teaches || 0) + 1;
        save();
        return { ok: true, updated: true };
      }
    }
    learned.push({
      q: q,
      a: a,
      tags: tags,
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

  /**
   * Grow from real conversations — STRICT.
   * Never from market-live OUT spam, fallback, weak fuzzy, or name sludge.
   */
  function learnInteraction(userMsg, assistantMsg, meta) {
    meta = meta || {};
    var u = String(userMsg || '').trim();
    var a = String(assistantMsg || '').trim();
    if (u.length < 6 || a.length < 12) return;
    if (a.length > 160) a = brief(a, 120);
    var src = String(meta.source || 'chat');
    // Never ingest log actors / market I/O as mind facts
    if (/market-live|live-io|out|radar/i.test(src)) return;
    if (/\b(OUT|IN|SYS)\b/i.test(u)) return;
    if (/error|failed|undefined|null|listening/i.test(a)) return;
    if (src === 'fallback' || src === 'learned') return;
    if (meta.score != null && meta.score < 0.7) return;
    // Only hard intents / seeds / explicit act — not random fuzzy
    if (!/^(intent|seed|act|teach|status|brain)/i.test(src) && !isProductish(a)) return;
    if (isJunkAnswer(a) || isJunkQuestion(u)) return;
    if (!isProductish(a) && !isProductish(u)) return;
    teach(u.slice(0, 120), a, ['auto', src]);
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
    wipe: wipe,
    learnInteraction: learnInteraction,
    exportTrainset: exportTrainset,
    status: status,
    isJunkAnswer: isJunkAnswer,
    get learnedCount() {
      return learned.length;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
