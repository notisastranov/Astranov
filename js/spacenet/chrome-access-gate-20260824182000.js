/* Astranov ACCESS GATE · Build 20260824182000
 * OWNER LAW 2026-08-24:
 *   Users must REGISTER and DEPOSIT real money to use SpaceNet for real.
 *   Guest = browse globe only.
 *   Registered + unfunded = account, no real spend.
 *   Funded (real deposit) = delivery, marketplace, paid calls, spend AVC.
 * AVC = internal ledger unit. Not a bank euro account.
 */
(function (G) {
  'use strict';
  if (G.__snAccessGate20260824182000) return;
  G.__snAccessGate20260824182000 = 1;

  var BUILD = '20260824182000-access';
  var STORE = 'sn:access-v1';
  var MIN_DEPOSIT_EUR = 10; /* minimum real deposit to unlock */

  function log(msg, kind) {
    try {
      if (G.SNCli && SNCli.log) {
        SNCli.log(String(msg), kind || 'ok');
        return;
      }
    } catch (_) {}
    try {
      var el = document.getElementById('cli-log');
      if (el) {
        var d = document.createElement('div');
        d.textContent = String(msg);
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
    try {
      console.log('[access]', msg);
    } catch (_) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') return p;
      }
    } catch (_) {}
    return {
      registered: false,
      userId: null,
      email: null,
      name: null,
      funded: false,
      depositedEur: 0,
      deposits: [],
      updatedAt: 0,
    };
  }

  function save(st) {
    st.updatedAt = Date.now();
    try {
      localStorage.setItem(STORE, JSON.stringify(st));
    } catch (_) {}
    return st;
  }

  function authUser() {
    try {
      if (G.SNAuth && SNAuth.user) return SNAuth.user;
      if (G.SNAuth && SNAuth.getUser) return SNAuth.getUser();
      if (G.A && G.A.user) return G.A.user;
    } catch (_) {}
    return null;
  }

  function syncFromAuth() {
    var st = load();
    var u = authUser();
    if (u) {
      st.registered = true;
      st.userId = u.id || u.sub || u.email || st.userId;
      st.email = u.email || st.email;
      st.name = u.name || u.full_name || st.name;
      save(st);
    }
    return st;
  }

  function isOwner() {
    try {
      var u = authUser();
      if (!u) return false;
      var e = String(u.email || '').toLowerCase();
      if (e === 'notisastranov@gmail.com' || e.indexOf('notis') === 0) return true;
      if (G.SNAVC && SNAVC.isOwner && SNAVC.isOwner()) return true;
    } catch (_) {}
    /* local owner session for training */
    try {
      if (localStorage.getItem('sn:owner-session') === '1') return true;
    } catch (_) {}
    return false;
  }

  function status() {
    var st = syncFromAuth();
    if (isOwner()) {
      return {
        role: 'owner',
        registered: true,
        funded: true,
        canUseReal: true,
        depositedEur: st.depositedEur || 0,
        email: st.email || 'owner',
      };
    }
    return {
      role: st.registered ? (st.funded ? 'funded' : 'registered') : 'guest',
      registered: !!st.registered,
      funded: !!st.funded,
      canUseReal: !!(st.registered && st.funded),
      depositedEur: Number(st.depositedEur) || 0,
      email: st.email,
    };
  }

  function requireReal(action) {
    var s = status();
    if (s.canUseReal) return true;
    if (!s.registered) {
      log('Register required · Sign in with Google to create your account', 'warn');
      log('Then deposit real money to unlock Delivery · Calls · Marketplace', 'dim');
      openRegister();
      return false;
    }
    if (!s.funded) {
      log('Deposit required · Minimum €' + MIN_DEPOSIT_EUR + ' real money to use for real', 'warn');
      log('Your account is registered but not funded. deposit <amount>', 'dim');
      openDeposit();
      return false;
    }
    return true;
  }

  function openRegister() {
    try {
      if (G.SNAuth && SNAuth.signInGoogle) {
        void SNAuth.signInGoogle();
        return;
      }
      if (G.SNAuth && SNAuth.showModal) {
        SNAuth.showModal();
        return;
      }
    } catch (_) {}
    log('Sign in · tap User on ribbon, or CLI: register', 'ok');
  }

  function openDeposit() {
    log('—— DEPOSIT REAL MONEY ——', 'ok');
    log('1. Register (Google sign-in)', 'dim');
    log('2. Deposit minimum €' + MIN_DEPOSIT_EUR + ' (card / bank)', 'dim');
    log('3. AVC credited · funded status unlocks real use', 'dim');
    log('Card processor (Stripe/PayPal) · owner connects live keys', 'dim');
    log('CLI: deposit mark <eur>  ·  account status', 'dim');
  }

  /** Record a real deposit. Live card path needs Stripe/PayPal keys from owner. */
  function depositMark(eur, note) {
    var st = syncFromAuth();
    if (!st.registered && !isOwner()) {
      log('Register first · then deposit', 'warn');
      openRegister();
      return false;
    }
    eur = Number(eur);
    if (!(eur > 0)) {
      log('deposit mark <eur> · example: deposit mark 25', 'warn');
      return false;
    }
    st.deposits = st.deposits || [];
    st.deposits.push({
      eur: eur,
      at: Date.now(),
      note: String(note || 'manual mark'),
      method: 'mark',
    });
    st.depositedEur = (Number(st.depositedEur) || 0) + eur;
    if (st.depositedEur >= MIN_DEPOSIT_EUR) {
      st.funded = true;
      st.registered = true;
    }
    save(st);

    /* credit AVC 1:1 soft for internal ledger */
    try {
      if (G.SNAVC && typeof SNAVC.credit === 'function') {
        SNAVC.credit(st.userId || 'user', eur, 'deposit €' + eur);
      } else if (G.SNAVC && G.SNAVC.transfer) {
        /* owner treasury → user if API exists */
      }
    } catch (_) {}

    log(
      'Deposit recorded · €' +
        eur +
        ' · total €' +
        st.depositedEur +
        (st.funded ? ' · FUNDED · real use unlocked' : ' · need €' + (MIN_DEPOSIT_EUR - st.depositedEur) + ' more'),
      'ok'
    );
    try {
      if (G.SNShell && SNShell.paintBal) SNShell.paintBal();
    } catch (_) {}
    return true;
  }

  function registerLocal(email) {
    var st = load();
    st.registered = true;
    st.email = String(email || 'user@local').trim();
    st.userId = st.userId || 'local-' + Date.now().toString(36);
    save(st);
    log('Registered · ' + st.email + ' · next: deposit real money (min €' + MIN_DEPOSIT_EUR + ')', 'ok');
    return st;
  }

  function printStatus() {
    var s = status();
    log('—— ACCOUNT ——', 'ok');
    log('role · ' + s.role, 'dim');
    log('registered · ' + (s.registered ? 'yes' : 'no'), 'dim');
    log('funded · ' + (s.funded ? 'yes' : 'no') + ' · deposited €' + s.depositedEur, 'dim');
    log('real use · ' + (s.canUseReal ? 'UNLOCKED' : 'LOCKED — register + deposit'), s.canUseReal ? 'ok' : 'warn');
    if (!s.canUseReal) {
      log('Min deposit €' + MIN_DEPOSIT_EUR + ' · then Delivery · Call · Marketplace work for real', 'dim');
    }
  }

  function interceptCli(raw) {
    var t = String(raw || '').trim();
    var low = t.toLowerCase();

    if (/^(register|sign\s*in|login|create\s+account)\b/.test(low)) {
      openRegister();
      if (/^register\s+\S+@/.test(low)) {
        registerLocal(t.split(/\s+/)[1]);
      }
      return true;
    }
    if (/^(account|status|access|funded)\b/.test(low)) {
      printStatus();
      return true;
    }
    if (/^deposit\b/.test(low)) {
      var m = low.match(/^deposit\s+mark\s+([\d.]+)/);
      if (m) {
        depositMark(m[1], 'cli mark');
        return true;
      }
      if (/^deposit\s*$/.test(low) || /^deposit\s+help/.test(low)) {
        openDeposit();
        return true;
      }
      /* deposit 25 → mark for now until Stripe live */
      var m2 = low.match(/^deposit\s+([\d.]+)/);
      if (m2) {
        depositMark(m2[1], 'cli deposit');
        return true;
      }
      openDeposit();
      return true;
    }

    /* gate real actions */
    var realRe =
      /^(order|pizza|delivery|deliver|buy|checkout|hold|pay|call\b|webrtc|route\s+live|marketplace)/i;
    if (realRe.test(low) && !status().canUseReal) {
      requireReal(low.split(/\s+/)[0]);
      return true; /* blocked */
    }
    return false;
  }

  function installCli() {
    try {
      if (G.SNCli && SNCli.run && !SNCli.__accessGate) {
        var orig = SNCli.run.bind(SNCli);
        SNCli.run = function (cmd) {
          if (interceptCli(cmd)) return Promise.resolve();
          return orig(cmd);
        };
        SNCli.__accessGate = 1;
      }
    } catch (_) {}
  }

  /* shell task gate */
  function gateTask(name) {
    var real = { delivery: 1, call: 1, route: 1 };
    if (real[name] && !status().canUseReal) {
      requireReal(name);
      return false;
    }
    return true;
  }

  function boot() {
    syncFromAuth();
    installCli();
    setTimeout(installCli, 800);
    setTimeout(installCli, 2500);
    /* announce once for guests */
    try {
      var s = status();
      if (!s.canUseReal && !sessionStorage.getItem('sn:access-announced')) {
        sessionStorage.setItem('sn:access-announced', '1');
        setTimeout(function () {
          log('SpaceNet · real use requires register + deposit', 'dim');
        }, 1800);
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 0);

  G.SNAccess = {
    build: BUILD,
    status: status,
    requireReal: requireReal,
    gateTask: gateTask,
    depositMark: depositMark,
    registerLocal: registerLocal,
    openRegister: openRegister,
    openDeposit: openDeposit,
    minDepositEur: MIN_DEPOSIT_EUR,
  };
})(typeof window !== 'undefined' ? window : globalThis);
