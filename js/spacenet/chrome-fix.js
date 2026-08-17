/* Astranov chrome-fix v15
 * Build: 20260813044500-owner-law
 * Compact existing ribbon only. No invented globe buttons. No tall double-emoji pills.
 */
(function (global) {
  'use strict';
  var BUILD = '20260813044500-owner-law';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      ':root { --sn-chrome-w: min(720px, calc(100vw - 24px)); --top-scroll-min: 96px; --bottom-scroll-min: 148px; }',
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
      '  min-height: 152px !important;',
      '  background: rgba(0, 4, 14, 0.72) !important;',
      '  backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.25) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.42) !important;',
      '  border-radius: 6px !important;',
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(61,158,255,0.22), inset 0 0 0 1px rgba(160,220,255,0.08) !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#sn-topchrome-panel.collapsed { max-height: 152px !important; min-height: 152px !important; height: 152px !important; }',
      'body.sn-guest #stc-cmd { display: none !important; }',
      'body.sn-guest #sn-helper-canvas, body.sn-guest #sn-helper-hit, body.sn-guest #sn-helper-label { display: none !important; }',
      'body.sn-guest #sn-topchrome-panel { min-height: 88px !important; max-height: 110px !important; }',
      'body.sn-guest #sn-topchrome-drag::after { content: \"ASTRANOV\" !important; }',
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
      '  padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px)) !important;',
      '  box-sizing: border-box !important; pointer-events: none !important; z-index: 100 !important;',
      '  visibility: visible !important; opacity: 1 !important;',
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
      '  border: 1px solid rgba(61, 158, 255, 0.42) !important;',
      '  border-radius: 6px !important;',
      '  box-shadow: 0 -8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(61,158,255,0.2), inset 0 0 0 1px rgba(160,220,255,0.08) !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#panel.collapsed { min-height: 188px !important; max-height: min(240px, 34vh) !important; }',
      '#panel {',
      '  display: grid !important;',
      '  grid-template-columns: 1fr !important;',
      '  grid-template-rows: 16px 42px minmax(56px, 1fr) auto !important;',
      '}',
      '#cli-drag { height: 16px !important; min-height: 16px !important; grid-row: 1 !important; }',
      '#sn-topchrome-drag {',
      '  height: 28px !important; min-height: 28px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '}',
      '#cli-drag::before {',
      '  content: \"\" !important; display: block !important;',
      '  width: 44px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.9) !important;',
      '  box-shadow: 0 0 10px rgba(61, 158, 255, 0.75) !important;',
      '}',
      '#sn-topchrome-drag::before {',
      '  content: \"\" !important; display: block !important;',
      '  width: 52px !important; height: 4px !important; border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.95) !important;',
      '  box-shadow: 0 0 12px rgba(61, 158, 255, 0.75) !important;',
      '}',
      '#sn-topchrome-drag::after {',
      '  content: \"SEARCH\" !important;',
      '  font: 700 9px/1 \"JetBrains Mono\", ui-monospace, monospace !important;',
      '  letter-spacing: 0.22em !important;',
      '}',
      'body.spacexai #sn-topchrome-drag::after { content: \"FLIGHT\" !important; }',
      '#stc-cmd {',
      '  pointer-events: auto !important; display: flex !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '  width: 100% !important; max-width: none !important;',
      '  flex: 0 0 auto !important; margin: 0 !important;',
      '}',
      '#sn-topchrome { flex-direction: column !important; align-items: center !important; }',
      '#sn-task-ribbon {',
      '  display: flex !important; flex-wrap: nowrap !important; gap: 4px !important;',
      '  justify-content: space-between !important; align-items: center !important;',
      '  overflow-x: auto !important; overflow-y: hidden !important;',
      '  padding: 4px 10px 6px !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '  max-height: none !important; min-height: 42px !important;',
      '  grid-row: 2 !important; position: relative !important; z-index: 3 !important;',
      '  background: rgba(0, 6, 18, 0.55) !important;',
      '  border-bottom: 1px solid rgba(61, 158, 255, 0.2) !important;',
      '}',
      '#sn-task-ribbon .sn-rib-btn {',
      '  display: inline-flex !important; flex-direction: row !important;',
      '  align-items: center !important; justify-content: center !important;',
      '  gap: 4px !important; flex: 0 0 auto !important;',
      '  min-width: 0 !important; min-height: 32px !important; height: 32px !important;',
      '  padding: 4px 8px !important;',
      '  border: 1px solid rgba(61,184,255,0.4) !important;',
      '  background: linear-gradient(165deg, rgba(12,40,78,0.85), rgba(3,14,32,0.95)) !important;',
      '  color: #d4ecff !important; border-radius: 999px !important;',
      '  visibility: visible !important; opacity: 1 !important;',
      '}',
      '#sn-task-ribbon .sn-rib-emoji { display:block !important; font-size:16px !important; line-height:1 !important; font-family:\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Noto Color Emoji\",sans-serif !important; font-variant-emoji:emoji !important; filter:none !important; color:initial !important; -webkit-text-fill-color:initial !important; }',
      '#sn-task-ribbon .sn-rib-icon-svg { display: none !important; }',
      '#sn-task-ribbon .sn-rib-icon {',
      '  display: grid !important; visibility: visible !important;',
      '  width: 18px !important; height: 18px !important;',
      '}',
      '#sn-task-ribbon .sn-rib-icon svg { width: 16px; height: 16px; display: block; }',
      '#sn-task-ribbon .sn-rib-txt {',
      '  display: block !important; font: 700 10px/1 Inter,system-ui,sans-serif !important;',
      '  letter-spacing: 0.06em !important; color: #b8dcff !important; text-transform: uppercase !important;',
      '}',
      '#sn-orb-ring, .sn-orb, #sn-sky-caption, #sn-rib-orbit, #sn-collective-hud {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '  width: 0 !important; height: 0 !important; overflow: hidden !important;',
      '}',
      '#cli-log { grid-row: 3 !important; min-height: 56px !important; max-height: none !important; padding: 8px 14px 6px !important; position: relative !important; z-index: 1 !important; }',
      '#cli-form {',
      '  display: flex !important; align-items: center !important; gap: 8px !important;',
      '  padding: 6px 12px 10px !important; min-height: 40px !important;',
      '  visibility: visible !important; grid-row: 4 !important;',
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

  function killInvented() {
    try {
      [
        'sn-orb-ring',
        'sn-sky-caption',
        'sn-sky-caption-css',
        'sn-collective-hud',
        'sn-collective-hud-css',
        'sn-rib-orbit',
        'globe-deck',
        'aci-hud',
        'news-ticker',
        'sn-arch-layer',
        'sn-leftscroll',
        'sn-rightscroll',
      ].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      document.querySelectorAll('.sn-orb').forEach(function (el) {
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
    } catch (_) {}
  }

  function markGuest() {
    var signed = false;
    try {
      signed = !!(global.SNAuth && SNAuth.user);
    } catch (_) {}
    document.body.classList.toggle('sn-guest', !signed);
    document.body.classList.toggle('sn-in', !!signed);
  }

  function boot() {
    injectCss();
    markGuest();
    try {
      setInterval(markGuest, 4000);
    } catch (_) {}
    silenceBeeps();
    killInvented();
    stabilizePanels();
    forceStandbyBlue();
    ensureRibbonVisible();
    setTimeout(function () {
      killInvented();
      stabilizePanels();
      forceStandbyBlue();
      ensureRibbonVisible();
    }, 800);
    setTimeout(function () {
      killInvented();
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
    killInvented: killInvented,
  };
})(typeof window !== 'undefined' ? window : globalThis);
