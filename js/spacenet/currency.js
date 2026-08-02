/**
 * Astranov Coins — primary wallet unit (mine Astranov coins).
 * Fiat/crypto remain secondary quotes only. No "strands".
 */
(function (g) {
  'use strict';

  var LEDGER_K = 'sn:ledger-v1';
  function ledgerLoad() {
    try {
      return JSON.parse(localStorage.getItem(LEDGER_K) || '[]');
    } catch (_) {
      return [];
    }
  }
  function ledgerPush(entry) {
    var a = ledgerLoad();
    a.push(
      Object.assign({ t: Date.now() }, entry || {})
    );
    if (a.length > 800) a = a.slice(-800);
    try {
      localStorage.setItem(LEDGER_K, JSON.stringify(a));
    } catch (_) {}
    return entry;
  }

  var QK = 'spacenet_currency_v1';
  var WK = 'spacenet_wallet_v1';
  /** Primary currency: Astranov Coins */
  var SYM = 'AC';
  var NAME = 'Astranov coin';
  var NAME_PL = 'Astranov coins';
  var GLYPH = '◈';
  var st = {
    networkIndex: 1,
    quotes: { EUR: 1, USD: 1.08, BTC: 0.000015, ETH: 0.00025 },
    balance: 0,
    mined: 0,
    platformFees: 0,
  };

  function load() {
    try {
      var q = JSON.parse(localStorage.getItem(QK) || '{}');
      if (q.networkIndex > 0) st.networkIndex = q.networkIndex;
      if (q.quotes) Object.keys(q.quotes).forEach(function (k) {
        if (q.quotes[k] > 0) st.quotes[k] = q.quotes[k];
      });
    } catch (e) {}
    try {
      var w = JSON.parse(localStorage.getItem(WK) || '{}');
      if (typeof w.balance === 'number') st.balance = Math.max(0, w.balance);
      if (typeof w.mined === 'number') st.mined = w.mined;
      if (typeof w.platformFees === 'number') st.platformFees = w.platformFees;
    } catch (e) {}
    recompute();
  }

  function saveQ() {
    try {
      localStorage.setItem(QK, JSON.stringify({ networkIndex: st.networkIndex, quotes: st.quotes }));
    } catch (e) {}
  }
  function saveW() {
    try {
      localStorage.setItem(WK, JSON.stringify({ balance: st.balance, mined: st.mined, platformFees: st.platformFees }));
    } catch (e) {}
  }

  function recompute() {
    var n = st.networkIndex;
    st.quotes.EUR = n;
    st.quotes.USD = n * 1.08;
    st.quotes.BTC = n * 0.000015;
    st.quotes.ETH = n * 0.00025;
  }

  function fmt(a) {
    var n = Number(a);
    if (!isFinite(n)) n = 0;
    return n.toFixed(2) + ' AC';
  }

  /** Compact HUD: ◈ 12.50 */
  function fmtCompact(a) {
    var n = Number(a);
    if (!isFinite(n)) n = 0;
    return GLYPH + ' ' + n.toFixed(2);
  }

  function fmtRate(perUnit, unit) {
    var n = Number(perUnit);
    if (!isFinite(n)) n = 0;
    unit = unit || 'day';
    return n.toFixed(2) + ' AC/' + unit;
  }

  function credit(a, why) {
    a = Number(a);
    if (!isFinite(a) || a <= 0) return st.balance;
    st.balance += a;
    if (why === 'mine') st.mined += a;
    saveW();
    try {
      ledgerPush({ kind: 'credit', amount: a, why: why || 'credit', bal: st.balance });
    } catch (_) {}
    g.SNField && g.SNField.paint && g.SNField.paint();
    return st.balance;
  }

  /**
   * Architect platform revenue — 3% of every marketplace transaction in Astranov coins.
   * platformFees vault ONLY GROWS — never credited back into client spendable balance.
   * (Client already paid full gross via debit; vault is architect accounting.)
   */
  function notePlatformFee(a, meta) {
    a = Number(a);
    if (!isFinite(a) || a <= 0)
      return { ok: false, fee: 0, platformFees: st.platformFees, balance: st.balance };
    st.platformFees = Math.round(((Number(st.platformFees) || 0) + a) * 100) / 100;
    saveW();
    try {
      if (g.SNCli && SNCli.log) {
        SNCli.log(
          '3% vault +' +
            fmt(a) +
            ' · vault total ' +
            fmt(st.platformFees) +
            ' · wallet ' +
            fmt(st.balance) +
            (meta && meta.why ? ' · ' + meta.why : ''),
          'ok'
        );
      }
      if (g.SNCli && SNCli.preview) SNCli.preview('Vault ' + fmt(st.platformFees) + ' · +3%');
      if (g.SNGlobe && SNGlobe.setHud) SNGlobe.setHud('Vault ' + fmt(st.platformFees));
      if (g.SNField && SNField.paint) SNField.paint();
      if (g.SNUsage && SNUsage.track) {
        SNUsage.track('platform_fee_3pct', {
          fee: a,
          total: st.platformFees,
          why: (meta && meta.why) || 'tx',
        });
      }
    } catch (e) {}
    return { ok: true, fee: a, platformFees: st.platformFees, balance: st.balance };
  }

  function takePlatformFeeFrom(gross, why) {
    gross = Number(gross);
    if (!isFinite(gross) || gross <= 0) return 0;
    var fee = Math.round(gross * 0.03 * 100) / 100;
    notePlatformFee(fee, { why: why || 'transaction', gross: gross });
    return fee;
  }

  load();

  g.SNCurrency = {
    SYMBOL: SYM,
    GLYPH: GLYPH,
    NAME: NAME,
    NAME_PL: NAME_PL,
    /** @deprecated aliases */
    LEGACY: 'SpaceNets',
    STRAND_LEGACY: 'strands',
    format: fmt,
    formatCompact: fmtCompact,
    formatRate: fmtRate,
    formatPair: function (a, code) {
      var n = Number(a);
      if (!isFinite(n)) n = 0;
      var q = st.quotes[code] || 1;
      return fmt(n) + ' · ~' + (n * q).toFixed(2) + ' ' + (code || 'EUR');
    },
    snapshot: function () {
      return {
        balance: st.balance,
        mined: st.mined,
        platformFees: st.platformFees,
        networkIndex: st.networkIndex,
        quotes: Object.assign({}, st.quotes),
        name: NAME,
        symbol: SYM,
      };
    },
    setNetworkIndex: function (n) {
      n = Number(n);
      if (!(n > 0)) return false;
      st.networkIndex = n;
      recompute();
      saveQ();
      return true;
    },
    balance: function () {
      return st.balance;
    },
    mined: function () {
      return st.mined;
    },
    platformFees: function () {
      return st.platformFees || 0;
    },
    credit: credit,
    creditMined: function (a) {
      return credit(a, 'mine');
    },
    notePlatformFee: notePlatformFee,
    takePlatformFeeFrom: takePlatformFeeFrom,
    debit: function (a, why) {
      a = Number(a);
      if (!(a > 0) || a > st.balance) return { ok: false, balance: st.balance };
      st.balance -= a;
      saveW();
      try {
        ledgerPush({ kind: 'debit', amount: a, why: why || 'debit', bal: st.balance });
      } catch (_) {}
      g.SNField && g.SNField.paint && g.SNField.paint();
      return { ok: true, balance: st.balance };
    },
    vault: function () {
      return st.platformFees || 0;
    },
    ledgerVerify: function () {
      var rows = ledgerLoad();
      var sum = 0;
      rows.forEach(function (r) {
        var x = Number(r.amount) || 0;
        if (r.kind === 'credit') sum += x;
        else if (r.kind === 'debit') sum -= x;
      });
      return {
        ok: rows.length === 0 || Math.abs(sum - st.balance) < 0.05,
        ledgerSum: Math.round(sum * 100) / 100,
        balance: st.balance,
        lines: rows.length,
        vault: st.platformFees || 0,
      };
    },
    fees: { platformPct: 3, driverPct: 15 },
    status: function () {
      return [
        'ASTRANOV COINS PRIMARY · index ' + st.networkIndex.toFixed(4),
        'Wallet ' + fmt(st.balance) + ' · mined ' + fmt(st.mined),
        'Platform fees (your 3%) ' + fmt(st.platformFees || 0) + ' lifetime',
        '1 AC ~ ' + st.quotes.EUR.toFixed(4) + ' EUR / ' + st.quotes.USD.toFixed(4) + ' USD',
        'EUR/USD/BTC/ETH = secondary quotes only',
        'Fees 3% platform → Architect · 15% driver (in AC)',
        'Mine Astranov coins · no strands',
      ];
    },
  };

  // ledger helpers on API (debit/credit already push ledger inside)
  g.SNCurrency.ledger = ledgerLoad;
  g.SNCurrency.ledgerPush = ledgerPush;
})(typeof window !== 'undefined' ? window : globalThis);

