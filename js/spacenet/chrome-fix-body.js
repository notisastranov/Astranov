/* Astranov chrome-fix body · Build 20260820220000-hud-law
 * 10px handles, no GADGETS text, HUD placeholder law only.
 */
(function (global) {
  'use strict';
  var BUILD = '20260820220000-hud-law';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      ':root { --sn-chrome-w: min(720px, calc(100vw - 24px)); --top-scroll-min: 0px; --bottom-scroll-min: 0px; }',
      '#sn-leftscroll, #sn-rightscroll, .sn-edgescroll,',
      '#sn-left-panel, #sn-right-panel, #sn-left-rail, #sn-right-rail,',
      '#sn-arch-layer, #sn-device-alert, #sn-silver-rive,',
      '#globe-deck, #aci-hud, #news-ticker, #astranov-logo {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',
      'body.city-map-on #globe, #globe.city-hidden {',
      '  visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;',
      '}',
      '#city-map.active, body.city-map-on #city-map {',
      '  display: block !important; visibility: visible !important; opacity: 1 !important;',
      '  position: fixed !important; inset: 0 !important; z-index: 40 !important;',
      '  pointer-events: auto !important;',
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
      '  background: rgba(4,16,42,0.78) !important; border: 1px solid rgba(50,140,255,0.42) !important;',
      '  border-radius: 24px !important; overflow: hidden !important;',
      '  backdrop-filter: blur(16px) !important;',
      '}',
      '#sn-topchrome-panel.collapsed { max-height: none !important; min-height: 0 !important; height: auto !important; }',
      'body.sn-guest #stc-cmd { display: flex !important; visibility: visible !important; }',
      'body.sn-guest #sn-helper-canvas, body.sn-guest #sn-helper-hit { visibility: visible !important; }',
      'body.sn-guest #sn-topchrome-panel { min-height: 0 !important; }',
      'body.sn-guest #vault, body.sn-guest #sn-vault, body.sn-guest .sn-vault, body.sn-guest #stc-money { opacity: 0.35 !important; }',
      '#stc-compact { max-height: 78px !important; padding: 6px 12px 4px !important; }',
      '#field-radar {',
      '  visibility: visible !important; opacity: 1 !important;',
      '  background: radial-gradient(circle at 40% 35%, rgba(61,158,255,0.28), #04101c) !important;',
      '}',
      '#dock {',
      '  position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-end !important;',
      '  padding: 0 12px max(14px, env(safe-area-inset-bottom, 0px)) !important;',
      '  box-sizing: border-box !important; pointer-events: none !important; z-index: 100 !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      'body.sn-quiet #dock, body.sn-quiet #panel, body.sn-quiet #sn-task-ribbon {',
      '  display: flex !important; visibility: visible !important; pointer-events: auto !important;',
      '}',
      '#panel {',
      '  pointer-events: auto !important; position: relative !important;',
      '  left: auto !important; right: auto !important; top: auto !important; bottom: auto !important; transform: none !important;',
      '  width: var(--sn-chrome-w) !important; max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important; margin: 0 auto !important; flex: 0 1 auto !important;',
      '  box-sizing: border-box !important;',
      '  background: rgba(0, 4, 14, 0.78) !important;',
      '  backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  border: 1px solid rgba(20, 195, 243, 0.42) !important;',
      '  border-radius: 22px !important;',
      '  box-shadow: 0 -8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(20,195,243,0.2), inset 0 0 0 1px rgba(160,220,255,0.08) !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '  grid-template-rows: 10px 48px auto minmax(0, auto) auto !important;',
      '}',
      '#cli-drag, #sn-topchrome-drag {',
      '  height: 10px !important; min-height: 10px !important; max-height: 10px !important;',
      '  padding: 0 !important; margin: 0 !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  gap: 0 !important;',
      '}',
      '#cli-drag { grid-row: 1 !important; }',
      '#cli-drag::before, #sn-topchrome-drag::before {',
      '  content: "" !important; display: block !important;',
      '  width: 36px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(20,195,243,0.55) !important;',
      '}',
      '#cli-drag::after, #sn-topchrome-drag::after, body.spacexai #sn-topchrome-drag::after,',
      'body.spacexai #sn-topchrome-panel.expanded #sn-topchrome-drag::after,',
      'body.spacexai #sn-topchrome-panel.mid #sn-topchrome-drag::after {',
      '  content: none !important; display: none !important;',
      '}',
      '#panel.collapsed { grid-template-rows: 10px 48px auto 0 auto !important; overflow: visible !important; padding-bottom: 0 !important; height: auto !important; min-height: 0 !important; max-height: none !important; }',
      '#cli-in::placeholder, #stc-cmd-in::placeholder { color: #6a8ab8 !important; opacity: 0.7 !important; }',
      'body.sn-in #cli-coach { display: none !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }

  function stabilizePanels() {
    try {
      injectCss();
      var panel = document.getElementById('panel');
      if (panel) {
        panel.style.setProperty('grid-template-rows', '10px 48px auto 0 auto', 'important');
      }
      var topDrag = document.getElementById('sn-topchrome-drag');
      var cliDrag = document.getElementById('cli-drag');
      [topDrag, cliDrag].forEach(function (el) {
        if (!el) return;
        el.style.setProperty('height', '10px', 'important');
        el.style.setProperty('min-height', '10px', 'important');
        el.style.setProperty('max-height', '10px', 'important');
        el.style.setProperty('padding', '0', 'important');
        el.style.setProperty('margin', '0', 'important');
      });
    } catch (_) {}
  }

  function enforceHudPlaceholder() {
    try {
      var HUD = 'Command the HUD · show, hide, or reshape';
      var top = document.getElementById('stc-cmd-in');
      var bot = document.getElementById('cli-in');
      if (top) {
        top.placeholder = HUD;
        top.setAttribute('aria-label', HUD);
      }
      if (bot) {
        bot.placeholder = HUD;
        bot.setAttribute('aria-label', HUD);
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

  function ensureRibbonVisible() {
    try {
      var rib = document.getElementById('sn-task-ribbon');
      if (rib) {
        rib.style.setProperty('display', 'flex', 'important');
        rib.style.setProperty('visibility', 'visible', 'important');
      }
    } catch (_) {}
  }

  function applyHud(level) {
    // no-op for law compliance; keep compact
    stabilizePanels();
    enforceHudPlaceholder();
  }

  function boot() {
    injectCss();
    stabilizePanels();
    killInvented();
    ensureRibbonVisible();
    enforceHudPlaceholder();
    setTimeout(function () {
      killInvented();
      stabilizePanels();
      applyHud(2);
      ensureRibbonVisible();
      enforceHudPlaceholder();
    }, 800);
    setTimeout(function () {
      killInvented();
      stabilizePanels();
      applyHud(2);
      ensureRibbonVisible();
      enforceHudPlaceholder();
    }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);

  global.SNChromeFix = {
    build: BUILD,
    stabilizePanels: stabilizePanels,
    ensureRibbonVisible: ensureRibbonVisible,
    killInvented: killInvented,
    applyHud: applyHud,
    enforceHudPlaceholder: enforceHudPlaceholder,
  };
})(typeof window !== 'undefined' ? window : globalThis);
