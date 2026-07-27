/**
 * S wallet — SpaceNets balance (SPECS A5)
 * Primary unit; mining credits land here. Not AVC.
 */
(function (global) {
  'use strict';

  var KEY = 'spacenet_wallet_v1';
  var state = {
    balance: 0,
    mined: 0,
    platformFees: 0,
    p2pOut: 0,
    p2pIn: 0,
    history: [],
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && typeof d.balance === 'number') state.balance = Math.max(0, d.balance);
      if (d && typeof d.mined === 'number') state.mined = d.mined;
      if (d && typeof d.platformFees === 'number') state.platformFees = d.platformFees;
      if (d && typeof d.p2pOut === 'number') state.p2pOut = d.p2pOut;
      if (d && typeof d.p2pIn === 'number') state.p2pIn = d.p2pIn;
      if (Array.isArray(d.history)) state.history = d.history.slice(-80);
    } catch (e) {
      /* ignore */
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function fmt(n) {
    return global.SNCurrency ? SNCurrency.format(n) : Number(n).toFixed(2) + ' S';
  }

  function credit(amount, reason) {
    var a = Number(amount);
    if (!isFinite(a) || a <= 0) return state.balance;
    state.balance += a;
    state.history.push({ t: Date.now(), d: a, r: reason || 'credit' });
    if (state.history.length > 80) state.history.shift();
    save();
    global.SNField?.refreshBalance?.();
    global.SNRibbon?.render?.();
    return state.balance;
  }

  function debit(amount, reason) {
    var a = Number(amount);
    if (!isFinite(a) || a <= 0) return { ok: false, balance: state.balance };
    if (a > state.balance) return { ok: false, error: 'insufficient', balance: state.balance };
    state.balance -= a;
    state.history.push({ t: Date.now(), d: -a, r: reason || 'debit' });
    if (state.history.length > 80) state.history.shift();
    save();
    global.SNField?.refreshBalance?.();
    global.SNRibbon?.render?.();
    return { ok: true, balance: state.balance };
  }

  function creditMined(amount) {
    var a = Number(amount);
    if (!isFinite(a) || a <= 0) return;
    state.mined += a;
    credit(a, 'mine');
  }

  function notePlatformFee(amountS) {
    var a = Number(amountS);
    if (isFinite(a) && a > 0) {
      state.platformFees += a;
      save();
    }
  }

  load();

  global.SNWallet = {
    balance: function () {
      return state.balance;
    },
    mined: function () {
      return state.mined;
    },
    formatBalance: function () {
      return fmt(state.balance);
    },
    credit: credit,
    debit: debit,
    creditMined: creditMined,
    notePlatformFee: notePlatformFee,
    snapshot: function () {
      return {
        balance: state.balance,
        mined: state.mined,
        platformFees: state.platformFees,
        p2pOut: state.p2pOut,
        p2pIn: state.p2pIn,
        line: fmt(state.balance),
      };
    },
    history: function () {
      return state.history.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
