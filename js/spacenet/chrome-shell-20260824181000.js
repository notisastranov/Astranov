/* Astranov chrome-shell · Build 20260824181000 + access gate
 * Phone shell: status island + single dock. Access law: real tasks need funded account.
 */
(function (G) {
  'use strict';
  if (G.__snShell20260824181000) return;
  G.__snShell20260824181000 = 1;

  var BUILD = '20260824181000-shell';
  var GOOD = 'delivery · call · research';

  function phone() {
    try {
      return (
        matchMedia('(pointer: coarse)').matches ||
        (navigator.maxTouchPoints || 0) > 0 ||
        /Android|iPhone|iPad|iPod|Mobile|OPR\/|Opera/i.test(navigator.userAgent || '')
      );
    } catch (_) {
      return true;
    }
  }

  function css() {
    if (document.getElementById('sn-shell-css')) return;
    var s = document.createElement('style');
    s.id = 'sn-shell-css';
    s.textContent = [
      'body.sn-shell #sn-topchrome,body.sn-shell #dock{display:none!important}',
      'body.sn-shell #sn-os-island,body.sn-shell #sn-os-home{display:none!important}',
      '#sn-shell-status{position:fixed;top:max(10px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);',
      'z-index:120;display:flex;align-items:center;gap:12px;height:36px;padding:0 14px;border-radius:999px;',
      'background:rgba(2,8,22,0.82);border:1px solid rgba(90,180,255,0.45);',
      'backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);',
      'pointer-events:auto;box-shadow:0 0 20px rgba(20,120,255,0.2)}',
      '#sn-shell-status .brand{font:800 12px/1 Space Grotesk,system-ui,sans-serif;letter-spacing:0.2em;color:#8ecfff}',
      '#sn-shell-bal{font:700 13px/1 JetBrains Mono,ui-monospace,monospace;color:#ffe566;',
      'text-shadow:0 0 12px rgba(255,200,40,0.5);white-space:nowrap;padding:3px 8px;border-radius:8px;',
      'background:rgba(0,0,0,0.35);border:1px solid rgba(255,200,40,0.35)}',
      '#sn-shell-dock{position:fixed;left:0;right:0;bottom:0;z-index:120;display:flex;justify-content:center;',
      'padding:0 10px max(10px,env(safe-area-inset-bottom,0px));pointer-events:none;',
      'bottom:var(--sn-kb,0px);transition:bottom 0.12s ease-out}',
      '#sn-shell-panel{pointer-events:auto;width:min(100%,420px);border-radius:22px 22px 18px 18px;',
      'background:rgba(2,8,22,0.88);border:1px solid rgba(80,180,255,0.5);',
      'backdrop-filter:blur(18px) saturate(1.5);-webkit-backdrop-filter:blur(18px) saturate(1.5);',
      'box-shadow:0 -4px 40px rgba(0,40,120,0.35);padding:10px 12px 12px}',
      '#sn-shell-tasks{display:flex;gap:6px;justify-content:space-between;margin-bottom:10px}',
      '.sn-shell-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;',
      'border:0;border-radius:14px;background:rgba(0,20,50,0.45);color:#cfe9ff;',
      'font:600 9px/1 system-ui,sans-serif;letter-spacing:0.04em;touch-action:manipulation;',
      'min-height:52px;cursor:pointer}',
      '.sn-shell-btn:active{background:rgba(30,100,220,0.35)}',
      '.sn-shell-btn .ico{font-size:20px;line-height:1}',
      '#sn-shell-form{display:flex;align-items:center;gap:8px;padding:0 12px;min-height:44px;',
      'border:1px solid rgba(90,180,255,0.55);border-radius:14px;background:rgba(0,12,36,0.5)}',
      '#sn-shell-in{flex:1;background:0;border:0;outline:0;color:#f0f6ff;font:500 15px/1.3 system-ui,sans-serif;',
      'min-height:32px}',
      '#sn-shell-go{width:36px;height:36px;border-radius:50%;border:0;background:rgba(30,120,255,0.35);',
      'color:#fff;font-size:16px;touch-action:manipulation}',
      'body.sn-os-kb #sn-shell-status{opacity:0;pointer-events:none}',
      'body:not(.sn-shell) #sn-shell-status,body:not(.sn-shell) #sn-shell-dock{display:none!important}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function balanceText() {
    var n = null;
    try {
      if (G.SNAVC && typeof SNAVC.balance === 'function') n = SNAVC.balance('notis');
      else if (G.SNAVC && G.SNAVC.treasury != null) n = G.SNAVC.treasury;
    } catch (_) {}
    if (n == null) {
      try {
        var raw = localStorage.getItem('sn:avc-ledger-v1');
        if (raw) {
          var j = JSON.parse(raw);
          if (j && j.accounts && j.accounts.notis != null) {
            n = typeof j.accounts.notis === 'object' ? j.accounts.notis.balance : j.accounts.notis;
          }
        }
      } catch (_) {}
    }
    if (n == null) n = 0;
    var num = Number(n) || 0;
    if (num >= 1e6) return '⭐ ' + (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return '⭐ ' + Math.round(num).toLocaleString();
    return '⭐ ' + num.toFixed(2);
  }

  function paintBal() {
    var el = document.getElementById('sn-shell-bal');
    if (el) el.textContent = balanceText();
  }

  function run(cmd) {
    cmd = String(cmd || '').trim();
    if (!cmd) return;
    try {
      if (G.SNCli && SNCli.run) void SNCli.run(cmd);
      else if (G.SNCli && SNCli.submit) void SNCli.submit(cmd);
    } catch (e) {
      try {
        console.warn('[shell]', e);
      } catch (_) {}
    }
  }

  function task(name) {
    /* ACCESS LAW: real tasks need register + deposit */
    try {
      if (G.SNAccess && SNAccess.gateTask && !SNAccess.gateTask(name)) return;
    } catch (_) {}
    var map = {
      delivery: 'order me a pizza',
      call: 'call',
      research: 'what is SpaceNet',
      route: 'show route',
      locate: 'locate',
      mic: 'listen',
    };
    run(map[name] || name);
  }

  function build() {
    if (!phone()) return;
    document.body.classList.add('sn-shell', 'sn-phone-os');
    css();

    if (!document.getElementById('sn-shell-status')) {
      var st = document.createElement('div');
      st.id = 'sn-shell-status';
      st.innerHTML =
        '<span class="brand">SPACENET</span>' +
        '<span id="sn-shell-bal">⭐ …</span>';
      document.body.appendChild(st);
    }

    if (!document.getElementById('sn-shell-dock')) {
      var dock = document.createElement('div');
      dock.id = 'sn-shell-dock';
      dock.innerHTML =
        '<div id="sn-shell-panel">' +
        '<div id="sn-shell-tasks">' +
        '<button type="button" class="sn-shell-btn" data-t="delivery"><span class="ico">📦</span>Delivery</button>' +
        '<button type="button" class="sn-shell-btn" data-t="call"><span class="ico">📞</span>Call</button>' +
        '<button type="button" class="sn-shell-btn" data-t="research"><span class="ico">🔬</span>Research</button>' +
        '<button type="button" class="sn-shell-btn" data-t="route"><span class="ico">🛤️</span>Route</button>' +
        '<button type="button" class="sn-shell-btn" data-t="locate"><span class="ico">📍</span>Locate</button>' +
        '<button type="button" class="sn-shell-btn" data-t="mic"><span class="ico">🎤</span>Talk</button>' +
        '</div>' +
        '<form id="sn-shell-form" action="javascript:void(0)">' +
        '<input id="sn-shell-in" type="text" enterkeyhint="go" inputmode="search" autocomplete="off" ' +
        'autocapitalize="off" autocorrect="off" placeholder="' +
        GOOD +
        '" />' +
        '<button type="submit" id="sn-shell-go" aria-label="Go">↑</button>' +
        '</form></div>';
      document.body.appendChild(dock);

      dock.querySelectorAll('.sn-shell-btn').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          task(b.getAttribute('data-t'));
        });
      });

      var form = document.getElementById('sn-shell-form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = document.getElementById('sn-shell-in');
        var v = (inp && inp.value) || '';
        if (inp) inp.value = '';
        run(v);
        try {
          if (inp) inp.blur();
        } catch (_) {}
      });
    }

    paintBal();
    try {
      var inp = document.getElementById('sn-shell-in');
      if (inp && document.activeElement === inp) inp.blur();
    } catch (_) {}
  }

  function boot() {
    build();
    setTimeout(build, 300);
    setTimeout(paintBal, 800);
    setTimeout(paintBal, 2000);
    setInterval(paintBal, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 0);

  G.SNShell = { build: BUILD, paintBal: paintBal, run: run, task: task };
})(typeof window !== 'undefined' ? window : globalThis);
