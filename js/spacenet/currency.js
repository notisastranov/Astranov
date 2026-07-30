/**
 * S - SpaceNets (primary) + wallet. Secondary quotes only.
 * Spartan: quotes + balance in one module.
 */
(function (g) {
  'use strict';
  var QK = 'spacenet_currency_v1';
  var WK = 'spacenet_wallet_v1';
  var SYM = 'S';
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
    saveQ();
  }

  function fmt(a) {
    var n = Number(a);
    if (!isFinite(n)) n = 0;
    return n.toFixed(2) + ' ' + SYM;
  }

  function credit(a, why) {
    a = Number(a);
    if (!isFinite(a) || a <= 0) return st.balance;
    st.balance += a;
    if (why === 'mine') st.mined += a;
    saveW();
    g.SNField && g.SNField.paint && g.SNField.paint();
    return st.balance;
  }

  /**
   * Architect platform revenue — 3% of every marketplace transaction in S.
   * platformFees vault ONLY GROWS (never spent by sim/client debit).
   * Also credits spendable balance so total coins rise.
   */
  function notePlatformFee(a, meta) {
    a = Number(a);
    if (!isFinite(a) || a <= 0)
      return { ok: false, fee: 0, platformFees: st.platformFees, balance: st.balance };
    st.platformFees = Math.round(((Number(st.platformFees) || 0) + a) * 100) / 100;
    // Vault is source of truth for "my 3% builds up"
    credit(a, 'platform');
    saveW();
    try {
      if (g.SNCli && SNCli.log) {
        SNCli.log(
          'YOUR 3% +' +
            fmt(a) +
            ' · vault ' +
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
      // Superuser TX tape
      try {
        if (g.SNSuper && SNSuper.pushTx) {
          SNSuper.pushTx({
            kind: 'platform_3pct',
            fee: a,
            vault: st.platformFees,
            why: (meta && meta.why) || 'tx',
          });
        }
      } catch (e2) {}
    } catch (e) {}
    return { ok: true, fee: a, platformFees: st.platformFees, balance: st.balance };
  }

  /** Compute 3% of gross (min 0.01 S if gross > 0) and credit architect */
  function takePlatformFeeFrom(gross, why) {
    gross = Number(gross);
    if (!isFinite(gross) || gross <= 0) return { ok: false, fee: 0 };
    var fee = Math.round(gross * 0.03 * 100) / 100;
    if (fee < 0.01 && gross > 0) fee = 0.01;
    return notePlatformFee(fee, { why: why || 'transaction', gross: gross });
  }

  load();

  g.SNCurrency = {
    SYMBOL: SYM,
    NAME: 'SpaceNets',
    PRIMACY: true,
    format: fmt,
    formatPair: function (a, code) {
      code = (code || 'EUR').toUpperCase();
      var r = st.quotes[code];
      return fmt(a) + (r ? ' (~' + (Number(a) * r).toFixed(2) + ' ' + code + ')' : '');
    },
    quote: function (c) {
      return st.quotes[(c || 'EUR').toUpperCase()] || null;
    },
    rate: function (c) {
      return this.quote(c);
    },
    toFiat: function (a, c) {
      return Number(a) * (this.quote(c) || 1);
    },
    fromFiat: function (a, c) {
      var r = this.quote(c) || 1;
      return Number(a) / r;
    },
    networkIndex: function () {
      return st.networkIndex;
    },
    setNetworkIndex: function (n) {
      n = Number(n);
      if (!(n > 0)) return false;
      st.networkIndex = n;
      recompute();
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
    debit: function (a) {
      a = Number(a);
      if (!(a > 0) || a > st.balance) return { ok: false, balance: st.balance };
      st.balance -= a;
      // Never reduce platformFees vault — architect 3% only grows
      saveW();
      g.SNField && g.SNField.paint && g.SNField.paint();
      return { ok: true, balance: st.balance };
    },
    fees: { platformPct: 3, driverPct: 15 },
    status: function () {
      return [
        'S (SpaceNets) PRIMARY · index ' + st.networkIndex.toFixed(4),
        'Wallet ' + fmt(st.balance) + ' · mined ' + fmt(st.mined),
        'Platform fees (your 3%) ' + fmt(st.platformFees || 0) + ' lifetime',
        '1 S ~ ' + st.quotes.EUR.toFixed(4) + ' EUR / ' + st.quotes.USD.toFixed(4) + ' USD',
        'EUR/USD/BTC/ETH = secondary quotes only',
        'Fees 3% platform → Architect · 15% driver (in S)',
      ];
    },
    snapshot: function () {
      return {
        balance: st.balance,
        mined: st.mined,
        platformFees: st.platformFees || 0,
        line: fmt(st.balance),
      };
    },
  };
  // Compat alias used by older field hooks
  g.SNWallet = g.SNCurrency;
})(typeof window !== 'undefined' ? window : globalThis);
