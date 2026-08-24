/* Astranov chrome-mobile-alive · Build 20260824174000-chrome-alive
 * P0: Chrome Android felt dead — chrome panels missing/collapsed, wrong HUD
 * placeholders, bridge spam. This module forces:
 *  1. Correct HUD placeholders (never "Heads up display command line interface")
 *  2. Top + bottom chrome always visible and usable on mobile
 *  3. Clears any value that looks like the old bad placeholder
 *  4. Safe-area + min-heights so the dock does not vanish under browser chrome
 */
(function (G) {
  'use strict';
  if (G.__snMobileAlive20260824174000) return;
  G.__snMobileAlive20260824174000 = 1;

  var BUILD = '20260824174000-chrome-alive';
  var GOOD = 'Command the HUD · show, hide, or reshape';
  var BAD_RE = /heads\s*up\s*display|command\s*line\s*interface/i;

  function forcePlaceholder(el) {
    if (!el) return;
    try {
      el.placeholder = GOOD;
      el.setAttribute('aria-label', GOOD);
      el.setAttribute('placeholder', GOOD);
      var v = String(el.value || '');
      if (BAD_RE.test(v) || v === 'Heads up display command line interface' || v === 'command line interface') {
        el.value = '';
      }
    } catch (_) {}
  }

  function enforceHud() {
    try {
      forcePlaceholder(document.getElementById('stc-cmd-in'));
      forcePlaceholder(document.getElementById('cli-in'));
      var all = document.querySelectorAll('input[placeholder], input[aria-label]');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var ph = String(el.placeholder || el.getAttribute('placeholder') || '');
        var al = String(el.getAttribute('aria-label') || '');
        if (BAD_RE.test(ph) || BAD_RE.test(al)) forcePlaceholder(el);
      }
    } catch (_) {}
  }

  function forceChromePaint() {
    try {
      var top = document.getElementById('sn-topchrome');
      var topPanel = document.getElementById('sn-topchrome-panel');
      var dock = document.getElementById('dock');
      var panel = document.getElementById('panel');
      var stc = document.getElementById('stc-cmd');
      var form = document.getElementById('cli-form');

      if (top) {
        top.style.setProperty('display', 'flex', 'important');
        top.style.setProperty('visibility', 'visible', 'important');
        top.style.setProperty('opacity', '1', 'important');
        top.style.setProperty('z-index', '95', 'important');
        top.style.setProperty('pointer-events', 'none', 'important');
      }
      if (topPanel) {
        topPanel.style.setProperty('display', 'block', 'important');
        topPanel.style.setProperty('visibility', 'visible', 'important');
        topPanel.style.setProperty('opacity', '1', 'important');
        topPanel.style.setProperty('pointer-events', 'auto', 'important');
        topPanel.style.setProperty('max-height', 'none', 'important');
      }
      if (dock) {
        dock.style.setProperty('display', 'flex', 'important');
        dock.style.setProperty('visibility', 'visible', 'important');
        dock.style.setProperty('opacity', '1', 'important');
        dock.style.setProperty('z-index', '100', 'important');
        dock.style.setProperty('pointer-events', 'none', 'important');
        dock.style.setProperty('padding-bottom', 'max(10px, env(safe-area-inset-bottom, 0px))', 'important');
      }
      if (panel) {
        panel.style.setProperty('display', 'block', 'important');
        panel.style.setProperty('visibility', 'visible', 'important');
        panel.style.setProperty('opacity', '1', 'important');
        panel.style.setProperty('pointer-events', 'auto', 'important');
        panel.style.setProperty('min-height', '88px', 'important');
        panel.style.setProperty('height', 'auto', 'important');
        panel.classList.remove('collapsed');
      }
      if (stc) {
        stc.style.setProperty('display', 'block', 'important');
        stc.style.setProperty('visibility', 'visible', 'important');
        stc.style.setProperty('min-height', '40px', 'important');
      }
      if (form) {
        form.style.setProperty('display', 'block', 'important');
        form.style.setProperty('visibility', 'visible', 'important');
        form.style.setProperty('min-height', '40px', 'important');
      }
      ['sn-topchrome-drag', 'cli-drag'].forEach(function (id) {
        var h = document.getElementById(id);
        if (!h) return;
        h.style.setProperty('height', '10px', 'important');
        h.style.setProperty('min-height', '10px', 'important');
        h.style.setProperty('display', 'block', 'important');
      });
    } catch (_) {}
  }

  function injectCss() {
    if (document.getElementById('sn-mobile-alive-css')) return;
    try {
      var s = document.createElement('style');
      s.id = 'sn-mobile-alive-css';
      s.textContent = [
        '#sn-topchrome,#dock{display:flex!important;visibility:visible!important;opacity:1!important}',
        '#sn-topchrome-panel,#panel{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
        '#stc-cmd,#cli-form{display:block!important;visibility:visible!important;min-height:40px!important}',
        '#cli-in,#stc-cmd-in{font-size:14px!important;min-height:28px!important}',
        '#dock{padding-bottom:max(10px,env(safe-area-inset-bottom,0px))!important;z-index:100!important}',
        '#sn-topchrome{z-index:95!important}',
        '@media (max-height:760px){#stc-cmd{display:block!important}}',
        'body.sn-phone-os #panel{min-height:96px!important}',
      ].join('\n');
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function tick() {
    injectCss();
    forceChromePaint();
    enforceHud();
  }

  function boot() {
    tick();
    setTimeout(tick, 200);
    setTimeout(tick, 800);
    setTimeout(tick, 1800);
    setTimeout(tick, 3500);
    setInterval(tick, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 0);

  G.SNMobileAlive = { build: BUILD, enforceHud: enforceHud, forceChromePaint: forceChromePaint };
})(typeof window !== 'undefined' ? window : globalThis);
