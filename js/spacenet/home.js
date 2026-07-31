/* SNHome — ASTRANOV technical settings (hardcore only)
 * Device resource donation roles · version · hard reset.
 * No marketplace clutter. Ribbon menus only on ➕ and Layers.
 */
(function (global) {
  'use strict';

  var open = false;
  var SUPPORT_KEY = 'sn:support-v1';

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentRole() {
    try {
      if (global.SNResources && SNResources.getDeviceRole) return SNResources.getDeviceRole();
    } catch (_) {}
    try {
      return localStorage.getItem('sn:device-role-v1') || 'main';
    } catch (_) {
      return 'main';
    }
  }

  function roleCard(id, title, body, active) {
    return (
      '<button type="button" class="sn-home-role' +
      (active ? ' on' : '') +
      '" data-role-pick="' +
      esc(id) +
      '" aria-pressed="' +
      (active ? 'true' : 'false') +
      '">' +
      '<span class="sn-home-role-t">' +
      esc(title) +
      (active ? ' · ACTIVE' : '') +
      '</span>' +
      '<span class="sn-home-role-d">' +
      esc(body) +
      '</span>' +
      '</button>'
    );
  }

  function build() {
    var meta = document.querySelector('meta[name="astranov-build"]');
    var ver = (meta && meta.content) || 'dev';
    var role = currentRole();
    var rep = null;
    try {
      rep = global.SNResources && SNResources.report && SNResources.report();
    } catch (_) {}
    var statusLine = (rep && rep.line) || 'Resources offline until shell mine is ready';
    var rates = (rep && rep.rates) || {};

    return (
      '<div class="sn-home-card" role="dialog" aria-label="ASTRANOV technical settings">' +
      '<div class="sn-home-head">' +
      '<b>ASTRANOV · TECHNICAL</b>' +
      '<button type="button" class="sn-home-x" id="sn-home-close" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="sn-home-body">' +
      '<div class="sn-home-row sn-home-meta">' +
      '<span>Build</span><code id="sn-home-ver">' +
      esc(ver) +
      '</code></div>' +
      '<div class="sn-home-status">' +
      '<div class="sn-home-status-line">' +
      esc(statusLine) +
      '</div>' +
      '<div class="sn-home-status-sub">CPU ' +
      esc(rates.cpu != null ? rates.cpu : '—') +
      '% · RAM load units ' +
      esc(rates.ram != null ? rates.ram : '—') +
      ' · BW ' +
      esc(rates.bandwidth != null ? rates.bandwidth : '—') +
      '</div></div>' +
      '<div class="sn-home-section">Device resource donation</div>' +
      '<p class="sn-home-hint">Pick how this hardware donates spare capacity to the mesh. One role per device. Swap roles when you hot-swap machines.</p>' +
      roleCard(
        'main',
        'Main device',
        'Primary daily machine. Conservative harvest of spare CPU/RAM/bandwidth. Keeps the UI smooth. Mesh on, low thermal stress.',
        role === 'main'
      ) +
      roleCard(
        'secondary',
        'Secondary device',
        'Hot-swap / monitor unit. Low harvest to protect battery. Best when tab is idle or screen off. Ready for you to swap roles when this becomes main.',
        role === 'secondary'
      ) +
      roleCard(
        'raid',
        'RAID device',
        'Inexpensive array node for heavy harvest — always below TJ max (thermal junction ceiling ~92%). Mesh donate worker aggressive, never full throttle.',
        role === 'raid'
      ) +
      '<div class="sn-home-section">Mesh</div>' +
      '<button type="button" class="sn-home-btn" data-act="mine-on">Mine on · accept terms if needed</button>' +
      '<button type="button" class="sn-home-btn" data-act="mine-off">Mine off</button>' +
      '<button type="button" class="sn-home-btn" data-act="resources">Refresh resource status</button>' +
      '<div class="sn-home-section">Danger</div>' +
      '<button type="button" class="sn-home-btn danger" data-act="hard-reset">Hard reset this device</button>' +
      '<p class="sn-home-hint">Login / profile = ribbon 👤. Map tools = ➕ and Layers only. No junk menus here.</p>' +
      '</div></div>'
    );
  }

  function ensureCss() {
    if ($('sn-home-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-home-css';
    st.textContent =
      '#sn-home-menu{position:fixed;inset:0;z-index:95;display:none;align-items:flex-start;justify-content:center;' +
      'padding:56px 12px 24px;background:rgba(0,0,0,.55);pointer-events:auto}' +
      '#sn-home-menu.open{display:flex}' +
      '#sn-home-menu .sn-home-card{width:min(400px,100%);max-height:min(82vh,720px);overflow:auto;border-radius:12px;' +
      'background:#0c0c0e;border:1px solid #2a2a2e;box-shadow:0 12px 40px rgba(0,0,0,.75),0 0 24px rgba(217,70,239,.08);color:#e8e8ed}' +
      '#sn-home-menu .sn-home-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;' +
      'border-bottom:1px solid #2a2a2e;font:700 12px ui-monospace,monospace;letter-spacing:.06em;color:#d946ef}' +
      '#sn-home-menu .sn-home-x{border:0;background:transparent;color:#8b8b96;font-size:22px;cursor:pointer;line-height:1}' +
      '#sn-home-menu .sn-home-body{padding:10px 14px 18px}' +
      '#sn-home-menu .sn-home-row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font:12px ui-monospace,monospace}' +
      '#sn-home-menu .sn-home-row span{color:#5c5c66}' +
      '#sn-home-menu .sn-home-row code{color:#a78bfa;text-align:right}' +
      '#sn-home-menu .sn-home-status{margin:8px 0 12px;padding:10px;border-radius:8px;background:#161618;border:1px solid #2a2a2e}' +
      '#sn-home-menu .sn-home-status-line{font:600 12px/1.4 ui-monospace,monospace;color:#e8e8ed}' +
      '#sn-home-menu .sn-home-status-sub{font:11px ui-monospace,monospace;color:#8b8b96;margin-top:4px}' +
      '#sn-home-menu .sn-home-section{margin:14px 0 8px;font:700 10px ui-monospace,monospace;letter-spacing:.1em;color:#d946ef;text-transform:uppercase}' +
      '#sn-home-menu .sn-home-role{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;margin:0 0 8px;padding:12px;' +
      'border-radius:10px;cursor:pointer;text-align:left;border:1px solid #2a2a2e;background:#141416;color:#e8e8ed}' +
      '#sn-home-menu .sn-home-role:hover{border-color:rgba(217,70,239,.45)}' +
      '#sn-home-menu .sn-home-role.on{border-color:#d946ef;background:rgba(217,70,239,.1);box-shadow:0 0 16px rgba(217,70,239,.15)}' +
      '#sn-home-menu .sn-home-role-t{font:700 13px system-ui;color:#e8e8ed}' +
      '#sn-home-menu .sn-home-role-d{font:11px/1.4 system-ui;color:#8b8b96}' +
      '#sn-home-menu .sn-home-btn{display:block;width:100%;margin:6px 0;padding:10px 12px;border-radius:10px;' +
      'border:1px solid #2a2a2e;background:#1a1a1d;color:#e8e8ed;font:600 13px system-ui;cursor:pointer;text-align:left}' +
      '#sn-home-menu .sn-home-btn:hover{border-color:rgba(217,70,239,.4)}' +
      '#sn-home-menu .sn-home-btn.danger{border-color:rgba(248,113,113,.4);color:#f87171;background:rgba(80,20,28,.25)}' +
      '#sn-home-menu .sn-home-hint{font:11px/1.45 system-ui;color:#5c5c66;margin:8px 0 10px}';
    document.head.appendChild(st);
  }

  function ensure() {
    ensureCss();
    var el = $('sn-home-menu');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sn-home-menu';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el) close();
    });
    return el;
  }

  function bind(el) {
    var x = $('sn-home-close');
    if (x)
      x.onclick = function (e) {
        e.stopPropagation();
        close();
      };
    el.querySelectorAll('[data-role-pick]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-role-pick');
        try {
          if (global.SNResources && SNResources.setDeviceRole) {
            if (!global.SNResources.checkTerms || !global.SNResources.checkTerms()) {
              if (global.SNField && SNField.showTerms) SNField.showTerms();
            }
            global.SNResources.setDeviceRole(id);
            if (global.SNResources.setMining) global.SNResources.setMining(true);
            if (global.SNResources.setDonate) global.SNResources.setDonate(true);
          }
        } catch (err) {
          console.error('[SNHome] role', err);
        }
        paint();
      };
    });
    el.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        void act(btn.getAttribute('data-act'));
      };
    });
  }

  function paint() {
    var el = ensure();
    el.innerHTML = build();
    bind(el);
  }

  function openMenu() {
    var el = ensure();
    paint();
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    open = true;
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('home_tech_open', {});
    } catch (_) {}
  }

  function close() {
    open = false;
    var el = $('sn-home-menu');
    if (el) {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function toggle() {
    if (open) close();
    else openMenu();
  }

  function hardReset() {
    var ok = global.confirm(
      'Hard reset Astranov SpaceNet on this device?\n\nClears local profiles, cart, places, usage, device role, CLI position.\nDoes not sign you out of Google unless you sign out separately.'
    );
    if (!ok) return;
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf('sn:') === 0 || k.indexOf('astranov') === 0 || k.indexOf('spacenet') === 0))
          keys.push(k);
      }
      keys.forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (_) {}
    try {
      sessionStorage.clear();
    } catch (_) {}
    location.reload();
  }

  async function act(name) {
    if (name === 'mine-on') {
      try {
        if (global.SNResources && SNResources.setMining) {
          if (!global.SNResources.checkTerms || !global.SNResources.checkTerms()) {
            if (global.SNField && SNField.showTerms) SNField.showTerms();
          }
          global.SNResources.setMining(true);
          if (global.SNResources.setDonate) global.SNResources.setDonate(true);
        }
      } catch (_) {}
      paint();
      return;
    }
    if (name === 'mine-off') {
      try {
        if (global.SNResources && SNResources.setMining) global.SNResources.setMining(false);
      } catch (_) {}
      paint();
      return;
    }
    if (name === 'resources') {
      paint();
      return;
    }
    if (name === 'hard-reset') {
      hardReset();
      return;
    }
  }

  /** Ambassador support queue (kept for CLI commands · not in home UI) */
  function supportList() {
    try {
      var raw = JSON.parse(localStorage.getItem(SUPPORT_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  }

  function supportSave(list) {
    try {
      localStorage.setItem(SUPPORT_KEY, JSON.stringify(list.slice(-40)));
    } catch (_) {}
  }

  function supportRequest(text) {
    var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
    var row = {
      id: 'sup_' + Date.now().toString(36),
      text: String(text || '').slice(0, 280),
      from: (me && me.name) || 'User',
      fromId: (me && me.id) || null,
      t: Date.now(),
      status: 'open',
    };
    var list = supportList();
    list.unshift(row);
    supportSave(list);
    return row;
  }

  function supportClaim(id) {
    var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
    if (!me || !me.roles || !me.roles.ambassador) {
      return { ok: false, error: 'Enable Ambassador on profile tile' };
    }
    var list = supportList();
    var row = list.find(function (r) {
      return r.id === id || (!id && r.status === 'open');
    });
    if (!row) return { ok: false, error: 'no open support request' };
    row.status = 'helped';
    row.helperId = me.id;
    row.helper = me.name;
    row.helpedAt = Date.now();
    supportSave(list);
    var reward = 0.5;
    try {
      if (global.SNCurrency && SNCurrency.creditMined) SNCurrency.creditMined(reward);
      else if (global.SNCurrency && SNCurrency.credit) SNCurrency.credit(reward, 'ambassador support');
    } catch (_) {}
    return { ok: true, row: row, reward: reward };
  }

  function init() {
    if (init._done) return;
    init._done = true;
    var btn = $('btn-home');
    if (btn) {
      btn.onclick = function (e) {
        if (e) e.preventDefault();
        toggle();
      };
      btn.title = 'ASTRANOV · technical · device harvest roles';
      if (btn.textContent && /SpaceNet/i.test(btn.textContent)) btn.textContent = 'ASTRANOV';
    }
    var logo = $('astranov-logo');
    if (logo)
      logo.onclick = function () {
        toggle();
      };
  }

  global.SNHome = {
    init: init,
    open: openMenu,
    close: close,
    toggle: toggle,
    paint: paint,
    supportRequest: supportRequest,
    supportList: supportList,
    supportClaim: supportClaim,
    get openState() {
      return open;
    },
  };
})(window);
