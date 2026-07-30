/**
 * SNSuper — Architect / superuser live ops
 * Full fleet + every transaction when owner is signed in.
 * Finance still top-right S HUD; this is the command deck under radar burger / panel.
 */
(function (global) {
  'use strict';

  var ARCHITECT =
    (global.SN_CONFIG && SN_CONFIG.architectEmail) || 'notisastranov@gmail.com';
  var TX_KEY = 'sn:super-tx-v1';
  var txs = [];
  var panel = null;

  function loadTx() {
    try {
      var raw = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
      if (Array.isArray(raw)) txs = raw.slice(-200);
    } catch (e) {
      txs = [];
    }
  }

  function saveTx() {
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(txs.slice(-200)));
    } catch (e) {}
  }

  function isSuper() {
    try {
      if (localStorage.getItem('sn:super') === '1') return true;
      var u = global.SNAuth && SNAuth.user;
      var em = (u && u.email && String(u.email).toLowerCase()) || '';
      if (em === String(ARCHITECT).toLowerCase()) return true;
      if (u && u.user_metadata && u.user_metadata.is_owner) return true;
    } catch (e) {}
    return false;
  }

  function pushTx(row) {
    row = row || {};
    row.t = row.t || Date.now();
    row.iso = new Date(row.t).toISOString();
    txs.unshift(row);
    if (txs.length > 200) txs.length = 200;
    saveTx();
    paint();
    return row;
  }

  function ensureCss() {
    if (document.getElementById('sn-super-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-super-css';
    st.textContent = [
      '#sn-super-panel{position:fixed;bottom:12px;left:10px;z-index:138;width:min(360px,calc(100vw - 20px));',
      'max-height:min(42vh,360px);display:none;flex-direction:column;gap:4px;padding:10px;',
      'background:rgba(0,6,16,.96);border:1px solid rgba(255,214,51,.45);border-radius:14px;',
      'box-shadow:0 8px 32px rgba(0,0,0,.7);color:#e8f0ff;font:11px/1.35 system-ui}',
      '#sn-super-panel.open{display:flex}',
      '#sn-super-panel .sh{font:700 10px system-ui;letter-spacing:.1em;text-transform:uppercase;color:#ffd633}',
      '#sn-super-panel .sfleet{max-height:12vh;overflow:auto;border-top:1px solid rgba(255,214,51,.2);padding-top:4px}',
      '#sn-super-panel .stx{max-height:16vh;overflow:auto;border-top:1px solid rgba(255,214,51,.2);padding-top:4px}',
      '#sn-super-panel .row{padding:2px 0;color:#9ec8f0;border-bottom:1px solid rgba(26,111,212,.12)}',
      '#sn-super-panel .row.fee{color:#ffd633}',
      '#sn-super-panel .row.order{color:#a8f0c8}',
      '#sn-super-panel .row.drive{color:#ffcc88}',
      '#sn-super-panel button{margin-top:4px;padding:6px;border-radius:8px;border:1px solid rgba(255,214,51,.4);',
      'background:rgba(40,32,0,.6);color:#ffd633;cursor:pointer;font:700 11px system-ui}',
    ].join('');
    document.head.appendChild(st);
  }

  function ensurePanel() {
    ensureCss();
    panel = document.getElementById('sn-super-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'sn-super-panel';
    panel.innerHTML =
      '<div class="sh">SUPER · fleet + transactions</div>' +
      '<div id="sn-super-vault" class="row fee"></div>' +
      '<div class="sh" style="margin-top:4px">Fleet</div>' +
      '<div class="sfleet" id="sn-super-fleet"></div>' +
      '<div class="sh" style="margin-top:4px">TX tape</div>' +
      '<div class="stx" id="sn-super-tx"></div>' +
      '<button type="button" id="sn-super-hide">Hide deck</button>';
    document.body.appendChild(panel);
    var h = document.getElementById('sn-super-hide');
    if (h)
      h.onclick = function () {
        panel.classList.remove('open');
      };
    return panel;
  }

  function fleetRows() {
    var agents = (global.SNSim33 && SNSim33.agents) || [];
    if (!agents.length) return '<div class="row">No sim fleet · sim live</div>';
    return agents
      .map(function (a) {
        return (
          '<div class="row">' +
          (a.role || '?') +
          ' #' +
          a.i +
          ' · ' +
          (a.hub || '') +
          ' · acts ' +
          (a.acts || 0) +
          (a.shopName ? ' · ' + a.shopName : '') +
          '</div>'
        );
      })
      .join('');
  }

  function paint() {
    if (!isSuper()) {
      if (panel) panel.classList.remove('open');
      return;
    }
    ensurePanel();
    var vault = 0;
    try {
      vault = (global.SNCurrency && SNCurrency.platformFees && SNCurrency.platformFees()) || 0;
    } catch (e) {}
    var v = document.getElementById('sn-super-vault');
    if (v)
      v.textContent =
        '3% vault ' +
        (global.SNCurrency && SNCurrency.format
          ? SNCurrency.format(vault)
          : vault.toFixed(2) + ' S') +
        ' · wallet ' +
        (global.SNCurrency && SNCurrency.format
          ? SNCurrency.format(SNCurrency.balance())
          : '');
    var f = document.getElementById('sn-super-fleet');
    if (f) f.innerHTML = fleetRows();
    var t = document.getElementById('sn-super-tx');
    if (t) {
      t.innerHTML = txs
        .slice(0, 40)
        .map(function (r) {
          var cls =
            r.kind === 'platform_3pct'
              ? 'fee'
              : r.kind === 'order'
                ? 'order'
                : r.kind === 'drive'
                  ? 'drive'
                  : '';
          var line =
            (r.kind || 'tx') +
            (r.fee != null ? ' +' + Number(r.fee).toFixed(2) + 'S' : '') +
            (r.total != null ? ' total ' + Number(r.total).toFixed(2) : '') +
            (r.why ? ' · ' + String(r.why).slice(0, 40) : '') +
            (r.who ? ' · ' + r.who : '');
          return '<div class="row ' + cls + '">' + line + '</div>';
        })
        .join('');
    }
  }

  function show() {
    if (!isSuper()) {
      try {
        if (global.SNCli && SNCli.log)
          SNCli.log('Super deck · sign in as Architect or set sn:super=1', 'dim');
      } catch (e) {}
      return;
    }
    ensurePanel();
    panel.classList.add('open');
    paint();
  }

  function hide() {
    if (panel) panel.classList.remove('open');
  }

  loadTx();
  setInterval(function () {
    if (isSuper()) {
      paint();
      if (panel && !panel.classList.contains('open') && global.SNSim33 && SNSim33.running) {
        // auto-show deck when sim runs for superuser
        panel.classList.add('open');
      }
    }
  }, 3000);

  global.SNSuper = {
    isSuper: isSuper,
    pushTx: pushTx,
    show: show,
    hide: hide,
    paint: paint,
    get txs() {
      return txs.slice();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
