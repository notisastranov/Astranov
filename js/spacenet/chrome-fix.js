/* Astranov chrome-fix v11
 * Build: 20260811220000-stable-chrome
 * STOP panel left/right jump · equal top/bottom width · kill side rails flash
 */
(function (global) {
  'use strict';
  var BUILD = '20260811220000-stable-chrome';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    /* Same fixed formula for TOP and BOTTOM — no left/transform centering */
    css.textContent = [
      ':root { --sn-chrome-w: min(720px, calc(100vw - 24px)); }',

      /* Kill unauthorized edge scrolls (left/right flashing tools) */
      '#sn-leftscroll, #sn-rightscroll, .sn-edgescroll,',
      '#sn-left-panel, #sn-right-panel, #sn-left-rail, #sn-right-rail {',
      '  display: none !important; visibility: hidden !important;',
      '  pointer-events: none !important; opacity: 0 !important;',
      '  width: 0 !important; height: 0 !important; overflow: hidden !important;',
      '}',

      /* Kill game dock / earth-ops chrome noise */
      '#sn-game-dock, .sn-game-dock, #sn-earth-ops-chip, #sn-space-hud {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',
      '#sn-arch-layer, #sn-device-alert, #sn-device-alert.show, #sn-silver-rive {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',

      /* transparent surfaces */
      '#sn-topchrome, #sn-topchrome-panel, #stc-body, #stc-compact, #dock, #panel,',
      '#cli-log, #cli-form, #sn-task-ribbon, #stc-gadgets, .stc-gadget, .stc-g-body {',
      '  background: transparent !important; background-color: transparent !important; background-image: none !important;',
      '}',

      /* TOP chrome host — full width flex center, no transform games */
      '#sn-topchrome {',
      '  position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-start !important;',
      '  padding: 8px 12px 0 !important; box-sizing: border-box !important;',
      '  pointer-events: none !important; z-index: 95 !important;',
      '}',
      '#sn-topchrome-panel {',
      '  pointer-events: auto !important;',
      '  position: relative !important;',
      '  left: auto !important; right: auto !important; top: auto !important;',
      '  transform: none !important;',
      '  width: var(--sn-chrome-w) !important;',
      '  max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important;',
      '  margin: 0 !important;',
      '  box-sizing: border-box !important;',
      '  background: rgba(0, 2, 8, 0.2) !important;',
      '  backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  -webkit-backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.16) !important;',
      '  border-radius: 18px !important;',
      '  box-shadow: none !important;',
      '}',

      /* BOTTOM dock — same flex center pattern as top */
      '#dock {',
      '  position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important;',
      '  width: 100% !important; transform: none !important;',
      '  display: flex !important; justify-content: center !important; align-items: flex-end !important;',
      '  padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px)) !important;',
      '  box-sizing: border-box !important;',
      '  pointer-events: none !important; z-index: 100 !important;',
      '}',
      '#panel {',
      '  pointer-events: auto !important;',
      '  position: relative !important;',
      '  left: auto !important; right: auto !important; top: auto !important; bottom: auto !important;',
      '  transform: none !important;',
      '  width: var(--sn-chrome-w) !important;',
      '  max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important;',
      '  margin: 0 !important;',
      '  flex: 0 1 auto !important;',
      '  box-sizing: border-box !important;',
      '  background: rgba(0, 2, 8, 0.2) !important;',
      '  backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  -webkit-backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.16) !important;',
      '  border-radius: 18px !important;',
      '  box-shadow: none !important;',
      '}',
      '#panel.collapsed { max-height: min(120px, 15vh) !important; min-height: 88px !important; }',

      /* IDENTICAL handles */
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 18px !important; min-height: 18px !important; max-height: 18px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  background: transparent !important; border: none !important; box-shadow: none !important;',
      '  color: transparent !important; font-size: 0 !important; line-height: 0 !important;',
      '  padding: 0 !important; margin: 0 !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: \"\" !important; display: block !important;',
      '  width: 44px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.9) !important;',
      '  box-shadow: 0 0 10px rgba(61, 158, 255, 0.75) !important;',
      '}',
      '#sn-topchrome-drag::after, #cli-drag::after { content: none !important; display: none !important; }',

      '#cli-form {',
      '  border-top: 1px solid rgba(61, 158, 255, 0.12) !important;',
      '  background: transparent !important;',
      '  display: flex !important; align-items: center !important; gap: 8px !important;',
      '  padding: 6px 12px 10px !important; min-height: 40px !important;',
      '}',
      '#cli-in {',
      '  min-height: 28px !important; font-size: 14px !important;',
      '  background: transparent !important; color: #b8d9ff !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.2) !important; border-radius: 12px !important;',
      '}',

      /* ribbon stays inside CLI — multi-row ok, no overflow hide */
      '#sn-task-ribbon {',
      '  display: flex !important; flex-wrap: wrap !important; gap: 6px !important;',
      '  overflow: visible !important; max-height: none !important;',
      '  padding: 0 10px 4px !important;',
      '}',

      /* POWER STANDBY blue (independent of radar) */
      '@keyframes sn-standby-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 14px rgba(40,140,255,0.55), 0 0 32px rgba(20,100,255,0.3); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(100,200,255,1), 0 0 26px rgba(70,180,255,0.9), 0 0 54px rgba(40,140,255,0.5); }',
      '}',
      '#sn-task-launch.mode-standby,',
      '#sn-task-launch.sn-launch.mode-standby,',
      'body.launch-standby #sn-task-launch,',
      '#sn-task-launch:not(.mode-on):not(.mode-off) {',
      '  background: radial-gradient(circle at 35% 30%, rgba(50,130,255,0.45), rgba(0,8,24,0.95)) !important;',
      '  border: none !important;',
      '  animation: sn-standby-pulse 2.4s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 20px rgba(40,140,255,0.65) !important;',
      '}',
      '#sn-task-launch.mode-standby .sn-launch-power,',
      'body.launch-standby #sn-task-launch .sn-launch-power,',
      '#sn-task-launch:not(.mode-on):not(.mode-off) .sn-launch-power {',
      '  color: #6ec0ff !important;',
      '  filter: drop-shadow(0 0 10px rgba(70,170,255,1)) !important;',
      '}',
      '#sn-task-launch.mode-on {',
      '  animation: none !important;',
      '  background: radial-gradient(circle at 35% 30%, rgba(40,200,120,0.35), rgba(0,12,8,0.95)) !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(61,214,140,0.95), 0 0 22px rgba(61,214,140,0.55) !important;',
      '}',
      '#sn-task-launch.mode-on .sn-launch-power { color: #5ef0a0 !important; }',
      '#sn-task-launch.mode-off {',
      '  animation: none !important;',
      '  background: radial-gradient(circle at 35% 30%, rgba(200,40,50,0.3), rgba(12,0,4,0.95)) !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 22px rgba(232,33,39,0.45) !important;',
      '}',

      /* radar ring CSS is owned by chrome-radar — do not redefine here */

      '#sn-task-ribbon .sn-user-btn, #sn-task-ribbon #sn-user-btn {',
      '  width: 32px !important; height: 32px !important; border-radius: 50% !important;',
      '  border: 2px solid rgba(61,158,255,0.55) !important; overflow: hidden !important;',
      '}',
      '#stc-compact > #sn-user-btn, .stc-col-money > #sn-user-btn, .stc-col-device > #sn-user-btn, #sn-topchrome #sn-user-btn {',
      '  display: none !important;',
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

  function killArch() {
    try {
      var host = document.getElementById('sn-arch-layer');
      if (host && host.parentNode) host.parentNode.removeChild(host);
    } catch (_) {}
  }

  function killSideRails() {
    try {
      ['sn-leftscroll', 'sn-rightscroll'].forEach(function (id) {
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

  function killGameDock() {
    try {
      ['sn-game-dock', 'sn-earth-ops-chip', 'sn-space-hud'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      document.querySelectorAll('.sn-game-dock').forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    } catch (_) {}
  }

  /** Strip any inline left/transform that causes jump */
  function stabilizePanels() {
    try {
      var top = document.getElementById('sn-topchrome-panel');
      var bot = document.getElementById('panel');
      var dock = document.getElementById('dock');
      var chrome = document.getElementById('sn-topchrome');
      [top, bot].forEach(function (el) {
        if (!el) return;
        el.style.removeProperty('left');
        el.style.removeProperty('right');
        el.style.removeProperty('transform');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('transform', 'none', 'important');
        el.style.setProperty('width', 'min(720px, calc(100vw - 24px))', 'important');
        el.style.setProperty('max-width', 'min(720px, calc(100vw - 24px))', 'important');
        el.style.setProperty('margin', '0', 'important');
      });
      if (dock) {
        dock.style.setProperty('left', '0', 'important');
        dock.style.setProperty('right', '0', 'important');
        dock.style.setProperty('transform', 'none', 'important');
        dock.style.setProperty('justify-content', 'center', 'important');
      }
      if (chrome) {
        chrome.style.setProperty('left', '0', 'important');
        chrome.style.setProperty('right', '0', 'important');
        chrome.style.setProperty('transform', 'none', 'important');
        chrome.style.setProperty('justify-content', 'center', 'important');
      }
    } catch (_) {}
  }

  function forceStandbyBlue() {
    try {
      var btn = document.getElementById('sn-task-launch');
      if (!btn) return;
      try {
        if (global.SNField && typeof SNField.setLaunchMode === 'function') {
          var m = typeof SNField.launchMode === 'function' ? SNField.launchMode() : null;
          if (m === 'off' || m === null || m === undefined || m === 'idle') {
            SNField.setLaunchMode('standby', { quiet: true });
          }
        }
      } catch (_) {}
      if (!btn.classList.contains('mode-on')) {
        btn.classList.remove('mode-off');
        btn.classList.add('mode-standby');
        try {
          document.body.classList.remove('launch-off', 'launch-on');
          document.body.classList.add('launch-standby');
          localStorage.setItem('sn-launch-mode', 'standby');
        } catch (_) {}
      }
    } catch (_) {}
  }

  function boot() {
    injectCss();
    silenceBeeps();
    killArch();
    killSideRails();
    killGameDock();
    stabilizePanels();
    forceStandbyBlue();
    setTimeout(function () {
      killSideRails();
      killGameDock();
      stabilizePanels();
      forceStandbyBlue();
    }, 800);
    setTimeout(function () {
      killSideRails();
      killGameDock();
      stabilizePanels();
    }, 2500);
    setTimeout(forceStandbyBlue, 5000);
    setInterval(silenceBeeps, 20000);
    setInterval(killArch, 5000);
    setInterval(killSideRails, 6000);
    setInterval(killGameDock, 8000);
    setInterval(stabilizePanels, 8000);
    setInterval(forceStandbyBlue, 12000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);
  setTimeout(boot, 5500);

  global.SNChromeFix = {
    build: BUILD,
    stabilizePanels: stabilizePanels,
    killSideRails: killSideRails,
  };
})(typeof window !== 'undefined' ? window : globalThis);
