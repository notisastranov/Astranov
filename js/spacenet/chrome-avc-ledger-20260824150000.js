/**
 * Astranov Coin (AVC) ledger — Build 20260824150000-avc-genesis
 * OWNER LAW 2026-08-24:
 *   Genesis treasury = 2,000,000 AVC on owner account (notis), soft-ref 1 AVC = €1.
 *   Daily revalue RE + SpaceNet + brand → adjust mark.
 *   Programmer pay 33 AVC/h ONLY if verified value ≥ 3× pay.
 * AVC = internal SpaceNet ledger unit (aligns with ⭐). Not a bank euro deposit.
 * Product law: if it is not on the ledger it is not paid.
 */
(function (G) {
  'use strict';
  var BUILD = '20260824150000-avc-genesis';
  if (G.__snAvcLedger20260824150000) return;
  G.__snAvcLedger20260824150000 = 1;

  var STORAGE_K = 'sn:avc-ledger-v1';
  var MARK_K = 'sn:avc-mark-v1';
  var OWNER_ID = 'notis';
  var GENESIS_AVC = 2000000;
  var SOFT_EUR = 1;
  var WORK_RATE = 33;
  var VALUE_MULT = 3;
  var GENESIS_MARK_EUR = 2000000;

  function now() {
    return Date.now();
  }
  function dayKey(ts) {
    var d = new Date(ts || now());
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function log(msg, kind) {
    try {
      if (G.SNCli && typeof SNCli.log === 'function') {
        SNCli.log(String(msg), kind || 'ok');
        return;
      }
    } catch (_) {}
    try {
      var el = document.getElementById('cli-log');
      if (el) {
        var line = document.createElement('div');
        line.textContent = String(msg);
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }

  function defaultState() {
    return {
      build: BUILD,
      softEur: SOFT_EUR,
      markEur: GENESIS_MARK_EUR,
      markDay: dayKey(),
      accounts: {},
      journal: [],
      workPending: [],
      workAccepted: [],
    };
  }

  function load() {
    var st = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_K);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          st.softEur = typeof p.softEur === 'number' ? p.softEur : SOFT_EUR;
          st.markEur = typeof p.markEur === 'number' ? p.markEur : GENESIS_MARK_EUR;
          st.markDay = p.markDay || dayKey();
          st.accounts = p.accounts && typeof p.accounts === 'object' ? p.accounts : {};
          st.journal = Array.isArray(p.journal) ? p.journal : [];
          st.workPending = Array.isArray(p.workPending) ? p.workPending : [];
          st.workAccepted = Array.isArray(p.workAccepted) ? p.workAccepted : [];
        }
      }
    } catch (_) {}
    ensureGenesis(st);
    return st;
  }

  function save(st) {
    try {
      if (st.journal && st.journal.length > 2000) st.journal = st.journal.slice(-2000);
      if (st.workAccepted && st.workAccepted.length > 500) st.workAccepted = st.workAccepted.slice(-500);
      localStorage.setItem(STORAGE_K, JSON.stringify(st));
    } catch (_) {}
    try {
      localStorage.setItem(
        MARK_K,
        JSON.stringify({ markEur: st.markEur, softEur: st.softEur, day: st.markDay, t: now() })
      );
    } catch (_) {}
    paintHud(st);
  }

  function ensureGenesis(st) {
    if (!st.accounts[OWNER_ID]) {
      st.accounts[OWNER_ID] = { id: OWNER_ID, balance: GENESIS_AVC, role: 'treasury', name: 'Notis Astranov' };
      st.journal.push({
        t: now(),
        type: 'genesis',
        to: OWNER_ID,
        amount: GENESIS_AVC,
        note: 'Genesis treasury 2,000,000 AVC (soft €2M mark)',
      });
      save(st);
      log('AVC genesis · treasury ' + GENESIS_AVC.toLocaleString() + ' AVC on ' + OWNER_ID, 'ok');
    }
  }

  function balance(id) {
    var st = load();
    var a = st.accounts[id || OWNER_ID];
    return a ? Number(a.balance) || 0 : 0;
  }

  function transfer(from, to, amount, note) {
    amount = Math.floor(Number(amount) || 0);
    if (amount <= 0) return { ok: false, err: 'amount must be > 0' };
    var st = load();
    if (!st.accounts[from]) return { ok: false, err: 'from account missing' };
    if (!st.accounts[to]) {
      st.accounts[to] = { id: to, balance: 0, role: 'user', name: to };
    }
    if (st.accounts[from].balance < amount) return { ok: false, err: 'insufficient balance' };
    st.accounts[from].balance -= amount;
    st.accounts[to].balance += amount;
    st.journal.push({
      t: now(),
      type: 'transfer',
      from: from,
      to: to,
      amount: amount,
      note: note || '',
    });
    save(st);
    return { ok: true, fromBal: st.accounts[from].balance, toBal: st.accounts[to].balance };
  }

  function submitWork(who, hours, valueCreated, note) {
    hours = Number(hours) || 0;
    valueCreated = Number(valueCreated) || 0;
    var pay = Math.round(hours * WORK_RATE);
    var minValue = pay * VALUE_MULT;
    var st = load();
    var entry = {
      t: now(),
      who: who || 'programmer',
      hours: hours,
      pay: pay,
      valueCreated: valueCreated,
      minValue: minValue,
      note: note || '',
      status: 'pending',
    };
    if (valueCreated >= minValue && pay > 0) {
      entry.status = 'accepted';
      var r = transfer(OWNER_ID, who, pay, 'work ' + hours + 'h · value ' + valueCreated + ' ≥ 3×');
      if (!r.ok) {
        entry.status = 'failed';
        entry.err = r.err;
      } else {
        st.workAccepted.push(entry);
        log('Work ACCEPTED · ' + who + ' +' + pay + ' AVC (' + hours + 'h @33) · value ' + valueCreated + ' ≥ ' + minValue, 'ok');
      }
    } else {
      entry.status = 'rejected';
      st.workPending.push(entry);
      log(
        'Work REJECTED · need value ≥ ' + minValue + ' (3× of ' + pay + ' AVC). Got ' + valueCreated,
        'warn'
      );
    }
    save(st);
    return entry;
  }

  function dailyRevalue(newMarkEur, reason) {
    var st = load();
    var day = dayKey();
    var prev = st.markEur;
    st.markEur = Number(newMarkEur) || prev;
    st.markDay = day;
    st.journal.push({
      t: now(),
      type: 'revalue',
      prev: prev,
      markEur: st.markEur,
      note: reason || 'daily mark',
    });
    save(st);
    log('Mark revalued · €' + prev.toLocaleString() + ' → €' + st.markEur.toLocaleString() + ' (' + day + ')', 'ok');
    return st;
  }

  function maybeDaily(st) {
    st = st || load();
    if (st.markDay !== dayKey()) {
      // keep current mark; just stamp day (owner can force revalue via CLI)
      st.markDay = dayKey();
      save(st);
    }
  }

  function paintHud(st) {
    st = st || load();
    try {
      var el = document.getElementById('fbh-s');
      if (el) {
        var bal = balance(OWNER_ID);
        el.textContent = '⭐ ' + (bal / 100).toFixed(2); // soft display align with existing star hud scale if used
        // also show AVC mark hint via title
        el.title = 'Treasury ' + bal.toLocaleString() + ' AVC · mark €' + (st.markEur || 0).toLocaleString();
      }
    } catch (_) {}
  }

  function wrapCli() {
    try {
      if (!G.SNCli || typeof G.SNCli.run !== 'function') return;
      if (G.SNCli.run.__snAvc) return;
      var orig = G.SNCli.run.bind(G.SNCli);
      G.SNCli.run = function (line) {
        var s = String(line || '').trim();
        var low = s.toLowerCase();
        if (/^coin\b|^avc\b|^ledger\b/.test(low)) {
          handleCoin(s);
          return true;
        }
        return orig(line);
      };
      G.SNCli.run.__snAvc = 1;
    } catch (_) {}
  }

  function handleCoin(line) {
    var parts = String(line).trim().split(/\s+/);
    var cmd = (parts[1] || 'balance').toLowerCase();
    var st = load();
    if (cmd === 'balance' || cmd === 'bal' || cmd === 'treasury') {
      var who = parts[2] || OWNER_ID;
      log('AVC · ' + who + ' = ' + balance(who).toLocaleString() + ' AVC  (soft €' + (balance(who) * st.softEur).toLocaleString() + ')', 'ok');
      return;
    }
    if (cmd === 'rate' || cmd === 'pay') {
      log('Work rate · ' + WORK_RATE + ' AVC/h · gate ≥ ' + VALUE_MULT + '× value created', 'ok');
      return;
    }
    if (cmd === 'mark') {
      if (parts[2] && !isNaN(Number(parts[2]))) {
        dailyRevalue(Number(parts[2]), parts.slice(3).join(' ') || 'CLI mark');
      } else {
        log('Mark · €' + st.markEur.toLocaleString() + ' · day ' + st.markDay + ' · soft 1 AVC=€' + st.softEur, 'ok');
      }
      return;
    }
    if (cmd === 'work') {
      // coin work <who> <hours> <value> [note...]
      var who = parts[2] || 'programmer';
      var hours = Number(parts[3]) || 0;
      var value = Number(parts[4]) || 0;
      var note = parts.slice(5).join(' ');
      submitWork(who, hours, value, note);
      return;
    }
    if (cmd === 'log' || cmd === 'journal') {
      var n = Math.min(12, st.journal.length);
      for (var i = st.journal.length - n; i < st.journal.length; i++) {
        var j = st.journal[i];
        log('#' + i + ' ' + j.type + ' ' + (j.amount || j.markEur || '') + ' ' + (j.note || ''), 'info');
      }
      return;
    }
    if (cmd === 'help') {
      log('coin balance [id] · rate · mark [eur] · work <who> <h> <value> [note] · log', 'ok');
      return;
    }
    log('AVC · coin balance | rate | mark | work | log', 'ok');
  }

  function boot() {
    var st = load();
    maybeDaily(st);
    paintHud(st);
    wrapCli();
    try {
      G.SNAVC = {
        build: BUILD,
        balance: balance,
        transfer: transfer,
        submitWork: submitWork,
        dailyRevalue: dailyRevalue,
        load: load,
        OWNER: OWNER_ID,
        RATE: WORK_RATE,
        MULT: VALUE_MULT,
      };
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  }
  setTimeout(boot, 0);
  setTimeout(boot, 800);
  setTimeout(wrapCli, 400);
  setInterval(wrapCli, 3000);
  setInterval(function () {
    var st = load();
    maybeDaily(st);
  }, 60000);
})(typeof window !== 'undefined' ? window : globalThis);
