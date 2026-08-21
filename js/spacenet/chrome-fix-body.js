/* Astranov chrome-fix body · Build 20260821185500-village-grok
 * Restore HUD law: 10px handles, no coach dump, 36px circle buttons, no wasted void.
 */
(function (global) {
  'use strict';
  var BUILD = '20260821185500-village-grok';
  var TOP_PH = 'Heads up display command line interface';
  var BOT_PH = 'command line interface';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      ':root { --sn-chrome-w: min(720px, calc(100vw - 24px)); }',
      '#sn-leftscroll, #sn-rightscroll, .sn-edgescroll,',
      '#sn-left-panel, #sn-right-panel, #sn-left-rail, #sn-right-rail,',
      '#sn-arch-layer, #sn-device-alert, #sn-silver-rive,',
      '#globe-deck, #aci-hud, #news-ticker, #astranov-logo {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',
      '#sn-topchrome {',
      '  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;',
      '  z-index: 95 !important; display: flex !important; justify-content: center !important;',
      '  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 0 !important;',
      '  pointer-events: none !important;',
      '}',
      '#sn-topchrome-panel {',
      '  pointer-events: auto !important; width: var(--sn-chrome-w) !important;',
      '  max-width: var(--sn-chrome-w) !important; margin: 0 auto !important;',
      '  background: rgba(0,0,0,0.78) !important; border: 1px solid rgba(20,195,243,0.38) !important;',
      '  border-radius: 24px !important; overflow: hidden !important;',
      '  backdrop-filter: blur(16px) !important;',
      '  min-height: 0 !important; height: auto !important;',
      '}',
      '#stc-compact { max-height: 56px !important; min-height: 52px !important; padding: 4px 10px !important; }',
      '#field-radar { width: 44px !important; height: 44px !important; }',
      '#sn-task-launch { width: 40px !important; height: 40px !important; }',
      '#stc-cmd, #cli-form { padding: 4px 10px 8px !important; margin: 0 !important; }',
      '#dock {',
      '  position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-end !important;',
      '  padding: 0 12px max(10px, env(safe-area-inset-bottom, 0px)) !important;',
      '  box-sizing: border-box !important; pointer-events: none !important; z-index: 100 !important;',
      '}',
      '#panel {',
      '  pointer-events: auto !important; position: relative !important;',
      '  width: var(--sn-chrome-w) !important; max-width: var(--sn-chrome-w) !important;',
      '  margin: 0 auto !important; box-sizing: border-box !important;',
      '  background: rgba(0,0,0,0.82) !important;',
      '  border: 1px solid rgba(20,195,243,0.42) !important;',
      '  border-radius: 22px !important;',
      '  display: grid !important;',
      '  grid-template-rows: 10px 44px 0 auto !important;',
      '  overflow: visible !important;',
      '  height: auto !important; min-height: 0 !important; max-height: none !important;',
      '}',
      '#panel.collapsed { grid-template-rows: 10px 44px 0 auto !important; overflow: visible !important; height: auto !important; min-height: 0 !important; }',
      '#cli-drag, #sn-topchrome-drag {',
      '  height: 10px !important; min-height: 10px !important; max-height: 10px !important;',
      '  padding: 0 !important; margin: 0 !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '}',
      '#cli-drag { grid-row: 1 !important; }',
      '#cli-drag::before, #sn-topchrome-drag::before {',
      '  content: "" !important; display: block !important;',
      '  width: 36px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(20,195,243,0.55) !important;',
      '}',
      '#cli-drag::after, #sn-topchrome-drag::after { content: none !important; display: none !important; }',
      /* coach dump — always gone, guest and signed-in */
      '#cli-coach { display: none !important; height: 0 !important; }',
      '#cli-drag { grid-row: 1 !important; }',
      '#sn-task-ribbon { grid-row: 2 !important; }',
      '#cli-log { grid-row: 3 !important; }',
      '#cli-form { grid-row: 4 !important; min-height: 48px !important; }',
      '#cli-log:empty { display: none !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }',
      '#sn-task-ribbon {',
      '  display: flex !important; align-items: center !important; justify-content: flex-start !important;',
      '  gap: 6px !important; padding: 4px 8px !important;',
      '  height: 44px !important; min-height: 44px !important; max-height: 44px !important;',
      '  overflow-x: auto !important; overflow-y: hidden !important;',
      '  -webkit-overflow-scrolling: touch !important;',
      '}',
      '#sn-task-ribbon .sn-rib-btn, #sn-task-ribbon button[data-act] {',
      '  flex: 0 0 36px !important; width: 36px !important; height: 36px !important;',
      '  min-width: 36px !important; max-width: 36px !important;',
      '  min-height: 36px !important; max-height: 36px !important;',
      '  padding: 0 !important; margin: 0 !important;',
      '  border-radius: 50% !important; overflow: hidden !important;',
      '  box-sizing: border-box !important;',
      '  display: inline-flex !important; align-items: center !important; justify-content: center !important;',
      '}',
      '#sn-task-ribbon .sn-rib-txt { display: none !important; }',
      '#sn-task-ribbon .sn-rib-tip {',
      '  display: none !important; position: absolute !important; bottom: 110% !important; left: 50% !important;',
      '  transform: translateX(-50%) !important; white-space: nowrap !important;',
      '  font: 600 10px/1.2 Inter,system-ui,sans-serif !important;',
      '  background: rgba(0,0,0,0.94) !important; color: #f4f6f8 !important;',
      '  border: 1px solid rgba(20,195,243,0.45) !important; border-radius: 8px !important;',
      '  padding: 4px 8px !important; z-index: 120 !important; pointer-events: none !important;',
      '}',
      '#sn-task-ribbon .sn-rib-btn:hover .sn-rib-tip,',
      '#sn-task-ribbon .sn-rib-btn:focus .sn-rib-tip { display: block !important; }',
      '#sn-task-ribbon .sn-rib-face, #sn-task-ribbon .sn-rib-icon img, #sn-rib-user img, #sn-task-ribbon img {',
      '  width: 28px !important; height: 28px !important; max-width: 28px !important; max-height: 28px !important;',
      '  border-radius: 50% !important; object-fit: cover !important;',
      '}',
      '#cli-in::placeholder, #stc-cmd-in::placeholder { color: #7a8a96 !important; opacity: 0.7 !important; }',
      '#cli-form { min-height: 48px !important; padding: 4px 10px 10px !important; }',
      'body:not(.sn-hud-live) #sn-topchrome, body:not(.sn-hud-live) #dock { opacity: 0 !important; }',
      'body.sn-hud-live #sn-topchrome, body.sn-hud-live #dock { opacity: 1 !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }

  function killCoach() {
    try {
      var c = document.getElementById('cli-coach');
      if (c && c.parentNode) c.parentNode.removeChild(c);
      var p = document.getElementById('cli-preview');
      if (p) { p.textContent = ''; p.style.display = 'none'; }
    } catch (_) {}
  }

  function stabilizePanels() {
    try {
      injectCss();
      killCoach();
      var panel = document.getElementById('panel');
      if (panel) {
        panel.style.setProperty('grid-template-rows', '10px 44px 0 auto', 'important');
        panel.style.setProperty('overflow', 'visible', 'important');
        panel.style.setProperty('min-height', '0', 'important');
        panel.style.setProperty('height', 'auto', 'important');
      }
      ['sn-topchrome-drag', 'cli-drag'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.setProperty('height', '10px', 'important');
        el.style.setProperty('min-height', '10px', 'important');
        el.style.setProperty('max-height', '10px', 'important');
      });
    } catch (_) {}
  }

  function enforceHudPlaceholder() {
    try {
      var top = document.getElementById('stc-cmd-in');
      var bot = document.getElementById('cli-in');
      if (top) {
        top.placeholder = TOP_PH;
        top.setAttribute('aria-label', TOP_PH);
      }
      if (bot) {
        bot.placeholder = BOT_PH;
        bot.setAttribute('aria-label', BOT_PH);
      }
    } catch (_) {}
  }

  function killInvented() {
    try {
      document.querySelectorAll('#sn-arch-layer, #sn-device-alert, #globe-deck, #aci-hud, #news-ticker, #astranov-logo').forEach(function (el) {
        try { el.remove(); } catch (_) {}
      });
    } catch (_) {}
  }

  function boot() {
    injectCss();
    stabilizePanels();
    killInvented();
    killCoach();
    enforceHudPlaceholder();
    setTimeout(function () {
      killInvented();
      killCoach();
      stabilizePanels();
      enforceHudPlaceholder();
    }, 800);
    setTimeout(function () {
      killCoach();
      stabilizePanels();
      enforceHudPlaceholder();
    }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);

  global.SNChromeFix = {
    build: BUILD,
    stabilizePanels: stabilizePanels,
    killInvented: killInvented,
    applyHud: function () { stabilizePanels(); enforceHudPlaceholder(); },
    enforceHudPlaceholder: enforceHudPlaceholder,
  };
})(typeof window !== 'undefined' ? window : globalThis);
