/* Astranov chrome-fix — pure transparent UI · no white · silence beeps
 * Build: 20260811170000-chrome-fix-v7-standby-clean
 * Restored after stub; radar colors in chrome-radar.js
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
      '#sn-topchrome, #sn-topchrome-panel, #stc-body, #stc-compact, #dock, #panel, #cli-log, #cli-form, #sn-task-ribbon, #stc-gadgets, .stc-gadget, .stc-g-body { background: transparent !important; background-color: transparent !important; background-image: none !important; }',
      '#sn-topchrome-panel, #panel { background: rgba(0, 2, 8, 0.18) !important; backdrop-filter: blur(12px) saturate(1.1) !important; -webkit-backdrop-filter: blur(12px) saturate(1.1) !important; border: 1px solid rgba(61, 158, 255, 0.14) !important; box-shadow: none !important; }',
      'html.theme-light #sn-topchrome-panel, html.theme-light #panel, html.theme-light #sn-topchrome-drag, html.theme-light #cli-drag, html.theme-light #field-balance-hud, html.theme-light #btn-home, html.theme-light #sn-task-launch, html.theme-light #field-radar { background: rgba(0, 8, 20, 0.22) !important; border-color: rgba(61, 158, 255, 0.22) !important; color: #c8e4ff !important; }',
      '#sn-topchrome-drag, #cli-drag { height: 18px !important; min-height: 18px !important; max-height: 20px !important; display: flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; border: none !important; box-shadow: none !important; color: transparent !important; font-size: 0 !important; }',
      '#sn-topchrome-drag::before, #cli-drag::before { content: "" !important; width: 40px !important; height: 3px !important; border-radius: 999px !important; background: rgba(61, 158, 255, 0.85) !important; box-shadow: 0 0 10px rgba(61, 158, 255, 0.7) !important; }',
      '#sn-topchrome-drag::after, #cli-drag::after { content: none !important; display: none !important; }',
      '#cli-form { border-top: 1px solid rgba(61, 158, 255, 0.12) !important; background: transparent !important; display: flex !important; align-items: center !important; gap: 8px !important; padding: 6px 12px 10px !important; min-height: 40px !important; }',
      '#cli-in { min-height: 28px !important; font-size: 14px !important; background: transparent !important; color: #b8d9ff !important; border: 1px solid rgba(61, 158, 255, 0.2) !important; border-radius: 12px !important; }',
      '#panel.collapsed { max-height: min(120px, 15vh) !important; min-height: 88px !important; }',
      '#sn-device-alert, #sn-device-alert.show { display: none !important; }',
      '#sn-arch-layer { display: none !important; visibility: hidden !important; pointer-events: none !important; opacity: 0 !important; z-index: -1 !important; }',
      '@keyframes sn-standby-pulse { 0%, 100% { box-shadow: inset 0 0 0 2px rgba(40,140,255,0.85), 0 0 12px rgba(40,140,255,0.45), 0 0 28px rgba(20,100,255,0.25); } 50% { box-shadow: inset 0 0 0 2.5px rgba(80,180,255,1), 0 0 22px rgba(60,160,255,0.75), 0 0 48px rgba(40,140,255,0.4); } }',
      '#sn-task-launch.mode-standby, #sn-task-launch.sn-launch.mode-standby { background: radial-gradient(circle at 35% 30%, rgba(40,120,255,0.35), rgba(0,8,24,0.9)) !important; border: none !important; animation: sn-standby-pulse 2.4s ease-in-out infinite !important; box-shadow: inset 0 0 0 2px rgba(40,140,255,0.9), 0 0 18px rgba(40,140,255,0.55) !important; }',
      '#sn-task-launch.mode-standby .sn-launch-power { color: #5eb0ff !important; filter: drop-shadow(0 0 10px rgba(60,160,255,0.95)) !important; }',
      '#sn-task-launch.mode-on { animation: none !important; box-shadow: inset 0 0 0 2.5px rgba(61,214,140,0.95), 0 0 22px rgba(61,214,140,0.5) !important; }',
      '#sn-task-launch.mode-off { animation: none !important; box-shadow: inset 0 0 0 2.5px rgba(232,33,39,0.95), 0 0 22px rgba(232,33,39,0.45) !important; }',
      '@media (min-width: 900px) { #panel { left: 50% !important; transform: translateX(-50%) !important; width: min(520px, 42vw) !important; right: auto !important; bottom: 12px !important; } #sn-task-ribbon { justify-content: center !important; } #sn-arch-layer { display: none !important; } }',
      '#sn-task-ribbon .sn-user-btn, #sn-task-ribbon #sn-user-btn { width: 32px !important; height: 32px !important; border-radius: 50% !important; border: 2px solid rgba(61,158,255,0.55) !important; background: rgba(0,8,24,0.35) !important; color: #7ec8ff !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; padding: 0 !important; }',
      '#stc-compact > #sn-user-btn, .stc-col-money > #sn-user-btn, .stc-col-device > #sn-user-btn, #sn-topchrome #sn-user-btn { display: none !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }
  function silenceBeeps() {
    try {
      global.__SN_MUTE_ALERTS = true;
      if (global._snAudioCtx) { try { global._snAudioCtx.close(); } catch (_) {} global._snAudioCtx = null; }
      if (global.SNField) { try { global.SNField.playAlertTone = function () {}; global.SNField.showDeviceAlert = function () {}; } catch (_) {} }
    } catch (_) {}
    try { if (global.speechSynthesis) global.speechSynthesis.cancel(); } catch (_) {}
  }
  function killStuckArchiveBanner() {
    try { var host = document.getElementById('sn-arch-layer'); if (host && host.parentNode) host.parentNode.removeChild(host); } catch (_) {}
  }
  function removeStrayTopUser() {
    try {
      var nodes = document.querySelectorAll('#stc-compact #sn-user-btn, .stc-col-money #sn-user-btn, .stc-col-device #sn-user-btn, #sn-topchrome #sn-user-btn');
      for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]); }
    } catch (_) {}
  }
  function ensureRibbonUser() {
    var ribbon = document.getElementById('sn-task-ribbon');
    if (!ribbon) return null;
    var existing = ribbon.querySelector('#sn-user-btn, .sn-user-btn[data-ribbon-user]');
    if (existing) return existing;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'sn-user-btn'; btn.className = 'sn-user-btn';
    btn.setAttribute('data-ribbon-user', '1'); btn.title = 'Account · profile';
    btn.innerHTML = '<span aria-hidden="true">·</span>';
    if (ribbon.firstChild) ribbon.insertBefore(btn, ribbon.firstChild); else ribbon.appendChild(btn);
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
    try { if (global.SNAuth && SNAuth.user) me = SNAuth.user(); else if (global.SNProfiles && SNProfiles.me) me = SNProfiles.me(); } catch (_) {}
    var photo = me && (me.photo || me.avatar || me.picture || me.image || (me.user_metadata && me.user_metadata.avatar_url));
    var name = (me && (me.name || me.displayName || me.email || me.handle)) || '';
    var init = (name.charAt(0) || '·').toUpperCase();
    if (photo) { btn.classList.add('has-photo'); btn.innerHTML = '<img src="' + String(photo).replace(/"/g, '') + '" alt="" referrerpolicy="no-referrer" />'; }
    else { btn.classList.remove('has-photo'); btn.innerHTML = '<span aria-hidden="true">' + init + '</span>'; }
  }
  function boot() {
    injectCss(); killStuckArchiveBanner(); silenceBeeps(); removeStrayTopUser(); ensureRibbonUser(); paintUser();
    setTimeout(killStuckArchiveBanner, 1000); setTimeout(paintUser, 1200); setTimeout(paintUser, 3500);
    setInterval(silenceBeeps, 20000); setInterval(killStuckArchiveBanner, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 3000); setTimeout(boot, 8000);
  global.SNChromeFix = { build: BUILD, paintUser: paintUser, silence: silenceBeeps };
})(typeof window !== 'undefined' ? window : globalThis);
