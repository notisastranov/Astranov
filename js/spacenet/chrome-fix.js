/* Astranov chrome-fix v14
 * Build: 20260812196000-scrolls-restored
 * RESTORE visible top scroll · ribbon buttons · modern bottom CLI.
 * Never ghost chrome. Never pull the ancient globe-deck.
 */
(function (global) {
  'use strict';
  var BUILD = '20260812196000-scrolls-restored';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      ':root { --sn-chrome-w: min(720px, calc(100vw - 24px)); --top-scroll-min: 96px; --bottom-scroll-min: 148px; }',
      '#sn-leftscroll, #sn-rightscroll, .sn-edgescroll,',
      '#sn-left-panel, #sn-right-panel, #sn-left-rail, #sn-right-rail,',
      '#sn-game-dock, .sn-game-dock, #sn-earth-ops-chip, #sn-space-hud,',
      '#sn-arch-layer, #sn-device-alert, #sn-silver-rive,',
      '#globe-deck, #aci-hud, #news-ticker, #astranov-logo {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',
      '#sn-topchrome {',
      '  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-start !important;',
      '  padding: 8px 12px 0 !important; box-sizing: border-box !important;',
      '  pointer-events: none !important; z-index: 95 !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#sn-topchrome-panel {',
      '  pointer-events: auto !important; position: relative !important;',
      '  left: auto !important; right: auto !important; top: auto !important; transform: none !important;',
      '  width: var(--sn-chrome-w) !important; max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important; margin: 0 !important; box-sizing: border-box !important;',
      '  min-height: 96px !important;',
      '  background: rgba(0, 4, 14, 0.72) !important;',
      '  backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.42) !important;',
      '  border-radius: 18px !important;',
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(61,158,255,0.18) !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#sn-topchrome-panel.collapsed { max-height: none !important; min-height: 96px !important; height: auto !important; }',
      '#field-radar {',
      '  visibility: visible !important; opacity: 1 !important;',
      '  background: radial-gradient(circle at 40% 35%, rgba(61,158,255,0.28), #04101c) !important;',
      '}',
      '#dock {',
      '  position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-end !important;',
      '  padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px)) !important;',
      '  box-sizing: border-box !important; pointer-events: none !important; z-index: 100 !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#panel {',
      '  pointer-events: auto !important; position: relative !important;',
      '  left: auto !important; right: auto !important; top: auto !important; bottom: auto !important; transform: none !important;',
      '  width: var(--sn-chrome-w) !important; max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important; margin: 0 !important; flex: 0 1 auto !important;',
      '  box-sizing: border-box !important;',
      '  background: rgba(0, 4, 14, 0.78) !important;',
      '  backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.42) !important;',
      '  border-radius: 18px !important;',
      '  box-shadow: 0 -8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(61,158,255,0.16) !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#panel.collapsed { min-height: 148px !important; max-height: min(220px, 32vh) !important; }',
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 18px !important; min-height: 18px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: \"\" !important; display: block !important;',
      '  width: 44px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.9) !important;',
      '  box-shadow: 0 0 10px rgba(61, 158, 255, 0.75) !important;',
      '}',
      '#sn-task-ribbon {',
      '  display: flex !important; flex-wrap: nowrap !important; gap: 6px !important;',
      '  overflow-x: auto !important; overflow-y: hidden !important;',
      '  padding: 6px 10px 4px !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '  max-height: none !important;',
      '}',
      '#sn-task-ribbon .sn-rib-btn {',
      '  display: inline-flex !important; flex-direction: column !important;',
      '  align-items: center !important; justify-content: center !important;',
      '  gap: 4px !important; flex: 1 1 0 !important;',
      '  min-width: 44px !important; min-height: 56px !important;',
      '  padding: 6px 4px !important;',
      '  border: 1px solid rgba(61,184,255,0.4) !important;',
      '  background: linear-gradient(165deg, rgba(12,40,78,0.85), rgba(3,14,32,0.95)) !important;',
      '  color: #d4ecff !important; border-radius: 14px !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#sn-task-ribbon .sn-rib-icon {',
      '  display: grid !important; visibility: visible !important;',
      '  width: 22px !important; height: 22px !important; color: #3d9eff !important;',
      '}',
      '#sn-task-ribbon .sn-rib-icon[hidden] { display: grid !important; }',
      '#sn-task-ribbon .sn-rib-icon svg { width: 20px; height: 20px; display: block; }',
      '#sn-task-ribbon .sn-rib-txt {',
      '  display: block !important; font: 700 10px/1.1 Inter,system-ui,sans-serif !important;',
      '  letter-spacing: 0.05em !important; color: #b8dcff !important; text-transform: uppercase !important;',
      '}',
      '#cli-form {',
      '  display: flex !important; align-items: center !important; gap: 8px !important;',
      '  padding: 6px 12px 10px !important; min-height: 40px !important;',
      '  visibility: visible !important;',
      '}',
      '#cli-in {',
      '  min-height: 28px !important; font-size: 14px !important;',
      '  color: #d4ecff !important; caret-color: #3d9eff !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '@keyframes sn-standby-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 14px rgba(40,140,255,0.55); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(100,200,255,1), 0 0 26px rgba(70,180,255,0.9); }',
      '}',
      '#sn-task-launch.mode-standby, #sn-task-launch:not(.mode-on):not(.mode-off) {',
      '  animation: sn-standby-pulse 2.4s ease-in-out infinite !important;',
      '}',
    ].join('\n');
    document.head.appendChild(css);
  }

  function silenceBeeps() {
    try {
      global.__SN_MUTE_ALERTS = true;
      if (global.SNField) {
        try {
          global.SNField.playAlertTone = function () {};
          global.SNField.showDeviceAlert = function () {};
        } catch (_) {}
      }
    } catch (_) {}
    try { if (global.speechSynthesis) global.speechSynthesis.cancel(); } catch (_) {}
  }

  function killAncient() {
    try {
      ['globe-deck', 'aci-hud', 'news-ticker', 'sn-arch-layer', 'sn-leftscroll', 'sn-rightscroll'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    } catch (_) {}
    try {
      if (global.SNScrolls) {
        global.SNScrolls.paintSideRails = function () {};
        global.SNScrolls.ensureEdges = function () {};
      }
    } catch (_) {}
  }

  function stabilizePanels() {
    try {
      var top = document.getElementById('sn-topchrome-panel');
      var bot = document.getElementById('panel');
      [top, bot].forEach(function (el) {
        if (!el) return;
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('transform', 'none', 'important');
        el.style.setProperty('width', 'min(720px, calc(100vw - 24px))', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
      });
      if (top) {
        top.style.setProperty('min-height', '96px', 'important');
        top.style.setProperty('background', 'rgba(0, 4, 14, 0.72)', 'important');
      }
      if (bot && bot.classList.contains('collapsed')) {
        bot.style.setProperty('min-height', '148px', 'important');
        bot.style.setProperty('background', 'rgba(0, 4, 14, 0.78)', 'important');
      }
    } catch (_) {}
  }

  function forceStandbyBlue() {
    try {
      var btn = document.getElementById('sn-task-launch');
      if (!btn) return;
      if (!btn.classList.contains('mode-on')) {
        btn.classList.remove('mode-off');
        btn.classList.add('mode-standby');
        try {
          document.body.classList.remove('launch-off', 'launch-on');
          document.body.classList.add('launch-standby');
        } catch (_) {}
      }
    } catch (_) {}
  }

  function ensureRibbonVisible() {
    try {
      var bar = document.getElementById('sn-task-ribbon');
      if (!bar) return;
      bar.hidden = false;
      bar.removeAttribute('hidden');
      bar.style.setProperty('display', 'flex', 'important');
      bar.style.setProperty('visibility', 'visible', 'important');
      if (!bar.children.length && global.SNField && typeof SNField.paintRibbon === 'function') {
        SNField.paintRibbon();
      }
      bar.querySelectorAll('.sn-rib-icon[hidden]').forEach(function (el) {
        el.removeAttribute('hidden');
      });
    } catch (_) {}
  }

  function boot() {
    injectCss();
    silenceBeeps();
    killAncient();
    stabilizePanels();
    forceStandbyBlue();
    ensureRibbonVisible();
    setTimeout(function () {
      killAncient();
      stabilizePanels();
      forceStandbyBlue();
      ensureRibbonVisible();
    }, 800);
    setTimeout(function () {
      killAncient();
      stabilizePanels();
      ensureRibbonVisible();
    }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);

  global.SNChromeFix = {
    build: BUILD,
    stabilizePanels: stabilizePanels,
    ensureRibbonVisible: ensureRibbonVisible,
  };
})(typeof window !== 'undefined' ? window : globalThis);
