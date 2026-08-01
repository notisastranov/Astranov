/* SNSpartan — Spartan intelligence law for Astranov
 * =================================================
 * One word (or few) → research what must be done → execute full chain → short reply.
 * Not chatty. Not partial. Not “here are options” when intent is action.
 * Owner law 2026-08-01: train every domain this way.
 */
(function (g) {
  'use strict';

  var LAW = {
    name: 'Spartan intelligence',
    creed:
      'Minimal signal · maximal action. One word is enough when context is the real Earth OS.',
    rules: [
      'Expand short input into the full mission the user would need if they wrote a paragraph.',
      'Research: locate · crawl · rank · choose · act · pay/route/assign when the domain needs it.',
      'Prefer doing over asking; only ask when GPS is soft or money is missing.',
      'Reply short: result + time/ETA + next watch — never essays.',
      'Same law for food, map, driver, shops, pilot, money, bridge, cancel — everything.',
      'Never invent shops or drivers; use crawlers and live mesh.',
      'Remember prefs (size, drinks, home, favorites) so next one-word is smarter.',
    ],
  };

  function norm(s) {
    var t = String(s || '').trim();
    try {
      if (g.SNGreeklish && SNGreeklish.normalize) t = SNGreeklish.normalize(t);
    } catch (_) {}
    try {
      if (g.ArcangeloDialect && ArcangeloDialect.normalizeForRouting) {
        t = ArcangeloDialect.normalizeForRouting(t) || t;
      }
    } catch (_) {}
    return String(t || '').trim();
  }

  function tokens(s) {
    return norm(s)
      .toLowerCase()
      .replace(/[^a-z0-9α-ωά-ώίϊΐόύϋΰήώ\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  /** Domain lexicon — one token can open a full chain */
  var DOMAINS = [
    {
      id: 'food',
      re: /^(pizza|sushi|burger|coffee|cafe|souvlaki|pitogyra|gyro|kebab|pasta|food|hungry|φαγητ|πιτσα|καφε|σουβλα)/i,
      words: ['pizza', 'sushi', 'burger', 'coffee', 'souvlaki', 'pitogyra', 'food'],
      expand: function (raw, tok) {
        var food = tok[0] || 'food';
        if (/hungry|φαγητ/.test(food)) food = 'food';
        return {
          domain: 'food',
          intent: 'order_full',
          spartan: true,
          steps: ['locate', 'crawl_shops', 'rank_open_rated', 'judge_prefs', 'pay', 'driver', 'route', 'eta_watch'],
          food: food,
          autoOrder: true,
          lazyJudge: true,
          browseOnly: false,
          replySeed: 'Spartan · ' + food + ' · locate → best open → order → driver → ETA',
          mission: {
            steps: ['locate', 'shops', 'order'],
            foodLine: raw,
            autoOrder: true,
          },
          runFood: true,
        };
      },
    },
    {
      id: 'locate',
      re: /^(locate|gps|here|me|που\s*ειμαι|βρες)$/i,
      expand: function (raw) {
        return {
          domain: 'locate',
          intent: 'locate',
          spartan: true,
          steps: ['gps', 'map_pin', 'city'],
          mission: { steps: ['locate'], foodLine: raw },
          replySeed: 'Spartan · pin you on the map',
        };
      },
    },
    {
      id: 'shops',
      re: /^(shops|shop|vendors|crawl|scan|stores|μαγαζ)/i,
      expand: function (raw) {
        return {
          domain: 'shops',
          intent: 'populate_vendors',
          spartan: true,
          steps: ['locate', 'crawl_osm_places', 'menus', 'map_tiles'],
          mission: { steps: ['locate', 'shops'], foodLine: raw },
          replySeed: 'Spartan · fill real shops on the map',
        };
      },
    },
    {
      id: 'drive',
      re: /^(drive|courier|driver)$/i,
      expand: function () {
        return {
          domain: 'drive',
          intent: 'driver_online',
          spartan: true,
          steps: ['profile_driver', 'online', 'pull_orders'],
          runDriveOn: true,
          replySeed: 'Spartan · you are courier online',
        };
      },
    },
    {
      id: 'deliver',
      re: /^(deliver|delivered|drop|complete)$/i,
      expand: function () {
        return {
          domain: 'deliver',
          intent: 'complete_delivery',
          spartan: true,
          steps: ['claim', 'settle', 'ledger'],
          runDeliver: true,
          replySeed: 'Spartan · complete + settle',
        };
      },
    },
    {
      id: 'cancel',
      re: /^(cancel|stop|abort|nevermind)$/i,
      expand: function () {
        return {
          domain: 'cancel',
          intent: 'cancel',
          spartan: true,
          steps: ['clear_pending', 'refund_if_needed'],
          cli: 'cancel',
          replySeed: 'Spartan · cancel',
        };
      },
    },
    {
      id: 'pilot',
      re: /^(pilot|home|telemachos|τηλεμαχ)/i,
      expand: function (raw) {
        return {
          domain: 'pilot',
          intent: 'pilot_home',
          spartan: true,
          steps: ['nav_home'],
          cli: /telemachos|τηλεμαχ/i.test(raw) ? 'telemachos' : 'pilot home',
          replySeed: 'Spartan · pilot',
        };
      },
    },
    {
      id: 'money',
      re: /^(money|wallet|vault|balance|coins|αc)$/i,
      expand: function (raw) {
        return {
          domain: 'money',
          intent: 'wallet',
          spartan: true,
          steps: ['balance', 'vault'],
          cli: /vault/i.test(raw) ? 'vault' : 'wallet',
          replySeed: 'Spartan · wallet',
        };
      },
    },
    {
      id: 'bridge',
      re: /^(bridge|agent|fix|grok)$/i,
      expand: function (raw) {
        return {
          domain: 'bridge',
          intent: 'bridge',
          spartan: true,
          steps: ['status'],
          cli: /test/i.test(raw) ? 'bridge test' : 'bridge status',
          replySeed: 'Spartan · bridge',
        };
      },
    },
    {
      id: 'ready',
      re: /^(ready|status|go)$/i,
      expand: function () {
        return {
          domain: 'ready',
          intent: 'readiness',
          spartan: true,
          steps: ['engine_check'],
          cli: 'ready score',
          replySeed: 'Spartan · readiness',
        };
      },
    },
    {
      id: 'help',
      re: /^(help|\?|commands)$/i,
      expand: function () {
        return {
          domain: 'help',
          intent: 'help',
          spartan: true,
          steps: ['brief_help'],
          replySeed:
            'Spartan · one word is enough: pizza · shops · locate · drive · deliver · cancel · pilot · vault',
          replyOnly: true,
        };
      },
    },
  ];

  /**
   * Expand any short line into a Spartan plan.
   * Returns null if input is long/chatty and should use normal parsers.
   */
  function expand(message) {
    var raw = String(message || '').trim();
    if (!raw) return null;
    var low = norm(raw).toLowerCase();
    var tok = tokens(raw);

    // Long explicit sentences: still tag spartan if food/order already clear, else null
    var short = tok.length <= 4 || raw.length <= 28;

    // Direct domain match on first token or whole short line
    var i;
    for (i = 0; i < DOMAINS.length; i++) {
      var d = DOMAINS[i];
      if (d.re.test(tok[0] || '') || d.re.test(low.trim())) {
        var plan = d.expand(raw, tok);
        plan.raw = raw;
        plan.tokens = tok;
        plan.law = LAW.name;
        return plan;
      }
      if (d.words) {
        var w;
        for (w = 0; w < d.words.length; w++) {
          if (low.indexOf(d.words[w]) >= 0 && short) {
            plan = d.expand(raw, tok);
            plan.raw = raw;
            plan.tokens = tok;
            plan.law = LAW.name;
            return plan;
          }
        }
      }
    }

    // Compound short: "pizza home" etc. already handled by food if pizza present
    if (short && g.SNMarket && SNMarket.parseFoodIntent) {
      try {
        var fi = SNMarket.parseFoodIntent(raw);
        if (fi && fi.food) {
          return {
            domain: 'food',
            intent: 'order_full',
            spartan: true,
            steps: ['locate', 'crawl_shops', 'rank_open_rated', 'judge_prefs', 'pay', 'driver', 'route', 'eta_watch'],
            food: fi.food,
            autoOrder: true,
            lazyJudge: true,
            browseOnly: false,
            runFood: true,
            foodIntent: Object.assign({}, fi, {
              autoOrder: true,
              lazyJudge: true,
              browseOnly: false,
              spartan: true,
            }),
            raw: raw,
            replySeed: 'Spartan · ' + fi.food,
            law: LAW.name,
          };
        }
      } catch (_) {}
    }

    // Task runner plan for medium phrases
    if (g.SNTaskRunner && SNTaskRunner.planFromText) {
      try {
        var mp = SNTaskRunner.planFromText(raw);
        if (mp && mp.steps && mp.steps.length) {
          return {
            domain: 'mission',
            intent: 'mission',
            spartan: short,
            steps: mp.steps,
            mission: mp,
            raw: raw,
            replySeed: 'Spartan · ' + mp.steps.join('→'),
            law: LAW.name,
          };
        }
      } catch (_) {}
    }

    return null;
  }

  function teachMind() {
    try {
      var M = g.SNAstranovMind || g.SNFreeMind;
      if (!M || !M.teach) return;
      LAW.rules.forEach(function (r, idx) {
        M.teach('spartan law ' + (idx + 1), r, ['spartan', 'law', 'train']);
      });
      M.teach(
        'what is spartan intelligence',
        LAW.creed +
          ' Example: say pizza → I locate you, crawl open shops, pick best rated, order your likes, assign nearest driver, pay, tell eat time, watch ETA, door at 3 min.',
        ['spartan', 'identity']
      );
      M.teach(
        'spartan mode how you think',
        'Spartan: expand one word into full real-Earth action chain. Research then act. Short answer with ETA/result.',
        ['spartan', 'think']
      );
    } catch (_) {}
  }

  function briefResult(plan, resultText) {
    var t = String(resultText || plan.replySeed || 'Done').trim();
    // keep spartan: one breath
    if (t.length > 140) t = t.slice(0, 137) + '…';
    if (plan && plan.spartan && t.indexOf('Spartan') < 0 && t.length < 100) {
      /* don't prefix every time — clean human */
    }
    return t;
  }

  // boot train once
  try {
    if (typeof document !== 'undefined') {
      setTimeout(teachMind, 2500);
    }
  } catch (_) {}

  g.SNSpartan = {
    LAW: LAW,
    expand: expand,
    teachMind: teachMind,
    briefResult: briefResult,
    domains: function () {
      return DOMAINS.map(function (d) {
        return d.id;
      });
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
