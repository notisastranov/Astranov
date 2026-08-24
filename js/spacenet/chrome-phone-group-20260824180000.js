/* Astranov chrome-phone-group · Build 20260824180000-phone-group
 * Owner: Opera Android — dual CLI jumps in face, keyboard cheap, balance missing, buttons wrong.
 * Group style under the globe:
 *   TOP  = status only (radar · brand · balance) — no top CLI on phone
 *   BOTTOM = one dock (ribbon · log · single CLI)
 * Keyboard-safe. No autofocus. Balance always visible.
 */
(function (G) {
  'use strict';
  if (G.__snPhoneGroup20260824180000) return;
  G.__snPhoneGroup20260824180000 = 1;

  var BUILD = '20260824180000-phone-group';
  var GOOD = 'Command the HUD · delivery · call · research';

  function isPhone() {
    try {
      return (
        matchMedia('(pointer: coarse)').matches ||
        (navigator.maxTouchPoints || 0) > 0 ||
        /Android|iPhone|iPad|iPod|Mobile|Opera Mini|OPR\//i.test(navigator.userAgent || '')
      );
    } catch (_) {
      return true;
    }
  }

  function injectCss() {
    if (document.getElementById('sn-phone-group-css')) return;
    var s = document.createElement('style');
    s.id = 'sn-phone-group-css';
    s.textContent = [
      /* —— phone group layout —— */
      'body.sn-phone-group #stc-cmd{display:none!important}',
      'body.sn-phone-group #sn-topchrome-drag{display:none!important}',
      'body.sn-phone-group #sn-topchrome{padding:max(6px,env(safe-area-inset-top,0px)) 10px 0!important;z-index:95!important}',
      'body.sn-phone-group #sn-topchrome-panel{',
      '  width:min(100%,520px)!important;border-radius:18px!important;',
      '  background:rgba(2,8,24,0.78)!important;border:1px solid rgba(80,180,255,0.5)!important;',
      '  backdrop-filter:blur(16px) saturate(1.4)!important;-webkit-backdrop-filter:blur(16px) saturate(1.4)!important;',
      '  max-height:none!important;overflow:visible!important}',
      'body.sn-phone-group #stc-compact{',
      '  display:grid!important;grid-template-columns:40px 1fr auto!important;',
      '  align-items:center!important;gap:8px!important;padding:6px 12px!important;min-height:48px!important}',
      'body.sn-phone-group #field-radar{width:36px!important;height:36px!important;border-radius:50%!important}',
      'body.sn-phone-group #btn-home{',
      '  font:800 13px/1 Space Grotesk,system-ui,sans-serif!important;letter-spacing:0.22em!important;',
      '  color:#9ad4ff!important;text-align:center!important}',
      /* balance — never invisible */
      'body.sn-phone-group #field-balance-hud,body.sn-phone-group #fbh-s{',
      '  display:flex!important;align-items:center!important;justify-content:flex-end!important;',
      '  min-width:64px!important;visibility:visible!important;opacity:1!important}',
      'body.sn-phone-group #fbh-s{',
      '  font:700 14px/1.2 JetBrains Mono,ui-monospace,monospace!important;',
      '  color:#ffe566!important;text-shadow:0 0 10px rgba(255,200,40,0.55)!important;',
      '  white-space:nowrap!important;padding:4px 8px!important;',
      '  border-radius:10px!important;background:rgba(0,0,0,0.35)!important;',
      '  border:1px solid rgba(255,200,40,0.35)!important}',
      /* bottom dock — one group */
      'body.sn-phone-group #dock{',
      '  padding:0 8px max(8px,env(safe-area-inset-bottom,0px))!important;',
      '  bottom:var(--sn-kb,0px)!important;z-index:100!important;',
      '  transition:bottom 0.12s ease-out}',
      'body.sn-phone-group #panel{',
      '  width:min(100%,520px)!important;border-radius:20px 20px 16px 16px!important;',
      '  background:rgba(2,8,24,0.82)!important;border:1px solid rgba(80,180,255,0.55)!important;',
      '  backdrop-filter:blur(16px) saturate(1.4)!important;-webkit-backdrop-filter:blur(16px) saturate(1.4)!important;',
      '  min-height:0!important;overflow:visible!important}',
      'body.sn-phone-group #cli-drag{height:8px!important;min-height:8px!important}',
      'body.sn-phone-group #sn-task-ribbon{',
      '  display:flex!important;gap:8px!important;padding:6px 10px!important;height:48px!important;',
      '  overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;',
      '  justify-content:flex-start!important;align-items:center!important}',
      'body.sn-phone-group .sn-rib-btn{',
      '  width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;',
      '  border-radius:50%!important;border:1px solid rgba(100,190,255,0.55)!important;',
      '  background:rgba(0,16,48,0.55)!important;font-size:18px!important;',
      '  display:inline-flex!important;align-items:center!important;justify-content:center!important;',
      '  flex-shrink:0!important;touch-action:manipulation!important}',
      'body.sn-phone-group #cli-log{',
      '  max-height:22vh!important;overflow-y:auto!important;padding:2px 12px!important;',
      '  font:12px/1.35 JetBrains Mono,ui-monospace,monospace!important;color:#9ec9e8!important}',
      'body.sn-phone-group #cli-form{display:block!important;padding:4px 10px 10px!important;margin:0!important}',
      'body.sn-phone-group .sn-cli-field{',
      '  min-height:42px!important;border-radius:14px!important;',
      '  border:1px solid rgba(90,190,255,0.6)!important;background:rgba(0,12,36,0.45)!important}',
      'body.sn-phone-group #cli-in{',
      '  font:500 15px/1.3 system-ui,-apple-system,sans-serif!important;min-height:32px!important;',
      '  color:#f0f6ff!important}',
      /* keyboard: hide status, keep dock above kb */
      'body.sn-phone-group.sn-os-kb #sn-topchrome,body.sn-phone-group.sn-os-kb #sn-os-island{',
      '  opacity:0!important;pointer-events:none!important}',
      'body.sn-phone-group.sn-os-kb #dock{bottom:var(--sn-kb,0px)!important}',
      /* never let old mobile-alive force top CLI back */
      'body.sn-phone-group #stc-cmd{display:none!important}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function paintBalance() {
    try {
      var el = document.getElementById('fbh-s');
      if (!el) return;
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('color', '#ffe566', 'important');
      /* try live balance sources */
      var txt = null;
      try {
        if (G.SNCurrency && typeof SNCurrency.balance === 'function') txt = SNCurrency.balance();
        else if (G.SNCurrency && SNCurrency.bal != null) txt = SNCurrency.bal;
        else if (G.SNMoney && typeof SNMoney.balance === 'function') txt = SNMoney.balance();
      } catch (_) {}
      if (txt == null) {
        try {
          var raw = localStorage.getItem('sn:balance') || localStorage.getItem('sn:stars') || localStorage.getItem('sn:avc-notis');
          if (raw != null && raw !== '') txt = raw;
        } catch (_) {}
      }
      if (txt != null && String(txt).trim() !== '') {
        var n = Number(txt);
        if (!isNaN(n)) el.textContent = '⭐ ' + (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(2));
        else el.textContent = '⭐ ' + String(txt);
      } else if (!/⭐/.test(el.textContent || '')) {
        el.textContent = '⭐ 0.00';
      }
    } catch (_) {}
  }

  function applyGroup() {
    if (!isPhone()) return;
    document.body.classList.add('sn-phone-group', 'sn-phone-os');
    injectCss();

    /* kill top CLI on phone — one dock only */
    try {
      var stc = document.getElementById('stc-cmd');
      if (stc) {
        stc.style.setProperty('display', 'none', 'important');
        stc.setAttribute('aria-hidden', 'true');
      }
      var topIn = document.getElementById('stc-cmd-in');
      if (topIn) {
        topIn.blur();
        topIn.setAttribute('tabindex', '-1');
        topIn.setAttribute('readonly', 'readonly');
      }
    } catch (_) {}

    /* one bottom CLI — never autofocus */
    try {
      var bot = document.getElementById('cli-in');
      if (bot) {
        bot.placeholder = GOOD;
        bot.setAttribute('aria-label', GOOD);
        bot.setAttribute('enterkeyhint', 'go');
        bot.setAttribute('inputmode', 'search');
        bot.removeAttribute('autofocus');
        if (document.activeElement === bot) bot.blur();
      }
    } catch (_) {}

    /* ribbon touch targets */
    try {
      document.querySelectorAll('.sn-rib-btn').forEach(function (b) {
        b.style.setProperty('width', '40px', 'important');
        b.style.setProperty('height', '40px', 'important');
        b.style.setProperty('min-width', '40px', 'important');
      });
    } catch (_) {}

    paintBalance();
  }

  function preventAutofocus() {
    try {
      if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        if (isPhone()) document.activeElement.blur();
      }
    } catch (_) {}
  }

  function boot() {
    applyGroup();
    preventAutofocus();
    setTimeout(applyGroup, 200);
    setTimeout(applyGroup, 800);
    setTimeout(function () {
      applyGroup();
      preventAutofocus();
    }, 1600);
    setTimeout(paintBalance, 2500);
    setInterval(function () {
      if (!isPhone()) return;
      applyGroup();
      paintBalance();
    }, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 0);

  G.SNPhoneGroup = { build: BUILD, apply: applyGroup, paintBalance: paintBalance };
})(typeof window !== 'undefined' ? window : globalThis);
