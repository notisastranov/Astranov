/* Astranov chrome-rib-face · Build 20260820183500
 * P0: signed-in profile face must stay a 28px circle on the ribbon.
 * Hide guest coach when signed in. No other UI redesign.
 */
(function (global) {
  'use strict';
  var BUILD = '20260820183500-rib-face';
  function inject() {
    var id = 'sn-chrome-rib-face-css';
    var old = document.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = id;
    css.textContent = [
      '#sn-task-ribbon .sn-rib-btn { overflow: hidden !important; }',
      '#sn-task-ribbon .sn-rib-icon {',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  width: 28px !important; height: 28px !important; max-width: 28px !important; max-height: 28px !important;',
      '  overflow: hidden !important; border-radius: 50% !important; flex: 0 0 28px !important;',
      '}',
      '#sn-task-ribbon .sn-rib-face, #sn-task-ribbon .sn-rib-icon img, #sn-rib-user img {',
      '  width: 28px !important; height: 28px !important; max-width: 28px !important; max-height: 28px !important;',
      '  border-radius: 50% !important; object-fit: cover !important; display: block !important;',
      '  margin: 0 !important; padding: 0 !important;',
      '}',
      '#sn-rib-user { overflow: hidden !important; }',
      'body.sn-in #cli-coach { display: none !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }',
      '#astranov-logo, #sn-big-logo, .astranov-logo-overlay {',
      '  display: none !important; visibility: hidden !important; pointer-events: none !important;',
      '}',
      '#sn-topchrome-panel, #panel { min-height: 0 !important; height: auto !important; }',
    ].join('\n');
    document.head.appendChild(css);
  }
  function boot() {
    inject();
    setTimeout(inject, 500);
    setTimeout(inject, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  global.SNChromeRibFace = { build: BUILD };
})(typeof window !== 'undefined' ? window : globalThis);
