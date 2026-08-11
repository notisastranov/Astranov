/* Astranov chrome-fix v10
 * Build: 20260811215000-even-chrome-power-only
 * Top + bottom panels IDENTICAL width/handles
 * Power standby = neon blue (independent of radar)
 * Radar colors live in chrome-radar + field (real activity)
 */
(function (global) {
  'use strict';
  var BUILD = '20260811215000-even-chrome-power-only';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    /* Shared panel width — top and bottom use THE SAME formula */
    css.textContent = [
      ':root { --sn-chrome-w: min(960px, calc(100vw - 24px)); }',
      '@media (min-width: 1100px) { :root { --sn-chrome-w: min(1100px, calc(100vw - 48px)); } }',
      '@media (min-width: 1400px) { :root { --sn-chrome-w: min(1280px, calc(100vw - 64px)); } }',
      '@media (min-width: 1800px) { :root { --sn-chrome-w: min(1480px, calc(100vw - 80px)); } }',

      /* transparent everything */
      '#sn-topchrome, #sn-topchrome-panel, #stc-body, #stc-compact, #dock, #panel,',
      '#cli-log, #cli-form, #sn-task-ribbon, #stc-gadgets, .stc-gadget, .stc-g-body {',
      '  background: transparent !important; background-color: transparent !important; background-image: none !important;',
      '}',

      /* IDENTICAL glass shell for top + bottom */
      '#sn-topchrome-panel, #panel {',
      '  width: var(--sn-chrome-w) !important;',
      '  max-width: var(--sn-chrome-w) !important;',
      '  min-width: 0 !important;',
      '  left: 50% !important;',
      '  right: auto !important;',
      '  transform: translateX(-50%) !important;',
      '  margin-left: 0 !important;',
      '  margin-right: 0 !important;',
      '  background: rgba(0, 2, 8, 0.2) !important;',
      '  backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  -webkit-backdrop-filter: blur(14px) saturate(1.15) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.16) !important;',
      '  border-radius: 18px !important;',
      '  box-shadow: none !important;',
      '  box-sizing: border-box !important;',
      '}',
      '#sn-topchrome {',
      '  left: 0 !important; right: 0 !important; width: 100% !important;',
      '  display: flex !important; justify-content: center !important;',
      '  pointer-events: none;',
      '}',
      '#sn-topchrome-panel { pointer-events: auto; top: 8px !important; }',
      '#panel { bottom: 10px !important; }',

      /* IDENTICAL drag handles (top + bottom) */
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 18px !important; min-height: 18px !important; max-height: 18px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  background: transparent !important; border: none !important; box-shadow: none !important;',
      '  color: transparent !important; font-size: 0 !important; line-height: 0 !important;',
      '  padding: 0 !important; margin: 0 !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: \"\" !important;',
      '  display: block !important;',
      '  width: 44px !important; height: 3px !important;',
      '  border-radius: 999px !important;',
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
      '#panel.collapsed { max-height: min(120px, 15vh) !important; min-height: 88px !important; }',
      '#sn-device-alert, #sn-device-alert.show { display: none !important; }',
      '#sn-arch-layer { display: none !important; visibility: hidden !important; pointer-events: none !important; }',

      /* POWER STANDBY = neon blue (default) */
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
      '  filter: none !important;',
      '}',
      '#sn-task-launch.mode-standby .sn-launch-power,',
      '#sn-task-launch.sn-launch.mode-standby .sn-launch-power,',
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
      '#sn-task-launch.mode-on .sn-launch-power { color: #5ef0a0 !important; filter: drop-shadow(0 0 8px rgba(61,214,140,0.9)) !important; }',
      '#sn-task-launch.mode-off {',
      '  animation: none !important;',
      '  background: radial-gradient(circle at 35% 30%, rgba(200,40,50,0.3), rgba(12,0,4,0.95)) !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 22px rgba(232,33,39,0.45) !important;',
      '}',
      '#sn-task-launch.mode-off .sn-launch-power { color: #ff6a6e !important; }',

      /* RADAR: standby + med = blue; low = red; high = green */
      '@keyframes sn-radar-blue-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 12px rgba(40,140,255,0.55), 0 0 26px rgba(20,100,255,0.32); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(100,200,255,1), 0 0 22px rgba(70,180,255,0.9), 0 0 42px rgba(40,140,255,0.5); }',
      '}',
      '@keyframes sn-radar-green-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,230,140,0.9), 0 0 12px rgba(40,220,120,0.55); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(80,255,170,1), 0 0 22px rgba(60,255,150,0.9); }',
      '}',
      '#field-radar { border-radius: 50% !important; transition: box-shadow 0.35s ease !important; }',
      '#field-radar.act-standby, #field-radar.act-med {',
      '  animation: sn-radar-blue-pulse 2.4s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 16px rgba(40,140,255,0.65) !important;',
      '}',
      '#field-radar.act-low {',
      '  animation: none !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 14px rgba(232,33,39,0.55) !important;',
      '}',
      '#field-radar.act-high {',
      '  animation: sn-radar-green-pulse 1.6s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(40,230,140,0.95), 0 0 20px rgba(40,220,120,0.7) !important;',
      '}',

      /* hide broken rive canvas leftovers */
      '#sn-silver-rive { display: none !important; visibility: hidden !important; }',

      '#sn-task-ribbon .sn-user-btn, #sn-task-ribbon #sn-user-btn {',
      '  width: 32px !important; height: 32px !important; border-radius: 50% !important;',
      '  border: 2px solid rgba(61,158,255,0.55) !important; overflow: hidden !important;',
      '}',
      '#stc-compact > #sn-user-btn, .stc-col-money > #sn-user-btn, .stc-col-device > #sn-user-btn, #sn-topchrome #sn-user-btn { display: none !important; }',
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

  /** Force power button to standby (blue) unless explicitly ON for tasks */
  function forceStandbyBlue() {
    try {
      var btn = document.getElementById('sn-task-launch');
      if (!btn) return;

      // Prefer field API
      try {
        if (global.SNField && typeof SNField.setLaunchMode === 'function') {
          var m = (typeof SNField.launchMode === 'function') ? SNField.launchMode() : null;
          // If off or missing → standby (default product law)
          if (m === 'off' || m === null || m === undefined || m === 'idle') {
            SNField.setLaunchMode('standby', { quiet: true });
          }
        }
      } catch (_) {}

      // Class paint (always ensure blue if not mode-on)
      if (!btn.classList.contains('mode-on')) {
        btn.classList.remove('mode-off');
        btn.classList.add('mode-standby');
        try {
          document.body.classList.remove('launch-off', 'launch-on');
          document.body.classList.add('launch-standby');
        } catch (_) {}
        try {
          localStorage.setItem('sn-launch-mode', 'standby');
        } catch (_) {}
      }
    } catch (_) {}
  }

  /* Radar activity is owned by chrome-radar.js + field.js — do NOT couple to power */
  function setRadarAct(level) {
    try {
      if (global.SNRadarPulse && SNRadarPulse.set) SNRadarPulse.set(level);
    } catch (_) {}
  }

  function radarFromLive() {
    try {
      if (global.SNRadarPulse && SNRadarPulse.refresh) return SNRadarPulse.refresh();
    } catch (_) {}
  }

  function evenPanels() {
    // runtime reassert equal widths if base CSS fights
    try {
      var top = document.getElementById('sn-topchrome-panel');
      var bot = document.getElementById('panel');
      if (!top || !bot) return;
      var w = getComputedStyle(document.documentElement).getPropertyValue('--sn-chrome-w').trim();
      if (!w) w = 'min(960px, calc(100vw - 24px))';
      top.style.setProperty('width', w, 'important');
      bot.style.setProperty('width', w, 'important');
      top.style.setProperty('left', '50%', 'important');
      bot.style.setProperty('left', '50%', 'important');
      top.style.setProperty('transform', 'translateX(-50%)', 'important');
      bot.style.setProperty('transform', 'translateX(-50%)', 'important');
      top.style.setProperty('right', 'auto', 'important');
      bot.style.setProperty('right', 'auto', 'important');
    } catch (_) {}
  }

  function boot() {
    injectCss();
    silenceBeeps();
    killArch();
    forceStandbyBlue();
    radarFromLive();
    evenPanels();
    setTimeout(forceStandbyBlue, 600);
    setTimeout(forceStandbyBlue, 2000);
    setTimeout(forceStandbyBlue, 5000);
    setTimeout(radarFromLive, 1000);
    setTimeout(evenPanels, 800);
    setTimeout(evenPanels, 2500);
    setInterval(silenceBeeps, 20000);
    setInterval(killArch, 5000);
    setInterval(forceStandbyBlue, 10000);
    setInterval(radarFromLive, 5000);
    setInterval(evenPanels, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);
  setTimeout(boot, 5500);

  global.SNChromeFix = {
    build: BUILD,
    setRadarAct: setRadarAct,
    radarFromLive: radarFromLive,
    forceStandbyBlue: forceStandbyBlue,
  };
})(typeof window !== 'undefined' ? window : globalThis);
