/* Astranov chrome-fix v9
 * Build: 20260811210000-chrome-expand-blue
 * Wide dynamic top/bottom chrome on large screens
 * Power standby + radar medium = neon blue pulse
 */
(function (global) {
  'use strict';
  var BUILD = '20260811210000-chrome-expand-blue';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      '#sn-topchrome, #sn-topchrome-panel, #stc-body, #stc-compact, #dock, #panel,',
      '#cli-log, #cli-form, #sn-task-ribbon, #stc-gadgets, .stc-gadget, .stc-g-body {',
      '  background: transparent !important; background-color: transparent !important; background-image: none !important;',
      '}',
      '#sn-topchrome-panel, #panel {',
      '  background: rgba(0, 2, 8, 0.18) !important;',
      '  backdrop-filter: blur(12px) saturate(1.1) !important;',
      '  -webkit-backdrop-filter: blur(12px) saturate(1.1) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.14) !important;',
      '  box-shadow: none !important;',
      '}',
      '#sn-topchrome { left: 0 !important; right: 0 !important; width: 100% !important; }',
      '#sn-topchrome-panel {',
      '  width: min(960px, calc(100% - 24px)) !important; max-width: none !important;',
      '  margin-left: auto !important; margin-right: auto !important;',
      '  left: 50% !important; transform: translateX(-50%) !important; right: auto !important;',
      '}',
      '#panel {',
      '  width: min(960px, calc(100% - 24px)) !important; max-width: none !important;',
      '  left: 50% !important; transform: translateX(-50%) !important; right: auto !important;',
      '  bottom: 10px !important;',
      '}',
      '@media (min-width: 1100px) { #sn-topchrome-panel, #panel { width: min(1100px, calc(100% - 48px)) !important; } }',
      '@media (min-width: 1400px) { #sn-topchrome-panel, #panel { width: min(1280px, calc(100% - 64px)) !important; } }',
      '@media (min-width: 1800px) { #sn-topchrome-panel, #panel { width: min(1480px, calc(100% - 80px)) !important; } }',
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 18px !important; min-height: 18px !important; max-height: 20px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  background: transparent !important; border: none !important; box-shadow: none !important;',
      '  color: transparent !important; font-size: 0 !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: "" !important; width: 48px !important; height: 3px !important; border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.85) !important; box-shadow: 0 0 10px rgba(61, 158, 255, 0.7) !important;',
      '}',
      '#sn-topchrome-drag::after, #cli-drag::after { content: none !important; display: none !important; }',
      '#cli-form { border-top: 1px solid rgba(61, 158, 255, 0.12) !important; background: transparent !important; display: flex !important; align-items: center !important; gap: 8px !important; padding: 6px 12px 10px !important; min-height: 40px !important; }',
      '#cli-in { min-height: 28px !important; font-size: 14px !important; background: transparent !important; color: #b8d9ff !important; border: 1px solid rgba(61, 158, 255, 0.2) !important; border-radius: 12px !important; }',
      '#panel.collapsed { max-height: min(120px, 15vh) !important; min-height: 88px !important; }',
      '#sn-device-alert, #sn-device-alert.show { display: none !important; }',
      '#sn-arch-layer { display: none !important; visibility: hidden !important; pointer-events: none !important; }',
      '@keyframes sn-standby-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.9), 0 0 14px rgba(40,140,255,0.5), 0 0 30px rgba(20,100,255,0.28); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(90,190,255,1), 0 0 24px rgba(60,170,255,0.85), 0 0 52px rgba(40,140,255,0.45); }',
      '}',
      '#sn-task-launch.mode-standby, #sn-task-launch.sn-launch.mode-standby,',
      '#sn-task-launch:not(.mode-on):not(.mode-off) {',
      '  background: radial-gradient(circle at 35% 30%, rgba(40,120,255,0.4), rgba(0,8,24,0.92)) !important;',
      '  border: none !important; animation: sn-standby-pulse 2.4s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 20px rgba(40,140,255,0.6) !important;',
      '}',
      '#sn-task-launch.mode-standby .sn-launch-power,',
      '#sn-task-launch:not(.mode-on):not(.mode-off) .sn-launch-power {',
      '  color: #5eb0ff !important; filter: drop-shadow(0 0 10px rgba(60,160,255,0.95)) !important;',
      '}',
      '#sn-task-launch.mode-on { animation: none !important; box-shadow: inset 0 0 0 2.5px rgba(61,214,140,0.95), 0 0 22px rgba(61,214,140,0.5) !important; }',
      '#sn-task-launch.mode-off { animation: none !important; box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 22px rgba(232,33,39,0.45) !important; }',
      '@keyframes sn-radar-blue-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.9), 0 0 12px rgba(40,140,255,0.5), 0 0 26px rgba(20,100,255,0.3); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(90,190,255,1), 0 0 20px rgba(60,170,255,0.85), 0 0 40px rgba(40,140,255,0.45); }',
      '}',
      '@keyframes sn-radar-green-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,230,140,0.9), 0 0 12px rgba(40,220,120,0.55); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(80,255,170,1), 0 0 22px rgba(60,255,150,0.9); }',
      '}',
      '#field-radar { border-radius: 50% !important; transition: box-shadow 0.35s ease !important; }',
      '#field-radar.act-standby, #field-radar.act-med {',
      '  animation: sn-radar-blue-pulse 2.4s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2px rgba(40,140,255,0.95), 0 0 16px rgba(40,140,255,0.6) !important;',
      '}',
      '#field-radar.act-low { animation: none !important; box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 14px rgba(232,33,39,0.55) !important; }',
      '#field-radar.act-high { animation: sn-radar-green-pulse 1.6s ease-in-out infinite !important; box-shadow: inset 0 0 0 2.5px rgba(40,230,140,0.95), 0 0 20px rgba(40,220,120,0.7) !important; }',
      '#sn-task-ribbon .sn-user-btn, #sn-task-ribbon #sn-user-btn { width: 32px !important; height: 32px !important; border-radius: 50% !important; border: 2px solid rgba(61,158,255,0.55) !important; overflow: hidden !important; }',
      '#stc-compact > #sn-user-btn, .stc-col-money > #sn-user-btn, .stc-col-device > #sn-user-btn, #sn-topchrome #sn-user-btn { display: none !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }

  function silenceBeeps() {
    try {
      global.__SN_MUTE_ALERTS = true;
      if (global.SNField) {
        try { global.SNField.playAlertTone = function () {}; global.SNField.showDeviceAlert = function () {}; } catch (_) {}
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

  function forceStandbyIfIdle() {
    try {
      var btn = document.getElementById('sn-task-launch');
      if (!btn) return;
      if (!btn.classList.contains('mode-on') && !btn.classList.contains('mode-off')) {
        btn.classList.add('mode-standby');
      }
      try {
        if (global.SNField && typeof SNField.launchMode === 'function') {
          var m = SNField.launchMode();
          if (m === 'standby' || m === 'idle' || !m) {
            btn.classList.remove('mode-on', 'mode-off');
            btn.classList.add('mode-standby');
          }
        }
      } catch (_) {}
    } catch (_) {}
  }

  function setRadarAct(level) {
    var el = document.getElementById('field-radar');
    if (!el) return;
    el.classList.remove('act-low', 'act-med', 'act-high', 'act-standby');
    if (level === 'high' || level === 2) el.classList.add('act-high');
    else if (level === 'med' || level === 'medium' || level === 1) el.classList.add('act-med');
    else if (level === 'standby' || level === 'blue') el.classList.add('act-standby');
    else el.classList.add('act-low');
  }

  function radarFromLive() {
    var n = 0;
    try {
      if (global.SNTasks && SNTasks.list) {
        n += (SNTasks.list() || []).filter(function (t) {
          return t && t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'complete';
        }).length;
      }
    } catch (_) {}
    try {
      if (global.SNOfferStack && SNOfferStack.peekCount) n += Number(SNOfferStack.peekCount()) || 0;
      else if (global.SNOfferStack && SNOfferStack.list) {
        n += (SNOfferStack.list() || []).filter(function (o) {
          var ph = String((o && o.phase) || '').toLowerCase();
          return ph === 'offered' || ph === 'open' || ph === 'claimed' || ph === 'underway';
        }).length;
      }
    } catch (_) {}
    if (n >= 4) setRadarAct('high');
    else if (n >= 1) setRadarAct('med');
    else {
      var btn = document.getElementById('sn-task-launch');
      if (btn && (btn.classList.contains('mode-standby') || (!btn.classList.contains('mode-on') && !btn.classList.contains('mode-off')))) {
        setRadarAct('standby');
      } else setRadarAct('low');
    }
  }

  function boot() {
    injectCss();
    silenceBeeps();
    killArch();
    forceStandbyIfIdle();
    radarFromLive();
    setTimeout(forceStandbyIfIdle, 800);
    setTimeout(forceStandbyIfIdle, 2500);
    setTimeout(radarFromLive, 1200);
    setTimeout(radarFromLive, 4000);
    setInterval(silenceBeeps, 20000);
    setInterval(killArch, 5000);
    setInterval(forceStandbyIfIdle, 8000);
    setInterval(radarFromLive, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2500);
  setTimeout(boot, 6000);

  global.SNChromeFix = { build: BUILD, setRadarAct: setRadarAct, radarFromLive: radarFromLive };
})(typeof window !== 'undefined' ? window : globalThis);
