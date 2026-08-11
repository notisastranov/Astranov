/* Astranov radar · Build 20260811214000
 * standby + medium = neon blue · none with tasks-off still blue on standby · high = green
 */
(function (global) {
  'use strict';
  var BUILD = '20260811214000-radar-blue-default';

  function injectCss() {
    var id = 'sn-radar-pulse-css';
    var old = document.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var st = document.createElement('style');
    st.id = id;
    st.textContent = [
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
    ].join('\n');
    document.head.appendChild(st);
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
    } catch (_) {}
    if (n >= 4) setRadarAct('high');
    else if (n >= 1) setRadarAct('med');
    else setRadarAct('standby');
  }

  function boot() {
    injectCss();
    radarFromLive();
    setTimeout(radarFromLive, 1500);
    setInterval(radarFromLive, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2500);

  global.SNRadarPulse = { build: BUILD, set: setRadarAct, refresh: radarFromLive };
})(typeof window !== 'undefined' ? window : globalThis);
