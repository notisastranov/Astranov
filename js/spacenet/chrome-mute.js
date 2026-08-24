/* Astranov mute · Build 20260824180000-call-arc
 * Kill beeps + load CALL great-circle overlay (chrome-call-arc-20260824180000.js).
 * Guest CALL = Google Sign-in wall (Privacy · Terms · Cancel).
 * Signed-in CALL = SNGlobe glowing great-circle ARC (me pin + them pin).
 * Does NOT restyle chrome. Does NOT paint wallet 3M. Leaves github.io untouched.
 */
(function (G) {
  'use strict';
  var B = '20260824180000-call-arc';
  if (G.__snMuteCallArc180000) return;
  G.__snMuteCallArc180000 = 1;
  G.__snMuteChromeAlive = 1;
  function loadScript(src, attr) {
    try {
      var name = src.split('/').pop().split('?')[0];
      if (document.querySelector('script[src*="' + name + '"]')) return;
      if (attr && document.querySelector('script[' + attr + ']')) return;
      var e = document.createElement('script');
      e.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(B);
      e.async = false;
      if (attr) e.setAttribute(attr, '1');
      (document.head || document.documentElement).appendChild(e);
    } catch (x) {}
  }
  function loadChain() {
    loadScript('/js/spacenet/chrome-mobile-alive-20260824174000.js', 'data-sn-mobile-alive');
    loadScript('/js/spacenet/chrome-place-earth-20260824133000.js', 'data-sn-place-earth');
    loadScript('/js/spacenet/chrome-nairobi-ladder-20260824133000.js', 'data-sn-nairobi');
    loadScript('/js/spacenet/chrome-research-stay-20260824133000.js', 'data-sn-research-stay');
    loadScript('/js/spacenet/chrome-guest-pizza-land-20260824140000.js', 'data-sn-guest-pizza-land');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt-20260824144000.js', 'data-sn-guest-laptop-hunt');
    loadScript('/js/spacenet/chrome-ai-listen-20260824140000.js', 'data-sn-ai-listen');
    loadScript('/js/spacenet/chrome-hold-pay-20260824140000.js', 'data-sn-hold-pay');
    loadScript('/js/spacenet/chrome-avc-ledger-20260824150000.js', 'data-sn-avc-ledger');
    loadScript('/js/spacenet/chrome-cli-answer-20260824133000.js', 'data-sn-cli-answer');
    loadScript('/js/spacenet/chrome-call-arc-20260824180000.js', 'data-sn-call-arc');
  }
  function boot() {
    loadChain();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 0);
  setTimeout(loadChain, 500);
  setTimeout(loadChain, 1500);
  G.SNChromeMute = { build: B, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
