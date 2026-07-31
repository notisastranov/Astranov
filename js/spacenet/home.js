/* SNHome — Astranov SpaceNet home menu (SPECS home control)
 * Version · reload · hard reset · date/time · user · login · role toggles
 * Roles: vendor worker · delivery driver · ambassador (support → mine S)
 */
(function (global) {
  'use strict';

  var open = false;
  var clockTimer = null;
  var SUPPORT_KEY = 'sn:support-v1';

  function $(id) {
    return document.getElementById(id);
  }

  function build() {
    var meta = document.querySelector('meta[name="astranov-build"]');
    var ver = (meta && meta.content) || 'dev';
    var me = null;
    try {
      me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
    } catch (_) {}
    var auth = global.SNAuth && SNAuth.user;
    var name =
      (auth && (auth.user_metadata && auth.user_metadata.full_name)) ||
      (auth && auth.email && auth.email.split('@')[0]) ||
      (me && me.name) ||
      'Guest';
    var email = (auth && auth.email) || '—';
    var handle = (me && me.handle) || '—';
    var roles = (me && me.roles) || {};
    var bal =
      global.SNCurrency && SNCurrency.format
        ? SNCurrency.format(SNCurrency.balance())
        : '0.00 S';
    var now = new Date();
    var local = now.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    var athens = '';
    try {
      athens = now.toLocaleString('en-GB', {
        timeZone: 'Europe/Athens',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch (_) {
      athens = local;
    }

    return (
      '<div class="sn-home-card" role="dialog" aria-label="ASTRANOV menu">' +
      '<div class="sn-home-head">' +
      '<b>ASTRANOV</b>' +
      '<button type="button" class="sn-home-x" id="sn-home-close" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="sn-home-body">' +
      '<div class="sn-home-row sn-home-meta">' +
      '<span>Version</span><code id="sn-home-ver">' +
      esc(ver) +
      '</code></div>' +
      '<div class="sn-home-row sn-home-meta">' +
      '<span>Local</span><time id="sn-home-local">' +
      esc(local) +
      '</time></div>' +
      '<div class="sn-home-row sn-home-meta">' +
      '<span>Athens</span><time id="sn-home-athens">' +
      esc(athens) +
      '</time></div>' +
      '<div class="sn-home-user">' +
      '<div class="sn-home-user-name">' +
      esc(name) +
      '</div>' +
      '<div class="sn-home-user-sub">' +
      esc(handle) +
      ' · ' +
      esc(email) +
      '</div>' +
      '<div class="sn-home-user-sub">Wallet ' +
      esc(bal) +
      (roles.ambassador ? ' · 🎓 Ambassador' : '') +
      (roles.vendor ? ' · 🏪 Vendor worker' : '') +
      (roles.driver ? ' · 🛵 Driver' : '') +
      '</div></div>' +
      '<div class="sn-home-section">Roles</div>' +
      roleToggle('vendor', 'Vendor worker', 'List shop · menu · sell in S', !!roles.vendor) +
      roleToggle('driver', 'Delivery driver', 'Go online · claim · deliver', !!roles.driver) +
      roleToggle(
        'ambassador',
        'Ambassador',
        'Support other users · mine SpaceNets (S)',
        !!roles.ambassador
      ) +
      '<div class="sn-home-section">Session</div>' +
      '<button type="button" class="sn-home-btn" data-act="login" id="sn-home-login">' +
      (auth
        ? 'Sign out'
        : 'Sign in with Google · astranov.eu') +
      '</button>' +
      (auth
        ? ''
        : '<p class="sn-home-hint">You sign in to <b>Astranov SpaceNet</b> at <b>astranov.eu</b> — not a random cloud project name.</p>') +
      '<button type="button" class="sn-home-btn" data-act="earth">Back to Earth GLOBAL</button>' +
      '<button type="button" class="sn-home-btn" data-act="reload">Reload</button>' +
      '<button type="button" class="sn-home-btn danger" data-act="hard-reset">Hard reset</button>' +
      '<p class="sn-home-hint">Ambassador: help support requests → earn S. Type support list · support help &lt;text&gt;</p>' +
      '</div></div>'
    );
  }

  function roleToggle(id, title, desc, on) {
    return (
      '<label class="sn-home-toggle">' +
      '<div><b>' +
      esc(title) +
      '</b><span>' +
      esc(desc) +
      '</span></div>' +
      '<input type="checkbox" data-role="' +
      id +
      '"' +
      (on ? ' checked' : '') +
      ' />' +
      '</label>'
    );
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureCss() {
    if ($('sn-home-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-home-css';
    st.textContent =
      '#sn-home-menu{position:fixed;inset:0;z-index:95;display:none;align-items:flex-start;justify-content:center;' +
      'padding:56px 12px 24px;background:rgba(0,0,0,.45);pointer-events:auto}' +
      '#sn-home-menu.open{display:flex}' +
      '#sn-home-menu .sn-home-card{width:min(360px,100%);max-height:min(78vh,640px);overflow:auto;border-radius:14px;' +
      'background:rgba(0,10,24,.97);border:1px solid rgba(61,158,255,.45);box-shadow:0 12px 40px rgba(0,0,0,.65);color:#c8e4ff}' +
      '#sn-home-menu .sn-home-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;' +
      'border-bottom:1px solid rgba(26,111,212,.3);font:700 14px system-ui;color:#e8f4ff}' +
      '#sn-home-menu .sn-home-x{border:0;background:transparent;color:#9ec8ff;font-size:22px;cursor:pointer;line-height:1}' +
      '#sn-home-menu .sn-home-body{padding:10px 14px 16px}' +
      '#sn-home-menu .sn-home-row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font:12px ui-monospace,monospace}' +
      '#sn-home-menu .sn-home-row span{color:#6a8aaa}' +
      '#sn-home-menu .sn-home-row code,#sn-home-menu .sn-home-row time{color:#9ec8ff;text-align:right}' +
      '#sn-home-menu .sn-home-user{margin:10px 0;padding:10px;border-radius:10px;background:rgba(26,111,212,.12);border:1px solid rgba(61,158,255,.25)}' +
      '#sn-home-menu .sn-home-user-name{font:700 14px system-ui;color:#e8f4ff}' +
      '#sn-home-menu .sn-home-user-sub{font:11px system-ui;color:#8a9bb0;margin-top:3px}' +
      '#sn-home-menu .sn-home-section{margin:12px 0 6px;font:700 10px system-ui;letter-spacing:.08em;color:#4db8ff;text-transform:uppercase}' +
      '#sn-home-menu .sn-home-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;' +
      'border-bottom:1px solid rgba(26,111,212,.15);cursor:pointer}' +
      '#sn-home-menu .sn-home-toggle b{display:block;font:600 13px system-ui;color:#e8f4ff}' +
      '#sn-home-menu .sn-home-toggle span{display:block;font:11px system-ui;color:#6a8aaa;margin-top:2px}' +
      '#sn-home-menu .sn-home-toggle input{width:42px;height:24px;accent-color:#1a6fd4;flex-shrink:0}' +
      '#sn-home-menu .sn-home-btn{display:block;width:100%;margin:6px 0;padding:10px 12px;border-radius:10px;' +
      'border:1px solid rgba(61,158,255,.4);background:rgba(26,111,212,.2);color:#e8f4ff;font:600 13px system-ui;cursor:pointer;text-align:left}' +
      '#sn-home-menu .sn-home-btn:hover{border-color:#3d9eff}' +
      '#sn-home-menu .sn-home-btn.danger{border-color:rgba(255,107,122,.45);color:#ff9aa5;background:rgba(120,30,40,.2)}' +
      '#sn-home-menu .sn-home-hint{font:11px/1.4 system-ui;color:#5a6a7e;margin:10px 0 0}';
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

  function tickClock() {
    if (!open) return;
    var now = new Date();
    var loc = $('sn-home-local');
    var ath = $('sn-home-athens');
    if (loc)
      loc.textContent = now.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    if (ath) {
      try {
        ath.textContent = now.toLocaleString('en-GB', {
          timeZone: 'Europe/Athens',
          dateStyle: 'medium',
          timeStyle: 'medium',
        });
      } catch (_) {}
    }
  }

  function bind(el) {
    var x = $('sn-home-close');
    if (x) x.onclick = function (e) {
      e.stopPropagation();
      close();
    };
    el.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        void act(btn.getAttribute('data-act'));
      };
    });
    el.querySelectorAll('input[data-role]').forEach(function (inp) {
      inp.onchange = function () {
        var role = inp.getAttribute('data-role');
        try {
          var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
          if (me && global.SNProfiles.toggleRole) {
            global.SNProfiles.toggleRole(me.id, role, inp.checked);
            if (role === 'driver' && inp.checked) {
              me.driverOnline = true;
              global.SNProfiles.upsert(me);
            }
            if (role === 'ambassador' && inp.checked) {
              me.ambassadorOnline = true;
              global.SNProfiles.upsert(me);
              try {
                if (global.SNUsage && SNUsage.track)
                  SNUsage.track('ambassador_on', {});
              } catch (_) {}
            }
            if (global.SNCli && SNCli.log) {
              SNCli.log(
                'Role ' + role + ' · ' + (inp.checked ? 'ON' : 'off') + (role === 'ambassador' && inp.checked ? ' · support earns S' : ''),
                'ok'
              );
            }
          }
        } catch (err) {
          if (global.SNCli && SNCli.log) SNCli.log(String(err.message || err), 'err');
        }
        paint();
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
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tickClock, 1000);
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('home_menu_open', {});
    } catch (_) {}
  }

  function close() {
    open = false;
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
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
      'Hard reset Astranov SpaceNet on this device?\n\nClears local profiles, cart, places, usage, wizard, CLI position.\nDoes not sign you out of Google unless you choose sign out first.'
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
    if (name === 'login') {
      try {
        if (global.SNAuth && SNAuth.user) {
          await SNAuth.toggle();
        } else {
          var brand = (global.SN_CONFIG && SN_CONFIG.brand) || {};
          var ok = global.confirm(
            'Sign in to Astranov SpaceNet (astranov.eu)?\n\n' +
              'You are signing into the SpaceNet platform at astranov.eu — not a third-party cloud project name.\n\n' +
              'Brand: Astranov · AI: Astranov'
          );
          if (!ok) return;
          if (global.SNAuth && SNAuth.toggle) await SNAuth.toggle();
          else if (global.SNCli && SNCli.log) SNCli.log('Auth loading… try again', 'dim');
        }
      } catch (e) {
        if (global.SNCli && SNCli.log) SNCli.log(String(e.message || e), 'err');
      }
      paint();
      return;
    }
    if (name === 'reload') {
      location.reload();
      return;
    }
    if (name === 'hard-reset') {
      hardReset();
      return;
    }
    if (name === 'earth') {
      close();
      try {
        if (global.SNMap && SNMap.close) SNMap.close();
        if (global.SNTile && SNTile.close) SNTile.close();
        if (global.SNGlobe && SNGlobe.setBody) SNGlobe.setBody('earth');
        if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
      } catch (_) {}
      if (global.SNCli && SNCli.log) SNCli.log('Globe · GLOBAL Earth', 'ok');
      return;
    }
  }

  /** Ambassador support queue (local) — help others · earn S */
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
    try {
      if (global.SNUsage && SNUsage.track) SNUsage.track('support_request', { id: row.id });
    } catch (_) {}
    return row;
  }

  function supportClaim(id) {
    var me = global.SNProfiles && SNProfiles.me && SNProfiles.me();
    if (!me || !me.roles || !me.roles.ambassador) {
      return { ok: false, error: 'Enable Ambassador in Astranov SpaceNet menu' };
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
    // Earn SpaceNets (S) — product unit, not "coins"
    var reward = 0.5;
    try {
      if (global.SNCurrency && SNCurrency.creditMined) SNCurrency.creditMined(reward);
      else if (global.SNCurrency && SNCurrency.credit) SNCurrency.credit(reward, 'ambassador support');
    } catch (_) {}
    try {
      if (global.SNUsage && SNUsage.track)
        SNUsage.track('ambassador_help', { id: row.id, reward: reward });
      if (global.SNField && SNField.paint) SNField.paint();
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
      btn.title = 'ASTRANOV · menu · roles · account · Earth';
      if (btn.textContent && /SpaceNet/i.test(btn.textContent)) btn.textContent = 'ASTRANOV';
    }
    // Stop other handlers from only flying earth without menu
    var logo = $('astranov-logo');
    if (logo) logo.onclick = function () {
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
