/**
 * Arcangelo / Archangelos village dialect — owner memory lane
 * Greeklish · Cretan village · ancient Greek · English mix
 *
 * Stealth by default: do not mirror village voice on UI unless the owner spoke it first.
 * This is part of ASTRANOV MIND (owner memory), not a disposable chatbot skill.
 */
(function (global) {
  'use strict';

  var D = {
    ID: 'arcangelo_village_v2',
    ACTIVATE: 28,
    TEAM: 50,
    _active: false,
    _score: 0,
    _team: false,
    _hits: 0,
    _lastAt: 0,

    /** Rhodes · Archangelos village family / crew */
    _family: [
      /αξάς/i,
      /αξάκι/i,
      /αξαδίνα/i,
      /\baksas\b/i,
      /\baksaki\b/i,
      /\baxadina\b/i,
      /\baksako\b/i,
      /arcangelo/i,
      /archangelo/i,
      /arcangelos/i,
      /archangelos/i,
      /αρχάγγελ/i,
      /αρχαγγελ/i,
      /\bvillage\b/i,
      /\bχωριό\b/i,
      /\bxorio\b/i,
    ],
    _crete: [
      /\bρε\b/i,
      /\bπρε\b/i,
      /\bre\b/i,
      /\bpre\b/i,
      /\bτζαι\b/i,
      /\btzai\b/i,
      /\bentaxi\b/i,
      /\bεντάξει\b/i,
      /\bμαν\b/i,
      /\bωχ\b/i,
    ],
    _ancient: [
      /[\u1F00-\u1FFF]/,
      /\bχαίρε\b/i,
      /\bκαίρειν\b/i,
      /\bchaere\b/i,
      /\bkairein\b/i,
      /\bὦ\b/,
      /\bθεοί\b/i,
      /\bo\s+theoi\b/i,
    ],
    _greeklish: [
      /\bela\b/i,
      /\bέλα\b/i,
      /\bti\s+thes\b/i,
      /\bτι\s+θες\b/i,
      /\bpame\b/i,
      /\bπάμε\b/i,
      /\bpes\s+mou\b/i,
      /\bπες\s+μου\b/i,
      /\bdouleia\b/i,
      /\bδουλειά\b/i,
      /\bthelo\b/i,
      /\bθέλω\b/i,
      /\bkatalava\b/i,
      /\bkala\b/i,
      /\boraia\b/i,
    ],
    _greek: /[\u0370-\u03FF]/,

    /**
     * Owner tray / village order lexicon (Greeklish + Greek)
     * aksaki = brother/mate (family address)
     * pitogyra = pita gyro / pitogyro order
     * mpyronia / mpironia = beers (μπυρόνια)
     * tsigareta = cigarettes
     */
    LEXICON: {
      aksaki: {
        means: 'family/crew address — little brother / mate from Archangelos village',
        el: 'αξάκι',
        reply: 'Ναι αξάκι — εδώ είμαι. Πες μου τι θες.',
      },
      aksas: {
        means: 'family/crew address — brother / mate',
        el: 'αξάς',
        reply: 'Άκουσα αξά. Τι κάνουμε;',
      },
      axadina: {
        means: 'family female address',
        el: 'αξαδίνα',
        reply: 'Εδώ είμαι. Πες μου.',
      },
      pitogyra: {
        means: 'pita gyro / pitogyro food order (village tray)',
        el: 'πιτογύρα / πιτόγυρο',
        food: 'pitogyra',
        reply: 'Πιτογύρα — κατάλαβα. Παραγγελία στο map με courier / Telemachos.',
      },
      mpyronia: {
        means: 'beers (μπυρόνια) — Greeklish mpyronia / mpironia / mpyres',
        el: 'μπυρόνια',
        food: 'beer',
        reply: 'Μπυρόνια στο tray — μαζί με πιτογύρα αν θες.',
      },
      tsigareta: {
        means: 'cigarettes',
        el: 'τσιγάρα',
        food: 'cigarettes',
        reply: 'Τσιγάρα σημειωμένα στο order.',
      },
      archangelos: {
        means: 'Archangelos village Rhodes — owner home dialect / mission root',
        el: 'Αρχάγγελος Ρόδου',
        lat: 36.215,
        lng: 28.125,
        reply: 'Αρχάγγελος — το χωριό. Globe / map εκεί αν θες.',
      },
      telemachos: {
        means: 'ΤΗΛΕΜΑΧΟΣ — Astranov drone pilot (gaming + delivery stack)',
        el: 'Τηλέμαχος',
        reply: 'Telemachos (Τηλέμαχος) online — drone pilot. Πες deliver / pitogyra / pilot.',
      },
      tilemaxos: {
        means: 'tilemaxos — extreme Telemachos edition spelling',
        el: 'tilemaxos',
        reply: 'Tilemaxos = Telemachos extreme stack. Drone pilot ready.',
      },
      teledromos: {
        means: 'ΤΗΛΕΔΡΟΜΟΣ — commercial drone delivery edition',
        el: 'Τηλέδρομος',
        reply: 'Teledromos — commercial delivery drone lane.',
      },
    },

    _stripOutbound: [
      /\b(ρε|πρε|αξάκι|αξάς|αξαδίνα|aksas|aksaki|axadina|aksako|ela\s+re|έλα\s+ρε)\b/gi,
      /\b(arcangelo|archangelo|village\s+mix)\b/gi,
    ],

    _routeMap: [
      [/\b(pame|πάμε)\s+(locate|me|gps|εδώ|edo)\b/i, 'locate me'],
      [/\b(pes|πες)\s+(mou|μου)\s+(.+)/i, '$3'],
      [/\b(ti\s+thes|τι\s+θες)\b/i, ''],
      [/\b(douleia|δουλειά)\b/i, 'work'],
      [/\b(thelo|θέλω)\s+(pitogyra|πιτογυρ)/i, 'order pitogyra'],
      [/\b(thelo|θέλω)\s+(mpyronia|mpironia|μπυρ)/i, 'order beer'],
      [/\bela\s+re\b/i, ''],
      [/\b(aksaki|αξάκι)\b/i, ''],
    ],

    _brandRules: [
      [
        /\b(άστρονοβ|αστρονοβ|άστρανοβ|αστρανοβ|astranof|astronov|astronoff|asstranov)\b/gi,
        'Astranov',
      ],
      [
        /\b(αρχάγγελο|αρχαγγελο|αρχανγελο|arch\s*angel|archangelo?s?|arc\s*angelo|archangelos)\b/gi,
        'Archangelos',
      ],
      [/\b(pitogyro|πιτογυρο|πιτόγυρο|πιτογύρο|πιτογύρα|pitogyra)\b/gi, 'pitogyra'],
      [
        /\b(mpyronia|mpironia|mpyres|mpires|μπυρόνια|μπυρονια|μπίρες|μπιρες|beers?)\b/gi,
        'mpyronia',
      ],
      [/\b(tsigareta|tsigara|τσιγάρα|τσιγαρα|cigarettes?)\b/gi, 'tsigareta'],
      [
        /\b(telemachus|tilemachos|tilemaxos|telmaxos|telmachos|τηλεμαχοσ|τηλεμαχός|τηλεμαχος|τηλέμαχος)\b/gi,
        'Telemachos',
      ],
      [/\b(teledromus|teledromos|τηλεδρομος|τηλεδρομός)\b/gi, 'Teledromos'],
      [/\b(αξάκι|αξακι|aksaki)\b/gi, 'aksaki'],
      [/\b(αξάς|αξας|aksas)\b/gi, 'aksas'],
    ],

    _dialectRules: [
      [/\b(έλα ρε|ελα ρε|ela re)\b/gi, 'ela re'],
      [/\b(τι θες|τι θέλεις|ti thes|ti theleis)\b/gi, 'ti thes'],
      [/\b(πάμε|pame|παμε)\b/gi, 'pame'],
      [/\b(πες μου|pes mou)\b/gi, 'pes mou'],
      [/\b(αξάς|αξας|aksas)\b/gi, 'aksas'],
      [/\b(αξάκι|αξακι|aksaki)\b/gi, 'aksaki'],
      [/\b(αξαδίνα|αξαδινα|axadina)\b/gi, 'axadina'],
      [/\b(locate\s*me|λοκέιτ|λοκειτ)\b/gi, 'locate me'],
    ],

    _latinGreek: function (s) {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ς/g, 'σ');
    },

    _count: function (patterns, text) {
      var n = 0;
      var i;
      for (i = 0; i < patterns.length; i++) {
        if (patterns[i].test(text)) n++;
      }
      return n;
    },

    detect: function (raw) {
      var text = String(raw || '').trim();
      if (!text) return { score: 0, active: false, team: false, mixed: false };
      var low = text.toLowerCase();
      var norm = this._latinGreek(text);
      var hasGreek = this._greek.test(text);
      var hasLatin = /[a-z]/i.test(text);
      var mixed = hasGreek && hasLatin;
      var score = 0;
      score += this._count(this._crete, low) * 9;
      score += this._count(this._family, low) * 14;
      score += this._count(this._family, norm) * 12;
      score += this._count(this._ancient, text) * 11;
      score += this._count(this._greeklish, low) * 6;
      if (mixed) score += 12;
      // lexicon hits
      if (/\b(aksaki|aksas|pitogyra|mpyronia|mpironia|tsigareta|telemachos|tilemaxos)\b/i.test(low))
        score += 20;
      if (/αξάκι|πιτογύρ|μπυρόν|τηλεμαχ|αρχάγγελ/i.test(text)) score += 20;
      var team =
        score >= this.TEAM ||
        (this._count(this._family, low) + this._count(this._family, norm) >= 1 &&
          this._count(this._crete, low) + this._count(this._greeklish, low) >= 1);
      return {
        score: score,
        active: score >= this.ACTIVATE,
        team: team,
        mixed: mixed || (hasGreek && /\b[a-z]{3,}\b/i.test(low)),
      };
    },

    ingest: function (raw) {
      var d = this.detect(raw);
      if (d.score > 0) {
        this._hits++;
        this._lastAt = Date.now();
        if (d.score > this._score) this._score = d.score;
      }
      if (d.active) this._active = true;
      if (d.team) this._team = true;
      return d;
    },

    sessionActive: function () {
      return !!this._active;
    },
    teamLane: function () {
      return !!this._team;
    },
    mirrorAllowed: function () {
      return this._active && this._score >= this.ACTIVATE;
    },

    looksMixed: function (s) {
      var t = String(s || '');
      return this._greek.test(t) && /[a-zA-Z]{2,}/.test(t);
    },

    listenLang: function (draft) {
      var t = String(draft || '');
      if (this.detect(t).active || this.detect(t).mixed || this._greek.test(t)) return 'el-GR';
      return 'en-US';
    },

    repairBrands: function (text) {
      var s = String(text || '');
      var i;
      for (i = 0; i < this._brandRules.length; i++) {
        s = s.replace(this._brandRules[i][0], this._brandRules[i][1]);
      }
      return s.replace(/\s+/g, ' ').trim();
    },

    repairTranscript: function (text) {
      var s = this.repairBrands(text);
      var i;
      for (i = 0; i < this._dialectRules.length; i++) {
        s = s.replace(this._dialectRules[i][0], this._dialectRules[i][1]);
      }
      return s.replace(/\s+/g, ' ').trim();
    },

    repairOutbound: function (text, kind) {
      var s = this.repairBrands(String(text || '').trim());
      if (!s) return s;
      if (this.mirrorAllowed()) return s;
      var i;
      for (i = 0; i < this._stripOutbound.length; i++) {
        s = s.replace(this._stripOutbound[i], '').replace(/\s+/g, ' ').trim();
      }
      return s;
    },

    normalizeForRouting: function (text) {
      var s = this.repairTranscript(text);
      if (!s) return s;
      this.ingest(s);
      var i;
      for (i = 0; i < this._routeMap.length; i++) {
        if (this._routeMap[i][0].test(s)) s = s.replace(this._routeMap[i][0], this._routeMap[i][1]).trim();
      }
      return s.replace(/\s+/g, ' ').trim();
    },

    /** Expand owner lexicon hits into food/order/pilot intents for Astranov Mind */
    expandIntent: function (text) {
      var raw = String(text || '');
      var s = this.normalizeForRouting(raw);
      var low = s.toLowerCase();
      var out = {
        text: s,
        dialect: this.detect(raw),
        food: null,
        foods: [],
        pilot: false,
        village: false,
        familyCall: false,
        replyHint: null,
      };
      if (/\b(aksaki|aksas|axadina|αξάκι|αξάς)\b/i.test(low + raw)) {
        out.familyCall = true;
        out.replyHint = this.LEXICON.aksaki.reply;
      }
      if (/\b(archangelos|arcangelo|αρχάγγελ)\b/i.test(low + raw)) {
        out.village = true;
        out.replyHint = this.LEXICON.archangelos.reply;
      }
      if (/\b(telemachos|tilemaxos|tilemachos|teledromos|τηλεμαχ|drone\s*pilot|pilot)\b/i.test(low + raw)) {
        out.pilot = true;
        out.replyHint = this.LEXICON.telemachos.reply;
      }
      if (/\b(pitogyra|pitogyro|πιτογυρ)\b/i.test(low + raw)) {
        out.food = 'pitogyra';
        out.foods.push('pitogyra');
      }
      if (/\b(mpyronia|mpironia|mpyres|μπυρόν|μπίρ|beer)\b/i.test(low + raw)) {
        out.foods.push('mpyronia');
        if (!out.food) out.food = 'beer';
      }
      if (/\b(tsigareta|tsigara|τσιγάρ|cigar)\b/i.test(low + raw)) {
        out.foods.push('tsigareta');
      }
      if (out.foods.length && !out.food) out.food = out.foods[0];
      return out;
    },

    explain: function (term) {
      var k = String(term || '')
        .toLowerCase()
        .trim();
      k = k.replace(/πιτογύρ.*/, 'pitogyra').replace(/μπυρ.*/, 'mpyronia').replace(/αξάκ.*/, 'aksaki');
      if (/\bpitogy/.test(k)) k = 'pitogyra';
      if (/\bmpyr|mpir|beer/.test(k)) k = 'mpyronia';
      if (/\baksak|αξάκ/.test(k)) k = 'aksaki';
      if (/\btelem|tilem|τηλεμ/.test(k)) k = 'telemachos';
      if (/\barchangel|arcangel|αρχάγ/.test(k)) k = 'archangelos';
      return this.LEXICON[k] || null;
    },

    apiContext: function () {
      if (!this._active) return {};
      return {
        dialect_lane: this.ID,
        dialect_score: Math.min(99, Math.round(this._score)),
        dialect_team: this._team,
        mind: 'astranov',
      };
    },

    reset: function () {
      this._active = false;
      this._score = 0;
      this._team = false;
      this._hits = 0;
      this._lastAt = 0;
    },
  };

  global.ArcangeloDialect = D;
  global.SNArcangelo = D;
})(typeof window !== 'undefined' ? window : globalThis);
