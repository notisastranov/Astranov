/* Astranov chrome-fix — pure transparent UI · no white · silence beeps
 * Build: 20260811170000-chrome-fix-v7-standby-clean
 * Owner law: transparent only · globe/space glow · no labels on handles · mute device tones
 * v7: kill stuck PAST ORDERS banner · standby power deep pulsing blue · desktop CLI centered
 */
(function (global) {
  'use strict';
  var BUILD = '20260811170000-chrome-fix-v7-standby-clean';

  function injectCss() {
    var old = document.getElementById('sn-chrome-fix-css');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      '/* PURE TRANSPARENT — no solid chrome, no white anywhere */',
      '#sn-topchrome, #sn-topchrome-panel, #stc-body, #stc-compact, #dock, #panel,',
      '#cli-log, #cli-form, #sn-task-ribbon, #stc-gadgets, .stc-gadget, .stc-g-body {',
      '  background: transparent !important;',
      '  background-color: transparent !important;',
      '  background-image: none !important;',
      '}',
      '#sn-topchrome-panel, #panel {',
      '  background: rgba(0, 2, 8, 0.18) !important;',
      '  backdrop-filter: blur(12px) saturate(1.1) !important;',
      '  -webkit-backdrop-filter: blur(12px) saturate(1.1) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.14) !important;',
      '  box-shadow: none !important;',
      '}',
      'html.theme-light #sn-topchrome-panel, html.theme-light #panel,',
      'html.theme-light #sn-topchrome-drag, html.theme-light #cli-drag,',
      'html.theme-light #field-balance-hud, html.theme-light #btn-home,',
      'html.theme-light #sn-task-launch, html.theme-light #field-radar {',
      '  background: rgba(0, 8, 20, 0.22) !important;',
      '  background-color: rgba(0, 8, 20, 0.22) !important;',
      '  border-color: rgba(61, 158, 255, 0.22) !important;',
      '  color: #c8e4ff !important;',
      '}',
      '#sn-topchrome-drag, #cli-drag, #panel, #sn-topchrome-panel,',
      '.handle, .sn-handle, [class*="drag"] {',
      '  background: transparent !important;',
      '  background-color: transparent !important;',
      '}',
      '#field-balance-hud, #btn-home, #sn-task-launch, #field-radar {',
      '  background: rgba(0, 8, 24, 0.28) !important;',
      '  backdrop-filter: blur(8px) !important;',
      '  -webkit-backdrop-filter: blur(8px) !important;',
      '  border: 1px solid rgba(61, 158, 255, 0.25) !important;',
      '}',
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 18px !important; min-height: 18px !important; max-height: 20px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  gap: 0 !important; cursor: pointer !important; touch-action: none !important;',
      '  flex-shrink: 0 !important; z-index: 5 !important; position: relative !important;',
      '  background: transparent !important; background-color: transparent !important;',
      '  border: none !important; box-shadow: none !important;',
      '  color: transparent !important; font-size: 0 !important; line-height: 0 !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: "" !important; width: 40px !important; height: 3px !important;',
      '  border-radius: 999px !important;',
      '  background: rgba(61, 158, 255, 0.85) !important;',
      '  box-shadow: 0 0 10px rgba(61, 158, 255, 0.7), 0 0 20px rgba(61, 158, 255, 0.35) !important;',
      '}',
      '#sn-topchrome-drag::after, #cli-drag::after {',
      '  content: none !important; display: none !important;',
      '}',
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
      '#panel.collapsed #cli-log:empty { display: none !important; }',
      '#sn-device-alert, #sn-device-alert.show {',
      '  display: none !important; opacity: 0 !important; pointer-events: none !important;',
      '}',
      '#field-radar.act-low { box-shadow: inset 0 0 0 2px rgba(232,33,39,0.8), 0 0 12px rgba(232,33,39,0.35) !important; }',
      '#field-radar.act-med { box-shadow: inset 0 0 0 2px rgba(61,158,255,0.85), 0 0 14px rgba(61,158,255,0.4) !important; }',
      '#field-radar.act-high { box-shadow: inset 0 0 0 2px rgba(61,214,140,0.85), 0 0 16px rgba(61,214,140,0.45) !important; }',
      '#sn-task-ribbon .sn-user-btn, #sn-task-ribbon #sn-user-btn {',
      '  width: 32px !important; height: 32px !important; min-width: 32px !important;',
      '  border-radius: 50% !important; border: 2px solid rgba(61,158,255,0.55) !important;',
      '  background: rgba(0,8,24,0.35) !important; color: #7ec8ff !important;',
      '  display: inline-flex !important; align-items: center !important; justify-content: center !important;',
      '  overflow: hidden !important; padding: 0 !important; flex-shrink: 0 !important;',
      '}',
      '#sn-task-ribbon .sn-user-btn.has-photo { border-color: rgba(61,214,140,0.8) !important; }',
      '#sn-task-ribbon .sn-user-btn img { width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important; }',
      '#stc-compact > #sn-user-btn, .stc-col-money > #sn-user-btn, .stc-col-device > #sn-user-btn, #sn-topchrome #sn-user-btn { display: none !important; }',
      'html.theme-light body, html.theme-light #cli-log, html.theme-light #cli-in {',
      '  color: #c8e4ff !important;',
      '}',
      '/* KILL stuck PAST ORDERS banner over CLI */',
      '#sn-arch-layer {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '  opacity: 0 !important; z-index: -1 !important;',
      '}',
      'body.tl-past.tl-archive-open #sn-arch-layer {',
      '  display: flex !important; visibility: visible !important; pointer-events: auto !important;',
      '  opacity: 1 !important; z-index: 120 !important;',
      '}',
      '/* Power standby = deep pulsing electric blue */',
      '@keyframes sn-standby-pulse {',
      '  0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.85), 0 0 12px rgba(40,140,255,0.45), 0 0 28px rgba(20,100,255,0.25); }',
      '  50% { box-shadow: inset 0 0 0 2.5px rgba(80,180,255,1), 0 0 22px rgba(60,160,255,0.75), 0 0 48px rgba(40,140,255,0.4); }',
      '}',
      '#sn-task-launch.mode-standby, #sn-task-launch.sn-launch.mode-standby {',
      '  background: radial-gradient(circle at 35% 30%, rgba(40,120,255,0.35), rgba(0,8,24,0.9)) !important;',
      '  border: none !important;',
      '  animation: sn-standby-pulse 2.4s ease-in-out infinite !important;',
      '  box-shadow: inset 0 0 0 2px rgba(40,140,255,0.9), 0 0 18px rgba(40,140,255,0.55) !important;',
      '}',
      '#sn-task-launch.mode-standby .sn-launch-power {',
      '  color: #5eb0ff !important;',
      '  filter: drop-shadow(0 0 10px rgba(60,160,255,0.95)) !important;',
      '}',
      '#sn-task-launch.mode-on {',
      '  animation: none !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(61,214,140,0.95), 0 0 22px rgba(61,214,140,0.5) !important;',
      '}',
      '#sn-task-launch.mode-off {',
      '  animation: none !important;',
      '  box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 22px rgba(232,33,39,0.45) !important;',
      '}',
      '/* Desktop: CLI centered bottom, no left float junk */',
      '@media (min-width: 900px) {',
      '  #panel {',
      '    left: 50% !important; transform: translateX(-50%) !important;',
      '    width: min(520px, 42vw) !important; right: auto !important;',
      '    bottom: 12px !important;',
      '  }',
      '  #sn-task-ribbon { justify-content: center !important; }',
      '  #sn-arch-layer { display: none !important; }',
      '}',
    ].join('\n');
    document.head.appendChild(css);
  }

  function silenceBeeps() {
    try {
      global.__SN_MUTE_ALERTS = true;
      if (global._snAudioCtx) {
        try { global._snAudioCtx.close(); } catch (_) {}
        global._snAudioCtx = null;
      }
      if (global.SNField) {
        try {
          global.SNField.playAlertTone = function () {};
          global.SNField.showDeviceAlert = function () {};
        } catch (_) {}
      }
    } catch (_) {}
    try {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
    } catch (_) {}
    try {
      global.__SN_VOICE_OFF = true;
      if (global.localStorage) {
        var v = localStorage.getItem('sn:tts-speak-v1');
        if (v !== '1' && v !== 'true') localStorage.setItem('sn:tts-speak-v1', '0');
      }
    } catch (_) {}
  }

  function killStuckArchiveBanner() {
    try {
      var host = document.getElementById('sn-arch-layer');
      if (host && host.parentNode) host.parentNode.removeChild(host);
    } catch (_) {}
    try {
      if (global.SNPolyScheduler && SNPolyScheduler.paintArchiveLayer && !SNPolyScheduler._snArchMuted) {
        SNPolyScheduler._snArchMuted = true;
        var orig = SNPolyScheduler.paintArchiveLayer.bind(SNPolyScheduler);
        SNPolyScheduler.paintArchiveLayer = function (orders, year) {
          if (!document.body.classList.contains('tl-archive-open')) {
            try {
              var h = document.getElementById('sn-arch-layer');
              if (h && h.parentNode) h.parentNode.removeChild(h);
            } catch (_) {}
            return;
          }
          return orig(orders, year);
        };
      }
    } catch (_) {}
  }

  function removeStrayTopUser() {
    try {
      var nodes = document.querySelectorAll('#stc-compact #sn-user-btn, .stc-col-money #sn-user-btn, .stc-col-device #sn-user-btn, #sn-topchrome #sn-user-btn');
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] && nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
      }
    } catch (_) {}
  }

  function ensureRibbonUser() {
    var ribbon = document.getElementById('sn-task-ribbon');
    if (!ribbon) return null;
    var existing = ribbon.querySelector('#sn-user-btn, .sn-user-btn[data-ribbon-user]');
    if (existing) return existing;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sn-user-btn';
    btn.className = 'sn-user-btn';
    btn.setAttribute('data-ribbon-user', '1');
    btn.title = 'Account · profile';
    btn.innerHTML = '<span aria-hidden="true">·</span>';
    if (ribbon.firstChild) ribbon.insertBefore(btn, ribbon.firstChild);
    else ribbon.appendChild(btn);
    btn.addEventListener('click', function () {
      try {
        if (global.SNAuth && SNAuth.openProfile) return SNAuth.openProfile();
        if (global.SNProfiles && SNProfiles.openMe) return SNProfiles.openMe();
        if (global.SNCli && SNCli.run) SNCli.run('user');
      } catch (_) {}
    });
    return btn;
  }

  function paintUser() {
    var btn = ensureRibbonUser();
    if (!btn) return;
    var me = null;
    try {
      if (global.SNAuth && SNAuth.user) me = SNAuth.user();
      else if (global.SNProfiles && SNProfiles.me) me = SNProfiles.me();
    } catch (_) {}
    var photo = me && (me.photo || me.avatar || me.picture || me.image || (me.user_metadata && me.user_metadata.avatar_url));
    var name = (me && (me.name || me.displayName || me.email || me.handle)) || '';
    var init = (name.charAt(0) || '·').toUpperCase();
    if (photo) {
      btn.classList.add('has-photo');
      btn.innerHTML = '<img src="' + String(photo).replace(/"/g, '') + '" alt="" referrerpolicy="no-referrer" />';
    } else {
      btn.classList.remove('has-photo');
      btn.innerHTML = '<span aria-hidden="true">' + init + '</span>';
    }
  }

  function setRadarAct(level) {
    var el = document.getElementById('field-radar');
    if (!el) return;
    el.classList.remove('act-low', 'act-med', 'act-high');
    if (level === 'high' || level === 2) el.classList.add('act-high');
    else if (level === 'med' || level === 'medium' || level === 1) el.classList.add('act-med');
    else el.classList.add('act-low');
  }

  function radarFromLive() {
    var n = 0;
    try {
      if (global.SNTasks && SNTasks.list) {
        var list = SNTasks.list() || [];
        n += list.filter(function (t) { return t && t.status !== 'done' && t.status !== 'cancelled'; }).length;
      }
    } catch (_) {}
    try {
      if (global.SNOfferStack && SNOfferStack.peekCount) n += Number(SNOfferStack.peekCount()) || 0;
    } catch (_) {}
    if (n >= 4) setRadarAct('high');
    else if (n >= 1) setRadarAct('med');
    else setRadarAct('low');
  }

  function hookGlobeBoost() {
    try {
      if (!global.SNGlobe) return;
      var g = global.SNGlobe;
      if (typeof g.setInertia === 'function') {
        g.setInertia({ damp: 0.965, scale: 0.0028 });
      }
      if (g.physics) {
        if (g.physics.damp != null) g.physics.damp = 0.965;
        if (g.physics.rotScale != null) g.physics.rotScale = 0.0028;
      }
    } catch (_) {}
  }

  function boot() {
    injectCss();
    killStuckArchiveBanner();
    silenceBeeps();
    removeStrayTopUser();
    ensureRibbonUser();
    paintUser();
    radarFromLive();
    hookGlobeBoost();
    setTimeout(silenceBeeps, 800);
    setTimeout(silenceBeeps, 2500);
    setTimeout(killStuckArchiveBanner, 1000);
    setTimeout(removeStrayTopUser, 800);
    setTimeout(paintUser, 1200);
    setTimeout(paintUser, 3500);
    setTimeout(radarFromLive, 2000);
    setTimeout(hookGlobeBoost, 2000);
    setTimeout(hookGlobeBoost, 5000);
    setInterval(silenceBeeps, 20000);
    setInterval(killStuckArchiveBanner, 5000);
    setInterval(radarFromLive, 12000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 3000);
  setTimeout(boot, 8000);

  global.SNChromeFix = {
    build: BUILD,
    paintUser: paintUser,
    setRadarAct: setRadarAct,
    radarFromLive: radarFromLive,
    silence: silenceBeeps,
  };
})(typeof window !== 'undefined' ? window : globalThis);
