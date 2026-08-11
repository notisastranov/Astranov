/* Astranov chrome-fix — slim glowing handles, CLI always usable, user photo, radar act glow, fast globe
 * Build: 20260811131000-chrome-fix-v2
 */
(function (global) {
  'use strict';
  var BUILD = '20260811131000-chrome-fix-v2';

  function injectCss() {
    if (document.getElementById('sn-chrome-fix-css')) return;
    var css = document.createElement('style');
    css.id = 'sn-chrome-fix-css';
    css.textContent = [
      '#sn-topchrome-drag, #cli-drag {',
      '  height: 22px !important; min-height: 22px !important;',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  gap: 8px !important; cursor: pointer !important; touch-action: none !important;',
      '  flex-shrink: 0 !important; z-index: 5 !important; position: relative !important;',
      '}',
      '#sn-topchrome-drag {',
      '  border-top: 1px solid rgba(61,158,255,0.55) !important;',
      '  background: linear-gradient(180deg, rgba(12,40,88,0.7), rgba(4,14,36,0.92)) !important;',
      '  border-radius: 0 0 16px 16px !important;',
      '  box-shadow: 0 0 18px rgba(61,158,255,0.45), 0 4px 14px rgba(0,0,0,0.3) !important;',
      '}',
      '#cli-drag {',
      '  border-bottom: 1px solid rgba(61,158,255,0.55) !important;',
      '  background: linear-gradient(0deg, rgba(12,40,88,0.7), rgba(4,14,36,0.92)) !important;',
      '  border-radius: 16px 16px 0 0 !important;',
      '  box-shadow: 0 0 18px rgba(61,158,255,0.45), 0 -4px 14px rgba(0,0,0,0.3) !important;',
      '}',
      '#sn-topchrome-drag::before, #cli-drag::before {',
      '  content: "" !important; width: 48px !important; height: 5px !important;',
      '  border-radius: 999px !important; background: rgba(61,158,255,0.95) !important;',
      '  box-shadow: 0 0 14px rgba(61,158,255,0.85), 0 0 28px rgba(61,158,255,0.4) !important;',
      '}',
      '#sn-topchrome-drag::after { content: "gadgets · tap" !important; font: 700 9px/1 system-ui !important;',
      '  letter-spacing: 0.12em !important; text-transform: uppercase !important; color: rgba(180,220,255,0.95) !important; }',
      '#cli-drag::after { content: "cli · drag" !important; font: 700 9px/1 system-ui !important;',
      '  letter-spacing: 0.12em !important; text-transform: uppercase !important; color: rgba(180,220,255,0.95) !important; }',
      '#panel.mid #cli-drag::after, #panel.expanded #cli-drag::after { content: "pull down" !important; }',
      '#sn-topchrome-panel.expanded #sn-topchrome-drag::after, #sn-topchrome-panel.mid #sn-topchrome-drag::after { content: "pull up" !important; }',
      'html.theme-light #sn-topchrome-drag, html.theme-light #cli-drag {',
      '  background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(232,238,246,0.98)) !important;',
      '  box-shadow: 0 0 16px rgba(11,107,203,0.35), 0 4px 12px rgba(15,23,42,0.08) !important;',
      '  border-color: rgba(11,107,203,0.35) !important;',
      '}',
      'html.theme-light #sn-topchrome-drag::before, html.theme-light #cli-drag::before {',
      '  background: rgba(11,107,203,0.9) !important; box-shadow: 0 0 12px rgba(11,107,203,0.55) !important;',
      '}',
      'html.theme-light #sn-topchrome-drag::after, html.theme-light #cli-drag::after { color: rgba(15,23,42,0.6) !important; }',
      '#panel.collapsed { max-height: min(128px, 16vh) !important; min-height: 96px !important; }',
      '#cli-form { display: flex !important; align-items: center !important; gap: 8px !important;',
      '  padding: 8px 14px 12px !important; border-top: 1px solid rgba(50,140,255,0.42) !important;',
      '  flex: 0 0 auto !important; min-height: 44px !important; }',
      '#cli-in { min-height: 28px !important; font-size: 14px !important; }',
      '#panel.collapsed #cli-log:empty { display: none !important; }',
      '#field-radar.act-low {',
      '  box-shadow: inset 0 0 0 2px rgba(232,33,39,0.9), 0 0 18px rgba(232,33,39,0.55) !important;',
      '  background: radial-gradient(circle at 40% 35%, rgba(232,33,39,0.35), #060d1c) !important;',
      '}',
      '#field-radar.act-med {',
      '  box-shadow: inset 0 0 0 2px rgba(61,158,255,0.95), 0 0 20px rgba(61,158,255,0.55) !important;',
      '  background: radial-gradient(circle at 40% 35%, rgba(61,158,255,0.35), #060d1c) !important;',
      '}',
      '#field-radar.act-high {',
      '  box-shadow: inset 0 0 0 2px rgba(61,214,140,0.95), 0 0 22px rgba(61,214,140,0.6) !important;',
      '  background: radial-gradient(circle at 40% 35%, rgba(61,214,140,0.4), #060d1c) !important;',
      '}',
      '.sn-user-btn, #sn-user-btn {',
      '  width: 40px !important; height: 40px !important; min-width: 40px !important; min-height: 40px !important;',
      '  border-radius: 50% !important; border: 2px solid rgba(61,158,255,0.7) !important;',
      '  background: radial-gradient(circle at 35% 30%, rgba(61,158,255,0.35), #060d1c) !important;',
      '  color: #7ec8ff !important; font: 800 14px/1 system-ui !important;',
      '  display: inline-flex !important; align-items: center !important; justify-content: center !important;',
      '  overflow: hidden !important; padding: 0 !important; cursor: pointer !important;',
      '  box-shadow: 0 0 14px rgba(61,158,255,0.4) !important; flex-shrink: 0 !important;',
      '}',
      '.sn-user-btn.has-photo, #sn-user-btn.has-photo {',
      '  border-color: rgba(61,214,140,0.9) !important; box-shadow: 0 0 16px rgba(61,214,140,0.45) !important;',
      '}',
      '.sn-user-btn img, #sn-user-btn img { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 50% !important; display: block !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }

  function ensureUserBtn() {
    var existing = document.getElementById('sn-user-btn');
    if (existing) return existing;
    var money = document.querySelector('.stc-col-money') || document.getElementById('field-balance-hud');
    if (!money) return null;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sn-user-btn';
    btn.className = 'sn-user-btn';
    btn.title = 'Account · profile';
    btn.setAttribute('aria-label', 'User profile');
    btn.innerHTML = '<span aria-hidden="true">·</span>';
    if (money.parentNode) money.parentNode.insertBefore(btn, money);
    else money.appendChild(btn);
    btn.addEventListener('click', function () {
      try {
        if (global.SNAuth && SNAuth.openProfile) return SNAuth.openProfile();
        if (global.SNProfiles && SNProfiles.openMe) return SNProfiles.openMe();
        if (global.SNCli && SNCli.run) SNCli.run('user');
        else if (global.SNCli && SNCli.log) SNCli.log('Tap User · login or profile', 'dim');
      } catch (_) {}
    });
    return btn;
  }

  function paintUser() {
    var btn = ensureUserBtn();
    if (!btn) return;
    var me = null;
    try {
      if (global.SNAuth && SNAuth.user) me = SNAuth.user();
      else if (global.SNProfiles && SNProfiles.me) me = SNProfiles.me();
      else if (global.SNAuth && SNAuth.session) me = SNAuth.session();
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
      if (global.SNMeshOrders && SNMeshOrders.listLocal) n += (SNMeshOrders.listLocal() || []).length;
    } catch (_) {}
    try {
      if (global.SNOfferStack && SNOfferStack.peekCount) n += Number(SNOfferStack.peekCount()) || 0;
      else if (global.SNOfferStack && SNOfferStack.list) n += (SNOfferStack.list() || []).length;
    } catch (_) {}
    if (n >= 5) setRadarAct('high');
    else if (n >= 1) setRadarAct('med');
    else setRadarAct('low');
  }

  function ensureWebrtcButton() {
    var ribbon = document.getElementById('sn-task-ribbon');
    if (ribbon && !ribbon.querySelector('[data-act="call"], .sn-call-btn')) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sn-call-btn';
      b.setAttribute('data-act', 'call');
      b.title = 'WebRTC call';
      b.textContent = '📞';
      b.style.cssText = 'min-width:36px;height:32px;border-radius:999px;border:1px solid rgba(61,158,255,0.55);background:rgba(61,158,255,0.15);color:#7ec8ff;font-size:14px;';
      b.addEventListener('click', function () {
        try {
          if (global.SNWebRTC && SNWebRTC.start) return SNWebRTC.start();
          if (global.SNWebRTC && SNWebRTC.call) return SNWebRTC.call();
          if (global.SNCli && SNCli.run) SNCli.run('call');
          else if (global.SNCli && SNCli.log) SNCli.log('call · WebRTC · need peer or number', 'dim');
        } catch (e) {
          if (global.SNCli && SNCli.log) SNCli.log('call failed · ' + (e && e.message), 'err');
        }
      });
      ribbon.appendChild(b);
    }
  }

  var boost = { vx: 0, vy: 0, lastX: 0, lastY: 0, down: false, hooked: false };
  var TILT_MAX = 1.05;
  var DAMP = 0.918;
  var SCALE = 0.0024;

  function applyBoostFrame() {
    try {
      if (!global.SNGlobe || !SNGlobe.getSpin || !SNGlobe.getTilt) return;
      var phys = SNGlobe.getPhysics && SNGlobe.getPhysics();
      if (phys && phys.dragging) { boost.vx = 0; boost.vy = 0; return; }
      if (Math.abs(boost.vx) < 1e-5 && Math.abs(boost.vy) < 1e-5) return;
      var spin = SNGlobe.getSpin();
      var tilt = SNGlobe.getTilt();
      if (!spin || !tilt) return;
      spin.rotation.y += boost.vx;
      var nx = tilt.rotation.x + boost.vy;
      if (nx > TILT_MAX) nx = TILT_MAX;
      if (nx < -TILT_MAX) nx = -TILT_MAX;
      tilt.rotation.x = nx;
      boost.vx *= DAMP;
      boost.vy *= DAMP;
      if (Math.abs(boost.vx) < 1e-5) boost.vx = 0;
      if (Math.abs(boost.vy) < 1e-5) boost.vy = 0;
    } catch (_) {}
  }

  function hookGlobeBoost() {
    if (boost.hooked) return;
    var canvas = document.querySelector('#globe canvas') || document.querySelector('#globe');
    if (!canvas || !global.SNGlobe) return;
    boost.hooked = true;
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      boost.down = true;
      boost.lastX = e.clientX;
      boost.lastY = e.clientY;
      boost.vx = 0;
      boost.vy = 0;
    }, { passive: true });
    canvas.addEventListener('pointermove', function (e) {
      if (!boost.down) return;
      var dx = e.clientX - boost.lastX;
      var dy = e.clientY - boost.lastY;
      boost.lastX = e.clientX;
      boost.lastY = e.clientY;
      boost.vx = boost.vx * 0.55 + dx * SCALE * 0.45;
      boost.vy = boost.vy * 0.55 + dy * SCALE * 0.38;
    }, { passive: true });
    function endPtr() {
      if (!boost.down) return;
      boost.down = false;
      boost.vx *= 2.8;
      boost.vy *= 2.4;
      if (Math.abs(boost.vx) > 0.04) boost.vx = boost.vx > 0 ? 0.04 : -0.04;
      if (Math.abs(boost.vy) > 0.028) boost.vy = boost.vy > 0 ? 0.028 : -0.028;
    }
    canvas.addEventListener('pointerup', endPtr, { passive: true });
    canvas.addEventListener('pointercancel', endPtr, { passive: true });
    if (SNGlobe.onFrame) SNGlobe.onFrame(applyBoostFrame);
    else {
      function raf() { applyBoostFrame(); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    if (global.SNCli && SNCli.log && !global.__snSpeedLogged) {
      global.__snSpeedLogged = true;
      SNCli.log('Chrome-fix v2 · handles · CLI · radar · user · call · globe boost ON', 'dim');
    }
  }

  function boot() {
    injectCss();
    ensureUserBtn();
    paintUser();
    radarFromLive();
    ensureWebrtcButton();
    hookGlobeBoost();
    setTimeout(paintUser, 1200);
    setTimeout(paintUser, 3500);
    setTimeout(radarFromLive, 2000);
    setTimeout(radarFromLive, 8000);
    setTimeout(ensureWebrtcButton, 1500);
    setTimeout(hookGlobeBoost, 2000);
    setTimeout(hookGlobeBoost, 5000);
    setInterval(radarFromLive, 12000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 4000);
  setTimeout(boot, 9000);

  global.SNChromeFix = { build: BUILD, paintUser: paintUser, setRadarAct: setRadarAct, radarFromLive: radarFromLive };
})(typeof window !== 'undefined' ? window : globalThis);
