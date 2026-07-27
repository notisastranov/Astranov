/**
 * Field chrome — balance HUD (S), finance panel, miner terms
 * Non-overlapping reserved zones (SPECS A4).
 */
(function (global) {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function refreshBalance() {
    var C = global.SNCurrency;
    var W = global.SNWallet;
    var bal = W?.balance?.() || 0;
    var sEl = $('fbh-s');
    var eEl = $('fbh-eur');
    var uEl = $('fbh-usd');
    if (sEl) sEl.textContent = C ? C.format(bal) : bal.toFixed(2) + ' S';
    if (eEl && C) eEl.textContent = '~' + C.toFiat(bal, 'EUR').toFixed(2) + ' EUR';
    if (uEl && C) uEl.textContent = '~' + C.toFiat(bal, 'USD').toFixed(2) + ' USD';
    var rib = $('sn-ribbon-bal');
    if (rib) rib.textContent = C ? C.format(bal) : bal.toFixed(2) + ' S';
  }

  function refreshMine() {
    var R = global.SNResources;
    if (!R) return;
    var rate = $('fbh-mine-rate');
    var earned = $('fbh-mine-earned');
    var status = $('fbh-mine-status');
    var cpu = $('fbh-cpu');
    var ram = $('fbh-ram');
    var sto = $('fbh-storage');
    var bw = $('fbh-bw');
    var rates = R.rates || {};
    if (rate) rate.textContent = (R.rateSPerH || 0).toFixed(3) + ' S/h';
    if (earned) earned.textContent = '+' + (R.sessionMined || 0).toFixed(3) + ' S';
    if (cpu) cpu.textContent = rates.cpu ? rates.cpu + '%' : '—';
    if (ram) ram.textContent = rates.ram ? rates.ram + 'MB' : '—';
    if (sto) sto.textContent = rates.storage ? rates.storage + 'MB' : '—';
    if (bw) bw.textContent = rates.bandwidth ? rates.bandwidth + 'kb/s' : '—';
    if (status) {
      if (!R.checkTerms?.()) {
        status.textContent = 'terms required';
        status.className = 'fbh-status';
      } else if (R.mining) {
        status.textContent = 'mesh mining S';
        status.className = 'fbh-status active';
      } else {
        status.textContent = 'mine standby';
        status.className = 'fbh-status';
      }
    }
    var hud = $('field-balance-hud');
    if (hud) hud.classList.toggle('mining-active', !!R.mining);
  }

  function refreshPerf() {
    var R = global.SNResources?.report?.();
    var el = $('fbh-perf');
    if (el && R) {
      el.textContent =
        'FPS ' + (R.fps || '—') + ' · spare ' + (R.spareScore || 0) + '%' + (R.donating ? ' · ♻' : '');
    }
  }

  function showTerms() {
    var m = $('sn-miner-terms');
    if (m) m.hidden = false;
  }

  function openFinance() {
    var p = $('spacenet-finance-panel');
    if (!p) return;
    p.hidden = false;
    paintFinance('stats');
    global.SNRibbon?.setTask?.('money');
  }

  function closeFinance() {
    var p = $('spacenet-finance-panel');
    if (p) p.hidden = true;
  }

  function paintFinance(tab) {
    var body = $('sfp-body');
    if (!body) return;
    var C = global.SNCurrency;
    var W = global.SNWallet;
    var R = global.SNResources;
    var snap = W?.snapshot?.() || { balance: 0, mined: 0, platformFees: 0 };
    tab = tab || 'stats';
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === tab);
    });
    if (tab === 'stats') {
      body.innerHTML =
        '<div class="sfp-line"><b>Balance</b> ' +
        (C ? C.format(snap.balance) : snap.balance) +
        '</div>' +
        '<div class="sfp-line"><b>Mined</b> ' +
        (C ? C.format(snap.mined) : snap.mined) +
        '</div>' +
        '<div class="sfp-line"><b>Network index</b> ' +
        (C?.networkIndex?.()?.toFixed?.(4) || '—') +
        '</div>' +
        '<div class="sfp-line dim">S primary · EUR/USD/BTC secondary quotes only</div>';
    } else if (tab === 'mining') {
      var r = R?.report?.() || {};
      body.innerHTML =
        '<div class="sfp-line"><b>Rate</b> ' +
        (r.rateSPerH || 0).toFixed(3) +
        ' S/h</div>' +
        '<div class="sfp-line"><b>Session</b> ' +
        (C ? C.format(r.sessionMined || 0) : r.sessionMined) +
        '</div>' +
        '<div class="sfp-line"><b>FPS</b> ' +
        (r.fps || '—') +
        ' · spare ' +
        (r.spareScore || 0) +
        '%</div>' +
        '<div class="sfp-actions">' +
        '<button type="button" data-cmd="mine on">Mine on</button>' +
        '<button type="button" data-cmd="mine off">Mine off</button>' +
        '<button type="button" data-cmd="donate on">Donate on</button>' +
        '<button type="button" data-cmd="donate off">Donate off</button>' +
        '</div>';
    } else if (tab === 'platform') {
      body.innerHTML =
        '<div class="sfp-line"><b>Platform fee</b> 3% of S on transactions</div>' +
        '<div class="sfp-line"><b>Driver share</b> 15% of gross goods in S</div>' +
        '<div class="sfp-line"><b>Accrued platform</b> ' +
        (C ? C.format(snap.platformFees) : snap.platformFees) +
        '</div>' +
        '<div class="sfp-line dim">Invoices denominated in S (SpaceNets)</div>';
    } else if (tab === 'p2p') {
      body.innerHTML =
        '<div class="sfp-line"><b>P2P ledger</b> client→vendor · vendor→driver · client→driver</div>' +
        '<div class="sfp-line dim">All transfers in S · secondary fiat quotes optional</div>' +
        '<div class="sfp-line"><b>Wallet</b> ' +
        (C ? C.format(snap.balance) : snap.balance) +
        '</div>';
    } else {
      body.innerHTML =
        '<div class="sfp-line">Reports · type / role / month (coming full export)</div>' +
        '<div class="sfp-line dim">CLI: resources · rate · wallet · finance</div>';
    }
    body.querySelectorAll('[data-cmd]').forEach(function (b) {
      b.addEventListener('click', function () {
        global.SNCli?.run?.(b.getAttribute('data-cmd'));
        paintFinance(tab);
      });
    });
  }

  function init() {
    if (init._done) return;
    init._done = true;
    refreshBalance();
    refreshMine();
    refreshPerf();

    $('field-balance-hud')?.addEventListener('click', openFinance);
    $('field-balance-hud')?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFinance();
      }
    });
    $('sfp-close')?.addEventListener('click', closeFinance);
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        paintFinance(t.getAttribute('data-tab'));
      });
    });
    $('sn-miner-accept')?.addEventListener('click', function () {
      global.SNResources?.acceptTerms?.();
      refreshMine();
    });

    if (!global.SNResources?.checkTerms?.()) {
      // soft: do not force modal on boot; finance/mine will open it
    }
  }

  global.SNField = {
    init: init,
    refreshBalance: refreshBalance,
    refreshMine: refreshMine,
    refreshPerf: refreshPerf,
    openFinance: openFinance,
    closeFinance: closeFinance,
    showTerms: showTerms,
  };
})(typeof window !== 'undefined' ? window : globalThis);
